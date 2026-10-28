# Bayan Ask: latency and progressive streaming repair plan

Current implementation: [Stable evidence-first streaming and 26 October local activation](ask-stable-streaming-implementation-2026-10-25.md). Mo's later approved plan replaces preview/withdraw/rewrite delivery with immutable checked groups and removes application deadlines from stable research. Mo explicitly requested local activation on 26 October; English and Arabic now use v3 locally. Complete Arabic conclusion acceptance remains open, and the production/default template remains off. Historical timing targets and German checks below are not current launch requirements.

Date: 25 October 2026
Status: plan only; no implementation or live calls authorized by this document.

Execution note: Mo subsequently authorized implementation, review after each phase, and a small online test using his API. That separate instruction authorizes the current work; this document alone does not authorize future runs or deployment. Phases 1–6 are implemented locally and have focused offline review, as recorded in ask-system-repair-progress.md, entries 74–83. Phase 7 remains open: the historical English promises case completed across four runs, but Arabic completeness and timing targets have not passed, and actual browser display timing has not been measured. The last full suite before the latest checker/display/scheduling repairs passed 1,850 tests with eight skipped; subsequent focused checks and TypeScript pass. Do not present that historical full-suite result as a full retest of the latest changes or as religious-content acceptance.

Launch scope update, 25 October: Mo stopped German work until after launch. Current development and paid acceptance checks cover English and Arabic only. Preserve existing German implementation and historical results; German parity is not a launch gate. Continuations are explicit visitor actions, with at most three after the first run and unchanged cumulative spending/call/token limits. The small online sample retains its original shared $0.50 ceiling; no deployment is authorized.

**Later instruction from Mo, 25 October:** the answer flow must be allowed to finish rather than being cut off for a speed target. The local website now explicitly uses `ASK_LOCAL_UNHURRIED=true`, including the stream route and progressive lanes; the deployed-route age limit no longer truncates later local receipt collection. Timing targets below are observations to improve, not local kill switches. Source/individual connection and spending controls remain. The unfinished progressive browser flow is off by default behind `NEXT_PUBLIC_ASK_PROGRESSIVE_STREAMING`; the ordinary rich flow remains available. Hosted execution limits still need a verified continuation/worker solution; this local change does not remove platform limits or authorize deployment.

## Goal

Latest owner correction, 25 October: remove local application time cutoffs from source searches and bodies, model/receipt connections, context reads and the overall answer. An active session's cleanup timer must not expire its research. Recheck user cancellation end to end. Display Quran, Sunnah, scholars and the final conclusion in that order; do not show summary placeholders or terminal failure notices while working. Genuine failures belong below the surviving answer once work stops. One in-answer novel-query recovery round may address a first-pass evidence gap under unchanged cumulative spending/send/token ceilings. Allow one checked correction per affected group rather than letting a scholar correction consume another group's sole opportunity. In unhurried local mode the single answer may use the existing total 48-send/150,000-output-token allowance without forcing an intermediate 24-send/75,000-token pause. These later instructions supersede the local time/correction restrictions below; hosted platform acceptance remains separate.

Show useful, verified material as soon as it is ready, while the remaining research continues. A visitor should not wait for Sunnah or scholar work before reading a checked Quran explanation. Where safe, show verified source passages one at a time, then show their explanations only after the claim checks pass.

Keep the current model chains, approved source boundaries, privacy rules, and strict output checks. No source-specific answer hardcoding, relaxed evidence checks, unlimited retries, or production deployment.

## Baseline from the reviewed trace

Trace `5eaa088a-26cb-4530-b64d-141e3cd02681` took 174.7 seconds. The first checked Quran section was emitted at 121.2 seconds. Quran and Sunnah sections eventually passed; the scholar section failed its check; the final summary request ended with OpenRouter HTTP 400 in strict structured-output mode. The exact provider reason was not recorded.

The request retrieved most verse text by about 17 seconds. A verse detail lookup and a surrounding-context lookup each hit a 10-second timeout. Four ranking calls took about 32 seconds in total, shared evidence selection took about 34.9 seconds, and the remaining checks and corrections delayed later sections. This is one request, not a general performance estimate.

The trace also recorded 173 timeout events, but the timeout listener can fire after the work has already completed. Those events are not evidence of 173 failed calls. Local development was in unhurried mode, which disabled the overall deadline and several model/stage timeouts.

The trace contains 16 model calls: one question-framing call, four ranking calls across two candidate passes, one shared evidence-selection call, four writing attempts including scholar correction and the failed summary, and six checking calls. No provider retry or model fallback was observed. Successful-call usage reported approximately $0.0294, which is not a reconciled bill. Source connections are also constrained by a six-request Quran-content queue; record queue wait separately from connection time. These figures describe this request only.

Relevant code paths from the audit: [source and ranking flow](../lib/ask/core.ts), [section checking and correction](../lib/ask/rich-engine.ts), [SSE route](../app/api/ask/stream/route.ts), [timeout handling](../lib/ask/timing.ts), and [section display](../components/RichAnswerView.tsx).

## Phase 1 — Make failures and timings trustworthy

### Work

1. Keep the trace and source text private. For each stage, record request ID, start/end time, duration, outcome, source group, and safe provider status/category only. Never log the visitor question, prompts, model output, credentials, or raw provider error body.
2. Fix timeout bookkeeping so a timer is cleared when its operation finishes. Record a timeout only when it actually aborts unfinished work. Separately count source search, verse detail, context lookup, model request, evidence selection, checker, and final summary failures.
3. Distinguish `source_search_timeout`, `verse_lookup_timeout`, `context_lookup_timeout`, `checker_failure`, and `summary_provider_rejection` internally and in the visitor message. Do not call every source-level timeout a failed “search.”
4. Preserve the recorded HTTP 400 category, `provider_rejected`, and identify the failed phase as summary writing. Inspect the saved summary request contract offline for demonstrable defects, preserving strict structured output. The recorded category is not `parameter_or_schema_rejected`; offline inspection cannot recover an undocumented provider reason. Document any proven contract defect separately from the still-unknown rejection cause. Do not repeat a paid request just to inspect it. Correcting diagnostics alone does not resolve the rejection; any proposed contract repair needs its own offline validation and later authorized live acceptance.
5. Make user-facing local runs use a bounded deadline aligned with the deployed route. Keep any unhurried diagnostic mode as an explicit developer-only opt-in, never the default used for product acceptance.

### Exit gate

Offline checks prove successful operations do not later log timeout failures; each failure stage has a distinct status; malformed or rejected final output remains fail-closed; and the normal local request stops within its declared budget while preserving checked sections.

## Phase 2 — Release completed source groups independently

### Work

1. First add a versioned stream contract and client reader supporting source-group updates, per-group revisions, evidence snapshot identity, and targeted withdrawal. Both existing ordinary and patient readers enforce source order; the ordinary stream also assumes single-delivery sections and whole-answer withdrawal. Update server emission, client validation, rendering, and terminal-answer consistency together before allowing out-of-order delivery. Keep older whole-section clients on their existing contract; do not silently send them new event shapes. This prerequisite does not require enabling durable execution.
2. Stop holding a checked Sunnah section behind an unrelated scholar correction. Emit each whole section immediately after its own source and meaning checks pass. Keep later combined consistency and coverage checks; earlier display does not approve a final answer.
3. Keep the canonical order Quran → Sunnah → scholars when multiple groups are visible, but do not reserve blank placeholders. If Sunnah is ready while Quran is still running, show Sunnah immediately; insert Quran above it when Quran becomes ready.
4. Retain checked sections if a later group, correction, or summary fails, unless a later check invalidates them. Show which group paused and why. Hide truly empty groups, and do not label a checked partial answer as a complete final answer.
5. Keep a failed scholar section visible as “could not be checked” when the visitor needs to know research stopped; do not make it appear as an empty source result.

### Exit gate

With delayed mock sources, a ready Sunnah group is visible before a slow scholar correction finishes, including when Quran is still pending. Old clients retain their supported behavior. Duplicate or stale revisions cannot overwrite newer state. A later unrelated failure does not erase prior checked material; an invalidated section is withdrawn visibly. No partial result is marked complete.

## Phase 3 — Remove the all-sources barrier from Quran delivery

### Work

1. After Phase 2's stream prerequisite, keep one immutable question frame with shared requirement identities and qualifications, then run bounded Quran, Sunnah, and scholar retrieval lanes independently. Each lane fetches eligible evidence and required context, selects useful passages, writes its own explanation, and runs the same mandatory source-support and meaning checks. Use an explicit partial-contribution selection contract, as already distinguished in patient-models.ts; a lane need not answer the whole question, but must never claim complete coverage from related or background material.
2. Let the Quran lane proceed to drafting and checking as soon as its own evidence is ready, without waiting for unrelated scholar retrieval, scholar context, or cross-source ranking. A claim that requires scholarly interpretation or a qualification from another lane must wait for that required evidence and its checks; independence does not permit publishing an incomplete rule. Other independently supported Quran explanations may still proceed.
3. Stream a Quran explanation as soon as that explanation passes its checks. Continue Sunnah and scholar work in parallel. Every completed answer must still pass combined checks for all requested points, necessary qualifications, consistency, citation identities, and summary support, including single-source answers. Cross-source support and differences must be assessed on the combined evidence; partial lane checks cannot approve completion or settle a personal case.
4. Bind each check to an immutable snapshot of the question frame, exact claim wording, cited originals, required context, contribution roles, and conditions, plus the checking-rules version. Preserve these identities across lanes. If new evidence invalidates an already-emitted claim or section, withdraw it visibly and explain that its check changed. Invalidate any dependent summary. Reuse checks only when their full dependencies remain valid; a stable source ID alone is insufficient.
5. Preserve bounded source and model budgets per lane and for the whole request. Share concurrency, token, and spending limits across lanes; do not multiply the allowed correction or retry budget by the number of lanes. A slow or failed lane must not spawn unlimited retries or consume the remaining request budget indefinitely. Reserve explicit time for final synthesis and its mandatory checks. Cancellation, privacy/integrity failures, and uncertain billing may require stopping the whole request rather than only one lane.

### Exit gate

Delayed-service offline scenarios show that independently supported Quran explanations can finish and display while Sunnah or scholars are still pending; claims requiring missing cross-source qualifications remain withheld. No unchecked claim or unverified source text is shown as an explanation. A recoverable failure of one lane does not discard other valid checked output. Global cancellation, integrity failures, and uncertain billing still stop further work when required.

## Phase 4 — Stream verified verse cards incrementally

### Work

1. Extend Phase 2's versioned stream contract with events for a verified source card and its checked explanation. Include request ID, monotonically increasing sequence, source ID, group, stable card identity, revision, and evidence snapshot identity so the client can append or update without duplicates. A claim may depend on several cards; retain that dependency rather than forcing one claim per verse.
2. A fetched verse is not yet checked evidence for the question. Before displaying a selected source card, validate the approved source response, identity/reference, Arabic original, and permitted displayed translation, then complete independent relevance, surrounding-context safety, contribution-role, scope, and qualification checks under the lane's partial-evidence contract. Never expose raw retrieval candidates as selected evidence. Hold a card when required context is unavailable. Label approved partial material as source evidence, with its explanation pending; it is not a final answer.
3. Preserve complete named passages and all companion excerpts needed for a condition or meaning. The package contract already treats jointly necessary citations as atomic. Show that whole verified unit together; do not promise a separate card for every verse regardless of dependencies. Background and limited-example roles must remain explicit and cannot establish missing direct coverage. An excerpt may appear ahead of unrelated passages only when independently safe in its complete required context.
4. Append checked claims to the matching cards/section as soon as they pass. Support later correction or withdrawal of cards, dependent claims, and summaries with a clear UI update; do not silently leave superseded wording visible.
5. Keep older whole-section events readable during rollout. Test cancellation, reconnect, duplicate delivery, out-of-order groups, unavailable context, atomic multi-verse units, and answers with no eligible card.

### Exit gate

With deliberately staggered verse lookups, each independently safe, selected evidence unit can appear before unrelated later verses finish loading. A fetched but unassessed verse, missing-context excerpt, or incomplete atomic unit never appears as selected evidence. Each explanation appears only after its checks; the UI remains ordered, readable, and free of duplicate or stale cards.

## Phase 5 — Reduce work without reducing evidence checks

### Work

1. The current first ranking pass prioritizes adjacent-verse discovery; the second ranks the expanded pool. Each pass checks the two concerns sequentially, causing four calls in the baseline. Use frozen candidates and recorded responses for offline comparisons, without invoking a provider. Compare bounded alternatives while preserving discovery opportunities and per-concern coverage; a single pass over the complete pool is not available earlier unless the discovery dependency is also redesigned.
2. Measure whether evidence ranking and selection can share a single bounded decision over the same candidates, or whether one step can be safely removed. Keep direct support, requirement coverage, context, and citation-identity checks mandatory.
3. Avoid repeating unchanged claims through meaning review and correction only when the full snapshot dependencies from Phase 3 are unchanged. Correct only the affected claim or section, then recheck the correction within the existing shared bound. A failed correction is withheld or paused, never accepted because the retry budget is exhausted. Keep combined consistency, necessary qualifications, final coverage, and summary checks even when individual claim checks are reused.
4. Preserve source retrieval and candidate limits. Reduce redundant calls only when frozen-candidate comparisons retain the same useful, directly supported evidence.

### Exit gate

Matched offline cases preserve required source coverage and reject the same unsupported claims with fewer slow calls. No call is removed based only on an average latency improvement.

## Phase 6 — Pause and continue only unfinished work

### Work

1. Before implementing Continue research, define whether checkpoints survive only the current session or also refresh, disconnection, and worker restart. The ordinary stream has no resumable server checkpoint. Select and review the checkpoint mechanism, ownership, retention, encryption where stored, expiry, engine-version binding, and cancellation behavior before exposing the control. Do not activate durable storage or patient execution as a shortcut; keep them independently gated.
2. When a required lane hits a recoverable timeout or provider failure, keep still-valid checked output visible and pause the unfinished work. Privacy/integrity failures, invalid checkpoints, and uncertain billing can block the whole job. Continue must not bypass those blocks.
3. Resume from the last verified checkpoint without asking the visitor to re-enter the question. Reuse valid completed research and exact-snapshot checks. Necessary source-freshness or changed-context checks may fetch sources again; do not promise zero repeated source calls. Persist completed candidate/context snapshots and stage results atomically so changed retrieval ordering does not silently create different paid requests.
4. Reuse the existing model-attempt journal principles: reserve before sending, bind attempts to the owned job and execution lease, commit response and cost before acknowledging completion, and replay only settled matching requests. A settled response can avoid a new charge only when the request fingerprint and attempt identity match. A new prompt, changed evidence, or new summary may require newly budgeted work. Ambiguous sends and missing cost receipts require reconciliation, not another automatic call; explicit Continue is not authorization to bypass uncertainty.
5. Set numeric continuation-count, wall-time, token, concurrency, and cumulative spending caps before implementation acceptance. Require explicit user action for each continuation. The existing patient worker installs an unlimited research runtime, so it cannot be reused unchanged as a bounded implementation. Show what remains unfinished and a clear expired/unrecoverable state when safe resumption is unavailable.

### Exit gate

Offline interruption/reconnect and crash-boundary scenarios reuse settled identical paid responses, retain valid earlier checks, and resume only unfinished or invalidated work. Test a crash before send, after send but before response commit, and after commit but before checkpoint delivery. Uncertain charges block continuation until reconciled; duplicate workers cannot send the same reserved attempt. Changed evidence, expired checkpoints, and engine changes cannot silently reuse old approval. Numeric continuation and cumulative cost limits are enforced.

## Phase 7 — Measure before acceptance

### Offline verification

- Use mocked transports and saved fixtures only; offline replay must never dispatch a paid model request. Test a fast Quran lane with slow Sunnah and scholar lanes, the reverse ordering, each source timeout, queue wait, missing context, checker rejection, strict-output 400, correction limits, cancellation, reconnect, and withdrawal. Include shared multi-verse evidence, cross-source qualifications/conflicts, dependent-summary invalidation, and interruption during a paid attempt.
- Confirm that no empty source group is rendered as a gap and that incomplete/technical failure messages name the actual failed stage.
- Verify Arabic, English, and German status wording and stream behavior; Arabic is the first language acceptance path.

### Live verification

Only after offline gates pass, define a fixed small live sample and enforce a spending limit before dispatch. Mo's subsequent instruction authorizes the current online test, so no repeat permission request is needed within that scope. Announce the bounded sample and cap, preserve previous spending records, and stop on uncertain billing. Any expansion requires separate authorization. Keep the current models, privacy settings, and source boundaries. Review produced answers against their cited originals; do not treat a model checker or passing status as religious certification.

Report separately: server emission and browser display time for the first verified source card and first checked explanation, total time, queue wait versus active work, completed/failed groups, actual model calls/tokens/cost, timeouts, continuation work reused versus newly charged, and source-faithfulness review. Preserve separate measures for early source cards and checked explanations; a card cannot substitute for the explanation target.

The mandatory initial gate is safe behavior within the normal route budget: the stream route has a 55-second application limit and declares a 60-second route duration; the pipeline normally defaults to 50 seconds. Reserve explicit time for summary generation and mandatory final checks. When completion does not fit, return an honest bounded partial/paused result, with Continue available only after Phase 6 is accepted. Do not extend the route deadline to meet a latency target.

The proposed product targets for a predefined common-question sample remain median first checked explanation within 30 seconds and 90th percentile within 45 seconds. They are provisional goals to assess with measurements, not demonstrated feasibility; the baseline's selection call alone took 34.9 seconds. Report completion rate and final-answer timing separately so early display cannot hide failure to finish.

Compare matched cases with the 121.2-second first-explanation baseline, using at least 30% earlier display as a secondary progress measure. That improvement alone is about 84.8 seconds and cannot satisfy the bounded-route acceptance gate. Do not compute percentiles only from successful answers: include all submitted sample cases, report the share receiving checked explanations by 30 and 45 seconds, and explicitly account for timeouts, failures, cancellations, and cases with no checked explanation. If more than 10% do not receive one by 45 seconds, the sample cannot pass that p90 goal. A small paid sample can establish feasibility, not a reliable population p90.

Implementation order: Phase 1 diagnostics and offline summary-contract investigation; Phase 2 stream revisions and earlier whole-section delivery; Phase 3 independent lanes. Phase 5 reductions can be evaluated alongside lane design. Phases 4 and 6 remain gated on their evidence-unit and checkpoint prerequisites respectively. The smallest display repair is releasing checked Sunnah before an unrelated scholar-only correction; no source or claim check is removed.

## Release record and boundaries

Update [the existing Ask implementation log](ask-system-repair-progress.md) in order, separating **implemented**, **offline verified**, **live verified**, and **accepted**. This plan itself does not authorize code changes, paid calls, a model switch, storage migration, commits, pushes, or production deployment. Release still requires source-faithfulness review and Mo’s acceptance.

