-- Source-state revalidation for the Ask index. Local migration only until approval.
-- Adds no source rows, content approvals, translation rights or embedding rights.
begin;

create or replace function public.read_approved_index_source_state(source_ids uuid[])
returns table(source_id uuid, rights_id uuid, expires_at date, parent_hash text, source_fingerprint text)
language sql stable security invoker
set search_path = ''
as $$
  select s.id, s.rights_id, r.expires_at,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(s.text_original,'UTF8')),'hex'),
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.kind,''),'UTF8'))::text || ':' || coalesce(s.kind,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.language,''),'UTF8'))::text || ':' || coalesce(s.language,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.reference,''),'UTF8'))::text || ':' || coalesce(s.reference,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.text_original,''),'UTF8'))::text || ':' || coalesce(s.text_original,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.url,''),'UTF8'))::text || ':' || coalesce(s.url,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.scholar_id,''),'UTF8'))::text || ':' || coalesce(s.scholar_id,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.grade,''),'UTF8'))::text || ':' || coalesce(s.grade,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.grader,''),'UTF8'))::text || ':' || coalesce(s.grader,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.collection,''),'UTF8'))::text || ':' || coalesce(s.collection,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.numbering,''),'UTF8'))::text || ':' || coalesce(s.numbering,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(s.title,''),'UTF8'))::text || ':' || coalesce(s.title,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(a.name_ar,''),'UTF8'))::text || ':' || coalesce(a.name_ar,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(a.name_en,''),'UTF8'))::text || ':' || coalesce(a.name_en,'')) ||
      (pg_catalog.octet_length(pg_catalog.convert_to(coalesce(a.name_de,''),'UTF8'))::text || ':' || coalesce(a.name_de,''))
    ,'UTF8')),'hex')
  from public.sources s
  join editorial.source_rights r on r.id=s.rights_id
  left join public.scholars a on a.id=s.scholar_id
  where pg_catalog.cardinality(source_ids) between 1 and 500 and s.id=any(source_ids)
    and s.kind in ('hadith','fatwa') and s.published and s.language='ar'
    and r.status in ('granted','short_quotes_only') and r.search_index_allowed and r.ai_processing_allowed
    and (r.expires_at is null or r.expires_at >= current_date)
    and pg_catalog.char_length(s.text_original) between 1 and 100000
    and (r.status <> 'short_quotes_only' or pg_catalog.char_length(s.text_original) <= r.max_quote_chars)
    and (s.kind <> 'hadith' or (s.grade in ('sahih','hasan') and s.grader is not null and s.collection is not null and s.numbering is not null))
    and (s.kind <> 'fatwa' or a.approved)
    and exists(select 1 from public.source_search_documents d where d.source_id=s.id and d.approved and d.lang=s.language)
$$;

revoke all on function public.read_approved_index_source_state(uuid[]) from public, anon, authenticated;
grant execute on function public.read_approved_index_source_state(uuid[]) to service_role;

commit;
