# Keep checked progress when checker attribution entries are missing

## Result

The active rich-answer path now treats incomplete checker attribution findings as a **checker response failure**, rather than a religious failure or a request to rewrite the answer. Previously checked sections stay visible; unverified siblings and the final conclusion remain withheld. A complete later negative or uncertain assessment can still withdraw an earlier explanation.

The exact saved parents exchange has been replayed offline through the repaired engine. Before the repair, the live attempt removed its two supported Quran explanations. With the same recorded claims, originals, context and checker responses, the repaired engine retains those two exact explanations, promotes no scholar draft, makes no writer correction and still finishes incomplete. This demonstrates failure isolation, **not a new complete answer or improved religious accuracy**.

## General repair

- `lib/ask/rich-review-request.ts` requests attribution findings as fixed fields keyed by every exact claim ID, including earlier Quran/hadith explanations. Each row's claim ID is bound to its own key; all keys are required by the structured-output schema. Existing structured transport, output budgets and configured fallback limits remain unchanged.
- `lib/ask/attribution-review.ts` validates the complete identity set and yes/no/unsure decisions. It rejects missing, duplicate, unknown, mismatched or malformed rows. Complete legacy arrays remain readable for saved reviews and scripted fixtures; new provider requests require keyed rows. Missing findings never become inferred approvals.
- `lib/ask/rich-engine.ts` returns `checker_failed` / `attribution_response_invalid` before accepting other fields from a malformed attribution response. It approves no new claims or translations from that response, does not spend the writer correction on it and uses the existing retain-progress failure path. Complete semantic, attribution, condition, citation and late-withdrawal checks still run on valid responses.

This applies to all questions and all three answer languages. There is no parents-question or source-ID exception in production code. The unfinished worker and focused-check features remain gated.

## Verification

**Offline verified:** 1,744 tests in 164 files, zero failures/skips, and TypeScript passed. New cases cover exact keyed and legacy identities, missing/duplicate/unknown/malformed entries, all-language request schemas, preservation of the first checked section, withholding the final conclusion after contract failure, and withdrawal for a complete later lost-condition finding. A complete valid response still permits completion. Test source wording and verdicts are scripted, not religious evidence.

The first focused run caught a test callback attached in the wrong position; it was corrected to use `deps.rich`, and the actual withdrawal callback then passed. The wider run found four stale fixtures comparing the old schema or emitting old array-shaped provider output. Provider fixtures now follow the new request. Historical comparisons accept only the explicit array-to-keyed attribution upgrade; every other schema field and all original/claim/context comparisons remain exact. They report this upgrade rather than claiming an unchanged archived output contract.

**Recorded-exchange replay:** `scripts/replay-ask-attribution-contract.ts` reconstructs the seven saved originals and context, verifies equality with the sealed package, and compares every actual checker prompt with its recorded counterpart. It uses only saved responses A7–A11, blocks network access and verifies that the original report, trace and spending journal remain byte-identical. Reconstructed unshown scholar display URL/reference fields are explicitly not evidence. Two exact Quran claims survive; no scholar section or summary is emitted. This is mechanical replay, not renewed approval of the unshown scholar wording.

Private evidence: `work/private-ask-evaluation/attribution-contract-replay-20261024.json` and `work/attribution-contract-repair-final-tests.json`. They remain excluded from Git.

**Live verified:** pending for this repair. The last live attempt remains a failed attempt; it is not relabelled as a success. No new model/source calls were made during implementation or replay, and the replay creates no charge or reservation. Current remaining allowance stays $0.29386824625, with all earlier spending and the original unresolved reservation retained.

**Accepted:** the specific checker-contract failure boundary is offline verified. Full-answer/source-faithfulness review and Mo's acceptance are not established. The unshown scholar draft's omitted condition remains unresolved. The original first-section timing target is not proved. No model/privacy/source boundary changes, deployment, durable storage activation or claim of goal completion.

## Next decision

The latest paid authorization covered one test followed by a report. That attempt is finished. A further full Arabic parents retest needs a separate scope decision to use the existing remaining allowance; no extra money is added or automatic paid repeat started by this repair. The retest must review every displayed claim against its own Arabic sources and must not count retaining a partial answer as complete-answer success.
