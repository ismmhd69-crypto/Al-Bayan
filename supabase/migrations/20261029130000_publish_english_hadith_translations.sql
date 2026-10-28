-- Mo's decision (2026-10-29): Ask uses the stored Sunnah.com hadith (Sahih al-Bukhari and
-- Sahih Muslim) and shows their existing English AI translations. They stay labelled as AI
-- translations, and Ask checks each one against its exact Arabic original before displaying it.
-- German translations stay unpublished (German is postponed).
-- The history trigger records every changed row.
update public.source_translations t
set published = true
from public.sources s
where s.id = t.source_id
  and s.kind = 'hadith'
  and t.lang = 'en'
  and t.origin = 'ai'
  and t.published = false;
