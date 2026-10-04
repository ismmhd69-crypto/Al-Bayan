# Scholar library completeness inventory

This is a read-only inventory. It does not claim that the current library is complete and it does not change the database.

## Current database

| Scholar | Published | Unpublished | Total rows |
|---|---:|---:|---:|
| Ibn Baz | 555 | 30 | 585 |
| Ibn Uthaymeen | 195 | 26 | 221 |
| Al-Albani | 22 | 0 | 22 |
| Al-Barrak | 6 | 0 | 6 |
| **Total** | **778** | **56** | **834** |

## Official archive evidence

- Ibn Baz's official search reported 13,643 results for the broad Arabic query `حكم`. This is an archive-size signal, not a claim that every result is a usable fatwa quote.
- A read-only comparison of all 302 curated queries across pages 1 to 3 found 1,455 unique Ibn Baz references. The database contains 585 Ibn Baz rows, leaving 1,155 references not currently stored in that search sample. The check had 551 request errors, and every reference still needs parsing, relevance, duplicate, and rights checks, so this is a candidate count, not an import count.
- The current Ibn Baz collector had previously searched only one result page. It now supports up to five pages and a no-write dry run.
- The current Ibn Uthaymeen search endpoint returned zero results for ordinary terms during the latest check, so no new Uthaymeen item was imported from an unavailable search response.
- Retesting that endpoint with `audios`, `fatwas`, `all`, and `audio` types, in both exact and similar modes, still returned zero results. This is an upstream availability problem, not evidence that Ibn Uthaymeen has no additional fatwas.
- The repository has only Gemini implemented as an AI provider. The environment has no Vertex key, and `NVIDIA_API_KEY` is not wired into `lib/ai`, so there is no alternate relevance verifier available today.
- The verifier now uses Gemini 3.5 Flash with Gemini 3.6 Flash as a busy-service fallback. The writer stays on Gemini 3.5 Flash-Lite. The writer and verifier remain separate roles.
- A deeper targeted audit found two clean Ibn Baz candidates for the divorce-count gap. They are recorded in `docs/validated-scholar-candidate-queue.md` and remain unimported.
- Gold-zakah candidates were rejected when the official wording conflicted with the target's expected gram amount. The source was not rewritten.
- A direct database read confirmed the stored Arabic uses real Arabic Unicode characters, not terminal mojibake. The current row counts remain Ibn Baz 585, Ibn Uthaymeen 221, Al-Albani 22, and Al-Barrak 6.
- After Mo approved collection, Ibn Baz fatwas 6735, 9888, 18247, 19680, and 3472 were imported with approved search documents. The last three reused their earlier successful no-write relevance validation because the live verifier remained busy with HTTP 429 responses. Their official pages, deterministic quote checks, duplicate checks, and search-document limits were still checked before import.

## Scope decision still needed

“Complete all fatwas” cannot be proven by the current 778 rows because the official archives are much larger and search results include duplicates, lessons, short answers, and material that cannot pass the quote and rights checks. A measurable collection scope is needed, such as all approved query topics plus paginated official results, with rejected and unavailable items reported separately.
