-- Row Level Security for LiveBite

alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.menu_items enable row level security;
alter table public.live_streams enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.orders enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- creators
-- ---------------------------------------------------------------------------
create policy "creators are publicly readable"
  on public.creators for select
  using (true);

create policy "a user can create their own creator row"
  on public.creators for insert
  with check (auth.uid() = profile_id);

create policy "creators can update only their own row"
  on public.creators for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create policy "menu items are publicly readable"
  on public.menu_items for select
  using (true);

create policy "creators manage only their own menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.creators c
      where c.id = menu_items.creator_id and c.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creators c
      where c.id = menu_items.creator_id and c.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- live_streams
-- ---------------------------------------------------------------------------
create policy "live streams are publicly readable"
  on public.live_streams for select
  using (true);

create policy "creators manage only their own streams"
  on public.live_streams for all
  using (
    exists (
      select 1 from public.creators c
      where c.id = live_streams.creator_id and c.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creators c
      where c.id = live_streams.creator_id and c.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create policy "posts are publicly readable"
  on public.posts for select
  using (true);

create policy "creators manage only their own posts"
  on public.posts for all
  using (
    exists (
      select 1 from public.creators c
      where c.id = posts.creator_id and c.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creators c
      where c.id = posts.creator_id and c.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- post_comments
-- ---------------------------------------------------------------------------
create policy "comments are publicly readable"
  on public.post_comments for select
  using (true);

create policy "logged-in users can comment as themselves"
  on public.post_comments for insert
  with check (auth.uid() = author_id);

create policy "users can delete their own comments"
  on public.post_comments for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- orders
-- Customers see their own orders. Creators see orders placed against them
-- and can update ONLY the status field (enforced by the app layer /
-- server function, since column-level RLS needs a security-definer RPC).
-- ---------------------------------------------------------------------------
create policy "customers can view their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "creators can view orders placed against them"
  on public.orders for select
  using (
    exists (
      select 1 from public.creators c
      where c.id = orders.creator_id and c.profile_id = auth.uid()
    )
  );

create policy "customers can create their own orders"
  on public.orders for insert
  with check (auth.uid() = customer_id);

create policy "creators can update status on their incoming orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.creators c
      where c.id = orders.creator_id and c.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creators c
      where c.id = orders.creator_id and c.profile_id = auth.uid()
    )
  );
