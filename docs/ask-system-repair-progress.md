# Ask system repair: implementation record

Updated: 22 October 2026. Implements [the phased plan](ask-system-repair-phased-plan.md). This record separates engineering evidence from live answer quality and acceptance. No production deployment or remote migration has been performed for this repair.

## 1. Original baseline

**Implemented:** `scripts/record-ask-repair-baseline.ts` replays the recorded JSON envelopes and checker decisions from the six audited attempts. It records input/output fingerprints, diagnostic codes and counts without copying private questions, originals or conversation history into the report. Existing private trace access and retention rules still apply.

**Offline verified:** all six traces were available in the before-change snapshot, `work/private-ask-evaluation/system-repair-baseline-20261021-before.json`. Two tool tests cover replay identity, malformed envelopes and absence of private content in reports. This replays the affected envelopes; it is not a full end-to-end semantic replay or a religious-accuracy benchmark.

**Live verified / accepted:** pending. The recorded positive checker verdicts remain model verdicts, not accepted source-faithfulness results. The fixed multilingual and held-out review set still needs completion.

## 2. Harmless metadata normalisation

**Implemented:** rich selection clears a scholar-only position label on a known Quran/hadith candidate in code and logs the normalisation. Unknown identities, original wording, eligibility, context, scope and conflict checks are unchanged. The legacy parser remains unchanged.

**Offline verified:** focused pipeline tests show that the known-label repair needs no extra model call, while an invented identity still fails. This does not repair malformed internal JSON or raise citation limits.

**Live verified / accepted:** pending.

## 3. Focused support and answer-quality checks

**Implemented:** `lib/ask/focused-checks.ts` separates exact cited-original support from whole-answer usefulness, coverage and consistency. Support has supported, unsupported and uncertain outcomes. Grounding receipts must identify the exact cited original and contain an exact quote; adjacent context cannot supply uncited support. A positive usefulness result cannot override failed support. Display-translation alignment has a separate contract.

The actual rich and patient adapters expose this preview through `ASK_FOCUSED_CHECKS`. Its value changes durable-job identity. The switch remains off by default and has not been enabled in the local owner-testing environment.

**Offline verified:** scripted checks cover exact-original identity, restrictive context, stale hashes, invented identities, uncertainty, malformed results, contradictory repetition findings and actual rich-path ordering. Well-formed negative findings now trigger a separate partial-quality check of surviving source explanations; safe groups can remain visible without a summary or completed save. Malformed checker envelopes never yield approved fragments. A matching quote is provenance, not proof of semantic entailment. The new checking phases have fixed, privacy-safe diagnostic labels.

**Evaluation preparation:** `scripts/evaluate-ask-focused.ts` now uses the actual rich request builder and focused support builder. It prepares 96 component inputs: 72 existing paired cases and 24 drafted variants of the recorded uncited-context and causal-benefit failures, across three languages, with/without restrictive context. The default small run is six claim cases, not six complete questions. Exact-input source/language review and billing reconciliation are required before paid calls. Models remain unchanged; actual fallback routes, conservative per-run spending reservations, malformed responses, uncertainty and semantic verdicts are reported separately. See [comparison instructions](ask-focused-checker-comparison.md).

**Live verified / accepted:** pending. The 96-input dry run made no calls; its labels and language variants remain unreviewed. It is not an accuracy result. The older, empty legacy-audit report does not satisfy this gate. Additional checker calls must be included in cost and timing measurements.

## 4. Necessary and distinct evidence packages

**Implemented:** a separately switched `ASK_DISTINCT_SELECTION` preview replaces quota filling with an explicit plan of necessary and optional contributions. Complementary passages may jointly establish one contribution, and several contributions may answer the same concern. Code preserves all necessary excerpts, rejects plans citing ineligible or non-distinct sources, retains limited-example scope and complete named passages, and skips optional joint contributions atomically if they exceed limits. Separate eligible excerpts from the same page may be retained when both are necessary.

The plan is labelled planning data, never evidence. It reaches writing and quality checking; final coverage must retain the citations needed for every necessary contribution. A complete plan does not make an unsupported sentence acceptable. Empty source groups alone do not trigger recovery in this preview. Rich and patient selection share the contract, and the switch changes durable-job identity. Defaults and production remain unchanged.

**Offline verified:** 26 selection cases cover redundant direct fatwas, complementary partial evidence, necessary conditions, atomic source limits, direct general teaching without a scholar quota, unknown/duplicate identities, scope, differing scholarly positions, complete named passages, retained final coverage, privacy-safe diagnostics, malformed enum arrays and patient background previews. Two additional real-pipeline cases cover the tiered and non-tiered selection paths. The existing chooser remains available for compatibility.

**Live verified / accepted:** pending. Semantic distinctness and the model's proposed completeness still need reviewed multilingual and held-out evaluation. A selector flag alone is not proof that an added source contributes useful meaning.

## 5. Additional shared-path defects repaired

**Patient framing:** the worker asked for interpretation objects, while the shared planner instructions and parser expect labels. The schema now requests labels and code assigns I1/I2. An offline regression preserves both interpretations and clarification without a needless retry. This does not weaken the parser or guess malformed JSON.

**German hadith discovery:** `searchHadithMulti` previously ignored German queries. It now searches German phrases against the German catalogue, alongside other requested languages. A mocked provider test demonstrates that German-only queries reach discovery and a weak report still fails Arabic authenticity checks. The provider still uses title matching; this small fix is not the planned corpus-wide meaning-search repair. Real candidate quality, source outages and multilingual latency remain unverified.

**Translation batch checks:** the focused preview rejects identity/hash mismatches, unknown IDs, duplicated entries and malformed translation-check decisions as a whole. Missing checks remain not checked; a checker outage is no longer labelled a lookup failure. An otherwise valid batch can independently reject one translation without removing another checked translation or supported Arabic explanation. No translation generation, publication, database change or approval change was made.

## 6. Original-passage discovery and independent patient research — 22 October

**Implemented:** both server paths can select the persistent original-passage store through `server-corpus-router.ts`. The default remains local. Persistent selection requires explicit index acceptance, uses only manifest/search operations and cannot silently fall back to another backend. Family controls apply before storage or embedding work. Production cannot use the local lexical-only preview as accepted semantic search. The new configuration participates in durable-job identity. No environment flag, remote migration, source permission or accepted embedding profile was changed.

Patient Quran research no longer awaits a shared hadith/scholar index promise. Hadith and scholar original-passage discovery run separately alongside their own providers. Eligible indexed evidence can survive a provider outage, with the partial failure retained in the section and checkpoint. Disabled sources are reported as unavailable; failed searches with no eligible material are not reported as successful empty searches. A failed parallel scholar provider is reported even when another provider returns usable evidence. Cancellation stops pipeline waiting even when a test connector ignores its signal.

The patient path no longer cuts each hadith/scholar pool to twelve candidates before meaning ranking. A bounded round-robin pool preserves space across concerns and source families; final selection and evidence limits still apply. Search provenance is not evidence coverage. Original-text eligibility, current source validation, selection and independent checks remain necessary.

Semantic queries and meaning ranking now retain each concern's own scope, essential conditions, negation and interpretation. Unrelated conditions are not merged into it, and invalid oversized meanings fail before ranking calls. Conflicting reads of the same source identity are rejected instead of silently retaining the first original or attribution. Merged aliases preserve restrictive context and reject conflicting context originals.

**Offline verified:** the latest full suite passed **1,212 tests in 108 files**, including additional partial-outage/checkpoint repairs; TypeScript and whitespace checks passed. Scripted cases demonstrate Quran and Sunnah publication while scholar discovery remains pending, candidate access beyond the former cutoff, index rescue during provider outage, cancellation, backend gating, condition preservation and changed-source rejection. `npm run ask:index:verify` passed fourteen groups against actual local PostgreSQL/pgvector execution with invented sources, permissions and vectors. No real multilingual query inference or source-faithfulness evaluation was performed.

**Live verified / accepted:** pending. The persistent connection exists but is not activated. Production model/hosting acceptance, eligible index preparation, equal-access ranking comparison, operational storage/privacy/recovery checks, multilingual source review and Mo's acceptance remain open. These changes establish neither corpus-wide recall nor answer accuracy.

**Output-contract investigation:** saved public OpenRouter model metadata advertises structured output for all four current chain models. This is capability metadata only, not proof that a routed generation obeys a strict schema. No schema-enforced request was enabled and no inference request was made. Writer-contract simplification remains open.

**Owner availability:** Mo cannot provide the missing receipt now and instructed offline work to continue. The outstanding reservation is retained; no further receipt request, paid evaluation or ledger bypass is required for offline implementation.

## 7. Writing contracts and targeted correction — 22 October

**Implemented:** `OPENROUTER_STRUCTURED_OUTPUTS=true` now opts the current OpenRouter adapter into a JSON-schema request with `strict: true` and `require_parameters: true`, preserving privacy preferences. It closes nested object shapes, preserves the declared required/optional distinction and validates the entire returned object locally. Unsupported declared schema vocabulary fails before transport. Extra fields, wrong types/enums, missing required fields, oversized arrays/text and malformed/wrapped fragments are rejected without healing, coercion or another automatic formatting call. A 400 never silently downgrades this preview. The existing legacy mode and current model chains remain unchanged. The switch changes durable-job identity and remains off locally.

The implementation follows [OpenRouter's structured-output contract](https://openrouter.ai/docs/guides/features/structured-outputs). That documentation explicitly warns that support and enforcement vary by endpoint. Public model metadata advertises support for the current four chain models; neither metadata nor the local validator proves that a live routed model follows the contract or understands source meaning. Real-route compatibility and cost measurements remain pending.

Rich correction now records failures per section. A rejected first explanation and a rejected later section share the existing one-correction allowance without rewriting valid siblings. Corrected subsets merge back into the retained draft instead of replacing or losing untouched sections. A transport-failed group receives no automatic retry and cannot consume an eligible sibling's correction allowance. Exact rejected wording/citations and checker/format findings still accompany the same sealed evidence. No overlap threshold or citation ceiling was raised.

If summary writing or guidance remains invalid after that bounded attempt, the ordinary combined checking stage checks the surviving source drafts and later context. Only checked, useful groups survive; the summary is withheld and the result remains incomplete. A known unsupported source group stays withheld. Malformed envelopes and provider failures yield no recovered draft fragments. This does not approve drafts merely because their neighbours passed.

The shared draft parser also rejects malformed citation entries instead of silently discarding them beside a valid reference. It reports `invalid_citation` for the bounded correction; it never guesses a replacement identity.

**Offline verified:** latest full run: **1,252 tests passed in 109 files**, 22 October 2026. Actual rich writer/checker request builders run through the strict adapter with stubbed transport in the normal two writing/two checking route. Tests separately reject invalid full responses, preserve privacy, reject schema errors before calls and prove no downgrade on 400. Targeted correction tests demonstrate only the failed groups being rewritten once, retained safe sections after summary/guidance failure, rejection of unsupported siblings, and both legacy/focused checker paths. TypeScript passed. These are scripted shape/orchestration results; no live inference or religious-accuracy review occurred. The spending-ledger SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`; strict output is absent/off in `.env.local`.

**Live verified / accepted:** pending. Strict output remains off, editorial overlap/citation review remains open, and the shared patient-job spending/call policy still needs its full operational acceptance. Neither this flag nor successful offline correction establishes reliable answers across all questions.

## 8. Continuation without losing valid research — 22 October

**Implemented:** private patient checkpoints now keep requested recovery groups separately from the last eligible evidence. Requesting additional research no longer overwrites a ready evidence group with a failed marker. A failed or empty recovery retains revalidated earlier evidence and checked display material, records the unfinished group and pauses when necessary. Revoked originals are still withdrawn before research. Changed recovery evidence/context receives a new evidence revision and fresh section checking; unchanged originals can reuse the checked wording, followed by the final combined check.

The continuation path can restore an unchanged checked section from an attention notice without fabricating new wording or treating a progress notice as evidence revocation. Whole-answer checking remains required for completion. The checkpoint addition is optional and retains the existing version-2 protocol, encrypted private checkpoint storage and event order; no database migration or production change was made.

Combined selection now distinguishes explicit evidence-gap rejections from malformed/contradictory model decisions. Invalid combined output pauses explanation work without invoking the recovery planner or marking completed source searches for repetition. If a bounded recovery reaches a malformed reassessment, research stops rather than treating that technical failure as another missing source. A manual continuation revalidates existing evidence and retries the unfinished selection/explanation stage. The request journal still blocks uncertain paid outcomes; no billing reservation is reset.

**Offline verified:** latest full run: **1,262 tests passed in 109 files**, 22 October 2026; TypeScript passed. Focused coordinator/pipeline cases cover failed and empty recovery, retained immutable input checkpoints, revocation, changed context, unknown retry groups, uncertain billing, malformed combined decisions and recovery stopping after a malformed reassessment. Actual scripted pipeline continuation completes without rerunning Quran, hadith or scholar providers when only combined selection failed. These are behavioural checks with invented evidence, not source-faithfulness acceptance.

**Live verified / accepted:** pending. Patient execution remains gated. Remote storage/privacy/recovery acceptance, real worker reconnection, complete multilingual review and owner acceptance are still required. More precise recovery targets for genuinely incomplete combined evidence remain open; this change removes technical failures as a reason to repeat completed research, rather than claiming every semantic gap is fully diagnosed.

## 9. Educational previews and truthful source outcomes — 22 October

**Implemented:** a case-specific ruling concern no longer blocks every early source explanation merely because scholarship has not arrived. Quran/hadith explanations still use the same source support, attribution, scope and personal-application checks. Required scholarly evidence continues to gate the combined final answer; no personal conclusion is issued by relaxing an early group-wide block.

Patient research now distinguishes an independently assessed group with no useful/direct contribution from a failed provider. Valid but unrelated or unsafe-for-use candidates can resolve the group without forcing a source quota or an outage message. Malformed partial selection is an explanation/checking problem; scholarly differences require further attention rather than being labelled transport failures. A genuine partial source outage still prevents a misleading successful-empty result.

Snapshots carry explicit per-group outcomes into combined checking, preserving unavailable, search failed and failed explanation as separate states. A disabled optional source therefore remains unavailable in the final answer; it is not relabelled as a failed search. A malformed partial check can be independently repaired by the later combined selection/writing/checking path, with no invented source-outage warning.

**Offline verified:** latest full run: **1,268 tests passed in 109 files**, 22 October 2026; TypeScript and whitespace checks passed. Scripted cases show checked Quran and Sunnah educational sections while scholar research is delayed on a case-specific concern; missing necessary scholarship withholds the summary and pauses. An independent personal-application rejection still withholds the explanation. Further cases cover valid unrelated candidates, technical selection failure, disabled sources and genuine provider outages, including completion from other sufficient evidence without filling source quotas. No real religious case or semantic quality claim is approved by these tests. Spending-ledger hash remains unchanged; no paid request or production activation was made.

**Live verified / accepted:** pending. Patient execution remains gated and the source-faithfulness/language/owner review remains open. The change removes blanket waiting and inaccurate failure reporting; it does not establish that the models always distinguish general teaching from personal application correctly.

## 10. Translation availability diagnosis and exact-excerpt matching — 22 October

**Implemented:** scholarly display lookup now checks scholar identity alongside canonical page and exact Arabic original, resolves eligible stored identities and the existing numeric-page presentation aliases, and considers all matching originals. A generated live ID is never treated as sufficient database identity. Conflicting same-version text, defective published provenance and truncated batches fail explicitly instead of selecting whichever row arrives first. Publication, language, provenance and independent exact-original translation checking remain required.

**Read-only database evidence:** `scripts/audit-ask-display-translations.ts --read-only` found 7,255 unpublished English rows and 7,255 unpublished German rows attached to published fatwas, with **zero published rows in either language**. These are row counts, not distinct-source coverage. Actual lookup probes for a stored original and a synthetic same-page URL alias reached the translation table and correctly returned unavailable. All requests were GET/HEAD; no draft was published, generation invoked or source/translation text copied into the report. See [the availability report](ask-display-translation-availability.md) for scope and preparation gaps.

**Offline verified:** full suite: **1,277 tests passed in 109 files**; TypeScript and whitespace checks passed. Matching, wrong scholar/excerpt, multiple original rows, defective provenance, conflict, truncation, unpublished material and target-language boundaries are covered with scripted records. Real positive attachment is not proven: the currently eligible published pool is empty.

**Live verified / accepted:** the actual read-only transport and missing-translation result were verified. Translation fidelity, native-language review, eligible prepared material and Mo's acceptance remain pending. The existing exporter considers both drafted languages done even when neither is display-eligible; repairing that preparation distinction is still required. This diagnosis is not permission to publish old drafts or bypass approval. No production, migration or spending-ledger change was made.

## 11. Preparing existing translation drafts instead of declaring them done — 22 October

**Implemented:** `translation-preparation.ts` and `scripts/prepare-ask-translation-review.ts` provide a bounded, separate review workflow for already stored translations. The legacy untranslated-source export is not reinterpreted as a review/export command. The new path reuses current rights-filtered source reading, requires short eligible Arabic scholar excerpts, preserves exact originals and translation bytes, and binds candidates to source/current-original fingerprints, language, version and claimed provenance. Missing languages remain explicit. Mismatched/defective batches and duplicate versions are rejected; neither existing bilingual drafts nor claimed review metadata becomes approval.

The CLI permits only a read-only preparation operation, a source-count bound and a validated pagination cursor. It performs no inference or database mutation, saves private packet/readable review/report files, and revalidates current source identities/permissions immediately before saving. The existing management reader uses its fixed read-only database-query endpoint; translation reads permit only GET/HEAD to Bayan's project. Source/index permissions are not interpreted as embedding rights. No packet is automatically consumed by the website or publication importer.

**Read-only verification:** the first real batch at `work/private-ask-evaluation/translation-review/packet-2026-10-21T23-30-55-226Z.json` contains **six eligible sources and twelve existing draft candidates**, no missing language candidates, and immediate source revalidation. All alignment, qualifications, native-language and owner checks are pending. The original used at legacy translation creation is explicitly unrecorded, rather than fabricated from today's hash. The separate readable companion was generated from the unchanged packet after verifying its checksum. No source/translation text was printed in logs, paid call made, row published or approval altered.

**Offline verification:** latest full run: **1,297 tests passed in 110 files**, 22 October 2026; TypeScript and whitespace checks passed. Invented-input cases cover existing bilingual drafts, missing German, changed original/translation/metadata, revoked/expired rights, overlong excerpts, unofficial sources, missing scholar attribution, malformed batches, duplicate versions, claimed review and literal rendering. This proves preparation boundaries, not translation faithfulness. The spending-ledger SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.

**Live verified / accepted:** the bounded read-only exporter and source revalidation were exercised. Native-language/source-faithfulness review, eligible prepared translations, operational retention/revocation handling and owner acceptance remain open. Files being prepared is not a reason to turn on draft display or publish material. No production/migration/spending-ledger changes occurred.

## 12. Ranking comparison with common original access and limits — 22 October

**Implemented:** `matched-ranking.ts` freezes a common eligible source/context pool and the complete question frame, then compares explicit concern/family ordering with the actual meaning ranker under the same downstream cap. Both outputs use the actual shared evidence selector and the same provider/configuration; an implicit second ranking pass is disabled. Source replacement, changed inputs, malformed ranking results, cancellation and invalid cost observations fail rather than silently changing methods. Run order may be counterbalanced. No website default is altered.

The exact reranker request builder is now shared by the real provider adapter and preparation. Reviewed retention labels bind exact input hashes and support joint complementary excerpts and separate qualifications. Pool absence, ranking loss, selection loss and retained complete units are distinct. Missing/unreviewed labels do not produce recall or answer-accuracy claims; retained IDs are not source-faithfulness proof.

**Offline preparation:** the dry-run-only CLI prepared six component requests across English/Arabic/German, with/without recorded restrictive context, from the existing public-source regression fixture and drafted framing. This is one subject with six variants, not six independent questions or held-out evidence. `work/private-ask-evaluation/matched-ranking-preflight-20261022-final.json` records input/context/request/code hashes, pending source/language review and pending fresh permissions. It made zero model calls, loaded no environment/provider and changed no ledger. No real ranking benefit or timing improvement was measured. See [comparison scope and remaining gates](ask-matched-ranking-comparison.md).

**Offline verification:** latest full run: **1,308 tests passed in 112 files**, 22 October 2026. Scripted tests exercise the real ranker and selector adapters, equal source/cap access, source retention, joint units, changed context/conditions, malformed rankings, cancellation, invalid cost tracking and a no-network/no-paid-mode preflight. These are orchestration and measurement-boundary checks using invented wording, not reviewed relevance results.

**Live verified / accepted:** pending. The CLI intentionally has no paid mode. A guarded live driver still needs billing reconciliation, exact-input source/language review, current source validation and the existing spending cap. Broader questions, independent discovery assessment, held-out material and whole-answer acceptance remain open. Current models, ranking defaults and production are unchanged.

## 13. Recovering missing concerns without restarting covered ones — 22 October

**Implemented:** combined patient selection now returns an explicit `missing_requirement_ids` research map. The map preserves a concern as missing when it has only partial direct support or lacks a necessary qualification; a citation alone cannot make it complete. The complete response shape and IDs are validated. Omitted supposedly complete points require validated direct contributions (and the necessary explicit plan when distinct selection is enabled); background alone is insufficient. Unknown/duplicate IDs, unsupported complete-point assertions and inconsistent/malformed maps stop explanation work rather than launching a guessed recovery search.

The same response is locally parsed as a partial contribution preview only after its envelope passes validation. This requires no extra model call and grants no answer/support approval. Recovery receives the explicit unresolved points, with the original full concern still available for the final whole-answer check. Ordinary selection callers and legacy JSON clients retain their existing contract; this new requirement is on the gated patient combined-selection path.

Paused private checkpoints carry retry point IDs separately from eligible evidence and source-group retry requests. Continuation filters provider plans and original-passage queries to those unresolved concerns, while retaining/revalidating the earlier evidence for final selection. If earlier evidence is revoked, the coordinator broadens the affected group's research rather than incorrectly retaining a narrow retry scope. Unchanged originals/context returned under another query tag reuse the validated contribution map; they do not trigger redundant per-group selection/writing. New or changed material still needs checking.

**Offline verification:** full suite: **1,314 tests passed in 112 files**, 22 October 2026. Scripted two-concern cases retain R1 material while recovery and continuation search only unresolved R2 across the applicable families. The case verifies one provider call per family, narrowed corpus-query concerns, no redundant source writer calls and no completed save while R2 remains unsupported. Additional checks cover partial direct support still needing research, malformed/contradictory maps, source revocation broadening scope and malformed persisted scopes. TypeScript passed. These are orchestration/structural checks, not proof that the model always recognises semantic completeness.

After the final contradictory ready/complete-map guard, **39 focused tests across three files**, TypeScript and whitespace checks passed again. The source-support, final coverage and spending requirements were not weakened.

**Live verified / accepted:** pending. Patient execution remains gated, and all final source-support/coverage checks remain mandatory. Durable preservation of every novel unselected recovery candidate and query across worker restarts still needs further work; this change persists selected evidence and unresolved concern scope, not an entire research history. No paid calls, database migrations, publication/approval changes or production activation were made.

## 14. Durable unfinished research and ordered checkpoint writes — 22 October

**Implemented:** the gated patient pipeline now persists an immutable, hashed private discovery revision before selecting new candidates, before each recovery-planning round, after receiving a complete recovery plan, and after each source query finishes. The checkpoint retains eligible unselected originals/context, the exact combined selection pool, attempted query outcomes, source-batch scope and per-attempt recovery-round consumption. Raw discovery never counts as checked evidence or a completed answer.

Source searches remain independent. Their checkpoint and display-event writes now share one ordered queue, preventing concurrent completions from overwriting progress or reusing sequence numbers. A worker restart can reuse a saved source discovery rather than repeat that lookup. Explicit continuation invalidates the old working pool when new sources arrive, so fresh evidence reaches combined selection. Finished or superseded recovery queries are updated in their original attempt; they do not remain falsely pending. Restarting does not reset the two-round recovery allowance. A failed progress save prevents subsequent selection against unsaved work.

Restored discovery is revalidated against current source permissions before reuse. Exact originals/context must match the stored working pool. Existing candidate, payload, event, spending and physical model-call limits remain; there is no new elapsed answer deadline or unlimited retry. Limits reject excess work explicitly. Research inventory is bounded separately from the unchanged 120-candidate model input. This is not a complete history of every source ever encountered: discarded candidates and failed pre-checkpoint lookups may need fresh read-only discovery.

The separately versioned patient stream gains a metadata-only `research_checkpoint` event with ordered revision/hash. Originals and search text stay in the existing encrypted private checkpoint; the browser sees no raw discovery. Old patient histories without this event still replay without added default state fields. Legacy JSON clients, prepared answers and saved rich answers are unchanged. No database migration is introduced by this step.

**Offline verified:** **1,326 tests passed in 113 files**; TypeScript and whitespace checks passed. New scripted cases cover simultaneous saves and exact replay, interruption before selection, progress-storage failure before AI work, newly discovered evidence on continuation, working-pool identity mismatch, pending-query completion, persistence ordering and recovery allowance across restart. These prove orchestration behaviour with invented data, not semantic or religious correctness.

The actual local PostgreSQL/PGlite storage verifier passed **22 check groups**, including encrypted unfinished research surviving worker lease replacement, metadata-only browser events, zero fake-job spending for checkpoint-only work, existing owner restrictions, cancellation and uncertain-billing protections. The report is `work/private-ask-evaluation/job-storage-verification.json`. No remote database writes or real provider requests were made. The spending ledger hash remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.

**Live verified / accepted:** pending. Patient activation, remote storage acceptance, current source-faithfulness review, multilingual answer review and the guarded paid comparison remain open. Mo is away and cannot supply billing information; work continues offline without another receipt request. No production activation, publication changes or paid inference occurred.

## 15. Mo's actual Arabic browser failures — 22 October

**Observed live, not accepted:** Mo's manual browser attempts used the existing `/api/ask/stream` rich pipeline, not the gated patient worker. The launch confirmed HTTP availability only. The failed attempts disprove end-to-end reliability of the active path; they are not evidence that the patient checkpoint change ran. See [the exact request traces, causes and remaining limits](ask-local-failures-2026-10-22.md).

The worship attempt retrieved Quran/hadith, then rejected the first Quran draft for leaving a selected background source unexplained. Its remaining draft and correction had malformed Arabic Unicode escapes and were rejected as whole responses, before independent answer checking. The money-versus-words attempt retrieved all three source groups but returned only 26 of 29 requested discovery scores, causing `invalid_reranker_result` before selection/writing. Neither recorded failure was the local overall-answer deadline. An earlier connection-aborted request is recorded separately without guessing its browser-side cause.

**Implemented:** active rich and gated patient request adapters now explicitly discard an invalid discovery ranking and retain a fair bounded pool for independent selection, without inventing scores, approving claims or making a replacement ranking call. Other errors, uncertain billing and cancellation still propagate. Ranking evaluation remains strict. Literal UTF-8 Arabic is requested in writer output; invalid JSON remains wholly rejected. Provider diagnostics identify invalid JSON, and null writer responses now report `writer_response_unreadable` instead of misleading refusal/status errors.

**Offline verified:** the full suite passed **1,333 tests in 114 files**, plus TypeScript and whitespace checks. Regressions include the recorded 29/26-score response, preservation of all available originals within bounds after discarding malformed ranking, strict evaluation behaviour, non-swallowed billing/storage/transport errors, and whole-response rejection of both recorded malformed Arabic drafts. No automated paid inference was run. The spending ledger remains unchanged; this does not mean Mo's manual website requests were free.

**Live verified repair / accepted:** pending. The UTF-8 instruction is preventive, not proof of future model compliance. Useful background selection and writing interaction, native-language quality, strict-output route acceptance, patient activation and the guarded end-to-end source review remain unresolved. No production activation or remote migration occurred. Mo should not be asked to repeat these same deterministic failures while they can be replayed offline.

## 16. Sentence-level copying corrections and strict writer output — 22 October

**Implemented in the active rich path:** source-copy detection now returns a specific source identity, language, overlap rule and normalized matching clause. Its existing thresholds, honorific treatment, technical-term handling and prohibition on AI-rendered quotations are unchanged. Exact quotations continue to come from stored source cards; model text remains explanation only. An overlap finding is editorial feedback, not proof of an unsupported religious meaning.

For a section rejected solely for copying, the shared bounded correction identifies each rejected sentence by zero-based index, exact wording, citations and overlap finding. Validly formatted sibling sentences are retained by the server rather than rewritten. The model must preserve count and order for this explicit patch; a layout change rejects the correction. The entire patched section still passes ordinary citation, coverage, attribution, repetition and independent support/usefulness checks. Retained formatting is not semantic approval. Other malformed responses are never salvaged by extracting child objects.

Rich writer and writer-correction requests now explicitly require schema output in the OpenRouter adapter, even when the global schema preview flag is absent. The adapter requests strict JSON Schema with supported-parameter routing and locally validates the complete response; it never downgrades these requests on HTTP 400. Other legacy requests retain their existing defaults. Literal Arabic UTF-8 remains requested. If the initial writer response is unreadable, its already-budgeted one correction starts at the existing configured backup, using `malformedResponseRetry`; this adds no correction round and changes no configured models. A failed or unreadable correction still leaves the attempt incomplete.

**Recorded evidence:** the latest Arabic draft contains one copying-rejected Sunnah sentence and one sentence that does not trigger copying. The old group-level rejection discarded both. New regressions identify that distinction without certifying the second sentence's religious accuracy. They also prove preserved siblings reach the independent checker, unrequested edits to them are ignored, broken patch layout cannot gain approval, and unreadable correction routing stays bounded.

**Offline verified:** full suite **1,338 tests passed in 115 files**; TypeScript passed. The copying test suite retains its existing Quran/hadith retyping, altered-copy, scholar-clause and English/German translation protections. Real OpenRouter public model metadata advertises both `response_format` and `structured_outputs` for the configured Gemini writer and backup, checked without an inference request. [Official documentation](https://openrouter.ai/docs/guides/features/structured-outputs) notes endpoint-dependent enforcement; metadata is not real-route acceptance. No response-healing plugin or damaged-text repair is used.

After adding the final explicit malformed-patch-layout case, **126 focused tests across four files** passed again. That case retains checked Quran material, rejects the damaged correction, withholds the summary and confirms there is no third writing job beyond the original two plus the one correction. TypeScript was rerun after the test's optional-section typing correction.

**Pending:** real paid writer-route compliance and source-faithfulness review. These code changes do not establish end-to-end religious answer reliability. Safe-section retention remains in the active rich path. The same-job Continue interface is implemented on the gated patient worker, but activating it on the browser still needs accepted durable storage and worker configuration; it is not simulated by resending or automatically repeating a paid call. No production release, remote migration, source-approval change or automated paid model call was made.

## 17. Strict writer routing regression from Mo's next attempt — 22 October

**Observed live:** request `322c51b2-5daa-40e5-bdd7-992ddc95e6c2` used the new strict writer path. It retrieved 16 Quran candidates, eight hadith and one scholarly excerpt. The initial framing JSON was malformed and its bounded backup correction succeeded. Both parallel writing jobs then received HTTP 404 from the configured primary and backup, returning no drafts. The attempt ended incomplete around 53.6 seconds. No source-support checker could assess absent writing. This was a regression introduced by requiring strict output, not another observed copying or overall-timeout failure.

**Evidence and limit:** read-only official endpoint metadata lists schema output for active Google Vertex endpoints of both configured writer models but does not list `temperature`. Our request still sent `temperature: 0` together with `require_parameters: true`, an incompatible combination for those endpoints. Official [provider-routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection) says that setting requires support for all supplied parameters. This proves a request/capability conflict. The older adapter did not retain a sanitized provider error category, so the precise account-specific 404 explanation and whether any additional routing restriction applied remain unverified. Model-level advertised schema support alone was insufficient acceptance evidence.

**Implemented:** strict requests omit the unnecessary optional temperature parameter while preserving strict schema output, no-training/zero-retention preferences, supported-parameter enforcement, existing models and local complete-response validation. Legacy requests retain their former temperature setting. No schema or privacy downgrade/retry was introduced. Provider rejections now record a fixed sanitized category, status and output mode; raw error messages/bodies are not added to general diagnostics because they may echo visitor input.

**Offline verified:** **61 focused tests in two files** passed, plus TypeScript and whitespace checks. A routing fixture using the observed endpoint parameter set would return 404 for the previous request, accepts the corrected request, retains privacy/strictness and asserts a single transport call. Existing unsupported-route, schema-rejection, correction and safe-section tests passed. This is a scripted compatibility reproduction, not a paid live success.

**Live repair / accepted:** not yet verified. Only public metadata/documentation requests were made by the agent; no model inference, remote migration or production change was performed. Do not report the entire answering system reliable from this correction.

## 18. Hide empty source groups and avoid source-quota completion — 22 October

**User-directed change:** resolved Quran, Sunnah and scholar groups without checked content no longer render a heading, empty box or no-relevant-evidence message. This applies to completed answers, retained checked partial content and paused patient content. Genuine in-progress patient states remain truthful while research is active. The serialized section order, historical rich-answer formats, citation ownership and conversation hydration are unchanged.

Completion is based on supported coverage of the question, not how many source families appear. Regression cases verify that Quran alone, Sunnah alone or scholarship alone can yield a completed answer. An unrelated/empty group remains optional and invisible. If a necessary requested concern remains unsupported, it still cannot become a completed saved answer merely because some other section is useful. Genuine failures are disclosed at response level rather than in empty source headings.

**Summary repair:** the checker now distinguishes an independently checked direct final answer recapping its source explanations from harmful repetition within explanations or within the summary. No new religious fact is required merely to make a summary novel. Cross-summary duplicate findings are accepted only with explicit direct-summary/usefulness/non-repetition decisions in the ordinary checker; uncertain value, unsupported claims, conditions, attribution, consistency and coverage remain mandatory. The focused quality path makes the equivalent distinction while preserving its independent support stage. Restatement labels, within-role duplication and missing necessary concerns remain failures.

**Offline verified:** **1,350 tests passed in 115 files**, TypeScript and whitespace checks passed. New tests cover hiding empty headings/messages in English, Arabic and German, one-source-family complete answers, direct recap overlap and a necessary second concern still preventing completion. No model calls, migrations, source approvals, production activation or spending-ledger changes occurred.

**Live acceptance:** pending Mo's manual local checks and source-faithfulness review. This change is on the ordinary chat view and rich-answer path; it does not activate the gated patient worker.

## 19. Stop asking Mo to reproduce planning failures — 22 October

**Observed:** `74df7187-a62d-497e-aba9-62330f574f1b` failed before source discovery after about 5.6 seconds. Its first response used Arabic for internal point descriptions, which the declared parser requires in short English. The one correction then returned `practice` as a point facet; that value is allowed as a question type but not as a facet. Both complete JSON responses were parseable and both plans correctly failed the existing local contract. The old retry feedback merely said `invalid`.

**Implemented:** rich framing now requests the same strict provider schema used by writing, with an explicit field description for internal point text. Fixed privacy-safe rejection codes distinguish unreadable framing, invalid point text and invalid facet categories. The single correction receives the actual rejection code and allowed facet list; no plan is silently coerced or granted evidence approval. The gated patient framer shares these reasons and schema requirement. Search/checking behaviour and retry/spending limits are unchanged.

**Offline verified:** **68 focused tests in four files** passed, plus TypeScript and whitespace checks. The two exact rejected plans are regression fixtures; both remain rejected, their reasons differ, and only explicitly corrected output is accepted. No automated model call was made. Live route compliance and end-to-end answer reliability remain unverified. Mo is tired of repeated failures; do not present these component checks as a reason to request another manual reproduction of this deterministic fault.

## Earlier verification snapshot

On 22 October 2026:

- `npm test -- tests/contribution-selection.test.ts tests/package-chooser.test.ts tests/tiered-ask.test.ts tests/retrieval.test.ts tests/rich-pipeline.test.ts tests/patient-models.test.ts tests/focused-checks.test.ts tests/rich-answer.test.ts tests/ask-diagnostics.test.ts tests/research-worker.test.ts --maxWorkers=2`: **166 tests passed in 10 files**.
- `npm run typecheck`: passed.
- Latest full offline run, including retained safe sections, strict enum validation and translation batches: `npm test -- --maxWorkers=2` — **1,189 tests passed in 104 files**.
- Final checks after diagnostic-label changes: **50 tests passed in three affected files**; TypeScript passed. The final 96-input comparison preflight is `work/private-ask-evaluation/focused-checker-preflight-20261022-final.json`: zero model rows, zero cost, review pending.
- The shared ledger SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`; it was not reset or changed. The new focused-selection, focused-checking and patient-acceptance switches remain absent/off locally. No production configuration was changed.
- These checks establish implementation behaviour with recorded/scripted inputs, not reliable live religious answers or acceptance of the complete plan.

## 20. Owner-authorized free-model online evaluation (22 October)

**Implemented:** isolated free-only runner and price/privacy transport guard, with twelve prepared varied Arabic questions. Website configuration and the paid ledger remain unchanged. Mo explicitly retained the existing zero-retention rule.

**Offline verified:** five guard regressions and TypeScript checks passed. These cover rejecting paid models/extras or weaker privacy, zero-price routing, receipt handling, call allowance and stopping on unknown/nonzero cost or uncertain transport.

**Live verified:** ten free candidates probed. Only Xing4.0 completed small compatibility requests (two completions, each reporting cost zero); other routes returned 403/404. Actual rich question-framing attempts on worship, rights and parents all returned rate limits, triggering the three-failure stop. No complete answer was evaluated and no accuracy percentage is established.

**Accepted:** no free writer/checker combination or source-faithfulness acceptance. Full online testing remains blocked under the retained privacy rule. See [the recorded findings](ask-free-model-evaluation-2026-10-22.md); private receipts remain under `work/private-ask-evaluation/`.

## 21. Arabic quality campaign within the owner-authorized 50-cent ceiling (22 October)

**Implemented:** fixed fifty-case Arabic bank (10 regressions, 20 fresh, 10 boundaries, 5 paraphrases, 5 follow-ups), isolated active-pipeline runner and persistent campaign spending guard. The cap includes the original unresolved $0.113472 reservation; the original ledger remains unchanged. Conservative per-call reservations account for simultaneous calls, bounded corrections and the unchanged model backups. Current endpoint prices and receipts are privately recorded. Website code, models, source approvals, database state and production remain unchanged.

**Offline verified:** eight campaign tests passed before inference; final ten tests and TypeScript passed after adding source-review stop and receipt-overrun regressions. The initial internal-hints override was removed from the runner; direct inspection/tests establish no hint matches for any of the five paid pilot questions, so their behaviour was unaffected and no paid question was rerun.

**Live verified:** five Arabic attempts, 33 successful HTTP model responses, $0.1077896 actual new cost, $0.2212616 combined actual/reserved exposure, no new unsettled charge. One complete automatic answer, three incomplete outcomes, one appropriate personal-case referral. Direct source review found a material fasting-validity implication approved in a displayed hadith section; the campaign stopped after the first batch. Forty-five questions remain explicitly untested. Provider success and completed status are not source-faithfulness approval.

**Accepted:** no release or religious-accuracy acceptance. Of four answerable attempts, one produced a useful complete answer but required minor Arabic cleanup. The paid pilot does not establish a general accuracy rate. [The plain-English report](ask-arabic-quality-report-2026-10-22.md) records the exact evidence, limitations, costs and prioritised recommendations; [the question bank](ask-arabic-quality-question-bank-2026-10-22.md) records all fifty cases. No Ask repair or further comparison is authorized by the evaluation result alone.

## 22. Meaning/Arabic repairs and owner-authorized same-five retest (22 October)

**Implemented:** active rich checker schema enforcement, an additional original-anchored proof requirement for recognised legal-validity consequences, safe-section exclusion/withdrawal on failed consequence proof, explicit Arabic writer/correction language and concrete guidance-format correction rules. Older non-rich request compatibility was restored by scoping the earlier internal-frame description to rich/library use. Models, retry counts and source permissions remain unchanged. The gated focused-checker path was not enabled or accepted.

**Offline verified:** 117 focused checks passed; full suite **1,381 tests in 120 files**, TypeScript passed. Regression coverage rejects the recorded all-yes validity approval, rejects reward substituted for validity and fabricated proof quotations, prevents streaming unproved recognised validity claims, and repairs English output plus malformed guidance in one bounded correction. Additional lexical anchoring is necessary evidence, not proof of all semantic faithfulness.

**Live verified:** same five Arabic questions retested without resetting the original 50-cent campaign. Retest cost $0.127416; combined baseline/retest model charges $0.2352056 plus old reserved $0.113472 gives $0.3486776 exposure. No new unsettled calls. Outcomes remained one complete answer, three incomplete, one appropriate referral. Arabic/format failures improved; the parents answer now displayed sections. The original fasting-validity claim did not recur, but its hadith was not selected, so the new branch's live preventive benefit is unproven. Direct review identified remaining citation/scope concerns; anger research failed on this run.

**Accepted:** not accepted as a reliable religious-answer repair. No completion-rate improvement established; no production deployment. [The retest report](ask-arabic-quality-retest-2026-10-22.md) records the before/after outcomes, remaining defects and limits. Campaign is stopped after the five authorized retests; baseline evidence and original spending ledger are preserved.

## 23. Citation binding, resilient hadith retrieval and second retest (22 October)

**Implemented:** individual hadith detail and language searches preserve successful eligible siblings with explicit partial-failure reporting; total outages remain failures. Active rich review binds each entire claim's clauses to exact excerpts from its own citations and requires scope/qualification decisions. Server validation rejects missing proof, dropped wording, fabricated excerpts, unused citations and oversized structures. The writer no longer has a suggested minimum word count or a requirement to mention every selected source. Completion still requires every concern, necessary contribution, checked summary citations and whole-answer support/consistency. Patient section reuse retains exact-original checks and final rechecking.

**Offline verified:** full suite **1,390 tests in 122 files**; after the final restriction-context adjustment, **51 focused tests** and TypeScript/whitespace checks passed. Unused originals remain available to reveal restrictions/conflicts, never as positive proof for an uncited assertion. Added regressions cover mixed/total provider outages, authenticity preservation, clause/citation binding, local size bounds, no streaming without proof, redundant-source omission and missing-concern refusal. Google rejected the newly nested size constraints in a synthetic compatibility request; the same schema shape without those provider-side limits succeeded. Strict shape and server-side bounds remain. This does not prove semantic faithfulness.

**Live verified:** two same-question attempts before the spending stop: worship incomplete with no checked section; parents interrupted by the budget guard before writing/checking could finish. Three pilot cases were not retested. Eight hadith candidates survived partial outages on the worship attempt. There were no displayed claims to independently approve. The provider compatibility revision is recorded separately; the final unused-source writing repair has no paid live retest. No completion-rate or accuracy improvement is established.

**Spending:** this round $0.05231108125, including a $0.00093325 synthetic compatibility probe; cumulative actual charges $0.28751668125 plus the unchanged older $0.113472 reservation gives **$0.40098868125 combined exposure**. No new unsettled charges. The nominal $0.09901131875 remainder could not cover the next conservative concurrent reservation, so paid testing stopped. The original ledger hash and earlier reports are preserved.

**Accepted:** not accepted as reliable; no production deployment or source-faithfulness approval. [Second retest report](ask-arabic-quality-retest-2-2026-10-22.md) separates technical failure, budget interruption, compatibility evidence and final offline-only work. The original campaign remains stopped; no extra spending is authorized by the test result.

## 24. Fresh owner-authorized five-question online check (22 October)

**Implemented:** separate additional 50-cent evaluation allowance, explicitly authorized by Mo. The new ledger inherits $0.40098868125 prior exposure and pins both previous ledgers without changing them. The existing guard requires explicit matching allowance limits; current endpoint ceilings, zero-retention privacy, original reservation and uncertain-billing stops remain enforced. Same active rich pipeline and same five Arabic questions; no answer-system changes during the test.

**Offline verified:** eleven focused campaign tests and TypeScript passed before inference. Replay of actual checking responses found nineteen punctuation-only reconstruction mismatches and two uses of a source not attached to the assessed claim. Counts are assessment occurrences and may overlap other real failures; punctuation repair alone does not establish completion or faithfulness.

**Live verified:** all five attempted, 43 HTTP 200 model dispatches, 285,318 input and 55,162 output tokens. Four ordinary attempts incomplete, one appropriate personal-case referral. Fasting and anger each showed a two-claim Quran section before later withdrawal. No useful completed ordinary answer: 0/4. The parents citation guard caught borrowed support, while semantic positive judgments still approved scope problems. The fasting checker reversed its decision on unchanged wording. No overall accuracy percentage or source-faithfulness acceptance.

**Spending:** $0.16381065 newly spent; $0.33618935 of the new allowance remains unspent. Combined prior/current exposure $0.56479933125, including the retained older unresolved reservation. No unsettled new charge. Stopped after five for review, not for lack of the newly authorized money.

**Accepted:** unready. [Fresh online findings](ask-fresh-online-test-2026-10-22.md) separate the new punctuation regression, contradictory semantic judgments, real citation errors, summary failures and remaining search problems. No answer fixes or deployment were made during this fresh evaluation.

## 25. Individual punctuation, correction, continuity and provider repairs (22 October)

**Implemented:** sentence-punctuation tolerance while preserving words/negations/numeric punctuation; exact citation/clause repair feedback; supported-source retention when only summary quality fails; prior real checker findings supplied as history without overriding new failures; actual first-draft citation alignment for the remaining writer while first checking runs; strict Google transport shape with full original size validation retained locally; code-derived coverage eligibility hints; exact unavailable-reference feedback. Two ordinary writing jobs and the existing single correction allowance remain unchanged. No model/privacy/source-approval changes or deployment.

**Offline verified:** real-response replay clears punctuation-only false rejections while retaining missing-word and borrowed-source failures. Final full suite **1,401 tests in 123 files**, TypeScript and whitespace checks passed. Tests retain genuine late support withdrawal, missing-concern refusal, numeric/negation protection and whole-response length/count limits. Controlled comparison on the actual eight-claim rejected schema: original bounds HTTP400, strict shape without provider bounds HTTP200; server still enforces the complete original contract.

**Live verified:** five-question retest produced one completed ordinary answer (anger), three incomplete ordinary attempts and one appropriate personal-case referral. Worship retained three source groups; fasting retained Quran/hadith; no sections withdrawn. Completion 1/4 ordinary attempts, not a general accuracy rate. Source review supports the completed anger teaching with modest practical depth; other retained wording has qualifications/language concerns and no blanket acceptance. A subsequent two-question follow-up found repeated unavailable Q51:57 citations in worship; parents was budget-interrupted before final checking. Last reference-feedback repair has offline verification only. Coverage-hint benefit remains unestablished.

**Spending:** this cycle $0.19694125 including two schema probes. The additional owner-authorized 50-cent campaign has used $0.36075190; $0.13924810 nominal remainder. Combined actual/reserved exposure $0.76174058125, no new uncertain charge. Guard stopped when the next maximum-cost reservation did not fit; neither cap nor reservation rule was loosened. Original ledgers preserved.

**Accepted:** progress, not reliability or release acceptance. [Individual repairs and retests](ask-individual-repairs-2026-10-22.md) records exact phase outcomes, retained concerns, final offline-only change and next priorities. No further paid calls after the budget stop.

## 26. Constrained writing references and dependent-summary correction (22 October)

**Implemented:** rich writer source-ID and requirement-ID enums derived from the actual supplied evidence; section-specific identity bounds; actual-draft summary citation eligibility; source drafts retained for subsequent summary-only corrections; regeneration of the summary in the same existing correction when the first source explanation is repaired, including when an earlier summary omitted that source. Semantic approval, original evidence binding and final coverage gates remain unchanged. No extra model call or correction allowance, and no automatic relabelling/salvage of invalid responses.

**Offline verified:** both real recorded worship drafts with unavailable Q51:57 fail the new whole-response identity contract. Replay of five writer responses made zero model calls; the other three pass identity/shape only, without semantic approval. Full suite **1,405 tests in 124 files**; final broader dependency condition verified by **40 focused tests**, TypeScript and whitespace checks. Regressions cover changed source/summary citations, omitted first-section content, actual-draft references in summary-only repair, unknown requirements/source groups and continued rejection of unsupported wording with an eligible identity.

**Live verified:** none this turn. No new answer, completion rate or cost benefit established. Earlier online results remain unchanged.

**Spending:** zero additional calls/charges; the additional campaign remains 97 dispatches, $0.36075190 charged, $0.13924810 nominal remainder, stopped by the existing maximum-reservation guard. No uncertain new charge or ledger reset.

**Accepted:** offline implementation behaviour only. [Writing-contract repair](ask-writing-contract-repair-2026-10-22.md) records evidence and limitations. No reliability, religious-accuracy or production acceptance.

## 27. Owner-authorized single Arabic online attempt (22 October)

**Implemented:** evaluation-only additional 25-cent campaign, explicitly authorized by Mo, with earlier charges and unresolved reservation inherited and ancestor hashes pinned. No answer-system repair, model/privacy change, source approval, deployment or additional retry during this test.

**Offline verified:** campaign controls and TypeScript passed before inference; after the attempt both ancestor ledger hashes match. Saved private review separates five displayed claims, withheld summary, source transport and seven scholarly candidates. No religious originals copied into the permanent findings report.

**Live verified:** one fresh worship attempt, nine settled HTTP 200 dispatches, 66,950 input and 14,408 output tokens. Quran three claims and hadith two claims retained without withdrawal; first checked section 43.342 seconds, total 57.298 seconds. Final answer incomplete: checker used an ineligible mixed-concern summary for coverage, and summary cited an unexplained hadith. The only correction had already been spent on short-formula source overlap. No answer deadline, budget block or model transport failure caused this result. Partial hadith retrieval failures preserved successful candidates. No scholar source selected; independent reading found some useful general background within narrower candidates, so total relevance rejection needs review.

**Spending:** retest-6 separately spent $0.02231070 and was budget-interrupted, not an answer-quality outcome. New authorized retest-7 spent $0.04079065; $0.20920935 of its allowance is unspent. Combined inherited actual/reserved exposure $0.82484193125. No new uncertain charge; stop after one attempt as authorized, with no automatic rerun.

**Accepted:** not reliable or release accepted. Displayed claims have source-supported cores with a scope caution for the walking-vow hadith; no blanket accuracy score. [Single Arabic test findings](ask-single-arabic-online-test-2026-10-22.md) records exact blockers, original-based review and priorities for coordinated coverage/summary/copy repair. Those next repairs are not implemented by this evaluation.

## 28. Owner-authorized general repair loop within $1 (22 October)

**Implemented:** concern-keyed coverage and code-derived citation unions; fixed contribution fields excluding self IDs; exact code-assigned excerpt anchors; early unexplained-summary detection; successful draft retention and dependent-summary correction; explicit same-concern merge limits; no withdrawal solely for a later malformed checker response; grammatical semicolon handling with every clause still checked; a narrow meaning audit for all claims proposed for publication, including survivors of a partially failed audit; output allowance accounting for reasoning tokens and concise positive findings. No hardcoded answers. Configured models, approved source boundaries and zero-retention privacy remain. Patient/gated execution was not enabled; no production/database writes or commits.

**Offline verified:** final **1,421 tests in 126 files**, TypeScript and whitespace checks passed. Regressions cover borrowed anchors, unknown IDs, unsupported scope with genuine originals, late real withdrawal, partial-success publication, summary dependency, merge limits, unchecked text after semicolons and the recorded seven-claim output truncation shape. These do not certify religious accuracy.

**Live verified:** nineteen full attempts on six distinct Arabic questions across seven revisions. Three complete statuses; independent original-based review found one supported useful complete sincerity answer and material problems in the other two. Incomplete answers also retained some scope/qualification defects. No clear overall reliability improvement is established. The final partial-survivor guard has offline integration evidence; the narrow live control rejects two exact previously approved scope errors and accepts one correctly limited statement. A seven-claim settled checking replay completes after the output-budget repair, but still does not establish a completed or fully faithful Ask answer. English/German, browser interaction, phone layout and durable recovery were not tested.

**Spending:** $0.89861773125 new charges including all failed attempts, the unsuccessful backup-routing experiment, $0.00162550 controls and $0.00316775 settled-request replay. $0.10138226875 remains unspent under the $1 allowance. Combined inherited actual/reserved exposure $1.7234596625, including the unchanged old $0.113472 reservation. All 216 dispatch records settled; no new uncertain charge. Ancestor hashes preserved. Further paid calls stopped for source-faithfulness repair/review. No reservation rule, privacy rule, price ceiling or cap was loosened.

**Accepted:** goal active and unfinished; no general accuracy, readiness or release acceptance. Two backup-correction attempts remained incomplete and their extra routing policy was reverted. [Full repair-loop findings](ask-one-dollar-repair-loop-2026-10-22.md) separates observed defects, retained repairs, introduced-and-corrected format defects, failed experiments, partial verification and next work. Next priority is correction coordination and a final summary derived from surviving checked explanations, followed by a fresh affordable acceptance sample. Repeating the same questions and reporting passing offline tests is not enough.

## 29. Optional source groups and coordinated bounded corrections (22 October)

**Implemented:** selected-but-empty source arrays no longer become automatic writer failures; optional omission metadata distinguishes unpresented material from a failed check or evidence absence. The view suppresses false omission warnings while preserving actual search-failure notices. A bounded combined preflight collects sibling semantic/format findings before the single correction. Exact earlier rejection findings survive aggregation; changed source groups refresh their summary. Repaired first-source text remains provisional until combined checking, replacing its separate immediate review. Preflight is limited to once, with no extra writer retry or uncertain-call repeat.

**Offline verified:** zero-cost replay of 52 intact recorded writer responses found eight wrongly failed empty-group occurrences and the prior semicolon occurrence; unreadable envelopes were skipped, not salvaged. Two scripted semantic/format coordination regressions failed before the change and pass afterwards using one correction. Negative controls preserve missing-concern and necessary-qualification refusal, unsupported source withholding, actual search notices, preflight-outage refusal, new bad correction refusal and no publication of the unreviewed corrected first draft. Final full suite **1,435 tests in 128 files**, TypeScript and whitespace checks passed. Arabic/English/German rendering checked offline; no browser/save-reopen acceptance.

**Live verified:** none this turn. No new completion rate, religious-accuracy, cost-saving or timing claim. A combined audit can be larger than a source-only audit even when call counts are unchanged. Later-group failures can require one additional preflight; normal successful first-section streaming remains.

**Spending:** zero new inference. The $1 loop remains at $0.89861773125 charged with $0.10138226875 unspent, all earlier ledger records and uncertainty reservation preserved. Paid execution remains stopped for reviewed repair/adequate funding; no cap, reservation, privacy or model change.

**Accepted:** offline behaviour only; goal active and unfinished. [Correction-flow repair](ask-correction-coordination-2026-10-22.md) records the reproducible failures and boundaries. The summary still needs fuller separation from provisional later drafts, and this revision needs an independently reviewed online acceptance run. No production or religious-accuracy acceptance.

## 30. Reviewed online retest after coordination repair (22 October)

**Implemented:** separate owner-approved $0.25 evaluation allowance, inherited exposure and immutable predecessor hashes; one-attempt case journal and mandatory review of worship before parents. No answer-system edits during this retest. Current models, privacy and reservations unchanged.

**Offline verified:** 22 focused guard/coordination/omission tests, TypeScript and whitespace checks passed before paid execution. Earlier full-suite result remains separate.

**Live verified:** two Arabic attempts. Worship remained incomplete; its two displayed scholar claims are supported but repetitive. Parents completed, but independent source review found its scholar instruction dropped a need qualification present in the original. Both model checking layers missed that qualification. Zero accepted fully supported complete answers in this small repeated sample. Empty Sunnah did not block the parents complete status; browser rendering was not tested.

**Spending:** $0.08796120 of the newly approved $0.25, leaving $0.16203880 unspent. All 23 calls settled. Combined actual/reserved exposure $1.8114208625; old reservation and four predecessor snapshots unchanged. Further calls stopped for the qualification defect. No completed/uncertain request repeated.

**Accepted:** no reliability or release acceptance. [Reviewed retest findings](ask-coordination-online-retest-2026-10-22.md) records the actual originals-based findings, timing, tokens, cost and priorities. Next work is explicit condition preservation and permitted correction identities, then synthesis from surviving checked explanations; these are priorities, not completed repairs.

## 31. Text-only patch repair; checker experiments rejected (23 October)

**Implemented:** copying-only corrections now generate text under fixed patch keys. The server preserves original source IDs, concern identity and untouched sentences; the full reconstructed section is still checked. Unknown keys, added identity fields and malformed envelopes fail completely. No topic-specific answer or source exception.

**Offline verified:** 1,455 tests passed before the additional source-only experiment. Final full run: 1,461 passed with one fixture-provenance timeout; its focused rerun together with correction suites passed all 46 tests. TypeScript and whitespace passed. Tests establish protocol behaviour, not religious meaning.

**Live verified:** five first-control experiments, all failed or invalid, each stopped immediately. Single-request restriction receipts, atomic-condition instructions and simple high reasoning approved the recorded missing-need claim. High-reasoning receipts recognized the problem but invented source quotations; separate draft-blind extraction also altered quotations. No invalid fragment was rescued, and no full answer was rerun. Experimental checker builders remain outside the active website path; the preceding meaning checker and reasoning defaults were restored.

**Spending:** $0.00783975 this continuation; $0.09580095 used and $0.15419905 unspent from the latest $0.25 allowance. Combined exposure $1.8192606125; all 28 campaign calls settled. Four predecessor snapshots and original reservation unchanged. Paid work stopped for review; no model/privacy/cap/deployment change.

**Accepted:** correction identity preservation only; no new source-faithfulness or overall reliability improvement. [Evidence and failed experiments](ask-text-patch-and-checker-controls-2026-10-23.md). Goal remains active and unfinished. Future checker changes must beat positive and negative component controls before another full paid test.

## 32. Independently citable adjacent evidence and component-only recovery (23 October)

**Implemented:** rich meaning-ranked retrieval performs one bounded immediate-neighbour discovery pass. New Quran identities are independently fetched, identity/original-bound, given their own context and offered to ordinary ranking/selection/sealing; no contextual meaning is relabelled as support for the original hit. At most sixteen new candidates and 120 combined; no recursive expansion. Ranking instructions distinguish original contribution from context. The fallback recovery path no longer retries to fill empty optional source groups; actual missing-component recovery remains.

**Offline verified:** both integration regressions failed before repair and pass afterwards. The recorded worship replay independently exposes Q31:12 and Q51:57 previously stranded as context, with zero model/network calls. Final full suite: 1,474 tests in 132 files passed. TypeScript and whitespace passed. Negative coverage includes failed/changed/wrong source reads, bounds, conflicts, cancellation and failed necessary-component recovery.

**Live verified:** no new online result. Snapshot replay is discovery evidence only, not current provider availability, selection quality or a faithfully completed religious answer. [Evidence and boundaries](ask-adjacent-evidence-and-recovery-repair-2026-10-23.md).

**Spending:** no new charges; latest allowance remains $0.09580095 used and $0.15419905 unspent; all 28 calls settled. Models, privacy, reservations, source boundaries and production remain unchanged.

**Accepted:** source discovery/control-flow repair only. Lost-condition detection and late summary synthesis remain unresolved; overall reliability goal is active and unfinished. Additional candidate/input cost, live timing and actual answer quality remain to be measured. No broad accuracy or release acceptance.

## 33. Live retest blocked by concurrent reservations; direction starvation repaired (23 October)

**Observed:** one fresh R01 live attempt took 195.105 seconds, cost $0.02947980 and published no checked section. Six paid calls settled. The first checker was blocked by a temporary overlap with the later writer's maximum reservation; subsequent checker/correction failures were budget-admission failures, not semantic verdicts. Initial owner-facing interpretation was corrected after inspecting the ledger. The full candidate pool also exposed a discovery-order defect: sixteen preceding neighbours consumed the cap before any following neighbour was considered.

**Implemented:** the evaluation guard queues requests until pending costs settle, preserving every reservation bound, price ceiling and cap; real shortages, uncertain charges, cancellation and changed-ledger evidence still prevent dispatch. Discovery now considers both directions together per seed under the existing bounded pool. No checker/model/privacy change or uncertain paid-call retry.

**Offline verified:** both regressions failed before repair and pass afterwards. The actual sixteen-seed source replay now exposes Q51:57 under its own identity. Final full suite: 1,480 tests in 132 files passed; TypeScript and whitespace passed. No fresh paid execution of these two repaired revisions.

**Spending:** latest $0.25 allowance now $0.12528075 used, $0.12471925 unspent; combined inherited exposure $1.8487404125. All 34 campaign calls settled; original reservation and four predecessor snapshots unchanged. Paid work remains stopped for reviewed continuation.

**Accepted:** no new religious-accuracy or latency improvement. Goal remains active and unfinished. [Corrected diagnosis and repair evidence](ask-retest-reservation-and-discovery-followup-2026-10-23.md). Resume eligible unfinished checks from exact settled checkpoints where safely possible; do not spend again blindly on the same research and drafts. Lost-condition detection, source-faithfulness acceptance and independent final synthesis remain open.

## 34. Exact settled-output continuation and live source revalidation (23 October)

**Implemented:** private evaluation continuation restores the original selection through the actual parser, binds the exact sealed package and settled receipts, validates whole saved draft contracts and reuses each exact writer request once. Changed/ambiguous/malformed requests cannot silently trigger another initial paid write. The existing one correction remains the only eligible new writer call. No website/worker continuation feature was enabled.

**Offline verified:** 1,490 tests in 133 files passed; final focused checkpoint/guard run passed 26 tests. TypeScript, whitespace and zero-cost actual-output replay passed. Reuse alone never approves source support.

**Live verified:** worker freshness hit missing source-state metadata RPC PGRST202. No deployment or weakened worker gate. The local active-pipeline evaluation independently confirmed the exact scholar record through the existing rights-filtered approved-library reader; Quran/hadith/context originals and English model text were also revalidated. All 22 checks passed. Seven new paid checks/correction calls then continued the same R01 attempt, reusing both earlier writer outputs and avoiding repeat framing/ranking/selection/research. Result remained incomplete: four displayed claims source-supported on independent review, repetitive scholar explanation, hadith blocked by a short-phrase copying rule and unsafe/unexplained final-summary claims withheld. No accepted complete answer or general accuracy improvement.

**Spending:** $0.02884370 new continuation cost; logical interrupted-plus-continued attempt $0.05832350. Latest allowance $0.15412445 used and $0.09587555 unspent. Combined exposure $1.8775841125; all 41 campaign calls settled; historical hashes and original unresolved reservation unchanged. Paid work stopped for review.

**Accepted:** private evaluation reuse/source revalidation only. The queue repair itself has offline concurrency evidence; this continuation avoided the overlapping writer calls by reuse. [Independent review and next repairs](ask-settled-continuation-review-2026-10-23.md). Calibrate editorial copying, derive final synthesis from surviving checked explanations and fix study-guidance handling without weakening religious checks. Known lost-condition weakness and durable-worker acceptance remain open. Goal active and unfinished.

## 35. Short hadith terminology no longer treated as a copied clause (23 October)

**Implemented:** shared hadith Arabic editorial overlap requires six consecutive words, with whole-short-original and substantial near-copy protection retained. Quran, translation, scholar and semantic source checks remain unchanged. Writer instructions match. No source/topic/phrase whitelist. Changed writer requests are not eligible for exact paid-draft reuse.

**Offline verified:** recorded R01 and unrelated terminology regressions failed before repair and pass after it. Long/short-original and lightly altered copying controls still fail appropriately. A real rich-pipeline control proves newly admitted wording still receives semantic review and is withheld on rejection. Full suite 1,494 tests in 133 files; focused 149 tests in six files; TypeScript passed.

**Live verified:** no new call or accuracy/completion measurement. No additional spend; latest allowance remains $0.09587555 unspent, all 41 campaign calls settled. No deployment/database/source-permission/model/privacy change.

**Accepted:** editorial control repair only, not a completed faithful answer or release acceptance. [Evidence and limits](ask-hadith-copy-calibration-2026-10-23.md). Final synthesis from checked sources, optional guidance and the known lost-condition checker failure remain open. Goal active and unfinished.

## 36. Final synthesis follows combined source checking (23 October)

**Implemented:** first source still streams as soon as checked; later sources are written concurrently with that first check, then independently checked together before a separate summary-only write. Only surviving checked explanations and their citations enter synthesis. Final full-answer support, coverage, conditions, consistency and guidance checks remain required. One shared correction overall. Malformed checker contracts/outages preserve independently checked progress; credible late negative findings still withdraw it. Displayed material cannot silently disappear from final checking.

**Offline verified:** 1,503 tests in 134 files passed, TypeScript and whitespace passed. New gated tests prove there is no summary request before combined source approval, rejected citations stay out, summary transport/cancellation preserves progress, unsupported synthesis remains withheld and late lost qualifications withdraw early text. Existing strict provider, Arabic correction, optional group and correction-coordination controls now assert the actual staged flow. [Implementation and limitations](ask-checked-source-synthesis-2026-10-23.md).

**Live verified:** none for this revision. Three ordinary writer requests and three check stages for a normal multi-source answer replace the former premature two-write sequence. Cost, quality and latency impact need live measurement; the separate meaning checker remains unchanged. No extra spend; $0.09587555 remains within the last additional allowance, all 41 campaign calls settled. Old exact-request replay cannot be used after this writer change.

**Accepted:** no release or Mo acceptance, and no general accuracy improvement claimed from offline tests. Optional malformed guidance can still withhold completion after the shared correction is used; known parents condition loss remains open. No deployment, data/rights/model/privacy change. Goal active and unfinished.

## 37. Fresh staged retest cancelled for owner pause (23 October)

**Implemented:** no new answer-system repair during this attempt. A narrowly scoped evaluation entry point preserves the same cap, prices, privacy, model identities, receipt journal and reviewed-history gates for one changed-revision R01 retest. The optional-guidance repair remains unfinished.

**Offline verified:** focused 29 guard/copy/staging tests and TypeScript passed; last full answer-system suite remains 1,503 tests in 134 files. No new full-suite or religious-accuracy claim.

**Live verified:** R01 never reached writing/checking. Source retrieval remained pending when the owner requested a pause; the evaluator was stopped after 441,861 ms. No checked section, completed answer or accuracy verdict. One hadith search took 95.525 seconds and another was pending. The slow research dependency still blocks early delivery in this active path. New copy/synthesis behavior was not reached online. [Exact result and pause boundary](ask-staged-retest-paused-2026-10-23.md).

**Spending:** two settled calls cost $0.00485970; latest allowance $0.15898415 used, $0.09101585 unspent. Combined exposure $1.8824438125. All 43 campaign calls settled; original unresolved reservation and predecessor hashes unchanged. Evaluator terminal exit confirmed, stale lock removed, ledger stopped for owner pause. Local Arabic Ask verified HTTP 200 on port 3000 and left running for Mo.

**Accepted:** no release/accuracy/completion acceptance. Owner requested pause and manual testing. No further automatic tests, fixes or paid calls while paused; the full reliability objective remains unfinished.

## 38. Full Quran/hadith source text in cards (23 October)

**Implemented:** on Mo's explicit display request, main source cards and cited-source folds show complete Quran/hadith text instead of the 230/160-character truncation. Scholar previews retain their existing limits. No original text or answer-generation rule changes.

**Offline verified:** 17 render checks, TypeScript and whitespace passed. No new paid call, deployment or wider repair-loop restart for this isolated display request.

**Accepted:** local display change only; no religious-accuracy acceptance.

## 39. Owner resumed work; source connection and summary-replay repairs (23 October)

**Implemented:** Mo asked to continue the goal. Individual source connections keep their existing bounded request duration during patient local/worker work; the overall answer deadline is still unbounded in those contexts. The HadeethEnc/Quran/Sunnah/live-scholar readers use the separate helper. A final summary that wholesale reprints three or more earlier explanations goes through the existing single correction, while short direct recaps remain eligible. No topic whitelist, extra retry, model/privacy change or weaker meaning check.

**Offline verified:** the actual source-search path reproduces an indefinite legacy wait and returns a distinct timeout/source failure with the repaired helper. Owner cancellation, finite/unlimited worker cases, exact-replay correction and allowed short recap controls pass. Final suite 1,510 tests in 135 files, TypeScript and whitespace passed. [Evidence and manual-answer review](ask-source-connections-and-summary-followup-2026-10-23.md).

**Live verified:** two source-only reads returned HE65007/HE65936 in 730/237 ms, without AI calls. This is current connectivity, not full-question latency or accuracy evidence. Source/synthesis repairs have not yet passed a fresh full model retest. The two manual completed examples are more relevant/useful, but the anger answer's literal replay and extra causal wording remain review findings; other recent anger records include incomplete/unterminated attempts, not a controlled success rate.

**Spending:** automatic campaign remains 43 settled calls and $0.09101585 unspent, with no new model spending. Extra permission for up to $0.25 for one Arabic worship retest is pending; no cap/max-output/reservation was reduced or bypassed. Manual website charges are outside this automatic evaluation ledger.

**Accepted:** no release or goal-completion claim. Optional-guidance and missing-condition weaknesses, source-stage research dependency and full live verification remain open. No deployment, database/rights/model changes or commit.

## 40. Authorized source-request worship retest finished; checking still failed (23 October)

**Implemented:** HadeethEnc now bounds the complete individual fetch/body operation even when cancellation is ignored. The evaluator stays alive until completion. Owner-only recovery reused two whole valid settled planning outputs only for identical complete transport requests; changed requests and uncertain/duplicate outputs refuse before spending. No meaning-check weakening or extra paid retry.

**Offline verified:** 1,523 tests in 136 files, TypeScript and whitespace checks passed. The exact recorded final checker response is rejected in full for nonempty requirement coverage during a source-only stage. Diagnostic replay did not accept or display any repaired fragment.

**Live verified:** one logical R01 attempt, with one reviewed evaluator interruption and an explicit continuation; 52,760 ms continuation time, no checked section, incomplete result. Research reached writing, but correction changed meaning while preserving old citations, and checker output violated its stage contract. The rejected checker's support verdict also missed that citation mismatch. Summary-replay protection was not reached online. [Actual evidence, counts and priorities](ask-source-request-online-retest-2026-10-23.md).

**Spending:** nine settled paid calls total, $0.03887975 including original planning, $0.21112025 of the new allowance unspent. Combined recorded exposure $1.9213235625. All ancestor records and the original unresolved reservation preserved. No further paid question dispatched; ledger stopped for review.

**Accepted:** no usable answer, no release or goal-completion acceptance. Source-only checker-contract simplification, semantic correction controls and source-group contribution handling are the next priorities. No deployment, database/source-rights/model/privacy change, commit or push.

## 41. Stage-specific source checking completes, but Arabic source review fails (23 October)

**Implemented:** source-only checker contracts omit final-answer fields while final coverage/guidance checks remain mandatory. Text-only correction tasks include their own originals and concern; source writers receive explicit per-group contribution scope. Owner-only journal replacement retries bounded transient Windows contention without deleting the original or sending before durable reservation. One reviewed reservation-write failure was confirmed not dispatched and preserved at $0.

**Offline verified:** 1,536 tests in 139 files passed for active changes and storage recovery, TypeScript/whitespace passed. Later experimental isolation has separate passing focused controls; no additional full-suite count claimed. Scripted verdicts prove enforcement, not semantic correctness.

**Live verified:** a fresh Arabic R01 completed in 80,416 ms, first section at 60,145 ms, costing $0.05311940. Reduced source checker contracts were valid, and final checking still ran. Independent original-Arabic review found only one of six displayed claims fully established by its own citations. Uncited-neighbour support, broadened scope and inferred provision outcomes remained despite positive checker verdicts. This is a completed but unsupported answer, not an accuracy success or the 30% timing target. [Full findings and exact spending](ask-source-check-contract-repair-2026-10-23.md).

**Experiment, not activated:** one-claim/cited-original-only meaning checking rejected the missing-citation control and passed both supported controls, but still accepted the inferred provision outcome. Stopped at that failed fourth case; fifth not tested. Cost $0.00177850. This builder remains outside the active answer path.

**Spending:** latest allowance $0.09377765 used, $0.15622235 remains. Combined exposure $1.9762214625, with inherited unresolved exposure retained. 28 settled provider calls plus one confirmed local non-dispatch. Journal stopped for review; no test process/lock or uncertain new charge remains.

**Accepted:** demonstrated source-check format/flow improvement only. No release/accuracy/goal completion. Semantic support, condition preservation, optional guidance, research-stage streaming and wider held-out review remain open. No deployment, database/source-rights/model/privacy change, commit or push.

## 42. Backup routing repaired; fixed Arabic checker comparison completed (23 October)

**Implemented:** omit unsupported optional reasoning for the exact pinned non-reasoning Mistral backup. Keep strict parameter routing, schema validation, privacy, output/price limits and configured model identities. No topic/answer exception. Experimental isolated-relation checking remains outside the active engine after its second control failed/required label review.

**Offline verified:** 1,548 tests in 141 files, TypeScript/whitespace passed. Ten complete request-fingerprint pairs prove that only the reasoning field changed between rejected and successful Mistral requests; privacy/strictness remained identical. [Full evidence and exact comparison](ask-checker-comparison-and-backup-repair-2026-10-23.md).

**Live verified:** initial Mistral requests were rejected 10/10 before generation at $0; removing the unsupported field produced 10/10 readable responses on the same bank. On six supported/four unsupported controls, Gemini accepted 6/6 supported and rejected 3/4 unsupported; Mistral accepted 4/6 supported and rejected 4/4 unsupported. Model errors differ; neither fully passed. No main-model replacement or unanimous two-checker gate activated. This is a demonstrated transport repair and bounded component result, not a full-answer accuracy improvement.

**Spending:** Mo explicitly approved the ten-case primary/backup comparison using the remaining allowance. This continuation cost $0.0071823375. Latest allowance $0.1009599875 used, $0.1490400125 remains; combined exposure $1.9834038. Journal has 51 settled generations, ten explicit zero-cost rejections and one confirmed local non-dispatch, with no uncertain new charge.

**Accepted:** local request-compatibility repair supported by offline and live evidence. No religious-accuracy/release/Mo acceptance or goal completion. Last full answer remains source-review failed; no fresh full retest or latency claim. No deployment, database/source-rights/model-chain change, commit or push.

## 43. Current-model experiments failed controls; new-model proposal declined (23 October)

**Implemented:** experimental criticism review and a bounded text-only rewrite probe remain outside the active answer path. Mo explicitly declined the proposed additional model: keep current models only. The unapproved candidate runner, candidate-only guard extension and its tests were removed. The spending guard permits only the existing four models. No website model switch occurred.

**Offline verified:** after candidate cleanup, 35 focused tests across campaign limits, storage, disagreement review and text-only patches passed; TypeScript passed. This is enforcement evidence, not proof of semantic accuracy. No additional full-suite result is claimed for this cleanup.

**Live verified:** criticism review correctly dismissed one false rejection, then incorrectly approved the known unsupported provision-outcome claim; stopped after two of three cases. Cost $0.00182300. The subsequent single-rewrite probe stopped on its first case because the actual copy guard rejected the writer's source copying; no checker calls or further cases followed. Cost $0.00028770. Both experiments failed and remain inactive. Private evidence: `work/private-ask-evaluation/disagreement-controls-20261023.json` and `work/private-ask-evaluation/bounded-rewrite-controls-20261023.json`. No candidate-model call was made.

**Spending:** latest allowance $0.1030706875 used; $0.1469293125 remains. Combined recorded exposure $1.9855145, including the original unresolved reservation. Journal stopped for review, with 54 settled generations, ten explicit zero-cost route rejections and one confirmed local non-dispatch. No new uncertain charge.

**Accepted:** current-model boundary confirmed by Mo; no accuracy, release or goal-completion acceptance. The backup transport repair remains supported; semantic checking still misses unsupported inferences, and the backup can reject supported statements. The last full answer still failed independent source review. Further work must preserve this distinction and must not count stricter withholding as improved answer quality by itself.

## 44. Discovery priority repaired; full retest still incomplete and not source-faithful (23 October)

**Implemented:** rank context-checked seeds before allocating the sixteen neighbour-discovery slots, then rank the expanded pool for independent selection. Priority identities must belong to the original pool; original source reads, context checks, source approval, sixteen/120 limits and cancellation remain mandatory. Reuse the ranking when no additions occur. This applies across questions, not to a named verse. [Exact evidence, tradeoffs and independent review](ask-discovery-priority-repair-2026-10-23.md).

**Offline verified:** 1,564 tests in 144 files, TypeScript and whitespace checks passed. The actual pipeline tests cover a late strong seed and unchanged capacity/identity checks. Replaying the actual earlier source order misses 51:57; frozen semantic priority finds it within the same sixteen slots. This replay does not stand in for a new ranking verdict.

**Live verified:** fresh source reads confirmed the required original with zero model calls. One fresh full R01 attempt selected/cited the previously missing original, streamed its first checked section at 51,373 ms, and stopped incomplete at 60,158 ms when the final checker reservation could not fit. Fourteen generations settled, cost $0.05102730. Compared with 60,145 ms previously, first section was 14.58% earlier descriptively, below 30%; different search/planning results prevent attributing the timing/citation change solely to this repair. Independent review found 2/4 displayed source claims fully supported and 0/3 unshown summary claims fully established. Missing case boundaries and added meaning remain. No final conclusion was checked or displayed.

**Rejected experiments:** reading aid, temperature-zero backup, Arabic analysis-before-verdict and medium-reasoning checks did not establish an improvement. All remain inactive; temporary settings changes reverted. No new model tried. Their combined model cost was $0.00380156. A local prototype schema failure cost $0 before dispatch. Complete invalid envelopes remain rejected.

**Spending:** latest allowance $0.1578995475 used, $0.0921004525 remains; combined recorded exposure $2.04034336. 100 settled generations, ten zero-cost route rejections, one confirmed local non-dispatch, no new uncertain charge. Original journal/unresolved reservation and five immutable ancestors preserved. Latest question independently reviewed and marked failed; no automatic repeat, live process or lock remains.

**Accepted:** demonstrated discovery-priority repair only. No complete-answer, religious-accuracy, release, Mo acceptance or goal completion. Final-review request size and source-writing scope remain next work. No deployment, model/privacy/source-boundary/database change, commit or push.

## 45. Prior-review votes removed; input-sharing and context-writing experiments did not pass (24 October)

**Implemented:** remove previous checker verdicts/duplicate proofs from later rich-checker inputs while preserving displayed claim IDs, every original/restriction and all response/coverage checks. Normal single-group writing allowances were factored into a shared helper without changing their values. Source-context writing is staged behind an owner-only dependency; no website setting enables it. Shared-original review input is experimental only. [Exact sources, findings and costs](ask-blind-review-and-context-writing-2026-10-24.md).

**Offline verified:** 1,570 tests in 146 files, TypeScript and whitespace passed. Reconstruction of the exact blocked final request proves unchanged evidence/claims/contract after removing prior votes; an experimental shared-original representation expands exactly, including restrictions and metadata. Normal request reservation falls from $0.11150460 to $0.10419210. This proves independence from prior votes and smaller input, not accuracy.

**Live verified:** one experimental shared-original checking call fit its full unchanged reservation and cost $0.006888, but approved all seven saved claims despite five independent source-review failures. The first context-writing control recognised a particular event privately then dropped that boundary in prose. A revised bound-context run tested/reviewed six fixed source components, including five fresh: one clean, two uncertain, one copy-rejected, one with added meaning; the known case was omitted and therefore did not validate its regression. Both experiments remain off. No full Ask answer or new latency result was established.

**Spending:** eight settled generations cost $0.02216880 this continuation. Latest allowance $0.1800683475 used, $0.0699316525 remains; combined exposure $2.06251216. 108 settled generations, ten explicit zero-cost rejections, one confirmed local non-dispatch, no new uncertain charge. Original unresolved reservation/journal and five immutable ancestors preserved. All results reviewed; no paid process/lock remains.

**Accepted:** defensive checker-input cleanup and offline enforcement only. No religious-accuracy, complete-answer, release, Mo acceptance or goal completion. Source context/summary can still add unsupported meaning; proceed with structural synthesis safety and optional-guidance work rather than promote failed experiments or repeat an unaffordable full question. Current models/privacy/source boundaries unchanged; no deployment, durable-store activation, commit or push.

## 46. Summary can select exact sentences; upstream support gaps remain (24 October)

**Implemented:** owner-only summary selection copies whole checked source explanations and their citations/requirements, rejecting new wording and stale source snapshots. Optional guidance can be genuinely absent without generating a replacement footer. Full support, meaning, conditions, coverage, directness and contribution checks, withdrawal and the single shared correction remain mandatory. Website activation stays off. [Evidence and limits](ask-selected-summary-control-2026-10-24.md).

**Offline verified:** 1,589 tests in 148 files and TypeScript passed. Controls cover invented IDs/prose, changing source/context, four distinct concerns, rejected source claims, late final rejection/withdrawal, correction bounds, all-locale absent-footer display and save/hydrate preservation. This is structural proof, not religious accuracy.

**Live verified:** one current-writer selection component used the same four saved source claims, including the known defects. It selected two exact sentences, added zero wording, but inherited an earlier support gap: only 1/2 selected claims fully supported by their own Arabic originals. No final checker, new full question, complete answer or timing improvement was established. Remains gated; preserving earlier errors is still a failure of overall reliability.

**Spending:** one settled call cost $0.00025580. Latest allowance used $0.1803241475, remainder $0.0696758525; combined recorded exposure $2.06276796. 109 settled generations, ten zero-cost rejections, one confirmed local non-dispatch, no new uncertain charge. Original unresolved reservation/journal and five ancestors preserved. No process/lock or automatic rerun remains; no reservation/output reduction to force a full test.

**Accepted:** structural summary preservation only. No full-answer accuracy, release, Mo acceptance or goal completion. Upstream source claims/checker false approvals remain the main demonstrated defect. No model/privacy/source-boundary change, deployment, durable-store activation, commit or push.

## 47. Focused source checking and isolated writer input still fail the scope control (24 October)

**Implemented:** owner-only source-writer input isolation removes unchecked sibling prose and selector scope guesses, retaining every original/context, routing, conditions, schema and later checks. The actual saved incident had been labelled general by selection. No website activation. A guarded runner reconstructs exact source-check inputs and prevents completed-control repeats. [Findings and constraints](ask-source-input-controls-2026-10-24.md).

**Offline verified:** TypeScript and eleven focused tests in three files passed for source-input boundaries, source reconstruction, actual-engine withdrawal and summary integration. Twelve checker/control tests passed in the earlier focused run. Previous full-suite result remains separately 1,589/148; no fresh full-suite claim. Tests prove wiring, not meaning.

**Live verified:** the existing focused checker approved all four saved claims: two supported cores and two independently defective claims. The isolated writer control still broadened the specific walking-vow incident and its group failed unchanged copying checks. No admissible source section, final audit or complete Ask result. Both remain off; neither is an accuracy repair.

**Spending:** two settled calls cost $0.00481445. Latest allowance used $0.1851385975, remainder $0.0648614025; combined exposure $2.06758241. 111 settled generations, ten zero-cost rejections, one local non-dispatch, no new uncertain charge. Original unresolved reservation/journal and five ancestors preserved. No process/lock, automatic rerun or added budget. A normal full final-check reservation alone exceeds the remainder.

**Accepted:** evidence narrowing the defect only. Semantic false approvals remain unresolved, and further small prompt variants are not accepted as a reliability fix. No religious-accuracy, release, Mo acceptance or goal completion. Current models/privacy/source boundaries unchanged; no deployment, storage activation, commit or push.

## 48. Code blocks a recognised case-to-human generalisation; live correction still has a wording error (24 October)

**Implemented:** negative-only Arabic case-reference check in rich source/final review, applying to both normal and focused paths. Recognised restricted-person-to-unrestricted-human substitution overrides positive model votes, removes unsafe IDs and feeds the existing single correction; late earlier-claim failures withdraw. No source IDs/topics or answers hardcoded. Conservative abstentions and false-withholding risk remain. [Exact limits and findings](ask-case-referent-safeguard-2026-10-24.md).

**Offline verified:** 1,608 tests in 152 files passed, zero skipped; TypeScript passed. Recorded regression, invented unrelated roles, bounded references, broader-source abstentions, existing Arabic faithful fixtures and actual-engine positive-audit override covered. An initial Arabic conjunction-boundary test failure was corrected before this result. Mechanical prevention does not prove general semantic accuracy.

**Live verified:** one normal current-writer correction captured from the actual engine, with upstream checker approvals scripted only. The writer retained that elderly man, exercising the case boundary, but changed walking into livestock. Independent review accepts only 1/2 corrected claims and rejects the targeted case claim. No final live audit or completed answer. No retry or relaxed copy check.

**Spending:** one settled generation cost $0.00189420. Latest allowance used $0.1870327975, remainder $0.0629672025; combined exposure $2.06947661. 112 settled generations, ten zero-cost rejections, one local non-dispatch, no new uncertain charge. Original unresolved reservation/journal and five ancestors unchanged. No active process/lock or budget reset. Full final-check reservation alone still exceeds the remainder.

**Accepted:** narrow prevention evidence only. Not a useful complete correction, source-faithfulness certification, release, Mo acceptance or goal completion. Current models/privacy/source boundaries unchanged; no deployment, storage activation, commit or push. Other experimental flags remain off.

## 49. Accepted complementary evidence lost at the package cap; diverse filler trial still fails draft review (24 October)

**Implemented:** optional Quran filler-ordering control defers long exact-overlap material after other eligible contributions. Mandatory cover, named units, explicit necessary plan sources, stated conditions and existing caps remain protected. Defaults off; no website activation. No question-specific/source-ID answers. [Replay, live findings and completion audit](ask-package-evidence-and-current-limit-2026-10-24.md).

**Offline verified:** actual Quran-subset chooser replay reproduces the old four IDs, then retains complementary 14:8/14:7 under the same three cards. Full suite 1,611 tests in 153 files, zero skipped; TypeScript/whitespace passed. Initial focused assertion order corrected before passing. No fresh full selection or semantic acceptance inferred.

**Live verified:** ten unique source-only searches show a query-balance alternative changes recall without clear dominance. Old search/ranking/selection already contained and accepted 14:8. Newly admitted originals/context were independently reread before one normal initial Quran-writer component. The missing self-sufficiency evidence core is restored, but generated claims still have exclusivity ambiguity and omitted gratitude/increase conditions. Zero fully established complete draft claims; no final checker/full answer or latency result. Both experiments remain off.

**Spending:** one settled generation cost $0.00235590. Latest allowance used $0.1893886975, remainder $0.0606113025; combined exposure $2.07183251. 113 settled generations, ten zero-cost rejections, one local non-dispatch, zero new uncertain charges. Old unresolved reservation/journal and ancestors preserved. No process/lock, automatic repeat or added budget.

**Accepted:** mechanical package evidence only, not useful complete-answer accuracy, religious certification, release, Mo acceptance or goal completion. Same normal full-verification budget barrier has persisted across the preceding three goal turns; every bounded component is now reviewed and no further paid run is queued. Completion audit identifies missing full source-faithful answer evidence. Current models/privacy/source boundaries unchanged; no deployment, storage activation, commit or push.

## 50. Extra-quarter worship retest technically completes; meanings supported, answer still indirect and slow (24 October)

**Implemented:** explicit new $0.25 authorization as a separate spending journal, retaining the exact prior journal/hash and all old exposure. One fresh current-model Arabic R01 attempt only. Its runner's missing parent-signal mismatch was found and fixed offline after the run, without repeating or relabelling the paid result. [Independent review, timings and method limits](ask-worship-full-retest-2026-10-24.md).

**Offline verified:** 26 focused tests in four files and TypeScript passed for authorization, guards/storage and partial-query behaviour. Previous full-suite 1,611/153 remains separate. No model or safety/price/output limit changed.

**Live verified:** final pipeline status rich_answer. Two distinct source explanations are supported in meaning by their own Arabic excerpts, but Arabic is weak, the main divine-self-sufficiency concern is only indirectly addressed, and the summary repeats both sentences. Some hadith source requests failed; surviving candidates were not selected. No browser/UI/persistence verification; the direct runner's missing signal limited exact website-equivalence. Case-reference regression was not exercised. One bounded source merge correction; all final checks ran. No accuracy/release acceptance inferred from complete status.

**Performance/spending:** first checked 105.228 s, total 112.687 s; 74.96% slower than the original 60.145 s baseline, so 30% target missed. 19 logical requests / 21 settled generations, including two backup calls after truncated ranking outputs. 149,782 input plus 21,392 completion tokens. Cost $0.0676074625; remainder $0.24300384. Combined recorded exposure $2.1394399725. Six immutable campaign ancestors and the original unresolved reservation preserved, zero new uncertain charges, no process/lock or automatic repeat.

**Accepted:** source-supported meanings in this one repeated case only. Review classification supported but incomplete: 1/1 technical completion, 0/1 useful complete answers; 49 other bank questions not tested in this retest. No clear verified full-answer reliability improvement, scholarly certification, release or Mo acceptance. Next priorities are direct concern coverage, bounded ranking output/truncation, source-failure handling and Arabic/summary quality. Current models/privacy/source boundaries unchanged; no deployment or storage activation.

## 51. Compact ranking removes truncation in one retest; answer review still fails (24 October)

**Implemented:** fixed-order numeric ranking scores with exact count/range/whole-envelope validation and code-owned source identities. Originals/context, models, reasoning/output allowances and later checks retained. Same-ceiling continuation preserves prior journals and exposure. [Repair and independent review](ask-compact-ranking-repair-2026-10-24.md).

**Offline verified:** full suite 1,637 tests in 155 files before the continuation helper; subsequently 47 focused tests in four files and TypeScript passed. Three valid recorded score sets retain every score with about 90% smaller visible JSON. The invalid set is rejected. No semantic accuracy inferred from structural tests.

**Live verified:** one repeated Arabic worship question; four valid ranking arrays, zero truncated results and zero backups. First checked section 63.509 s versus 105.228 s previously; total 88.246 s versus 112.687 s. Original 30% baseline target remains missed. Direct pipeline only, with corrected parent signal; no HTTP/browser/history proof. Independent review of all six displayed occurrences found gratitude widened to worship and reward conditions omitted; summary inherits defects. Hadith correction withheld after changing the source meaning. Technical rich_answer does not establish reliability.

**Spending:** 19 settled calls cost $0.0674257, combined exposure $2.2068656725, remainder $0.17557814 under the unchanged ceiling. Prior journals and old unresolved reservation preserved. No substantial demonstrated cost saving or automatic paid repeat.

**Accepted:** mechanical ranking repair and measured speed improvement in this run only. Answer classification containing unsupported claim, 0/1 accepted useful complete answers. No religious-accuracy/release/Mo acceptance or goal completion. Highest-value next repair is preserving source scope and beneficiary conditions. Current models/privacy/source boundaries unchanged; no deployment or storage activation.

## 52. Explicit source-first comparison still misses target errors; rejected (24 October)

**Implemented:** owner-only subject/assertion/condition comparison with exact source and claim bindings. Eight fixed Arabic controls compare the existing meaning checker with this candidate, same current checker/privacy and output allowance. No website import. [Findings and limits](ask-source-scope-comparison-2026-10-24.md).

**Offline verified:** 22 focused tests in three files, then the full 1,654 tests in 157 files, zero failures/skips, and TypeScript passed. An unsupported schema keyword was caught locally after the baseline, corrected and covered by compilation. Only the never-dispatched candidate was then sent. A results-count status bug was corrected so a null parsed response cannot be reported as successful. Eight immutable campaign ancestors and the original spending hash verified unchanged.

**Live verified:** baseline accepted 4/4 faithful controls and rejected 2/4 defective controls, missing the widened activity and omitted belief. Candidate contract failed exact binding and was rejected wholesale. Its raw comparisons still approved both target defects, even after extracting the missing belief condition. No semantic improvement, no partial salvage, no activation. Two component calls are not eight full question attempts or a general accuracy score.

**Spending:** two settled calls cost $0.00771050, combined exposure $2.2145761725, remaining $0.16786764 under the unchanged ceiling. Original unresolved reservation and prior journals preserved; no new uncertain charge or automatic repeat.

**Accepted:** evidence narrowing the checker limitation only. No candidate/accuracy/release/Mo acceptance or goal completion. Current website models/privacy/source boundaries unchanged; no deployment or durable-storage activation.

## 53. Copy-only source isolation reduces input; live wording still not acceptable (24 October)

**Implemented:** owner-only transformation for identity-locked source copy patches. Only affected originals/full context retained; unrelated drafts removed. Semantic/merge/summary repairs and every later safety check remain intact. Active-engine import removed after failed live review. [Exact findings](ask-copy-input-control-2026-10-24.md).

**Offline verified:** 26 focused tests in three files and TypeScript passed. Actual saved correction input reduced from 16,573 to 9,637 characters with own original/context intact. Real-engine owner-only wrapper test verifies replacement checking and later full-source review. No semantic proof inferred.

**Live verified:** one current-writer correction passes copying and avoids the previous wisdom/pardon cause, but contains defective Arabic and adds a vague good outcome beyond the specific source statement. Not accepted as a complete faithful explanation; no checker, retrieval or full-answer proof. No activation or automatic repeat.

**Spending:** one settled call cost $0.00155460; combined exposure $2.2161307725, remainder $0.16631304 before the separately recorded parents regression. Same ceiling, models/privacy and source boundaries; old unresolved reservation/ancestor journals preserved.

**Accepted:** boundary mechanics and rejection evidence only. No religious-accuracy/release/Mo acceptance or goal completion. No deployment or storage activation.

## 54. Parents regression finds useful sources but exposes correction scope drift; final audit budget-blocked (24 October)

**Implemented:** one guarded current-model Arabic R03 full-pipeline regression, failed experiments off, live retrieval and no prepared reuse. Same remaining allowance; no added budget or deployment. [Independent review and next repair](ask-parents-current-retest-2026-10-24.md).

**Offline verified:** full suite 1,668 tests in 158 files, zero failures/skips, and TypeScript passed before the result. Structural proof only.

**Live verified:** four source claims appeared; final A17 audit was locally reservation-blocked. One Quran sentence correctly preserves kind companionship despite pressure toward shirk. Another adds general disobedience beyond its own cited verses. Scholar cores have useful support, but generic plural attribution does not name Ibn Baz and obligatory-obedience force needs caution. Hadith omission alone is not incompleteness. Two unshown summary claims were reviewed separately and receive no completion credit. The correction regenerated whole source sections and introduced extra wording; eligible semantic repairs should preserve untargeted sentences just as copy patches already do.

**Spending:** 16 settled calls cost $0.06258120; combined exposure $2.2787119725, remaining $0.10373184. First checked 70.943 s, total 72.759 s; no cross-question speed comparison. 142,411 input and 15,729 completion tokens. Final request never dispatched, zero uncertain charge, old reservation/ancestors preserved. No automatic repeat.

**Accepted:** useful retrieval and failure evidence only. Classification containing unsupported claim, useful complete answers 0/1. No religious-accuracy/release/Mo acceptance or goal completion. Current models/privacy/source boundaries unchanged; no storage activation.

## 55. Eligible source-support corrections preserve untargeted sentences (24 October)

**Implemented:** exact sentence/citation/requirement matching creates identity-locked text slots for support/citation failures. Untargeted source sentences stay unchanged; merge/contribution/layout and summary repairs retain their paths. Every reconstructed sentence still passes all ordinary checks and late withdrawal. No model/source/privacy/output-limit change. [Evidence and limitations](ask-semantic-repair-boundaries-2026-10-24.md).

**Offline verified:** initial 53 focused tests in four files; subsequent 35 focused tests in four files and TypeScript passed after preserving the unsafe-writer fixture's negative case across patch/array shapes. Full suite then passed 1,679 tests in 159 files, zero failures/skips. Actual parents replay locks only the targeted scholar sentence and preserves its sibling. Both Quran sentences were flagged for overlap, so this repair does not claim to prevent that specific Quran regression. Ten immutable campaign ancestors and original spending hash unchanged; no active lock.

**Live verified:** pending; no paid repair retest yet. Earlier parents and copy-isolation results are not relabelled. Last recorded remaining allowance $0.10373184, all older exposure/reservations retained.

**Accepted:** correction-boundary mechanics only. Semantic false approvals, overlap-repair scope and named scholarly attribution remain unresolved. No complete-answer/religious-accuracy/release/Mo acceptance or goal completion. No deployment or storage activation.

## 56. Code enforces named scholarly sources; one live correction preserves supported meanings (24 October)

**Implemented:** localized author metadata reaches the rich writer. A negative-only identity check prevents generic scholar-source attribution from passing on positive model votes; every distinct cited author must be named. Same-author excerpts deduplicate, approved collective institutions keep their names, source-summary synthesis remains separate. Missing names feed the one existing identity-locked correction and late-withdrawal path. [Scope and independent review](ask-named-scholar-repair-2026-10-24.md).

**Offline verified:** full suite 1,689 tests in 161 files, zero failures/skips, and TypeScript passed. Exact parents source replay triggers two failures and captures one normal localized correction. An Arabic conjunction-prefix mismatch was fixed before passing. Names are identity metadata, never semantic evidence.

**Live verified:** one current-writer component corrected the two saved source sentences. Both name Ibn Baz, pass copying, read naturally and retain meanings supported by their own Arabic excerpts. The old stronger obligatory-obedience wording is absent. 2/2 supported component meanings, not two full answers. Upstream capture verdicts scripted only; no new retrieval, live checker, full summary/question, browser or history proof. Parents Quran scope failure remains open.

**Spending:** one settled generation cost $0.00166440; combined exposure $2.2803763725, remainder $0.10206744 under the unchanged ceiling. Prior journals and original unresolved reservation retained. No uncertain charge, automatic repeat or added budget.

**Accepted:** general named-source boundary and useful live component correction only. No general religious-accuracy/complete-answer/release/Mo acceptance or goal completion. Models/privacy/source boundaries unchanged; no deployment or storage activation.

## 57. Optional guidance no longer forced in ordinary synthesis; full retest still cannot fit (24 October)

**Implemented:** ordinary rich summary may explicitly omit a useful-but-optional next-step footer. Any supplied footer still requires all shape/language/citation/safety checks; malformed or unsafe received content is not stripped. One existing correction may return a fresh valid object without it. Requested steps, conditions, support, meaning, coverage, final synthesis and late withdrawal remain mandatory. No experimental-summary activation. [Contract and sizing evidence](ask-optional-guidance-repair-2026-10-24.md).

**Offline verified:** 68 focused tests in four files; subsequently 61 in three files and TypeScript passed. Full suite then passed 1,700 tests in 162 files, zero failures/skips. Tests cover actual writer/checker schemas, storage/hydration, required practical steps, supplied unsafe guidance and late withdrawal. The initial strict mock missed an existing no_answer_feedback field and was corrected without weakening production validation.

**Live verified:** pending; zero new paid calls. Fake-transport replay reconstructs the exact blocked parents final request, preserves all body evidence/coverage and the 9,000-token allowance. Reservation falls only from $0.11642040 to $0.11580390, both above the $0.10206744 remainder. No full attempt queued, limit/output/headroom reduction or old request retry.

**Accepted:** optional-absence mechanics and fiscal evidence only. Does not solve a model's misclassification of supplied advice or the parents Quran scope error. Original journal/reservation and all prior spending retained; no model/privacy/source change, deployment, storage activation or goal completion.

## 58. Known Sunnah evidence exposes title-interface limits; printed page ranges now parse (24 October)

**Implemented:** generic ascending page-range support for Bukhari/Muslim references. Keeps first-page introduction checks and rejects malformed/reversed ranges, ambiguous hadith-number ranges and invalid integers. Original Arabic, grades and source boundaries unchanged. No title-query or source-ID production workaround. [Source probes, repair and limits](ask-hadith-title-and-reference-audit-2026-10-24.md).

**Offline verified:** 32 focused tests in three files and TypeScript passed; full suite then passed 1,715 tests in 162 files, zero failures/skips. Actual saved source metadata now retains Bukhari 4141 and Muslim 2770 instead of only the latter, with exact original bytes. The real title provider misses a known source under the saved Arabic point queries even in an oracle catalogue; exact-title wording finds it. This is a miss mechanism, not full-catalogue recall.

**Live verified:** official Arabic source identity/grade/reference format and three source-only website searches were checked. All three searches missed the known control; other results were not all reviewed. The alternative is not enabled, and no visitor-query forwarding or anonymous explanatory evidence was added. New parser replay is offline against the exact live snapshot, not a new full Ask attempt or religious-accuracy proof.

**Spending:** zero paid model calls; exposure $2.2803763725 and remainder $0.10206744 unchanged, with old unresolved reservation/ancestors retained. Public source probes were bounded with no automatic retry; the failed inline local script dispatched nothing. No paid repeat or budget increase.

**Accepted:** bibliography recovery and source-interface diagnosis only. The parents search/meaning failures and full verification remain open. No model/privacy/source approval, deployment, durable storage or goal-completion change.

## 59. Funded full parents verification exposes missing checker rows and loss of supported progress (24 October)

**Implemented:** Mo approved up to another $0.25 for one full Arabic parents retest, then stop/report. A new one-shot harness and ancestry-preserving authorization journal ran R03 through the current website rich pipeline, live research, no reuse or total cutoff. No answer-system/model/privacy/source changes during evaluation. [Result and next repair](ask-parents-verification-2026-10-24.md).

**Offline verified:** 25 authorization/guard/storage tests and TypeScript passed before dispatch. Prior production suite remains 1,715 tests; no new production code was changed. Independent review binds the exact request, displayed wording and missing attribution entries. Mechanical evidence only.

**Live verified:** first checked Quran section at 60.093 seconds, terminal incomplete at 81.052 seconds. Two temporarily displayed explanations are supported by their own Arabic originals; the previous Quran scope extension is absent. Three unshown scholar sentences name Ibn Baz, but one drops an explicit ties/assistance qualification and uses stronger obligation wording; no faithfulness credit for that draft. Combined checker responses twice omit attribution rows for the earlier Quran claims while approving their meaning. The code treats this as source attribution failure, spends the writer correction on unchanged prose and eventually withdraws the Quran group. Final synthesis never runs. Classification technical_failure; useful complete answers 0/1. Hadith search limitations remain, and the original 30% timing target is unproved.

**Spending:** 16 settled calls, $0.05819919375, 142,192 input / 16,624 completion tokens. One truncated primary ranking response and one configured backup call. New total cap $2.6324438125; combined exposure $2.33857556625; remaining $0.29386824625, all earlier charges and original unresolved reservation retained. No new uncertain charge or active lock; no automatic further paid attempt after the agreed one-test stop.

**Accepted:** source-supported transient Quran wording, named-source behavior and a specific contract/withdrawal diagnosis. No complete-answer/general religious-accuracy/release/Mo acceptance or goal completion. The next proposed repair is complete checker attribution identities plus format-failure isolation, preserving earlier checked sections while retaining genuine semantic withdrawal. It is not implemented by this evaluation. No deployment or storage activation.

## 60. Missing checker attribution entries no longer erase independently checked progress (24 October)

**Implemented:** all-claim keyed attribution output schema plus strict identity/decision validation in the active rich path. Missing, duplicate, unknown and malformed findings are checker response failures, with no writer correction, new-claim approval or withdrawal based on that invalid response. Complete negative semantic/condition findings still withdraw earlier unsafe content. No question-specific/source-ID exception, retry expansion or model/source/privacy change. [Repair, replay and limits](ask-attribution-contract-repair-2026-10-24.md).

**Offline verified:** 1,744 tests in 164 files, zero failures/skips, and TypeScript passed. An exact saved-exchange replay uses unchanged claim/original/context prompts and recorded responses under a network-blocking stub. It keeps both previously checked Quran claims, emits no scholar section/summary, spends no writer correction and preserves the report/trace/spending bytes. Historical replay comparisons explicitly account for only the declared attribution schema upgrade; no other source/coverage contract relaxation. Scripted verdicts do not prove religious accuracy.

**Live verified:** pending. The previous parents attempt remains technical_failure, not relabelled. Zero paid/source calls for this repair; remaining $0.29386824625 unchanged and all earlier charges/unresolved reservation retained. No automatic additional paid test after the previous one-test authorization.

**Accepted:** the observed contract/withdrawal mechanism is fixed and verified offline. Full-answer reliability, the unshown scholar condition gap, original timing target, source-faithfulness/release review and Mo acceptance remain open. No deployment, durable storage activation or goal completion. A separate decision can authorize one further full test within the existing remainder.

## 61. Live attribution retest keeps sections but exposes a displayed grammar/scope error (24 October)

**Implemented:** Mo authorized one full Arabic parents retest within the existing remainder, with no added money. Unique guarded run/report and independent-review scripts preserve prior journals and prevent repeat. No production repair/settings changes during evaluation. [Actual result and source review](ask-parents-attribution-retest-2026-10-24.md).

**Offline verified:** 50 focused guard/attribution checks and TypeScript passed before dispatch; TypeScript passed after review. Prior full suite remains 1,744 tests, not religious proof. Thirteen spending ancestors and the original journal hash verified.

**Live verified:** every attribution identity is returned in all four primary reviews; the previous missing-row failure does not recur. Quran and a useful Sahihayn narration appear, stay visible, and final status is incomplete. Independent review finds 2/3 displayed explanations supported; the first Quran sentence introduces أو and turns an embedded association-related phrase into a broader alternative exception. Both model checks miss it, including later rechecks. Unshown scholar drafts still lose an explicit ties/assistance qualification and remain repetitive after the single correction. Final narrow checking withholds a summary sentence about non-Muslim parents because religious status is not explicit in its own verses; whether this is an overly literal application rejection remains a qualified-review question. Classification containing_unsupported_claim; useful complete answers 0/1. No general accuracy or original 30% timing-target claim.

**Spending:** 19 settled calls cost $0.06858795; first checked 52.289 s, total 80.576 s; 170,901 input / 16,131 completion tokens. One truncated primary output and one configured backup call. Cap unchanged $2.6324438125; combined exposure $2.40716351625; remainder $0.22528029625. Old unresolved reservation retained; no new uncertain charge, active lock, budget-blocked call or automatic paid repeat.

**Accepted:** specific live checker-contract behavior and useful source retrieval only. Displayed scope drift and unfinished conclusion prevent full-answer/religious-accuracy/release/Mo acceptance or goal completion. Next priority is source grammar/scope and condition preservation; do not lower checks or hardcode this question to obtain a completion. No deployment or durable storage activation.

## 62. Final offline semantic audit and fixed source-support controls; stop for Mo's local testing (24 October)

**Implemented:** owner-only preparation of twelve Arabic source-support controls, six supported and six defective, including the latest grammar and missing-condition failures with faithful counterparts. A disputed summary application remains separate and unscored. Actual saved call provenance establishes four primary and four narrow approvals of one unchanged bad sentence on the same checker model. No new production fix or model change. [Audit and boundaries](ask-semantic-failure-audit-2026-10-24.md).

**Offline verified:** 21 focused checks in three files and TypeScript passed. One-claim requests contain only own originals/context and exclude expected labels. Exact stored claim/model/finish identities, strict schemas and unchanged history/spending are checked; no network attempts. The unrun first draft is preserved and the refined second version is hashed before any paid comparison.

**Live verified:** none added. Prior full answer remains containing_unsupported_claim and incomplete; repeated same-model approvals are not independent cases or religious proof. This preparation does not fix source meaning or establish the original timing target.

**Spending:** zero new model/source calls or cost. Remaining $0.22528029625 unchanged; all prior charges and the old unresolved reservation retained. No paid comparison or automatic repeat queued.

**Accepted:** trace-backed diagnosis and a fixed future evaluation artifact only. Mo asked to finish this last item, commit/push and launch locally. Overall reliability, qualified source review and Mo acceptance remain open; no goal-completion, deployment or storage-activation claim.

## 63. Fix the live local Quran stall at the complete-operation boundary (24 October)

**Implemented:** after Mo's stalled anger request, Quran authentication/search/content now use the existing hard promise deadline around auth waits, headers and JSON bodies. Late auth data cannot populate the token cache, expired queries cannot dispatch after headers resolve, and failed verse reads release shared entries/content slots. Partial successful queries survive. Existing source ten-second limits, overall local patient execution, exact originals, model/privacy and evidence checks remain unchanged. [Diagnosis and verification](ask-quran-stall-repair-2026-10-24.md).

**Offline verified:** 21 focused tests; full suite 1,756 tests in 166 files, zero failures/skips, plus TypeScript. Includes transports ignoring cancellation, body stalls, late tokens, visitor cancellation, shared reads and queue recovery. No malformed source is accepted to make recovery pass.

**Live verified:** bounded source-only searches and verse 3:134 finished in 1.407 seconds; sixteen candidates, original verse and English translation available, no reported failures. Restarted local site; /en/ask returns 200. No generated answer was rerun and no semantic-accuracy claim follows from source availability.

**Spending:** zero new model calls; existing evaluation spending/reservations unchanged. No automatic paid test or deployment.

**Accepted:** the observed source-stall boundary is repaired and source availability verified. Earlier semantic scope/condition failures, full-answer reliability, qualified review and Mo acceptance remain open. Existing browser requests cannot survive a server restart and need retry. No durable storage activation or goal-completion claim.

## 64. An existing complete English answer also omits the known source qualification (24 October)

**Implemented:** source review of an existing visitor-initiated English parents response only. No new request or production change. The exact trace-bound review inspects all nine displayed claim occurrences rather than treating rich_answer as acceptance. [Findings and usage boundaries](ask-existing-english-source-review-2026-10-24.md).

**Offline verified:** TypeScript passed; review binds terminal language/status, exact affected wording, the own original's exception and eighteen existing usage entries. Six claim occurrences have supported cores, two repeat a missing source qualification, one application remains a review question. Counts are not independent-answer accuracy.

**Live verified:** none newly added. The historical response predates the Quran stall repair. The current file inventory has no post-restart question, so no new end-to-end answer proof. The review shows the same source-condition problem in English despite technical completion; it does not invalidate the separate transport repair or claim it solves semantic judgment.

**Spending:** no network/model calls or new cost. Historical manual website usage is recorded separately from immutable evaluation spending; no journal, old reservation or visitor history changed.

**Accepted:** additional source-faithfulness failure evidence only, not the completed answer, general accuracy, source/release review or Mo acceptance. No paid comparison, website model/privacy/source change, deployment or goal completion. Any comparison on the prepared balanced controls requires its own scope decision.

## 65. Five-cent authorized comparison shows false approvals in the primary and false rejections in the backup (24 October)

**Implemented:** one separately approved comparison of the current checker and configured backup on twelve fixed Arabic single-claim controls, no expected-label leakage or website switch. Added a persisted task execution ceiling within the unchanged overall spending authorization, enforced before every dispatch and across overlapping reservations. [Complete results and independent rationale review](ask-twelve-case-checker-comparison-2026-10-24.md).

**Offline verified:** 38 focused checks and TypeScript before calls. Later malformed null/string/boolean cap hardening passes 34 focused guard checks; final full suite 1,767 tests in 167 files, zero failures/skips, plus TypeScript. Mechanical spending/protocol proof only.

**Live verified:** 24/24 readable settled generations on all twelve controls. Gemini accepts 6/6 faithful controls but falsely approves 4/6 defective statements, including both latest parent-related failures. Mistral blocks 6/6 defective statements but wrongly rejects 4/6 faithful controls. Several of its negative reasons contradict explicit source text; blocking alone is not proof of diagnosing the actual defect. No website replacement, unanimous-vote rule, religious-accuracy improvement or full-answer acceptance is justified. The disputed application case stays unscored; this is not a held-out/global accuracy estimate.

**Spending:** authorized maximum $0.05; actual $0.00662064375. Global cap unchanged $2.6324438125; inherited exposure $2.40716351625; task ceiling $2.45716351625; new combined exposure $2.41378416; remaining $0.2186596525. All 24 calls normal-stop HTTP 200 with settled receipts; fourteen ancestor hashes and original journal unchanged. Old unresolved reservation counted; no uncertain charge, active lock, automatic repeat or new budget.

**Accepted:** safe task spending boundary and evidence against blindly replacing the primary or adding a mandatory backup vote. One comparison finished/reviewed; no further paid call queued. Overall semantic reliability, qualified source review and Mo acceptance remain open. No production/model/privacy/source change, deployment, durable storage activation or goal completion.

## 66. Completion audit confirms a source-meaning decision gate after three consecutive turns (24 October)

**Implemented:** no further website change. Requirement-by-requirement completion audit preserves the full outcome instead of treating source transport, strict contracts or offline tests as proof of semantic reliability. [Current audit and decision needed](ask-current-goal-completion-audit-2026-10-24.md).

**Offline/current-state verified:** latest private Arabic/English reviews remain unaccepted, comparison remains reviewed with primary false approvals and backup false rejections, original ledger hash unchanged, all 24 comparison receipts settled, no active lock or running evaluation process. Unrelated mockup deletions untouched. No new network/model/source call or added cost.

**Live verified:** none added. The source-meaning gate is revalidated across records 64, 65 and this audit. No accepted current-model activation candidate or full-answer acceptance is established. The original latency target, full patient recovery and qualified/Mo acceptance remain open.

**Spending:** cap $2.6324438125, exposure $2.41378416, remainder $0.2186596525 unchanged; old unresolved reservation retained. Latest paid scope finished/reviewed; no automatic repeat or new model proposal activation.

**Accepted:** completion remains unproved. Mark goal blocked pending direction on qualified source review or preparing a separate additional-checker proposal. Respect the current-model restriction; do not lower checks, hardcode questions or infer permission for further paid calls. No deployment, storage activation, silent pause or goal completion.

## 67. Mo requests my own review; published sources refine both system and evaluator findings (24 October)

**Implemented:** source-by-source assistant review, not outside-reviewer outreach or a model change. Reopened published Quran verses, the hadith page with its explanation, and official Ibn Baz pages. Reviewed all twelve statements and the previously disputed parents application. [Full findings and corrections to earlier framing](ask-assistant-full-source-review-2026-10-24.md).

**Source verified:** clear conditional-scope, recipient and invented-cause/promise errors remain. Faithful provision/feeding and gratitude paraphrases were wrongly rejected. S03's literal narration needs explanatory context before treating it as an uncomplicated public-answer positive. S11 is incomplete practical advice, not automatically a false religious ruling. Official Ibn Baz explanations directly support the non-Muslim-parent application; newly found sources do not retroactively become the earlier answer's citations. Historical paid inputs, labels, outputs and journals remain unchanged with a linked reassessment.

**Offline/live answer status:** no new model test, code acceptance or generated answer. No benchmark relabelling presented as a fresh accuracy gain. Existing full-suite evidence remains 1,767 tests; documentation review requires no extra test run. No website source import/approval or storage change.

**Spending:** no new metered AI calls; evaluation journals and unresolved reservation unchanged. Only public source reading; no messages sent or paid comparison queued.

**Accepted:** my source-based review and more precise error categories, not external scholarly certification, release/Mo acceptance or goal completion. Current models retained. Next implementation should distinguish clear unsupported assertions, incomplete advice and interpretation/context needs while preserving relevant evidence and qualifications.

## 68. Current-model meaning and answer-quality repair (24 October)

**Implemented:** approved plan applied to the active rich writer/checker: shared meaning rules, exact negative-finding receipts, separate support/qualification/context/coverage/checker-failure outcomes, bounded correction feedback and retention of earlier checked sections without a grounded finding against them. Source-identified approved context is transported without admitting unnamed commentary or newly discovered pages. Technical interruptions have separate Arabic/English/German copy. A 21-case v3 Arabic component bank preserves historical labels and requests separately. [Implementation, limits and verification](ask-meaning-quality-repair-2026-10-24.md).

**Offline verified:** 1,783 tests across 169 files passed; TypeScript passed. Coverage includes Arabic receipts, unrelated/invented source rejection, approved-context identity, malformed-checker preservation, real negative withdrawal, correction bounds, empty groups, single-group completion, stream order and translated presentation. Scripted positives/negatives verify behavior, not model judgment. Original bank and spending-journal hashes remain unchanged; preparation is reproducible with no paid calls.

**Live verified:** not tested for this repair. No new model comparison, full visitor answer, measured accuracy gain, time saving or spend claim. Further paid tests require a fixed approved sample and limit. Current models, privacy, approved sources, patient-worker gates and unresolved spending reservation remain unchanged.

**Accepted:** pending actual-answer source-faithfulness review and Mo's acceptance. No deployment, durable storage activation or goal completion. Context plumbing cannot supply an absent approved explanation, and receipt validation cannot prove semantic correctness.

## 69. Approved fixed-sample online test; stop after the first source-review failure (24 October)

**Implemented:** evaluation runner only, for the explicitly approved R03/F13 Arabic sample within the existing remaining allowance. Reserves each dispatch, checks live provider price ceilings, retains current models/privacy, verifies ledger ancestry, skips prepared reuse and requires manual review before F13. No answer-system edit during this evaluation. [Full result and limits](ask-meaning-quality-live-report-2026-10-24.md).

**Offline verified:** runner dry-run made no model calls; TypeScript passed; 23 focused spending/meaning-contract tests passed before dispatch. Existing answer repair's 1,783-test full-suite result remains recorded separately.

**Live verified:** R03 technically completed with Quran, scholarship and final summary. Hadith search failed. First checked output 82.177 seconds; total 123.674 seconds; 16 model dispatches, one configured backup, zero writer corrections; 213,431 input and 25,869 completion tokens. Actual cost $0.0936866; remaining allowance $0.1249730525. All charges settled and fifteen prior ledger hashes verified unchanged. F13 is **not tested**, stopped after review; the remaining funds also cannot cover the measured final-check reservation alone.

**Accepted:** failed source-faithfulness acceptance. Nine displayed claims reviewed: five supported, two supported cores with practical qualification gaps, one Quran claim broader than its own citations and one obligation-strength wording not independently verified. The wider norm has scholarly support elsewhere; this is not a finding that it is false doctrine. Incorrect positive checking survived the new rejection-receipt safeguards. No general accuracy estimate, speed target, scholarly certification, release or Mo acceptance established. New ledger stopped; no automatic repeat or further paid calls.

## 70. Offline source-boundary and explicit-condition repair (24 October)

**Implemented:** after Mo approved the two offline fixes, source-writing input is limited to permitted originals with their exact attached context; unchecked sibling drafts and generated planning prose are removed. Narrow preflight checks flag recognisable unaccounted action conditions and uncited alternatives in conditional-refusal instructions before a positive model vote can approve them. Existing bounded, identity-locked corrections and full checking remain; no new retry loop, experimental feature activation or question/source-specific rule. [Repair evidence and limits](ask-source-boundary-offline-repair-2026-10-24.md).

**Offline verified:** saved nine-claim R03 replay flags exactly the Quran scope expansion and the two missing financial-condition occurrences. Eleven faithful-labelled bank controls remain unflagged. Unfamiliar-topic and paraphrase controls, all-positive fake checkers, ignored corrections, successful single corrections and preservation of earlier checked sections are covered. All 1,804 tests across 170 files, TypeScript and whitespace checks passed. Saved Quran writer input goes from ten originals to seven permitted originals, retaining their exact context; characters 19,787 to 16,965, not a measured cost or speed result.

**Live verified:** no new paid call or full live answer. The old failed attempt and stopped ledger remain unchanged; no retrospective acceptance from replay. Sixteen settled calls and $0.0936866 are the previous test's spending, not new spending. No deployment or storage change.

**Accepted:** pending actual-answer source-faithfulness review and Mo's acceptance. These lexical/grammatical review gates are deliberately narrow, can miss other wording and can request correction for ambiguity. They are not general entailment proof; shared batch-source writing, semantic reliability, source retrieval failures and live timing remain open. No goal completion or release acceptance.

## 71. One approved source-boundary live retest; wording variant still fails review (24 October)

**Implemented:** evaluation runner only for one Arabic R03 retest, after Mo explicitly allowed at most $0.25 more. Old remainder, all charges and unresolved exposure retained. Same models/privacy and conservative reservations; live provider price ceilings checked. No answer-system edit during testing/review. [Full source-based result](ask-source-boundary-live-retest-2026-10-24.md).

**Offline verified:** runner dry-run made no calls; TypeScript and 32 focused spending/boundary tests passed before dispatch. The actual new defective wording was replayed offline after completion and produced no boundary finding, confirming the narrow gate's miss. No wording-specific patch was added during evaluation.

**Live verified:** technical full answer with Quran, scholarship and summary; hadith source search failed. First checked output 79.591 seconds, total 109.110 seconds. Sixteen dispatches, one configured backup, zero writer corrections; 182,652 input and 19,039 completion tokens. Cost $0.074958575; remaining evaluation allowance $0.3000144775. All charges settled; sixteen ledger ancestors verified unchanged. The Quran writer really received only five Quran originals. Descriptive time/cost reductions are not controlled accuracy or performance proof.

**Accepted:** failed source-faithfulness acceptance. Seven displayed claims reviewed: five supported, one Quran claim broader than its own citations and one assistance qualification/strength concern. The final summary's wider norm has a scholarly citation; the Quran sentence does not. No finding that the wider norm is false doctrine. The old financial-need claim was not reproduced because that source was not selected, so its live repair remains unverified. The new wording bypassed the narrow guard and both checker stages. New ledger stopped; approved one-attempt scope finished. No release, certification, goal completion, automatic repeat or additional paid test.

## 72. Mo selects GPT-6 Luna as the first checker (25 October)

**Implemented:** OpenRouter's default checker chain now tries `openai/gpt-6-luna` at medium reasoning, then keeps the separate Mistral fallback. The Gemini writer stays separate. The existing OpenRouter ZDR and data-collection-denied request preferences are unchanged; if no eligible route accepts the Luna request, the existing chain handles provider unavailability.

**Offline verified:** not yet. No new model call or answer-quality test was run with this selection.

**Live verified:** not yet. Configured environments can override the default checker chain, so the active production model still needs a model-ID trace after deployment.

**Accepted:** Mo requested the model selection. Religious source-faithfulness and answer-quality improvement remain unverified; this is not acceptance of the model's judgments or of the Ask system.

## 73. Mo chooses GPT-6 Luna for both writer and checker passes (25 October)

**Implemented:** the default OpenRouter writer and checker chains both start with `openai/gpt-6-luna` at medium reasoning. They remain separate calls with their existing distinct writer/checker instructions. Gemini 3.8 and Mistral remain respective fallbacks; the exact Luna overlap is the only shared model identity allowed. Existing ZDR and data-collection-denied preferences remain active.

**Offline verified:** TypeScript and the production build passed. One existing build warning remains: the private corpus import pattern matches many local files. No test suite or model call was run.

**Live verified:** not yet. No paid answer request was made. Configured environments may override model chains; active production model IDs still need confirmation from a real request trace.

**Accepted:** Mo selected this cost-focused configuration. Because Luna writes and checks its own answer, the checker is not independent. Source-faithfulness and answer-quality improvement remain unverified; no religious accuracy claim is made.

## Remaining work and release boundaries

- Review the drafted regression pairs and run the prepared actual-builder comparison after reconciling the spending reservation. No new paid calls were made during this work.
- Original-passage backend routing and independent patient-family discovery are implemented but gated. Prepare an accepted eligible index, measure ranking with matched candidate access and prove useful selection across unfamiliar questions and languages.
- Finish writing-contract simplification, correction coordination, exact-excerpt translation availability and language review.
- Connect the accepted components to the existing patient worker and verify storage/privacy/recovery, reconnection, revision/withdrawal and uncertain billing. The staged worker and migration are not remotely accepted or enabled by this work.
- Run the guarded six-question comparison, then separately budgeted reviewed and held-out batches. Record source-faithfulness, native-language review and Mo's acceptance separately.
- Patient execution, focused checks and distinct selection remain gated. No phase is accepted solely because code exists or offline tests pass.
