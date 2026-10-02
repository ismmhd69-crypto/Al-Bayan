# Report: tiered evidence for Ask

Date: 2026-10-02. Plan: `docs/tiered-ask-plan.md`. Raw data: `docs/tiered-ask-measure.json`.

## Status
Built behind `ASK_TIERED=true`. Off by default, so today's behaviour is unchanged until Mo switches it on. 489 tests pass (24 new in `tests/tiered-ask.test.ts`), and so do `tsc` and `npm run build`. No database writes. Nothing pushed.

## What changed
- The question step now also writes Arabic search phrases in Quran wording and in the Prophet's wording, besides the fatwa wording.
- Quran, hadith and fatwas are still searched at the same time. The order applies to choosing, writing and showing.
- One checker call judges three separate lists (Quran, hadith, fatwas), so a fatwa no longer pushes out a verse or hadith. Up to 2 verses, 2 hadith (Bukhari or Muslim only, same gate) and 3 fatwas.
- The short answer is written in order: Quran, then the Prophet, then the scholars. Code puts the sentences in that order before the final check.
- New rule in this mode: a ruling word (halal, haram, obligatory, forbidden, allowed, and the German and Arabic words) is only allowed in a sentence that cites a scholar's fatwa.
- Videos come last: up to 4, only if the answer was ready within 20 seconds.
- All old safety checks still run: every sentence sourced, writer and checker are different models, final screening, hadith and fatwa rules, refuse on doubt.

Found and fixed while testing: the hadith phrase from the model ("إنما الأعمال بالنيات وإنما لكل امرئ ما نوى") was 7 words and the filter allowed 6, so it was dropped and Bukhari 1 was not found. Hadith phrases may now have 8 words, and the first three words are also searched. After that fix, "Are actions judged by intentions" answered from Bukhari 1 and then Ibn Baz, in that order.

## Before and after (30 questions, each once in old and new mode)
Models: writer `gemini-3.5-flash-lite` then `nvidia:nvidia/nemotron-3-super-120b-a12b`; checker `gemini-3.1-flash-lite` then `nvidia:openai/gpt-oss-20b`. `HADITH_SOURCE=library`, Quran production keys, all surahs. 28 questions should be answered, 2 must be refused.

| | Old | Tiered |
|---|---|---|
| Answered (of 28) | 15 | 14 |
| Refused or failed (of 28) | 13 | 14 |
| Must-refuse questions refused | 2 of 2 | 2 of 2 |
| Answers with a verse | 11 of 15 | 11 of 14 |
| Answers with a hadith | 1 of 15 | 2 of 14 |
| Answers with a fatwa | 11 of 15 | 12 of 14 |
| Answers with videos | 6 of 15 | 1 of 14 |
| Median time | 25.1 s | 24.8 s |
| 95th percentile time | 39.1 s | 44.5 s |
| Timeouts or errors | 0 | 1 |

Notes on the numbers:
- Each question ran once per mode. The free models vary a lot between runs (the same question can answer once and refuse the next time), so differences of one or two answers are noise.
- Answers are richer: 8 tiered answers show 2 verses plus at least one fatwa (old mode: 3) (for example zakah and parents in English, zakah in German shows 3 fatwas).
- Hadith are still rare in both modes. The stored hadith search finds the right hadith only for some topics (intentions yes; prayer, zakah, riba mostly not). The writer also often skipped a source type in the package ("tier_missing_kept" in 7 answers): the safe answer is kept, but the hadith or fatwa it skipped is not shown.
- Videos dropped from 6 to 1 because most answers took longer than the 20 second budget on these free models. With a faster paid model, more answers would finish in time. Mo can raise `ASK_VIDEO_BUDGET_MS` to get videos back at the cost of time.
- The new ruling rule cost 2 answers (lying in English, interest in German): the writer drew a ruling from a verse and refused to fix it. This is the intended safety behaviour.
- Same refusals in both modes for: suffering, forced conversion, mercy and hell (no direct source), music (known open scholar difference), backbiting (writer gave up). "ما حكم بر الوالدين؟" was treated as a personal question in both modes; that is an older frame issue, not caused by this change.

## How to turn it on (Vercel)
Add `ASK_TIERED` = `true`, then redeploy. Optional: `ASK_VIDEO_BUDGET_MS` = `20000` (higher means more videos but slower), `MAX_VIDEOS` = `4`.

## How to turn it off
Delete `ASK_TIERED` (or set it to `false`), then redeploy. Everything goes back to today's behaviour.

## Known limits
1. Weak free models: about half the answerable questions are still refused in both modes, mostly because the writer gives up or the checker finds no direct source. A paid model is the biggest lever.
2. Time: median about 25 s, worst about 45 s. Videos rarely make the 20 s budget.
3. Hadith search quality limits Tier 2 (see `docs/hadith-ask-report.md`, follow-up 5).
4. The writer sometimes leaves out a source type even after one correction.
5. The ruling rule is strict: a verse that itself says "forbidden" still needs a scholar quote for a ruling sentence.
