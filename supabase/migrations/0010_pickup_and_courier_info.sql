-- Pickup timing (real, creator-set today) + courier tracking scaffold
-- (populated later once DoorDash dispatch is actually connected).

alter table public.orders
  add column if not exists estimated_ready_at timestamptz,
  add column if not exists courier_name text,
  add column if not exists courier_phone text,
  add column if not exists courier_tracking_url text;
