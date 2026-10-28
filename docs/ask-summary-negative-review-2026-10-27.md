# Summary rejection blocked by a malformed source quotation

Request `e44b884e-93d7-41a9-b7e4-86e76ae299bd` used the new originals-first flow. Quran (4 sources), Sunnah (1) and scholars (3) committed successfully. The summary writer produced two sentences. Primary review rejected both, but normalization returned null and terminated the run with `checker_failure` at 151.171 seconds. No summary correction was attempted.

The first negative finding retyped Quran 4:148 without the word Allah after the opening verb. Its quotation was neither exact nor a permissible vocalization-only variation. The second finding was exactly bound to its scholar original. Rejecting the malformed quotation was correct; treating that unusable feedback as if ordinary correction could proceed would not be safe.

## Repair

The active originals-to-summary primary review now uses `field_verdicts_anchors_v3`. Its negative findings select code-owned excerpt IDs, as the narrow meaning review already does. Code resolves each selection to untouched text from that claim's cited originals or attached restrictive context, then applies the existing negative finding and semantic checks. Wrong claim/source bindings, invented anchors, altered claim quotations, mixed contracts and malformed approvals remain rejected. The active reader requires the new contract; legacy normalization remains available for historical responses.

No rejection is converted into approval. Correction allowances, spending limits, citation validation, source checks and the final coverage requirement remain. This changes an existing checker request without adding a checker or a retry.

## Offline evidence

`scripts/replay-summary-negative-anchors.ts` reproduces the recorded normalization failure, unambiguously maps the saved findings to existing original excerpts, and confirms both negative semantic decisions survive parsing. This identity mapping is an offline format replay, not a new model judgment. The trace is frozen privately under `work/private-ask-evaluation/reliability-20261026/frozen-failures/`, SHA-256 `d045c59f2e3cb7b6afa12add711c586343660fbc17fae426485a4f7505fc0737`.

A scripted pipeline regression verifies grounded negative feedback reaches the bounded summary correction and does not dispatch source-section writers or withdraw originals. Positive correction decisions in that test are scripted and do not establish religious correctness or live answer reliability. No paid requests were made for this repair.
