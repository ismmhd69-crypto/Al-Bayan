# Selection, final-summary coverage and Continue repair

## Recorded failures

Initial request `c9b762e8-4651-45d5-adb0-88c86c41137a` stopped after 104.168 seconds. The scholar selection retyped one source ID incorrectly, so that assessment was rejected. A subsequent whole-answer selector blocked synthesis before any summary had been written. Its response labelled two Quran passages direct but still marked overall coverage insufficient.

Continue request `b7275d93-e7a5-415d-a247-c921785eb50a` retained the published originals and selected scholarly background, but another pre-writing whole-answer selection stopped it. Requests `68c3aa8a-6f08-4b5d-aebf-3c3def2a17df` and `13da27e4-0d49-48d9-a9ce-c74feedbe74d` ended almost immediately without new model calls. Their historical logs do not establish which revalidation branch blocked them. This repair does not retrospectively claim that missing evidence is known.

All four traces were frozen privately under `work/private-ask-evaluation/reliability-20261026/frozen-failures/`. The initial trace SHA-256 is `2d18fe6bad198648512f19ec3d7a7346ba8a907eb381fa5ff2309ba006d97ff6`.

## Implementation

1. Stable selection uses `candidate_refs_v1`. The model selects short pool-local references such as P1. Code maps them to unchanged source IDs. Unknown, duplicate, missing and mixed references refuse. Optional contribution plans use the same reference map. Production code never repairs identifiers with fuzzy matching, position guessing or spelling similarity.
2. Source selection assesses useful contributions separately from whole-question completeness. Context-safe, explicitly linked and distinct supporting passages may remain background without being promoted into direct support. Unrelated, mention-only and unsafe sources remain excluded. Existing recovery and spending bounds remain.
3. The stable flow no longer calls a second whole-answer selector to predict whether an unwritten answer can be complete. It freezes selected originals and attempts one summary. The actual summary must pass citation binding, explicit meaning, scope, conditions, attribution, consistency and complete-question coverage checks. The selector's planning role is neither proof nor a final veto. Original-mode coverage uses actual checked summary claims tied to displayed originals and their question links; legacy explanation-mode direct-role checks remain unchanged. Necessary contribution units and source-to-question routing remain enforced. Supported fragments cannot approve an incomplete or unsupported summary.
4. Invalid selection is reported as `selection_failure`, not disguised as an empty search. Continue reports `source_revalidation_unavailable` when a saved source or context cannot be rechecked. Fixed diagnostic codes identify the affected source, group and reason: source unavailable/changed, context unavailable/changed, scholar unconfirmed, or source request failure. These logs contain IDs and reason codes, never visitor questions or source prose. Grounded source changes still produce targeted integrity notices, without silently rewriting committed cards.

The stable patient adapter uses the same reference contract and final-summary boundary. Background activation is still gated. No deployment, database work, model switch, new library, unlimited retries or research deadline was introduced.

Continuation and worker identities were bumped because selection and reuse rules changed. Old incompatible checkpoints must refuse explicitly; start a new question for the new contract. Existing saved answers remain readable.

## Verification and limits

- `scripts/replay-selection-reference-failure.ts` reproduces the malformed recorded ID and demonstrates the fixed-reference mapping without changing recorded relevance or support decisions. Its explicitly labelled offline counterfactual identity mapping is not production salvage or an approval replay.
- `scripts/replay-summary-negative-anchors.ts` still reproduces and resolves the earlier negative-quotation format failure while preserving both negative verdicts.
- Focused tests cover incomplete complementary selections reaching the writer, final coverage rejection preserving originals, background labels not overriding actual supported/unsupported summary decisions, invalid references, unsafe/unrelated controls, translated sources, anchored negative findings, publication order, Continue, revalidation and privacy-safe diagnostic fields.
- 123 focused tests across 13 files, TypeScript and the production build passed. The existing metadataBase and broad private-index tracing warnings remain.

No paid live requests were made. Scripted approvals establish control flow, not religious correctness or general reliability. New live completion time, cost and useful answer quality remain unverified.
