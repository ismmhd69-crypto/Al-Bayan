# Patient sections: shared failures and staged repair

21 October 2026. Local preview only. No production release or automated paid request.

## Latest implementation checkpoint — 21 October, evening

This checkpoint supersedes the older “still open” implementation description below. It does not supersede its recorded failure evidence or release requirements.

| Ordered phase | Implemented | Offline verified | Live verified | Accepted |
|---|---|---|---|---|
| 1. Parsing, correction and scope | Existing strict envelope/metadata repairs retained. General explicit teaching no longer always needs a scholar. Personal ruling applications retain that requirement. | Parser, correction, coverage and rich-writer regressions; full suite below. | Recorded failures are baseline evidence, not a repaired live comparison. | Pending source-faithfulness and owner review. |
| 2. Evidence discovery | Enabled meaning mode retains candidates despite unfamiliar titles; per-concern searches, original-context eligibility, complementary contributions and bounded recovery feed the patient adapter. Embeddings stay gated. | Invented-source integration exercises real selector, writer and checker adapters; no reference hints required. | No new paid comparison. | Pending reviewed corpus/recall and answer evidence. |
| 3. Durable lifetime | Encrypted checkpoint and protocol-v2 events persist atomically; same-job Continue; long-lived worker has no elapsed answer cutoff. Heartbeat, lease fencing, cost and uncertain-billing guards remain. | Local PostgreSQL verification, including v2 pause/continue ownership and fake journalled model transport; simulated work beyond ten minutes. | Remote migration unapplied; no real worker started. | Storage/privacy, worker hosting, recovery and operational acceptance pending. |
| 4. Staged delivery | Sources research concurrently. Independently checked sections publish in order while later research continues. Final checking may revise/withdraw earlier material. Required gaps pause instead of completing. | Delayed-scholar integration and real-component fake-service browser checks; same-job Continue and no premature save. | Normal port 3000 still uses existing path; patient gate off. | Live source-faithfulness, latency/cost comparison and Mo acceptance pending. |
| 5. Reading and translations | Reuses deduplicated citation/source cards, exact-excerpt translation provenance and checked display translation policy. Adds localized provisional, paused and summary-waiting states. | English browser continuation; Arabic 390×844 and German 1440×900 pause views, no horizontal overflow or broken citation targets. | Read-only translation metadata inspected; no translation written or approved. | Native-language and actual translation availability acceptance pending. |

### Files and boundaries

`patient-engine.ts` is the provider-independent coordinator; `patient-pipeline.ts`, `patient-models.ts`, `patient-framing.ts` and `patient-server.ts` adapt the actual search/model/checking interfaces. `patient-worker.ts` installs the existing model journal and lease protection. `patient-protocol.ts` validates ordered, revisioned events independently of the old stream protocol.

The existing staged `20261020145023_ask_research_jobs.sql` migration now includes private encrypted checkpoints and owner-bound continuation. It has **not** been applied remotely. API/browser v2 is selected only behind the separate patient flag, with the existing durable, rich and worker-acceptance gates. Version-1 jobs, JSON responses and approved prepared answers retain their existing contracts. Prepared reuse remains an approved prepared result, never a newly approved automatic explanation.

Continue reuses checked work but retries actual evidence gaps, including successful searches that were insufficient. A changed evidence revision must recheck and visibly replace its old explanation. Invalid event data or response sequence never displays progress and never starts an automatic paid retry. Cancellation and uncertain billing retain their existing restrictions.

Source revalidation is fail closed: historical excerpts must still be eligible before a reconnect can replay them. A revoked original currently withdraws access to the entire job under the existing source-change policy rather than replaying revoked text. Restoring a partially redacted history is not implemented or claimed. This conservative behaviour needs operational acceptance before rollout.

### Translation finding

Read-only production metadata for official fatwa 12605 found one published original and English/German translation rows. Both translations were AI-origin, unpublished version-1 drafts without reviewer/date. They are ineligible for the published exact-excerpt display lookup. No text, publication or approval record was changed. One current originals lookup took 2,314 ms; that demonstrates why the previous 1,500 ms application limit was too short, but is not proof of the exact cause of an older request. The unhurried timing repair removes that short local/worker timer. Preparation, exact-excerpt checking and review are still required before these translations can appear.

### Verification and remaining gates

The offline browser harness has `patient-slow` and `patient-pause` scenarios, real React/CSS, invented evidence and fake HTTP. It does not load credentials, contact Supabase or invoke models. In the slow scenario, two source sections were readable with the job running and zero saves; completion produced one save. Pause/Continue retained one job and one initial request, with zero saves before continuing and one afterward. These are implementation checks, not religious accuracy evidence or live latency measurements.

Paid evaluation remains blocked by the existing unreconciled reservation; the ledger was not reset. No six-question live comparison, 30% latency finding, independent scholarly/native-language acceptance or production release is claimed. See the current implementation record for final automated counts.

Final automated checkpoint: **1,132 tests passed across 98 files**, full-project TypeScript passed, and **21 local PostgreSQL verification groups passed**. The database verification report records migration SHA-256 `693a27f03774dea2378cca8346aedd06cdc6cf0519c64e7d7e5f7b06b89474ee`; its storage remains staged and unapplied remotely. These counts establish tested implementation behaviour, not correctness of a religious answer.

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
