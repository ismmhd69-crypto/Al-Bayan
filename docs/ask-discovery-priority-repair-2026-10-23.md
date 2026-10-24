# Relevance before bounded neighbour discovery

Status: source-discovery repair verified; full answer remains incomplete and source-review failed. Current models and privacy unchanged. No release or Mo acceptance.

## Demonstrated defect and change

The saved R01 trace `3e8ee2a8-832c-49a2-9672-ad51972a3f45` contains 24 original seeds. Quran 51:56 was fifteenth among the Quran seeds. Its later semantic score was 100, but neighbour discovery had already consumed all sixteen slots on earlier raw search hits. Quran 51:57 never reached the selectable candidate pool. This is distinct from a selected source being omitted by the writer.

`lib/ask/core.ts` now ranks the existing context-checked seeds before allocating neighbour reads, then ranks the expanded pool before independent selection. `adjacent-quran-discovery.ts` accepts only priorities belonging to those authoritative seeds. It still fetches each proposed original independently and rejects changed text, identity or URL. The sixteen-new-source and 120-total bounds use the complete original pool, even when only a ranked subset supplies priorities. Discovery does not grant coverage or source approval. With no additions, the identical ranking is reused.

This can add one ranking round, at most four concern requests, when new originals are discovered. In the fresh two-concern attempt, the additional initial ranking used two calls costing $0.007013. This is a cost/latency tradeoff, not a free or inherently faster repair.

## Verification

- Actual pipeline controls exercise late-seed priority, independent original/context reads, expanded-pool selection, cancellation, identity checks, capacity bounds and no-addition ranking reuse.
- Full suite: **1,564 tests in 144 files passed**. TypeScript and whitespace checks passed. Test output is saved privately in `discovery-priority-tests-20261023.json`.
- Recorded-case replay: old ordering misses 51:57; relevance priority includes it, with sixteen discoveries in both cases. Frozen saved ranking order is a counterfactual control, not a new model decision on a changed input.
- Fresh source-reader replay: sixteen source reads; the required original passed identity/text checks. Zero model calls and model cost. This does not establish independent selection or answer accuracy.

Private evidence: `work/private-ask-evaluation/adjacent-priority-offline-20261023.json` and `adjacent-priority-live-20261023.json`.

## Fresh full Arabic attempt

Request `2c2b118f-d7be-459d-83ae-95a6adad2f98`, same R01 question, active website rich pipeline, live research, prepared reuse skipped, current models/settings, no artificial total cutoff. No experimental checking change was enabled.

| Measure | Observed |
|---|---:|
| New full questions attempted | 1 |
| Completed full answers | 0 |
| Displayed source claims independently reviewed | 4 |
| Fully supported displayed source claims | 2 |
| Unshown summary claims reviewed | 3 |
| Fully established unshown summary claims | 0 |
| First checked section | 51,373 ms |
| Prior first checked section | 60,145 ms |
| Earlier first section, descriptive only | 14.58% |
| Total time to incomplete terminal | 60,158 ms |
| Settled provider generations | 14 |
| Actual cost | $0.05102730 |
| Remaining allowance | $0.0921004525 |

The 30% first-section target is not met. Comparing an incomplete terminal with the previous completed attempt does not establish faster completion. Search/planning results differed: in this fresh run 51:56 was already the first raw Quran seed. Therefore its improved citation set cannot be attributed exclusively to the changed discovery order. The matched recorded replay isolates the actual priority defect.

The spending guard refused the final checking request before dispatch because its complete reservation could not fit. No final checker response or final conclusion exists. All fourteen preceding generations settled; there is no new uncertain charge. The test will not repeat automatically.

Independent Arabic review, including explanations shown before that stop:

- The creation/provision explanation now cites both 51:56 and 51:57. Its added absolute self-sufficiency rationale still goes beyond those exact excerpts. The whole sentence is not counted as fully established.
- The benefit/harm explanation citing 41:46 and 45:15 preserves the original subject and meaning.
- The rights/worship/non-association narration HE65007 is faithfully described. Its closing warning against reliance is present in the source card but not explained; do not interpret the answer as permission to abandon duties.
- The HE65936 explanation still widens a particular elderly man's walking vow into self-imposed hardship in worship generally. The case boundary is missing.
- All three unshown summary claims contain added scope or meaning: broad independence/benefactor assertions, the widened walking-vow example, or explicit worldly-and-hereafter outcomes. The draft guidance also mislabels a study suggestion and contains an Arabic typo. None was displayed or finally checked.

These are small repeated-question findings, not a general accuracy percentage or scholarly certification. Exact claim findings and originals are saved in `work/private-ask-evaluation/discovery-priority-full-retest-20261023.json`.

## Checker experiments that did not improve the system

All remain inactive. The temporary temperature change was reverted. No new model was tried.

| Control | Supported accepted | Unsupported rejected | Cost |
|---|---:|---:|---:|
| Mistral plus deterministic Arabic reading aid | 2/6 | 4/4 | $0.000748045 |
| Mistral, temperature zero only | 3/6 | 4/4 | $0.000600175 |
| Gemini, Arabic analysis-before-verdict | Not established; first response invalid | Not established | $0.00109225 |
| Mistral, same analysis-before-verdict task | 4/6 | 4/4 | $0.00107659 |
| Gemini, medium reasoning only | Not tested | 0/1 | $0.00028450 |

The initial analysis-first prototype also had a local schema declaration error: it was rejected before dispatch at $0, preserved, and repaired before the single Gemini call. That call still failed the complete local output contract. No malformed output was edited or partially accepted. The temperature-only and reasoning-only comparisons checked complete baseline request fingerprints after removing their one changed setting. The reading aid and Arabic analysis task did not solve the backup's false refusals; increased reasoning still accepted the known unsupported conclusion. Repeating these experiments is not the next repair.

## Spending and remaining work

Latest allowance used: **$0.1578995475**, remaining **$0.0921004525**. Combined recorded exposure: **$2.04034336**, including the original unresolved reservation. Journal: 100 settled generations, ten explicit zero-cost route rejections, one confirmed local non-dispatch, zero new uncertain charges. All five immutable campaign ancestors and the original journal remain unchanged. No active test handle or lock remains.

Next work must address writing/case-boundary preservation and the overly large final review request without weakening source, meaning, coverage or reservation checks. Saved request A15 was never dispatched; its size can be studied offline before considering any separately recorded continuation. Do not spend the remainder on a whole-question repeat that cannot safely finish, or treat more withholding as better answer quality. No database/source approvals, durable-worker activation, deployment, commit or push occurred.
