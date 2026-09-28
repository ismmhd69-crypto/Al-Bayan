-- The private editorial schema is not reachable through the web API (on purpose). Reports are saved
-- through this one function instead, callable only with the server's secret key. It stores exactly
-- the fields of editorial.answer_reports; the table's checks still apply.

create or replace function public.submit_answer_report(
  report_lang text,
  report_reason text,
  report_source_ids text[],
  report_comment text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into editorial.answer_reports (lang, reason, source_ids, comment)
  values (report_lang, report_reason, report_source_ids, report_comment)
$$;

revoke all on function public.submit_answer_report(text, text, text[], text) from public, anon, authenticated;
grant execute on function public.submit_answer_report(text, text, text[], text) to service_role;
