-- Tighten local-search rights before any source documents are added.

begin;

alter table editorial.source_rights
  add column translation_index_allowed boolean not null default false;

create or replace function public.check_search_document_approval() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_ok boolean;
  source_language text;
  rights_status text;
  quote_limit int;
  translation_ok boolean;
begin
  if not new.approved then
    return new;
  end if;

  select
    s.published and r.search_index_allowed and r.ai_processing_allowed,
    s.language,
    r.status,
    r.max_quote_chars,
    r.translation_index_allowed
  into source_ok, source_language, rights_status, quote_limit, translation_ok
  from public.sources s
  join editorial.source_rights r on r.id = s.rights_id
  where s.id = new.source_id;

  if source_ok is not true then
    raise exception 'source % is not approved for local search and AI processing', new.source_id;
  end if;
  if new.lang <> source_language and translation_ok is not true then
    raise exception 'source % translations are not approved for local search', new.source_id;
  end if;
  if rights_status = 'short_quotes_only' and char_length(new.search_text) > quote_limit then
    raise exception 'search document for source % exceeds its % character quote limit', new.source_id, quote_limit;
  end if;

  return new;
end;
$$;

revoke all on function public.check_search_document_approval() from public, anon, authenticated;

commit;
