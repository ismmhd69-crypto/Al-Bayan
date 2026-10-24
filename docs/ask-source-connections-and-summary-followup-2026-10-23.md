# Source connections and summary follow-up - 23 October 2026

## Scope and owner authorization

**Later update:** Mo approved the additional allowance. The single logical Arabic worship retest has now finished, with no usable checked answer and $0.03887975 spent. Its interrupted evaluator was continued from two exact settled planning responses without paying for them twice. See [the actual result, source review and next repair priorities](ask-source-request-online-retest-2026-10-23.md). The earlier pending/no-new-spend statements below describe the pre-test checkpoint.

Mo explicitly asked to continue the goal after the manual-testing pause. This work retains current models, privacy, evidence boundaries and spending protection. No new paid model call or cap increase was made. A separate request for up to $0.25 for one full Arabic worship retest is pending, because the automated campaign has $0.09101585 remaining and a comparable earlier full checker reservation was $0.098711101 by itself. Per-call maxima/reservations were not lowered to fit the remainder.

## 1. Patient research versus individual source connections

**Observed:** the cancelled last automatic retest spent 441,861 ms in retrieval without a checked section. Its trace proves a pending hadith search, not which underlying HTTP request was waiting. Code inspection found that local unhurried mode and an infinite worker runtime bypassed the same timeout helper used for source HTTP calls. Thus individual source connections could be unbounded. This is a demonstrated policy defect; the trace does not establish an exact stalled endpoint or every cause of the long search.

**Implemented:** a separate source-request timeout preserves each source reader's existing connection duration, including unhurried local and unlimited worker contexts. Quran, HadeethEnc, Sunnah and live-scholar readers use it. The overall local/worker answer can still take as long as needed; no total-answer deadline, unlimited retry or new model fallback is added. Parent cancellation is retained where the caller supplies its signal. Existing callers without an owner signal still have their request bound. Source-reader exception/partial-result handling remains unchanged, so a timed-out request cannot establish absence of evidence.

**Offline verified:** the actual HadeethEnc search reader is exercised with a stalled Arabic detail response. With the legacy helper it remains pending beyond the normal request duration; with the repaired helper it rejects as TimeoutError and reports source failure rather than returning an empty successful search. Other controls retain owner cancellation, finite worker remainder and an unlimited overall research duration. The older scholar test now checks cancellation before its restored connection limit instead of expecting every network call to remain unlimited.

**Live verified, no AI cost:** the actual HadeethEnc reader returned eligible originals HE65007 and HE65936 in 730 ms and 237 ms. This establishes current healthy reader connectivity only, not a full-search latency improvement or an answer-quality result. The recorded probe stores metadata/lengths, not newly retained hadith text. See private `work/private-ask-evaluation/source-requests-20261023.json`.

## 2. Wholesale source-to-summary replay

**Observed:** the saved completed anger answer shown by Mo repeats all four source explanations exactly in its summary. The displayed screenshot comparison is confirmed by the terminal answer in local trace 18ecf88c-6477-482d-ac5b-688fbc5c449b. This is an editorial failure despite a complete status.

**Implemented:** three or more final sentences that all reproduce earlier source explanations trigger the existing bounded summary correction. A one- or two-sentence direct recap remains eligible, as does genuinely different multi-point synthesis. The check does not judge religious truth, rewrite wording, require new religious facts, change citations, increase retries or bypass independent support/coverage checks.

**Offline verified:** a complete source-section replay triggers exactly one summary-only correction and the corrected synthesis still passes the real full checking path. Short direct recaps and distinct multi-point synthesis remain allowed. Repetition introduced after the correction is not silently accepted.

**Live verified:** no new live model test of this revision yet. The current final summary can still be repetitive in ways other than wholesale copying; the semantic checker remains necessary and imperfect.

## 3. Review of the manually shown examples

The parents terminal record contains nine main explanation/summary claims. Its cited originals directly support the central distinction between kindness and obedience limits, including the explicit scholar explanation in fatwa 991. This is stronger evidence than merely observing a completed UI. The summary opens indirectly and repeats material; the next step is study guidance labelled as a sourced religious instruction. That contract/classification problem remains open. This is not certification of religious accuracy or of the system across questions.

The anger answer selects topically useful Quran and authentic-hadith originals and finishes. Its four-sentence summary is an exact replay. The added causal explanation that patience is a means of steadfastness is not explicit in its attached Q8:46 excerpt; it should be narrowed or independently established rather than treated as verified solely because the checker approved it. This is a claim-to-excerpt concern, not a claim that the religious teaching is false.

The recent local records also include two incomplete anger attempts and one same-question attempt without a recorded terminal event. One incomplete attempt includes conversation history, so these are not a controlled matched batch. An absent terminal record is not proof that its process is still running or that a specific source failed. These selected screenshots cannot establish consistency, an overall accuracy percentage or improvement rates. No manual website charges were added to or represented as part of the automated campaign ledger.

## Validation, cost and release boundary

- Final full suite: **1,510 tests in 135 files passed** with two workers; TypeScript and whitespace passed.
- An earlier full run exceeded two unrelated five-second test-import limits under parallel load; both passed a focused rerun without changing their timeout limits. The source-wait test's former expectation was deliberately updated to the repaired request/answer distinction.
- Automated ledger unchanged: **43 settled calls**, **$0.09101585 remaining**. No new model spending. The two source-only live reads do not exercise an AI model.
- No deployment, database mutation, source approval/rights change, model/privacy change, commit or push.
- Not accepted for release and goal not achieved. Remaining work includes independently staged research, missing-condition checking, optional guidance and a guarded full Arabic retest after sufficient spending authorization.
