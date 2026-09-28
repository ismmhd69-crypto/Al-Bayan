# Handoff for Gemini: scholar quote library (Ibn Uthaymeen and al-Albani)

Written 2026-09-28 by Claude for a Gemini coding agent working in `C:\Users\wiseflow\Bayan`.
Owner: Mo (not a programmer; plain English, short replies, no em dashes).

## 1. Read first
1. `CLAUDE.md` (project rules, non-negotiable)
2. `Memory Al Bayan.md` (current state)
3. `BAYAN_PLAN.md` section 3b (approved scholars, quote rules)
4. This file

## 2. What Al-Bayan is (one paragraph)
A free Islamic question-and-answer website (Sunni, Arabic/German/English). Answers are written automatically, but only from trusted sources: Quran verses, Sahih al-Bukhari/Muslim hadith, and short quotes from approved scholars. Every sentence must point to a source. Correctness and honest refusal matter more than producing an answer.

## 3. Your job
Extend the **scholar quote library** from Ibn Baz (done) to **Ibn Uthaymeen** and **al-Albani**, using exactly the same rules and structure. Then draft permission letters.

## 4. Hard rules (do not break any)
- **Never store someone else's words under a scholar's name.** Only the scholar's own answer. Never the question, never a letter addressed to him, never a presenter or student speaking. When unsure, skip the item.
- **At most 600 characters per quote**, cut only at a sentence end, words unchanged (whitespace and footnote markers may be removed). Reuse `excerpt()` in `lib/sources/scholar-excerpt.ts`.
- **Link to the original page on the scholar's official site**, and store the printed source when the page gives one.
- **Never open, print or ask for** `.env`, `.env.local` or any key. Scripts may read `.env` via `process.loadEnvFile(".env")` without printing values.
- **Ask Mo before**: commits, pushes, database schema changes. (Inserting collected quotes with the collector is already approved by Mo.)
- **Do not change** the Ask pipeline (`lib/ask/core.ts`, `lib/ask/checks.ts`, `lib/ask/retrieval.ts`) or its prompts. It already supports scholar quotes. If you believe a change is needed, stop and explain it to Mo.
- **Be polite to the sites**: at least 1.5 s between requests, identify the collector in the User-Agent, never bypass blocks or logins.
- All tests must pass: `npm test`, `npm run typecheck`, `npm run build`.

## 5. What already exists (reuse, do not rebuild)
| Piece | File | Notes |
|---|---|---|
| Excerpt rules + Ibn Baz parser | `lib/sources/scholar-excerpt.ts` | `htmlToText`, `looksLikeQuestion`, `printedCollection` (Ibn Baz only), `parseBinBazFatwa`, `excerpt`, `searchText`. Tests: `tests/scholar-excerpt.test.ts` |
| Quote rules | `lib/sources/scholar-rules.ts` | `QUOTE_SITES` already allows `binothaimeen.net` for `ibn-uthaymeen` and `al-albany.com` for `al-albani`; `scholarQuoteAllowed`, `toSearchQuery`. Tests: `tests/scholar-rules.test.ts` |
| Ibn Baz collector | `scripts/collect-binbaz.ts` | **Copy this pattern.** Run with `npx tsx scripts/collect-binbaz.ts --dry-run --limit=5`. Uses `data/scholar-queries.ts` |
| Library reader for Ask | `lib/sources/scholars.ts` | Reads any published `kind='fatwa'` quote; nothing to change |
| Database | Supabase (Frankfurt) | Table `public.sources` (kind, scholar_id, title, reference, collection, language, text_original, url, rights_id, published) and `public.source_search_documents` (source_id, lang='ar', search_text ≤600, approved, approved_by, approved_at). Publication gates in the database refuse wrong sites, missing rights and quotes over 600 characters |

**Rights record ids** (`editorial.source_rights`, all "short quotes only, 600 characters, written permission pending"):
- binothaimeen.net: `7306bf6c-4898-4da9-8cd0-3473cb07a65c`
- al-albany.com: `b808230c-6e30-4986-ae07-9aefd1a7f622`
- (binbaz.org.sa: `fabd29fd-a03d-4421-a685-638383570001`)

Scholar ids: `ibn-uthaymeen` (site https://binothaimeen.net), `al-albani` (site https://al-albany.com; the site redirects to www.al-albany.com, which is fine). The stored `url` host must match the scholar's site or the database refuses it.

## 6. Tasks, in order (report to Mo after each)

### Task 1: check the Ibn Baz collection
A collection run was in progress at handoff (116+ quotes). Check it finished (count rows in `public.sources` where `scholar_id='ibn-baz'`). Open 15 random quotes and compare each with its live page: is it the Shaykh's answer (not the question), unchanged, and does the title match? Report any bad ones to Mo (do not delete without asking).

### Task 2: Ibn Uthaymeen collector
Research findings so far (verify them yourself):
- binothaimeen.net is a script-rendered site. Its data server: `https://shekhcp.binothaimeen.net`.
- Search: `POST https://shekhcp.binothaimeen.net/api/search-data` with JSON `{ pageSize, searchTerm, page, mode: "exact" | "similar" | "wide", type? }`. Without `type` it returns mixed items, mostly audio lesson transcripts (`type: "audios"`). Known `type` values: audios, visual_library, books, documents, applications, static_pages, menus, translated_books. No "fatwa" type was found.
- There is a fatwa listing endpoint used by the site: `GET {apiurl2}/api/fatwas-page/{category}?page=N` (apiurl2 = `https://shekhcp.binothaimeen.net`).
- Also `https://shekhapi.binothaimeen.net` (apiurl) exists.

Steps:
1. Find where individual fatwas (question + the Shaykh's answer) live, and their **stable public page URL on binothaimeen.net** (the link we show visitors). Prefer structured fatwa collections (for example "Nur 'ala al-Darb", "Liqa' al-Bab al-Maftuh", "Majmu' Fatawa wa Rasa'il") over lesson transcripts, because transcripts mix the Shaykh with students and readers.
2. Add a parser (e.g. `parseUthaymeenFatwa`) to `lib/sources/scholar-excerpt.ts` that returns `{ title, answer, printedSource }`, answer = the Shaykh's words only. Add tests with made-up samples to `tests/scholar-excerpt.test.ts`, including a case where the text is a question and must be rejected.
3. Write `scripts/collect-uthaymeen.ts` modelled on `collect-binbaz.ts` (same safety checks: title/page match, `excerpt()` returns null → skip, `looksLikeQuestion` guard, pacing, `--dry-run`, `--limit`). Use `scholar_id: "ibn-uthaymeen"`, the rights id above, `approved_by: "Automatic collection authorised by Mo (2026-09-28)"`.
4. Run `--dry-run --limit=5` and show Mo 5 sample quotes (title, source, first 150 characters) **before** the real run. Only run for real after Mo says yes.

### Task 3: al-Albani collector
- al-albany.com has a fatwa section (`/videos/fatawa`, audio content pages such as `/audios/content/{id}/{slug}`), many from recorded sessions (Silsilat al-Huda wa al-Nur). Transcripts may mix questioner and Shaykh: only take text clearly marked as the Shaykh's answer; skip the rest.
- Same steps as Task 2 (parser + tests, collector, dry run shown to Mo, then real run).
- If you cannot reliably separate the Shaykh's words, stop and tell Mo instead of guessing.

### Task 4: permission letters
Draft one short letter per site (binbaz.org.sa, binothaimeen.net, al-albany.com), Arabic first then English, asking permission to show short quotes (max 600 characters, unchanged, credited, linked to the original page) on a free non-commercial Islamic Q&A website, and saying honestly that an AI writes a short labelled explanation next to the quotes and never issues its own rulings. Do not send anything; give the drafts to Mo. Also find each site's contact page or email.

### Task 5: notes
Update `Memory Al Bayan.md` (short) and add a row to `HANDOFF.md` section 2 describing what you did, counts, and anything unverified. Keep the existing text.

## 7. How to verify
- `npm test` (112 tests passed at handoff), `npm run typecheck`, `npm run build`, `git diff --check`.
- For collectors: dry run output reviewed by Mo; after a real run, count rows and spot-check 10 against the live pages.
- Ask integration needs no code change: a local dev server with `ASK_ENABLED=true` in `.env.local` shows scholar quotes under "What the scholars said" when the evidence check accepts them.

## 8. Report format to Mo
Plain English, short, no em dashes: what you did, numbers, what you could not do, what needs his decision.
