-- Customer profile system: saved delivery addresses + notification prefs.

create table if not exists public.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  zip text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists delivery_addresses_profile_id_idx on public.delivery_addresses (profile_id);

alter table public.delivery_addresses enable row level security;

create policy "users manage only their own addresses"
  on public.delivery_addresses for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Only one default address per user.
create unique index if not exists one_default_address_per_user
  on public.delivery_addresses (profile_id)
  where (is_default);

alter table public.profiles
  add column if not exists notify_new_drops boolean not null default true,
  add column if not exists notify_order_updates boolean not null default true;
