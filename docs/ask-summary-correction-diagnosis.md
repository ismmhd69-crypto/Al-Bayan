# Local summary correction diagnosis, 21 October 2026

Request: `740b3645-4106-4ac9-bf1f-ebfe811b121b`.
Private raw trace remains in ignored `work/local-ask-traces/`.

## Confirmed findings

- Three source groups reached the reader. The terminal result was incomplete after 65.998 seconds; Quran arrived at 44.395 seconds. No overall timeout caused this failure.
- Initial summary claim C5 introduced provision/sustenance while citing only Q51:56. The checker correctly identified that the additional detail was outside that cited excerpt.
- The correction repeated that unsupported detail. Previously it received broad reason codes but not the checker explanation or the mapping of numbered claims to their wording.
- Both summaries mostly recapped individual source sections. Structured contribution findings identified duplicates despite the model's contradictory broad no-repetition verdict.
- Coverage included a background-only scholarly claim among claims supposedly establishing the direct answer. The source-point validator correctly refused it. Correction screening additionally invented Q51:57 in its coverage bookkeeping; this was not an actual selected citation.
- The hadith source had no English translation. The scholarly display-translation lookup returned lookup_failed in 1.510 seconds. The trace does not establish the underlying storage failure reason.

## Local repair

- Supply bounded, untrusted checker findings to the existing one correction attempt: exact claim IDs and wording, citations, specific support explanations, and duplicate findings.
- Explicitly tell the writer to remove unsupported neighbouring-context details and replace section-by-section recaps with a short connected answer.
- Clarify that final coverage should use the minimal sufficient direct claims. Background explanations remain useful outside that map.
- Keep all existing support, coverage, repetition, attribution and summary checks. No new evidence, approval, model, retry or production changes.

## Verification and remaining work

60 focused offline tests and TypeScript checks passed. A scripted pipeline test verifies the exact rejection explanation reaches the single correction request. These prove software behaviour, not live model improvement or religious accuracy. No paid request was submitted automatically.

Live completion and answer quality remain unverified after this repair. Translation lookup diagnosis and the missing hadith translation remain open. The broader search-engine acceptance gates remain open.
