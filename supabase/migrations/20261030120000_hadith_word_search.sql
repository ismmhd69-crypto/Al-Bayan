-- PREPARED, NOT APPLIED. Mo applies it (or says yes and Claude runs supabase/apply-migrations.ps1).
--
-- Word search in the stored Sahih al-Bukhari / Sahih Muslim hadith, for the public Hadith page
-- (Mo, 2026-10-30). Arabic uses the existing normalised search documents; English and German search
-- the published translations. Only hadith whose rights record allows local search are found, and the
-- function returns only a short highlighted excerpt plus the sunnah.com address, never the full text.
-- The function is callable with the server's secret role only, like the other search functions, so
-- visitors cannot read the tables or bulk-download text.

begin;

create index if not exists source_translations_hadith_en_fts
  on public.source_translations using gin (to_tsvector('english', text))
  where lang = 'en' and published;

create index if not exists source_translations_hadith_de_fts
  on public.source_translations using gin (to_tsvector('german', text))
  where lang = 'de' and published;

create or replace function public.search_hadith_words(
  query_text text,
  search_lang text,
  page_size int default 10,
  page_offset int default 0
)
returns table (
  hit_source_id uuid,
  hit_url text,
  hit_reference text,
  hit_excerpt text
)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
declare
  q text := left(btrim(coalesce(query_text, '')), 200);
  n int := least(greatest(coalesce(page_size, 10), 1), 20);
  o int := least(greatest(coalesce(page_offset, 0), 0), 400);
begin
  if q = '' then
    return;
  end if;

  if search_lang = 'ar' then
    return query
    select p.sid, p.surl, p.sref,
           ts_headline('simple', p.stext, websearch_to_tsquery('simple', q),
                       'StartSel=⟦, StopSel=⟧, MaxWords=35, MinWords=15, MaxFragments=1')
    from (
      select s.id as sid, s.url as surl, s.reference as sref, d.search_text as stext,
             ts_rank_cd(d.search_vector, websearch_to_tsquery('simple', q)) as rnk
      from public.source_search_documents d
      join public.sources s on s.id = d.source_id
      join editorial.source_rights r on r.id = s.rights_id
      where s.kind = 'hadith' and s.published
        and d.approved and d.lang = 'ar'
        and r.status in ('granted', 'short_quotes_only') and r.search_index_allowed
        and d.search_vector @@ websearch_to_tsquery('simple', q)
      order by rnk desc, s.id
      limit n offset o
    ) p
    order by p.rnk desc, p.sid;

  elsif search_lang = 'en' then
    return query
    select p.sid, p.surl, p.sref,
           ts_headline('english', p.stext, websearch_to_tsquery('english', q),
                       'StartSel=⟦, StopSel=⟧, MaxWords=35, MinWords=15, MaxFragments=1')
    from (
      select h.sid, h.surl, h.sref, h.stext, h.rnk
      from (
        select distinct on (s.id) s.id as sid, s.url as surl, s.reference as sref, t.text as stext,
               ts_rank_cd(to_tsvector('english', t.text), websearch_to_tsquery('english', q)) as rnk
        from public.source_translations t
        join public.sources s on s.id = t.source_id
        join editorial.source_rights r on r.id = s.rights_id
        where t.lang = 'en' and t.published
          and s.kind = 'hadith' and s.published
          and r.status in ('granted', 'short_quotes_only') and r.search_index_allowed
          and to_tsvector('english', t.text) @@ websearch_to_tsquery('english', q)
        order by s.id, t.version desc
      ) h
      order by h.rnk desc, h.sid
      limit n offset o
    ) p
    order by p.rnk desc, p.sid;

  elsif search_lang = 'de' then
    return query
    select p.sid, p.surl, p.sref,
           ts_headline('german', p.stext, websearch_to_tsquery('german', q),
                       'StartSel=⟦, StopSel=⟧, MaxWords=35, MinWords=15, MaxFragments=1')
    from (
      select h.sid, h.surl, h.sref, h.stext, h.rnk
      from (
        select distinct on (s.id) s.id as sid, s.url as surl, s.reference as sref, t.text as stext,
               ts_rank_cd(to_tsvector('german', t.text), websearch_to_tsquery('german', q)) as rnk
        from public.source_translations t
        join public.sources s on s.id = t.source_id
        join editorial.source_rights r on r.id = s.rights_id
        where t.lang = 'de' and t.published
          and s.kind = 'hadith' and s.published
          and r.status in ('granted', 'short_quotes_only') and r.search_index_allowed
          and to_tsvector('german', t.text) @@ websearch_to_tsquery('german', q)
        order by s.id, t.version desc
      ) h
      order by h.rnk desc, h.sid
      limit n offset o
    ) p
    order by p.rnk desc, p.sid;
  end if;
end;
$$;

revoke all on function public.search_hadith_words(text, text, int, int) from public, anon, authenticated;
grant execute on function public.search_hadith_words(text, text, int, int) to service_role;

commit;
