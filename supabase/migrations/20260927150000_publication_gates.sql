-- Publication gates and access rules (Codex code review, findings 9 and 10).
-- Nothing becomes public or "scholar reviewed" without proof, source text is not a public feed,
-- and every change to content is kept in a history that cannot be edited.

begin;

-- ---------- safe defaults: new rows are private until deliberately approved ----------
alter table public.scholars alter column approved set default false;
alter table public.topics alter column published set default false;

-- ---------- "scholar reviewed" needs a named reviewer and a date ----------
alter table public.topic_texts
  add constraint scholar_review_needs_proof
  check (answer_status <> 'scholar_reviewed' or (reviewed_by is not null and reviewed_at is not null));

-- ---------- sources: publication requires rights, the right domain and an approved scholar ----------
create or replace function public.check_source_publication() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rights_status text;
  host text := lower(substring(new.url from '^https://([^/:?#]+)'));
  scholar_site text;
  scholar_ok boolean;
begin
  if not new.published then
    return new;
  end if;

  select status into rights_status from editorial.source_rights where id = new.rights_id;
  if rights_status is null or rights_status not in ('granted', 'short_quotes_only') then
    raise exception 'source % cannot be published: no granted rights record', new.id;
  end if;

  if new.kind = 'quran' and host not in ('quran.com', 'www.quran.com') then
    raise exception 'Quran sources must link to quran.com';
  elsif new.kind = 'hadith' and host not in ('sunnah.com', 'www.sunnah.com') then
    raise exception 'hadith sources must link to sunnah.com';
  elsif new.kind in ('fatwa', 'book', 'tafsir', 'lesson') then
    select lower(substring(website from '^https://([^/:?#]+)')), approved
      into scholar_site, scholar_ok
      from public.scholars where id = new.scholar_id;
    if scholar_ok is not true then
      raise exception 'scholar material needs an approved scholar';
    end if;
    if host is null or not (host = scholar_site or host = 'www.' || scholar_site or host like '%.' || scholar_site) then
      raise exception 'scholar material must link to the scholar''s own website (%)', scholar_site;
    end if;
  end if;

  return new;
end;
$$;

create trigger sources_publication_gate
  before insert or update on public.sources
  for each row execute function public.check_source_publication();

-- Human translations need translator, reviewer and date before publication.
alter table public.source_translations
  add constraint human_translation_needs_review
  check (not published or origin <> 'human' or (translator is not null and reviewer is not null and reviewed_at is not null));

-- ---------- history that cannot be edited ----------
create table editorial.content_history (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null,
  old_row jsonb not null,
  changed_by text not null default current_user,
  changed_at timestamptz not null default now()
);

create or replace function editorial.keep_history() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into editorial.content_history (table_name, action, old_row)
  values (tg_table_schema || '.' || tg_table_name, tg_op, to_jsonb(old));
  return coalesce(new, old);
end;
$$;

create trigger topics_history after update or delete on public.topics
  for each row execute function editorial.keep_history();
create trigger topic_texts_history after update or delete on public.topic_texts
  for each row execute function editorial.keep_history();
create trigger sources_history after update or delete on public.sources
  for each row execute function editorial.keep_history();
create trigger source_translations_history after update or delete on public.source_translations
  for each row execute function editorial.keep_history();

-- The history can be added to by the trigger, never changed or deleted.
create or replace function editorial.history_is_append_only() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'content history cannot be changed or deleted';
end;
$$;

create trigger content_history_append_only
  before update or delete on editorial.content_history
  for each row execute function editorial.history_is_append_only();
revoke truncate on editorial.content_history from public;

-- ---------- explicit access: visitors read only what pages need ----------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.scholars, public.topics, public.topic_texts, public.topic_related,
  public.videos, public.topic_videos to anon, authenticated;
-- sources, source_translations and topic_sources are NOT readable by visitors: licensed text
-- must not become a bulk download. The server reads them with the secret key and shows only
-- what a page needs.

-- Future tables start closed.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- The gate functions are not callable by visitors.
revoke all on function public.check_source_publication() from public, anon, authenticated;

-- Remove read policies for tables that are no longer public.
drop policy "read published sources" on public.sources;
drop policy "read published translations" on public.source_translations;
drop policy "read topic sources" on public.topic_sources;

-- A video linked to a topic is only visible if the topic is published too.
drop policy "read topic videos" on public.topic_videos;
create policy "read topic videos" on public.topic_videos for select to anon, authenticated
  using (exists (select 1 from public.videos v where v.id = video_id and v.approved)
     and exists (select 1 from public.topics t where t.id = topic_id and t.published));

commit;
