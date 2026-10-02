# Plan: Ask uses the stored hadith library

Date: 2026-10-02. Setting: `HADITH_SOURCE`.

## Goal
Ask reads hadith from our own library (`public.sources`, kind `hadith`, 14,629 Sahih al-Bukhari and Sahih Muslim rows) instead of the live HadeethEnc API. The old path stays selectable. Read-only on the database.

## Decisions
**(a) Search.** `lib/sources/hadith-library.ts`. Up to 4 parallel calls to `search_approved_source_candidates` (one per phrase, plus one "topic word + chain word" query, because fatwas share the 50-result pool and the fatwa search strips the "ال" prefix that hadith keep), then one batched read of `sources` (published, kind hadith, no scholar). Hadith sharing no topic word with the question are dropped; best match first; up to 8 results. Any error is thrown, the pipeline already turns that into "no hadith". No fallback to HadeethEnc.

**(b) Mapping.** `mapStoredHadith` in `hadith-rules.ts`. Collection comes from the `collection` column and must agree with the reference text and the Sunnah.com link. Number comes from the reference ("hadith 2916"); lettered numbers (1829d, 715 aa, 690b) use the plain number and the link keeps the exact letter. Attribution "رواه البخاري" or "رواه مسلم", grade "صحيح" (only if the row grade is sahih), Arabic = `text_original` unchanged, id = `SH` + uuid (cannot clash with `HE123` or the scholar ids). `getLibraryHadith(uuid)` re-loads one row for saved chats.

**(c) Setting.** `lib/sources/hadith-mode.ts`: `library` = stored hadith, `hadeethenc` = old live path, anything else = hadith off. Never both. The safety gate `hadithAllowed` now accepts HadeethEnc ids with HadeethEnc links, or `SH` ids with a matching `https://sunnah.com/<collection>:<number>` link. All old rules stay (Sahihayn only, sahih or hasan, a number, one collection for stored rows).

**(d) Attribution.** One line per answer, chosen from the ids shown: stored hadith show "Hadith text: Sunnah.com" linking to sunnah.com, HadeethEnc ones keep the old line, a mix is rejected by the validator. Each card links to its own hadith page ("Hadith on Sunnah.com").

**(e) Chain of narrators.** No guessing a chain/matn split. The search ranks on chapter heading plus text. The AI steps get the whole text. The visitor sees the whole text; longer than 1,200 characters it sits behind a "Show full text" fold. Nothing is ever cut.

**(f) Continuation hadith.** Removed from Ask when, without diacritics and punctuation: the text is under 40 characters; or under 220 characters with a "same chain" or "like it" phrase (بهذا الإسناد, بمثله, نحوه, ...) and no words of the Prophet; or under 700 characters and ending with such a phrase. Result on the library: 1,309 of 14,629 rows removed (examples in the report).

**(g) Long texts.** Hadith over 2,500 characters are left out of Ask (140 rows), never shortened. 95th percentile length is about 1,260.

**(h) Translations.** After the answer is checked, stored hadith get an English or German AI translation from `source_translations` (same `SHOW_AI_TRANSLATIONS` rule as fatwas, shown with the AI label). No translation: Arabic only. Never used for search or checks.

**(i) Rollback.** Set `HADITH_SOURCE=hadeethenc` (old behaviour) or remove it (hadith off).

**(j) Tests.** `tests/hadith-library.test.ts`: mapping (Bukhari, Muslim, lettered numbers, bad rows), gate, continuation filter, long text, setting, attribution, validator, reopening saved chats, translations (present and missing), lookup failure and one-search-one-read. Plus the full suite, `tsc` and `npm run build`.

## Known limits
- The topic hints in `data/topic-source-hints.ts` use HadeethEnc ids; they are ignored in library mode.
- The search function is shared with fatwas (50 results, hadith picked out afterwards).
- Prepared answers keep their HadeethEnc hadith.
