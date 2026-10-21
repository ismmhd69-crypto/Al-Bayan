# Patient sections: shared failures and remaining repair

21 October 2026. Local preview only. No production release or automated paid request.

## Evidence from owner attempts

The worship attempt `a571676e-597c-4a7a-95b5-ed4af663271d` finished after 123.941 seconds. Quran arrived after 115.906 seconds. The overall local budget was already disabled, but scholarly transport still installed its own short AbortSignal timeout. Thus a missing scholar warning was real despite the overall unlimited setting. Completing the other sections did not satisfy the requested experience.

The newer repentance attempt `0e78bb6a-c983-47cb-a77c-285000581c14` had Quran, the directly relevant HE5438 and a scholarly excerpt selected. Evidence was sealed at 64.045 seconds. The initial Quran draft was empty. Other drafts appended bracketed source IDs and requirement labels after their sentences. The shared parser treated those trailing labels as additional sentences and rejected every group. A single correction filled the Quran section but repeated the same labels in all groups, so all were rejected at 70.680 seconds before semantic checking. This blank response was not an overall timeout or absence of source material.

## Implemented local repairs

- Quran, live scholar, HadeethEnc, Sunnah and scholarly display-translation transports use the existing request timing policy. In unhurried local development they do not install the former short application timers. The non-library scholar wrapper also follows that policy. Production and bounded worker timing remain unchanged.
- Only a trailing citation list and requirement label exactly duplicating that claim's structured fields are removed. No religious wording, references, provenance or support criteria are changed. Mismatched and unknown labels are not repaired. The resulting text still passes all parsing and independent semantic checks.
- The writer explicitly receives the instruction to put source IDs and requirement IDs in their dedicated fields, not in sentence text.
- A Quran/hadith section check does not await an unrelated scholarly display-translation lookup.

120 focused tests passed across nine files and TypeScript checks passed. After adding the translation non-blocking regression, 25 focused tests across three files passed again, with TypeScript checks and whitespace validation. Tests use simulated waiting and invented evidence. No real religious answer was automatically submitted.

## Required staged-processing repair, still open

The current control flow is search all groups, rank/select, run recovery, then call the rich writer. Within the rich writer the first section can stream independently; that is not enough because slow scholar research still holds the earlier entry point. Its remaining sections also share a writing/checking job.

The replacement must use explicit research and section states, not merely increase a number:

1. Start applicable source discovery concurrently. Maintain per-concern coverage and pending/ready/failed states separately from empty results.
2. Prepare and independently check the first available source explanation against the evidence and restrictions available so far while pending source work continues. Preserve source-role limits and hold unsupported practical conclusions.
3. Publish each checked section in Quran, hadith, scholar order. A pending group is pending, not a terminal timeout or a claim that no evidence exists. Do not insert a terminal missing-group placeholder that would prevent the actual section being sent later.
4. Make supplementary evidence immutable revisions. Final checking must see all newly discovered restrictions and all previously emitted claims. Withdraw earlier content if later checks invalidate it. Never silently reuse an older package after potentially conflicting evidence is found.
5. Produce the direct cited summary only after necessary coverage and consistency checks. Persist completed conversation content only at the terminal result. A failed external request, exhausted evidence or invalid model response remains an explicit failure; waiting longer cannot manufacture missing support.
6. Keep cancellation and disconnect handling across the actual source HTTP calls, pending writers and checks. Add recorded mixed-source tests where the scholar service is delayed substantially beyond the first Quran/hadith section. No automatic extra model retry or unapproved evidence promotion.

Before production this needs the existing durable-worker integration and deployment acceptance. A browser stream alone does not remove a hosting function's execution limit. Removing production timers from the existing short route would not implement durable work.

## Acceptance still required

- First checked Quran/hadith reaches the visitor while scholarly research is demonstrably still pending.
- Delayed scholar explanation arrives, and the final summary checks all sections together.
- Late contradictory context visibly withdraws affected earlier material; no incomplete material is saved as complete.
- Source outages, malformed model output, unsupported content, translation gaps and user cancellation are handled separately.
- Source-faithfulness and multilingual review, measured live performance and owner acceptance remain open. The current patches do not establish these outcomes.
