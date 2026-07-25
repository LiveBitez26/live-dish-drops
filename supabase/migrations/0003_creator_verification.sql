-- Kitchen/food-safety verification fields for creators.
-- Going live is gated on verification_status = 'approved' at the app layer
-- (see studio.tsx) — this migration only adds the data model, not an admin
-- review UI, which is a separate follow-up before public launch.

alter table public.creators
  add column if not exists kitchen_type text
    check (kitchen_type in ('licensed_commercial', 'food_truck', 'ghost_kitchen', 'home_kitchen')),
  add column if not exists business_name text,
  add column if not exists permit_number text,
  add column if not exists permit_expires_on date,
  add column if not exists verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  add column if not exists verification_notes text;

comment on column public.creators.verification_status is
  'Gates is_live in the app. Set to approved manually (via SQL or a future admin UI) after a human reviews kitchen_type + permit_number.';
