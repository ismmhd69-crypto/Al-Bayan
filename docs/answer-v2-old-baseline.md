# AnswerV2 phase 1: OLD baseline (not a new run)

Status: recorded 2026-09-29 during design phase 1. **These are old results.** No paid evaluation was run for this step.

Source: `docs/eval-2026-09-29-baseline.txt` (90 questions, one run each, saved before any AnswerV2 work). Computed offline with:

```
npx tsx scripts/eval-saved-baseline.ts docs/eval-2026-09-29-baseline.txt
```

| Number (design section 9) | Old value | Note |
|---|---|---|
| useful explanation rate | 33/60 (55%) | among questions whose `expect` is `answer` |
| source-only rate | 10/60 (17%) | same denominator |
| no_summary rate | 0/60 | status did not exist then |
| correct refusal rate | 20/30 (67%) | `refuse` counts `no_source`/`no_summary`; `ask_scholar` and `out_of_scope` must match exactly |
| p50 / p90 seconds | 13 / 18 | whole seconds per question |
| structure_ok | not available | old log has no AnswerV2 |
| must-contain pass | not available | old log has no answer text |
| wrong-source count | not available | no reviewed acceptable sources yet; old log truncates ids |
| stable required points (3 runs) | not available | old log has one run |

The design's "about 16 points" figure used a different denominator (73 general questions, 12 source-only). The table above uses each question's `expect` field, so the two are not directly comparable. A locked live baseline with every number needs a paid run (`scripts/eval-ask.ts --file --runs=3`), which was not done in this step. Prepared answers could not load in live Ask at the time (known bug, design section 5 step 6), so every old row is a live-pipeline result.
