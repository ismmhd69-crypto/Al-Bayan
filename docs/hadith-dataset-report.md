# Hadith dataset report

Date: 2026-10-02

HARD STOP: the current full-body Sunnah.com API import failed the required HadeethEnc text check. Of 60 same-number, same-collection records, 42 did not match after Arabic normalization. The attached goal allows at most two mismatches. The current rows therefore cannot be accepted as a verified matn-only dataset.

## Decision

The Sunnah.com official API was used after written permission from Sunnah.com support on 2026-10-02. That permission allows using the API key to make our own cache or database, with a monthly refresh recommendation. However, the API provides a full body and no separate matn field. The current import therefore does not meet the attached matn-only requirement. The API key is not stored in the app, database, raw files, or reports.

## Dataset and exact-text findings

- API: `https://api.sunnah.com/v1`.
- Bukhari: 97 books. 7,265 API records were returned; 7,263 rows were stored after two exact duplicate texts were skipped.
- Muslim: 57 books. 7,368 main-collection API records were returned; 7,366 rows were stored after two exact duplicate texts were skipped. The Muslim introduction was not stored.
- Total stored: 14,629 Arabic hadith rows and 14,629 approved search documents.
- The API provides one full Arabic `body` and no separate matn field. The full body was kept exactly, with only HTML tags removed and whitespace normalised.
- Longest stored Arabic text: 14,845 characters. The rights record uses that as its maximum quote length.
- API gaps were not guessed or filled from another source. The known Bukhari gaps are 6940, 7268, 7269, 7270, 7271, 7272, 7278, 7279, 7284, 7285, 7317, and 7318.

## Rights record

Rights record ID: `fd8cd4f5-5011-40a1-ae14-cb6e8fa165b7`

- Owner: sunnah.com
- Status: granted
- Search index allowed: yes
- AI processing allowed: yes
- Translation index allowed: no
- Refresh: at least monthly

## Verification

- All 14,629 hadith sources have `published=true`, grade `sahih`, the Sunnah.com rights ID, a Sunnah.com URL, and a grader.
- All 14,629 hadith rows have an approved Arabic search document.
- Twenty Arabic database searches ran successfully through the approved search function. Twelve returned five results; eight returned no match for those exact terms. No search call returned an error.
- The required HadeethEnc check matched collection and number for all 60 records, but only 18 had exact normalized Arabic agreement with the stored body. The 42 mismatches trigger the hard stop.
- Fatwa rows were not written by this job. Current fatwa count is 3,787. Total source-search documents are 18,416, of which 14,629 belong to these hadith rows.

## Follow-up

1. Keep the monthly refresh within the written Sunnah.com permission and API cap.
2. Resolve the API gaps if Sunnah.com supplies the missing records.
3. Do not release this import as the requested matn-only library. Obtain a verified matn-only source or a reviewed mapping for the mismatches.
