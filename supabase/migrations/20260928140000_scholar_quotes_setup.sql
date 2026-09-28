-- Scholar quote library, step 1 (Mo's decisions, 2026-09-28).
-- 1. Corrects two entries in the approved scholars list.
-- 2. Lets Permanent Committee (al-Lajnah ad-Da'imah) fatwas link to alifta.gov.sa, when the fatwa is
--    stored under an approved scholar who signed it.
-- 3. Adds honest rights records for the first sources: short quotes only (600 characters), credited and
--    linked; written permission not yet given.

begin;

-- ---------- 1. corrections ----------
-- al-fuzan.com is the site of Shaykh Abdullah ibn Salih al-Fawzan, not Shaykh Salih al-Fawzan.
update public.scholars set website = 'https://alfawzan.af.org.sa' where id = 'al-fawzan';

-- "ash-Shuwayr" is Shaykh Muhammad ibn Sa'd al-Shuwai'ir (compiler of Majmu' Fatawa Ibn Baz).
-- shuwaier.com belongs to a different scholar, so no website is recorded for now; the gate then
-- refuses to publish material under his name until a verified official site is added.
update public.scholars
   set name_ar = 'محمد بن سعد الشويعر',
       name_en = 'Shaykh Muhammad ibn Sa''d al-Shuwai''ir',
       name_de = 'Scheich Muhammad ibn Sa''d al-Shuwai''ir',
       website = null
 where id = 'ash-shuwayr';

-- ---------- 2. publication gate: Permanent Committee fatwas ----------
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
    -- A Permanent Committee fatwa is stored under an approved scholar who signed it.
    if new.kind = 'fatwa' and host in ('alifta.gov.sa', 'www.alifta.gov.sa') then
      return new;
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

-- ---------- 3. rights records ----------
insert into editorial.source_rights
  (owner, edition, allowed_use, cache_limit, translation_rights, attribution, permission_evidence,
   removal_procedure, status, notes, max_quote_chars, search_index_allowed, ai_processing_allowed,
   translation_index_allowed)
select v.owner, v.edition,
  'Short quotations (at most 600 characters) of the Arabic original, shown unchanged with the scholar''s name, the printed source and a link to the original page. Used for search on our server and as input to the AI steps that select and explain evidence. No full copies are stored.',
  'Only the short excerpt is stored; the full text stays on the original site.',
  'No translations are stored or indexed. Any translation shown is AI-drafted, labelled, and shown next to the Arabic original.',
  v.attribution,
  'No written permission yet. Short, credited and linked quotations under the right to quote (German UrhG section 51). Decision by Mo, 2026-09-28; a permission letter is to be sent.',
  'On request: unpublish every source with this rights record and delete its search documents.',
  'short_quotes_only',
  'Pending written permission.',
  600, true, true, false
from (values
  ('binbaz.org.sa', 'Official website of Shaykh Abdul-Aziz ibn Baz', 'Official website of Shaykh Abdul-Aziz ibn Baz (binbaz.org.sa)'),
  ('binothaimeen.net', 'Official website of Shaykh Muhammad ibn Salih al-Uthaymeen', 'Official website of Shaykh Muhammad ibn Salih al-Uthaymeen (binothaimeen.net)'),
  ('al-albany.com', 'Portal of the legacy of Shaykh Muhammad Nasir al-Din al-Albani', 'Legacy portal of Shaykh Muhammad Nasir al-Din al-Albani (al-albany.com)'),
  ('alfawzan.af.org.sa', 'Official website of Shaykh Salih ibn Fawzan al-Fawzan', 'Official website of Shaykh Salih al-Fawzan (alfawzan.af.org.sa)'),
  ('alifta.gov.sa', 'Fatwas of the Permanent Committee (al-Lajnah ad-Da''imah), General Presidency of Scholarly Research and Ifta', 'Portal of the General Presidency of Scholarly Research and Ifta (alifta.gov.sa)')
) as v(owner, edition, attribution)
where not exists (select 1 from editorial.source_rights r where r.owner = v.owner);

commit;
