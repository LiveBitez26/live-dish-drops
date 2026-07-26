-- Payment methods scaffold. We NEVER store raw card numbers/CVV — only
-- Stripe's payment_method reference plus display info (brand, last4),
-- exactly like every real platform does. Actually usable once real Stripe
-- keys are configured (see src/lib/api/payments.ts).

alter table public.profiles
  add column if not exists stripe_customer_id text;

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  stripe_payment_method_id text not null unique,
  brand text not null,
  last4 text not null,
  exp_month smallint not null,
  exp_year smallint not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payment_methods_profile_id_idx on public.payment_methods (profile_id);

alter table public.payment_methods enable row level security;

create policy "users manage only their own payment methods"
  on public.payment_methods for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create unique index if not exists one_default_payment_method_per_user
  on public.payment_methods (profile_id)
  where (is_default);
