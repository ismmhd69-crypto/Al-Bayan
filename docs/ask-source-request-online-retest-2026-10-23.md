# Arabic worship retest: 23 October 2026

## Verdict

The authorized single worship attempt finished as **incomplete** and displayed no checked explanation. Source retrieval reached writing, but correction and checker-output problems prevented a usable answer. This is not a successful reliability or religious-accuracy result.

Mo authorized up to $0.25 more, retaining earlier spending, models, privacy, evidence boundaries and request maxima. No second question or automatic repeat was run. No deployment, database write, source approval change, commit or push.

## Execution and accounting

- One logical Arabic question, R01: why Allah commands worship despite being self-sufficient, and what benefit worship brings people.
- Initial execution `baf2b8b2-9250-417e-943f-28fb880ef785` exited without a terminal result after two settled planning calls. It must not be counted as an answer or semantic failure.
- Confirmed the evaluator process had exited and both receipts settled before releasing its empty stale lock. Original and predecessor ledgers remained unchanged.
- Continuation `6e80b9a7-d088-46fd-b068-f1f71fd8ef67` reused those two whole, schema-valid responses only after matching the exact complete transport-request fingerprints. No second payment for planning. The evaluation-only cache delivery is labelled separately and reports zero additional usage; original paid receipts remain authoritative.
- Nine paid calls in total: two original planning, two reranking, one selection, two initial source drafts, one shared correction, one source checker. No backup model was dispatched. The continuation made seven new paid calls.
- Total cost **$0.03887975**: original planning $0.00515470, continuation $0.03372505. All nine receipts settled; no new uncertain charge.
- Tokens: **70,739 prompt + 12,175 completion = 82,914** provider-reported tokens, including reasoning where included in completion usage. Reused planning delivery is not counted twice.
- New allowance remaining **$0.21112025**. Combined recorded exposure **$1.9213235625**, including inherited spending and the original unresolved reservation. Manual website spending is outside this automated ledger.
- Continuation duration **52,760 ms**. No first checked section. Original execution time and the offline interruption are separate; this is not a comparable fresh-request latency measurement or evidence of the 30% earlier-section target.
- One question attempted/reviewed, zero usable complete answers, zero shown explanations, zero final summaries. The other 49 bank questions were not tested in this campaign. One failure cannot establish an overall accuracy percentage.

## Observed findings

1. **Research reached writing.** Relevant Quran passages and hadith originals were available. Scholar selection produced no selected directly relevant scholar passage; this does not establish that none exists. Source requests returned timeout events where appropriate; the recorded run completed rather than hanging. A single continued execution does not establish general latency improvement.
2. **Writer declined a useful source group.** The first hadith draft cited missing evidence for R1 even though an eligible passage about reward could address R2. This suggests confusion between a source group's contribution and the whole answer's coverage; it is a plausible cause, not a proven general explanation.
3. **Copy controls spent the shared correction.** The Quran benefit sentence triggered copied-source detection. Its correction replaced that sentence with a restatement of creation for worship and God's independence while the server preserved Q31:12/Q41:46 and R2. Preserving citation identity alone did not preserve the sentence's meaning. The corrected hadith explanation also triggered copied-source rejection and never reached independent support approval.
4. **Checker returned an invalid complete response.** This source-only stage explicitly required `requirement_coverage: []`, but the checker returned `["R1","R2"]`. Offline replay of the exact whole response rejects it. A diagnostic clone with only that field emptied matches the declared shape, identifying the format violation; that clone was never accepted, displayed, or sent to a model. The actual response remains rejected in full, with no fragment extraction.
5. **Semantic checking also failed in the rejected response.** The checker marked corrected C2 supported by Q31:12/Q41:46, although its assertion about creation for worship and no need for food is not established by those cited originals. It also described C2's contribution as human benefit despite the actual corrected sentence repeating C1. These verdicts were inside a rejected response and were never an accepted safety approval, but they demonstrate a checker weakness worth retaining as a negative control.
6. **Final synthesis was not reached.** The new wholesale-summary replay control was therefore not exercised online. Full source-card display and the final UI messages were not browser-accepted in this command-line test.

## Independent source review

The review uses the exact original Arabic texts in the sealed, recorded request, rather than the system's checker verdicts. It does not certify the source providers or Islamic rulings generally.

- Initial Quran C1: Q51:56/57 directly establish creation for worship and no request for provision/food; the explanatory independence wording follows that contribution. This was only a draft, not displayed.
- Initial Quran C2: Q31:12/Q41:46 support benefit returning to the person. The added explicit division into worldly and afterlife benefit is not established by those attached excerpts alone and needs narrowing or separately established support.
- Corrected Quran C2: its retained Q31:12/Q41:46 do **not** establish the full replacement assertion about creation for worship and food. It also no longer answers the benefit concern. This is a citation-faithfulness and completeness failure in an unshown draft.
- Corrected hadith draft: HE10404 establishes the prepared reward for righteous servants. Its general reward description is relevant to benefit, but the draft failed copy controls and was not independently approved. Do not treat this as a usable checked answer.
- No source-group or summary explanation appeared before failure, so there is no early displayed material to count as supported.

Classification: **technical checking failure with independently identified unsupported draft wording and incomplete coverage**. Useful-complete outcome: **0/1** attempted answerable questions. Shown complete answers available for a supported-answer percentage: **0**, so that percentage is not applicable.

## Implemented safeguards and verification

- HadeethEnc's existing individual request duration now bounds headers and JSON body consumption even when a transport ignores cancellation. The whole research process has no added total deadline. Other source readers retain their separate request signals; this body-race wrapper was added specifically to HadeethEnc, not claimed for every reader.
- The standalone evaluator has a keepalive until its promise settles, preventing Node from exiting merely because pending timeout handles are unreferenced. It does not change website answers.
- Owner-only planning recovery refuses unsettled receipts, ambiguous/malformed responses, changed complete requests, wrong model identities, duplicate consumption and cancellation. It never approves religious content or bypasses subsequent checks.
- **1,523 tests in 136 files passed**, including 47 focused timing, campaign, replay and synthesis controls. TypeScript and whitespace checks passed. This verifies code behavior, not model accuracy.
- New ledger is stopped at `single_source_request_retest_finished_review_required`; no further dispatch is authorized by this evaluation entry point. Private report preserves both execution records and the settled call journal.

## Next repair priorities

1. Make source-only checker requests contain only applicable judgments, with a clear stage-specific contract. Retain strict whole-response rejection and full independent final coverage checks. Do not salvage this invalid response or label the faulty C2 supported merely to improve completion.
2. Retain the recorded C2 citation mismatch as an adversarial control for correction plus independent checking. A successful text patch must preserve meaning, necessary conditions and its assigned concern, not just old citation fields. Test source-faithful positive controls alongside this negative example.
3. Repair per-group contribution versus whole-answer coverage confusion, and assess legitimate short Arabic overlap using recorded positive/negative pairs. Do not solve copy failures by unconditionally weakening quotation controls.
4. Only after offline controls pass, review whether a separately scoped live retest is useful. No additional comparison or model change was made here.

**Accepted:** no release acceptance and no goal-completion claim. The app's stored goal still reads paused even though Mo authorized continued work in chat; the available goal-status tool cannot resume it. No false status or completion update was issued.
