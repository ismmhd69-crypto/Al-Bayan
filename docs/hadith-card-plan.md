# Plan: improved hadith card in Ask (mockup "section 2")

## Context
Stored Sunnah.com hadith (14,629 rows) show as one long Arabic block: chain of narrators first, the Prophet's words buried at the end. Mo chose the mockup's section 2: chapter heading, the Prophet's words highlighted first, chain folded one tap away. Grade, number, AI label, link and credit stay unchanged. The split must never alter or hide text and must fall back to today's full-text card whenever it is not certain. Display only: search, evidence selection, checks and quote verification keep the full text.

Facts checked (read-only SQL, 2026-10-02):
- `sources.title` (chapter heading, "باب ...") is filled for all 14,629 hadith.
- 6,166 have exactly one `U+200F " U+200F` pair; 225 of them also contain other straight quotes, so 5,941 are candidates.
- 1,634 of those continue the narration after the closing quote (e.g. Bukhari 5862 "فَأَعْطَاهُ إِيَّاهُ", 5887 "قَالَ أَبُو عَبْدِ اللَّهِ ..."). That tail is not the Prophet's words.
- AI prompts build hadith JSON from explicit fields (`sourceJson` in lib/ask/core.ts:312), so a new `chapter` field never reaches the models.

The task's own deliverables (plan doc in the repo, reports) are written as part of the work: this plan is copied to `docs/hadith-card-plan.md` first.

## Decisions taken (safest defaults)
1. **Split computed on the server in the display step**, not stored and not validated as answer content. `attachScholarTranslations` (lib/ask/display-translations.ts, already called by /api/ask, chat hydrate, answers and topic pages) gets a sibling `attachHadithDisplay` that adds `display_split` to each hadith item when `HADITH_SPLIT !== "off"`. The client card re-checks `chain+open+words+close+tail === arabic` and falls back to full text if not.
2. **Tail after the closing quote** (anything beyond whitespace, U+200F and punctuation) is shown below the highlighted box as normal Arabic text, never inside it. Punctuation-only tails are appended after the words inside the box.
3. **Speaker** is `prophet` only when the 60 characters (diacritics removed) right before the opening quote match a Prophet lead-in (النبي / رسول الله / أبو القاسم, optional ﷺ / صلى الله عليه وسلم, then قال / يقول / فقال, or قال/يقول followed by one of those names) AND the last قال/يقول before the quote has no other named subject between the Prophet mention and it (e.g. "عن النبي ... عن أنس قال" → other). Otherwise `other`, labelled neutrally ("The text of the hadith").
4. **Chapter heading** goes on the Hadith type (`chapter: string | null`, from `title`, null for HadeethEnc), evidence item, AnswerV2 `HadithItem.chapter?` (optional, validated with `nullableSourceText` max 1,000, unknown-field check extended). Old saved answers have no chapter and still render.
5. **Saved chats**: `stripAnswer` blanks `chapter` and deletes `display_split` (both are Sunnah.com text); `hydrateAnswer` refills `chapter` from the library; the display step recomputes the split.
6. **Phase 1 translation**: full existing AI translation shown below the box with the AI label (cannot be split yet). The chain fold then has no translation in Phase 1.
7. **Phase 3**: evaluate by script only; implement nothing unless a rule shows zero wrong "Prophet" labels on a hand-checked sample. Default expectation: leave dialogues and no-quote hadith as full-text cards.

## Phase 1: code
- **New `lib/sources/hadith-split.ts`** (pure, browser-safe):
  `splitHadith(arabic): { chain, open, words, close, tail, speaker } | null`.
  Null when: not exactly two `"` in the whole text, or they are not both in the `U+200F"U+200F` form; empty/whitespace words; chain with no Arabic letters; `isContinuationHadith(arabic)`; reassembly check fails. No other trimming or normalising of returned strings. Also export `hadithSplitEnabled()` reading `HADITH_SPLIT`.
- **lib/sources/hadith-rules.ts**: `chapter` on `Hadith`; `mapStoredHadith` takes `row.title` (`StoredHadithRow.title`), `parseHadith` sets null.
- **lib/sources/hadith-library.ts**: add `title` to `COLUMNS`; ranking may keep using reference (no behaviour change).
- **lib/ask/core.ts** `toEvidence`: pass `chapter`. **lib/ask/assemble.ts**: copy to `HadithItem`. **lib/ask/answer-v2.ts**: `chapter?` and `display_split?` types; validator accepts optional `chapter` only (`display_split` is added after validation, so validator rejects it, which keeps it out of stored/prepared answers).
- **lib/chat/answer-store.ts**, **lib/chat/hydrate.ts**: as decision 5.
- **lib/ask/display-translations.ts**: `attachHadithDisplay` (split + kill switch) called inside `attachScholarTranslations`.
- **components/AnswerV2View.tsx `HadithCard`**, order: h4 collection, meta line, chapter (`p.hadith-chapter`, lang ar, dir rtl), then either
  - split: `div.hadith-words` (label `t.hadith.prophetSaid` or `t.hadith.textLabel`, Arabic words, full translation for en/de), tail paragraph if any, `details.hadith-isnad` (summary `t.hadith.showChain`, Arabic chain), AI label, link;
  - or today's card (AI label, full text with "Show full text" fold over 1,200 chars, translation, link).
  Anchor id/tabIndex unchanged so citations still jump to the card.
- **app/globals.css**: `.hadith-chapter`, `.hadith-words` (gold-soft background, `border-inline-start: 3px solid var(--gold)`, so RTL flips automatically), `.hadith-words-label`, `.hadith-isnad` (reuse `.answer-fold` look, `--accent` summary, smaller muted Arabic). Logical properties only, no fixed widths, `overflow-wrap:anywhere` already on the card.
- **dictionaries/en|de|ar.ts** `hadith`: `prophetSaid` ("The Prophet ﷺ said" / "Der Prophet ﷺ sagte" / "قال النبي ﷺ"), `textLabel` ("The text of the hadith" / "Text des Hadith" / "نص الحديث"), `showChain` ("Show chain of narrators (isnad)" / "Überliefererkette (Isnad) anzeigen" / "عرض سند الحديث").
- **.env.example**: `HADITH_SPLIT` (default on, `off` disables).
- **Tests** `tests/hadith-split.test.ts` with real texts fetched read-only: Bukhari 13, 6637 (أبو القاسم), 3119, Muslim 1829d (several chains + ح), Muslim 303c (Companion story → other or null), a no-quote narration, a dialogue (several quotes → null), a text with stray quotes, a text with narrative tail, synthetic odd U+200F placement; property test over all fixtures: pieces rejoin to the original. Extend `tests/hadith-library.test.ts` (chapter mapping, validator accepts/rejects, strip/hydrate, kill switch, old saved answer without chapter) and `tests/pipeline.test.ts` (selector/checks still receive full text). Then `npm test`, `npx tsc --noEmit`, `npm run build`. Read `node_modules/next/dist/docs/` guides for client components/env before touching the component.

## Phase 2: prepared, not applied
- **Migration file** `supabase/migrations/20261002120000_hadith_words_translations.sql`: table `public.hadith_words_translations` (id, source_id → sources on delete cascade, lang en|de, text, origin 'ai' check, translator, published default false, created_at, unique (source_id, lang)); RLS on, no visitor policies, `revoke all from anon, authenticated` (same as source_translations after publication gates); history trigger like `source_translations_history`. Not applied.
- **`scripts/export-hadith-words.ts`** (read-only): all hadith with a certain split, writes `docs/hadith-words-batches/batch-NNN.json` (50 each: id, url, speaker, words Arabic only), prophet first then other.
- **`scripts/import-hadith-words.ts`**: reads reviewed batch outputs, checks id exists, split still matches, text non-empty and umlauts real for de; inserts with `on conflict do nothing`, `published=false`, never updates. Dry-run by default, `--apply` needed. Mo runs it after the migration.
- **Display**: `lib/sources/hadith-words-translations.ts` lookup (same `SHOW_AI_TRANSLATIONS` rule, silent fallback if the table does not exist). Card shows words translation inside the box and the full translation inside the chain fold; without it, Phase 1 behaviour.
- **`docs/hadith-words-translation-job.md`**: paste-ready prompt (translate only the words; same terms and honorifics as the fatwa/hadith translations; plain wording; no copied published translations; real umlauts; names spelled as in English) and Mo's order: apply migration, run export, run translation job, import dry run, import `--apply`, test with SHOW_AI_TRANSLATIONS=true.

## Phase 3: decide and document
`scripts/hadith-split-stats.ts` (read-only) counts candidate rules: (a) dialogue where the final quote follows "فقال رسول الله / النبي"; (b) last-quote-after-last-قال. Hand-check 30 of each. Record share added and wrong-label cases in the report. Implement only if zero wrong labels and tests cover it; otherwise documented as not done.

## Review file and report
- `scripts/hadith-split-samples.ts` (read-only) writes `docs/hadith-split-samples.md`: distribution over 14,629 (split prophet / split other / unsplit by reason: no quote, several quotes, stray quote, continuation, empty), 40 random splits (url, first 60 chars of chain, words, speaker), and the list of `prophet` splits whose lead-in has "عن <name> قال" with no Prophet mention in between (expected empty; any hit is fixed in the rule).
- `docs/hadith-card-report.md`; update `Memory Al Bayan.md`.

## Verification
- Tests, tsc, build pass.
- Local: `HADITH_SOURCE=library SHOW_AI_TRANSLATIONS=true npm run dev`, ask intentions, lying, riba, parents, neighbours, anger across en/de/ar; describe each card. If Gemini is busy (as on 2026-10-02), say so and rely on a render test of the card plus a static check of the CSS at 360px and RTL.
- `HADITH_SPLIT=off` gives today's card.

## Commit
Stage only files from this job (not the many unrelated untracked files), commit locally, never push.

## Hard stops
Any DB write, any text change or hiding, a safety rule weakened, failing tests, or an unclear rule: stop and report.

## Added during the work (Mo, 2026-10-02)
- Quran markup (`[quran sura=".." ...]{...}`) in 956 hadith: display-only cleaner `lib/sources/hadith-markup.ts` (tag removed, verse kept in braces, reference like (6:82) added), used by the hadith card and the evidence list. Stored text and checks unchanged; the split ignores quote marks inside tags.
- `tail_start` from the marking job's files: checked by `tailStartIndex()`; narration after the words is shown in a quieter style outside the box. The AI-assisted marks are not wired into Ask by this job.
- Lead-in names extended after reading the data: نبي الله, أبا القاسم, وقال, فإن, يبلغ به, "عن النبي ﷺ" right before the quote.
