-- Magicthon schema
-- Run this in Supabase SQL editor once after project provisions.

-- 1. Storage bucket for uploaded photos + rendered memes.
--    Public bucket: anyone with the URL can view.
insert into storage.buckets (id, name, public)
values ('memes', 'memes', true)
on conflict (id) do nothing;

-- Public read policy on the bucket.
create policy if not exists "public read memes"
  on storage.objects for select
  using (bucket_id = 'memes');

-- Anonymous upload allowed (writes happen via service role from our server anyway,
-- but this lets the browser do direct uploads later if we want).
create policy if not exists "anyone uploads memes"
  on storage.objects for insert
  with check (bucket_id = 'memes');

-- 2. memes table — one row per shared meme.
create table if not exists public.memes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  photo_url     text not null,
  rendered_url  text,
  template_id   text not null,
  captions      jsonb not null default '{}'::jsonb,
  observations  text[],
  created_at    timestamptz not null default now()
);

create index if not exists memes_code_idx on public.memes (code);

alter table public.memes enable row level security;

-- Anyone can read meme rows by code (public share links).
create policy if not exists "public read memes rows"
  on public.memes for select
  using (true);

-- Anonymous inserts allowed (we'll move to server-side service role for prod hardening).
create policy if not exists "anyone creates memes"
  on public.memes for insert
  with check (true);

-- 3. reactions table — append-only log of emoji reactions.
create table if not exists public.reactions (
  id          bigserial primary key,
  meme_id     uuid not null references public.memes(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists reactions_meme_idx on public.reactions (meme_id);

alter table public.reactions enable row level security;

create policy if not exists "public read reactions"
  on public.reactions for select
  using (true);

create policy if not exists "anyone reacts"
  on public.reactions for insert
  with check (true);

-- 4. Enable realtime on reactions so the meme page can subscribe.
alter publication supabase_realtime add table public.reactions;
