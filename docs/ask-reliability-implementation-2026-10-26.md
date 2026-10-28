# Ask reliability implementation record

Mo authorized implementation on 26 October 2026. The active objective remains the full [phased plan](ask-reliability-repair-plan-2026-10-26.md). This record is progress evidence, not completed answer-quality acceptance.

## Baseline and existing-library inspection

- `scripts/prepare-ask-reliability-baseline.ts` freezes four recorded attempts and a fixed paired English/Arabic reference set with negative controls. It performs no network calls. The retention worksheet binds each ranking score to its exact candidate index and tracks selection roles and writer-package inclusion without copying visitor wording or originals into the report.
- Artifacts are private: `work/private-ask-evaluation/reliability-20261026/baseline/`. Hashes bind the reports to the saved traces. Model verdicts are not treated as independently reviewed semantic labels.
- `scripts/review-ask-library-readiness.ts` permits only Bayan GET/HEAD metadata/source reads and the known read-only approved-search RPC. It makes no Ask/model call or database mutation. Fixed queries returned 8 eligible stored hadith and 3 scholar excerpts for promises; 8 and 8 for parents; and 8 and 7 for Islam-truth discovery. These counts establish discovery/eligibility, not relevance of every result.
- Original-text inspection confirmed that the promises results include Bukhari 33 and a scholar explanation of that report; the parents results include a source explicitly restricting obedience to what is right while retaining kindness; and the broad-question results include an approved scholar excerpt presenting the Quran as an enduring sign of prophethood. This is source-alignment inspection, not scholarly certification or proof of full-question coverage.
- Active routing is not changed yet. Before selecting the stored-hadith route locally, verify bibliographic/topic-map lookups, named references, source eligibility, original context and saved-answer rehydration. Existing topic hints use HadeethEnc numeric IDs while the library lookup expects stored UUIDs, so a blind mode switch would lose those mapped lookups.

## First Phase 1B repairs

1. A well-formed direct/partial-direct candidate with scope no/unsure is excluded without invalidating independent valid sources. Its negative decision is never promoted. Unknown IDs, malformed contributions, contradictory direct/background roles and unsafe conflicts still fail. Visitor-named passages cannot be silently omitted to make a different source pass.
2. When ranking retains no candidates, the selector returns `no_ranked_candidates` and an evidence gap without spending a model call on an empty assessment pool. This gap is eligible for the existing bounded recovery mechanism.
3. Empty/incomplete or contradictory source-stage assessments can receive one bounded reassessment against the unchanged candidate pool and question. This is separate from new-source research. It does not retry transport/billing failures, invented source identities or ordinary negative support decisions. A second failure remains a failure.
4. Background-only source packages now receive a bounded recovery opportunity before their contribution is frozen. Prior valid background survives an ordinary remaining evidence gap, but not a fresh invalid/unsafe assessment. All displayed explanations still require normal source/meaning checks.
5. Contribution instructions distinguish applicability and preserved scope from whether one passage completely answers the concern. Related identity statements cannot automatically establish a separate proof.
6. The continuation engine contract was revised so sessions made under the previous selection/recovery rules cannot silently reuse that old contract after this change.

## Verification so far

- Offline replay of recorded selection A12 from trace `1347add9-4c58-4c45-a7d5-89ed01ac1dca`: scope-uncertain Q4:174 is excluded; the original remaining verdicts still select zero passages. The final code is now a genuine evidence-gap reason rather than a package-wide scope rejection. No model/source call, invented coverage or religious-text rewrite occurs. Artifact: `selection-replay.json` in the private reliability folder.
- New tests cover candidate-local rejection, no forced coverage, unknown identities, contradictory roles, visitor-named passages, empty ranked pools, bounded same-pool reassessment and no transport/billing retries.
- A stable-lane test verifies recovery before committing a background-only package, without a whole-answer restart.
- A focused seven-file run passed 98 tests. A later four-file run after the prompt/engine-contract update passed 66 tests, overlapping those runs; they must not be added together. TypeScript passed.
- No paid generation, environment/model switch, database write, deployment or commit was performed in this implementation checkpoint.

## Work still required

- Complete the reference-source semantic labels and library-route compatibility checks.
- Implement and verify the approved explanatory-dependency/citation design across package construction, writing and checking.
- Repair writing/correction and useful surviving-claim behavior with exact overlap and negative controls.
- Complete the transport gate and live verification of the measured Haiku output-allowance repair under unchanged aggregate protections.
- Finish precise failure/continuation classification and stable-reader regressions.
- Run the full English/Arabic browser acceptance with the remaining approved allowance and honest source review. Inspect current ledgers first; unresolved charges are not free.

The goal is active. Passing the checks above does not establish a completed, useful live answer.

## Follow-on implementation checkpoint

Mo resumed implementation after the report-strengthening revision. The following repairs are local and uncommitted. No paid generation, configuration switch, migration, database write or deployment was performed in this checkpoint.

### Existing-library hint compatibility

- Kept source-identity lookup separate from discovery-hint resolution. HadeethEnc topic hints can now resolve their verified book/number references to independent stored originals. They never relabel HadeethEnc wording as stored text or create a mixed-source answer.
- Stored bibliographic discovery validates the collection and exact number after the bounded URL-prefix read, rejects incomplete/oversized originals, and requires the exact stored ID to pass the current approved-search RPC. Publication or an old index approval alone does not bypass present search/AI permissions.
- All returned variants still require independent relevance, meaning and context assessment. A shared hadith number is a discovery relationship, not proof that every variant establishes the same statement.
- Integrated the resolver into stable, older progressive and ordinary pipeline callers. Stable lanes resolve shared hints once and retain them before the search cap. Fixed a real cap-loss path where eight ordinary hits could remove every mapped source before selection.
- Read-only probe `scripts/review-ask-library-hints.ts` resolved HE66511 to three eligible stored variants and HE66512 to five. The original reference numbers and full stored originals are kept privately in `library-hints.json`; no model calls were made. This establishes those two compatibility examples, not collection-wide equivalence or answer quality.
- Focused library/hint/pipeline runs passed; a later three-file run including the cap-retention case passed 59 tests. Legacy saved-source hydration tests passed in those runs. Active `HADITH_SOURCE` remains unchanged pending the remaining route/answer acceptance.

### Writing and surviving explanations

- `scripts/review-ask-copy-failures.ts` replayed exact saved overlap checks. The promises run contains genuine six-token source-clause matches and a quoted source expression. The copying/quotation thresholds were not weakened. The review is editorial evidence, not a source-support verdict.
- Fixed approval reuse: a narrow meaning review only examines changed/unapproved claims. Its rejection of one changed claim no longer removes exact approvals of unrelated, unchanged claims omitted from that narrow request. Newly reviewed failures remain excluded; new context and changed claims still require their normal review.
- A source-only stage can now retain a strictly smaller, individually checked surviving set after its bounded correction settles. Before its first publication, that set receives fresh source-stage checking for support, relationships, qualifications and usefulness. Exact meaning approvals are reusable only under the existing unchanged fingerprint. There is no writer retry loop or extraction from malformed drafts/checker envelopes.
- Negative controls withhold an unhelpful surviving set, invalid checker output and cases with no approved claim. Existing condition and source-boundary controls still pass. Seven focused files passed 51 tests and TypeScript passed. These are scripted original/verdict fixtures, not live religious-answer acceptance.

### Measured output allowances

- `scripts/review-ask-output-allowances.ts` reads saved receipts only. Arabic parents calls A8/A12 each used all 2,200 output tokens as reasoning and ended with `length`. Promises correction A17 used 1,730 reasoning tokens and also ended at 2,200. The Arabic frame correction reached 1,600, including 1,189 reasoning tokens.
- Haiku-primary source writing now uses the already established 6,600-token full-writing ceiling; rich frame writing uses 3,200. Other writers' source allowance and the existing summary allowance are unchanged. Reasoning effort, schemas, claim lengths, backup chains, retry counts and aggregate call/token/spending limits are unchanged.
- Reservations use the allowance actually sent. Integration checks verify the real writer request and unchanged claim schema, plus rejection before dispatch when the aggregate token limit cannot fit that allowance. A six-file run including transport and summary regressions passed 90 tests. A larger allowance is not proof of future completion; live verification remains open.

### Trusted refusal before dispatch

- Added an internal typed refusal used only by the trusted operator guard before any provider dispatch. That refusal removes only its own unsent reservation and reports an execution limit. It does not invent an unknown charge, enable fallback dispatches or offer a continuation under the same blocked allowance.
- Ordinary exceptions, provider rejections without receipts and response-stream failures still keep their reservation and billing hold. A response failure cannot masquerade as an unsent request. Existing settled costs and other reservations are preserved.
- The four-file continuation/route/accounting run passed 38 tests. The test harness now expires its own fixtures between tests without raising the real session limit. New contract revision `progressive-20261026-reliability-2` prevents reuse of sessions under the old publication/budget policy.

### Still open

The explanatory-dependency/citation contract in Phase 1C is not implemented or accepted. Complete-source semantics, related-but-insufficient controls, precise content-failure classification, full reader replays, build and the locked real English/Arabic browser acceptance remain required. None of these local repairs makes the feature release-ready by itself.

Combined checkpoint: 18 relevant files passed 285 tests, TypeScript passed, and the checked tracked diffs have no whitespace errors. These counts overlap the earlier focused runs. Stored-route continuation also needs explicit inspection: `server-job-freshness.ts` currently depends on the separate approved-index state RPC for stored hadith; ordinary stored discovery must not be enabled on the assumption that this continuation path has been accepted.

## Owner browser failure: 798d0f45, 26 October

Mo's English promises attempt is a failed acceptance result, not a successful or merely slow answer. The exact trace is `798d0f45-38a6-4c07-b751-0b15cadd4872`.

- All three families reached selected evidence and drafting. Hadith copying triggered the existing single correction. Those corrections and the selection/recovery changes did not establish a useful displayed answer.
- At 44,990 ms, Quran checker A18 received HTTP 400. Its request had four claims and a twelve-root-field audit, subject to the current four-field transport partition. The response lacked a cost receipt, so the continuation transport correctly held further paid work. Other ongoing checker calls completed a part but could not dispatch their subsequent parts under that hold. All sections ended `failed_check`; terminal output at 51,467 ms was empty and incomplete.
- This trace stores the generic provider rejection but not the underlying response body. A previous saved probe explicitly identifies an oversized compiled grammar; that is a relevant lead, not proof of this fresh rejection's exact cause. Do not label the current run as another confirmed grammar failure without its response.
- Added classification of nested provider metadata and private local rejection-body capture before missing-receipt handling. General diagnostics retain fixed categories only. Billing holds, source checks and retry policy are unchanged. No new generation or paid reproduction was performed for this investigation.
- Focused transport/refusal checks passed; this improves diagnosis only. The rejected checker request still needs a demonstrated repair and real acceptance. Do not ask Mo to regard passing offline tests as proof that the empty answer has been fixed.

## Owner-requested DeepSeek trial, 2026-10-26
- Primary writer and checker changed to openrouter:deepseek/deepseek-v4-flash. Separate same-model passes are explicitly authorized by Mo. Existing Gemini/Mistral fallbacks remain.
- Uses advertised high reasoning, strict structured output, existing privacy routing and unchanged aggregate spending limits. Source writing retains 6600 tokens and frame 3200 to allow reasoning room. Conservative route ceilings: USD 0.60 input / 1.32 output per million tokens, actual receipts settle charges.
- Offline verification: 51 focused tests and TypeScript passed. No paid generation sent in this change. Live answer quality and complex-schema compatibility remain unverified; the earlier Haiku failure is not claimed fixed.


## Owner-requested return to Luna, 2026-10-26
- Mo ended the DeepSeek trial and restored openrouter:openai/gpt-6-luna as primary writer and checker, with existing medium reasoning and Gemini/Mistral fallbacks. Evidence checks, privacy routing and spending limits remain unchanged. New answers use this choice; existing in-flight requests retain their already-created model dependencies.
- Offline adapter and model-chain checks passed. No paid generation was sent to validate answer quality during this switch.


## Search, conclusion and interrupted-research repair
See docs/ask-search-conclusion-implementation-2026-10-26.md for implemented changes, frozen replays, passing offline checks, and the background-storage activation gate. Live acceptance remains pending Mo's manual tests; no paid generation was sent for this repair.


## Anger-answer meaning excerpt failure
The active condition checker now selects code-owned original/context excerpt IDs instead of retyping Arabic. See docs/ask-meaning-anchor-fix-2026-10-26.md for the exact captured failure, contract change, zero-call replay and safety controls. Mo owns live acceptance; no paid test was sent.


## Further live anger failures reviewed
See docs/ask-anger-followup-2026-10-27.md. The anchored checker ran successfully; separate frame-label rejection and a discarded supported sibling caused the new failures. Narrow correction-feedback and fresh-subset-review repairs passed focused checks. Overall live acceptance remains open; no paid generation was sent.

