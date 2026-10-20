# Bayan: work plan, one item at a time

Created 18 October 2026. New to Islam status refreshed 19 October 2026.

## The direction

Bayan's main website and Ask system are built. The next work has two goals:

1. Repair the confirmed accuracy, translation and connection problems.
2. Make Bayan a better place to learn, especially for someone discovering Islam or beginning to practise.

Mo's direction: work through clear, separate tasks. New to Islam should offer real guidance in a sensible order, with more questions, useful explanations and visible progress. Hard Questions should also become more engaging and informative. Readers should receive understandable answers, not feel that they have only been handed a list of references.

**This file is the master work list. The approved New to Islam map has 32 lessons. All 32 have now been reviewed in order, corrected where needed and compared in English, Arabic and German. The refreshed [master manuscript](Bayan-New-to-Islam-master.md) matches the local website content; the [ordered review](Bayan-New-to-Islam-deep-review.md) records each finding and change. The website experience is implemented locally. Independent scholarly, practical and native-language acceptance, instructional illustrations, full phrase audio and publication remain separate work. No scholarly or publication approval is claimed.**

## How we will work

Ask worker checkpoint, 20 October 2026: a leased background worker now connects to the existing pipeline through a guarded preview launcher. Local PostgreSQL proves interruption, lease expiry, rechecking an earlier section and completion without repeating the recorded fake model call. Worker runtime is finite and separate from the unchanged HTTP ceiling. The launcher is disabled and paid runs remain blocked. Browser reconnection, later-read source/approval checks and production hosting remain open; this does not complete the full search-engine plan.

Ask persistence checkpoint, 20 October 2026: the prepared job-storage migration and encrypted application repository passed eleven local PostgreSQL scenario groups, including database close/reopen, owner isolation, worker leases, event ordering, Stop with late billing receipts, cost reservations and replay without another model call. The migration remains unapplied remotely. The website is not yet resumable: worker, reconnect routes/UI, source/approval revalidation and deployed maintenance remain open. No paid evaluation or production change occurred. See the [implementation record](../ask-search-engine-implementation.md) for the detailed evidence and remaining gates.

Ask second checkpoint: the local 40-source index pilot revalidates source text and attribution fingerprints; corpus candidates and two-round gap-driven recovery are connected behind disabled preview switches. The source-state RPC migration is prepared and its SELECT body was checked read-only against four real sources, but it has not been applied. All 908 tests and the isolated Ask type check pass. The full engine remains in progress; durable jobs, embedding evaluation, videos and release acceptance remain open. See the implementation record below for exact limits.

Ask search redesign, 20 October 2026: implementation of the [phased search-engine plan](../ask-search-engine-plan.md) has started. The [implementation record](../ask-search-engine-implementation.md) documents the read-only inventory, 100 drafted multilingual benchmark intents, private index prototype, hybrid retrieval algorithm and optional contextual ranking integrated before the current pipeline's lexical caps. The preview defaults off. All 871 tests passed. The isolated Ask search/pipeline type check passed; a subsequent whole-project check is blocked by concurrent syntax errors in `LearningMarkdown.tsx`, which this task did not modify. Source labels, the real embedding pilot, complete corpus integration, durable jobs, rich videos, release review and Mo's acceptance remain open. Paid evaluation remains blocked by the existing unsettled reservation. This does not mark the full engine or a production release complete.

- Work on one numbered task at a time. Within large tasks, finish one small batch before starting the next.
- Each task ends with what changed, what was checked and what remains uncertain.
- A passing format check is not proof of accurate meaning or good language.
- Keep unrelated changes separate. App changes, database repairs and publishing are distinct steps.
- Do not overwrite translations, apply migrations, publish or deploy as part of merely preparing a plan.
- Keep Arabic, English and German aligned in meaning. Clear English alone does not complete multilingual content.
- Keep new religious content as draft until its claims and sources are reviewed. Changed prepared answers need approval for their new content.
- Do not run paid experiments around the existing billing stop or reset its ledger.

No implementation is included in this document. All work items below are pending unless explicitly marked otherwise.

## A. Trust and technical repairs

### 1. Stop the defective translation method

**Problem:** some generators create German through English word replacements and use repeated filler to satisfy length checks. Some English outputs are generic summaries rather than full translations.

**Work:** identify the affected generators and prevent their reuse in the translation workflow. Improve checks to reject stock padding and obvious mixed-language text. Require an actual completeness review, not just length or umlauts.

**Finished when:** a known defective example is rejected, a properly translated example passes, and the approved translation instructions prohibit replacement-based German, invented commentary, omitted chains and padding.

### 2. Repair translations already stored

**Problem:** the targeted audit flagged 1,067 translation rows across 788 hadith. These are review candidates, not 788 identical confirmed errors. Live examples already confirm mixed-language German and missing material.

**Work:** start with a small source-by-source repair batch. Include Muslim 1446a, Bukhari 2704 and Bukhari 2718. Then work through the review list in bounded batches. Check English and German against the complete Arabic, including narrator and compiler notes. Check for problems beyond the original signatures as evidence emerges.

**Finished when:** each reviewed item has a documented decision, incorrect rows are repaired through an approved update process, and the original text and correction history are preserved. Existing-row preservation is not a repair for an incorrect existing row.

### 3. Fix the stored-hadith input to the answer writer

**Problem:** stored hadith are mapped with empty translations, and the writer's package removes their Arabic. Display translations are attached only after checking.

**Work:** establish a permitted, source-faithful way to give the writer the selected hadith's actual content. Preserve the separation between original sources, translations and AI explanation. Do not automatically feed the defective draft translations into evidence processing.

**Finished when:** a controlled check proves the writer receives the selected hadith's content, its citations remain correct, and unsupported statements still fail the checks. Measure live usefulness separately after the paid-test stop is resolved.

### 4. Fix reporting for stored hadith

**Problem:** the answer page sends stored-hadith IDs that the report endpoint rejects.

**Work:** support the actual stored-hadith ID format through the report path and check any database validation too.

**Finished when:** a report containing a stored hadith can be accepted through a controlled check, while malformed IDs remain rejected. Avoid creating fake production reports.

### 5. Improve stored-hadith search

**Problem:** hadith and fatwas share a capped search pool; Arabic word matches can return loosely related narrations.

**Work:** record a small fixed set of search questions and expected passages first. Investigate a hadith-specific result pool and better relevance ranking. Keep the later evidence checks strict.

**Finished when:** the same controlled cases retrieve more directly useful hadith without increasing unrelated matches. A database search change is a separate approved step.

### 6. Resolve the existing experiment-billing stop

**Problem:** the previous paid test has an unresolved call cost and retained reservation.

**Work:** reconcile it against actual billing evidence. Preserve the ledger and agreed cap.

**Finished when:** the record has a justified resolution and further tests can run within an agreed budget. Elapsed time does not resolve an unknown charge.

### 7. Finish AI answer-faithfulness acceptance

**Local implementation checkpoint, 19 October 2026:** the opt-in rich Ask path now provides cited Quran, Sunnah and scholarly explanations followed by a checked summary, with genuine checked-section streaming, honest source-gap states, cancellation and completed-answer-only history. Legacy JSON/prepared approvals remain compatible, and both new switches default off. Offline behaviour and browser viewport checks are recorded in [the implementation report](../ask-rich-streaming.md). Real-model accuracy, the 30% first-section timing target, current production diagnostics, independent source/language review and Mo’s acceptance remain incomplete. The existing unsettled $0.113472 reservation and $1.50 spending cap are preserved; there has been no production release.

**Local repair checkpoint, 20 October 2026:** traced the subsequent no-timeout failure and repaired phrase-level hadith retrieval, missing-group recovery, scoped evidence selection, diagnosable writing with one shared correction, final surviving-claim coverage and refusal to complete after a selected section fails. Removed duplicate full source cards, improved next-step/translation copy, and checked a complete contiguous 461-character official repentance excerpt. Type checking and 729 offline tests across 61 files passed; separate fixture-only browser checks passed in all three languages. No paid model evaluation, database change or production release occurred. [Evidence and remaining limits](../ask-rich-streaming.md#20-october-evidence-search-and-completion-repair). Real accuracy and timing acceptance remain open.

**Later 20 October checkpoint:** subsequent live attempts exposed parallel correction contention and a final-coverage contract that excluded the summary despite the agreed layout. Repairs coordinate one correction across failed writing jobs, compare independently framed question scope with evidence scope, and allow a checked synthesis to establish coverage only when its citations also occur in checked source explanations and directly support the point. Specific private-safe coverage rejection codes replace the previous generic diagnostic. Type checking and 738 offline tests passed. The latest retained trace still ended incomplete; successful real-model acceptance is not claimed. No new agent-paid evaluation or production release occurred. [Latest diagnosis and limits](../ask-rich-streaming.md#20-october-checked-explanations-displayed-but-final-coverage-rejected).

**Shared-system repair, 20 October:** version 4 is implemented locally with topic-independent question checklists, distinct direct/background/example evidence roles, complementary source support, checked question-specific guidance, exact-excerpt display translation lookup and first-available-group streaming. Old version 3 conversations and approved version 2 prepared answers remain compatible. A frozen 36-case multilingual checklist/transport set runs without reference hints; separate source-quality, translation, failure and history regressions and desktop/phone fixture browser checks pass. These establish software behaviour, not real-model accuracy. The guarded six-question comparison stopped before any model call because the earlier spending reservation remains unresolved. No ledger reset, database writes, approval changes or deployment occurred. [Current implementation and open acceptance](../ask-rich-streaming.md#current-checkpoint-shared-system-repair-20-october-2026).

**Problem:** earlier answers passed automatic screening while changing qualifications or adding meaning. The stronger checker has not completed real-model acceptance. The latest recorded promises refusal is also unresolved.

**Work:** reproduce specific failures using the diagnostics; compare faithful and deliberately incorrect summaries against fixed sources. Measure unnecessary refusals, useful answers, preserved conditions and response time. Keep live-generated and prepared-answer results separate.

**Finished when:** the agreed accuracy and usefulness checks have real results, manual source comparisons agree, and remaining gaps are explicitly recorded. Do not call software-test counts an accuracy percentage.

### 8. Resume missing full hadith translations

**Current presence count:** 4,931 hadith lack both English and German: 1,150 Bukhari and 3,781 Muslim. Counts can change and must be refreshed before resuming.

**Work:** translate in small batches using the corrected process. Give unusually long or difficult reports their own complete review. Reuse accurate existing work without accepting its correctness merely because it exists.

**Finished when:** the missing queue and deferred reports are accounted for, with both languages checked for completeness and meaning. This follows correction of the defective workflow.

### 9. Complete short translations for highlighted hadith sayings

**Problem:** the separate short-translation table is not available through the live database API. Local chain/saying marks are also separate from the rule-based display currently used by Ask.

**Work:** establish whether the table is absent or unavailable through configuration. Decide which reviewed boundaries to use. Translate only the words shown in each highlighted box, without confusing a narrator's words with the Prophet's words.

**Finished when:** the Arabic highlight, short translation, full narration and chain display agree for controlled examples in all languages, with a safe full-text fallback where a split is uncertain.

### 10. Add dependable site-wide usage protection

**Problem:** the website's visitor and daily limits currently live in each server instance's memory.

**Work:** make limits apply across instances and restarts; verify actual service spending controls and alerts separately.

**Finished when:** multiple instances cannot independently spend the same daily allowance. Do not confuse the experiment ledger with website protection.

### 11. Confirm production and launch readiness

**Work:** check the deployed version and settings, active hadith connector, draft-translation visibility, experimental flags, provider/privacy configuration, source permissions, backup/restore arrangements and language/device acceptance. Establish the permitted monthly source-refresh process.

**Finished when:** each check has current evidence or an explicit unresolved owner/action. Old handoffs are context, not current proof.

## B. New to Islam: a guided learning journey

### 12. Set the journey and lesson structure

**Previous experience:** six short entries linking to existing pages. The local website now provides the shared 32-lesson course, both entrances and device reading progress. The older six entries are not treated as completion of the new lessons.

**Approved experience:** 32 lessons across six chapters, with one shared course and two entrances. Readers can follow the suggested order or jump to what they need. The master manuscript contains all 32 lessons in three languages, explanations, guidance, 65 answered follow-ups per language, source mappings and unresolved review points.

At the entrance, offer two simple starting choices:

- **I'm exploring Islam:** begin with understanding and questions.
- **I'm new to Islam:** show the practical starting point, with an easy route back to foundations.

Both can share lessons. Avoid building two duplicate courses. Put direct access to becoming Muslim and learning prayer near the entrance; completing a course must never be presented as a requirement for conversion or beginning practice.

**Finished when:** one agreed course map and one lesson template exist before a large writing or interface task starts.

### Approved course order

| Chapter | Lessons | Focus |
|---|---|---|
| 1. Understanding Islam | 1–6 | Islam, Allah, purpose, Muhammad, Quran, Sunnah and hadith. |
| 2. Taking the first steps | 7–11 | Beliefs, becoming Muslim, the past, first days and pillars. |
| 3. Learning prayer | 12–16 | Salah, daily prayers, wudu, complete walkthrough and learning Arabic. |
| 4. Building daily understanding | 17–21 | Quran reading, dua, repentance, family and community. |
| 5. Understanding everyday practice | 22–27 | Food, modesty, work and money, Ramadan, charity and Hajj. |
| 6. Growing with confidence | 28–32 | Character, questions, scholarly differences, reliable answers and further learning. |

See [the master manuscript](Bayan-New-to-Islam-master.md) for the exact lesson questions and full writing. Its release register separates completed drafting from remaining independent language, practical and source reviews. The previous 30-lesson proposal is superseded by Mo's approved 32-lesson plan.

### 13. Write one complete sample lesson

**Drafting completed:** lesson 1 establishes the teaching voice; lessons 14–16 apply it to wudu, the full prayer sequence and learning recitation. All 32 lessons were written in chapter order, first in English, then in Arabic and German with editorial source and meaning checks. **Still open:** independent source-faithfulness and language acceptance, qualified practical review, audio and illustration assets. Drafting and editorial comparison do not constitute those approvals.

**Every lesson should offer:**

1. **The question in the reader's words.** A short opening that recognises what they may be wondering, without assuming their beliefs or personal history.
2. **A clear answer first.** Natural paragraphs that explain the idea directly. No unexplained Arabic terms, lecture-like wording or opening wall of quotations.
3. **Help understanding it.** Explain why the question matters and give a relatable example where useful. Clearly distinguish a teaching example from a quotation or religious proof.
4. **A small, suitable next step.** Reading, reflection, finding reliable support, or a sourced practice where appropriate. Avoid inventing prescribed acts or turning study advice into a religious obligation.
5. **Common questions.** Usually two to four useful follow-ups, with actual prepared answers rather than buttons that only rerun Ask.
6. **Sources you can inspect.** Keep the Arabic originals, honest translation labels and clickable references. Tie religious statements to their support while keeping the main explanation readable.
7. **A clear next lesson.** Tell readers how it connects to what they just learned.

Example of the welcoming tone, not a religious ruling:

> You can use this guide one lesson at a time. If something is unfamiliar, open the short explanation beside it. You can also skip to a question you need today and return to the suggested order later.

**Finished when:** the sample feels useful to a beginner, every substantive religious claim has direct support, practical instructions are complete, and the three language versions preserve the same meaning.

### 14. Build a course experience around the reviewed lessons

**Implemented locally, 19 October 2026:** Bayan now has both entrances, six chapters, all 32 article routes in Arabic/English/German, saved reading progress, resume before marking read, undoable reading marks, previous/next navigation, direct shortcuts, per-paragraph source links, original Quran passages and named translations through the existing connector. The prayer reader selects the actual unit branch. Existing fonts, logo, site shell and global theme were preserved. Not deployed; independent publication acceptance remains separate.

**Work:** show chapters, the current lesson, a clear Continue button, previous/next navigation and optional deeper questions. Preserve existing device progress where practical. Keep lessons freely accessible and allow readers to undo a completion mark.

Completion means **“I read this lesson”**, not “I mastered Islam” or a score of religious commitment. Suggested reading time should describe content length, not impose a daily deadline. Avoid streak pressure, guilt-based messages or locking important guidance behind completion.

Progress stays on the device unless account syncing is separately chosen. Do not add sensitive personal questions or collect conversion status merely to personalise the course.

**Finished when:** a reader can start, understand the next step, leave and resume without losing their place, in all three languages and on a phone.

### 15. Expand the course chapter by chapter

**Ordered review completed locally, 19 October 2026:** all six chapters and 32 lessons were reviewed from first to last. Gaps were corrected with direct sources, practical examples and matching Arabic/German wording. Each lesson has two or three answered follow-ups and editorial claim mappings. Local website delivery is implemented; independent acceptance and publication remain open.

**Work:** reuse suitable approved content where it actually answers the lesson. Adapt it into the beginner format instead of adding filler to reach 32 entries. Write and review one chapter at a time. Link difficult side questions without making them compulsory before basic practice.

**Finished when:** each published chapter contains reviewed explanations, working sources, useful follow-up answers and a sensible next step. Draft or unavailable lessons are clearly identified.

## C. Hard Questions: thoughtful answers that people want to read

### 16. Improve the existing 12 answers before adding a large new collection

**Content package completed, 19 October 2026:** all 12 existing questions were researched and drafted in their current order, English first and then Arabic/German for each article. The [master manuscript](Bayan-Hard-Questions-master.md) contains direct answers, deeper explanations, three answered follow-ups per article per language, related links, clickable sources, claim mappings and specific unresolved points. The [ordered review](Bayan-Hard-Questions-review.md) records original wording, findings, changes and language comparisons. These are editorial drafts with recorded research limits, not independent scholarly or native-language acceptance. Website files, current prepared answers, approvals, database and live AI sources were not changed in this phase.

**Subsequent local website integration completed, 19 October 2026:** the original 12 articles and nine additions now appear on the existing topic routes in development, with blue/gold reading layout, expandable follow-ups, per-paragraph citations, original Quran passages and named translations, grouped evidence and related/previous/next links. All 63 article routes and three indexes passed local HTTP checks; type checking and three focused tests passed. Follow-up and citation interactions passed on each new article. The shared layout was checked at desktop (1366px) and phone (390px) widths, including Arabic RTL and long German text, with no horizontal page overflow. This is browser viewport testing, not physical-device acceptance. Drafts are not enabled in production, and existing prepared answers, approvals, database and Ask sources remain untouched. See the repository's `docs/hard-question-articles-implementation.md` for the implementation record.

**Work:** read each from a newcomer's point of view. Identify the actual concern, answer it directly, explain the reasoning and limits, then offer a deeper section. Keep the existing source checks and return changed answers to review.

Use this structure:

- **The question people are really asking.** State it fairly and respectfully.
- **The short answer.** A useful plain-language explanation.
- **Let's unpack it.** Define unfamiliar terms and address the difficult part without dodging it.
- **An example, if helpful.** Use it to explain, never as a substitute for evidence.
- **What this answer does and does not establish.** Distinguish established support, a named scholar's view, scholarly disagreement and matters not established by the available sources.
- **Follow-up questions and sources.** Let readers explore naturally.

**Finished when:** all 12 are individually accounted for, with no stronger claims than their sources support. Longer must mean more useful, not more repetitive.

### 17. Add a reviewed question map

**Research briefs completed, 19 October 2026:** nine proposed additions are documented in the [ordered review](Bayan-Hard-Questions-review.md): why Islam, prophethood evidence, decree and choice, unanswered dua, eternal punishment, Quran 4:34 and harm, Aisha's age and marriage, freedom and apostasy, and slavery. Each has a reader concern, overlap, required evidence, starting passages and research difficulties. All nine are now full articles 13–21, researched and written in English, compared with Arabic/German, and integrated locally one at a time in order. Their briefs retain the original research direction and an accurate completed-draft status. The section now has 21 articles and 63 language versions, not public publication or independent acceptance.

Candidate groups:

- God, purpose, suffering and personal responsibility.
- Faith, evidence, reason and uncertainty.
- Quran, hadith, history and how information is preserved.
- Women, family, dignity, fairness and commonly misunderstood teachings.
- Science, creation and the limits of different kinds of explanation.
- Freedom, responsibility and misconceptions about Islam.

**Work:** choose the most useful missing questions and avoid duplicates. Some existing topics need several focused subquestions rather than one broad answer. Add related links and a clear route back to the beginner course.

**Finished when:** each planned question has a reader need, available evidence, a suitable answer type and a review status. Do not expand only to advertise a bigger question count.

### 18. Define how wider knowledge supports an explanation

**Applied in the Hard Questions manuscript, 19 October 2026:** scientific research, manuscript analysis and historical evidence are separately attributed; theological promises are not presented as independent historical proof. The evolution, Quran preservation, hadith and conquest articles state what their evidence does and does not establish. Specific philosophical, manuscript, transmission and legal gaps remain recorded. This package does not expand the live AI's source library.

Mo wants understandable, thoughtful answers, not only quoted references. We can use everyday explanations, historical background and clearly labelled reasoning to help readers understand. The kind of evidence must match the claim:

| Kind of statement | How it should be handled |
|---|---|
| Religious teaching or ruling | Direct support from the approved religious sources; preserve qualifications and attribution. |
| Historical claim | Reliable historical evidence, with uncertainty acknowledged where relevant. |
| Scientific or factual claim | Appropriate primary or authoritative evidence; avoid overstating what the evidence establishes. |
| Analogy or everyday example | Clearly an illustration that helps explain; not proof of a doctrine. |
| Learning advice | Practical and optional; do not label it a religious requirement. |
| Unresolved question | Say what is known, what remains uncertain and where qualified help is appropriate. |

**Finished when:** this distinction is reflected in the sample answers. Any widening of the live AI's approved source library is a separate decision and implementation task. Richer prepared explanations do not automatically authorise unrestricted AI answers from the internet.

## D. Review and release the improved learning sections

### 19. Review language, understanding and reader experience

**Work:** check Arabic, English and German for natural language and matching meaning. Have beginners try the sample lessons and identify where they become confused. Check phone layout, Arabic reading direction, long German wording, keyboard use and accessible progress controls.

**Finished when:** a reader can explain the lesson's main idea in their own words and knows the next step. Check religious correctness and usability separately; success in one does not establish the other.

### 20. Publish in small reviewed releases

**Work:** publish reviewed content in manageable groups, confirm the correct version and approval are live, and collect specific feedback. Keep problem reporting functional and make corrections traceable.

**Finished when:** the published content matches the reviewed version in all languages and its navigation, sources, progress and next steps work on the live site.

## What we do next

**Repair sequence starts with task 1, then a small task-2 translation repair batch.** Do not restart bulk translation using the defective method.

Mo's current content priority is **Hard Questions**. Expansion to 21 articles and 63 language versions is implemented locally, with 189 answered follow-ups, the updated master manuscript and ordered review. All nine expansion briefs now point to completed local drafts. Follow-up and citation interactions passed for all nine additions; desktop and phone viewport checks covered Arabic direction and long German text. Remaining work is the specific research gaps recorded per article, independent scholarly/native-language acceptance, beginner feedback and separately authorised publication. Little's full thesis remains unassessed; only its repository abstract was accessible. Production answers and existing approval records were not replaced.

For **New to Islam**, the ordered editorial review of all 32 lessons is complete in all three languages, and the [master manuscript](Bayan-New-to-Islam-master.md) is refreshed from the local website content. Independent practical/source/language acceptance and prayer visuals/audio remain separate. The visual candidates have been researched, but no instructional asset set has been integrated. The repair queue above remains separate work.

The result we are aiming for: a newcomer feels welcomed, understands what they have read, sees how it fits into the bigger picture, and knows one sensible thing to learn next.

## Supporting files

- [Hard Questions master manuscript](Bayan-Hard-Questions-master.md)
- [Hard Questions ordered review and nine research briefs](Bayan-Hard-Questions-review.md)
- [Hard Questions document checks](Bayan-Hard-Questions-check.md)
- [New to Islam master manuscript](Bayan-New-to-Islam-master.md)
- [Ordered lesson review and changes](Bayan-New-to-Islam-deep-review.md)
- [Detailed status review](Bayan-status-review-2026-10-18.md)
- [Translation review candidates](Bayan-translation-review-list.csv)

Implementation reference points: `C:\Users\wiseflow\Bayan\data\steps.ts`, `components\StepsList.tsx`, `app\[lang]\start\page.tsx`, `data\topic-answers\`, and `data\prepared-answers\`.
