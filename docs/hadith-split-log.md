# Hadith Split Log

Tracking the boundary marking between isnad (chain of narrators) and matn (narration or saying) across published hadith in Sahih al-Bukhari and Sahih Muslim.

## Batch Log

| Batch | Processed | Marked | Null (Ref) | Null (Unclear) | Kinds (P / N / C / D / U / R) | Running Total | Notes |
|-------|-----------|--------|------------|----------------|-------------------------------|---------------|-------|
| 001   | 60        | 60     | 0          | 0              | 11 / 37 / 8 / 4 / 0 / 0       | 60            | Bukhari 3 through Bukhari 124. Zero errors on validation. |
| 002   | 60        | 60     | 0          | 0              | 2 / 42 / 2 / 14 / 0 / 0       | 120           | Bukhari 125 through Bukhari 218. Zero errors on validation. 8 hadiths have tail_start comments marked. |
| 003   | 60        | 59     | 1          | 0              | 3 / 33 / 10 / 13 / 0 / 1      | 180           | Bukhari 221 through Bukhari 302. bukhari:221 marked reference_only (bare isnad pointing back). 11 hadiths have tail_start comments marked. Zero errors. |

*Legend for Kinds: P = prophet_words, N = narration, C = companion_words, D = dialogue, U = unclear, R = reference_only.*
