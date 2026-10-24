# Bayan Ask: phased system repair plan

Date: 21 October 2026

Updated after review of Gemini’s feedback: 21 October 2026. Only the useful, bounded adjustments are incorporated below.

## Useful review additions retained

- Capture the original failures before making small, code-owned presentation fixes.
- Separate checking source support from checking whether the answer is useful and complete.
- Select complementary evidence for the question's actual concerns, rather than filling source quotas; investigate discovery alongside selection.
- Give failed sections targeted corrections within one shared spending and call limit.
- Keep supported explanations available when a display translation is missing, with clear labels.
- Prove staged delivery with deliberately slow services, and measure improvements before changing defaults or releasing.

These additions are included in the phases below. They do not establish that the repairs already work or replace source-faithfulness review.

Status: implementation authorised by Mo; in progress. This does not approve religious content, apply remote migrations or authorise production deployment. Current evidence is recorded in [the implementation log](ask-system-repair-progress.md).

## Objective

Deliver useful, source-faithful explanations while checked sections become available in this order:

**Quran → Sunnah → named scholarly explanations → Bayan’s final cited summary.**

Accuracy takes priority over speed. An empty source group alone does not make an answer incomplete. A missing necessary explanation or unsupported conclusion does.

Repair the shared system across questions. Do not build new hardcoded answers or topic-specific exceptions as the foundation of the repair.

## Confirmed starting point

- The active local rich path waits for combined search and selection before writing. The patient worker is implemented and offline-tested but remains gated off; its storage migration is unapplied remotely.
- A recorded completed answer passed checking despite including wording its displayed citations did not establish. Quran 51:57 was available as neighbouring context, not as a selected citation.
- The package builder fills spare source places after covering the question. Direct sources are not required to add distinct contributions, while the writer must explain every selected source and the checker rejects repetition.
- Active HadeethEnc discovery uses title-word matches before original-text ranking. Later meaning ranking cannot recover evidence that never enters its candidate set.
- Malformed model output, writing-rule failures, contradictory checking and correction coordination have caused failures. Recent targeted repairs are not proof of reliable live answers.
- The adapter requests JSON-object output and includes the schema in instructions; it does not request schema-enforced output.
- The existing test suite verifies substantial implementation behaviour, including adverse cases. It does not prove that the live checker recognises unsupported meaning. The saved paired checker evaluation has no completed results and uses a different checking builder from the rich path.
- Translation availability and exact-excerpt matching remain incomplete. Unpublished translation drafts must not become trusted display text automatically.

Evidence and previous implementation status:

- [Recorded owner-test diagnosis](ask-owner-tests-20261021-evening.md)
- [Patient repair implementation record](ask-patient-sections-repair.md)
- [Search-engine implementation record](ask-search-engine-implementation.md)

## Execution rules

- Reuse reliable existing components and the staged patient worker. Do not restart the project from scratch.
- Keep current model chains initially. Compare model changes only after isolating the failure and establishing a controlled baseline.
- Keep approved source boundaries, authenticity checks, original text, permissions and source-revocation rules.
- Preserve the legacy JSON endpoint, approved AnswerV2 prepared answers and existing saved rich-answer versions. Newly generated explanations do not inherit prepared-answer approval.
- Published learning articles do not automatically become approved Ask evidence.
- Keep retrieval, rich presentation and patient execution independently switchable.
- No unlimited retries or spending. Preserve the model-request journal and never repeat a paid call automatically when its completion or billing is uncertain.
- No automatic paid evaluation until the outstanding reservation is reconciled using a matching final receipt. Do not reset or bypass the ledger. Offline work continues independently.
- Remote storage changes and production deployment require their own reviewed acceptance and authorisation; this plan does not perform either.
- Maintain one ordered record showing **implemented**, **offline verified**, **live verified** and **accepted** separately.

## Phase 1 — Establish a trustworthy baseline

### Work

1. Freeze the unchanged baseline before repairs. Replay the recorded model inputs and outputs at the affected stages, preserving the exact failing structure and checker decisions. Start with requests `4e5a8450`, `917dc7fa`, `585fac8c`, `3ed47b16`, `9fd0c6e6` and `d814df06`; these are six attempts covering three question subjects, not six independent questions. Cover malformed responses, missing evidence, redundant sources, unsupported clauses, lost qualifications, contradictory checker findings and interrupted execution. Keep raw private traces under existing access/retention rules; committed fixtures must exclude credentials and private conversation history. If sanitisation changes a failing detail, record it and verify that the failure is still reproduced.
2. Include valid answers and legitimate incomplete answers. Do not define success as making every question return a completed answer.
3. Separate code behaviour, source faithfulness, completeness and reader usefulness in the results.
4. Record the code revision, model/source configuration, active feature switches and actual execution path for each comparison.
5. Prepare reviewed correct/incorrect claim pairs from the failures and existing fixtures. Mark unresolved religious or language judgements as unreviewed.
6. Reconcile the outstanding charge before paid evaluation. Continue offline engineering while reconciliation remains open.
7. After capturing the baseline, bring narrowly defined presentation-field cleanup forward from Phase 5. For example, code can normalise an irrelevant scholarly-position label on a known Quran/hadith candidate, recording that normalisation, without changing the original, source identity, support, scope, conditions or conflict decisions. Do not use this as permission to repair unknown citations, invent missing fields or rewrite malformed internal JSON. Maintain separate before/after results.

### Deliverable

A fixed regression set, a current baseline report and an explicit list of unreviewed cases. Include unfamiliar wording and reserve held-out questions rather than tuning only to the owner’s examples.

### Exit gate

Every recorded failure has an identified stage and a repeatable test. Test checker inputs directly so a framing or writing failure cannot prevent assessment of the checker itself. No case passes merely because its terminal status says complete, and no incomplete evaluation is presented as a passed quality gate. Moving presentation cleanup earlier does not justify a blanket increase in citation limits or changes to the ranking switch before comparison.

## Phase 2 — Repair recognition of unsupported claims

### Work

1. Separate checking into two focused steps: **A — claim-to-cited-excerpt support**, then **B — usefulness, completeness and consistency of the surviving combined answer**. Do not bundle translation alignment and a detailed presentation taxonomy into the strict support task. Any separate display-translation check must still pass before the translation is shown.
2. For support, compare every assertion and joined clause with its exact cited originals. Check attribution, audience, conditions, scope and causal meaning. Preserve supported, unsupported and uncertain outcomes; uncertainty must not be forced into a positive verdict. Assess faithful meaning rather than demanding identical wording.
3. Clearly separate restrictive context from supporting evidence. Neighbouring passages may prevent a misleading interpretation; they cannot establish an uncited claim.
4. When a statement needs another passage, retrieve and verify that passage through the normal eligibility/context checks and select it as a citation before using the statement. Do not silently promote context to approved evidence.
5. Check the surviving answer separately for completeness, consistency, repetition, useful explanation and appropriate guidance. Earlier selection does not establish final coverage.
6. Batch claims where practical. Do not automatically create a separate model call for every sentence.
7. Compare the current and simplified checker designs using the same models first. Test more capable checker models only if the measured results justify a controlled comparison.
8. Evaluate the actual rich checking path. Reuse suitable existing fixtures, but do not treat an evaluation of a different builder as proof of current behaviour.
9. Include paired tests for the recorded failures: a faithful Q51:56 claim, an added provision claim citing only Q51:56, and the unsupported benefit claim citing Q29:17/HE65936. Include both presence and absence of neighbouring context, other subjects and held-out wording to avoid tuning to these examples alone.
10. After billing reconciliation, run a small, separately budgeted real-model checker comparison during this phase. Do not postpone all actual checker evidence until Phase 8. Use fixed reviewed inputs; do not ask Mo to repeat full paid questions to exercise this component.

### Deliverable

A narrow support-checking contract, a separate whole-answer contract and paired results measuring false approvals and unnecessary refusals independently.

### Exit gate

The recorded unsupported clauses are rejected or correctly sourced, while their faithful alternatives are accepted. Exercise English, Arabic and German and report the sample size, model profile, uncertainty, false approvals and unnecessary refusals. Require zero observed false approvals in the designated acceptance cases, with the faithful-answer results reported alongside them. Scripted tests establish implementation behaviour only: real-model verification stays pending while billing or review is blocked. Test-set success is not a promise of 100% reliability or independent scholarly acceptance.

## Phase 3 — Stop building repetitive evidence packages

### Work

1. Replace “cover the question, then fill spare places” with selection based on necessary coverage and distinct contributions.
2. First select evidence that answers every necessary concern. Then add sources only for useful corroboration, explanation, conditions, exceptions or relevant differences.
3. Apply the distinct-contribution requirement to direct evidence as well as background and limited examples.
4. Keep direct support, supporting explanation and limited examples distinguishable. A narrowly scoped example cannot establish a general conclusion.
5. Preserve complete named passages and qualifications. Do not drop a necessary condition to create a smaller package.
6. Allow several complementary sources to support one connected explanation. Do not require separate paragraphs that merely restate the same principle.
7. Preserve attributed scholarly differences without selecting the strongest view by counting quotations.
8. Define completeness by resolution of the reader’s requested concerns, not by balance of source counts. A verse or authentic hadith may establish explicit general teaching without a mandatory scholar filler. Named scholarly support remains necessary when the answer depends on interpretation, disputed conclusions or personal application, including general questions that require such reasoning.
9. Work with Phase 4 on discovery gaps in parallel. Use frozen candidate sets to isolate package selection; use separate retrieval cases to establish whether missing evidence was ever found. Do not try to compensate for a missing necessary source by stacking repetitive excerpts.

### Deliverable

A smaller, purposeful evidence package with recorded contributions and a claim-to-source map. Source limits remain ceilings, not quotas.

### Exit gate

Repeated sources no longer force repeated explanations. Complementary evidence, complete named passages and important qualifications survive. Cases with identical direct sources marked as non-distinct must not recreate the current filler behaviour. Selection can pass its isolated tests while discovery remains pending, but end-to-end completeness cannot be accepted until the necessary evidence is actually retrievable.

## Phase 4 — Improve discovery before changing ranking

### Work

1. Repair the active hadith path’s dependence on title matches. Broaden eligible candidate discovery using source-appropriate query variants and an index of original passages.
2. Search each actual concern separately, preserving candidate space across concerns and applicable source groups before final limits.
3. Preserve authenticity, collection boundaries, source permissions, original text and context checks before evidence is used.
4. Trigger bounded recovery for a missing answer component, not merely because a source group is empty.
5. Compare meaning ranking enabled versus disabled on matched, reviewed questions while preserving equivalent candidate access. Keep it only where measured retrieval/selection benefit justifies its latency and cost.
6. Build a multilingual semantic-search pilot before deploying embeddings or persistent vector storage. Validate the real configuration, eligible corpus, indexing/AI-processing permissions, original correspondence and held-out retrieval results.
7. Measure discovery misses separately from ranking, selection and writing losses. Do not attribute every missing source to the same stage.
8. Begin independent discovery investigation alongside Phase 3 where possible. Preserve a recorded ranking-on baseline and conduct isolated ranking-off comparisons without changing candidate access. Decide the default from measured quality, latency and cost; do not assume an immediate ranking shutdown improves accuracy or offline execution by a fixed percentage.

### Deliverable

A reviewed retrieval comparison across English, Arabic and German, including unfamiliar wording and cases without reference hints. Clearly label lexical, semantic and hybrid modes.

### Exit gate

Useful eligible evidence survives discovery, ranking and selection on varied and held-out questions. No automatic corpus-wide ingestion or deployment follows merely from a working pilot. Do not promise fixed query latency or claim that embeddings guarantee accurate answers.

## Phase 5 — Simplify writing contracts and correction

### Work

1. Let code own presentation roles, source-group routing, section order and internal labels.
2. Investigate supported schema-enforced output for the actual configured provider/model routes. Keep strict validation even if enforcement is available.
3. Reject unreadable data without guessing missing religious wording or extracting valid-looking fragments from malformed envelopes. Keep safe handling of wrappers such as code fences separate from rewriting internal JSON.
4. Review wording-overlap and citation-density restrictions as editorial rules where appropriate. Do not assume a matching phrase proves an unsupported claim, and keep quotations clearly labelled and distinct from AI explanation.
5. Replace broad phrase whitelists and unnecessary formatting constraints with a smaller consistent contract. Preserve directly supported citations, attribution, conditions and meaning.
6. Give failed sections targeted correction within one explicit total call and spending budget. Allocate the budget across known failures so an early section does not silently starve later sections. Consider per-group bounded repairs within that shared limit, or batch compatible repairs; compare the results before choosing the policy. Do not automatically grant another paid call to every group or repeat uncertain paid calls.
7. Distinguish writer formatting failure, unsupported wording, malformed checker output and contradictory checker findings. A checker’s broken presentation label should not automatically cause religious wording to be rewritten.
8. Reassess completeness after removing content. Retain independently safe material, withhold unsupported conclusions and do not save incomplete work as a completed answer.
9. Explain internal processing failures honestly without implying that religious evidence does not exist. Keep source failures, empty searches and failed explanations distinguishable.
10. Reuse Phase 1’s tested presentation normalisation rather than adding competing cleanup rules here. Citation ceilings and wording-overlap rules remain explicit review decisions; neither blanket phrase whitelists nor arbitrary cap increases are prerequisites for baseline/checker work.

### Deliverable

A simplified writing/validation contract, bounded correction policy and specific privacy-safe diagnostic outcomes.

### Exit gate

Ordinary format mistakes are handled predictably, unsupported claims remain rejected, legitimate quotations retain accurate labels, and correction cannot loop, silently erase necessary conditions or repeat uncertain paid calls.

## Phase 6 — Repair translations and the reading experience

### Work

1. Use the existing preparation workflow to provide translations matched to source identity, exact original excerpt and language.
2. Distinguish named translations, human-reviewed material and checked AI display translations. Translation text remains display-only and cannot establish evidence.
3. Do not publish old drafts automatically or introduce paid translation generation on every question.
4. Differentiate unavailable translations, failed lookups, rejected translations and unchecked candidates.
5. Display each full source card once. Keep meaningful previews and usable citations available when each section appears.
6. Write connected, ordinary explanations and a summary that resolves the visitor’s concern rather than recapping each source.
7. Make the next step relevant. Explain general teaching directly; recommend personal scholarly advice when individual circumstances, unresolved interpretations or missing facts require it.
8. Check Arabic direction, German text, phone layout and accessible progress announcements. Do not pressure visitors to disclose personal information.
9. A missing display translation alone must not invalidate an otherwise supported explanation checked against the original. Show the eligible Arabic excerpt, a clear unavailable-translation notice and the checked explanation in the reader’s language, keeping explanation distinct from a translation. If the explanation itself fails support or needed context is missing, withhold it independently.

### Deliverable

A translation-availability report, prepared exact-excerpt display translations where eligible, and a reviewed three-language reading experience.

### Exit gate

Available translations match their originals, unavailable/failed states are truthful, citations work immediately, and the explanation is naturally readable in all three languages. Native-language and scholarly acceptance remain separate from automated checks.

## Phase 7 — Connect the repaired pipeline to patient streaming

### Work

1. Finish storage, privacy, recovery and operational acceptance of the existing staged worker rather than rebuilding it.
2. Connect the repaired discovery, selection, writing and checking stages to its independent source-group progress.
3. Research applicable sources concurrently. Deliver independently checked sections in Quran, Sunnah and scholar order while later research continues.
4. Hold personal instructions and conclusions that depend on unfinished evidence. Clearly label source explanations as provisional until the whole-answer check passes.
5. Use immutable evidence and section revisions. Later evidence may visibly replace or withdraw an earlier explanation; never silently leave conflicting material presented as a finished answer.
6. Generate the final summary only after necessary coverage and consistency checks. An optional or genuinely irrelevant group must not cause an unnecessary pause.
7. Pause on necessary failures and offer Continue research on the same job. Revalidate retained evidence and retry only eligible unfinished work.
8. Preserve private encrypted checkpoints, owner isolation, cancellation, expiry/deletion and source-revocation behaviour. Verify worker restart and browser reconnection without duplicate paid calls.
9. Keep no overall elapsed answer deadline in patient execution. Leases and heartbeats protect ownership; they are not answer deadlines. Preserve spending, concurrency, request and retry limits.
10. Do not let unrelated translations or optional videos delay a checked source explanation. Save a completed conversation exchange only after its terminal result.

### Deliverable

A locally accepted patient flow with truthful progress, checked ordered sections, visible revisions, Stop and same-job Continue. Storage deployment and worker activation remain separately gated.

### Exit gate

Deliberately delayed services, failed sources, disconnects, restarts, continuation and uncertain billing preserve the same job without duplicate paid calls, premature completion or premature saving. Patient execution must not be presented as a repair for unfaithful checking.

## Phase 8 — Prove the result before release

### Work

1. After billing reconciliation, run the guarded six-question comparison, two questions per language, against a matched baseline. Follow it with separately budgeted reviewed batches and held-out questions.
2. Include answerable, ambiguous, disputed and insufficient-evidence cases. Correctly withholding an unsupported answer is a successful safety outcome, not a completion defect.
3. Measure supported/completed answers, unsupported claims, lost qualifications, repetition, unnecessary referrals, first checked section, total time and cost separately.
4. Retain the target that the first checked section arrives at least 30% earlier than completion on matched cases. Report measurements; do not introduce an arbitrary 30-second answer deadline.
5. Verify prepared-answer approval boundaries, legacy JSON clients, saved conversation hydration, working citations and all three languages.
6. Record source-faithfulness review, native-language review and Mo’s acceptance independently of technical tests.
7. Release retrieval, richness and patient execution behind separate switches with documented rollback and privacy-safe monitoring.

### Deliverable

A matched evaluation report, reviewed answer samples, remaining limitations and a concrete controlled-release proposal.

### Exit gate

Technical, source-faithfulness, language and owner acceptance are recorded separately. No production release follows automatically from passing tests, an automatic complete status or a successful deployment command.

## Recommended implementation order

Start with **phases 1–3**: capture the unchanged baseline, apply only narrowly defined presentation cleanup, test the actual checker and eliminate redundant evidence packages. Begin independent discovery work from Phase 4 alongside Phase 3, keeping retrieval and selection measurements separate. Prepare other later phases only where the work does not depend on unproven decisions.

Phase 2 includes a small guarded real-model checker comparison after billing reconciliation; Phase 8 remains the broader end-to-end release evaluation. If that comparison is blocked, continue useful offline work but leave Phase 2’s live-verification and acceptance statuses pending. Do not substitute test counts or an expected scripted verdict for measured checker accuracy.

Do not ask Mo to repeatedly pay to reproduce deterministic failures. Resume owner testing only after the relevant offline regressions pass and a guarded, reviewed comparison is ready.

## Progress record

For each phase, record its code revision, implemented changes, verification evidence, remaining gaps and acceptance status. Existing prototypes and prior tests may be reused, but no phase is marked accepted solely because that earlier work exists.

| Phase | Implemented | Offline verified | Live verified | Accepted |
|---|---|---|---|---|
| 1. Baseline | Six-trace private replay snapshot; known revelation-position metadata normalised | Envelope replay and known/unknown source regressions passed; full reviewed baseline still needed | Recorded owner failures are baseline only | Pending |
| 2. Checking | Focused support/quality preview; actual rich request builder shared with comparison tool | Scripted support/quality boundaries passed; 96 component inputs prepared without calls | Comparison still blocked by reconciliation and reviewed labels | Pending |
| 3. Evidence packages | Explicit necessary/distinct contribution preview replaces quota filling | Complementary sources, necessary qualifications, source caps and legacy compatibility checked | Semantic usefulness and selection reliability not yet established | Pending |
| 4. Discovery and ranking | Original-passage backend connected behind gates; fair pools and full concern meanings; equal-pool/equal-cap ranking comparison and shared request builder | Scripted routing, source boundaries, candidate preservation and comparison invariants; six multilingual/context request variants prepared without calls | Backend off; real multilingual model/index and reviewed ranking/discovery benefit still unproven | Pending |
| 5. Writing and correction | Patient schema aligned; optional strict OpenRouter contract/local validation; failed sections share one targeted correction and preserve checked siblings | Scripted real-builder/transport and partial-summary regressions passed; editorial review remains open | Strict mode off; real-route compatibility and end-to-end reliability unproven | Pending |
| 6. Translations and reading | Exact-batch checks; identity/provenance guards; read-only availability audit and bounded existing-draft review preparer | Scripted match, negative boundaries, preparation binding and literal review rendering passed | Actual read-only lookup and first six-source/twelve-draft preparation verified; no translation accepted/published | Pending |
| 7. Patient execution | Gated worker/checkpoints/Continue; preserved eligible evidence, explicit validated missing-concern maps and scoped continuation; technical failures separated from research gaps | Failed/empty/changed recovery, targeted multi-concern retries, revocation, uncertain billing and no-repeat-source checks; prior local storage/browser checks | Full novel-candidate/query checkpoint history and remote operational acceptance remain open | Pending |
| 8. Evaluation and release | Existing guarded tools require alignment with repaired path | No release inferred from test totals | Paid comparison blocked by reconciliation | Pending |
