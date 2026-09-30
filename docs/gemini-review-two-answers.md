# Task for Gemini: review two new prepared answers (self-review)

Written 2026-09-30 by Claude for a Gemini coding agent working in `C:\Users\wiseflow\Bayan`.
Owner: Mo (not a programmer; plain English, short replies, no em dashes).

## 1. Read first
1. `CLAUDE.md` (project rules, non-negotiable)
2. `Memory Al Bayan.md` (STATUS SNAPSHOT)
3. `docs/answer-structure-design.md` (the new answer limits Codex is building)

## 2. What was done
Claude wrote two prepared answers so that steps 4 and 5 of the New to Islam page can say "Read":
- `data/prepared-answers/prophet-muhammad.json` (Who was the Prophet Muhammad ﷺ?)
- `data/prepared-answers/five-pillars.json` (The five pillars of Islam)

Both are in Arabic, English and German, status `draft`. Commit c0a4bf8. Mo approves on the Review page, not you.

## 3. Your job: review them yourself, like a strict scholar-reviewer
For each answer, in all three languages, check every sentence:
1. **Support:** does the cited source really say what the sentence says? Read the verse/hadith text live (Quran Foundation, HadeethEnc) and the Ibn Baz quote in the JSON. Flag any claim that goes further than its source.
2. **Wording:** sentences were rephrased on purpose to avoid copying (Codex's checker rejects 6-word runs in translations and 4-word runs in Arabic). Check the rephrasing did not change the meaning. Watch Arabic, German and English separately; the three must say the same thing.
3. **Respect:** ﷺ after the Prophet's name, "Allah" not "God" in our own sentences, no wording a newcomer could misread.
4. **Gaps:** is anything important missing for a newcomer, within the limits (max 2 explanation sections, 3 Quran cards, 2 hadith, 2 scholar quotes, one-sentence limit note)? Suggest additions only if they fit.
5. **Quotes:** run `npx tsx scripts/verify-quotes.ts prepared-answers` (both Ibn Baz quotes must say `ok`).
6. **Loads:** run a small script with `npx tsx --conditions=react-server --env-file=.env --env-file=.env.local` that calls `loadPrepared(PREPARED_ANSWERS[id], lang, { allowDraft: true, onFailure })` for both ids and all 3 languages. All six must load.

## 4. Rules
- Fix problems directly in the two JSON files. Do not add sources beyond the caps. Never type a scholar quote by hand: copy from the official page or use `excerpt()` in `lib/sources/scholar-excerpt.ts`.
- Do not touch `lib/prepared.ts`, `lib/prepared-v2.ts`, `lib/ask/*` or any page or component (Codex is editing them).
- Never open or print `.env` or `.env.local`.
- All tests must pass: `npm test`. (`npm run typecheck` may show errors in `scripts/eval-ask.ts`; that is Codex's unfinished work, not yours.)
- Ask Mo before commits, pushes and database changes. Do not approve the answers.

## 5. Report back (short, plain English)
- Per answer: "no problems" or a list of what you changed and why.
- Anything you were unsure about, for Mo to decide.
