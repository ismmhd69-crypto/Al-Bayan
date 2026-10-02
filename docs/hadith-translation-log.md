# Hadith translation log

Translator: Codex
Origin: ai
Published: false

## Needs Mo

None.

## Batch history

| Batch | Collection and range | Hadith items | Rows inserted | Skipped | Running total with both languages |
|---|---|---:|---:|---|---:|
| 1 | Sahih al-Bukhari 1 to 10 | 9 | 18 | 0 | 9 |
| 2 | Sahih al-Bukhari 11 to 20 | 9 | 18 | Hadith 7 deferred for a dedicated long-text pass; hadith 19 source row is missing from `public.sources` | 18 |
| 3 | Sahih al-Bukhari 21 to 30 | 10 | 20 | 0 | 28 |
| 4 | Sahih al-Bukhari 31 to 39 | 9 | 18 | 0 | 37 |

Batch 1 validation passed for the inserted rows. Both English and German texts are non-empty, contain no Arabic letters, stay within the required length ratio, and include German umlauts. The rows are unpublished and use `origin=ai`, `translator=codex`. Hadith 3 contains Quran references in the Arabic source; the translation retains the source reference markers and translates the quoted meaning. Hadith 7 was deferred within the first two batches because its source is about 7,000 characters and needs its own careful pass. Hadith 19 was not inserted because its exported source ID is no longer present in `public.sources`; no source row was changed.

Batch 2 inserted 18 rows for nine Bukhari hadiths. The database count increased from 7,464 to 7,482, exactly matching the 18 inserted rows.

Batch 3 inserted 20 rows for ten Bukhari hadiths. The database count increased from 7,482 to 7,502, exactly matching the 20 inserted rows.

Batch 4 inserted 18 rows for nine Bukhari hadiths. The database count increased from 7,502 to 7,520, exactly matching the 18 inserted rows.
