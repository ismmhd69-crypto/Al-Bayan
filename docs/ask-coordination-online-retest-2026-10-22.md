# Arabic coordination-repair retest, 22 October 2026

The latest repair does **not** yet establish reliable Ask answers. Two live Arabic attempts were independently reviewed against their cited original passages. Neither is accepted as a fully supported complete answer.

## Scope and spending

Mo explicitly approved up to another $0.25 for one worship and one parents retest. The separate campaign inherits $1.7234596625 actual/reserved exposure, including the unchanged original unresolved $0.113472 reservation. Its cumulative ceiling is $1.9734596625. The preceding campaign's unused allowance was not transferred or reset.

New charges: **$0.08796120**, leaving **$0.16203880** unspent from this approval. Combined exposure is **$1.8114208625**. All 23 dispatches settled; no new uncertain charge. Four predecessor ledger snapshots and the original reservation ledger retain their pinned hashes. No old request was retried. Further calls stopped after the parents qualification failure.

The live source retrieval and active rich-answer pipeline were used, with prepared-answer reuse skipped. Models, zero-retention privacy, request reservations, price ceilings and correction limits stayed unchanged. Patient-worker and other gated experimental features stayed disabled. No production deployment, database writes, source approval changes or commits.

## Actual results

| Same Arabic case | Outcome | Independent review | First checked section | Total | Model calls | Cost |
|---|---|---|---:|---:|---:|---:|
| R01: worship despite God's self-sufficiency, and its benefit | Incomplete | Two supported scholar claims, but repetitive and insufficient; Quran, hadith and summary withheld | 86.738 s | 86.746 s | 13 | $0.05216805 |
| R03: non-Muslim parents, kindness versus every request | Complete status | Missing qualification in a displayed scholar instruction; not accepted | 60.220 s | 67.716 s | 10 | $0.03579315 |

R01 used 105,491 prompt and 15,192 completion tokens. R03 used 78,901 prompt and 9,417 completion tokens, including provider-reported reasoning within completion usage. These are totals across all pipeline calls, not one writer request.

Two attempted and reviewed; one complete status; zero fully supported complete answers. This tiny repeated sample cannot establish a general accuracy percentage or a first-section improvement against the agreed target. The other 48 bank questions were not tested under this approval.

## What worked

- The worship checker rejected a claim attached to Q31:11 that borrowed self-sufficiency meaning from neighbouring context. It also rejected unsupported replacement wording and the final summary's unsupported causal connection.
- The pre-correction combined review ran before the single correction. The correction included Quran, hadith and their dependent summary. Independently supported scholar explanations survived the later failure.
- The parents Quran explanation preserved the distinction between kindness and refusing shirk in Q29:8 and Q31:15. It appeared about 7.5 seconds before completion.
- Parents completed without a Sunnah explanation. The internal empty group was not treated as a required prose quota. Existing renderer tests verify hiding empty groups; browser rendering was not exercised here.

## What failed

### Writing and correction

R01 initially cited Q31:11 for wording the original does not establish. The correction introduced new unsupported wording about creation and what lies beyond. Its repaired hadith sentence changed its requirement assignment outside the sealed source's allowed assignment, so the section failed validation. The one correction was exhausted. These are observed errors, not evidence that relevant religious sources do not exist.

The surviving Ibn Baz statements are supported by explicit general wording inside fatwas 15641 and 3787. They repeat the principle of divine wisdom and compliance rather than fully resolving both requested concerns. The first source was only available at the end, so this attempt did not demonstrate useful early streaming.

### Missed qualification despite two checking layers

R03's first scholar sentence described obedience as obligatory in non-sinful matters generally. Its cited fatwa 16911 refers to parental requests they need and which are not sinful. Omitting the need qualification broadens the instruction. Both checking layers approved it. Complete status therefore did not establish faithfulness.

Fatwa 1356 concerns voluntary fasting with parental need or concern and good intent. Its explanation retained need but lost much of the specific context. Fatwa 15946 supports the stated voluntary-prayer example, but that detail is peripheral to this question. Selection relevance and preservation of limited examples still need work. The summary's supported central answer does not repair an overbroad source paragraph elsewhere.

## Priorities supported by this run

1. Make qualification preservation an explicit comparison of each proposed instruction with the original's conditions. Existing yes/no audits missed a concrete condition. Reproduce this failure with a held-out equivalent and a correctly limited control before another paid full test.
2. Constrain correction identities by the permitted source-to-concern relationships, including sentence patches. This must prevent invalid combinations without relabelling unsupported meaning or silently changing religious wording.
3. Prepare the final synthesis from surviving checked explanations. The current joint drafting still permits causal claims whose citations do not establish them. This is a remaining architecture task, not implemented by this evaluation.
4. Improve source relevance and remove redundant background before writing, while keeping complementary evidence and necessary qualifications. Do not add more retries to mask these errors.

These are demonstrated priorities and proposed next repairs, not implemented fixes or proven cost savings. No additional paid calls are authorized by this report. The campaign is stopped with remaining money preserved.

## Evidence and acceptance

Private per-question report: `work/private-ask-evaluation/arabic-quality-20261022-coordination-1/report.json`. Receipts: `docs/ask-repair-runs/arabic-quality-20261022-coordination-spend.json`. Original text was inspected from the recorded request/source package; this permanent report avoids reproducing long source passages. Local traces retain the existing limited retention policy.

Campaign wiring, guard and focused repair checks: **22 tests passed**; TypeScript and whitespace checks passed before paid execution. No answer-system edits were made between the two attempts. Those checks are software evidence, not religious review. Browser layout, English/German, durable recovery and scholarly acceptance remain untested. The overall reliability goal remains unfinished.
