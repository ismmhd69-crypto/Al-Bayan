-- Private persistent discovery index. No source, permission or embedding approval is seeded.
-- Prepared locally only. Exact vector ranking is deliberate until ANN recall/load review.
begin;
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
do $$ begin
  if not exists(select 1 from pg_extension x join pg_namespace n on n.oid=x.extnamespace where x.extname='vector' and n.nspname='extensions')
    then raise exception 'ask_vector_extension_schema_mismatch'; end if;
end $$;
create schema if not exists editorial;
create or replace view editorial.ask_index_eligible_sources(source_id,rights_id,expires_at,parent_hash,source_fingerprint)
with (security_invoker = true) as select s.id, s.rights_id, r.expires_at,
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
  where true
    and s.kind in ('hadith','fatwa') and s.published and s.language='ar'
    and r.status in ('granted','short_quotes_only') and r.search_index_allowed and r.ai_processing_allowed
    and (r.expires_at is null or r.expires_at >= current_date)
    and pg_catalog.char_length(s.text_original) between 1 and 100000
    and (r.status <> 'short_quotes_only' or pg_catalog.char_length(s.text_original) <= r.max_quote_chars)
    and (s.kind <> 'hadith' or (s.grade in ('sahih','hasan') and s.grader is not null and s.collection is not null and s.numbering is not null))
    and (s.kind <> 'fatwa' or a.approved)
    and exists(select 1 from public.source_search_documents d where d.source_id=s.id and d.approved and d.lang=s.language);
revoke all on editorial.ask_index_eligible_sources from public, anon, authenticated;
grant select on editorial.ask_index_eligible_sources to service_role;
create or replace function public.read_approved_index_source_state(source_ids uuid[])
returns table(source_id uuid, rights_id uuid, expires_at date, parent_hash text, source_fingerprint text)
language sql stable security invoker set search_path = '' as $$
  select * from editorial.ask_index_eligible_sources e
  where pg_catalog.cardinality(source_ids) between 1 and 500 and e.source_id=any(source_ids)
$$;

-- Separate, explicit review of embedding processing/storage. Ordinary search
-- rights do not imply these capabilities. Empty on installation.
create table editorial.ask_index_embedding_rights (
  rights_id uuid primary key references editorial.source_rights(id) on delete cascade,
  allowed boolean not null default false,
  reviewed_by text not null check (length(reviewed_by) between 1 and 200),
  proof_hash text not null check (proof_hash ~ '^[a-f0-9]{64}$'),
  reviewed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > reviewed_at)
);
create table editorial.ask_index_generations (
  id text primary key check (id ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$'),
  space jsonb not null,
  lookup_revision text not null check (lookup_revision='source-lookup-v2'),
  dimensions integer not null check (dimensions between 1 and 8192),
  expected_count integer not null check (expected_count between 1 and 200000),
  state text not null default 'building' check (state in ('building','ready','withdrawn')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null check (expires_at > created_at and expires_at <= created_at + interval '7 days')
);
create table editorial.ask_index_pointer (
  singleton boolean primary key default true check (singleton),
  generation text not null references editorial.ask_index_generations(id) on delete cascade
);
create table editorial.ask_index_passages (
  generation text not null references editorial.ask_index_generations(id) on delete cascade,
  id text not null check (length(id) between 1 and 1000),
  source_id uuid not null references public.sources(id) on delete cascade,
  rights_id uuid not null references editorial.source_rights(id) on delete cascade,
  family text not null check (family in ('hadith','scholar')),
  parent_hash text not null check (parent_hash ~ '^[a-f0-9]{64}$'),
  source_fingerprint text not null check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  reference text not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  lexical tsvector not null,
  embedding extensions.vector,
  primary key(generation,id)
);
create index ask_index_passages_source on editorial.ask_index_passages(source_id);
create index ask_index_passages_rights on editorial.ask_index_passages(rights_id);
create index ask_index_passages_family on editorial.ask_index_passages(generation,family);
create index ask_index_passages_reference on editorial.ask_index_passages(generation,family,reference);
create index ask_index_passages_lexical on editorial.ask_index_passages using gin(lexical);
create index ask_index_generations_expiry on editorial.ask_index_generations(expires_at);

alter table editorial.ask_index_embedding_rights enable row level security;
alter table editorial.ask_index_generations enable row level security;
alter table editorial.ask_index_pointer enable row level security;
alter table editorial.ask_index_passages enable row level security;
revoke all on editorial.ask_index_embedding_rights, editorial.ask_index_generations,
  editorial.ask_index_pointer, editorial.ask_index_passages from public, anon, authenticated;
grant usage on schema editorial, extensions to service_role;
grant select on editorial.ask_index_embedding_rights to service_role;
grant select,insert,update,delete on editorial.ask_index_generations,
  editorial.ask_index_pointer, editorial.ask_index_passages to service_role;

-- Re-evaluate before method-specific limits. Current approval, exact original,
-- attribution and permission changes all remove a stale row from discovery.
create view editorial.ask_index_current_passages with (security_invoker=true) as
select p.*, (p.embedding is not null and coalesce(c.allowed,false)
  and c.reviewed_at <= now() and c.expires_at > now()) as semantic_allowed
from editorial.ask_index_passages p
join editorial.ask_index_generations g on g.id=p.generation
join editorial.ask_index_eligible_sources e on e.source_id=p.source_id
  and e.rights_id=p.rights_id and e.parent_hash=p.parent_hash
  and e.source_fingerprint=p.source_fingerprint
left join editorial.ask_index_embedding_rights c on c.rights_id=p.rights_id
where g.state in ('building','ready') and g.expires_at > now()
  and (e.expires_at is null or ((e.expires_at + 1)::timestamp at time zone 'UTC') >= g.expires_at);
revoke all on editorial.ask_index_current_passages from public, anon, authenticated;
grant select on editorial.ask_index_current_passages to service_role;

-- Only the server can call this invoker-rights API. No questions are persisted.
create function public.ask_search_index(operation text, body jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  g editorial.ask_index_generations%rowtype;
  p jsonb; e record; s record; v extensions.vector; q extensions.vector;
  rows_found integer; result jsonb; original text; parent text; refs text[];
begin
  if body is null or jsonb_typeof(body)<>'object' or octet_length(body::text)>5000000 then
    raise exception 'invalid_index_request';
  end if;
  if operation='begin' then
    if body->>'lookup_revision' is distinct from 'source-lookup-v2'
      or jsonb_typeof(body->'space') is distinct from 'object'
      or length(coalesce(body#>>'{space,model}','')) not between 1 and 200
      or length(coalesce(body#>>'{space,revision}','')) not between 1 and 200
      or coalesce(body#>>'{space,recipe}','') !~ '^[a-f0-9]{64}$'
      or (body#>>'{space,dimensions}')::integer not between 1 and 8192 then
      raise exception 'invalid_index_space';
    end if;
    insert into editorial.ask_index_generations(id,space,lookup_revision,dimensions,expected_count,expires_at)
      values(body->>'generation',body->'space',body->>'lookup_revision',(body#>>'{space,dimensions}')::integer,
        (body->>'expected_count')::integer,(body->>'expires_at')::timestamptz);
    return jsonb_build_object('status','building');
  elsif operation='manifest' then
    select x.* into g from editorial.ask_index_generations x
      join editorial.ask_index_pointer ptr on ptr.generation=x.id
      where x.state='ready' and x.expires_at>now();
    if not found then return jsonb_build_object('status','not_ready'); end if;
    return jsonb_build_object('status','ready','generation',g.id,'space',g.space,'lookup_revision',g.lookup_revision,'expires_at',g.expires_at,
      'semantic_eligible',(select count(*) from editorial.ask_index_current_passages where generation=g.id and semantic_allowed));
  elsif operation='prune' then
    delete from editorial.ask_index_generations where expires_at<=now() or state='withdrawn';
    delete from editorial.ask_index_passages p where not exists
      (select 1 from editorial.ask_index_current_passages c where c.generation=p.generation and c.id=p.id);
    update editorial.ask_index_passages p set embedding=null where embedding is not null and not exists
      (select 1 from editorial.ask_index_embedding_rights c where c.rights_id=p.rights_id
        and c.allowed and c.reviewed_at<=now() and c.expires_at>now());
    return jsonb_build_object('status','pruned');
  end if;
  -- Serialise mutation of one generation; searches do not lock a generation.
  if operation in ('append','publish','withdraw') then
    select * into g from editorial.ask_index_generations where id=body->>'generation' for update;
  else
    select * into g from editorial.ask_index_generations where id=body->>'generation';
  end if;
  if not found or g.state='withdrawn' or g.expires_at<=now() then
    raise exception 'index_generation_unavailable';
  end if;
  if operation='withdraw' then
    update editorial.ask_index_generations set state='withdrawn' where id=g.id;
    delete from editorial.ask_index_pointer where generation=g.id;
    return jsonb_build_object('status','withdrawn');
  elsif operation='append' then
    if g.state<>'building' or body->'space' is distinct from g.space
      or jsonb_typeof(body->'passages') is distinct from 'array'
      or jsonb_array_length(body->'passages') not between 1 and 50 then
      raise exception 'invalid_index_append';
    end if;
    if (select count(*) from editorial.ask_index_passages where generation=g.id)
      +jsonb_array_length(body->'passages') > g.expected_count then raise exception 'index_count_exceeded'; end if;
    for p in select value from jsonb_array_elements(body->'passages') loop
      select * into e from editorial.ask_index_eligible_sources where source_id=(p->>'sourceId')::uuid;
      if not found then raise exception 'index_source_ineligible'; end if;
      select x.*,a.name_ar,a.name_en,a.name_de into s from public.sources x
        left join public.scholars a on a.id=x.scholar_id where x.id=e.source_id;
      original:=p->>'original';
      parent:=(p#>>'{context,before}') || original || (p#>>'{context,after}');
      if p->>'language' is distinct from 'ar'
        or p->>'parentId' is distinct from p->>'sourceId'
        or p->>'family' is distinct from (case when s.kind='hadith' then 'hadith' else 'scholar' end)
        or p->>'reference' is distinct from s.reference
        or p->>'canonicalUrl' is distinct from s.url
        or p->>'title' is distinct from coalesce(nullif(s.title,''),s.reference)
        or p->>'originalVerified' is distinct from 'true'
        or p->>'verificationBasis' is distinct from 'stored_source_bytes'
        or original is null or length(original) not between 1 and 100000
        or parent is distinct from s.text_original
        or p->>'parentOriginalHash' is distinct from e.parent_hash
        or p->>'sourceFingerprint' is distinct from e.source_fingerprint
        or p->>'originalHash' is distinct from encode(sha256(convert_to(original,'UTF8')),'hex')
        or p#>>'{permissions,record}' is distinct from e.rights_id::text
        or p#>>'{permissions,published}' is distinct from 'true'
        or p#>>'{permissions,search}' is distinct from 'true'
        or p#>>'{permissions,ai}' is distinct from 'true'
        or p#>>'{permissions,revoked}' is distinct from 'false'
        or (e.expires_at is not null and ((e.expires_at + 1)::timestamp at time zone 'UTC')<g.expires_at)
        then raise exception 'index_source_mismatch'; end if;
      if (s.kind='hadith' and (p#>>'{attribution,grade}' is distinct from s.grade
          or p#>>'{attribution,grader}' is distinct from s.grader
          or p#>>'{attribution,collection}' is distinct from s.collection
          or p#>>'{attribution,numbering}' is distinct from s.numbering))
        or (s.kind='fatwa' and (p#>>'{attribution,scholarId}' is distinct from s.scholar_id
          or p#>'{attribution,scholarName}' is distinct from jsonb_build_object('ar',s.name_ar,'en',s.name_en,'de',s.name_de)))
        then raise exception 'index_attribution_mismatch'; end if;
      v:=null;
      if p->'vector' is not null and p->'vector'<>'null'::jsonb then
        if p#>'{vector,space}' is distinct from g.space
          or p#>>'{vector,textHash}' is distinct from p->>'originalHash'
          or p#>>'{permissions,embeddings}' is distinct from 'true'
          or not exists(select 1 from editorial.ask_index_embedding_rights c where c.rights_id=e.rights_id
            and c.allowed and c.reviewed_at<=now() and c.expires_at>=g.expires_at) then
          raise exception 'index_embedding_permission_or_space';
        end if;
        v:=(p#>'{vector,values}')::text::extensions.vector;
        if extensions.vector_dims(v)<>g.dimensions or extensions.vector_norm(v)<=0 then
          raise exception 'index_vector_invalid'; end if;
      end if;
      insert into editorial.ask_index_passages(generation,id,source_id,rights_id,family,parent_hash,source_fingerprint,reference,payload,lexical,embedding)
        values(g.id,p->>'id',e.source_id,e.rights_id,p->>'family',e.parent_hash,e.source_fingerprint,s.reference,
          p-'vector'-'lexicalText',to_tsvector('pg_catalog.simple'::regconfig,p->>'lexicalText'),v);
      if p->>'lexicalText' is null or length(p->>'lexicalText')>200000 then raise exception 'invalid_index_lexical_text'; end if;
    end loop;
    return jsonb_build_object('status','appended','count',jsonb_array_length(body->'passages'));
  elsif operation='publish' then
    if g.state<>'building' then raise exception 'index_generation_immutable'; end if;
    select count(*) into rows_found from editorial.ask_index_current_passages where generation=g.id;
    if rows_found<>g.expected_count or exists(select 1 from editorial.ask_index_current_passages
      where generation=g.id and embedding is not null and not semantic_allowed) then
      raise exception 'index_publication_incomplete'; end if;
    update editorial.ask_index_generations set state='ready' where id=g.id;
    insert into editorial.ask_index_pointer values(true,g.id)
      on conflict(singleton) do update set generation=excluded.generation;
    return jsonb_build_object('status','ready');
  elsif operation='search' then
    if g.state<>'ready' or body->'space' is distinct from g.space
      or coalesce(body->>'family','') not in ('hadith','scholar')
      or jsonb_typeof(body->'phrases') is distinct from 'array' or jsonb_array_length(body->'phrases')>12
      or jsonb_typeof(body->'references') is distinct from 'array' or jsonb_array_length(body->'references')>12
      or exists(select 1 from jsonb_array_elements(body->'phrases') x where jsonb_typeof(x)<>'string' or length(x#>>'{}') not between 1 and 120)
      or exists(select 1 from jsonb_array_elements(body->'references') x where jsonb_typeof(x)<>'string' or length(x#>>'{}') not between 1 and 200)
      then raise exception 'invalid_index_search'; end if;
    if body->'vector' is not null and body->'vector'<>'null'::jsonb then
      q:=(body->'vector')::text::extensions.vector;
      if extensions.vector_dims(q)<>g.dimensions or extensions.vector_norm(q)<=0 then raise exception 'query_vector_mismatch'; end if;
    end if;
    select coalesce(array_agg(value),array[]::text[]) into refs from jsonb_array_elements_text(body->'references');
    with eligible as not materialized (
      select * from editorial.ask_index_current_passages where generation=g.id and family=body->>'family'
    ), exact_matches as (
      select id,row_number() over(order by id) rank from eligible where reference=any(refs) or source_id::text=any(refs) order by id limit 20
    ), queries as (
      select plainto_tsquery('pg_catalog.simple'::regconfig,value) query from jsonb_array_elements_text(body->'phrases')
    ), lexical_scores as (
      select p.id,max(ts_rank_cd(p.lexical,queries.query)) score from eligible p join queries on p.lexical @@ queries.query group by p.id
    ), lexical_matches as (
      select id,row_number() over(order by score desc,id) rank from lexical_scores order by score desc,id limit 20
    ), vector_matches as (
      select id,row_number() over(order by embedding operator(extensions.<=>) q,id) rank from eligible
      where q is not null and semantic_allowed order by embedding operator(extensions.<=>) q,id limit 20
    ), methods as (
      select id,rank,'exact' method from exact_matches union all select id,rank,'lexical' from lexical_matches
      union all select id,rank,'semantic' from vector_matches
    ), fused as (
      select id,sum(1.0/(60+rank)) score,jsonb_object_agg(method,rank) ranks from methods group by id
    ), hits as (
      select p.payload,f.score,f.ranks from fused f join eligible p using(id) order by f.score desc,p.id limit 60
    ) select jsonb_build_object('status','ready','generation',g.id,'space',g.space,'lookup_revision',g.lookup_revision,
      'eligible',(select count(*) from eligible),'semantic_eligible',(select count(*) from eligible where semantic_allowed),
      'hits',coalesce((select jsonb_agg(jsonb_build_object('passage',payload,'score',score,'ranks',ranks)) from hits),'[]'::jsonb)) into result;
    return result;
  end if;
  raise exception 'unknown_index_operation';
end $$;
revoke all on function public.ask_search_index(text,jsonb) from public, anon, authenticated;
grant execute on function public.ask_search_index(text,jsonb) to service_role;
commit;
