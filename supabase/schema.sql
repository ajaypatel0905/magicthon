-- Magicthon schema
-- Idempotent. Safe to re-run.

-- 1. Storage bucket for uploaded photos + rendered memes.
insert into storage.buckets (id, name, public)
values ('memes', 'memes', true)
on conflict (id) do nothing;

-- Public read on the bucket.
drop policy if exists "public read memes" on storage.objects;
create policy "public read memes"
  on storage.objects for select
  using (bucket_id = 'memes');

drop policy if exists "anyone uploads memes" on storage.objects;
create policy "anyone uploads memes"
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

drop policy if exists "public read memes rows" on public.memes;
create policy "public read memes rows"
  on public.memes for select
  using (true);

drop policy if exists "anyone creates memes" on public.memes;
create policy "anyone creates memes"
  on public.memes for insert
  with check (true);

-- 3. reactions table — append-only log.
create table if not exists public.reactions (
  id          bigserial primary key,
  meme_id     uuid not null references public.memes(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists reactions_meme_idx on public.reactions (meme_id);

alter table public.reactions enable row level security;

drop policy if exists "public read reactions" on public.reactions;
create policy "public read reactions"
  on public.reactions for select
  using (true);

drop policy if exists "anyone reacts" on public.reactions;
create policy "anyone reacts"
  on public.reactions for insert
  with check (true);

-- 4. Realtime for reactions + memes (for the live wall).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'memes'
  ) then
    alter publication supabase_realtime add table public.memes;
  end if;
end $$;
