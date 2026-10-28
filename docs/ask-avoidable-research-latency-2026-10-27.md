# Removing avoidable Ask research work

## Evidence

Request `33f1a320-86c9-42dc-999b-27aa7b07670e` had 26 model calls by the first final review: one frame, ten ranking, eight selection, five recovery-planning and one summary-writing call, followed by screening. Source groups became ready at 51.3 seconds (hadith), 71.8 seconds (scholar) and 88.8 seconds (Quran); summary writing ended at 99.4 seconds. Research runs in parallel, so per-call durations must not be added to estimate wall time. The full recorded attempt later ended incomplete at 166.176 seconds after meaning rejection and its bounded correction. This was not a research deadline.

All five recovery rounds were automatically triggered by useful packages lacking a direct-contribution planning label. The old stable code also gave each of the three groups two rounds, permitting six per answer rather than the approved answer-wide allowance of two.

The completed trace is frozen privately under `work/private-ask-evaluation/reliability-20261026/frozen-failures/33f1a320-86c9-42dc-999b-27aa7b07670e.jsonl`, SHA-256 `2e34709cee215c5a973772e85f823d79f4dd0b6f08d3ccbd94e1b0639c14d8b3`.

## Changes

- A useful, safely selected source package now proceeds to publication and the final summary, without searching again merely to obtain a direct planning label. Final summary support, conditions and full coverage still require approval. A real empty/evidence-gap selection may still recover within its allowance.
- Recovery counts are shared across all parallel stable lanes and persisted through Continue. A round is reserved synchronously before awaiting the planner, preventing concurrent lanes from each claiming the same allowance. Existing per-group checkpoint counters are summed; Continue does not reset them.
- Recovery returning an unchanged complete candidate snapshot does not dispatch the same selection again. Changed originals, context, routing or candidate order require fresh processing.
- Exact duplicate ranking work within one request shares a promise/result. The key includes the complete question frame and candidate snapshots. Results are cloned, failures are evicted and changed source/context inputs are not reused. This is not a cross-visitor cache or a substitute for evidence checking.

No time cutoff, model switch, additional retries, source exemption, background activation, deployment or database change was introduced. Overall calls, tokens and spending protections remain.

## Verification

96 focused tests across ten files, TypeScript and the production build passed. New controls cover shared parallel recovery, allowance persistence through Continue, stopping background-only recovery, unchanged candidate lists, exact ranking reuse, and fresh ranking after context changes. Existing summary rejection, source scope, conditions, publication and reader tests remain passing. Existing build warnings about metadataBase and broad private-index tracing remain.

No paid live question was submitted. The new policy removes the recorded automatic background-recovery trigger, but the old run is not a live timing benchmark for the changed pipeline. New response time, costs, answer coverage and general live reliability remain unmeasured.
