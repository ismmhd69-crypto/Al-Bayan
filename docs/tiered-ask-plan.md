# Plan: tiered evidence for Ask

Date: 2026-10-02. Report: `docs/tiered-ask-report.md`.

## Problem
All candidates (up to 8 verses, 3 hadith, 4 scholar quotes) went into one evidence check that keeps only "direct" items. Fatwas are written as answers, so they won and verses and hadith were dropped even when they were the real evidence (example: "Are actions judged by intentions" answered only from an Ibn Baz fatwa although Bukhari 1 was found). Videos were capped at 2.

## What Mo wants
Quran first, then hadith, then fatwas, then videos. Behind `ASK_TIERED=true`; unset or anything else keeps today's behaviour (same prompts, same caps).

## Design
1. **Question frame.** In tiered mode the frame also returns `search_queries_quran_ar` (Quranic wording) and `search_queries_hadith_ar` (the Prophet's wording, up to 8 words). `search_queries_ar` stays the fatwa wording.
2. **Search** stays parallel. Quran search gets the Quran phrases instead of fatwa titles. Hadith search gets the first three words of each hadith phrase, then the hadith phrases, then the fatwa phrases. Scholars and videos use the fatwa phrases as before. Candidate ranking also uses the tier phrases. Candidates per tier: 8 verses, 4 hadith, 5 quotes.
3. **Selection**: one AI call (verifier model) with three separate lists and three separate verdict lists. Each list is judged on its own: a verse or hadith is direct when its own words speak to the question, even if a fatwa answers more fully. Code turns the result into the existing shape, so the same strict parser, retry, context, conflict and scholar-difference rules apply. An id in the wrong list refuses. Package caps per tier: 2 verses (at most 2 cards), 2 hadith (Bukhari/Muslim gate unchanged), 3 fatwas. Caps are per kind, so a fatwa can never take a verse's place. An empty tier is simply skipped.
4. **Writing**: package order Quran, hadith, scholars. Extra writer rules: write in that order, one sentence per source type present, ruling words only in a sentence citing a scholar quote. Code reorders the short answer by tier (stable) before screening. Code refuses a ruling word in a sentence without a scholar citation (one correction, then the usual "no summary").
5. **Videos** last: only if the checked answer was ready within `ASK_VIDEO_BUDGET_MS` (default 20000), up to `MAX_VIDEOS` (default 4), still filtered by the separate title check.
6. **Display** order unchanged (answer, Quran, hadith, scholars, videos). The answer validator now allows 3 scholar quotes and 4 videos; the old mode still stops at 2 and 2.
7. **Safety** unchanged: every sentence sourced, writer and checker are different models, final screening, hadith and fatwa rules, fail closed.

## Decisions taken by default (safest option)
- Ruling words (halal, haram, obligatory, forbidden, allowed and the German and Arabic equivalents) need a scholar citation in tiered mode, even when a verse states it. This can cost some answers; it enforces "only scholars give rulings".
- If the answer leaves out a source type that is in the package, the writer gets one correction. If that does not help, the draft that already passed every check is kept (a missing tier is not a safety problem).
- A sentence citing two kinds ranks by the earlier kind. List items (steps, conditions) keep the source's order.
- A named passage (al-Fatiha) counts as one verse item so it can still be shown.
- The Quran Foundation search is not changed; if the model gives no Quran phrase, the fatwa phrases are used as before.

## Files
`lib/ask/tiered.ts` (new), `lib/ask/core.ts`, `lib/ask/retrieval.ts`, `lib/ask/package.ts`, `lib/ask/settings.ts`, `lib/ask/pipeline.ts`, `lib/ask/answer-v2.ts` (limits), `tests/tiered-ask.test.ts`, `scripts/measure-tiered-ask.ts`, `.env.example`.

## Tests and measurement
Unit and pipeline tests with a fake AI (one tier empty, all tiers full, caps, a fatwa never displacing a verse, wrong-tier id, order, ruling rule, video budget, old mode unchanged). Then the full suite, `tsc`, `npm run build`, and a 30-question old/new run with the free model mix (`scripts/measure-tiered-ask.ts`).
