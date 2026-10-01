-- Rights record for Shaykh Othman al-Khamis written fatwas (Mo's decision, 2026-10-01).
insert into editorial.source_rights (owner, edition, allowed_use, cache_limit, translation_rights, attribution, permission_evidence, removal_procedure, status, notes, max_quote_chars, search_index_allowed, ai_processing_allowed, translation_index_allowed)
select 'othmanalkhamees.com',
 'Fatawa al-Shaykh Othman al-Khamis as published on the site, credited to al-Maktaba al-Shamela al-Dhahabiyyah',
 allowed_use, cache_limit, translation_rights,
 'Official website of Shaykh Othman al-Khamis (othmanalkhamees.com)',
 'No written permission yet. Short, credited and linked quotations under the right to quote (German UrhG section 51). Decision by Mo, 2026-10-01; a permission letter is to be sent.',
 removal_procedure, 'short_quotes_only', 'Pending written permission.', 600, true, true, false
from editorial.source_rights where owner = 'binbaz.org.sa'
  and not exists (select 1 from editorial.source_rights where owner = 'othmanalkhamees.com');
