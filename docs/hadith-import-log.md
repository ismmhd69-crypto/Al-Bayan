# Hadith import log

Date: 2026-10-01

## Batch 0: dataset decision

- Status: stopped before import.
- Inserted: 0 sources, 0 search documents.
- Skipped: all candidates, because none met both the rights and data-quality decision rule.
- Rights record: not created. The permission allowed one record only after a qualifying dataset was selected.
- Database: unchanged.
- Running total: Bukhari 0, Muslim 0.

See `docs/hadith-dataset-report.md` for the evidence.

## Step 1: official API read-only check, 2026-10-02

- API: `https://api.sunnah.com/v1`, using the private key from `.env`. The key was not printed or saved in any file.
- Book metadata: Bukhari 97 books, declared available total 7,277. Muslim 57 books, declared available total 7,459, including 91 introduction records.
- Saved raw responses: 244 requests for the initial fetch, then 122 individual fallback requests. Total request count: 366.
- Arabic records have a full `body` and no separate matn field. The import will keep the full Arabic body exactly after removing HTML tags and normalising whitespace.
- Longest cleaned Arabic body: 14,845 characters, Muslim hadith `2769 a, b`.
- Fetched records: Bukhari 7,265; Muslim main collection 7,368 after excluding the 91-record introduction.
- API gaps: Bukhari numbers `6940`, `7268`, `7269`, `7270`, `7271`, `7272`, `7278`, `7279`, `7284`, `7285`, `7317`, and `7318` were not returned. The API returned an internal error or no record for these numbers. They are not guessed or filled from another source.
- No database writes were made in Step 1.

## Step 2: exact rights record shown before insertion

```text
owner: sunnah.com
edition: Sunnah.com API, Sahih al-Bukhari and Sahih Muslim, Arabic text
allowed_use: stored Arabic hadith text shown unchanged with collection, number, grade and a link, search on our server, input to the AI evidence steps
cache_limit: local copy of the Arabic text only, refreshed at least monthly
translation_rights: No translation rights granted. Translation index is not allowed.
attribution: Hadith text: Sunnah.com
permission_evidence: Written reply from Sunnah.com support received 2026-10-02. The API is capped at 5 requests per second and 5,000 per day. The reply says: "if you are planning to use this data in a mobile or web app of your own, we recommend that you use this key to fetch data and make your own cache or database to serve your app". It also says not to bundle the key with the app and to refresh the data at least once a month.
removal_procedure: On request, stop the monthly refresh, unpublish every hadith with this rights record, delete its search documents and remove the local raw API cache.
status: granted
notes: Arabic text only. English API text is not stored. Permission decision by Mo, 2026-10-02.
max_quote_chars: 14845
search_index_allowed: true
ai_processing_allowed: true
translation_index_allowed: false
```
- Import completed: 14629 available hadith rows prepared; existing rows were reused by URL or exact text, and search documents were backfilled.

## Step 3: database import and verification, 2026-10-02

- Stored: Sahih al-Bukhari 7,263 and Sahih Muslim 7,366, total 14,629.
- Skipped: two exact duplicate Arabic bodies in each collection. Known API gaps remain listed above and were not guessed.
- Search documents: 14,629 approved Arabic documents linked to the imported rows.
- Every imported row passed the publication gate with the granted Sunnah.com rights record, `sahih` grade, grader, and Sunnah.com URL.
- Batch size: 500. The importer resumed safely after one document-duplicate interruption and backfilled the missing documents.
- Search verification: 20 Arabic queries, 12 with five results and 8 with no matching result, all without RPC errors.
- Saved-raw verification: 60 random database rows, 58 direct raw-response matches, 0 text mismatches. Two combined-number references need a specialised matcher.
- HadeethEnc comparison: not yet completed; it remains an explicit follow-up and is not claimed as complete.
- Current fatwa count after import: 3,787. This job did not write fatwa rows, translations, Ask code, or the live HadeethEnc path.

## Step 4: required HadeethEnc spot check, 2026-10-02

- Checked 60 randomly selected hadiths found in HadeethEnc with the same collection and number.
- Collection and number were correct for all 60.
- After the required Arabic normalization, 18 matched the stored body and 42 did not.
- This exceeds the hard-stop limit of two mismatches. The stored rows are full Sunnah.com bodies, not verified matn-only text. No further database writes were made after this check.
