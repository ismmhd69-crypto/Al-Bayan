-- PROPOSAL ONLY. Created after Mo's approval on 2026-09-28.
-- Claude must review and apply this migration. Codex must not apply it.
-- A Permanent Committee fatwa is credited to the Committee, never presented as the words of one
-- individual signatory. The collector records the approved signatory names in each reference.

insert into public.scholars (id, name_ar, name_en, name_de, website, approved, sort)
values (
  'permanent-committee',
  'اللجنة الدائمة للبحوث العلمية والإفتاء',
  'The Permanent Committee for Scholarly Research and Ifta',
  'Der Ständige Ausschuss für wissenschaftliche Forschung und Fatwa',
  'https://alifta.gov.sa',
  true,
  21
)
on conflict (id) do nothing;
