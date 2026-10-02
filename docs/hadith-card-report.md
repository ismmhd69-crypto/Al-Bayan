# Report: the new hadith card in Ask

Date: 2026-10-02. Plan: `docs/hadith-card-plan.md`. Samples for checking by eye: `docs/hadith-split-samples.md`.

## Result in short
- Stored Sunnah.com hadith now show as Mo chose (mockup section 2): collection, number with grade and attribution, the chapter heading (باب ...), a gold box with the quoted words, the chain of narrators folded one tap away, the AI label, the Sunnah.com link, and the "Hadith text: Sunnah.com" credit under the answer.
- **5,814 of 14,629 hadith (39.7%)** get the box now: **3,686** labelled "The Prophet ﷺ said" and **2,128** with the neutral label "The text of the hadith". The other **8,815** keep today's full-text card, now with the chapter heading on top.
- Every hadith with a stored chapter heading shows it (all 14,629 have one).
- Switch off: `HADITH_SPLIT=off` (then every card is the full-text card as before, chapter heading still shown).
- Tests 465/465, `npx tsc --noEmit` clean, `npm run build` passed. Nothing written to the database. Nothing pushed.

## How the split works (Phase 1, rule based, no AI)
`lib/sources/hadith-split.ts`, pure function `splitHadith(text)`:
- Sunnah.com marks spoken words with U+200F `"` U+200F. A hadith is split only when it has exactly one such pair, no other `"`, words and chain both contain Arabic letters, it is not a continuation report, and the quote is not an addition to or the meaning of another report (وزاد، بمعنى حديث، بمثله ...).
- The pieces `chain + quote mark + words + quote mark + tail` must rebuild the stored text character for character. Checked in the function, again on the page, and in tests. If anything fails, the card shows the full text.
- "The Prophet ﷺ said" only when the words right before the quote clearly make him the speaker: `عن / سمعت / أن / فإن / كان / يبلغ به` + النبي / رسول الله / نبي الله / أبو القاسم (+ ﷺ) + قال / يقول, or قال / فقال / وقال + (لي / لنا / له / لها) + the name, or "عن النبي ﷺ" straight before the quote. Everything else gets the neutral label. "سأل النبي ﷺ فقال" (someone asked him and said) is always neutral.
- Text after the closing quote: its punctuation stays with the words; any further narration (1,620 hadith, e.g. "فَأَعْطَاهُ إِيَّاهُ", "قَالَ أَبُو عَبْدِ اللَّهِ ...") is shown under the box in a quieter style, never inside it.
- Display only. Search, the AI evidence selection, the claim checks, screening and quote checks all still get the full stored text (tested: the AI steps never see the split or the chapter heading).

| Not split, reason | Count |
|---|---:|
| No quote at all (stories, descriptions) | 5,886 |
| Several quotes (dialogues) | 2,517 |
| Continuation report ("like it", "same chain") | 250 |
| Quote is an addition to another report | 100 |
| Stray quote marks (often texts cut off in the source) | 62 |

Checked: 0 "Prophet" labels where another narrator ("عن فلان قال") comes after the last mention of the Prophet. 40 random splits are listed in the samples file.

## Quran markup in the stored text (Mo's bug report)
956 hadith (and 4 English + 4 German stored translations) contain Sunnah.com code such as `[quran sura="6" aya_start="82" aya_end="82"]{‏ ... ‏}`. New `lib/sources/hadith-markup.ts` tidies it **for display only**: the tag is removed, the verse stays in its braces, and the reference follows it, e.g. `{‏ الَّذِينَ آمَنُوا ... ‏} (6:82)`, ranges as `(2:1-5)`. Used by the hadith card (full text, chain, words, tail, translations) and by the older evidence list in `AskChat.tsx`. The stored text and every check stay on the original. The split ignores quote marks inside these tags and never lets a quote mark cut a tag with its verse. Tested with Muslim 124a, Bukhari 6215, 5266, 4832 and 5. Note: Muslim 124a and Bukhari 4832 are **cut off in the source** (the quote never closes; 124a ends with "‏{‏"), so they stay full-text cards; worth a check against sunnah.com.

## Card order, as built
1. Collection (Sahih al-Bukhari / Sahih Muslim)
2. Number · grade and attribution in Arabic
3. Chapter heading (Arabic, right to left)
4. Gold box: label, Arabic words (Phase 2: plus the short words translation)
5. Narration after the quote, quieter (only when it exists)
6. AI label + full translation (Phase 1; in Phase 2 the full translation moves into the fold)
7. "Show chain of narrators (isnad)" fold with the Arabic chain
8. "Hadith on Sunnah.com" link; credit line in the answer footer

Labels added in `dictionaries/en|de|ar.ts`: "The Prophet ﷺ said" / "Der Prophet ﷺ sagte" / "قال النبي ﷺ"; "The text of the hadith" / "Text des Hadith" / "نص الحديث"; "Show chain of narrators (isnad)" / "Überliefererkette (Isnad) anzeigen" / "عرض سند الحديث"; a screen-reader "Chapter" label.

Data path: `Hadith.chapter` (from `sources.title`) → evidence item → AnswerV2 `hadith[].chapter` (optional, validated, only for stored hadith) → page. The split (`display_split`) and the Phase 2 `words_translation` are added after validation by `attachHadithDisplay` in `lib/ask/display-translations.ts`, so they are never saved or checked as answer content. Saved chats drop the chapter, split and words translation, and reopening adds them back from the library; old saved answers without a chapter still open (tested).

## Phase 2: prepared, NOT applied
- Migration file `supabase/migrations/20261002120000_hadith_words_translations.sql`: table `public.hadith_words_translations` (source_id, lang en/de, text, origin 'ai' only, translator, published default false, one row per hadith and language), only hadith rows allowed, history trigger, row level security on and closed to visitors (same as source_translations).
- `scripts/export-hadith-words.ts` (read-only): 117 batches of 50, Prophet first, Arabic words only. Tried into a scratch folder: 5,814 items.
- `scripts/import-hadith-words.ts`: dry run by default; `--apply` inserts only new rows, never updates, never publishes. Checks every item (`lib/sources/hadith-words-check.ts`, tested).
- Display: words translation inside the box when it exists (same `SHOW_AI_TRANSLATIONS` rule), otherwise the Phase 1 layout. If the table does not exist yet, nothing breaks (tested).
- Mo's steps and the ready prompt: `docs/hadith-words-translation-job.md`.
- **Warning:** `apply-migrations.ps1` applies every waiting migration. `20261002100000_remove_othman_al_khamis.sql` (deletes al-Khamis' fatwas and videos) is also still waiting. See step 1 of the job file.

## Phase 3: decision
- **Dialogues:** a rule "the last quote is the Prophet's when his name comes right before it" would add 468 hadith (3.2%). The label itself would mostly be right, but the box would show his answer while the question sits folded away. Real examples: "إِلاَّ الإِذْخِرَ" (Bukhari 112), "جُنَّتَانِ" (1444), "أَفْلَحَ إِنْ صَدَقَ" (1891), "لاَ، حُلُّوهُ" (1150). 215 of the 468 are this short. Highlighting them alone could mislead. **Not built**; they stay full-text cards.
- **No quote (5,886):** nothing marks where spoken words start or end, so any split would be a guess. **Not built.**
- Measured by `scripts/hadith-split-stats.ts` (read-only).

## Mark files and `tail_start`
A parallel job (`data/hadith-split/marks-*.json`, `scripts/validate-hadith-marks.ts`) marks the chain/words boundary with AI help. This job's rule was "no AI model decides splits", so the marks are **not used by Ask**. For Mo's `tail_start` request: the card already shows any narration after the words in a quieter style outside the box, and `tailStartIndex()` in `hadith-split.ts` checks a `tail_start` value (Arabic letters, exactly once in the text, starts at a word boundary, after the highlighted words) with tests. Wiring the marks in is a separate decision for Mo.

## Local check
- **Live Ask:** not possible today. With `HADITH_SOURCE=library SHOW_AI_TRANSLATIONS=true` all 6 questions (intentions and lying in English, riba and parents in German, neighbours and anger in Arabic) returned "busy": Google Gemini answered 429 (quota) on every call. Please repeat when the quota is back.
- **Instead, the real path without the AI:** real library search, real mapping, real display step (split, chapter, AI translations from the database) and the real card component rendered to HTML in all three languages, screenshots at 360 px width:

| Topic | Top hadith | What the card shows |
|---|---|---|
| Intentions | Bukhari 1 | Chapter "باب كَيْفَ كَانَ بَدْءُ الْوَحْىِ ...", box "The Prophet ﷺ said" with "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ ...", AI label and full English/German translation under the box, chain folded, link |
| Lying | Bukhari 5835 | Chapter on silk, box "The Prophet ﷺ said", narration after the quote in quieter text, no translation yet (Arabic only), chain folded. The search picked a weak match (about silk, mentions "ما كذب"); a search issue, not a card issue |
| Riba | Muslim 1598 | Chapter heading, full-text card (no single quote), link |
| Parents | Bukhari 5975 | Chapter heading, box "The Prophet ﷺ said", chain folded, no translation yet |
| Neighbours | Bukhari 6980 | Chapter heading, full-text card |
| Anger | Bukhari 6116 | Chapter "باب الْحَذَرِ مِنَ الْغَضَبِ", full-text card (dialogue: "أوصني" / "لا تغضب") |

- Phone and right to left: the card fits 360 px with no sideways scrolling in English, German and Arabic. All new CSS uses start/end properties, so in Arabic the gold edge sits on the right. Long words wrap (the card already has `overflow-wrap: anywhere`).

## Risks and limits
1. Sunnah.com sometimes puts a narrator's aside inside the quote (e.g. Bukhari 3186 "ـ قَالَ أَحَدُهُمَا ... ـ", Bukhari 5459 "وَقَالَ مَرَّةً"). That aside then shows inside the box. It is the source's own quote; the full text is still in the chain fold and on Sunnah.com.
2. Some real Prophet quotes get the neutral label (e.g. "فسأل رسول الله ﷺ فقال", Bukhari 2971). This is the safe direction.
3. In Phase 1 the translation is the full one (chain and words together), placed under the box.
4. The credit line stays "Hadith text: Sunnah.com" in all languages (unchanged, as before).
5. Search quality for library hadith is unchanged (see `docs/hadith-ask-report.md`).

## Follow-ups
1. Repeat the 6 live questions when Gemini has quota.
2. Mo: apply the migration (mind the al-Khamis file), then run the words translation job and import.
3. Check Muslim 124a and Bukhari 4832 against sunnah.com (text looks cut off).
4. Decide whether the AI-assisted mark files should ever feed the card.
5. Optional: translate the "Hadith text: Sunnah.com" credit.

## Files
New: `lib/sources/hadith-split.ts`, `hadith-markup.ts`, `hadith-words-check.ts`, `hadith-words-translations.ts`; `scripts/hadith-split-samples.ts`, `hadith-split-stats.ts`, `export-hadith-words.ts`, `import-hadith-words.ts`; `tests/hadith-split.test.ts`, `tests/fixtures/hadith-split-texts.json`; the migration; `docs/hadith-card-plan.md`, `hadith-card-report.md`, `hadith-split-samples.md`, `hadith-words-translation-job.md`.
Changed: `components/AnswerV2View.tsx`, `components/AskChat.tsx`, `app/globals.css`, `dictionaries/*`, `lib/ask/answer-v2.ts`, `assemble.ts`, `core.ts`, `display-translations.ts`, `lib/chat/answer-store.ts`, `hydrate.ts`, `lib/sources/hadith-library.ts`, `hadith-rules.ts`, `tests/hadith-library.test.ts`, `tests/pipeline.test.ts`, `.env.example`.
