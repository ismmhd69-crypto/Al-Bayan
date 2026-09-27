-- Phase 2: content library (plan sections 3b, 3c, 4, 4b, 10, 11).
-- Public tables hold published content only and are read-only for visitors (RLS).
-- Nothing here stores visitors' questions or any personal data.
-- The source-rights register lives in a private schema the website API cannot reach.

create schema if not exists editorial;
revoke all on schema editorial from public, anon, authenticated;

-- ---------- private: source-rights register (plan 4b) ----------
create table editorial.source_rights (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  edition text,
  allowed_use text not null,
  cache_limit text,
  translation_rights text,
  attribution text not null,
  permission_evidence text,
  expires_at date,
  removal_procedure text,
  status text not null default 'pending' check (status in ('pending', 'granted', 'short_quotes_only', 'refused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- scholars ----------
create table public.scholars (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  name_de text not null,
  website text,
  approved boolean not null default true,
  sort int not null default 0
);

-- ---------- sources: every quotable item, with its original link ----------
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('quran', 'hadith', 'fatwa', 'book', 'tafsir', 'lesson')),
  scholar_id text references public.scholars (id),
  reference text not null,             -- e.g. "2:255", "Bukhari 1", fatwa number
  collection text,                     -- hadith collection or book title
  numbering text,                      -- numbering system used for the reference
  grade text check (grade in ('sahih', 'hasan')),
  grader text,
  language text not null default 'ar' check (language in ('ar', 'en', 'de')),
  text_original text not null,         -- stored exactly as the source gives it, never altered
  url text not null check (url ~ '^https://'),
  rights_id uuid references editorial.source_rights (id),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  -- hadith must carry a grade and grader; weak hadith cannot be stored at all
  constraint hadith_graded check (kind <> 'hadith' or (grade is not null and grader is not null))
);
create index sources_kind_idx on public.sources (kind);
create index sources_scholar_idx on public.sources (scholar_id);

-- Translations are separate records (plan 3b): AI ones are labelled, human-checked ones replace them.
create table public.source_translations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  lang text not null check (lang in ('ar', 'en', 'de')),
  text text not null,
  origin text not null check (origin in ('ai', 'human', 'published')), -- published = e.g. a named Quran translation
  translator text,
  reviewer text,
  reviewed_at timestamptz,
  version int not null default 1,
  published boolean not null default false,
  unique (source_id, lang, version)
);

-- ---------- topics (Hard questions) ----------
create table public.topics (
  id text primary key,
  category text not null check (category in ('belief', 'science', 'preservation', 'women', 'history')),
  sort int not null default 0,
  popular_rank int,                    -- position among popular questions on Home; null = not shown
  published boolean not null default true
);

create table public.topic_texts (
  topic_id text not null references public.topics (id) on delete cascade,
  lang text not null check (lang in ('ar', 'en', 'de')),
  title text not null,
  question text not null,
  short_answer text,                   -- empty until written from sources
  answer_status text not null default 'preparing' check (answer_status in ('preparing', 'automatic', 'scholar_reviewed')),
  reviewed_by text,
  reviewed_at timestamptz,
  version int not null default 1,
  primary key (topic_id, lang)
);

create table public.topic_related (
  topic_id text not null references public.topics (id) on delete cascade,
  related_id text not null references public.topics (id) on delete cascade,
  sort int not null default 0,
  primary key (topic_id, related_id)
);

create table public.topic_sources (
  topic_id text not null references public.topics (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  role text not null check (role in ('evidence', 'scholar', 'other_view')),
  sort int not null default 0,
  primary key (topic_id, source_id)
);

-- ---------- videos: approved YouTube IDs only, never downloaded (plan 4) ----------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  scholar_id text references public.scholars (id),
  title text not null,
  language text not null check (language in ('ar', 'en', 'de')),
  start_seconds int check (start_seconds >= 0),
  end_seconds int check (end_seconds is null or end_seconds > start_seconds),
  last_checked_at timestamptz,
  approved boolean not null default false
);

create table public.topic_videos (
  topic_id text not null references public.topics (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  sort int not null default 0,
  primary key (topic_id, video_id)
);

-- ---------- row-level security: visitors may only read published content ----------
alter table public.scholars enable row level security;
alter table public.sources enable row level security;
alter table public.source_translations enable row level security;
alter table public.topics enable row level security;
alter table public.topic_texts enable row level security;
alter table public.topic_related enable row level security;
alter table public.topic_sources enable row level security;
alter table public.videos enable row level security;
alter table public.topic_videos enable row level security;

create policy "read approved scholars" on public.scholars for select to anon, authenticated using (approved);
create policy "read published sources" on public.sources for select to anon, authenticated using (published);
create policy "read published translations" on public.source_translations for select to anon, authenticated
  using (published and exists (select 1 from public.sources s where s.id = source_id and s.published));
create policy "read published topics" on public.topics for select to anon, authenticated using (published);
create policy "read published topic texts" on public.topic_texts for select to anon, authenticated
  using (exists (select 1 from public.topics t where t.id = topic_id and t.published));
create policy "read related topics" on public.topic_related for select to anon, authenticated
  using (exists (select 1 from public.topics t where t.id = topic_id and t.published)
     and exists (select 1 from public.topics t where t.id = related_id and t.published));
create policy "read topic sources" on public.topic_sources for select to anon, authenticated
  using (exists (select 1 from public.sources s where s.id = source_id and s.published));
create policy "read approved videos" on public.videos for select to anon, authenticated using (approved);
create policy "read topic videos" on public.topic_videos for select to anon, authenticated
  using (exists (select 1 from public.videos v where v.id = video_id and v.approved));

-- Visitors never write. Only the server (secret key) or a migration can change content.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
