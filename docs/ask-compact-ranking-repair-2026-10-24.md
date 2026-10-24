# Compact ranking repair and Arabic retest

## Implemented

Ranking now returns one numeric score per supplied passage in its original order. Code maps each position to the original source identity and rejects missing, extra, malformed or out-of-range scores. Source text, context, meaning instructions, models, output allowances, reasoning settings and later safety checks are retained. Input changes during a request and late aborted results are rejected.

The spending continuation preserves the previous journal bytes/hash and total exposure, with the same $2.3824438125 ceiling. It adds no allowance and requires completed independent review before continuation.

## Offline verified

The full suite passed 1,637 tests in 155 files, zero skipped, before the continuation helper was added. After that addition, 47 focused tests in four files and TypeScript passed. These are separate verification runs, not a new full-suite total.

Three valid recorded score sets preserve exactly the same source scores while reducing visible response bytes by about 90%. The malformed old score set is rejected, not reconstructed. Explicit indices slightly increase input size. Smaller JSON alone proves neither semantic accuracy nor spending savings.

## Live verified

One fresh repeated Arabic worship question used the active rich-answer pipeline, live retrieval, current models/privacy and no prepared answer. The runner supplied the parent signal used by the website's source-query branch. No browser, HTTP streaming or history persistence test was performed.

| Measure | Previous attempt | Current attempt |
|---|---:|---:|
| First checked section | 105.228 s | 63.509 s |
| Total time | 112.687 s | 88.246 s |
| Ranking elapsed time | 45.728 s | 13.110 s |
| Physical model calls | 21 | 19 |
| Ranking truncated responses | 2 | 0 |
| Backup calls | 2 | 0 |
| Actual cost | $0.0676074625 | $0.0674257 |

First checked text was 39.65% earlier than the immediately previous attempt. It remains 5.59% slower than the original 60.145-second baseline, so the original 30% target is still missed. Different retrieval/model outputs and a corrected runner limit causal attribution. Cost barely changed; substantial savings are not demonstrated.

All four score arrays had the exact required length and retained supplied passage order. This proves transport/identity validity, not semantic relevance. Current tokens: 147,087 input and 18,179 completion, 165,266 total.

## Independent answer review

Classification: **containing an unsupported claim**. All six displayed claim occurrences and the learning suggestion were reviewed against the saved Arabic originals. Technical completion is 1/1; independently accepted useful complete answers are 0/1. This is one repeated question, not a fresh 50-question accuracy estimate.

- Creation for worship and no requested provision are supported cores. Added exclusivity wording remains ambiguous; do not count that entire sentence as fully established.
- The gratitude verse, 31:12, was broadened to worship generally and given a causal connection that its own citation does not establish.
- The reward description from 30:45 omitted belief from the explicit combination of belief and good deeds. Both source explanation and summary also added specific dwellings/stations beyond their exact cited originals.
- The checker approved these defects. Its approval and a complete response status are not independent proof of accuracy.
- The hadith draft triggered the copying check. Its one correction altered a divine promise into protection through wisdom and pardon. A secondary check rejected that alteration and the group stayed withheld. This was not a lack of relevant hadith.
- No scholar contribution was written despite a source being available. Missing a group alone does not establish an incomplete answer or provider failure.
- The optional study suggestion was appropriate. Summary repetition inherited the source defects.

No serious unsupported practical religious instruction was identified. The scope/qualification failures still require repair before broader testing. No automatic paid repeat is queued.

## Spending and acceptance

All 19 new calls settled. Cost $0.0674257; combined exposure $2.2068656725; remaining $0.17557814. The original unresolved reservation remains counted. No new money, models, privacy changes, deployment or durable-storage activation.

**Accepted:** mechanical ranking validation and measured speed improvement in this run only. No general religious-accuracy, release, Mo acceptance or goal-completion claim. The next repair must address source scope and beneficiary conditions without question-specific answers or relaxed checks.

Private exact attempt: `d9e9b89d-1e12-44d2-bb08-2749ea930946`. Independent review is saved separately from model verdicts. Earlier completed attempts are not rerun automatically.
