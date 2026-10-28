# Approved summary discarded when a source family was absent

Request `b0007d6d-ea6b-44d6-ac65-a422a469dfeb` reached `checked_summary_ready` at 77.076 seconds. The primary review approved every claim and full coverage; the independent narrow meaning review also approved the corrected summary. The request nevertheless returned incomplete with `question_coverage`.

## Confirmed cause

Original-mode `runRichAnswer` seeded its internal completed sections with only ready source groups. This run had Sunnah originals, failed Quran selection and no scholar result. Its internal array therefore contained only Sunnah and summary. `validRichAnswer` correctly requires four canonical slots: Quran, Sunnah, scholar, summary. That structural failure discarded the approved summary before `runStableLanes` could merge it into its already complete source-outcome list.

This was an assembly bug, not a new content rejection or an unsuccessful final checker response. Earlier failures with actual negative meaning verdicts remain distinct.

## Fix

Original mode now includes honest empty/failed slots for missing source families before validating the completed answer. Ready source sections are unchanged. A successful optional-family lookup is not invented from a retrieval `ready` status when no displayed section exists. The summary still needs every existing citation, meaning, condition and full-question check. Missing a source family does not itself prohibit an otherwise fully supported answer; failing actual requested coverage still does.

No source quota, fake source card, checker exemption, additional retry or paid call was introduced.

## Verification

`scripts/replay-approved-summary-envelope.ts` reconstructs the exact captured approved wording and resolved citations, reproduces rejection of the old short section array, and validates the complete array using the captured unchanged source outcomes. It makes no new semantic decision and submits no model request. The trace is frozen privately; SHA-256 `13059989227fe79f718b2bdf03a5907325e7a2d789ef64a4eecf8b0d7f4a7312`.

Regression coverage exercises all seven nonempty combinations of available source families, plus the captured pattern of failed Quran selection with approved Sunnah. Tests validate the final server answer and replay its events through the actual stable reader reducer, ensuring the client accepts the same four-slot answer. Empty families remain empty. Existing negative summary and coverage controls continue to refuse.

88 focused tests across five files, TypeScript and the production build passed. A subsequent matrix-reader check and TypeScript also passed. Existing metadataBase and broad private-index tracing warnings remain. No paid live test was run; the replay verifies this captured delivery failure, not general live answer reliability.
