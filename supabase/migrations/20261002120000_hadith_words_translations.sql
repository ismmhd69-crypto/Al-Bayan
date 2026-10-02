-- PREPARED, NOT APPLIED. Mo applies it with supabase/apply-migrations.ps1 (see docs/hadith-words-translation-job.md).
--
-- Short AI translations of ONLY the quoted words of a stored hadith (what the Prophet ﷺ said, or the
-- quoted text under the neutral label), shown inside the highlighted box of the hadith card.
-- The full translations stay in public.source_translations and are not touched.
-- Same rules as source_translations: AI origin, unpublished by default, shown only with
-- SHOW_AI_TRANSLATIONS=true until published, never readable by visitors (the server reads it with the
-- secret key), every change kept in the append-only history.

begin;

create table public.hadith_words_translations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  lang text not null check (lang in ('en', 'de')),
  text text not null check (length(btrim(text)) > 0 and length(text) <= 4000),
  origin text not null default 'ai' check (origin = 'ai'),
  translator text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (source_id, lang)
);

-- Only hadith rows can have a words translation.
create or replace function public.check_hadith_words_source() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.sources s where s.id = new.source_id and s.kind = 'hadith') then
    raise exception 'hadith_words_translations: source % is not a hadith', new.source_id;
  end if;
  return new;
end;
$$;

create trigger hadith_words_source_is_hadith before insert or update on public.hadith_words_translations
  for each row execute function public.check_hadith_words_source();

create trigger hadith_words_translations_history after update or delete on public.hadith_words_translations
  for each row execute function editorial.keep_history();

-- Closed to visitors, like sources and source_translations: licensed text must not become a bulk download.
alter table public.hadith_words_translations enable row level security;
revoke all on public.hadith_words_translations from anon, authenticated;
revoke all on function public.check_hadith_words_source() from public, anon, authenticated;

commit;
