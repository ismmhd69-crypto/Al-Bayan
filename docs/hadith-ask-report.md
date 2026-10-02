# Report: Ask with stored hadith

Date: 2026-10-02. Plan: `docs/hadith-ask-plan.md`.

## Status
Built behind `HADITH_SOURCE=library`. Tests (388), `tsc` and `npm run build` pass. **The live before/after test with real answers could not be finished**: Google Gemini answered "busy" (503) and then "quota" (429) for every question, in both modes (HadeethEnc mode too), so no answer was produced. Instead I checked the stored-hadith search directly (no Gemini) and tested the whole pipeline with fake AI models. Please repeat the 12 questions when Gemini is available (steps below).

## What changed
- New setting `HADITH_SOURCE`: `library` (stored hadith), `hadeethenc` (old live path, untouched), anything else or unset = hadith off. Never both.
- `lib/sources/hadith-library.ts`: search (parallel database searches, one batched read, read-only) and a loader by id.
- `lib/sources/hadith-rules.ts`: mapping of a stored row to a hadith, continuation filter, search phrases, Sunnah.com attribution. The safety gate `hadithAllowed` keeps every old rule and now accepts `SH<uuid>` ids only with a matching `https://sunnah.com/<collection>:<number>` link.
- Answer checks (`answer-v2.ts`, `checks.ts`, `hydrate.ts`, `assemble.ts`, `core.ts`) understand the new ids. Saved chats reopen stored hadith from the library only.
- Page: stored hadith show "Hadith text: Sunnah.com", the card link says "Hadith on Sunnah.com", texts over 1,200 characters sit behind "Show full text" (the full text is never cut), AI translations (EN/DE) show with the AI label when they exist and `SHOW_AI_TRANSLATIONS=true`; otherwise Arabic only.
- No database writes. HadeethEnc code is not removed.

## Switch on and off
- On (Vercel): `HADITH_SOURCE` = `library`, then redeploy. Needs the existing `SUPABASE_SECRET_KEY`.
- Off / back to old: `HADITH_SOURCE` = `hadeethenc` (old behaviour) or delete it (no hadith), then redeploy.

## What the rules remove (read-only count)
- Continuation reports (same chain, "like it", under 40 characters, etc.): 1,309 of 14,629 rows.
- Longer than 2,500 characters (left out, never cut): 140 rows.
Examples of removed continuation rows: https://sunnah.com/muslim:2487b, muslim:1666b, muslim:3019c, muslim:2404c, muslim:1954e, bukhari:690b, bukhari:5864, muslim:850c, muslim:1142b, muslim:1503d. (Early version of the rule found 1,015; the "ends with like it" part added 294 more.)

## Stored-hadith search check (no Gemini, 12 topics, Arabic phrases)
All 12 topics returned 8 stored hadith in 0.2 to 1 s. Better matches seen: intentions (Bukhari 1, the "actions by intentions" hadith), riba (Muslim 1598, Bukhari 2085), honesty/lying (Muslim 2607c), fasting (Muslim 1157c, 1132a), patience (Bukhari 1302), cleanliness (Muslim 250), anger (Bukhari 4073 to 4076 are about a different matter, so weaker). Zakah, divorce and prayer returned mostly loosely related hadith; the later evidence step must reject those, and Ask then shows no hadith for that question.

How I got there (important for later): the shared database search returns at most 50 results for fatwas and hadith together. A first version returned no hadith for most topics because fatwas filled the 50 places, and the fatwa search cuts the Arabic "ال" prefix that hadith keep. The fix is several parallel searches plus a "topic word + chain word" search, then ranking by how many topic words appear in the chapter heading and text.

## Pipeline tests with fake AI
A stored hadith is cited, shown with the Sunnah.com link and attribution, and builds a valid answer. If the library lookup fails: no hadith and no fallback to HadeethEnc.

## Better / worse than HadeethEnc (honest)
- Better: no outside service in the live path, full original Sunnah.com text, exact numbers and links to the hadith page, no 10 second API calls, 14,629 hadith not a curated list.
- Worse: no condensed "matn only" text; every hadith starts with the chain of narrators, so the Arabic is longer and harder for the evidence step and visitors. The search is word matching on Arabic only and shares its results with fatwas, so it finds less precisely than HadeethEnc's topic titles. English and German translations do not exist yet for most hadith (Arabic only until the translation job finishes). Topic hints that pointed at HadeethEnc hadith (for example "intentions") are ignored in library mode.

## Known limits
1. Chain of narrators is shown with the text (no guessed split).
2. The continuation rule is wording based and can remove a rare real hadith; it never keeps a bad one on purpose.
3. Translations are incomplete.
4. Prepared answers still use their HadeethEnc hadith.
5. A proper fix for search quality needs a database search function that filters by kind (a database change, needs Mo's approval).

## To repeat the live check
`HADITH_SOURCE=library SHOW_AI_TRANSLATIONS=true npm run dev`, ask the 12 questions (prayer, zakah, fasting, intentions, honesty, parents, neighbours, anger, patience, riba, divorce, cleanliness) in English, German and Arabic; compare with `HADITH_SOURCE=hadeethenc`. Look at: hadith shown, number and link, attribution line, time.

## Follow-ups
1. Mo checks live answers, then retire HadeethEnc.
2. Hadith translations finish (Codex job).
3. Monthly refresh from Sunnah.com.
4. Optional database search function for hadith only (better results, needs approval).
