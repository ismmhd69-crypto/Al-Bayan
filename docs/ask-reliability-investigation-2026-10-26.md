# Ask reliability: deeper investigation

Date: 26 October 2026. Read-only investigation; no application changes or model generation calls.

This supplements [the phased repair plan](ask-reliability-repair-plan-2026-10-26.md). It checks the external reports against the active code, saved requests and responses, environment-file configuration, and read-only database metadata.

## 1. The available library and the active search route are different

Metadata-only HEAD requests to the Bayan project returned:

| Record category | Total stored sources | Published sources | Approved search-document rows joined to published sources |
| --- | ---: | ---: | ---: |
| Hadith | 14,629 | 14,629 | 14,629 |
| Fatwa | 7,388 | 7,255 | 7,255 |

These are fresh counts, not the external report's estimate of roughly 300 fatwas. Search-document counts are rows, not a proof of unique-source coverage. Published and approved-search metadata do not establish current rights eligibility, authenticity, complete context, collection completeness, or retrieval quality for a particular question. No source text or user data was downloaded in these metadata reads.

The loaded environment files select `HADITH_SOURCE=hadeethenc`; `ASK_CORPUS_RETRIEVAL` and `ASK_DISTINCT_SELECTION` are unset. The three inspected traces also record `hadith_mode_hadeethenc` and contain no corpus-discovery events. Environment-file inspection is not inspection of every already-running process's environment.

Relevant code:

- `lib/ask/pipeline.ts:242` selects HadeethEnc discovery; `:247` selects stored-hadith discovery only for library mode.
- `lib/sources/hadith.ts:236` searches cached title lists. Subsequent meaning ranking cannot recover a source absent from that initial candidate pool.
- `lib/ask/pipeline.ts:219` installs broader corpus retrieval only when its separate flag is enabled. Backend readiness and acceptance gates are separate again.
- `lib/sources/hadith-library.ts:35` contains an existing stored-source search route. Its existence does not establish that it is ready to enable unchanged.
- `lib/sources/quran.ts:105` uses Quran Foundation remote search. Production configuration without a chapter override removes the app's chapter restriction; it does not prove a local index of all 6,236 verses or fresh remote completeness.

**Conclusion:** investigate and validate routing to the existing approved library before treating missing relevant material as a need to loosen source-support checks. Do not automatically enable a corpus backend or swap discovery routes based only on counts.

## 2. Scholar search is neither just 300 fatwas nor unrestricted full-page explanation

`lib/sources/scholars.ts:46` calls approved search-document retrieval and then reads published fatwa records. In the rich path, `meaningCandidates` bypasses a later title-only relevance gate (`:87`). However, short-excerpt and source-eligibility rules still apply. The all-variants route rejects source originals longer than 600 characters (`:101`); live scholar extraction also uses bounded excerpts.

`lib/ask/pipeline.ts:108` forces library-flow behavior for rich requests. In `scholarQuotes`, `allVariants` suppresses the ordinary live-search branch (`:52`). The stable flow calls live scholar recovery only from `candidatesFor(group, recovery)` after an eligible recovery decision.

Therefore a failed initial scholar selection can prevent the route that would seek a better live excerpt from running. A log saying live scholars are enabled is not proof that live discovery ran for that attempt.

The checked-in search RPC definition also applies a shared top-50 result ceiling before callers filter source families. This is a potential cross-family ranking bottleneck, not a proven cause of the one-hit examples. Confirm the deployed function and inspect truncation/wrong-kind counts before proposing a database change. This investigation made no schema or RPC change.

## 3. A scope mismatch aborts selection, but dropping it alone does not repair the recorded answer

`lib/ask/retrieval.ts:462` treats `partial` plus contribution role `direct` as a direct contribution. At `:471`, a direct contribution whose scope decision is not yes returns a failure for the entire package.

In trace `1347add9-4c58-4c45-a7d5-89ed01ac1dca`, selection A12 contains 16 assessments. Q4:174 has relevance partial, role direct and scope unsure, causing `source_scope_mismatch`.

A read-only counterfactual scan of the saved assessments removed Q4:174 and counted the remaining rows against the existing direct/background eligibility conditions. Result: **zero eligible direct rows and zero eligible linked-background rows**. This scan is not a modified-parser replay and not a religious judgment on those verses.

**Conclusion:** candidate-local rejection may improve resilience, but the proposed test “drop Q4:174 and the other valid verses now form an answer” is unsupported by this saved response. Better discovery or a corrected, evidence-grounded classification is still needed. Do not manufacture coverage by transferring related requirement IDs into proof IDs.

The same field currently mixes two different questions: whether a source is applicable to the proposed statement, and whether it fully resolves the visitor's concern. The example's assessment mentions that the passage does not explain the content of the proof. Determine whether that calls for a background role and further research, rather than treating it as an unsafe audience/scope mismatch. Preserve actual restrictions and conditions.

## 4. Background is not universally excluded

`retrieval.ts:489` records explicitly linked, context-safe, distinct background; `:528` constructs its package entries with `explanationRequirementIds`; `:533` allows a context-only partial source package. The writer accepts these explanation links separately from complete-answer coverage.

In trace `1347add9`, draft requests A10 and A15 actually contain HE65195 as the sole hadith passage. Their source-group instructions explicitly set `must_answer_every_question_concern: false`. The background reached writing. Its failure was later usefulness/support/attribution, not a universal prohibition on contextual evidence.

Existing `tests/patient-models.test.ts` also checks that background can form a partial package without satisfying full coverage. The focused patient-model and contribution-selection run passed 31 tests with no network or model calls. This proves existing contract behavior, not that the saved religious explanation should be approved.

**Conclusion:** keep discovery relevance, explicit statement support and full-answer completeness separate. Broader relevance is appropriate at discovery; it is not a substitute for support of a displayed statement.

## 5. Cross-source isolation occurs before and during writing

`stable-lanes.ts:125` selects a package independently for each source family; `:140` passes only that package to `checkPatientSource`. `patient-models.ts:78` then runs source-only writing and checking. `source-writing-boundary.ts:13` further filters prompt passages to sources citable by the requested section and removes provisional sibling drafts/planning prose.

Saved draft requests confirm single-family packages in the three investigated traces. A Quran draft does not receive an approved scholar explanation merely because a separate scholar lane could retrieve it later.

**Conclusion:** deleting the writer filter alone cannot supply missing sources. A repair needs a defined shared, verified explanatory-context mechanism at package construction and checking, not just more prompt text.

Any such mechanism must preserve:

- Original source identity and explicit attribution. A scholar's interpretation must not appear as words directly established by a verse alone.
- The same relevant originals and restrictive context for writer and reviewer.
- No provisional sibling draft, generated plan, or rejected claim used as evidence.
- Immutable commits. A later-discovered explanation cannot silently change an earlier published section.
- Bounded dependency handling. A group needing a particular explanation may wait for that evidence; an independent group should not wait for all research.
- The agreed canonical reading order.

The design gate must decide how a cross-source dependency is cited. If section citation rules remain single-family, put interpretation requiring a scholar in the scholar section or final synthesis. If an attributed explanatory dependency is permitted inside a source section, update and validate its citation contract explicitly. Never pass it as uncitable context and let the writer borrow its meaning anonymously.

## 6. Recovery currently conflates opportunities with eligibility

`patient-models.ts:73` allows recovery for explicit evidence-gap codes but excludes malformed/empty assessments and scope mismatches. `stable-lanes.ts:126` uses this predicate to decide whether to research again. Both recorded empty scholar assessments and the Quran scope mismatch bypass this recovery branch.

Blindly adding every failure code to the evidence-gap list would spend on new searches for broken model envelopes. The plan instead needs separate outcomes:

1. Valid assessment with missing evidence: bounded new-query recovery.
2. Empty/incomplete or contradictory assessment: bounded reassessment/contract correction using the existing pool first, without approving anything from the broken result.
3. Ineligible individual candidate: exclude or reclassify it only under an explicit validated rule, preserve independently valid candidates, then calculate real remaining gaps.
4. Unknown IDs, unsafe conflicts or structural corruption: fail closed; no silent filtering into approval.

A required scholarly explanation should be represented as an evidence dependency so recovery can request the relevant approved source family, instead of endlessly re-searching the same family. This requires a deliberate scheduler/package design; it is not implemented by this investigation.

## 7. The writing and transport problems remain separate

The source-only writer allowance is 2,200 tokens (`rich-writing-schema.ts:2`), while the adapter requests medium reasoning (`lib/ai/openrouter.ts:48`). Recorded output cutoffs explain some backup use. Tune allowances from measured visible/reasoning token use under the same aggregate limits; do not disable reasoning automatically or treat an arbitrary larger limit as acceptance.

Wide strict audits are already partitioned, with full local validation. The English post-repair trace passed that transport stage and still failed content checks. Do not implement the same schema repair again or claim it solves the writing failures.

The continuation transport catches thrown dispatch errors under a billing-uncertain result (`continuation-session.ts:192`). A trusted pre-dispatch operator refusal is different from an unknown charge after sending a request. Correct the distinction without clearing genuine unknown charges or expanding the operator allowance.

## Investigation limits

- Read existing code, private traces and saved provider responses; inspected only allowlisted non-secret environment settings.
- Performed read-only database metadata HEAD requests. No database mutations, source downloads, live search RPC, model generation, deployment or application edits.
- Did not establish rights eligibility for every stored source, verify the deployed RPC body, prove complete collection coverage, or judge every rejected religious statement.
- Exact copying matches still need a separate claim-level review. A rejection code alone does not prove a false positive.
- No browser retest was needed for this documentation investigation; the earlier live failures remain failures.

The updated phased plan should prioritize the stored-library route and source eligibility, dependency-aware explanatory context, explicit selection/recovery outcomes, and then the independent writing and output-budget failures.
