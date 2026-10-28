# Meaning-check source anchors

## Observed failure

The anger answer in request `07036d70-117a-4d82-97c1-efb37804348c` reached the final conclusion audit. A21 approved the source/summary claims; A22 returned positive meaning decisions but retyped part of Quran 3:134 using ordinary Arabic spelling. Its excerpt included a written alef where the supplied Uthmani original represented it differently. The strict excerpt validator rejected the response. Continue reached the same invalid-review outcome.

This was an identity/format failure, not a timed-out request or a negative model meaning verdict. The saved positive decisions do not establish independent theological correctness.

## Repair

- The active strict condition review uses `condition_anchors_v3`. Code supplies exact, bounded excerpt choices; the model returns their IDs instead of Arabic source quotations.
- Every condition row must bind to that claim's cited original. Unknown IDs, mismatched sources, duplicates, missing rows and context-only positive support are rejected.
- Negative findings can select exact original or restrictive-context anchors. They retain their category, affected claim quote and source identity. Code resolves the source text and runs the existing grounded-finding checks.
- Condition/conjunction comparisons, whole-claim meaning, scope, qualification, attribution, citation and final coverage checks are unchanged. Anchor identity does not confer semantic approval.
- Historical v2 response parsing remains available explicitly for saved-response review. The active anchored path refuses v2 responses instead of silently downgrading.
- Approval fingerprints and continuation/worker contract identities change with the new request. Old research is incompatible with the new checking contract; use a fresh chat to test it.
- No model, source integration, cost ceiling, research deadline, database or deployment changed.

## Verification

- The exact saved A22 failure is frozen privately and replayed by `scripts/replay-ask-anger-anchors.ts`. The old response fails the original identity check. Mapping its unchanged positive decisions to code-owned IDs passes the new contract and existing validators, with original source text unchanged. Zero model or source calls are made by this replay.
- Controls cover unknown/wrong/context-only anchors, typed Arabic mixed into an anchored response, altered conjunction logic despite a positive vote, and exact grounding of negative context findings.
- 105 focused tests across 13 files and TypeScript passed. Test sets include stable/progressive source retention, meaning review, source boundaries, condition guards, correction allowances, continuation accounting and worker behaviour.
- Live regenerated-answer acceptance remains with Mo, who chose manual testing. No paid generation was sent for this repair.
