# Worship retest: reservation contention and a full-pool discovery defect

## Verdict

The fresh Arabic worship attempt did **not** produce a checked answer. It cannot establish an answer-quality improvement or a semantic-checker failure: the spending guard stopped before the first checker request was dispatched.

The attempt exposed two concrete defects. Both have been reproduced offline and repaired: premature stopping when maximum reservations temporarily overlap, and a neighbouring-verse discovery order that exhausted the full pool on preceding verses. Neither repaired revision has another online acceptance result yet.

This goal continuation is progress, not completion. The reliability objective remains active and unfinished. The preceding checker experiments remain rejected and outside the active system.

## Actual attempt

- Same fixed Arabic R01 question; current website rich pipeline with live sources, same models/privacy, no prepared-answer reuse.
- Total time **195.105 seconds**; no first checked section and no published claims.
- Six paid dispatches: framing, two meaning rankings, evidence selection and two drafts. All receipts settled.
- Cost **$0.02947980**. The private result is classified as `technical_failure_budget_reservation_contention`, not an unsupported checked answer.
- The source pool grew from 31 to 47 candidates and was ranked down to 30. The sealed package contained Q35:15, Q41:46, Q45:15, HE65007 and one Ibn Baz original. Discovery did not automatically approve or select an adjacent source.

My intermediate diagnosis that the attempt demonstrated a selection/writer failure was premature. The complete ledger/trace showed a funding-admission stop. Later `rich_checker_failed` and `rich_writer_failed` diagnostics reflected that persistent stop; they were not semantic decisions or independent provider failures. The private review now records the corrected diagnosis. Draft copying failures did occur before admission of a correction, but that correction was never sent.

## Repair 1: queue temporary reservation contention

The initial source checker overlaps the later writer by design. At that moment the later writer held a **$0.08477676** maximum reservation; the first checker needed about **$0.05307120**. The combined maximum exceeded the approximately **$0.12813615** then available, so the guard permanently stopped the campaign. The writer subsequently settled at **$0.00341690**, leaving enough capacity for that checker reservation.

The evaluation guard now waits for pending calls to settle before declaring this temporary overlap unaffordable. It creates the next paid-call reservation only when capacity actually fits. The two-times headroom, byte-based input bound, full output allowance, price ceilings, inherited exposure and overall cap are unchanged.

It still stops if settled charges leave insufficient capacity, or if a pending charge becomes uncertain. Waiting requests honor cancellation, recheck immutable-ledger evidence before dispatch, and cannot continue after a storage or uncertainty failure. There is no retry of an uncertain paid request and no new total-answer timer. This repair affects the evaluation spending guard; it is not an explanation for all previously reported website failures.

The overlapping-call regression first failed with an immediate budget stop and now passes. Additional tests cover actual insufficient funds after settlement, uncertain transport, cancellation and a changed immutable ledger. Simultaneous maximum exposure remains bounded by the same ceiling. No paid request has been made under the repaired guard yet.

## Repair 2: following verses were starved at the real pool size

The earlier two-seed replay passed but missed a full-pool defect. With sixteen Quran seeds, discovery considered every preceding verse before any following verse. Its sixteen-item cap was therefore exhausted on preceding verses. In this live trace Q51:55 was offered, while Q51:57 was never offered as an independent candidate.

Discovery now considers both immediate directions together for each seed within the same limits. It does not increase the sixteen-extra/120-total caps, recursively expand, bypass fresh original identity checks or approve support. Once the cap is reached, later seeds retain their initial candidate status but may have no additional neighbours explored. This bounded exploration is not a guarantee of exhaustive recall.

A new sixteen-seed regression failed before this ordering repair and now passes. A zero-cost replay of the **actual sixteen-seed live pool** now independently exposes Q51:57 and other following verses. That replay proves the discovery opportunity; it does not prove relevance ranking, final selection, source faithfulness or current remote availability. The smaller earlier replay remains recorded separately.

## Verification and spending

- Final full suite: **1,480 tests in 132 files passed**.
- TypeScript and whitespace checks passed.
- Private live report: `work/private-ask-evaluation/arabic-quality-20261022-coordination-2/report.json`.
- Private full-pool replay: `work/private-ask-evaluation/arabic-quality-20261023-adjacent-full-pool-replay.json`.
- Latest additional $0.25 allowance: **$0.12528075 used**, **$0.12471925 unspent**.
- Combined inherited actual/reserved exposure: **$1.8487404125**, including the unchanged original $0.113472 unresolved reservation. All 34 campaign dispatches settled; four predecessor snapshots and the original ledger retain their pinned hashes.
- No cap reset, new allowance, lowered reservation, model/privacy change, deployment, database write or commit. Paid work remains stopped pending reviewed continuation. No completed or uncertain model call was automatically repeated.

## Remaining work

The retest does not establish new religious accuracy. Lost-condition detection remains unresolved. The later summary is still drafted alongside provisional source text. The added discovery also has a live cost/input-size effect that this blocked attempt cannot cleanly compare against the older run; its 195-second total is not a latency improvement.

The next continuation should preserve settled outputs and resume eligible unfinished checking rather than spend again on the same research/drafts. The current local evaluation traces contain normalized model outputs and settled receipts, but are not a production durable-job acceptance proof. Any reuse must bind the exact request, source revision, schema and model configuration, revalidate source eligibility, and refuse uncertain charges. A passing guard test alone does not complete that continuation or establish a useful faithful answer.
