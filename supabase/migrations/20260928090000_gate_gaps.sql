-- Closes three gaps found in the second Codex review (finding 3).

begin;

-- 1. Visitors may read topic titles and questions, but not the future short_answer column
--    (answers must go through the cited-answer display, never as raw text).
revoke select on public.topic_texts from anon, authenticated;
grant select (topic_id, lang, title, question, answer_status, reviewed_by, reviewed_at, version)
  on public.topic_texts to anon, authenticated;

-- 2. "Short quotes only" permission needs a number: the longest quote allowed, in characters.
alter table editorial.source_rights add column max_quote_chars int check (max_quote_chars > 0);
alter table editorial.source_rights
  add constraint short_quotes_need_limit check (status <> 'short_quotes_only' or max_quote_chars is not null);

-- 3. Scholar material needs the scholar's website on record; unknown never passes.
create or replace function public.check_source_publication() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rights_status text;
  quote_limit int;
  host text := lower(substring(new.url from '^https://([^/:?#]+)'));
  scholar_site text;
  scholar_ok boolean;
begin
  if not new.published then
    return new;
  end if;

  select status, max_quote_chars into rights_status, quote_limit
    from editorial.source_rights where id = new.rights_id;
  if rights_status is null or rights_status not in ('granted', 'short_quotes_only') then
    raise exception 'source % cannot be published: no granted rights record', new.id;
  end if;
  if rights_status = 'short_quotes_only' and char_length(new.text_original) > quote_limit then
    raise exception 'source % is longer than the % characters its permission allows', new.id, quote_limit;
  end if;

  if host is null then
    raise exception 'source % has no valid https link', new.id;
  end if;

  if new.kind = 'quran' then
    if host not in ('quran.com', 'www.quran.com') then
      raise exception 'Quran sources must link to quran.com';
    end if;
  elsif new.kind = 'hadith' then
    if host not in ('sunnah.com', 'www.sunnah.com') then
      raise exception 'hadith sources must link to sunnah.com';
    end if;
  elsif new.kind in ('fatwa', 'book', 'tafsir', 'lesson') then
    select lower(substring(website from '^https://([^/:?#]+)')), approved
      into scholar_site, scholar_ok
      from public.scholars where id = new.scholar_id;
    if scholar_ok is not true then
      raise exception 'scholar material needs an approved scholar';
    end if;
    if scholar_site is null then
      raise exception 'scholar % has no website on record', new.scholar_id;
    end if;
    if not (host = scholar_site or host = 'www.' || scholar_site or host like '%.' || scholar_site) then
      raise exception 'scholar material must link to the scholar''s own website (%)', scholar_site;
    end if;
  else
    raise exception 'unknown source kind %', new.kind;
  end if;

  return new;
end;
$$;

revoke all on function public.check_source_publication() from public, anon, authenticated;

commit;
