-- Live chat during a stream. Scoped per live_streams row so chat resets
-- naturally each time a creator goes live (not a persistent DM system).
create table if not exists public.stream_messages (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_handle text not null,
  is_creator boolean not null default false,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists stream_messages_stream_id_idx on public.stream_messages (stream_id, created_at);

alter table public.stream_messages enable row level security;

create policy "stream chat is publicly readable"
  on public.stream_messages for select
  using (true);

create policy "logged-in users can chat as themselves"
  on public.stream_messages for insert
  with check (auth.uid() = sender_id);

alter publication supabase_realtime add table public.stream_messages;
