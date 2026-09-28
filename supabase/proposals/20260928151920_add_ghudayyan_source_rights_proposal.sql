-- PROPOSAL ONLY. Claude must review and apply this migration after Mo agrees.
-- This file is not applied by Codex.

insert into editorial.source_rights
  (owner, edition, allowed_use, cache_limit, translation_rights, attribution, permission_evidence,
   removal_procedure, status, notes, max_quote_chars, search_index_allowed, ai_processing_allowed,
   translation_index_allowed)
select v.owner, v.edition,
  'Short quotations (at most 600 characters) of the Arabic original, shown unchanged with the scholar''s name, the printed source and a link to the original page. Used for search on our server and as input to the AI steps that select and explain evidence. No full copies are stored.',
  'Only the short excerpt is stored; the full text stays on the original site.',
  'No translations are stored or indexed. Any translation shown is AI-drafted, labelled, and shown next to the Arabic original.',
  v.attribution,
  'No written permission yet. Short, credited and linked quotations under the right to quote (German UrhG section 51). Decision by Mo, 2026-09-28; a permission letter is to be sent.',
  'On request: unpublish every source with this rights record and delete its search documents.',
  'short_quotes_only',
  'Pending written permission.',
  600, true, true, false
from (values
  ('algodayan.com', 'Official website of Shaykh Abdullah al-Ghudayyan', 'Official website of Shaykh Abdullah al-Ghudayyan (algodayan.com)')
) as v(owner, edition, attribution)
where not exists (select 1 from editorial.source_rights r where r.owner = v.owner);
