-- Fair-use question limits for Ask (Mo, 2026-11-12): 25 questions a day and 100 a week per person,
-- and about 75 a day per network for people who are not signed in.
--
-- What is stored: one row per unreadable code and day, with a count. The code is a keyed hash made on the
-- server from a browser cookie, a network address or an account id. The raw value is never stored and
-- cannot be recovered from the code. Rows are deleted after 8 days.
-- Who can use it: only the website's server (service role). Visitors, signed in or not, cannot read or
-- write anything here.

create table public.ask_quota_usage (
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  day date not null,
  count integer not null check (count between 0 and 1000000),
  primary key (key_hash, day)
);

alter table public.ask_quota_usage enable row level security;
revoke all on public.ask_quota_usage from public, anon, authenticated;
grant select, insert, update, delete on public.ask_quota_usage to service_role;

-- Checks and counts one question for every given code in one transaction. Each code is locked first, in a
-- fixed order, so two questions at the same moment cannot both pass the last free place. Nothing is counted
-- unless every code is under its limits. The day is the server's UTC day; callers cannot choose it.
-- keys: [{ "key": <64 hex>, "scope": "account" | "browser" | "network", "daily": int, "weekly": int }]
create function public.take_ask_quota(keys jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (pg_catalog.now() at time zone 'utc')::date;
  k jsonb;
  day_count bigint;
  week_count bigint;
  i integer;
  refusal jsonb := null;
begin
  if pg_catalog.jsonb_typeof(keys) is distinct from 'array' or pg_catalog.jsonb_array_length(keys) not between 1 and 3 then
    raise exception 'invalid quota keys' using errcode = 'invalid_parameter_value';
  end if;
  for k in select e.value from pg_catalog.jsonb_array_elements(keys) as e(value) order by e.value->>'key' loop
    if pg_catalog.jsonb_typeof(k) is distinct from 'object'
      or coalesce(k->>'key', '') !~ '^[a-f0-9]{64}$'
      or coalesce(k->>'scope', '') not in ('account', 'browser', 'network')
      or coalesce(k->>'daily', '') !~ '^[0-9]{1,6}$' or coalesce(k->>'weekly', '') !~ '^[0-9]{1,7}$'
      or (k->>'daily')::integer < 1 or (k->>'weekly')::integer < 1 then
      raise exception 'invalid quota key' using errcode = 'invalid_parameter_value';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ask_quota:' || (k->>'key'), 0));
  end loop;

  for k in select e.value from pg_catalog.jsonb_array_elements(keys) as e(value) order by e.value->>'key' loop
    select coalesce(sum(u.count) filter (where u.day = today), 0), coalesce(sum(u.count), 0)
      into day_count, week_count
      from public.ask_quota_usage u
      where u.key_hash = k->>'key' and u.day > today - 7;
    if week_count >= (k->>'weekly')::integer then
      -- The week is rolling: the first day on which the last 7 days fall back under the limit.
      i := 1;
      while i < 7 and (select coalesce(sum(u.count), 0) from public.ask_quota_usage u
          where u.key_hash = k->>'key' and u.day > today - 7 + i) >= (k->>'weekly')::integer loop
        i := i + 1;
      end loop;
      refusal := pg_catalog.jsonb_build_object('status', 'weekly', 'scope', k->>'scope', 'limit', (k->>'weekly')::integer, 'retry_on', today + i);
      exit;
    elsif day_count >= (k->>'daily')::integer then
      refusal := pg_catalog.jsonb_build_object('status', 'daily', 'scope', k->>'scope', 'limit', (k->>'daily')::integer, 'retry_on', today + 1);
      exit;
    end if;
  end loop;
  if refusal is not null then return refusal; end if;

  insert into public.ask_quota_usage (key_hash, day, count)
    select e.value->>'key', today, 1 from pg_catalog.jsonb_array_elements(keys) as e(value)
    on conflict (key_hash, day) do update set count = public.ask_quota_usage.count + 1;
  return pg_catalog.jsonb_build_object('status', 'ok');
end
$$;

revoke all on function public.take_ask_quota(jsonb) from public, anon, authenticated;
grant execute on function public.take_ask_quota(jsonb) to service_role;

-- Retention: a daily job deletes counts older than 8 days, even when no new question arrives.
create extension if not exists pg_cron;
select cron.schedule('ask-quota-retention', '17 3 * * *', $$delete from public.ask_quota_usage where day < (now() at time zone 'utc')::date - 8$$);
