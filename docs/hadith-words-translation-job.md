# Hadith words translation job (Phase 2)

Goal: a short English and German translation of **only the quoted words** of each split hadith, shown inside the highlighted box ("The Prophet ﷺ said" or "The text of the hadith"). Without it the box shows the Arabic words and the full translation sits below the box (Phase 1). With it, the full translation moves into the "Show chain of narrators" fold.

Scope: 5,814 hadith (3,686 "The Prophet ﷺ said", 2,128 neutral), 117 batches of 50 (Prophet first). Numbers from 2026-10-02.

## Mo's steps, in this order

1. **Check what else is waiting before you apply.** `supabase/apply-migrations.ps1` applies *every* migration not yet applied. On 2026-10-02 two were waiting:
   - `20261002100000_remove_othman_al_khamis.sql`: **deletes** al-Khamis' fatwas, videos, rights record and scholar row (your decision of 2026-10-02). If you are not ready for that, move this file out of `supabase/migrations/` before step 2.
   - `20261002120000_hadith_words_translations.sql`: the new table for this job (no data, closed to visitors).
2. **Apply:** in PowerShell in the Bayan folder: `.\supabase\apply-migrations.ps1`. It should print `applied: 20261002120000_hadith_words_translations`.
3. **Export:** `npx tsx scripts/export-hadith-words.ts` (read-only). Writes `data/hadith-words/batch-001.json` to `batch-117.json`.
4. **Translate:** paste the prompt below into a translation session (Codex or Claude), one or two batches at a time. Each batch result is saved as `data/hadith-words/batch-NNN-translated.json`.
5. **Import, dry run first:** `npx tsx scripts/import-hadith-words.ts --in=data/hadith-words/batch-001-translated.json --translator="<model name>"`. It only reads and prints what it would insert and any rejected items.
6. **Import for real:** the same command with `--apply`. It only inserts new rows, never changes or deletes one, and never publishes (`published=false`).
7. **Test:** `SHOW_AI_TRANSLATIONS=true` and `HADITH_SOURCE=library`, ask a question in English and in German that returns one of the translated hadith. The box should show the Arabic words with the short translation; the full translation is inside the chain fold; the AI label stays.

Nothing changes on the site until rows exist, and unpublished rows only show with `SHOW_AI_TRANSLATIONS=true`.

## Prompt for the translation session (paste as is)

> You translate short Arabic hadith wording into English and German for Al-Bayan, a Sunni Q&A site.
>
> Input: a JSON file `data/hadith-words/batch-NNN.json`, an array of items `{ id, url, speaker, words, words_shown }`. `words_shown` is the Arabic to translate. It is ONLY the quoted words (the Prophet's words when `speaker` is "prophet", otherwise quoted words of the hadith). The chain of narrators is not included and must not be added.
>
> Output: `data/hadith-words/batch-NNN-translated.json`, an array of `{ id, words, en, de }` in the same order. Copy `id` and `words` exactly from the input (the import checks `words` character for character). Do not output `words_shown`.
>
> Rules:
> 1. Translate only `words_shown`. Do not add the chain, the narrator, "The Prophet said", explanations, notes, brackets with your own words, or the hadith number.
> 2. Faithful and plain. Short sentences, simple everyday words, no archaic English ("thee", "verily") and no flowery German. Keep the meaning complete; do not shorten or summarise.
> 3. Same terms and honorifics as the existing fatwa and hadith translations on the site: Allah (not God), the Prophet ﷺ written as "the Prophet, peace be upon him" / "der Prophet, Friede sei auf ihm" only when the Arabic has صلى الله عليه وسلم inside the words; "the Messenger of Allah" / "der Gesandte Allahs"; Islamic terms kept with a short plain wording where needed (zakah / Zakat, salah / Gebet). Quran verses inside the words (shown in braces with a reference such as (6:82)) are translated in plain words and keep the reference.
> 4. Do not copy published translations (Sunnah.com, Darussalam, Muhsin Khan or any other). Write your own.
> 5. German with real umlauts and ß (für, Größe), never ae/oe/ue/ss replacements.
> 6. Names spelled the same in English and German, as in the English translations (Abu Hurayra, Aisha, Umar, Jibril).
> 7. No quotation marks around the whole translation, no Arabic letters, no HTML.
> 8. If an item is unclear, a fragment that cannot be understood alone, or you are not sure of the meaning, leave it out of the output and list its `id` with a short reason in `data/hadith-words/batch-NNN-skipped.txt`.
> 9. Do not touch the database or any other file.

## Checks the import does

Missing or unknown id, hadith no longer split the same way, `words` changed since export, empty or over-long text, Arabic letters or markup in the translation, quotes around the whole translation, German ae/oe/ue spellings. Rejected items are listed and not imported.
