# Ask follow-ups: phase 1 preparation

2026-10-30. Offline tooling only. No production prompts, routes, behavior or limits changed.

## Prepared

- `scripts/ask-follow-up-planner.ts` captures the actual current planner's initial request using an injected writer that stops before any model call or retrieval. A separate candidate adds the planned fields and parent context. Existing request properties and schema fields stay intact.
- Candidate-only validation rejects invalid field combinations. A local evaluation helper allows one correction and reports clarification for lost context. This code is not imported by production.
- Eight fixed cases, four English and four Arabic, cover reference resolution, negation, earlier personal circumstances, parent injection, an unavailable parent, another scholarly view and a new topic. Parent sentences are explicitly synthetic test data, not checked religious answers.
- The comparison helper reports both kinds, requirements, queries, backup queries, qualifiers and candidate follow-up fields. It retains raw attempts and marks meaning review as pending. A change is not automatically scored as an improvement or regression.
- The preparation command writes requests to `work/ask-follow-up-planner/requests.json`. It never loads credentials or creates a model provider.
- Added the requested priced Vertex Gemini spending test. It checks Google's token-based charge including thinking tokens, replay, the nine-call ceiling and the cumulative cost reservation across fallback transports. Responses are fake; no spend occurred.

## Evaluation status

Mo initially kept the run unpaid, then authorized one run of the eight cases on Vertex Gemini 3.1 Flash-Lite, at most thirty-two calls, with a stricter $0.10 aggregate ceiling. That single run is complete: twenty-one provider sends, 44.26 seconds, $0.03111950 calculated from provider token usage at the app's configured rates, including thinking tokens. No unresolved cost reservations remain. This is not Cloud invoice reconciliation.

Six new plans passed parsing; two did not. Negation and personal classification survived the sample. Regressions include two incorrect intent labels, added personal-case conditions not supplied by the visitor, lost main Arabic queries in the other-view case, and invalid frames for the unavailable-parent and new-zakat-question cases. The single injected-parent case showed no visible obedience to the attack in its planner output. No searches, answers or checker calls were made, so downstream safety is untested.

The local runner and its tested guard are separate scripts, not production changes. It reserves against the actual serialized Vertex request and output allowance before each send, counts every provider send including retries, persists its ledger, and refuses a silent restart of the completed run. Raw attempts, receipts and the detailed review are under `work/ask-follow-up-planner/approved-2026-10-30/`. No additional paid run is authorized. Phase 1's owner acceptance gate remains open.

## Phase 2 follow-through requested by Mo

- Before calling `passageRecord`, copy and sort Quran neighbours by verse key with the same `a.key.localeCompare(b.key)` ordering used in existing freshness checking. Test that differently ordered fetch results produce the same fingerprint after this integration step. Keep `passageRecord` itself sensitive to order.
- Only include translation text after its translation check passed. Add integration tests for accepted, rejected and unchecked translations. Rejected/unchecked text must never acquire a translation fingerprint or signed approval.
- Mo confirmed live Ask is working. Before starting phase 2, remind Mo that only the sixteen-session cap and `ASK_DAILY_LIMIT` review remain open. No limit changes are authorized.

## Checks

- `npx tsc --noEmit`: passed.
- Final `npx vitest run`: 2,335 passed, sixteen skipped, only the four owner-listed failures. No timeout failures occurred. All new planner tests and the Vertex spending test passed.
- Request preparation ran successfully for all eight cases with zero model calls. The last conservative reservation estimate was $0.472968.
- Logs: `work/ask-follow-ups-phase-1-vitest.log`. Existing tests were not changed. No keys, database changes, commits, pushes, deployment or live-site testing.

After adding the approved-run guard, TypeScript passed and the full suite reported 2,337 passed, sixteen skipped and the same four owner-listed failures. Log: `work/ask-follow-ups-phase-1-paid-vitest.log`. The guard's two additional tests passed. Website credentials were loaded normally, used only for this website's planner evaluation, and never printed or saved in reports. No production code or prompt was edited. Phase 2 was not started.

## Authorized corrected-candidate rerun

Mo authorized one fourteen-case run, at most fifty-six calls and $0.15. Only the offline candidate, fixtures and local run scripts changed. The live code, prompts, checks and spending limits stayed unchanged.

Candidate changes: enforce a parsed main Arabic query for general answerable plans, give the specific rejection reason on the one correction, keep clear none-frame failures on the existing frame-error path, and accept only the narrow ambiguous/clarification/empty-requirements exception. Added rules for visitor-stated conditions, cited-view preservation and diagnostic-only intent. Four deterministic regression tests passed. The old malformed-output test now expects a frame error rather than assuming lost context; its one-correction bound remains tested. No expected call counts changed.

Six added cases include two exact summary sentences from saved terminal real answers. Their snapshots and provenance are in `tests/fixtures/follow-up-real-parents.json`; they are task context only, not evidence or newly reverified religious material.

Result: fourteen cases, thirty-one provider sends, 72.83 seconds, $0.05061050 calculated from returned token counts at the app's configured rates. All fourteen candidate outputs pass their contract: ten general-question plans, three personal plans requiring referral and one intended clarification. No unresolved reservations remain. Ledger and raw attempts: `work/ask-follow-up-planner/approved-rerun-14/`.

The earlier Arabic query loss, clear-question clarification and ambiguous-contract issues are fixed in this sample. Remaining weaknesses: a parent-derived topic appears as a visitor condition; some hadith searches still broaden to virtues; the repentance exception is vague in its rewrite; the Arabic inability case still gets re_explain rather than new_information. That case also adds an unnecessary religious premise from earlier AI text to the resolved question. Intent remains diagnostic and does not determine Release 1 routing; the incorrect intent alone is not a phase 2 blocker.

TypeScript passed. Full test suite: 2,341 passed, sixteen skipped, the same four owner-listed failures. No timeout failures. Log: `work/ask-follow-ups-rerun-14-vitest.log`. No source search, answer writing, checker, database change, commit, push or phase 2 work. Stop for Mo's review; no further paid calls are authorized by this rerun.

## Version 4.2: topic-only rewrite and exact visitor quotes

Mo approved updating plan section 5 and the header to version 4.2. The conflicting rule requiring parent conditions/exceptions in rewrites was removed. Visitor facts remain separate from parent topic/attribution pointers. Follow-up conditions now carry same-index `essential_condition_quotes`; exact nonempty substring matches are checked only against current and earlier user messages, never parent text. Unmatched conditions are removed before the existing frame parser. First/new-question condition handling is unchanged. Quote membership does not prove semantic correspondence.

An English/Arabic premise-connector check rejects connectors absent from user text. It uses one correction and then clarification if the connector remains. Tests cover visitor-written connectors being allowed, parent-only Hajj travel being dropped, English negation, Arabic inability and tomorrow from earlier history. Existing schema tests retain assertions for all earlier properties and add the quote schema; the fixture-count assertion now expects sixteen. No existing expected model call count changed.

Added the two requested conditional/false-parent cases and removed the expectation that parent claims must be preserved in the repentance rewrite. The plan now records the phase 2 false-resolved-question isolation test; it is not implemented or executed while phase 2 is blocked.

Single authorized run: sixteen cases, thirty-seven provider sends, 87.76 seconds, $0.06032150 from reported token usage at configured rates, below $0.15. No provider failure, allowance stop or unresolved reservation. No second run was made. Raw attempts and receipts: `work/ask-follow-up-planner/approved-v42-16/`.

All sixteen candidate outputs pass format checking. All seven proposed conditions have exact matching user quotes; no listed premise connector appears. These are not meaning proof. The false Arabic parent is still repeated as an attributed six-prayers view without triggering the connector check. The Arabic injected-parent case is incorrectly classified as none while its requirements use parent context. Those remain reported failures. Wrong intent and virtues drift remain diagnostic only, as Mo requested.

After the run, `npx tsc --noEmit` passed. Full tests: 2,358 passed, sixteen skipped and the same four owner-listed failures. Log: `work/ask-follow-ups-v42-vitest.log`. No timeout failures. No production code or prompts, searches, answer-writing/checker calls, database changes, commits, pushes or phase 2 implementation. Phase 2 prerequisites still open: review the sixteen-session cap, review `ASK_DAILY_LIMIT`, and Mo adds `ASK_FOLLOW_UP_SECRET`. Live Ask is already confirmed working. Stop for Mo; no further paid calls are authorized.

## Unpaid offline backstop fixes after Mo's version 4.2 review

No paid calls or production changes. Arabic premise matching now uses Unicode whole-word boundaries for every connector phrase. It recognizes supported conjunction/pronoun attachments, but does not treat prefixed hamza-less لان as a connector, so فلان passes. Visitor text uses the same connector extraction instead of substring matching, closing the corresponding allow-list bug. Tests include all four reported normal words, a normal بطلان الصلاة rewrite, standalone لأن, grammatical attachments and boundaries for the other Arabic/English connectors.

A narrow anchored bare-reference list now invalidates none only when earlier context is present. It allows one correction and then clarifies. Tests cover English and Arabic ordinals and bare that/ذلك, the two self-contained pillar questions and both zakat new-topic questions. This is not comprehensive language understanding: longer paraphrases, substantive mixed requests, unlisted references/languages and a wrong personal classification can escape it. It does not replace personalGate or model evaluation.

Restored the missing invalid-follow-up fallback after the one correction: no history/parent means first-question handling; context means clarification. A valid none with an invalid frame still uses frame failure. The earlier malformed-output test was restored to expect clarification with context. The previous report's change to frame failure was wrong for that case; its two-call bound and parent-context assertion remain intact. No expected model call counts changed.

Every plan amendment in this round, retaining version 4.2:
1. Restored both missing/invalid-follow-up fallback branches beside the valid-none frame-failure rule, explicitly including unavailable supplied parents as context.
2. Added the narrow dependent-none backstop, its one-correction/clarification behavior, explicit self-contained exceptions and limitations.
3. Specified whole-word connector matching, supported Arabic attachments, the فلان exclusion, and identical matching on visitor text.
4. Made false-claim isolation the FIRST phase 2 deliverable, covering both resolved_question and parent_sentences, evidence/cited-original exclusion, and final-review rejection for sentences supported only by either field.
5. Updated the phase 2 build table: tests before live planner fields; stop/report if they fail; no shipment without passing them.
6. Recorded that false-parent planner output is not itself a planner blocker. Wrong intent, a lost scholar object and virtues drift remain diagnostics to report/measure in phase 3.

Verification: TypeScript passed. Forty new deterministic tests passed; the focused group passed all seventy-seven tests. Full suite: 2,398 passed, sixteen skipped, only the same four owner-listed failures. No timeout failures. Log: `work/ask-follow-ups-offline-backstops-vitest.log`. No new model behavior was evaluated. False-claim isolation is planned, not implemented or tested. No phase 2 work, database changes, commits or pushes. Stop for Mo.
