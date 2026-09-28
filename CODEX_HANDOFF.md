# Handoff for Codex: al-Fawzan, the Permanent Committee, and the next six scholars

Written 2026-09-28 by Claude for Codex working in `C:\Users\wiseflow\Bayan`.
Owner: Mo (not a programmer; plain English, short replies, no em dashes).

Three agents work in this folder at the same time. **Stay in your lane (section 4)** so nobody overwrites anyone.

## 1. Read first
1. `CLAUDE.md` (project rules, non-negotiable)
2. `Memory Al Bayan.md` (current state)
3. `BAYAN_PLAN.md` section 3b (approved scholars, Permanent Committee rule, quote rules)
4. `GEMINI_HANDOFF.md` sections 4 and 5 (the same quote rules and the existing pieces; Gemini follows them too)
5. This file

## 2. What Al-Bayan is
A free Islamic Q&A website (Sunni, Arabic/German/English). Answers are written automatically, but only from trusted sources: Quran verses, Sahih al-Bukhari/Muslim hadith, and short quotes from approved scholars. Every sentence points to a source. Correctness and honest refusal matter more than producing an answer.

The scholar quote library now has Ibn Baz (145) and Ibn Uthaymeen (67); Gemini is doing al-Albani and a bigger topic list. **Your job: add Shaykh Salih al-Fawzan and the Permanent Committee, then research the next six scholars' websites.**

## 3. Hard rules (same as for Gemini, do not break any)
- **Never store someone else's words under a scholar's name.** Only the scholar's own answer: never the question, a letter to him, a presenter, a student, or another scholar. When unsure, skip the item.
- **At most 600 characters per quote**, cut only at a sentence end, words unchanged. Reuse `excerpt()` and `searchText()` from `lib/sources/scholar-excerpt.ts`.
- **Link to the original page on the official site**, and store the printed source when the page gives one.
- **Never open, print or ask for** `.env`, `.env.local` or any key. Scripts read `.env` via `process.loadEnvFile(".env")` without printing values.
- **Ask Mo before**: commits, pushes, database changes (schema, new rows in `public.scholars` or `editorial.source_rights`), changes to `QUOTE_SITES`, and anything sent to other people. Inserting collected quotes with an approved collector is fine after Mo approves its dry run.
- **Be polite to the sites**: at least 1.5 s between requests, identify the collector in the User-Agent (copy it from `scripts/collect-binbaz.ts`), respect robots.txt, never bypass blocks or logins.
- All checks must pass: `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`.

## 4. Your lane (files)
**You may create and edit:**
- `lib/sources/parsers/fawzan.ts`, `lib/sources/parsers/alifta.ts` (new folder; import helpers from `scholar-excerpt.ts`, do not edit that file)
- `scripts/collect-fawzan.ts`, `scripts/collect-alifta.ts`
- `tests/parser-fawzan.test.ts`, `tests/parser-alifta.test.ts`
- `docs/scholar-sites-research.md`, `docs/codex-dry-runs.md`
- Task 5: `lib/sources/parsers/<scholar>.ts`, `scripts/collect-<scholar>.ts`, `tests/parser-<scholar>.test.ts`
- Task 6: `app/api/report/route.ts`, `components/ReportProblem.tsx`, `tests/report.test.ts`
- New migration files in `supabase/migrations/` **only as proposals** (write them, never apply them; Claude reviews and applies after Mo agrees)

**Do not edit:** `lib/sources/scholar-excerpt.ts` and `data/scholar-queries.ts` (Gemini is changing them), `scripts/collect-binbaz.ts`, `collect-uthaymeen.ts`, `collect-albani.ts` (Gemini), anything in `lib/ask/`, `lib/ai/`, `components/`, `dictionaries/`, `lib/sources/videos.ts`, `youtube-*.ts` (Claude). If you think one of these needs a change, write it down in your report instead.

Read `data/scholar-queries.ts` for the topic list (it will grow while you work; just import it).

## 5. What already exists
| Piece | File | Notes |
|---|---|---|
| Excerpt helpers | `lib/sources/scholar-excerpt.ts` | `htmlToText`, `looksLikeQuestion`, `excerpt`, `searchText`, `MAX_QUOTE_CHARS`; parsers for Ibn Baz, Ibn Uthaymeen, al-Albani show the pattern |
| Quote rules | `lib/sources/scholar-rules.ts` | `QUOTE_SITES` already allows `alfawzan.af.org.sa` and `alifta.gov.sa` for `al-fawzan`, and `alifta.gov.sa` for `ibn-baz` |
| Collector pattern | `scripts/collect-binbaz.ts` | **Copy this**: search, fetch page, parse, title check, `excerpt()`, skip existing URLs, `--dry-run`, `--limit`, pacing |
| Database | Supabase (Frankfurt) | `public.sources` + `public.source_search_documents`, see `GEMINI_HANDOFF.md` section 5. Database gates refuse wrong sites, missing rights and quotes over 600 characters |

**Rights record ids** (`editorial.source_rights`, "short quotes only, 600 characters, written permission pending"):
- alfawzan.af.org.sa: `1684073c-2300-44ce-bfc7-1546a298192a`
- alifta.gov.sa: `403b8808-7cb3-4148-8362-3a2856533239`

Scholar id for al-Fawzan: `al-fawzan` (site https://alfawzan.af.org.sa). Use `approved_by: "Automatic collection authorised by Mo (2026-09-28)"`.

## 6. Tasks, in order
Work through them without waiting for Mo, except at the points marked **STOP**. At each STOP give Mo one short report and wait for his yes.

### Task 1: al-Fawzan collector
Note: on 2026-09-28 alfawzan.af.org.sa did not respond from Claude's machine. Check first; if it still does not respond, report that and go to Task 2.
1. Find how the site lists and searches fatwas (question + the Shaykh's answer), and each fatwa's **stable public page URL**. Prefer written fatwas and structured collections (for example "المنتقى من فتاوى الفوزان", "نور على الدرب") over lesson transcripts.
2. `parseFawzanFatwa(html)` in `lib/sources/parsers/fawzan.ts` returning `{ title, answer, printedSource }` (the `ParsedFatwa` shape), answer = the Shaykh's words only, cut at any other speaker. Tests with made-up samples, including a question-only text that must be rejected and a text where a presenter speaks after the answer.
3. `scripts/collect-fawzan.ts` modelled on `collect-binbaz.ts` (title/page match, `excerpt()` null means skip, `looksLikeQuestion` guard, pacing, `--dry-run`, `--limit`), `scholar_id: "al-fawzan"`, the rights id above.
4. **STOP:** dry run with `--limit=8`, show Mo 5 samples (title, source, first 150 characters, link). Real run only after his yes; then count rows and spot-check 10 against the live pages.

### Task 2: Permanent Committee (alifta.gov.sa)
Mo's rule: a Permanent Committee fatwa may be used when an **approved scholar signed it** (for example Ibn Baz, al-Fawzan, al-Ghudayyan).
1. Research how alifta.gov.sa shows committee fatwas: the question, the answer, the fatwa number and volume/page in "فتاوى اللجنة الدائمة", and the list of signatories. Find stable page URLs.
2. `parseAliftaFatwa(html)` in `lib/sources/parsers/alifta.ts` returning `{ title, answer, printedSource, signatories: string[] }`. The answer is the committee's answer only; the signatory block and the question are not part of it. Tests.
3. **How to show it (needs Mo):** the committee's words are not one scholar's words, so they must not appear as "Ibn Baz said". Propose one of these to Mo in plain words and wait:
   - a) a new entry "The Permanent Committee" in `public.scholars` (a migration you write but do not apply), with the approved signatories listed in the reference, for example "فتاوى اللجنة الدائمة (5/ 123)، وقّع عليها: ابن باز، الغديان"; or
   - b) another design you think is clearer.
4. **STOP** after the proposal. Build `scripts/collect-alifta.ts` (only fatwas with at least one approved signatory; the approved names are in `public.scholars`) and its dry run after Mo decides. Claude applies any migration.

### Task 3: research the next six scholars (no collecting)
For each of: **Abdul-Muhsin al-Abbad** (al-abbaad.com), **Abdur-Razzaq al-Badr** (al-badr.net), **Salih Al al-Shaykh** (saleh.af.org.sa), **Abdur-Rahman al-Barrak** (sh-albarrak.com), **Abdullah al-Ghudayyan** (algodayan.com), **Salih al-Usaymi** (j-eman.net), write a short section in `docs/scholar-sites-research.md`:
- Does the site respond, and is it the scholar's official site (who runs it)?
- Written fatwas or answers? Roughly how many? Or only audio/lessons/books?
- Is the scholar's answer clearly separated from the question and other speakers?
- Stable page URLs? A search or list API (look at the site's own network calls)?
- robots.txt and terms of use: anything that forbids this?
- Contact page or email (for a permission letter later).
- Your verdict: easy / possible / not suitable, and why.
End with a recommended order. **STOP** and give Mo a five-line summary.

### BIG BATCH rules (added 2026-09-28 evening, Mo wants a long run)
- Mo **approved** the Permanent Committee design: separate entry `permanent-committee` (names ar "اللجنة الدائمة للبحوث العلمية والإفتاء", en "The Permanent Committee for Scholarly Research and Ifta", de "Der Ständige Ausschuss für wissenschaftliche Forschung und Fatwa", website https://alifta.gov.sa), approved signatories in the reference. Claude adds it to `QUOTE_SITES` and the page labels; you write the migration file and do not apply it.
- **Dry runs no longer stop your work.** Run each dry run, save its samples (title, source, first 150 characters, link, for 5 items) into `docs/codex-dry-runs.md`, then continue with the next task. Real runs happen later, after Mo or Claude approves the samples in one go.
- The only stops: anything sent to other people; applying anything to the database; a site that blocks you (skip it, note it, go on).
- Give Mo a short progress line after each task and **one** report at the end.

### Task 5: collectors for the two easiest of the six
Take the two scholars your Task 3 research rated easiest. For each:
1. A migration **proposal** file adding its rights record to `editorial.source_rights` (copy the exact wording and fields of the binbaz.org.sa record, change owner/edition/attribution; status `short_quotes_only`, 600 characters, search and AI allowed, translation not allowed). Do not apply.
2. Parser in `lib/sources/parsers/<scholar>.ts` + tests (question-only rejected, other speakers cut, title/topic match like the al-Albani rules in `GEMINI_HANDOFF.md`).
3. Collector `scripts/collect-<scholar>.ts` (same pattern and safety checks) and a dry run into `docs/codex-dry-runs.md`.
Also list in your report the exact `QUOTE_SITES` line each one needs (Claude adds it).

### Task 6: "Report a problem" (backend and a standalone component)
Visitors must be able to flag a wrong or unclear answer. Privacy first (plan section 10): **never store the visitor's question text, IP address or any identity.**
1. Migration **proposal**: table `editorial.answer_reports` (id, created_at, lang, reason in a fixed list: `wrong_source`, `misquoted`, `not_answering`, `unclear`, `offensive`, `other`; optional `source_ids text[]` of the cited sources, e.g. `Q2:255`, `HE66511`; optional `comment` at most 500 characters; `status` new/reviewed/fixed). RLS on, no visitor read access, inserts only through the server with the secret key.
2. API route `app/api/report/route.ts`: same protections as `app/api/ask/route.ts` (same-origin check, JSON only, small body limit, rate limit via `lib/ask/limits.ts` functions, read only), validates everything, stores with the secret key, logs nothing about the visitor. Read `node_modules/next/dist/docs/` for route handlers first (this Next.js version differs from what you know).
3. `components/ReportProblem.tsx`: a small "Report a problem" button that opens a short form (reason choice, optional comment, send, thank-you message), keyboard and screen-reader friendly, works right-to-left. Props: `{ lang, sourceIds, labels }` where `labels` is a plain object of texts; put suggested texts for ar/en/de in your report (Claude adds them to the dictionaries and places the button in the Ask answer).
4. Tests for the route's validation (reject unknown reasons, long comments, wrong origin, oversized bodies; never store extra fields).

### Task 4: notes (do this last, after Tasks 5 and 6)
Add a row to `HANDOFF.md` section 2 and a short line in `Memory Al Bayan.md`: what you did, counts, anything unverified. Keep the existing text. Do not commit; tell Mo which files are yours so Claude can commit them.

## 7. Report format to Mo
Plain English, short, no em dashes: what you did, numbers, what you could not do, what needs his decision.
