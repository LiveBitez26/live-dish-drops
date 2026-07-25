-- Creator profile system: follows, verified reviews, drop calendar,
-- profile fields, and auto-maintained follower_count/rating.

-- ---------------------------------------------------------------------------
-- profile fields
-- ---------------------------------------------------------------------------
alter table public.creators
  add column if not exists banner_url text,
  add column if not exists delivery_radius_miles numeric(4,1) not null default 5.0;

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id)
);

alter table public.follows enable row level security;

create policy "follows are publicly readable"
  on public.follows for select
  using (true);

create policy "users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "users can unfollow themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);

create or replace function public.sync_follower_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.creators set follower_count = follower_count + 1 where id = new.creator_id;
  elsif tg_op = 'DELETE' then
    update public.creators set follower_count = greatest(0, follower_count - 1) where id = old.creator_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_sync_count on public.follows;
create trigger follows_sync_count
  after insert or delete on public.follows
  for each row execute function public.sync_follower_count();

-- ---------------------------------------------------------------------------
-- reviews — one per order, only after delivery (enforced at app layer via
-- the submitReview server function checking order.status = 'delivered';
-- the unique order_id here stops duplicate reviews on the same order)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_creator_id_idx on public.reviews (creator_id, created_at desc);

alter table public.reviews enable row level security;

create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "customers can review their own delivered orders"
  on public.reviews for insert
  with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.orders o
      where o.id = reviews.order_id
        and o.customer_id = auth.uid()
        and o.status = 'delivered'
    )
  );

create or replace function public.sync_creator_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.creators
  set rating = (
    select round(avg(rating)::numeric, 1) from public.reviews where creator_id = coalesce(new.creator_id, old.creator_id)
  )
  where id = coalesce(new.creator_id, old.creator_id);
  return null;
end;
$$;

drop trigger if exists reviews_sync_rating on public.reviews;
create trigger reviews_sync_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_creator_rating();

-- ---------------------------------------------------------------------------
-- scheduled_drops — the "drop calendar": announced future streams
-- ---------------------------------------------------------------------------
create table if not exists public.scheduled_drops (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_drops_creator_id_idx on public.scheduled_drops (creator_id, scheduled_at);

alter table public.scheduled_drops enable row level security;

create policy "scheduled drops are publicly readable"
  on public.scheduled_drops for select
  using (true);

create policy "creators manage only their own scheduled drops"
  on public.scheduled_drops for all
  using (
    exists (select 1 from public.creators c where c.id = scheduled_drops.creator_id and c.profile_id = auth.uid())
  )
  with check (
    exists (select 1 from public.creators c where c.id = scheduled_drops.creator_id and c.profile_id = auth.uid())
  );

alter publication supabase_realtime add table public.follows;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.scheduled_drops;
