# Hadith dataset report

Date: 2026-10-02

The full-body Sunnah.com API dataset was accepted by Mo after reviewing the wording differences with HadeethEnc. HadeethEnc edits and condenses its Arabic, so exact equality is not the correct cross-source test.

## Decision

The Sunnah.com official API was used after written permission from Sunnah.com support on 2026-10-02. That permission allows using the API key to make our own cache or database, with a monthly refresh recommendation. The API provides the complete Arabic body, including the chain, and that text is stored unchanged. The API key is not stored in the app, database, raw files, or reports.

## Candidate review required by the original plan

- Jaguar16/open-hadith-data is the only reviewed candidate with explicit `matn_ar` and `isnad_ar` fields. Its current release reports 7,252 Bukhari records and 3,087 Muslim records, so it is not complete for this goal. Its CC0 and public-domain wording is clear, but its README also says the data was extracted from Sunnah.com and gives no guarantee of completeness or correctness.
- mhashim6/Open-Hadith-Data uses ODbL for the database and DbCL for contents, and documents hadith-islamware as the upstream Arabic source. The downloaded files contain 7,009 Bukhari rows and 5,363 Muslim rows, but each record is one full Arabic hadith field with commentary in the expanded file, not a separately verified matn field. It does not meet the requested storage rule.
- fawazahmed0/hadith-api places its software in the public domain, but the Arabic editions expose full `text` records and the software license does not establish rights or provenance for the Arabic data. It was not selected.
- The Sunnah.com API has written permission for a cache or database. Its response has one full body and no separate matn field. Mo accepted the full-body format because it preserves the official Arabic text unchanged.

The original matn-only comparison found no complete alternate source. The final choice is the official Sunnah.com API because it has written permission, complete available collection structure, official numbering and links, and preserves the source body unchanged.

## Dataset and exact-text findings

- API: `https://api.sunnah.com/v1`.
- Bukhari: 97 books. 7,265 API records were returned; 7,263 rows were stored after two exact duplicate texts were skipped.
- Muslim: 57 books. 7,368 main-collection API records were returned; 7,366 rows were stored after two exact duplicate texts were skipped. The Muslim introduction was not stored.
- Total stored: 14,629 Arabic hadith rows and 14,629 approved search documents.
- The API provides one full Arabic `body` and no separate matn field. The full body was kept exactly, with only HTML tags removed and whitespace normalised. Mo accepted this full-body format.
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
- The required HadeethEnc check matched collection and number for all 60 records. Unique-word overlap averaged 90.3%, with a 95.9% median. Fifty-two of 60 had at least 80% overlap. Exact equality was not used because HadeethEnc edits and condenses Arabic wording.
- Fatwa rows were not written by this job. Current fatwa count is 3,787. Total source-search documents are 18,416, of which 14,629 belong to these hadith rows.

## Follow-up

1. Keep the monthly refresh within the written Sunnah.com permission and API cap.
2. Resolve the API gaps if Sunnah.com supplies the missing records.
3. Add excerpt and continuation-hadith display rules, then switch Ask to this stored library.
