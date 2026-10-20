# Ask: richer explanations and checked sections

## Local full-process logs and waiting policy, 20 October 2026

### Recorded framing failure and repair

Local request `77fae823-4148-4822-99d5-8826efe4e986` stopped after 4.39 seconds, before any source search. Both understanding responses contained a legitimate checklist question ending in `?`. The internal checklist character allowlist rejected that punctuation, retried with only generic feedback, then returned `no_source`. This was a processing failure incorrectly described to the visitor as missing trusted sources, not a timeout or an evidence rejection.

The shared checklist validator now accepts ordinary question and sentence punctuation while preserving length, English-label, instruction, markup and enum checks. Malformed framing, missing checklist status and empty search plans now return the existing generic error display path, which is not saved as a completed exchange. Two recorded framing responses are replayed offline through the real pipeline with scripted evidence and checks. These tests prove search can proceed without a framing retry; they do not establish the quality of a fresh live answer. No paid replay or production release was performed.

Mo requested exact failure logs and enough local time to finish. **Local development now defaults to detailed private tracing and unhurried processing. Production keeps its existing deadlines and privacy-safe console diagnostics.** These settings are allowed only with `NODE_ENV=development` and no Vercel runtime marker; setting a local flag on a deployed runtime cannot enable them.

The failing request `04f0c7fd-b584-496e-bf08-a82ac3e2131b` demonstrated a shared ten-second recovery budget: source recovery finished at 21.77 seconds, and recovery selection timed out at 28.00 seconds after consuming the remainder of that budget. The original Quran package was retained. The Quran section passed at 30.96 seconds. Final checking rejected an unsupported summary claim, repetition and a citation map naming unselected Quran 51:57. One correction repaired the citation map, but unsupported meaning and attribution still failed, and the request ended incomplete at 41.39 seconds. This was not an overall 55-second timeout. Existing logs cannot recover the unrecorded rejected wording or checker explanation, and more time alone cannot make an unsupported statement acceptable.

### What is recorded from the next local request

Each request gets `work/local-ask-traces/<request-id>.jsonl`, with `latest.json` identifying the newest trace. The folder is Git-ignored and is not publicly served. It contains question/history, source-search inputs and results, candidate assessments, the selected package, model instructions and structured inputs, visible model output, exact drafts, claim-by-claim checker feedback, correction attempts, source/transport errors, timing, progress and final result. Request IDs and model call IDs connect the stages. Hidden provider reasoning is excluded. Credentials and headers are masked, but questions and drafts are intentionally readable in these private local files as requested. Ordinary console logs still omit that content.

Read the latest trace with:

```powershell
npm run ask:trace
```

Read a particular request or inspect its full record with:

```powershell
npm run ask:trace -- REQUEST-ID
npm run ask:trace -- REQUEST-ID --full
```

The reader names the rejected sentence, cited source IDs and the checker's actual explanation when present. Rotation on each new trace removes files older than 24 hours and limits the retained request-file count to 25. Each trace stops detailed recording at 5 MiB without stopping its answer. A file-writing failure does not change answer acceptance. Local tracing can be disabled with `ASK_LOCAL_TRACE=false`.

### Waiting and limits

Unhurried local processing removes the application-owned overall pipeline/stream deadline, the combined recovery search/selection cutoff, short hadith/scholar search cutoffs, the correction-writing cutoff and model HTTP timeouts. It retains Stop/disconnect cancellation, source eligibility checks, independent checking, the single correction budget, spending controls, provider retry limits and request/concurrency limits. The local legacy JSON route also propagates request cancellation. Third-party services can still fail, rate-limit or close connections, and bounded source HTTP requests and optional display-translation/video work retain their own transport limits. Their errors are logged rather than claimed to be missing religious evidence. Set `ASK_LOCAL_UNHURRIED=false` to restore normal application deadlines locally.

No production setting or deployment was changed. Production still uses the bounded 50/55-second pipeline within its configured 60-second route duration. Unbounded production execution would require a different hosting/job design; this local change does not claim to remove a host's execution limit.

Type checking and 824 offline tests across 65 files passed, including exact rejection feedback, credential masking, concurrent request isolation, trace rotation/caps, disabled production tracing, local waiting beyond the old cutoffs, Stop cancellation and production deadline preservation. An invalid-request localhost route probe returned the expected 400 without submitting a question. No paid model or database call was made for validation. The experiment ledger and unsettled reservation remain unchanged.

## Current checkpoint: shared-system repair, 20 October 2026

The current opt-in rich path produces **version 4**, superseding the version 3 implementation notes below. Implemented locally only. Existing models, approved source boundaries, the 55-second ceiling, prepared-answer approvals and independent richness/streaming switches are unchanged. No deployment, database writes, migrations or approval-record changes were made.

### What the shared repair changes

- One topic-independent question contract identifies every requested concern, its scope and whether the request is general education or an individual ruling. First-person language and family words no longer override that judgment through topic/pronoun regexes on the rich path. Ambiguous or over-complex checklists request clarification rather than dropping concerns. The independent final checker compares the framed checklist with the original question and checks that the answer avoids personal adjudication.
- Sources have distinct roles: direct support, background explanation and limited examples. Direct complementary statements may jointly support a point. Safe background needs an explicit question link and distinct contribution; mention-only, unsafe, unlinked and duplicate assessments cannot become explanatory evidence. Background never covers a missing required point. Direct coverage is selected first within the existing caps; useful explanation can occupy remaining space without replacing necessary proof. The selector must explicitly judge combined coverage complete.
- Per-concern parallel searches, source-appropriate variants and candidate reservations remain. One bounded recovery can revisit Quran as well as hadith and approved live scholarship. Reference hints are search aids only and can be disabled for controlled evaluation. No new topic hints or hardcoded religious answers were added for this repair. Legacy topic-specific list and wording safeguards remain on the legacy path; the rich checker evaluates actual original-source lists, quantities, exceptions and conditions across all topics.
- The writer produces connected explanations and a question-specific next step. Study advice carries no religious assertions; religious instructions require citations to sources explained in the answer and pass the independent guidance check. Useful explanation, complete question coverage, direct support, attribution, scope, conditions and repetition are separate decisions. A fixed scholar-referral template no longer determines new rich guidance. The reader gets one quiet general-information notice.
- Rejected sibling sections do not erase valid drafts before checking. A failed nonessential section can remain visibly withheld while the rest completes only if the final check establishes full surviving coverage. Missing essential evidence or unsafe conclusions produce an incomplete result without a saved conclusion. Individually safe groups can survive a failed overall check; unsafe earlier content is withdrawn. A summary or religious next step cannot introduce a source absent from the checked explanations.
- The first available selected group is independently prepared and checked, ordered Quran, Sunnah, scholars. Preceding gaps resolve immediately. Remaining explanations and summary are prepared concurrently. The ordinary path retains two writing jobs and two checking stages, plus the existing single bounded correction budget. There is no artificial typing delay or automatic paid retry.

### Version 4 and translation handling

Version 4 retains section/event ordering and adds per-source roles, direct/explanatory question links, display translation provenance/outcomes and checked guidance `{ text, kind, refs }`. The JSON mode on the opt-in endpoint and its SSE mode use the same result. Version 3 saved conversations and approved version 2 prepared answers remain readable; legacy JSON model requests remain unchanged. History still strips Quran and hadith text, rehydrates from their source providers and saves completed terminal answers only.

For scholarly display translations, a bounded read-only lookup resolves both stored and generated live ids by canonical URL **and exact original excerpt**. It does not treat a generated hash id as a database UUID or attach a translation of another excerpt from the same page. Only published candidates are read; actual human-review metadata is preserved, and AI text remains labelled AI. Candidate translations never reach the writer or sealed evidence. The existing independent checker compares each candidate with its exact Arabic original, hash and target language before display. Wrong original/language, incomplete meaning, altered conditions or missing checks withhold the translation. Unavailable, failed lookup, not checked and rejected are separate states. No translations are generated per request, and no old batch is certified globally. Existing named Quran translations and hadith translation credits remain intact.

Available translations for particular production excerpts are **not established** by these code changes. Exact-match lookup can honestly find none. Display translation screening remains automatic; it does not confer human or scholarly approval.

### Verification and remaining acceptance

The fixed question inventory is `tests/fixtures/ask-shared-cases.json`: 12 questions across belief, objections, worship, practical steps, financial conditions and family, each in English, Arabic and German. The file is hash-frozen. Offline transport/checklist tests run all 36 versions with reference hints disabled. Invented originals and scripted verdicts are explicitly labelled; those results do not establish real-model understanding, answer accuracy or a theological success rate. Additional regressions cover safe background, complementary direct support, limited examples, failed necessary/nonessential sections, independent attribution, guidance, missing question points, translation alignment/outages, SSE ordering, cancellation and version 3/4 history compatibility. Type checking, 813 tests across 64 files and `git diff --check` pass.

Browser checks used intercepted fixture responses, never live Ask/provider calls. English, Arabic and German passed at 1366 and 390 pixels: correct direction, no horizontal page overflow, one intercepted request per submission, three unique full source cards, working citation focus, expandable originals and a status/live region. A separate 390-pixel German check used a 276-character displayed claim and 302-character next step, with no overflow or broken citation targets. No browser errors were reported. Actual screen-reader announcement acceptance remains separate.

The six-question live set is two questions per language, across all six categories, with reference hints disabled for half. The existing evaluator supports `--shared-six` and an optional matching private `--baseline` report (frozen case hash and model/source profile must agree), skips prepared reuse for this controlled measurement, preserves current model chains and installs the shared spending guard **before environment/provider loading**. It reports completion, source coverage, first checked section, total duration and cost separately. Manual source-faithfulness and usefulness judgments and a matched baseline remain required; automatic completion is not acceptance.

The guarded attempt on 20 October stopped with `unsettled earlier call; reconcile before continuing`, **zero cases and $0.00 additional evaluation cost**. The original ledger hash remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`; the $0.113472 reservation and $1.50 cap were not changed. The ignored private report is `work/private-ask-evaluation/shared-v4-billing-check-20261020.json`. Do not reset that ledger, substitute another provider or infer performance from fixture timings. Real-model source faithfulness, natural answer quality, actual translation availability, matched timing/cost comparison, the 30% earlier first-section target, independent language/source review and Mo's acceptance remain open. Production release is still blocked pending those checks.

The dated sections below record earlier implementations and investigations, not the current response contract.

Implementation record, 19 October 2026. **Implemented locally, behind switches that default off. Production diagnosis, real-model acceptance, independent source review and Mo’s acceptance are incomplete. Nothing in this change has been deployed.**

## Baseline and confirmed limits

Mo confirmed the production address is `askbayan.org`. Read-only GET checks reached the English, Arabic and German Ask pages successfully; the apex redirects to `www.askbayan.org`. This proves page availability, not working source access or accurate answers.

The starting local revision was `b64ee899078bc1f9dddcce330cb745d0cfb59b47`. The current production revision, runtime model chains, source switches and complete failing production request traces have not been independently retrieved during this implementation. Historical diagnostic examples are not a current production baseline. No production Ask question or paid model evaluation was run.

Code confirms these possible thin-answer paths: independent hadith/scholar search deadlines, source filtering and selection, writer omission, small legacy explanation limits and folded detail. A further confirmed implementation issue is that `scholarQuotes` catches a stored-library failure and returns an empty list. The new path records this failure, including a warning when other scholarly sources remain usable. These are implementation findings, not a claim that every production complaint has the same cause.

The shared experiment ledger still has its $1.50 cap, a stopped status and one unsettled $0.113472 reservation, dated 4 October 2026 for `google/gemini-3.1-flash-lite`. Its pending entry contains only model, reservation and timestamp, without an attributable request/generation id or final usage cost. It cannot be settled from that record alone. Ledger SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`. No reservation was released or ledger edited. Additional paid evaluation cost: **$0.00**.

## What changed

The existing prepared-answer match remains first. An approved prepared answer returns its existing `AnswerV2` and exact review boundary. It is not rewritten into a newly approved rich answer. Published learning articles are not added to approved Ask evidence.

For opt-in live answers, the existing per-point question planning, parallel source searches and separate source-group selection lists feed one sealed, context-checked evidence package. Required source-completeness gates and unresolved scholarly-difference refusals still apply. Source caps reserve capacity for three Quran passage cards, three hadith and three scholarly excerpts. Ordinary Quran verse capacity is eight; complete named passages retain the existing special handling. There is no requirement to fill a source quota.

`rich-engine.ts` starts two writing jobs against that same combined package: the Quran explanation, and the remaining explanations plus summary. The Quran explanation receives its own independent check against all selected originals and context. It can then be sent while the remaining work finishes. The final check evaluates every claim, conditions, requested-point coverage, applicable listed steps, repetition, the direct summary and consistency with the earlier section.

The checks include direct support, attribution, audience, conditions, scope and causal meaning. Code rejects unknown references, wrong source-kind attribution, copied passages, missing selected-group explanations and unsupported ruling language. Every selected source in a group must be cited; complete named Quran passages stay together. Model judgment is still involved, so these checks do not prove theological correctness.

The writing prompt requests natural, useful explanations, normally 250–450 English-equivalent words overall, without padding. There are up to eight cited items per source section and four in the summary, within a 32-item overall ceiling. A short, complete answer is allowed. Both writers and checkers retain original Arabic and contextual restrictions. Defective display-only translation batches are not introduced into evidence. Unavailable translations remain unavailable, with no invented replacement. Existing eligible source translations still need independent alignment review; this implementation does not certify those translations.

## Reading experience

Sections appear as Quran, Sunnah, named scholarly explanations, then Bayan’s cited summary. Each available group has its own explanation. Citations use readable verse, collection/number and scholar labels, not internal UUIDs. Source data travels with its section, including cross-references, so citations work immediately. Previews remain visible; full original wording, available translations, translation attribution, hadith grading and source links expand beneath them.

Bayan’s fixed next-step guidance is separate from religious claims. Existing automatic-answer wording, the personal-ruling notice and problem reporting remain available. Blue, gold and text colours use the existing site variables. English, Arabic and German interface copy is supplied, with logical layout properties for Arabic.

The UI distinguishes no directly relevant selected evidence, unavailable search, search timeout, search failure, an explanation that could not be checked, and a group withheld because full support could not be established. Partial source failures are disclosed even when a checked section is available. It never translates a failed search into “no hadith exists.”

If there is no Quran evidence, the Quran gap is resolved and the available groups proceed. A failed Quran explanation can be withheld while the other explanations are checked. Later failure retains independently checked sections with an incomplete-answer notice and no final conclusion. If the final check identifies a problem in the earlier section, a withdrawal event visibly removes it. A disconnected visitor receives no automatic retry.

## API, compatibility and switches

`POST /api/ask/stream` accepts the same bounded question, language and optional user-message context as the existing Ask request. It retains same-origin/JSON checks, request-size and question limits, visitor/day/concurrency limits and privacy controls. The old `/api/ask` JSON endpoint and prepared `AnswerV2` format remain compatible.

| Switch | Behaviour |
| --- | --- |
| `ASK_RICH_ENABLED` absent/false | Existing reader and JSON Ask path. New endpoint disabled. |
| `ASK_RICH_ENABLED=true`, `ASK_STREAM_ENABLED` absent/false | Rich answer returned as JSON after completion. Checked partial sections can accompany an incomplete result. |
| Both true | Same rich generation with checked sections delivered as SSE. |

`ASK_ENABLED` remains the overall off switch. No environment file or Vercel setting was changed. Next’s statically generated Ask page receives its rich flag at build time, so changing these deployment switches requires the corresponding rebuild/redeploy and page refresh. Stale clients receive an honest unavailable/error response; they do not automatically submit another paid request.

SSE frames contain `request_id`, consecutive `sequence`, and a `progress`, `section`, `withdraw` or `terminal` type. Sections contain their group, outcome, claims and source data. The successful terminal result is `rich_answer` with `version: 3`, `review: automatic` and `complete: true`; approved prepared matches retain `status: answer` and their existing format. Incomplete results never claim completion. The client checks ordering, request identity, source/citation structure and exact correspondence between streamed sections and the completed rich answer. The decoder handles UTF-8 split across chunks and rejects truncated or excessive frames.

The route caps processing at 55 seconds within its 60-second function allowance. The existing configurable pipeline deadline remains, capped at 55 seconds. Cancellation reaches model calls and request-scoped Quran searches, stored-library queries and live scholarly searches. Pending section jobs are aborted; no later model stage may start after cancellation. Shared Quran verse and hadith-catalogue cache requests may finish under their existing independent bounds because they can serve other visitors; the canceled answer stops awaiting or using them. This shared-source exception does not permit another paid model request.

Optional videos are omitted from the new rich path, so they cannot delay it. Existing legacy video behaviour is unchanged. There is no new video search or source expansion in this delivery.

## Saved conversations

Completed rich answers use the existing chat JSON column, without a migration, new policy or changed database permissions. Only a validated completed terminal answer invokes saving. Intermediate, interrupted, withdrawn or incomplete answers are not saved as completed conversations.

All Quran/hadith original text, translations and display metadata are stripped from every repeated section citation before saving. Reopening loads those texts again from the appropriate source and revalidates the answer’s structure/source restrictions. It does not claim a new independent semantic audit of a historical answer. Existing version-2 chats remain supported. Automated fixtures establish this behaviour; signed-in account/browser acceptance has not been performed, and no live chat/database row was written for testing.

## Measurement and acceptance

Existing privacy-safe diagnostics now record rich progress, each checked section’s group/outcome/item count, withdrawal and terminal status, alongside existing request, retrieval, selection, model-usage and revision information. The first **ready** section, not a loading or gap event, establishes time to first checked section. Full completion is a separate event. Costs remain provider-reported; missing billing is unknown.

`scripts/evaluate-ask-rich.ts` reuses the frozen controlled-question manifest and original shared spend guard. Its free `--dry-run` verifies the manifest. Billable mode refuses unsettled ledger entries before importing providers or making network calls; it also rejects current model chains outside the OpenRouter spending guard. It does not silently change model chains or clear the reservation. Private reports remove Quran/hadith source text and separate prepared answers, automatic rich completions, incomplete/error outcomes, source counts, per-case first-section/total timings and cost. They calculate the fraction earlier for each completed rich answer and count cases meeting 30%; they do not convert automatic completion into source-faithfulness acceptance.

Example free check:

```powershell
npx tsx --conditions=react-server scripts/evaluate-ask-rich.ts --dry-run --out=work/private-ask-evaluation/rich-manifest-new-run.json
```

Use a new report filename each time. The paid path remains blocked until actual billing evidence reconciles the older charge. No real first-section improvement, total latency, source-share improvement, semantic failure rate or cost per completed rich answer has been established. The 30% target remains **unmeasured**.

Offline checks cover source-group search failures, partial outages, selection/explanation omissions, incorrect references and attribution, negative audience/condition/scope/causal/support checks, source data accompanying sections, out-of-order events, split Arabic bytes, truncated streams, cancellation/slot release, JSON-only rich mode, withdrawals, saved-text stripping and source rehydration. Shared legacy tests still pass. See the final check record below for counts.

Browser checks used deliberately invented, labelled fixtures intercepted only inside the test browser. The local server’s real Ask processing was disabled. Desktop 1280×900 and phone 390×844 checks found no horizontal page overflow; Arabic RTL, long German text, source expansion, citation focus and first-section/progress/Stop/incomplete states worked. This was viewport testing, not physical-device or native-language acceptance. Live-region markup was checked; a real screen-reader session remains separate. The temporary browser overrides and local preview server were closed afterward.

### Final check record

- `npm run typecheck`: passed.
- `npm test`: **699 tests passed across 59 files**, including the new rich pipeline, streaming route, reading view, saved-answer and measurement checks.
- `npm run build`: passed with the ordinary environment and new switches defaulting off. The existing missing-`metadataBase` warning remains; it is unrelated to Ask generation.
- The guarded evaluator’s free manifest check passed; it made no model calls.
- Final reading-view browser checks passed in English at desktop width and Arabic/German at phone width. Source expansion, readable references and both collection numbers remained visible without horizontal page overflow.
- The temporary preview processes and browser fixtures were stopped/closed. No environment, database, approval, model-chain or production deployment setting was changed. No commit or push was made.

These establish implementation behaviour, not real-model accuracy, speed or religious acceptance.

### Remaining release gates

1. Reconcile the recorded unsettled charge against actual billing evidence without discarding it.
2. Establish current production revision, runtime settings and complete failure traces, including hadith/scholar connectivity and translation availability.
3. Run guarded matched controlled evaluations, source-faithfulness review and the paired faithful/incorrect summary cases. Compare first checked section, total time, source coverage, semantic failures and cost separately.
4. Complete signed-in chat, screen-reader, practical/source and native-language review, then Mo’s preview acceptance.
5. Only after these gates, enable richness in a controlled release; enable streaming separately. Either switch can be rolled back independently. No production promotion is claimed here.

## 20 October: Mo’s local manual test and follow-up repairs

Mo’s screenshots exposed a real source-coverage failure. The available local trace, request `099306bb-13eb-4171-862f-deea6cbf8d1b`, used HadeethEnc and ended at 19,807 ms. Quran and hadith were both reported as timed out; only a scholarly excerpt reached the answer. The first substantive checked section appeared at approximately 19,805 ms. Gap/progress events earlier in the request do not count as a useful first section. This one manual test therefore showed essentially no streaming latency benefit. It is not a matched evaluation or a source-faithfulness approval. The earlier interrupted attempt shown in the screenshot has no corresponding complete trace available here, so its exact cause remains unconfirmed.

The rich path’s eight-second Quran cutoff could expire before the source’s ten-second HTTP deadline. Rich Quran retrieval and hadith-search allowances now permit twelve seconds, still within the unchanged overall processing ceiling. The opt-in Quran search also retains successful individual-query results when another query fails, and records the partial outage. Legacy calls without the opt-in failure observer retain their existing all-or-nothing search behaviour. Node’s wrapped connection-timeout errors are recognised separately from visitor cancellation.

The reader now prominently labels answers whose source searches or explanations failed as limited to the sources actually shown. This also applies when reopening an earlier completed answer with recorded source gaps. Safe cited material can still be read; unavailable Quran/hadith evidence is not invented. The client no longer calls every display/checking error a lost connection, distinguishes user cancellation, and withholds a final summary if the response does not finish correctly.

Follow-up verification: type checking passed and 154 focused tests passed across nine files, including new partial-query, timeout-classification and limitation-notice cases. No additional paid AI question was submitted by the agent. Unauthenticated HEAD requests reached the Quran API/authentication hosts and HadeethEnc, but those transport checks do not establish successful authenticated Quran searches, catalogue retrieval or accurate answers. The HadeethEnc source mode and model chains were not changed. No production setting, approval or database row was changed.

The local development server remains available on port 3000 for Mo. Live source recovery, the earlier interrupted attempt, real-model accuracy and the matched timing target remain unverified; do not treat these code repairs as their acceptance.


## 20 October: evidence-search and completion repair

### Verified failure

The next manual attempt, request `215c6159-6b5c-42a1-b09c-6b5efcfb4042`, differed from the earlier timeout case. Its trace retrieved 16 Quran verses, eight hadith and one 159-character scholarly excerpt. Ranking retained eight verses, four hadith and the excerpt. Selection retained Quran 4:92, Quran 2:279 and the excerpt; no hadith was selected. The Quran writer finished normally, but the section failed before an independent Quran checker call. The old parser collapsed multiple rejection reasons into null, so the exact cause of that historical failure cannot be recovered. Do not retrospectively claim it was the ruling-word rule.

The remaining checker accepted two scholarly sentences and two summary sentences from the same short excerpt. The answer was incorrectly treated as completed at 19,280 ms. Its first substantive section appeared at about 19,279 ms, which demonstrates no meaningful streaming benefit for this attempt. These are one-case observations, not matched performance or religious-accuracy measurements.

### Implemented locally

- Hadith-title search now ranks each phrase separately and interleaves results before its cap. Per-point/group ranking remains in place. This is improved lexical retrieval, not a claim that full-text or semantic search exists.
- Checked repentance/rights candidate hints now include Quran 39:53 and 66:8, HadeethEnc HE5438 (Bukhari 2449), and official Ibn Baz fatwas 21559 and 17964. They remain candidates, not approved answers. The currently enabled hadith source mode and all source/authenticity gates remain in force.
- Rich selection requires each candidate's contribution, general/case-specific scope, conditions and explicit scope match. Background and limited examples cannot count as direct procedural support. Those restrictions accompany the sealed originals seen by the writer and checker. Quran 4:92's accidental-killing rules and Quran 2:279's riba context must not become a universal repentance procedure.
- One source-group recovery reuses the existing bounded selection correction when an applicable hadith or scholar group is empty, including when another group already covers the requested points. Approved live-scholar recovery is reachable. Failed recovery records a source failure instead of silently claiming no direct evidence. Existing scholar title filters were not loosened. The identities of the three filtered hits from the historical trace remain unavailable.
- Rich parsing reports specific privacy-safe rejection codes, source IDs and draft fingerprints without visitor text or raw generated wording. Attributed descriptions of commands may reach independent checking; a ruling keyword alone no longer rejects them. A per-claim attribution verdict remains required.
- At most one writer correction is shared across both writer jobs and semantic checking, against the same originals and concrete failure codes. Its call is capped at six seconds and skipped with fewer than ten seconds of remaining processing budget. Checker outages do not cause another writing call. The global 55-second ceiling and current model chains remain unchanged.
- Final coverage identifies surviving non-summary claim IDs, their exact references, the requested point and preserved conditions. Summary-only coverage, unknown references, duplicates and absent point coverage fail closed. A failed selected section cannot become a completed V3 answer, even if the remaining checker says complete. Individually checked material may remain visible with an incomplete terminal result, without summary or completed history save. A group with no selected evidence can still be absent from a complete answer when the available evidence fully answers the question.
- Exact and near-exact repetition is rejected in code; semantic repetition remains independently checked. A failed repetition verdict cannot expose the remaining repeated paragraphs as checked partial content.
- Full source cards appear once per answer. Later sections keep citations and previews targeting the existing card. Translation notices now say the Arabic original is shown here. Next-step copy depends on the checked question's ruling, practical or evidence-learning needs and adds no religious instructions.

### Additional source-extraction finding

A public-page check of [Ibn Baz fatwa 17964](https://binbaz.org.sa/fatwas/17964/فضل-الاستغفار-وشروط-التوبة) showed that the ordinary first-600-character excerpt returned 502 characters but omitted the full resolve and human-rights conditions. Adding its URL alone would not have repaired that missing explanation.

An explicitly checked pair of source boundaries now extracts one continuous 461-character original span containing the introduction and all four conditions. A fresh public read confirmed the returned span is an unchanged substring of the whitespace-normalised original, contains stopping, remorse, resolve and the condition concerning other people's rights, and fits the existing 600-character limit. Changed, duplicated or oversized boundaries fail closed. No stitched quotation, generated translation or database import was added. This mechanical/source comparison does not constitute independent scholarly approval.

The directly relevant [Bukhari 2449 record](https://hadeethenc.com/en/browse/hadith/5438) is a checked retrieval hint; HadeethEnc's anonymous explanations and benefits are not promoted to approved scholarly evidence.

### Verification and remaining boundaries

- Type checking passed. Final offline suite: **729 tests passed across 61 files**. New regressions cover phrase isolation, Arabic/English/German reference hints and attributed descriptions, scoped selection, exact excerpt extraction, surviving coverage, one shared correction, privacy-safe diagnostics, failed recovery, checker outages, completion/history protection and source-card deduplication. Existing JSON, prepared-answer, cancellation and stream-integrity tests remain passing.
- Browser checks intercepted all three Ask submissions with explicitly invented fixtures in a separate anonymous browser context. English at 1280x900 and Arabic/German at 390x844 each rendered three full source cards, nine working internal references, correct direction, expandable originals and citation focus, without horizontal page overflow. The context and interception were closed. No real Ask request, account write or paid model call was made by these checks.
- The existing local server remains on port 3000. Production deployment/settings, approvals, database rows and the experiment ledger were not changed. No commit or push was made. The existing unsettled reservation continues to block paid evaluation; this repair incurred no additional paid model usage.
- No live-model comparison was run. Accuracy, unnecessary-refusal rate, actual source coverage, cost and first-section latency remain unmeasured for this revision. Native-language and independent source-faithfulness acceptance, signed-in saving and Mo's acceptance remain release gates. The production behaviour has not been promoted.


## 20 October: landing-page question cancelled on chat mount

Reproduced Mo's landing-page Enter failure in an isolated anonymous browser, intercepting Ask with a delayed offline JSON response. Before the repair the sequence was request, aborted, rejected:AbortError, followed by the stopped message. AskChat consumed the pending question and sent during its mount effect; React development Strict Mode replay then ran the unmount cleanup and aborted that request. The started ref prevented a second send.

The pending-question effect now schedules both consumption and submission for the next task and clears that scheduled launch on cleanup. The first replay setup cannot consume or send the question; the surviving setup sends it once. Real Stop and unmount cancellation remain unchanged, and no failed paid request is retried automatically.

After the repair, landing-page Enter in English, Arabic and German, the English submit button and a popular-question button each produced one intercepted request, one question and one reply, with the pending handoff consumed and no premature stopped message. Separate intercepted Stop and New chat checks confirmed cancellation still happens with no second request; New chat opens empty. These are browser/lifecycle checks with mocked responses, not AI-answer accuracy tests. Type checking and 30 focused chat/stream tests passed. No paid model request, database change, deployment, commit or push occurred. The existing local server remains on port 3000.


## 20 October: subsequent all-sections-withheld attempt

The retained Next development log contains request `d1e62005-e206-4b37-94b1-fb112310f29d`. This attempt retrieved 16 Quran verses, eight hadith and two scholar excerpts, including HE5438 and the complete 461-character fatwa excerpt. Selection retained Quran 5:39 and 4:92, HE5438 and both scholar excerpts. Retrieval recovery therefore was not the failure in this request.

At 22,921 ms the Quran draft failed the source-copy guard and immediately took the single writer-correction budget. At 24,037 ms the other job was classified by the old logger as model_no_answer and its section arrays could not be parsed. The Quran correction failed the same copy guard at 24,075 ms. No independent explanation checker ran, and the response finished incomplete at 24,079 ms. The exact drafts were not recorded, so it is not possible to establish which phrase matched the copy guard or to recover the second job's exact status. The old logger conflated a no_answer status with missing/invalid statuses; new diagnostics distinguish these cases.

### Follow-up repair

- Initial writing jobs no longer compete for an immediate correction. When the Quran draft fails, the coordinator waits for the other initial job, then sends all repairable failed groups in one bounded correction. A valid independently checked Quran section still streams before the remaining writer finishes. Provider/checker outages do not cause a new writing request. Repeated rejected draft payloads are deduplicated in correction context.
- Each writing job now receives explicit citable IDs for its requested sections. Failure in an unrequested section must not cause it to decline its own supported explanation. A decline has bounded section-specific reason codes and missing requirement IDs; missing/invalid status and malformed feedback have distinct diagnostics. Copy, citation, source-faithfulness, attribution and independent checking rules were not weakened.
- Rich question framing now independently labels a requested point general or case_specific. Code rejects a case-specific contribution as direct support for a general point even if the selector sets scope_matches_question=yes. Other directly supported evidence may still form a package. Existing legacy frame/JSON contracts accept the optional field unchanged. Privacy-safe diagnostics include the two scope decisions without free-text conditions.
- The empty incomplete view no longer says that sections passed when none did. This wording fix does not convert a failed response into an answer.

Verification: type checking and **734 offline tests across 61 files** passed. New cases reproduce concurrent copied-source and no-answer failures and require a single correction containing all four sections; confirm immediate Quran streaming when only the remainder needs repair; distinguish general and specific scope; and check the empty-response notice. These use invented wording and scripted model responses, not the unrecorded original drafts. No new paid model call was made and the existing billing stop remains unresolved. Successful live answering, real refusal rates and timing still need guarded evaluation and manual source comparison. No production deployment, database write, approval, commit or push occurred.

The local server was restarted on port 3000 as a hidden background process with richness, streaming and privacy-safe diagnostics enabled only for that process. Logs remain available through Next's development log. This startup does not constitute a successful live Ask evaluation.


## 20 October: checked explanations displayed but final coverage rejected

The latest local trace, request `2b3c90cb-c214-4b1a-a9df-88dd98ca971e`, retrieved 16 Quran verses, seven hadith and three scholarly excerpts. Selection retained HE5438 and official fatwas 17964 and 21559. No Quran passage was selected as direct support; Quran 4:92 was correctly classified as a case-specific limited example rather than general procedural support. This legitimate missing group was not itself an explanation failure.

The writer and independent checker reached substantive output. The final coverage gate failed at 30,362 ms and again after the bounded correction at 36,988 ms. The response retained two hadith claims and three scholarly claims and ended incomplete at 36,991 ms. Their retention establishes automatic checking outcomes, not independent religious acceptance. The historical log records only surviving_coverage_missing, so the exact failed coverage field is not recoverable. It does not prove that the mismatch repaired below was the sole cause of this particular rejection.

Review found a contract mistake in the previous implementation: the design places the direct answer in Bayan's final summary, but the coverage parser excluded summary claim IDs and required each answering claim to have the writer's exact single-point tag. A faithful synthesis could therefore be independently checked, explicitly answer a requested point and still be excluded from completion. Redundant model citation bookkeeping could also reject an otherwise checked claim when it named a primary source rather than the claim's entire citation union.

### Coverage correction

- The final checker may identify any surviving checked claim that answers a point, including the summary. Every summary citation must also appear in a surviving checked source explanation. Summary-only evidence cannot establish completeness.
- Every citation used for point coverage must have been selected as direct support for that point. A writer's single-point tag no longer prevents the independent checker from recognising a second supported point, but an unrelated source cannot gain new point coverage this way.
- The complete citation union is derived from the checked claims. A checker may name a primary citation from that union; invented, unrelated and duplicated coverage references still fail. No displayed citation is dropped or generated by this bookkeeping correction.
- Missing requested points, negative or uncertain conditions, failed source explanations, inconsistent claims, unsupported summary claims, repetition and source-faithfulness failures still prevent completion. No Quran/hadith/scholar quota is imposed.
- Coverage failures now record fixed, specific reason codes and privacy-safe requirement, claim and source IDs, including missing rows, unknown claims, missing conditions, unsupported point mappings and summary evidence without an explanation. Positive and negative checker coverage decisions are recorded without visitor or answer text. Bounded correction feedback receives the specific failure codes.

Verification: type checking passed; **738 offline tests across 61 files** passed. Added regressions cover a checked synthesis completing an answer with no selected Quran evidence, summary-only evidence rejection, cross-point support grounded in the sealed originals, lost-condition refusal and primary-citation bookkeeping. These are invented fixtures and scripted audits, not a replay of the unrecorded original checker response. No new paid question was submitted. The local website is updated; real-model success, timing and cost remain unverified for this revision, and production, database rows, approvals and the billing stop remain unchanged.
