-- Mo's decision (2026-10-29): German is translated and switched back on. Publish the German AI
-- translations of fatwas and stored hadith. They stay labelled as AI translations, and Ask checks
-- each one against its exact Arabic original before displaying it.
-- Left unpublished: 104 hadith translations that end with an added sentence that is not in the
-- Arabic ("Der vollständige Bericht bewahrt seine Überlieferungskette ..."); they need repair first.
-- The history trigger records every changed row.
update public.source_translations t
set published = true
from public.sources s
where s.id = t.source_id
  and s.kind in ('fatwa', 'hadith')
  and t.lang = 'de'
  and t.origin = 'ai'
  and t.published = false
  and t.text !~* 'vollständige (bericht|überlieferung) (bewahrt|enthält)'
  and t.text not ilike '%complete report preserves%';
