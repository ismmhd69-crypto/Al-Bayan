# Adjacent evidence discovery and component-based recovery

## Result and limits

Follow-up: a live full-sized pool exposed direction starvation missed by the small replay. The later repair and blocked retest are recorded in [the follow-up report](ask-retest-reservation-and-discovery-followup-2026-10-23.md). Its verification and spending figures supersede this report's earlier snapshot.

Two shared retrieval/control-flow defects are repaired. The regressions failed before the code changes and pass afterwards. A zero-cost replay of the recorded worship attempt now exposes independently identifiable originals that were previously available only as context. **No new online answer or general accuracy improvement is established by this work.** The source-condition checking failure recorded in the preceding report remains unresolved.

This goal turn is progress: it changes the active local rich retrieval path and removes a reproduced unnecessary recovery/search/selection cycle. The overall goal is still active and unfinished.

## 1. A useful neighbour could never become its own candidate

The recorded worship package selected Q31:11 and Q51:56. Their context contained Q31:12 and Q51:57. Context intentionally has no selectable citation identity: that prevents assigning a neighbour's meaning to the original candidate. However, the pipeline never fetched those neighbours as separate candidates, leaving useful material stranded while the writer tried to attach unsupported meaning to Q31:11.

The active rich path with meaning ranking now performs one bounded discovery pass:

1. Start from retrieved Quran candidates with successfully loaded context.
2. Consider immediate same-surah neighbours only, at most sixteen new identities and never a combined pool above 120.
3. Fetch each new identity through the normal Quran source reader. Require the requested key, canonical source URL and unchanged original Arabic. Reject failed, mismatched or changed reads; propagate cancellation.
4. Keep search-concern provenance as discovery metadata, never evidence coverage.
5. Load each new candidate's own context through the existing context gate, then run normal ranking, independent selection, package sealing and answer checks.

The pass does not recursively expand new candidates or search quotations inside hadith/fatwa text. Existing candidates keep their identity; duplicate provenance is merged. Conflicting originals are not silently concealed. Context-only material remains uncitable. The ranking request now explicitly distinguishes a candidate's own contribution from teachings appearing only in neighbouring context.

The feature uses the existing meaning-ranking switch. The legacy non-rich/lexical paths, source permissions, authenticity rules, corpus/embedding gates, paid-call guards and models stay unchanged.

### Evidence

- The new integration regression failed because Q2:184 was absent from ranking when found only as Q2:183's neighbour. It now reaches the selector and sealed answer under its own identity and original; its independent source/context reads are asserted. This fixture uses invented wording and scripted audits, not religious proof.
- The actual recorded worship-source replay changes its two-seed discovery pool from `[Q31:11, Q51:56]` to include Q31:10, Q51:55, Q31:12 and Q51:57 as separately fetched snapshot identities. It makes zero model calls and zero network requests.
- That replay uses saved provider snapshots. It does not prove current remote availability, useful ranking, successful selection, a checked explanation or complete output. All those gates still apply in a real run.
- Negative tests cover changed originals, wrong identities/URLs, source failures, duplicate identities, bounds, nonadjacent references and cancellation.

## 2. Optional empty groups still triggered a fallback retry

The planner-enabled path already recovered missing requested components. The older fallback path still calculated `missingGroups` and launched another source search and selection when a valid sealed package covered the question but lacked a source family.

The reproduced empty-hadith case performed two source searches instead of one, even though Quran/scholar evidence already covered the requested concern. Recovery now depends on an invalid/incomplete package or missing direct support for a requested concern. An empty optional family does not trigger it.

The fallback still recovers uncovered components and reselects new evidence. Both `direct_requirement_coverage_missing` and `no_direct_evidence_with_requirements` enter its component recovery path. Genuine recovery source failures remain failures; they do not become claims that relevant evidence does not exist. Tests retain recovery where the missing hadith contribution is actually necessary and verify incomplete output with a truthful failed-search state when it cannot be recovered.

The old quota-specific tests were replaced with the approved component-based behaviour. The new regression first failed with two searches, then passed with one search and one selection. Removing this unnecessary path establishes a control-flow saving in that fixture, not a measured live cost or latency percentage.

## Verification and spending

- **1,474 tests in 132 files passed** in the final full run.
- TypeScript and whitespace checks passed.
- The replay report is private: `work/private-ask-evaluation/arabic-quality-20261023-adjacent-replay.json`. Its hashes bind the recorded source trace and discovery implementation; it stores no long source passages.
- No new paid calls, online full attempts, production deployment, database writes or commits.
- Latest additional $0.25 campaign remains at **$0.09580095 used**, **$0.15419905 unspent**, with all 28 calls settled. Combined inherited exposure remains **$1.8192606125**, including the unchanged old unresolved reservation.

## Remaining acceptance work

Candidate recall and optional-group recovery are better supported by code evidence now. Whole-answer reliability is not accepted: a model can still lose a source condition and have its statement approved, and summary drafting still begins alongside provisional later source drafts. The failed checker experiments remain outside the active path. More live comparisons must be tied to an affordable, reviewed hypothesis and must not turn failures or incomplete answers into claimed success.

The discovery pass can increase HTTP reads and ranking/selection input size, although it adds no model-call stage. Its total timing and cost effect needs live measurement. Meaningful staged research before all searches finish, durable recovery acceptance, languages beyond the current Arabic sample and scholarly/Mo acceptance remain open.
