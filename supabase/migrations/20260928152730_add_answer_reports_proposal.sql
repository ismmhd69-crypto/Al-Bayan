-- PROPOSAL ONLY. Claude must review and apply this migration after Mo agrees.
-- Reports deliberately exclude the visitor's question, IP address and identity.

begin;

create table if not exists editorial.answer_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lang text not null check (lang in ('ar', 'en', 'de')),
  reason text not null check (reason in ('wrong_source', 'misquoted', 'not_answering', 'unclear', 'offensive', 'other')),
  source_ids text[] null check (cardinality(source_ids) <= 12),
  comment text null check (char_length(comment) <= 500),
  status text not null default 'new' check (status in ('new', 'reviewed', 'fixed'))
);

create index if not exists answer_reports_status_created_idx on editorial.answer_reports (status, created_at desc);

alter table editorial.answer_reports enable row level security;
revoke all on editorial.answer_reports from public, anon, authenticated;
grant usage on schema editorial to service_role;
grant insert, select, update on editorial.answer_reports to service_role;

commit;
