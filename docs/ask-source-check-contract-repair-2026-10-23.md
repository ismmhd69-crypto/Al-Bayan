# Source-check contract repair and Arabic retest

## Owner-facing verdict

The same Arabic worship question now reaches a completed answer instead of failing on the source-check response format. That is a demonstrated flow improvement. **It is not an accurate-answer success:** independent comparison with its cited Arabic originals found unsupported additions in the displayed explanations and summary.

The next bottleneck is semantic support checking, especially uncited context and inferred outcomes. Further full-question tests are stopped for review. A small isolated-original experiment caught the missing-citation error but still accepted an inferred-outcome claim, so it was not activated.

## Authorization and unchanged boundaries

Mo explicitly said “continue the goal” after receiving the prior failed-attempt review. One new same-question attempt and a fixed, bounded checker experiment used the **unspent existing allowance**, with no cap increase. All predecessor spending and the old unresolved reservation remain counted. Current writer/checker/backups, provider privacy, source boundaries and request reservation/output maxima remain unchanged. No deployment, database write, source approval, commit or push.

## Implemented in the active rich-answer path

1. **Stage-specific checking:** source-only requests omit final coverage, final checklist, final-summary and guidance verdict fields. They retain exact citation proof, claim meaning, conditions, consequence, attribution, contribution, consistency, personal-case and earlier-section safety checks. The final full-answer request still requires every final judgment. This modifies the request before dispatch; it never strips fields or salvages a received malformed response.
2. **Correction context:** a text-only replacement task now states the exact assigned concern and supplies that sentence's own cited originals, with explicit instructions to preserve its distinct supported contribution. Citation fields and untouched sentences remain sealed. Corrected wording still needs independent checking. This prompt repair is not itself a semantic proof.
3. **Source-group scope:** each writer receives the concerns for which its selected sources have direct evidence, with an explicit rule that a group need not answer every concern. The combined final answer still must. This addresses the observed refusal of a useful hadith contribution merely because it did not answer another concern.

## Local evaluator storage interruption and recovery

The new attempt first stopped at 34 ms when Windows rejected atomic replacement of the spending ledger (`EPERM`). The exact stack shows `reserve -> persistCampaign -> rename` before the guarded network call could be reached. There was no provider response or usage. The failed temporary reservation matched the report's fingerprint. It was recorded as **confirmed not dispatched, cost $0**, rather than an uncertain provider charge. The failed replacement artifact and error execution record were preserved.

The owner-only journal now uses unique exclusive temporary files, fsync, and atomic rename. Only transient `EPERM`, `EACCES` and `EBUSY` replacements retry, at most six attempts with 300 ms total waiting. It never deletes the original ledger, sends before durable reservation, or retries a provider request. Permanent reservation-storage failure stops dispatch and marks the unreachable request as locally not dispatched. Explicit recovery requires the reviewed zero-dispatch record and refuses a second automatic continuation.

The resumed execution completed. Local non-dispatch ID: `288f6a23-d2f7-48fc-98e7-a5f6cf23081b`. Completed execution: `3e8ee2a8-832c-49a2-9672-ad51972a3f45`.

## Actual full-question result

| Measure | Result |
|---|---:|
| Logical fresh questions tested in this revision | 1, R01 |
| Terminal status | rich_answer, complete=true |
| First automatically checked section | 60,145 ms |
| Total completed execution | 80,416 ms |
| Displayed claims reviewed | 6: four source explanations and two summary claims |
| Fully established by their own cited originals | 1/6 |
| Complete answers passing independent source review | 0/1 |
| Paid model calls | 15 |
| Prompt tokens | 106,082 |
| Completion tokens, including billed reasoning where reported | 13,560 |
| Fresh attempt cost | $0.05311940 |

Quran and hadith sections appeared; no scholar explanation was selected. Source search also recorded timeout/failure outcomes, so available evidence must not be mistaken for proof that research was exhaustive. The evaluated path retained source-family failure metadata. Empty-group rendering was not newly browser-accepted by this CLI test.

All source-only checker responses matched the reduced stage contract. The separate final checker still ran. One initial summary response was rejected in full because its guidance carried four references against a three-reference contract; the already configured writer backup supplied the one bounded correction. Final guidance had kind `learning` and empty references. Final summary had two sentences rather than a literal source-by-source replay. The specific wholesale replay detector was not shown to trigger in this run.

This was a fresh execution, unlike the previous planning-cache continuation. They are not a controlled matched timing pair. **No 30% earlier-section achievement is claimed.** The answer still waited for research/selection before first writing.

## Independent claim review

Review used exact original Arabic passages from the recorded requests, rather than the model's positive verdicts. These findings concern whether the displayed citations establish the claim, not whether a familiar religious proposition is true elsewhere.

- **Quran C1:** Q51:56 establishes creation of jinn and humans for worship. The sentence's added denial of needing provision/food is not in that cited verse. Q51:57 appears as uncited neighbouring context. Both primary and narrow checkers approved the compound assertion using Q51:56 alone. This is a demonstrated citation-support error.
- **Quran C2:** Q29:17 commands seeking provision from Allah, worship and thanks, and states return to Him. It does not explicitly establish the generated causal phrasing that worship/thanks causes seeking provision and return. The relationship needs narrowing to what the passage says.
- **Hadith C3:** HE65936 describes a particular elderly man's walking vow and the instruction to ride. The generated phrase extends the explanation to imposing unbearable worship more generally. That added scope is not established by the attached original alone.
- **Hadith C4:** HE10404 establishes the prepared reward for righteous servants beyond what has been seen, heard or imagined. Its displayed reward paraphrase is supported.
- **Summary S1:** retains the provision/food assertion without citing Q51:57 and broadens the self-hardship narration into general non-benefit from human actions. The attached Q51:56/HE65936 do not establish the whole sentence.
- **Summary S2:** describes gaining worldly provision as a result of worship/thanks. Q29:17's command to seek provision is not an explicit promise of that outcome. The cited reward hadith establishes the reward component, not the entire compound statement.

The final study suggestion also carries explanatory religious wording. A learning label and empty references do not independently establish those assertions. Optional guidance remains an open quality/safety issue.

Classification: **completed answer containing unsupported claims**, not “supported and complete.” Across the two logical R01 attempts under this latest allowance, one ended incomplete and one completed but failed source review. Neither is a successful source-faithful complete answer. The rest of the 50-question bank was not tested here. No overall accuracy score is inferred.

## Fixed isolated-original checker experiment

Hypothesis: neighbouring passages and other claims can contaminate a claim's positive support decision. An experimental builder supplies one claim, only its cited original Arabic passages, and no neighbouring context. Existing contextual checking would remain necessary for restrictions. It uses the current checker, unchanged privacy and the ordinary 2,100-token allowance for a single narrow claim. It is **not wired into the active answer path**.

Five cases were fixed before spending, including two positive controls. Calls ran sequentially with the existing journal and reservation guard, stopping at the first failed control:

| Fixed control | Expected | Actual |
|---|---|---|
| Actual compound C1 citing only Q51:56 | Reject missing provision/food assertion | Rejected |
| Identical C1 explicitly citing Q51:56 and Q51:57 | Support | Supported |
| Narrow creation-for-worship statement citing Q51:56 | Support | Supported |
| Actual summary outcome claim citing Q29:17/HE10404 | Reject inferred provision outcome | Incorrectly supported |
| Previous wrong-citation correction, Q31:12/Q41:46 | Reject | **Not tested**, stopped at prior failure |

Cost: **$0.00177850**, four settled calls. The missing-citation pair improved under isolation, while the causal/outcome weakness persisted. Changing more wording after seeing this failure would require a new reviewed experiment, not a silent rerun or a claim that all controls passed. Report status: `control_failure_do_not_activate`.

## Verification and spending

- Full active-repair/storage suite: **1,536 tests in 139 files passed**. The subsequently added isolated-builder controls and related meaning tests passed, followed by 16 focused checks and TypeScript/whitespace validation. No larger full-suite count is claimed for the later experimental helper.
- Tests cover stage-specific strict transport, invalid-response rejection, retained final coverage, source-group assignment, correction context, independent rejection after overconfident primary approval, atomic-write retry bounds and zero network dispatch on storage failure. Scripted verdicts verify behavior, not actual religious entailment.
- Latest allowance spent **$0.09377765** including the earlier failed answer, this fresh attempt and component controls; **$0.15622235 remains**. Combined recorded exposure **$1.9762214625**, including the inherited unresolved reservation.
- Journal: **28 settled provider calls and one confirmed local non-dispatch**, no new uncertain charge. No evaluator/control process or active spending lock remains. Historical journals are preserved.
- Current stop: `isolated_controls_finished_review_required`. No automatic further full-question test, experimental activation or model switch.

## Next decision and readiness

The source-only contract repair is live-verified for one same-question attempt. Meaning preservation by the correction repair was not exercised by a successful source correction in that attempt, so it remains offline-verified rather than a demonstrated live cure.

The strongest next work is a held-out support/causation/condition control set and an evidence-backed decision about checker design or model comparison. Isolation alone failed its fixed acceptance gate and stays experimental. Continuing to count completed answers as accurate would hide the present weakness. **Release and goal completion remain unproven.**
