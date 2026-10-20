-- Current permission metadata only. Prepared locally, no rights or approval changes.
begin;
create or replace function public.read_current_scholar_site_rights(site_hosts text[])
returns table(owner text, status text, max_quote_chars integer)
language sql stable security invoker set search_path = '' as $$
  select r.owner,r.status,r.max_quote_chars from editorial.source_rights r
  where pg_catalog.cardinality(site_hosts) between 1 and 10 and r.owner=any(site_hosts)
    and r.owner in ('binbaz.org.sa','binothaimeen.net','alifta.gov.sa','al-albany.com','alfawzan.af.org.sa','sh-albarrak.com')
    and r.status in ('granted','short_quotes_only') and r.search_index_allowed and r.ai_processing_allowed
    and (r.expires_at is null or r.expires_at>=current_date)
    and (select count(*) from editorial.source_rights other where other.owner=r.owner)=1
$$;
revoke all on function public.read_current_scholar_site_rights(text[]) from public,anon,authenticated;
grant execute on function public.read_current_scholar_site_rights(text[]) to service_role;
commit;
