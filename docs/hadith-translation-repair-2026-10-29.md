# English hadith translation repair, 2026-10-29

## Status

Repaired all 142 published English AI rows that contained the invented filler. All 142 passed automatic checks for expected filler in the old text, empty text, remaining filler, Arabic script, chain opening, Prophet and Companion honorifics, length ratio, Quran references, row count and duplicate source IDs across the full repair file. Mo approved five random before-and-after samples before any writes.

The 142 source Arabic texts and current English rows matched the prepared drafts at the final pre-write read-only check. Each batch was applied in one SQL statement and checked before continuing. The final live check confirms zero published English hadith rows with filler, exactly one published English translation for each hadith, and unchanged German counts.

## Live baseline

Read-only SQL on Supabase project `jnietkyxgnocyizvjiel`:

| Measure | Before repair |
|---|---:|
| Stored hadith | 14,629 |
| Published English hadith translations | 14,629 |
| Hadith without exactly one published English translation | 0 |
| German hadith translation rows | 9,698 |
| Published German hadith translations | 0 |
| Published English hadith rows with the filler | 142 |
| Published English chain-skipping candidates | 1,756 |

## Filler batches

| Batch | Hadith rows prepared | Rows inserted | Status |
|---:|---:|---:|---|
| 1 | 30 | 30 | Applied and verified: one published English per selected hadith; no old rows remain published |
| 2 | 30 | 30 | Applied and verified: 60 total repair rows published; selected hadith invariant and German counts hold |
| 3 | 30 | 30 | Applied and verified: 90 total repair rows published; selected hadith invariant and German counts hold |
| 4 | 30 | 30 | Applied and verified: 120 total repair rows published; selected hadith invariant and German counts hold |
| 5 | 22 | 22 | Applied and verified: 142 total repair rows published; final checks pass |
| **Total** | **142** | **142** | **All batches applied and verified** |

The dry run plans version 2 for each row and one older published English row to unpublish per hadith. Before writing, the batch writer checks that the hadith Arabic and current English still match the reviewed source, and that the planned version is still next. It then unpublishes the older English row and inserts the new row in one SQL statement. German rows are not included.

The final verifier checks the filler phrase across all published English hadith translations, regardless of origin, along with the one-published-English-per-hadith and unchanged German-count requirements.

## Needs Mo

- Muslim 733a: the source wording `حتى تكون أطول من أطول منها` is unclear in context. The draft keeps it close to the literal wording.
- Muslim 758d: `غير عدوم ولا ظلوم` is translated literally as “neither in need nor unjust”; the expression is unusual in English.
- Muslim 763g and 763i: `وضوءا بين الوضوءين` is kept literal as “an ablution between the two ablutions”; the intended English phrasing is unclear.

## Chain-skipping group

After the filler repair, a fresh read-only export found 1,620 published English AI candidates without the expected chain phrases. The first 40 were compared with their Arabic: 37 already include the source chain, 2 have no explicit chain in the stored Arabic, and 1 has an extra summary not present in the Arabic excerpt. A replacement draft is prepared for that row. The remaining 1,580 candidates still need review. The export and audit are at `data/hadith-translation-repair-2026-10-29/chain-skipping-candidates.json` and `data/hadith-translation-repair-2026-10-29/chain-candidate-audit.json`. No chain-group translations have been written; a separate five-sample approval is still required before those writes.
