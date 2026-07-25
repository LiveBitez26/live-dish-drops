-- LiveBite core schema
-- Run via: supabase db push  (or paste into Supabase SQL Editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'customer' check (role in ('customer', 'creator')),
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- creators: extended profile for chefs / food trucks / pop-ups
-- ---------------------------------------------------------------------------
create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  handle text not null unique,
  bio text,
  follower_count integer not null default 0,
  rating numeric(2,1) not null default 5.0,
  location text,
  is_live boolean not null default false,
  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists creators_profile_id_idx on public.creators (profile_id);
create index if not exists creators_is_live_idx on public.creators (is_live);

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  total_inventory integer not null default 0 check (total_inventory >= 0),
  remaining_inventory integer not null default 0 check (remaining_inventory >= 0),
  is_available boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_creator_id_idx on public.menu_items (creator_id);

-- ---------------------------------------------------------------------------
-- live_streams
-- ---------------------------------------------------------------------------
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  stream_key text not null default encode(gen_random_bytes(16), 'hex'),
  playback_url text,
  title text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists live_streams_creator_id_idx on public.live_streams (creator_id);
create index if not exists live_streams_status_idx on public.live_streams (status);

-- ---------------------------------------------------------------------------
-- posts: daily feed content
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  content_type text not null check (content_type in ('photo', 'video', 'upcoming_drop')),
  media_url text,
  caption text,
  drop_time timestamptz,
  price numeric(10,2),
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_creator_id_idx on public.posts (creator_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ---------------------------------------------------------------------------
-- post_comments (needed for "Add comment posting/fetching logic")
-- ---------------------------------------------------------------------------
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_id_idx on public.post_comments (post_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  creator_id uuid not null references public.creators (id) on delete restrict,
  items jsonb not null, -- [{ menu_item_id, name, qty, unit_price }]
  total_amount numeric(10,2) not null check (total_amount >= 0),
  platform_fee_amount numeric(10,2) not null default 0,
  creator_payout_amount numeric(10,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'preparing', 'out_for_delivery', 'delivered')),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  doordash_delivery_id text,
  delivery_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_creator_id_idx on public.orders (creator_id);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Live inventory decrement: called by the checkout server function inside
-- the same transaction as order insert, via RPC (safer than a trigger since
-- we need to fail the checkout if inventory ran out concurrently).
-- ---------------------------------------------------------------------------
create or replace function public.decrement_inventory(
  p_menu_item_id uuid,
  p_qty integer
)
returns public.menu_items
language plpgsql
security definer set search_path = public
as $$
declare
  updated_row public.menu_items;
begin
  update public.menu_items
  set remaining_inventory = remaining_inventory - p_qty,
      is_available = (remaining_inventory - p_qty) > 0
  where id = p_menu_item_id
    and remaining_inventory >= p_qty
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'INSUFFICIENT_INVENTORY';
  end if;

  return updated_row;
end;
$$;

-- enable realtime on the tables the UI subscribes to
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.live_streams;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_comments;
