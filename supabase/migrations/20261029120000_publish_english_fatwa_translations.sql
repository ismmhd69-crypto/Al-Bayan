-- Mo's decision (2026-10-29): launch with English and Arabic only, and show the existing
-- English AI translations of fatwas. They stay labelled "AI translation, check the Arabic
-- original" on the website, and Ask checks each one against its exact Arabic original
-- before displaying it. German translations stay unpublished (German is postponed).
-- The history trigger records every changed row.
update public.source_translations t
set published = true
from public.sources s
where s.id = t.source_id
  and s.kind = 'fatwa'
  and t.lang = 'en'
  and t.origin = 'ai'
  and t.published = false;
