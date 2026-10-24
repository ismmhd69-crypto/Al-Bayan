-- Prepared locally. Do not apply to production before the research preview is accepted.
-- No source/translation approvals or embedding rights change.
begin;
create schema if not exists editorial;

create table editorial.ask_research_jobs (
  id uuid primary key,
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  account_id uuid references auth.users(id) on delete set null,
  erased_at timestamptz,
  rate_hash text not null check (rate_hash ~ '^[a-f0-9]{64}$'),
  dedupe_hash text not null check (dedupe_hash ~ '^[a-f0-9]{64}$'),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  language text not null check (language in ('en','ar','de')),
  request_cipher jsonb,
  protocol smallint not null default 1 check (protocol in (1,2)),
  checkpoint_cipher jsonb check (checkpoint_cipher is null or (jsonb_typeof(checkpoint_cipher)='object' and octet_length(checkpoint_cipher::text)<=4000000)),
  status text not null default 'queued' check (status in ('queued','running','paused','complete','incomplete','failed','cancelled','reconciliation_required','expired')),
  lease_id uuid,
  lease_expires_at timestamptz,
  sequence integer not null default 0 check (sequence between 0 and 512),
  read_window_started timestamptz not null default clock_timestamp(),
  read_count integer not null default 0 check (read_count between 0 and 120),
  max_cost_usd numeric not null check (max_cost_usd > 0 and max_cost_usd <= 1.50),
  spent_usd numeric not null default 0 check (spent_usd >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '24 hours'),
  unique(owner_hash,dedupe_hash),
  check (request_cipher is null or (jsonb_typeof(request_cipher)='object' and octet_length(request_cipher::text) <= 40000))
);
create index ask_research_jobs_queue on editorial.ask_research_jobs(status,created_at);
create index ask_research_jobs_rate on editorial.ask_research_jobs(rate_hash,created_at);
create index ask_research_jobs_expiry on editorial.ask_research_jobs(expires_at);
create index ask_research_jobs_account on editorial.ask_research_jobs(account_id) where account_id is not null;

create table editorial.ask_research_events (
  job_id uuid not null references editorial.ask_research_jobs(id) on delete cascade,
  sequence integer not null check (sequence between 1 and 512),
  payload_cipher jsonb not null check (jsonb_typeof(payload_cipher)='object' and octet_length(payload_cipher::text) <= 4000000),
  primary key(job_id,sequence)
);
create table editorial.ask_research_attempts (
  job_id uuid not null references editorial.ask_research_jobs(id) on delete cascade,
  attempt_key text not null check (attempt_key ~ '^[a-f0-9]{64}:[1-9][0-9]{0,3}$'),
  lease_id uuid not null,
  state text not null check (state in ('reserved','unsettled','settled')),
  reserved_usd numeric not null check (reserved_usd > 0 and reserved_usd <= 1.50),
  cost_usd numeric check (cost_usd >= 0),
  response_cipher jsonb check (response_cipher is null or (jsonb_typeof(response_cipher)='object' and octet_length(response_cipher::text) <= 4000000)),
  provider_request_id text check (provider_request_id is null or provider_request_id ~ '^[a-zA-Z0-9_-]{1,200}$'),
  created_at timestamptz not null default clock_timestamp(),
  primary key(job_id,attempt_key)
);

alter table editorial.ask_research_jobs enable row level security;
alter table editorial.ask_research_events enable row level security;
alter table editorial.ask_research_attempts enable row level security;
revoke all on editorial.ask_research_jobs, editorial.ask_research_events, editorial.ask_research_attempts from public,anon,authenticated;
grant usage on schema editorial to service_role;
grant select,insert,update,delete on editorial.ask_research_jobs, editorial.ask_research_events, editorial.ask_research_attempts to service_role;

-- Account deletion and private-text erasure occur in the same database transaction.
-- Narrow trigger-only definer: Auth's deletion role needs no access to editorial tables.
create function editorial.erase_account_research() returns trigger
language plpgsql security definer set search_path = '' as $$
declare stamp timestamptz := clock_timestamp();
begin
  update editorial.ask_research_jobs set request_cipher=null,checkpoint_cipher=null,status='expired',lease_id=null,lease_expires_at=null,erased_at=stamp,
    expires_at=least(expires_at,stamp),updated_at=stamp where account_id=old.id;
  delete from editorial.ask_research_events e using editorial.ask_research_jobs j where e.job_id=j.id and j.account_id=old.id;
  update editorial.ask_research_attempts a set response_cipher=null from editorial.ask_research_jobs j where a.job_id=j.id and j.account_id=old.id;
  -- Keep only minimal outstanding billing receipts, detached from the deleted account.
  delete from editorial.ask_research_jobs j where account_id=old.id
    and not exists(select 1 from editorial.ask_research_attempts a where a.job_id=j.id and a.state<>'settled');
  update editorial.ask_research_jobs set account_id=null,
    owner_hash=replace(id::text,'-','')||repeat('0',32),rate_hash=repeat('0',64),request_hash=repeat('0',64),dedupe_hash=repeat('0',64)
    where account_id=old.id;
  return old;
end $$;
revoke all on function editorial.erase_account_research() from public,anon,authenticated,service_role;
create trigger erase_account_research before delete on auth.users
for each row execute function editorial.erase_account_research();

-- Invoker rights: only the server role has execution/table privileges. No visitor RPC access.
create or replace function public.ask_research_job(operation text, payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  j editorial.ask_research_jobs%rowtype;
  a editorial.ask_research_attempts%rowtype;
  target_job_id uuid;
  stamp timestamptz := clock_timestamp();
  amount numeric;
  total_reserved numeric;
  result jsonb;
  export_stamp timestamptz;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 4100000 then
    raise exception 'invalid_research_payload';
  end if;

  if operation='account_ready' then
    if payload->>'account_id' is null then raise exception 'invalid_research_account'; end if;
    perform (payload->>'account_id')::uuid;
    return jsonb_build_object('status','ok','lifecycle_version',1);
  end if;

  if operation='account_export' then
    if payload->>'account_id' is null then raise exception 'invalid_research_account'; end if;
    export_stamp:=coalesce((payload->>'as_of')::timestamptz,stamp);
    if export_stamp>stamp or export_stamp<stamp-interval '24 hours' then raise exception 'invalid_research_snapshot'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'state',q.status,'language',q.language,'created_at',q.created_at,
      'expires_at',q.expires_at,'request_cipher',q.request_cipher) order by q.id),'[]'::jsonb) into result from (
      select * from editorial.ask_research_jobs where account_id=(payload->>'account_id')::uuid
        and created_at<=export_stamp and expires_at>stamp and request_cipher is not null
        and (payload->>'after' is null or id>(payload->>'after')::uuid) order by id limit 10
    ) q;
    return jsonb_build_object('status','ok','as_of',export_stamp,'jobs',result,
      'next',case when jsonb_array_length(result)=10 then result->9->>'id' else null end);
  end if;

  if operation='enqueue' then
    if coalesce(payload->>'owner','') !~ '^[a-f0-9]{64}$' or coalesce(payload->>'rate','') !~ '^[a-f0-9]{64}$'
      or coalesce(payload->>'dedupe','') !~ '^[a-f0-9]{64}$' or coalesce(payload->>'request_hash','') !~ '^[a-f0-9]{64}$'
      or payload->'request_cipher' is null or jsonb_typeof(payload->'request_cipher') <> 'object'
      or octet_length((payload->'request_cipher')::text)>40000 then raise exception 'invalid_research_request'; end if;
    if coalesce(payload->>'language','') not in ('en','ar','de') then raise exception 'invalid_research_language'; end if;
    amount := (payload->>'max_cost_usd')::numeric;
    if amount is null or amount<=0 or amount>1.50 then raise exception 'invalid_research_budget'; end if;
    -- Shared admission and claim lock. Bounds apply across web/worker instances.
    perform pg_catalog.pg_advisory_xact_lock(1800261020::bigint);
    select * into j from editorial.ask_research_jobs where owner_hash=payload->>'owner' and dedupe_hash=payload->>'dedupe' for update;
    if found then
      if j.status='cancelled' and j.request_cipher is null then
        return jsonb_build_object('status','ok','id',j.id,'state','cancelled','sequence',j.sequence);
      end if;
      if j.request_hash<>payload->>'request_hash' or j.account_id is distinct from (payload->>'account_id')::uuid then return jsonb_build_object('status','idempotency_conflict'); end if;
      return jsonb_build_object('status','ok','id',j.id,'state',j.status,'sequence',j.sequence);
    end if;
    if (select count(*) from editorial.ask_research_jobs where rate_hash=payload->>'rate' and created_at>stamp-interval '10 minutes')>=8
      or (select count(*) from editorial.ask_research_jobs where created_at>=date_trunc('day',stamp at time zone 'UTC') at time zone 'UTC')>=200
      or (select count(*) from editorial.ask_research_jobs where status in ('queued','running') and expires_at>stamp)>=100 then
      return jsonb_build_object('status','rate_limited');
    end if;
    insert into editorial.ask_research_jobs(id,owner_hash,account_id,rate_hash,dedupe_hash,request_hash,language,request_cipher,max_cost_usd,protocol)
      values((payload->>'id')::uuid,payload->>'owner',(payload->>'account_id')::uuid,payload->>'rate',payload->>'dedupe',payload->>'request_hash',payload->>'language',payload->'request_cipher',amount,coalesce((payload->>'protocol')::smallint,1))
      returning * into j;
    return jsonb_build_object('status','ok','id',j.id,'state',j.status,'sequence',0);
  end if;

  if operation='cancel_key' then
    if coalesce(payload->>'owner','') !~ '^[a-f0-9]{64}$' or coalesce(payload->>'rate','') !~ '^[a-f0-9]{64}$'
      or coalesce(payload->>'dedupe','') !~ '^[a-f0-9]{64}$' or coalesce(payload->>'language','') not in ('en','ar','de') then raise exception 'invalid_research_cancellation'; end if;
    perform pg_catalog.pg_advisory_xact_lock(1800261020::bigint);
    select * into j from editorial.ask_research_jobs where owner_hash=payload->>'owner' and dedupe_hash=payload->>'dedupe' for update;
    if not found then
      -- A bounded tombstone wins against a late enqueue of this same owner/submission.
      -- It contains no question/cipher and can never be claimed by a worker.
      if (select count(*) from editorial.ask_research_jobs where rate_hash=payload->>'rate' and created_at>stamp-interval '10 minutes')>=8
        or (select count(*) from editorial.ask_research_jobs where created_at>=date_trunc('day',stamp at time zone 'UTC') at time zone 'UTC')>=200 then
        return jsonb_build_object('status','rate_limited');
      end if;
      insert into editorial.ask_research_jobs(id,owner_hash,account_id,rate_hash,dedupe_hash,request_hash,language,status,max_cost_usd)
        values((payload->>'id')::uuid,payload->>'owner',(payload->>'account_id')::uuid,payload->>'rate',payload->>'dedupe',repeat('0',64),payload->>'language','cancelled',0.000001)
        returning * into j;
    elsif j.status in ('queued','running','reconciliation_required') then
      update editorial.ask_research_jobs set status='cancelled',lease_id=null,lease_expires_at=null,updated_at=stamp where id=j.id returning * into j;
    end if;
    return jsonb_build_object('status','ok','id',j.id,'state',j.status,'sequence',j.sequence);
  end if;

  if operation='claim' then
    perform pg_catalog.pg_advisory_xact_lock(1800261020::bigint);
    -- Do not redeliver an expired lease with an uncertain provider attempt.
    update editorial.ask_research_jobs q set status='reconciliation_required',lease_id=null,lease_expires_at=null,updated_at=stamp
      where q.status='running' and q.lease_expires_at<=stamp
        and exists(select 1 from editorial.ask_research_attempts p where p.job_id=q.id and p.state<>'settled');
    if (select count(*) from editorial.ask_research_jobs where status='running' and lease_expires_at>stamp and expires_at>stamp)>=4 then
      return jsonb_build_object('status','busy');
    end if;
    select * into j from editorial.ask_research_jobs where expires_at>stamp and request_cipher is not null
      and (status='queued' or (status='running' and lease_expires_at<=stamp))
      order by created_at for update skip locked limit 1;
    if not found then return jsonb_build_object('status','empty'); end if;
    update editorial.ask_research_jobs set status='running',lease_id=pg_catalog.gen_random_uuid(),lease_expires_at=stamp+interval '30 seconds',updated_at=stamp
      where id=j.id returning * into j;
    return jsonb_build_object('status','ok','id',j.id,'lease',j.lease_id,'sequence',j.sequence,'request_cipher',j.request_cipher,'checkpoint_cipher',j.checkpoint_cipher,'expires_at',j.expires_at);
  end if;

  if operation='prune' then
    -- Private content expires even without visitor traffic. Unsettled billing metadata stays
    -- until operator reconciliation; it contains no prompts, originals or response bodies.
    delete from editorial.ask_research_events e using editorial.ask_research_jobs q where e.job_id=q.id and q.expires_at<=stamp;
    update editorial.ask_research_attempts p set response_cipher=null from editorial.ask_research_jobs q where p.job_id=q.id and q.expires_at<=stamp;
    update editorial.ask_research_jobs set request_cipher=null,checkpoint_cipher=null,status='expired',lease_id=null,lease_expires_at=null,updated_at=stamp where expires_at<=stamp and status<>'expired';
    delete from editorial.ask_research_jobs q where (q.created_at<stamp-interval '30 days' or q.erased_at is not null)
      and not exists(select 1 from editorial.ask_research_attempts p where p.job_id=q.id and p.state<>'settled');
    return jsonb_build_object('status','ok');
  end if;

  if operation='lookup' then
    select * into j from editorial.ask_research_jobs where owner_hash=payload->>'owner' and dedupe_hash=payload->>'dedupe';
    if not found then return jsonb_build_object('status','not_found'); end if;
    payload:=payload||jsonb_build_object('id',j.id);
  end if;
  target_job_id := (payload->>'id')::uuid;
  if operation='continue' then perform pg_catalog.pg_advisory_xact_lock(1800261020::bigint); end if;
  select * into j from editorial.ask_research_jobs where id=target_job_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if operation in ('read','cancel','lookup','continue') then
    if j.owner_hash<>coalesce(payload->>'owner','') then return jsonb_build_object('status','not_found'); end if;
    if j.expires_at<=stamp then return jsonb_build_object('status','expired'); end if;
    if operation='continue' then
      if j.protocol<>2 or j.status<>'paused' or j.checkpoint_cipher is null then return jsonb_build_object('status','not_paused'); end if;
      if exists(select 1 from editorial.ask_research_attempts where job_id=j.id and state<>'settled') then return jsonb_build_object('status','reconciliation_required'); end if;
      perform pg_catalog.pg_advisory_xact_lock(1800261020::bigint);
      if (select count(*) from editorial.ask_research_jobs where status in ('queued','running') and expires_at>stamp)>=100 then return jsonb_build_object('status','rate_limited'); end if;
      update editorial.ask_research_jobs set status='queued',lease_id=null,lease_expires_at=null,updated_at=stamp where id=j.id returning * into j;
      return jsonb_build_object('status','ok','id',j.id,'state',j.status,'sequence',j.sequence);
    end if;
    if operation in ('read','lookup') then
      if j.read_window_started<=stamp-interval '1 minute' then j.read_count:=0; j.read_window_started:=stamp; end if;
      if j.read_count>=120 then return jsonb_build_object('status','rate_limited'); end if;
      update editorial.ask_research_jobs set read_count=j.read_count+1,read_window_started=j.read_window_started where id=j.id;
    end if;
    if operation='lookup' then
      return jsonb_build_object('status','ok','id',j.id,'state',j.status,'language',j.language,'sequence',j.sequence,'request_cipher',j.request_cipher);
    end if;
    if operation='cancel' and j.status in ('queued','running','paused','reconciliation_required') then
      update editorial.ask_research_jobs set status='cancelled',lease_id=null,lease_expires_at=null,updated_at=stamp where id=target_job_id returning * into j;
    end if;
    if coalesce((payload->>'after')::integer,0) not between 0 and 512 then raise exception 'invalid_research_cursor'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('sequence',e.sequence,'payload_cipher',e.payload_cipher) order by e.sequence),'[]'::jsonb) into result
      from editorial.ask_research_events e where e.job_id=target_job_id and e.sequence>coalesce((payload->>'after')::integer,0);
    return jsonb_build_object('status','ok','id',j.id,'state',j.status,'sequence',j.sequence,'language',j.language,'events',result,'expires_at',j.expires_at,'protocol',j.protocol);
  end if;

  -- Every worker write checks the current, unexpired lease. Stop revokes it immediately.
  -- A late receipt may still settle its original reservation after Stop/lease loss. It must
  -- never restore permission to work or retain response text beyond the job's expiry.
  if operation<>'record' and (j.status<>'running' or j.expires_at<=stamp or j.lease_expires_at is null or j.lease_expires_at<=stamp or j.lease_id is distinct from (payload->>'lease')::uuid) then
    return jsonb_build_object('status','lease_lost');
  end if;
  if operation='history' then
    select coalesce(jsonb_agg(jsonb_build_object('sequence',e.sequence,'payload_cipher',e.payload_cipher) order by e.sequence),'[]'::jsonb) into result
      from editorial.ask_research_events e where e.job_id=j.id;
    return jsonb_build_object('status','ok','id',j.id,'state',j.status,'sequence',j.sequence,'language',j.language,'events',result,'expires_at',j.expires_at);
  elsif operation='hold' then
    update editorial.ask_research_jobs set status='reconciliation_required',lease_id=null,lease_expires_at=null,updated_at=stamp where id=j.id;
    return jsonb_build_object('status','ok');
  elsif operation='pulse' then
    update editorial.ask_research_jobs set lease_expires_at=least(stamp+interval '30 seconds',expires_at),updated_at=stamp where id=target_job_id;
    return jsonb_build_object('status','ok');
  elsif operation='start_run' then
    if exists(select 1 from editorial.ask_research_attempts where job_id=j.id and state<>'settled') then
      update editorial.ask_research_jobs set status='reconciliation_required',lease_id=null,lease_expires_at=null,updated_at=stamp where id=j.id;
      return jsonb_build_object('status','reconciliation_required');
    end if;
    return jsonb_build_object('status','ok');
  elsif operation='reserve' then
    select * into a from editorial.ask_research_attempts where job_id=j.id and attempt_key=payload->>'key';
    if found then return jsonb_build_object('status','ok','acquired',false,'state',a.state,'response_cipher',a.response_cipher,'cost_usd',a.cost_usd); end if;
    amount := (payload->>'max_cost_usd')::numeric;
    if amount is null or amount<=0 or amount>1.50 then raise exception 'invalid_attempt_budget'; end if;
    select coalesce(sum(reserved_usd),0) into total_reserved from editorial.ask_research_attempts where job_id=j.id and state<>'settled';
    if (select count(*) from editorial.ask_research_attempts where job_id=j.id)>=64 or j.spent_usd+total_reserved+amount>j.max_cost_usd then
      return jsonb_build_object('status','budget_exhausted');
    end if;
    insert into editorial.ask_research_attempts(job_id,attempt_key,lease_id,state,reserved_usd)
      values(j.id,payload->>'key',j.lease_id,'reserved',amount);
    return jsonb_build_object('status','ok','acquired',true);
  elsif operation='record' then
    select * into a from editorial.ask_research_attempts where job_id=j.id and attempt_key=payload->>'key' for update;
    if not found or a.state<>'reserved' or a.lease_id is distinct from (payload->>'lease')::uuid then return jsonb_build_object('status','attempt_conflict'); end if;
    if payload->'response_cipher' is null or jsonb_typeof(payload->'response_cipher')<>'object' then raise exception 'invalid_attempt_response'; end if;
    amount := (payload->>'cost_usd')::numeric;
    if amount<0 then raise exception 'invalid_attempt_cost'; end if;
    update editorial.ask_research_attempts set response_cipher=case when j.expires_at>stamp then payload->'response_cipher' else null end,cost_usd=amount,provider_request_id=payload->>'provider_request_id',
      state=case when amount is not null and amount<=a.reserved_usd then 'settled' else 'unsettled' end
      where job_id=j.id and attempt_key=a.attempt_key;
    if amount is null or amount>a.reserved_usd then
      update editorial.ask_research_jobs set status=case when status in ('running','queued') then 'reconciliation_required' else status end,lease_id=null,lease_expires_at=null,updated_at=stamp where id=j.id;
      return jsonb_build_object('status','reconciliation_required');
    end if;
    update editorial.ask_research_jobs set spent_usd=spent_usd+amount,updated_at=stamp where id=j.id;
    return jsonb_build_object('status','ok');
  elsif operation='patient_event' then
    if j.protocol<>2 or (payload->>'expected_sequence')::integer is distinct from j.sequence then return jsonb_build_object('status','sequence_conflict'); end if;
    if j.sequence>=512 then return jsonb_build_object('status','event_limit'); end if;
    if payload->'checkpoint_cipher' is null or jsonb_typeof(payload->'checkpoint_cipher')<>'object' then raise exception 'invalid_patient_checkpoint'; end if;
    if coalesce(payload->>'state','running') not in ('running','paused','complete','failed','cancelled') then raise exception 'invalid_patient_state'; end if;
    if coalesce(payload->>'state','running')<>'running' and exists(select 1 from editorial.ask_research_attempts where job_id=j.id and state<>'settled') then return jsonb_build_object('status','reconciliation_required'); end if;
    insert into editorial.ask_research_events(job_id,sequence,payload_cipher) values(j.id,j.sequence+1,payload->'payload_cipher');
    update editorial.ask_research_jobs set sequence=sequence+1,checkpoint_cipher=payload->'checkpoint_cipher',updated_at=stamp,
      status=coalesce(payload->>'state','running'),lease_id=case when coalesce(payload->>'state','running')='running' then lease_id else null end,
      lease_expires_at=case when coalesce(payload->>'state','running')='running' then lease_expires_at else null end where id=j.id returning * into j;
    return jsonb_build_object('status','ok','sequence',j.sequence);
  elsif operation in ('event','finish') then
    if (payload->>'expected_sequence')::integer is distinct from j.sequence then return jsonb_build_object('status','sequence_conflict'); end if;
    if j.sequence>=512 then return jsonb_build_object('status','event_limit'); end if;
    if operation='finish' and coalesce(payload->>'state','') not in ('complete','incomplete','failed') then raise exception 'invalid_research_terminal'; end if;
    if operation='finish' and exists(select 1 from editorial.ask_research_attempts where job_id=j.id and state<>'settled') then
      return jsonb_build_object('status','reconciliation_required');
    end if;
    insert into editorial.ask_research_events(job_id,sequence,payload_cipher) values(j.id,j.sequence+1,payload->'payload_cipher');
    update editorial.ask_research_jobs set sequence=sequence+1,updated_at=stamp,
      status=case when operation='finish' then payload->>'state' else status end,
      lease_id=case when operation='finish' then null else lease_id end,
      lease_expires_at=case when operation='finish' then null else lease_expires_at end
      where id=j.id returning * into j;
    return jsonb_build_object('status','ok','sequence',j.sequence);
  end if;
  raise exception 'unknown_research_operation';
end;
$$;
revoke all on function public.ask_research_job(text,jsonb) from public,anon,authenticated;
grant execute on function public.ask_research_job(text,jsonb) to service_role;
commit;
