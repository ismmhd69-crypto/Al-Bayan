# Ask reliability: joint review and phased repair plan

Date: 28 October 2026 (enriched revision)  
Status: **Approved by Mo on 28 October. Phases 0, 1, 2, 2b and 4 done (round 3 met the 8 of 10 screening target); Phase 3 measured with Claude's labels (safety passed, speed not yet); Phase 5 stays local until the single Vercel push (see docs/ask-hosted-execution-design-2026-10-28.md). Nothing committed.** This document does not authorize implementation, paid tests, deployment or database changes. It complements the earlier Ask plans; where an older plan specifies a different model or flow, use the current decisions below.

## Outcome

Make Ask consistently deliver a useful answer grounded in verified originals, with stable source cards and honest recovery when something goes wrong. Present Quran, Sunnah, approved scholars, then Bayan's summary. Measure reliability, relevance, time and cost together; a successful source-card display alone is not a complete answer.

Every phase below ends with a pass/fail gate. Every gate is measured the same way: the same fixed questions, the same code version, and the same scoreboard.

## 1. Fixed rules

- Keep GPT-6 Luna for both passes, the approved source libraries, English and Arabic, and the existing privacy and spending safeguards.
- Keep the nine actual AI-dispatch ceiling across an answer and Continue, **including provider fallbacks**. Measure whether the ceiling itself causes incomplete answers before proposing any change.
- Keep the existing $0.50, requested-output-token and receipt rules. Unknown charges stay reserved and block resending.
- German remains postponed.
- No religious-research deadline locally. No model change, deployment, database migration or new source integration as part of these local repairs.
- Checked sections stay published once shown. The only exception is a specific, grounded integrity notice.
- Stop means explicit cancellation. A dropped connection is a different state and may resume eligible work.
- **When scholars differ:** automatic search never decides al-rajih by counting retrieved quotes or scholars (BAYAN_PLAN.md, methodology and section 3). Only a documented, scholar-reviewed view decision may put one view first. Live Ask has no such decisions today; they exist only for prepared answers (`data/view-decisions`). Without one, supported views are shown with equal weight, or the answer refuses when it cannot present them fairly.

## 2. Evidence behind this plan

The saved records and the current code point to four priorities. They are: preserve research across interruption; remove avoidable final failures while keeping evidence checks; improve retrieval and speed; and settle hosted execution before launch.

### Measured from the nine most recent local runs (27 to 28 October)

These are history, not acceptance results. Code has changed between attempts. Reproduce them against the saved runs before relying on them.

| Measure | Observed |
|---|---|
| Complete answers | 7 of 9 |
| Total time | 63 to 154 s |
| First source cards visible | 35 to 56 s |
| Evidence selection call | 23 to 45 s |
| Each summary review | 11 to 42 s |
| AI dispatches per answer | 4 to 6 |
| Cost per answer | $0.006 to $0.015 |
| First summary draft rejected by review | 6 of 9 |
| Scholar section empty | 5 of 9 |
| Selector reported coverage "complete" | 9 of 9 (final review disagreed in 2) |
| Recovery search used | 0 of 9 |

Most candidates sent to selection were judged unrelated or mention-only, especially hadith and scholar candidates. Scholar searches returned only 2 to 6 quotes per question, so missing scholar sections are mainly a search problem, not a checking problem.

### Confirmed defects

Offline probes used invented sources and made no paid calls.

1. **Stop during the Quran context lookup, then Continue, can produce a complete answer with no Quran.** The context lookup in `lib/ask/simple-pipeline.ts` continues after an abort and saves the shortened candidate list. Continue reuses it, and search problems are held only in a local set, so no "search failed" label survives. The probe saved only hadith and scholar candidates. Continue then approved an answer built from zero Quran candidates.
2. **An interrupted automatic reassessment becomes a permanent failure.** The reassessment is marked used before it returns, and no pending reason is stored. In the probe, Continue repeated the first selection, received the same format error, had no reassessment left, and ended as a final negative. The existing pending search checkpoint is a different mechanism.
3. **Any selected scholar difference ends the answer permanently** (`simple-pipeline.ts`, the selection outcome check). The probe returned a final selection failure with no sections.
4. **Short Arabic wording and quotation marks end answers after the only correction.**
   - **Copy rule.** Four consecutive Quran words count as copying, after every alef is removed for matching (`lib/ask/checks.ts`). Copy findings already join the first review in the simple flow, and appeared in 3 of 9 runs. A corrected draft can still fail the final copy check with no correction left. Whether each case is a false positive needs source-specific review.
   - **Quotation-mark rule.** Any quotation mark, including Arabic guillemets, rejects a sentence outright (`hasQuotation` in `lib/ask/checks.ts`). The Arabic run on 28 October that ended as "wording rejected" failed on this rule, not the copy rule: its corrected summary used Arabic quotation marks, so it was rejected with no further review.
5. **Busy handling is incomplete.**
   - **The real reason is lost.** The current change in `components/AskChat.tsx` keeps the card but relabels the result as a connection interruption.
   - **A finished answer looks like a limit.** The status action in `app/api/ask/stream/route.ts` reports a completed session as unavailable or "limit" and never returns the approved answer.
   - **A second tab shows a false interruption.** Asking the same question in a second tab shows an empty, interrupted card while research is still running.
6. **Tests delete real traces.** Route tests stub development mode and write into `work/local-ask-traces`, which keeps only 24 files. Replay tests then skip silently when their trace is gone.
7. **The tested path is not the hosted path.**
   - **The simple pipeline is local only.** The simple pipeline and unhurried mode work only in local development (`lib/ask/settings.ts`). Production would run the older stable path.
   - **No research limit when hosted.** The stable stream sets an unlimited research runtime even when hosted, while the route declares 60 seconds.
   - **Sessions live in one process.** Sessions are held in process memory, are not shared across instances or restarts, and the whole site has 16 slots.
   - **Hosting.** The live site is on Vercel at askbayan.org (Mo, 28 October). The route declares a 60-second limit, while answers take 63 to 154 seconds.

8. **A rate-limit reply during Continue deletes the whole answer card.** The rate check runs before the server reads the request (`app/api/ask/stream/route.ts`, the `takeSlot` call). Its "rate limited" reply reaches the client branch that removes the stable card (`components/AskChat.tsx`, the generic reply path). All checked sources on that card disappear.
9. **Stop and status checks count against the rate limit.** For the same reason, they use a visitor's request allowance, and Stop can be refused with "too many requests" when the site is busy.
10. **A duplicate question in a new card loses its research link.** The busy reply's continuation token is saved to a different state object than the one the busy branch reads. The new card can never check on the running research.
11. **Expired, cancelled and limit results show the "Check billing receipt" button.** These results keep an empty reason, and the button appears whenever the reason is empty.
12. **One skipped candidate ends the answer permanently.** The selection reader requires an assessment for every candidate (`lib/ask/selection-references.ts`). If the model skips even one unrelated candidate, the whole selection is discarded as an invalid reference. That reason is not on the automatic-retry list, so the answer ends as a final failure.
13. **The reviewer contradicted itself on an unchanged sentence.** In the 154-second Arabic run, the first review flagged only sentence 3. The second review then rejected sentence 1, which the correction had not changed. The answer was withheld. Writer and checker are the same model.
14. **Verse lookups fail together.** A verse's context lookup fetches both neighbours together (`neighbours` in `lib/sources/quran.ts`). If one neighbour fails, the main verse is dropped, and an adjacent selected verse can be dropped with it.
15. **One visitor's Stop can cancel another visitor's verse lookup.** Concurrent lookups of the same verse share one request. That request inherits the cancellation signal of whichever visitor started it first.
16. **Production logs drop the most useful failure details.** The production diagnostics allow-list (`lib/ask/diagnostics.ts`) keeps only listed fields. The selection rejection code and the review rejection reasons are not on it, so production logs cannot explain these failures.
17. **English summaries get fewer code checks.** The condition-boundary and specific-person checks match Arabic wording only. English summaries rely on the model reviewer alone for those two risks.

### Second review checked against the code

An outside review by Gemini (28 October) was checked line by line against the current code.
- **Confirmed, and added above:** defects 8 to 16, plus the quotation-mark cause in defect 4.
- **Did not hold, so not used:**
  - Invented limits: one Continue, $0.05, 48,000 tokens, ten saved traces. The real values are three Continues, $0.50, 150,000 tokens and 24 traces.
  - A Quran restriction to surahs 1 and 2. The local setting already uses the production Quran service.
  - That five near-empty traces came from Stop and status. They came from test runs.
  - That the older production path hides Quran search failures and lacks a cancellation check.
  - A scholar-name example, and a separate "unchanged sentence" rejection rule. That is only a log label; the reviewer itself rejected the sentence.
  - Several quoted code snippets that do not match the files.

Do not claim that all source checks are sound, that the library is comprehensive, or that one nine-run analysis establishes root causes.

## 3. Scoreboard

Fill this in at every gate. Targets are screening gates, not proof of launch readiness.

| Measure | Today | Gate target |
|---|---|---|
| Complete answers (fixed live set) | 7 of 9 (history) | at least 8 of 10 |
| Unsupported sentence displayed | not yet reviewed | 0 |
| First checked source section visible | 35 to 56 s | under 30 s |
| Total research time | 63 to 154 s | median under 75 s |
| Evidence selection call | 23 to 45 s | under 20 s |
| Scholar section present when a relevant approved quote exists | about 4 of 9 | 9 of 10 |
| First draft rejected by review | 6 of 9 | 4 of 10 or fewer |
| Permanent failure caused only by format or interruption | at least 5 known paths | 0 |
| Checked source cards lost after a busy, rate-limit or interruption reply | 2 known paths | 0 |
| Duplicate paid dispatch after interruption | untested | 0 |
| Cost per answer, settled | $0.006 to $0.015 | under $0.02 |

## 4. Fixed evaluation material

Keep all of this private, under `work/private-ask-evaluation/`, never in Git or ordinary logs.

- **Live question set:** 10 questions, 5 English and 5 Arabic, written once and never swapped. Cover:
  - a broad question;
  - a two-part question;
  - a three-part question;
  - a question where approved scholars differ;
  - a question whose cited text carries a condition;
  - a topic with thin hadith coverage;
  - an Arabic question asked on the English interface;
  - a named verse or hadith;
  - a follow-up in the same chat;
  - a control with no good source, which must refuse honestly.
- **Offline replay set:** about 20 cases from saved traces and frozen copies, at least one per confirmed defect and one per scoreboard measure.
- **Labelled candidate set:** for 10 saved searches, a person marks each candidate direct, supporting or unrelated. This is the ground truth for search work. A model's earlier selection is not ground truth.

## 5. Phases

### Phase 0: Protect the evidence (offline, first). **Status: complete, 28 October**

Done: tests write traces to a temporary folder (`ASK_LOCAL_TRACE_DIR`, set in `vitest.config.mts`); nine real traces frozen in `work/private-ask-evaluation/frozen-traces`; replay tests use `tests/helpers/private-fixtures.ts`, skip with a visible reason, and fail when `ASK_REQUIRE_PRIVATE_FIXTURES=true`; production logs now carry the selection retry reason (fixed code list), recovery search count and a per-answer `research_accounting` line; evaluation material is in `work/private-ask-evaluation/reliability-plan/`. Three older traces (2c2b118f, d9e9b89d, fadc13d1) were already lost before freezing; their replays now skip visibly. Correction: production logs already recorded selection and review failure codes in each line's code name; only the details listed above were missing. Label sheets need a person to fill in the labels before Phase 3.


1. Isolate tests from real traces. Any test that stubs development mode must also use a temporary trace folder or turn tracing off. `lib/ask/local-trace.ts` accepts an override folder for tests.
2. Freeze the saved traces that replays need, in a fixtures folder outside the rotating directory. Required acceptance replays fail clearly when a fixture is missing. Optional local tests may skip only with a visible reason. Affected now: `tests/copy-repair-input.test.ts`, `tests/focused-recorded-control.test.ts` and `tests/case-referent-repair-input.test.ts`.
3. Write down the live question set, the offline replay list and the labelled candidate set.
4. Make production logs explain failures. Add the selection rejection code, review rejection reasons and actual dispatch count to the diagnostics allow-list as fixed codes or numbers. Never add question text, prompts or source text.

**Gate:**
- A full test run leaves `work/local-ask-traces` untouched.
- No required replay is skipped.
- The evaluation material exists and is frozen.
- A simulated selection failure and review failure each produce a production log line naming the reason code, with no free text.

### Phase 1: Preserve work and make status truthful (offline). **Status: complete offline, 28 October**

Done:
- Quran lookups: cancellation checks after each batch and before saving candidates; failed families saved in the checkpoint (`searchProblems`); dropped verses logged (`quran_context_unavailable`).
- Shared verse requests run under their own signal and stop only when every waiting visitor has stopped. Each neighbour is retried once. A neighbour failing twice still drops its verse, because Quran context is required.
- Reassessment: saved as pending before dispatch, with its reason and candidate fingerprint. It is marked spent only after it returns, and Continue resumes it without repeating the first selection.
- Stop and status run before the rate check. Status reports `approved` for a finished, approved answer. The client then asks the identical question again with the original history and `reuse_only`, so the server rechecks every original and refuses to start new research.
- Client (`stableResearchReply` and `removeCardOnReply` in `lib/ask/auto-continuation.ts`): a busy reply shows the new "research running" message and keeps the server's link and any earlier result. Other replies get their real reason. A card being continued is never removed.
- Also hardened: `abortable` absorbs late rejections from work it has abandoned.

Tests: `tests/reliability-phase-one-pipeline.test.ts`, `tests/reliability-phase-one-route.test.ts`, `tests/quran-shared-lookup.test.ts`. Full suite: 2,100 pass, 8 skip. The 4 failures predate this plan; they come from older uncommitted changes to question-understanding wording and scholar-referral text. Typecheck and production build pass.

Not yet done:
- A real-browser check of the busy, rate-limit and reuse paths. No browser test tool is installed.
- Saving recovery-search candidates before an interrupted recovery selection. This only repeats free searches, so it is deferred.
- Sessions still live in one server's memory. On Vercel these status fixes only work while requests reach the same instance; Phase 5 covers this.

1. **Quran lookup.**
   - Check for cancellation after each settled lookup or context batch, and immediately before saving the candidate checkpoint.
   - Save only a fully finished initial search, never an aborted or partial one.
   - Keep successful candidates for ordinary source errors. Distinguish a missing original from missing context.
   - Save per-family search problems in the checkpoint so the "search failed" label survives Continue.
   - Record verses dropped because their context failed.
   - Fetch each neighbour separately. A failed neighbour marks that verse's context as unavailable and is recorded; it never drops a different selected verse. Whether a verse without full context may still be shown follows the existing context rules.
   - Stop one visitor's cancellation from cancelling another's lookup. A shared verse request gets its own source deadline, and each caller waits on it with its own cancellation signal.
2. **Interrupted reassessment.**
   - Save the pending reassessment, its reason and the exact candidate fingerprint before the call.
   - Mark it used only after a valid response returns.
   - On a safe continuation, revalidate originals first, then resume the same reassessment with the same inputs. Changed sources invalidate it.
   - A dispatched call stays counted. An unknown charge or outcome blocks resending.
   - A completed invalid reassessment remains spent. Continue cannot grant another allowance.
3. **Busy and status.**
   - Add a distinct "still researching" state, shown only when the server says the session is active.
   - Keep the original failure reason and committed cards.
   - A second tab shows "already researching in another window", not an interruption.
   - When a session has finished with an approved answer, the status reply returns that validated answer to its owner. The reader merges it without replaying or changing commits.
   - Otherwise report the actual blocked, expired, cancelled or uncertain state.
   - The current request-bound stream is not a background job. Do not describe it as one.
   - Save the continuation token from a busy reply on a new card, so the card can check on the running research.
   - Give expired, cancelled and limit results their real reason. Show "Check billing receipt" only for an uncertain charge, and "Check status" only for a running session.
   - Never delete an existing answer card on any reply during Continue, including "rate limited", "busy" and generic errors. Update its status in place.
   - Handle Stop and status before the rate check. They must never use a visitor's allowance or be refused because the site is busy. They still require the owner's session.
   - Finalize this step only after the Phase 5 hosting decision, so status handling is not built twice.
4. **Tests.** Extend the existing tests: `tests/simple-pipeline.test.ts`, `tests/simple-route.test.ts` and `tests/ask-continuation-session.test.ts`. Add the four offline probes as permanent tests: Stop during context lookup, interrupted reassessment, scholar difference, and the short Quran phrase. Each must fail before its fix and pass after.

**Gate:** offline route and reader tests cover:
- cancellation during original and context fetch;
- an ordinary single-verse failure;
- a failed neighbour lookup, which keeps adjacent selected verses;
- two simulated visitors sharing a verse lookup, where one presses Stop and the other still succeeds;
- a rate-limit reply during Continue, which keeps the card;
- Stop and status while all request slots are full;
- expired, cancelled and limit results, which show no receipt button;
- a connection interruption;
- changed candidates;
- retry interruption before and after dispatch;
- unknown receipts;
- Stop;
- duplicate delivery and two tabs;
- busy changing to complete;
- reconnect.

Cards stay visible in every case. There are zero duplicate paid dispatches and no renewed allowance. Tests cannot rotate real traces.

### Phase 2: Complete more answers without weakening evidence (offline). **Status: complete offline, 28 October, with two items deferred to measurement**

Done:
- **Scholar difference.** The dead end in `lib/ask/simple-pipeline.ts` is removed. Sources are published, and the writer and reviewer both receive each position's sources plus an equal-weight rule. Code rejects a summary that ranks a position (`RANKING_LANGUAGE`, English and Arabic) or leaves out a position (`position_omitted`). The reviewer is told that attributed differing views are consistent, but ranking, a single view or a blended ruling are not. Revelation and uncertain conflicts stay blocked by the selection parser.
- **Quotation marks.** Typographic quotation marks in summary sentences are removed by code with the words unchanged (`withoutQuotationMarks`); copying is still checked afterwards, and "said:" lead-ins still fail. In the simple flow, a wording-only failure (copy or quotation) after the meaning correction now gets one free rewrite before the second review.
- **Scholar names.** `SCHOLAR_NAME_VARIANTS` in `lib/ask/scholar-attribution-check.ts` accepts common spellings. The bare Arabic word for "Thursday" (الخميس) was deliberately left out. Generic "scholars" still fails.
- **Skipped candidates.** A candidate the selector did not assess is now "not selected" and logged (`selection_candidates_unassessed`). Unknown, duplicated or retyped references still refuse. A skipped named verse or hadith uses the existing single reassessment.

Measured and not implemented:
- **Code-owned coverage check.** Not needed. The selection parser already rejects a "complete" claim that lacks a direct source for each concern (`gap_map_unsubstantiated` in `lib/ask/patient-models.ts`). The two final-review coverage failures therefore came from summary writing and review, not selection. The added check was reverted.

Deferred to live measurement in Phase 4:
- **Reviewer self-contradiction.** Overruling a reviewer's rejection could approve an unsupported sentence, and only one case is recorded. The existing log code `summary_unchanged_sentence_new_finding` counts occurrences; decide after Phase 4.
- **English condition and specific-case checks.** These need live English answers to measure; the English questions in Phase 4 cover them.

Tests: `tests/reliability-phase-two.test.ts` (8 cases) and the updated `tests/selection-references.test.ts`.

1. **Scholar difference.**
   - Replace the unconditional dead end with an equal-weight presentation of supported positions.
   - Attribute each view to its named scholars and cited quotes, and state its limits.
   - No view is called strongest or al-rajih, and the review rejects any wording that ranks views.
   - If a documented reviewed view decision matches the topic, it may put that view first with the others in a closed fold.
   - Unresolved revelation conflict and uncertain source identity stay blocked.
2. **Arabic overlap.**
   - Build a private fixture set. It should hold legitimate short common wording, genuinely copied clauses, exact quotations, and unrelated controls. Start from `tests/fixtures/recorded-arabic-overlap.json`.
   - Compare the original, the displayed source and the rejection before choosing a fix.
   - A short phrase may be allowed only when it is marked as a quotation, matches the cited original exactly, and passes citation validation.
   - Do not simply exempt four-word phrases, relax meaning checks, or permit invented quotations.
   - Copy findings stay in the first correction. Also check the corrected draft for copying before the second review, so a copy issue never wastes that review.
   - **Quotation marks.** Run the same code-only wording checks (quotation marks, copying, sentence shape, language) on a corrected draft before it is accepted. Return any failure to the writer once as a free formatting fix within the same correction, without a new review. Typographic quotation marks around wording that is not copied from a source may be removed by code only if the text is otherwise unchanged. Real quotations still need exact, source-owned text.
   - **Scholar names.** Accept common spellings of each approved scholar's name, such as "بن باز" and joined or spaced "عبد العزيز". Keep a code-owned list per scholar. A generic "scholars said" still fails.
3. **Coverage gaps, before publication.**
   - Add a code-owned check after selection: every question concern must have at least one selected direct source.
   - An uncovered concern triggers the existing single recovery search (`simpleRecoveryQueries`), even when the selector reported "complete". This stays within the existing call budget.
   - If the final review still finds a genuine gap, keep the committed cards, show an honest "this part is not covered" note, and stop.
   - Never silently reopen, replace or append to frozen source groups. Any later research would need its own designed revision, with publication and spending rules agreed first.
4. **Re-review after a correction.**
   - Keep whole-answer coverage and contradiction checks.
   - Reuse a sentence approval only when its text, citations, originals, context and review policy are identical.
   - A new grounded finding about unchanged text still blocks.
   - Explore selective sentence review only if the same whole-answer protections remain demonstrable.
   - Keep one targeted correction under the existing limits.
   - **Reviewer self-contradiction.** Give the second review the first review's findings and say which sentences changed. If it rejects an unchanged sentence that the first review accepted, it must give a grounded negative finding tied to the exact original. A finding without that grounding is treated as reviewer inconsistency and recorded, not as a new rejection. A grounded finding still blocks. Measure how often this happens on the replay set before deciding anything further.
5. **Skipped candidates.** Treat a candidate the selector did not assess as "not selected", never as approved. Unknown, duplicated or invented references still fail. Named units must always be assessed; if one is skipped, use the existing single reassessment.
6. **English summary checks.** Measure, on English replay cases, whether the reviewer catches a dropped condition and a specific case generalised to everyone. If it misses them, add English equivalents of the two Arabic code checks.

**Gate:** offline cases cover:
- supported differences;
- ranking wording being rejected;
- no defensible presentation;
- real contradictions;
- missing conditions;
- false and real copy cases;
- changed evidence;
- false reviewer disagreement;
- a new grounded finding;
- a coverage gap that recovers before publication;
- quotation marks in a corrected draft;
- accepted and rejected scholar-name spellings;
- a second review that rejects an unchanged sentence with and without grounding;
- a selection that skips one unrelated candidate;
- English condition and specific-case controls.

Every displayed claim remains tied to its exact approved original. Checked cards survive a withheld summary.

### Phase 2b: Small live check (live, cap $0.05)

After Phases 1 and 2, run 3 questions from the fixed live set once each. No retries. Record results on the scoreboard and read each summary against its originals. This confirms completion actually improved before larger work. If none completes, stop and diagnose before continuing.

**Result, 28 October: passed, 3 of 3 complete, $0.0354 total.** Mo set the live test budget at $0.50 for Phases 2b and 4 together; the ledger is in `work/private-ask-evaluation/reliability-plan/live-ledger.json`.

| Question | Result | First sources | Total | AI calls | Cost |
|---|---|---|---|---|---|
| L02 English two-part | complete | 135 s | 158 s | 5 | $0.0147 |
| L07 Arabic on English interface (parents, failed before) | complete | 68 s | 94 s | 4 | $0.0085 |
| L04 Scholars differ (backbiting) | complete | 137 s | 156 s | 5 | $0.0122 |

- Every summary sentence was read against its cited originals. All matched, including the condition in L04 not to inform the person if it would increase hostility.
- L04 did not use the new scholar-difference path: the selector found only Ibn Baz quotes, so no difference was detected.
- L02 used the recovery search, and L04 used the automatic reassessment, both successfully.
- Timing is still far from the target: first sources at 68 to 137 seconds.

### Phase 3: Search quality and speed (offline, may run alongside Phase 2). **Status: measured 28 October; human labels still needed**

Measured on the nine frozen runs, using the selector's own verdicts as a stand-in until the label sheets are filled in:
- **Word-match pre-filter: dropped.** It would remove 0 of 241 candidates, because every candidate already came from a search on the same words. It cannot speed up selection.
- **Cutting candidates is unsafe for the Quran.** Useful Quran picks appear down to rank 16 of 16. Keeping only the top 8 would lose 18 of 47 useful verses. Hadith useful picks were all within the top 8, and scholar picks within the top 3.
- **Scholar recall is capped in code.** `scholarQuotes` asks the stored library for at most 6 quotes (`searchScholarQuotes(phrases, 6, ...)` in `lib/ask/pipeline.ts`). In 6 of 9 runs, 7 to 28 eligible quotes were found and all but 6 dropped. In the other 3, only 2 to 4 existed. Raising the cap is a candidate fix, but it needs the label sheets or a live comparison first, because more candidates also slow selection.
- **Speed lever chosen.** Selection spends most of its time writing an assessment for every candidate, and about half are unrelated. Since Phase 2, a skipped candidate counts as "not selected", so the simple flow may now let the selector skip clearly unrelated candidates. Named passages must still be assessed. This is measured live in Phase 4.

**Labelled set (28 October).** At Mo's request, Claude labelled all 241 candidates in the nine sheets from their text alone. These are not human or scholarly labels. Labels are in `work/private-ask-evaluation/reliability-plan/claude-labels.json` and in the sheets themselves.

| Family | Direct | Supporting | Unrelated |
|---|---|---|---|
| Quran | 28 | 39 | 77 (53%) |
| Hadith | 7 | 4 | 40 (78%) |
| Scholar | 8 | 3 | 35 (76%) |

- **The selector is safe.** It agreed with the labels on "useful or not" for 222 of 241 candidates, and it never discarded a labelled direct source.
- **Direct sources rank high, apart from a Quran tail.**
  - Hadith direct sources were within the top 5 and scholar ones within the top 4, which supports keeping the scholar cap at 6.
  - Quran direct sources were mostly in the top 5 (21 of 28), but reached rank 16, so the Quran list must stay at 16.
- **The real speed limit is search noise.** Most hadith and scholar candidates are unrelated. Cutting them safely needs better search for those two libraries, not a filter after search. That is new search work, outside this plan's rule against new source integrations; it is the main lever left for the speed targets.
- **Phase 3 gate:** passed for safety (no direct candidate lost). Not met for speed (selection median 24 seconds, target under 20).

1. **Measure first.** On the labelled candidate set, record direct, supporting and unrelated candidates by family and by question concern. Report missing fixtures and source outages separately.
2. **Pre-filter before selection.**
   - Add a cheap, deterministic filter: remove exact duplicates and candidates that share no question term or Arabic root in either language.
   - Never remove named units or earlier useful selections. `simpleCandidatePool` already reserves them.
   - Do not discard relevant specific examples because a question is general. Label them accurately, with context and limits.
   - Accept the filter only if no labelled direct candidate is lost.
3. **Scholar recall.**
   - Find out why only 2 to 6 scholar quotes return.
   - Widen English and Arabic scholar queries using phrases already in the validated question plan.
   - Target: a relevant approved quote reaches selection whenever one exists in the library.
4. **Smaller selection input.** Fewer, better candidates should bring the selection call under 20 s.
5. **Earlier first content.** Show the checked Quran section as soon as it is frozen, if this keeps the reading order: nothing later appears ahead of earlier research.

**Gate:**
- On the labelled set, no direct candidate is lost.
- The share of unrelated candidates falls.
- Unrelated controls stay excluded.
- Replays meet the selection time target with source integrity unchanged.
- Ambiguous cases are listed for human review.

### Phase 4: Local acceptance (live, cap $0.25 including reserves)

**Results so far (28 October). Mo raised the live budget to $0.50 for 2b and 4 together.**

Each round ran all 10 fixed questions once, with no retries, on one code version. Fixes went in only between rounds, from diagnosed failures. Results are in `work/private-ask-evaluation/reliability-plan/live-phase4*.json`.

| Question | Round 1 | Round 2 |
|---|---|---|
| L01 broad (patience) | complete | complete |
| L02 two-part (promises) | complete | incomplete: coverage |
| L03 three-part, Arabic (repentance) | checker answer rejected | selection format |
| L04 scholars differ (backbiting) | complete | incomplete: coverage |
| L05 condition (travel prayer), Arabic | selection failure | complete |
| L06 thin hadith (water) | incomplete: coverage | complete |
| L07 Arabic on English interface (parents) | complete | selection format |
| L08 named verse (Ayat al-Kursi), Arabic | incomplete: support | incomplete: coverage |
| L09 follow-up (gold zakat), Arabic | selection failure | selection failure |
| L10 no-source control (smartphones) | correct refusal | **wrong**: implied the Prophet spoke about smartphones |
| **Complete or correct** | **5 of 10** | **4 of 10** |
| Cost | $0.136 | $0.104 |

Every completed summary was read against its cited originals. All sentences were supported, except round 2's L10, which wrongly applied a general hadith on speech to "speech through a smartphone".

Fixes from diagnosis (all offline-tested; the full suite still has only the 4 older failures):
1. **Scholars differ was blocked twice (L05, L09).**
   - A "conflicting" status is now allowed for a difference among scholars in a preview selection.
   - A missing position label now uses the single reassessment.
   - If only one position survives the checks, the answer continues with attributed scholar sentences.
2. **Malformed checker answer (L03, round 1).** The checker paired an excerpt label with the wrong source on a "no" verdict. A negative verdict now binds to its label; approvals stay strict. A replay of the saved answer confirms it is now accepted, and the verdict stays negative.
3. **A failed recovery selection discarded a valid earlier one (L05).** The earlier selection is now kept.
4. **Over-long source conditions (L03, L07, round 2).** The selector wrote condition notes of 217 to 243 characters, over a 200-character limit, which threw away whole 45-second selections. The limit is now 400.
5. **Second review contradicting the first (L06, L08, and trace 825f).**
   - The second review now receives which unchanged sentences and concerns the first review accepted.
   - It may reject them only with a grounded finding.
   - Code never overrides the reviewer, because in L06 the stricter second review may have been right.
6. **Unmentioned subject (L10, round 2).** Writer and reviewer must now say plainly when no source mentions the specific subject asked about, and present general teachings only as principles.
7. **Checker rejection reasons are now logged** (`checker_invalid_*`), instead of an unexplained "invalid".

Speed: first sources now often arrive in 25 to 66 seconds (L01, L04, L06, L08, L10), down from 35 to 56 seconds before the plan. Slow cases (86 to 155 seconds) involve a reassessment or recovery round.

**Round 3 (after fixes 1 to 7): screening target met, 8 of 10 complete and correct, $0.104.**

| Question | Round 3 | Notes from reading every sentence against its originals |
|---|---|---|
| L01 | complete | supported |
| L02 | complete | supported; covers promises, oaths and vows separately |
| L03 Arabic | complete | supported; all three parts answered from Ibn Baz and the hadith on restoring rights |
| L04 | complete | supported, including the hostility condition |
| L05 Arabic | complete | supported, including "after leaving the town's boundaries" |
| L06 | complete | supported |
| L07 Arabic on English | withheld | reviewer found a lost condition and unsupported meaning, even after the one correction; sources shown |
| L08 Arabic | withheld | reviewer found missing qualifications, even after the one correction; sources shown |
| L09 Arabic | complete | supported: Ibn Baz gives the nisab as 20 mithqal, which he states as 92 grams |
| L10 control | correct | no invented hadith; Quran and hadith shown as "no direct evidence"; Ibn Uthaymeen's attributed application to phones in the mosque. It does not yet say plainly that no hadith mentions smartphones |

Scoreboard after round 3:

| Measure | Before the plan | Round 3 | Target | Met |
|---|---|---|---|---|
| Complete or correct answers | 7 of 9 | 8 of 10 | at least 8 of 10 | yes |
| Unsupported sentence displayed | not reviewed | 0 | 0 | yes |
| First sources, median | 35 to 56 s | 37 s (20 to 111) | under 30 s | no |
| Total time, median | 63 to 154 s | 90 s (46 to 143) | under 75 s | no |
| Selection call, median | 23 to 45 s | 24 s (8 to 45) | under 20 s | no |
| Scholar section present | 4 of 9 | 10 of 10 | 9 of 10 | yes |
| First draft rejected | 6 of 9 | 5 of 10 | 4 or fewer | no |
| Permanent failure from format or interruption | at least 5 paths | 0 in round 3 | 0 | yes |
| Cost per answer | $0.006 to $0.015 | $0.0104 average | under $0.02 | yes |

Honest limits:
- Rounds 1 and 2 scored 5 and 4 of 10 on earlier code versions. Ten questions per round cannot establish a reliable rate.
- Round 3 is a screening pass, not launch readiness.
- Religious accuracy was checked by reading against the cited originals, not by a qualified scholar.
- Total ledger: $0.343 of Mo's $0.50, with no uncertain charges. No further live runs are planned without Mo.

**English checks (deferred item from Phase 2), measured:**
- Across 15 English answers in Phases 2b and 4, no dropped condition and no specific case generalised to everyone were found.
- One different scope problem was found and fixed by fix 6 (round 2, L10).
- English versions of the two Arabic code checks are therefore not added now.

- Before paid testing, agree the remaining allowance, reconcile prior spend, and keep unknown charges reserved.
- Run all 10 fixed questions once each on the same code version. No retries to manufacture a pass rate.
- Record:
  - complete or incomplete, with the reason;
  - time to first checked content;
  - research time and visible completion time;
  - actual dispatches including fallbacks;
  - settled cost.
- Read every summary sentence against its cited originals. Send uncertain religious interpretations to a qualified reviewer.
- Verify phone and desktop, Arabic right-to-left, scrolling, reduced motion, Stop, Continue and a second tab.

**Pass:** every scoreboard target is met. Ten questions cannot establish a population rate, so this is a minimum screening gate, not launch readiness. Report every failure.

### Phase 5: Hosting track (decide now, build after Phase 4)

**Decision (Mo, 28 October): all work stays local for now. Nothing goes to Vercel until everything is finished locally; then one push.** Until then, Phase 5 means preparing and testing locally only: no Vercel settings, previews, remote migrations or pushes. The hosted switches stay off (`ASK_SIMPLE_PIPELINE_HOSTED=false`, `maxDuration = 60`). When local work is done, follow step 1 of `docs/ask-hosted-execution-design-2026-10-28.md`; confirming Fluid compute comes first.

**Now:**
- The host is Vercel, at askbayan.org (Mo, 28 October). `netlify.toml` is a leftover; do not remove it without Mo's approval.
- Read that host's current documentation for streaming request limits and background work.
- Verify with a controlled preview only after separate approval.

**Decide between two designs:**
- (a) a background job using the existing gated patient worker and Supabase storage;
- (b) a shorter hosted flow that fits the request limit.

**Design before building:**
- shared durable ownership, event replay and spending records;
- Stop, status, cross-instance reconnect and duplicate-dispatch protection;
- storage privacy and migration needs.

Settle this before Phase 1 step 3 is finalized.

**Fix (done 28 October, offline):** a hosted stable run now gets a 50-second research limit (`CONTINUATION_LIMITS.runMs`) instead of none, so it stops with a final message and a Continue link before the route's 60-second limit. Local unhurried runs stay unlimited. Test: `tests/reliability-phase-one-route.test.ts`.

**Vercel limits (read from Vercel's documentation, last updated 24 August 2026):**
- With Fluid compute, which is on by default, functions may run up to 300 seconds on Hobby and up to 800 on Pro and Enterprise; Pro and Enterprise also have a 30-minute beta.
- The 60-second limit is our own `maxDuration = 60` in `app/api/ask/stream/route.ts`, not Vercel's.
- Local answers take 63 to 154 seconds. Raising `maxDuration` to 300 (with a matching research limit of about 280 seconds) would let most answers finish in one request.
- **Decision for Mo:** confirm in the Vercel dashboard (Project, Settings, Functions) that Fluid compute is on and which plan the project uses. Without Fluid compute, Hobby allows only 60 seconds, and a higher setting could fail the next deployment. Not changed yet for that reason.
- Fluid compute reuses instances, which makes in-memory sessions survive more often, but not reliably. Shared session storage is still needed for Stop, status and Continue across instances.
- Vercel Workflows exist for unlimited background work. That is the long-term option behind design (a); it needs a design and Mo's approval.

Any infrastructure, migration or deployment needs Mo's separate approval. Repeat Phase 4 on the actual hosted configuration only after approval.

## Phase summary

| Phase | Name | Paid calls |
|---|---|---|
| 0 | Protect the evidence | none |
| 1 | Preserve work and make status truthful | none |
| 2 | Complete more answers without weakening evidence | none |
| 2b | Small live check | up to $0.05 |
| 3 | Search quality and speed | none |
| 4 | Local acceptance | up to $0.25 |
| 5 | Hosting track | separately approved |

## 6. Stop rules

- Stop and report if any phase finds a displayed sentence that its cited original does not support.
- Stop if a fix requires a new paid model, a new source integration or a database change.
- Stop if a live check exceeds its cap or leaves an unknown charge.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Equal-weight views read as confusing | Clear per-view headings, attribution and limits |
| Pre-filter removes a relevant source | Accept only against the labelled set |
| Hosting limits force a redesign | Decide hosting before finalizing status work |
| Fixes tuned to ten questions | Keep the held-out offline replays and report failures openly |
| Prior reports treated as proof | Reproduce every count from saved runs before use |

## 8. Open decisions for Mo

1. Live test budgets: $0.05 for Phase 2b and $0.25 for Phase 4.
2. ~~The final host.~~ Decided: Vercel, askbayan.org.
3. Who reviews religious accuracy in Phase 4.

## 9. Status statement

This is a plan, not completed work. The current busy and per-verse changes have focused checks only. Actual browser interruption, the reassessment fix and hosted behavior remain unverified. No test or plan proves Ask reliable until the evidence defined above exists.
