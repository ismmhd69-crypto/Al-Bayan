# Final offline audit and fixed semantic regression checks

## Finding

The last displayed Quran scope error is a model-judgment failure, not a hidden parser or citation-identity error. The writer introduces the changed disjunction in its initial draft. Four primary reviews and four narrow meaning reviews approve that exact sentence, with complete valid outputs. Every one of those calls uses the same current Gemini checker and finishes normally.

These are **eight repeated judgments of one defective sentence**, not eight independent cases. The active pipeline deliberately uses the same verifier for the primary and narrow tasks. Different instructions and fresh contexts do not provide a second model's independent opinion. The writer and verifier remain distinct models, as required.

The exact source and references reach the checker. Genuine source excerpts and complete metadata therefore do not establish that the paraphrase preserves the original grammatical relationship. Earlier source-first, condition-extraction and higher-reasoning experiments also failed controls. Another reminder prompt is not a demonstrated repair.

## Prepared work

`scripts/prepare-ask-semantic-regressions.ts` prepares a fixed owner-only set of twelve Arabic component statements:

- Eight previously source-reviewed controls on gratitude, worship, reward recipients, non-association, commands, causes and invented outcomes.
- The exact latest disjunctive scope error and a faithful source-bound counterpart.
- The exact latest omitted ties/assistance qualification and a faithful counterpart retaining both the parents-commanding-disobedience case and the qualification.

There are six supported and six defective expected labels. Each prepared request uses the current narrow-check builder with **one claim**, only its own originals and restrictive context. Expected labels and review reasons stay local. New preparations are explicitly marked **not tested**, even when a similar statement appeared in an older differently scoped request. These are selected regression checks, not held-out evidence or a general religious-accuracy benchmark.

The final-summary statement about non-Muslim parents remains separate and unscored. Whether it is a valid narrower application of the general source instruction needs qualified source-context review. Neither model verdict is used as the gold label for that disputed point.

The first unrun draft is preserved. Before any paid comparison, the faithful scholar control was narrowed to retain the original case as well as the qualification. Version 2 records the earlier draft's hash and reason for refinement; neither version has paid results. The private final bank hash is `d995d59b334ae89da6699b43ec0cf9e3afdfc9496a22281a1be49143d6d6ea12`.

## Verification and status

**Implemented:** offline preparation and exact saved-response provenance audit only. No production writer/checker change, new model, source-boundary change or benchmark runner is activated.

**Offline verified:** 21 focused tests in three files and TypeScript passed. Exact saved claim identity, actual model, normal finish and four primary/four narrow approvals are checked. The twelve requests compile under strict output contracts and contain no expected labels or unrelated claims. Network access is blocked during preparation, and original reports/traces/spending bytes are checked unchanged. An initial invocation lacked the server-only runtime condition and failed during imports before preparation; rerunning with `--conditions=react-server` succeeded without any dispatch.

**Live verified:** no new test. The last full answer remains the failed result documented in `ask-parents-attribution-retest-2026-10-24.md`. No semantic repair or complete-answer success is claimed from preparing a bank.

**Spending:** zero new model/source calls and zero cost. Existing cap, all earlier charges and the original unresolved reservation remain unchanged; $0.22528029625 remains authorized but is not automatically spent.

**Accepted:** a reproducible regression set and evidence that repeating the current meaning judgment is insufficient. Overall source-faithfulness, complete-answer reliability, the original timing target, qualified review and Mo acceptance remain open. No deployment or durable storage activation.

Mo requested this be the final work item, followed by commit/push and local launch. No further paid comparison, repair or test is queued. Any later comparison must receive a separate scope decision and demonstrate both error detection and acceptance of faithful controls before considering an active-system change.

Private evidence stays under `work/private-ask-evaluation/semantic-failure-regression-bank-v2-20261024.json`, with no credential or private trace payload committed.
