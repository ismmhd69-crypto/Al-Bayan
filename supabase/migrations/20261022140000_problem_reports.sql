-- Migration: 20261022140000_problem_reports.sql
-- Table for user-reported problems, mistakes, translation errors, and bugs.
-- Stored in the public schema so it is immediately visible in the Supabase Table Editor.

create table if not exists public.problem_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lang text not null check (lang in ('ar', 'en', 'de')),
  category text not null check (category in (
    'content_mistake',
    'translation_error',
    'technical_bug',
    'typo',
    'offensive',
    'other'
  )),
  page_url text null check (char_length(page_url) <= 300),
  source_ids text[] null check (cardinality(source_ids) <= 12),
  comment text not null check (char_length(comment) <= 1000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved'))
);

create index if not exists problem_reports_status_created_idx 
  on public.problem_reports (status, created_at desc);

-- RLS: Service role can insert, select, and update.
-- Anonymous and public cannot read other users' reports.
alter table public.problem_reports enable row level security;
revoke all on public.problem_reports from public, anon, authenticated;
grant insert, select, update on public.problem_reports to service_role;
