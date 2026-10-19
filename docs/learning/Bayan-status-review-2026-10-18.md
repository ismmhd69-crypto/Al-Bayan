# Bayan status review

Checked 18 October 2026. Read-only review of the current checkout, live Bayan database, saved evaluation records and selected public pages.

**Mo, your memory is partly right: the core Ask system is built. But answer accuracy has not passed its final acceptance checks, and translation is not just an unfinished queue. Some translations already stored need repair.**

## What is built

- The Arabic, English and German website, with Ask, hard-question topics, newcomer pages, accounts, saved chats, reporting and support.
- The Ask process: understand the question, find sources, have a separate model select supporting evidence, write from a restricted source package, check citations and wording, and screen the answer again. Personal cases are referred to a scholar. Failed checks can produce a refusal or a message explaining that a checked summary could not be written.
- Quran Foundation production access, with verses loaded from the source rather than permanently stored in answer files.
- A stored Arabic hadith library with 14,629 published records: 7,263 Bukhari and 7,366 Muslim. Today's metadata check found no published hadith missing a grade, grader, rights reference or Sunnah.com URL. This checks those fields, not every narration against its external source.
- 7,255 published scholar fatwa records. Every one has English and German translation rows.
- 44 prepared answers: 32 common questions and 12 hard-question topics. Today's strict read-only audit loaded all 44 in Arabic, English and German and passed their existing structure/content-expectation checks. **43 have database approvals matching the current content.** Music is still draft. These checks do not replace a new sentence-by-sentence religious review.
- Source text and translations are denied to anonymous database reads. The public site reads them through its server.

The older handoff still says some approvals are missing. Today's database and hash checks supersede that part of the old notes.

## Translation progress, checked in the live database

| Collection | Arabic records | Both English and German present | Neither present |
|---|---:|---:|---:|
| Sahih al-Bukhari | 7,263 | 6,113 | 1,150 |
| Sahih Muslim | 7,366 | 3,585 | 3,781 |
| Total hadith | 14,629 | 9,698 | 4,931 |

There are 34,044 full-translation rows overall: 19,396 hadith rows and 14,648 fatwa rows. The latter includes translations attached to hidden fatwas. All are recorded as AI-origin, unpublished drafts. No row has both a named reviewer and a review date. A server setting can still allow AI drafts to appear, with their AI label; unpublished does not by itself prove they are invisible on the website.

**These are presence counts, not counts of correct or accepted translations.**

### Confirmed translation defects

1. **German Muslim 1446a is mostly English.** The live text includes English sentences such as “why do you favor Quraysh with marriage and leave us?” with scattered German substitutions. It also appends a German sentence saying that the complete chain and wording have been retained. That extra sentence is not in this Arabic narration.
2. **This came from a reproducible generation method.** Recent generators, including batches 356–359, construct German by replacing selected English words, rather than translating the whole passage. For example, `scripts/translate-codex-batch-359-run.ts:35` does exactly that and adds the stock sentence. In batches 358 and 359, all 60 live German texts match those local generated texts. Batches 356 and 357 each have 24 matching live texts; six previously existing translations per batch were preserved.
3. **Some generators pad text to pass the length check.** `scripts/translate-codex-batch-340-run.ts:16` repeats a stock sentence until the translation reaches a minimum ratio to Arabic length. Its English inputs also include generic topic summaries reused for multiple records, rather than full individual translations. This makes a successful length check misleading.
4. **Previously recorded omissions remain in the database.** Bukhari 2704 still omits the final compiler note from both translations. Bukhari 2718 condenses the variant chains and price reports. The translation log already identifies both problems. Bukhari 4418 still has no translation rows, consistent with its dedicated-review deferral.

I scanned every stored English and German hadith translation for the specific template/padding signatures found in these scripts. The scan flagged **393 English rows and 674 German rows, covering 788 distinct hadith**. The accompanying CSV identifies all 1,067 rows for review. This is a targeted review list, not a complete error count or a verdict that every flagged row has the same defect. Another 202 German rows contain selected English phrase signals; that broader heuristic overlaps the list and needs individual inspection.

The current translation validators check fields, numbers, length, Arabic leakage and selected German characters. They do not prove a complete translation, correct German, preserved conditions or direct source meaning. Adding a German stock sentence can satisfy the character check while leaving the body in English.

## Why the AI work is not finished

### Accuracy and usefulness acceptance remain open

The latest stored reliability investigation explicitly records manual concerns in answers that passed automatic screening:

- A fasting answer added a causal connection not explicitly established by the cited verse.
- A Quran-preservation summary dropped a tentative qualifier from the scholar's wording.
- Zakah and divorce summaries raised concerns about omitted conditions or broadened scope.

These are recorded findings from earlier runs, not newly generated answers in this review. The latest diagnostics report says the newer promises refusal has not yet had its precise cause identified and repaired.

The completed 26-case baseline answered 16 of 22 expected-answer cases, or 72.7%, and refused all four expected-refusal cases. Those are return/refusal counts, **not a 72.7% accuracy score**. The later 85% answer-rate target and repeated final evaluation were not completed. The older 95% required-point target also remains open.

A stronger claim-by-claim checker exists behind `ASK_CLAIM_AUDIT`. It checks support, audience, conditions, scope and causal meaning. It defaults off. Its real-model comparison file contains zero evaluated cases and explicitly reports a spending stop. Mocked tests cannot establish that the real checker notices subtle changes of meaning.

The shared experiment ledger still records an unresolved call and retained reservation. I did not reset it, change the cap or make any paid AI calls.

Evidence: `docs/ask-fix-report.md`, `docs/ask-diagnostics-report.md`, `docs/ask-findings.md`, and `docs/ask-repair-runs/claim-audit-evaluation.json`.

### Stored hadith text is missing from the writer's input

This is a separate, current code finding:

- `lib/sources/hadith-rules.ts:219` maps stored hadith with both translations set to null.
- `lib/ask/core.ts:340` builds the source object with Arabic and those translation fields.
- `lib/ask/core.ts:489` builds the writer's source package; at line 501 it removes Arabic from every non-scholar source.
- Full stored translations are attached for display only after answer validation, in `lib/ask/display-translations.ts`.

Therefore, in stored-library mode, the writer receives the selected hadith's identity but no Arabic or translated hadith body in that passage object. This is a source-input gap. Finishing database translation rows alone will not change it. I did not measure how many live refusals it causes, and I do not claim it explains every earlier hadith-search problem.

The local configuration currently selects `HADITH_SOURCE=hadeethenc`, the older connector. Production's current hadith setting was not inspected. The two paths must not be treated as interchangeable proof.

### Search still needs work

Stored hadith search shares a capped result pool with fatwas and filters for hadith afterwards. It uses Arabic word matching. The earlier report found weak matches for prayer, zakah and other topics. The current implementation still follows that design. I did not run a new paid before/after answer comparison.

## Hadith display work

- Safe rule-based separation of a quoted saying from its chain is built and connected to cards.
- There are 183 local marking files containing 10,944 unique hadith marks. The manual marking data does not currently drive Ask's display; Ask uses its rule-based splitter. A completed marking log is not evidence that those marks are live.
- The separate short English/German translations for the highlighted saying are not available through the live database API. Reading `hadith_words_translations` returned a missing-table/schema-cache error. Its migration exists locally, but this check cannot distinguish an unapplied migration from a schema-exposure/cache issue.
- Full narration translations and short highlighted-saying translations are separate jobs.

## Other confirmed gaps

**Reports for stored hadith fail validation.** The answer view sends `SH` source IDs, while `app/api/report/route.ts:10` accepts Quran, HadeethEnc and scholar IDs but omits stored-hadith IDs. An offline call to the actual validator accepted the other three ID formats and rejected a valid-format `SH` ID. Consequently an answer containing stored hadith cannot submit its ordinary source-linked report through this route. No real report was submitted during this review.

**Public usage limits are still per server instance.** `lib/ask/limits.ts` keeps visitor, daily and concurrency counters in memory. New instances or restarts have separate counters. This is not a dependable site-wide spending ceiling. The paid experiment ledger is separate from the website's runtime limits.

**Launch acceptance is not complete.** Current source permissions, hosting AI/privacy settings, provider account setup, spending alerts, restore testing and human language review need an up-to-date launch checklist. Older notes are inconsistent and are not proof of current external settings. The source-rights fields checked above do not establish all current permission terms. No new legal opinion or security certification was attempted.

## What I verified today

- Live source/translation totals, collection coverage, source metadata, translation-review metadata and anonymous access denial.
- All 44 prepared answers through the existing strict audit in all three languages; 43 matching approvals.
- All 19,396 full hadith translations scanned for specific template/padding signatures; selected defective translations compared with their Arabic records and local generators.
- Full TypeScript check passed, without generating a build.
- Full automated suite: 582 tests passed and one fixture test timed out at five seconds. That entire four-test fixture file passed when rerun alone. This is a timing-sensitive full-suite result, not an all-green full-suite run.
- Public English, German and Arabic homepages returned HTTP 200. English and German purpose-topic pages showed the reviewed answer and cited Quran passages. The public English review route returned 404. These were page reads, not visual/device acceptance or proof of live Ask accuracy.

I did not change repository files, database records, approvals, deployment settings or the spending ledger. Diagnostic scripts and outputs were kept outside the Bayan repository. I did not run a fresh production build, make paid AI calls, inspect private user chats or perform a full sentence-by-sentence review of thousands of translations.

## Recommended next order

1. Stop using the replacement/padding generators. Review and repair the flagged existing translations, starting with confirmed failures. Do not treat insert-only continuation as a repair for incorrect existing rows.
2. Repair the stored-hadith writer input and report-ID mismatch, preserving the source and accuracy gates. Check hadith search separately.
3. Resolve the existing experiment-billing stop, then finish controlled answer-faithfulness and usefulness evaluation. Keep experimental modes off until their acceptance evidence exists.
4. Resume the 4,931 missing full hadith translations with real language and completeness review. Complete the highlighted-saying translations and verify their display.
5. Confirm production settings and finish launch acceptance with site-wide limits and real user checks.

**The right description today is: the main product is built; source-faithfulness, translation repair, integration and launch acceptance are still active work.**
