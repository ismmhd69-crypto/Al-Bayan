# Arabic parents verification, 24 October 2026

The current repairs produced two source-supported Quran explanations, but Ask then removed them and finished without an answer. This attempt is a **technical failure**, not a useful complete answer or evidence of general accuracy. No production answer-system changes were made during this evaluation.

## Scope and authorization

Mo explicitly approved up to another $0.25 for **one full Arabic parents retest, then stop and report**. The question was the unchanged bank case R03: “كيف يعامل المسلم والديه غير المسلمين؟ وهل البر بهما يعني طاعتهما في كل ما يطلبان؟” No source hints were added.

The test used the same website rich-answer pipeline, live research, no prepared reuse and no artificial total cutoff. The writer/checker/backups, source boundaries and ZDR/data-collection-denied settings stayed unchanged. Experimental worker, focused-check and distinct-selection paths stayed off. This was a pipeline test, not browser, saved-history or production-deployment acceptance.

## Result and independent source review

| Measure | Observed |
|---|---:|
| Questions attempted / independently reviewed | 1 / 1 |
| Useful complete answers | 0 / 1 |
| Temporarily displayed Quran explanations reviewed / supported | 2 / 2 |
| First checked section | 60.093 seconds |
| Total time | 81.052 seconds |
| Settled model calls | 16 |
| Input / completion tokens | 142,192 / 16,624 |
| Cost | $0.05819919375 |
| Truncated primary outputs / configured backup calls | 1 / 1 |
| Writer corrections | 1, unchanged scholar prose |
| Final summary | Never reached |
| Final result | Incomplete; earlier section withdrawn |

The first Quran explanation described kindness and good companionship with parents. Its own Arabic passages include the explicit companionship instruction in 31:15 and kindness instruction in 46:15. The second restricted refusal of obedience to pressure toward associating partners with God, exactly the exception in 31:15 and 29:8. The previous extra phrase broadening those Quran passages to general disobedience was absent. Both displayed explanations are supported by their cited originals; this is source-based review, not scholarly certification.

All three unshown scholar sentences named Ibn Baz, so generic unnamed attribution did not recur. Two have supported cores: the importance of dutifulness and limits on obedience. The third described an obligation of maintaining kind companionship and ties with deviant parents, while its own excerpt explicitly qualifies ties/assistance when the parents expel the child and refuse them. The sentence omitted that qualification and used obligation wording not explicit in that excerpt. It is **not accepted as fully source-faithful**, despite positive model checks, and was never displayed. No full-answer success is credited to these drafts.

Useful Quran and scholar sources were retrieved. Quran research reported a partial timeout and some hadith searches failed. Only HE3358 reached selection and was assessed unrelated. This does not establish absence of relevant Sunnah evidence. An omitted source group alone is not incompleteness.

## Demonstrated technical cause

The combined source checks A11 and A14 received claims C1–C5, including earlier Quran claims C1–C2. Both responses returned attribution entries only for C3–C5. They nevertheless approved all five claim meanings and marked the earlier section safe.

The active code requires an attribution entry for every claim. Missing entries make `attributionOk` false in `lib/ask/rich-engine.ts`, produce `source_attribution` feedback and exclude C1–C2 from the safe-claim list. Ask spent its one correction on the writer, which returned identical scholar prose. After the second checker omission, the branch that protects against leaving unsafe earlier claims visible withdrew the Quran group before synthesis.

The response format was incomplete; it contained no negative meaning verdict against those two Quran explanations. Their withdrawal is not evidence that their religious content was disproved. Conversely, missing entries must never be treated as implicit approvals of new text.

This exact trace and current code establish the mechanism for this attempt. They do not prove the same cause for every historic incomplete answer. The unshown scholar qualification problem remains a separate semantic issue.

## Spending and safeguards

- Previous cap: $2.3824438125; authorized increase: $0.25; current cap: **$2.6324438125**.
- Exposure before this attempt: $2.2803763725, including all older spending and the original unresolved $0.113472 reservation.
- New actual cost: **$0.05819919375**; combined exposure: **$2.33857556625**.
- Remaining authorized allowance: **$0.29386824625**. It is not authorization for automatic additional attempts after this one-test stop.
- All 16 calls have settled receipts; no new uncertain charge or active evaluation lock remains. No old unresolved request was retried.
- Every call used the existing pessimistic reservation, concurrency accounting and provider price ceilings. Live endpoint prices were checked before paid dispatch. One truncated ranking response used the configured backup; it was not partially salvaged.

The new authorization helper passed 25 focused authorization/guard/storage checks with the existing guard tests; TypeScript passed before dispatch. These tests validate spending mechanics, not religious accuracy. The saved production suite of 1,715 tests is earlier offline evidence, not proof that this live attempt succeeds.

The first section appeared 15.29% earlier than the previous parents run (70.943 seconds). The two runs have different retrieval and model outputs, so no repair-specific speed claim is established. The original 30% first-section target remains unproved; a different-question baseline must not be presented as a controlled comparison.

## Highest-value next repair, proposed only

1. Require complete attribution findings for every exact claim identity in the checker response contract.
2. Treat missing, duplicate or unknown findings as a checker-format failure. Do not send that failure to the religious writer as a prose correction.
3. Preserve independently checked earlier explanations on checker-format failure; withhold unverified siblings and the final summary. Retain withdrawal for actual later evidence against an earlier claim.
4. Verify missing-row, genuinely negative, semantic-condition and late-withdrawal cases offline before considering another paid test.

The condition omitted from the unshown scholar draft still needs a general source-faithfulness solution. Changing the output contract alone would not make that draft acceptable.

No answer-system fix, model switch, privacy relaxation, additional paid repeat, deployment or storage activation was performed after the test. The goal is not complete; current full-answer reliability and Mo's acceptance remain unestablished.

## Reproduction and private evidence

- Run script: `scripts/retest-ask-parents-verification.ts`, with a one-shot authorization flag and unique journal/report. Completed attempts cannot be rerun by that script.
- Review script: `scripts/review-ask-parents-verification.ts`, exact request/wording/response guards, no network calls.
- Public spending journal: `docs/ask-repair-runs/arabic-quality-20261024-parents-verification-spend.json`.
- Private request: `92d7c319-26ac-4676-a183-f8116b0ddd8e`; report `work/private-ask-evaluation/parents-verification-full-retest-20261024.json`; trace under `work/local-ask-traces/`. Private payloads and credentials remain excluded from Git.
