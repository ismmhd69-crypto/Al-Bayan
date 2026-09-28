-- Private retrieval metadata and reusable answer packages.
-- This migration stores no visitor questions and does not add Quran Foundation content.
-- Only material with separately approved storage/search rights may be copied into search documents.

begin;

-- Rights are explicit. A general publication permission does not silently allow local indexing
-- or sending that source to an AI provider.
alter table editorial.source_rights
  add column search_index_allowed boolean not null default false,
  add column ai_processing_allowed boolean not null default false;

-- ---------- server-only search documents ----------
-- The source text remains authoritative in sources/source_translations. This table is a deliberately
-- denormalised search document for sources whose rights record permits local indexing.
create table public.source_search_documents (
  id bigint generated always as identity primary key,
  source_id uuid not null references public.sources (id) on delete cascade,
  lang text not null check (lang in ('ar', 'en', 'de')),
  search_text text not null check (char_length(search_text) > 0),
  question_types text[] not null default '{}',
  facets text[] not null default '{}',
  concepts text[] not null default '{}',
  approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  search_vector tsvector generated always as (to_tsvector('simple', search_text)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, lang),
  constraint search_document_approval_has_reviewer
    check (not approved or (approved_by is not null and approved_at is not null)),
  constraint search_document_question_types_valid check (
    question_types <@ array['identity','definition','ruling','evidence','reason','practice','history','comparison','objection','reference','general']::text[]
  ),
  constraint search_document_facets_valid check (
    facets <@ array['identity','definition','attributes','ruling','evidence','reason','steps','conditions','exceptions','history','comparison','response','meaning','general']::text[]
  )
);

create index source_search_documents_fts_idx on public.source_search_documents using gin (search_vector);
create index source_search_documents_question_types_idx on public.source_search_documents using gin (question_types) where approved;
create index source_search_documents_facets_idx on public.source_search_documents using gin (facets) where approved;
create index source_search_documents_source_idx on public.source_search_documents (source_id);

alter table public.source_search_documents enable row level security;
revoke all on public.source_search_documents from public, anon, authenticated;
grant select on public.source_search_documents to service_role;

create or replace function public.check_search_document_approval() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_ok boolean;
begin
  if not new.approved then
    return new;
  end if;
  select s.published and r.search_index_allowed and r.ai_processing_allowed
    into source_ok
  from public.sources s
  join editorial.source_rights r on r.id = s.rights_id
  where s.id = new.source_id;
  if source_ok is not true then
    raise exception 'source % is not approved for local search and AI processing', new.source_id;
  end if;
  return new;
end;
$$;

create trigger source_search_documents_approval_gate
  before insert or update on public.source_search_documents
  for each row execute function public.check_search_document_approval();

revoke all on function public.check_search_document_approval() from public, anon, authenticated;

-- Keyword search is deliberately a candidate finder, never an answer or a truth score.
-- It is invoker-rights and callable only with the server's secret role.
create or replace function public.search_approved_source_candidates(
  query_text text,
  answer_language text,
  question_type text,
  required_facets text[],
  match_count int default 20
)
returns table (
  document_id bigint,
  source_id uuid,
  lang text,
  search_text text,
  question_types text[],
  facets text[],
  rank real
)
language sql
stable
set search_path = ''
as $$
  select
    d.id,
    d.source_id,
    d.lang,
    d.search_text,
    d.question_types,
    d.facets,
    ts_rank_cd(d.search_vector, websearch_to_tsquery('simple', query_text)) as rank
  from public.source_search_documents d
  join public.sources s on s.id = d.source_id
  join editorial.source_rights r on r.id = s.rights_id
  where d.approved
    and s.published
    and r.status in ('granted', 'short_quotes_only')
    and r.search_index_allowed
    and r.ai_processing_allowed
    and d.lang in (answer_language, 'ar')
    and (cardinality(d.question_types) = 0 or d.question_types @> array[question_type])
    and (cardinality(required_facets) = 0 or d.facets && required_facets)
    and d.search_vector @@ websearch_to_tsquery('simple', query_text)
  order by rank desc, d.id
  limit least(greatest(match_count, 1), 50)
$$;

revoke all on function public.search_approved_source_candidates(text, text, text, text[], int)
  from public, anon, authenticated;
grant execute on function public.search_approved_source_candidates(text, text, text, text[], int)
  to service_role;

-- ---------- reusable answer packages ----------
-- question_signature is a generic, reviewed intent key, never a visitor's raw question or identity.
create table public.answer_packages (
  id uuid primary key default gen_random_uuid(),
  question_signature text not null check (question_signature ~ '^[a-z0-9][a-z0-9_-]{2,119}$'),
  lang text not null check (lang in ('ar', 'en', 'de')),
  question_type text not null check (question_type in ('identity','definition','ruling','evidence','reason','practice','history','comparison','objection','reference','general')),
  subjects text[] not null,
  required_facets text[] not null,
  answer_json jsonb not null check (jsonb_typeof(answer_json) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'automatic', 'scholar_reviewed', 'retired')),
  reviewed_by text,
  reviewed_at timestamptz,
  model_id text,
  verifier_id text,
  version int not null default 1 check (version > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_signature, lang, version),
  constraint answer_package_has_subjects check (cardinality(subjects) > 0),
  constraint answer_package_facets_valid check (
    cardinality(required_facets) > 0 and
    required_facets <@ array['identity','definition','attributes','ruling','evidence','reason','steps','conditions','exceptions','history','comparison','response','meaning','general']::text[]
  ),
  constraint reviewed_package_has_proof check (
    status <> 'scholar_reviewed' or (reviewed_by is not null and reviewed_at is not null)
  ),
  constraint automatic_package_has_models check (
    status <> 'automatic' or (model_id is not null and verifier_id is not null)
  ),
  constraint published_package_has_status check (
    not published or status in ('automatic', 'scholar_reviewed')
  )
);

create table public.answer_package_sources (
  package_id uuid not null references public.answer_packages (id) on delete cascade,
  source_id uuid not null references public.sources (id),
  role text not null check (role in ('direct', 'other_view')),
  facets text[] not null,
  sort int not null default 0,
  primary key (package_id, source_id),
  constraint answer_package_source_facets_valid check (
    cardinality(facets) > 0 and
    facets <@ array['identity','definition','attributes','ruling','evidence','reason','steps','conditions','exceptions','history','comparison','response','meaning','general']::text[]
  )
);

create index answer_packages_lookup_idx
  on public.answer_packages (question_signature, lang, version desc)
  where published and status in ('automatic', 'scholar_reviewed');
create index answer_package_sources_source_idx on public.answer_package_sources (source_id);

alter table public.answer_packages enable row level security;
alter table public.answer_package_sources enable row level security;
revoke all on public.answer_packages, public.answer_package_sources from public, anon, authenticated;
grant select on public.answer_packages, public.answer_package_sources to service_role;

create or replace function public.check_answer_package_publication() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  direct_count int;
  missing_facets text[];
begin
  if not new.published then
    return new;
  end if;

  select count(*) into direct_count
  from public.answer_package_sources aps
  join public.sources s on s.id = aps.source_id
  join editorial.source_rights r on r.id = s.rights_id
  where aps.package_id = new.id
    and aps.role = 'direct'
    and s.published
    and r.status in ('granted', 'short_quotes_only');
  if direct_count = 0 then
    raise exception 'answer package % has no publishable direct source', new.id;
  end if;

  if new.status = 'automatic' and exists (
    select 1
    from public.answer_package_sources aps
    join public.sources s on s.id = aps.source_id
    join editorial.source_rights r on r.id = s.rights_id
    where aps.package_id = new.id and not r.ai_processing_allowed
  ) then
    raise exception 'automatic answer package % contains a source not approved for AI processing', new.id;
  end if;

  select array_agg(facet) into missing_facets
  from unnest(new.required_facets) facet
  where not exists (
    select 1 from public.answer_package_sources aps
    join public.sources s on s.id = aps.source_id
    where aps.package_id = new.id
      and aps.role = 'direct'
      and s.published
      and facet = any(aps.facets)
  );
  if missing_facets is not null then
    raise exception 'answer package % is missing direct evidence for facets %', new.id, missing_facets;
  end if;

  return new;
end;
$$;

create trigger answer_packages_publication_gate
  before insert or update on public.answer_packages
  for each row execute function public.check_answer_package_publication();

revoke all on function public.check_answer_package_publication() from public, anon, authenticated;

-- Published packages are immutable until an editor deliberately unpublishes them. This prevents
-- a safe package from silently losing or changing the evidence that passed its publication gate.
create or replace function public.protect_published_package_sources() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_package uuid;
begin
  target_package := case when tg_op = 'DELETE' then old.package_id else new.package_id end;
  if exists (select 1 from public.answer_packages where id = target_package and published) then
    raise exception 'unpublish answer package % before changing its sources', target_package;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger answer_package_sources_immutable_when_published
  before insert or update or delete on public.answer_package_sources
  for each row execute function public.protect_published_package_sources();

revoke all on function public.protect_published_package_sources() from public, anon, authenticated;

-- Keep an append-only record of edits, using the history function installed by publication_gates.
create trigger source_search_documents_history
  after update or delete on public.source_search_documents
  for each row execute function editorial.keep_history();
create trigger answer_packages_history
  after update or delete on public.answer_packages
  for each row execute function editorial.keep_history();
create trigger answer_package_sources_history
  after update or delete on public.answer_package_sources
  for each row execute function editorial.keep_history();

commit;
