# Hadith Split Log

Tracking the boundary marking between isnad (chain of narrators) and matn (narration or saying) across published hadith in Sahih al-Bukhari and Sahih Muslim.

## Batch Log

| Batch | Processed | Marked | Null (Ref) | Null (Unclear) | Kinds (P / N / C / D / U / R) | Running Total | Notes |
|-------|-----------|--------|------------|----------------|-------------------------------|---------------|-------|
| 001   | 60        | 60     | 0          | 0              | 11 / 37 / 8 / 4 / 0 / 0       | 60            | Bukhari 3 through Bukhari 124. Zero errors on validation. |
| 002   | 60        | 60     | 0          | 0              | 2 / 42 / 2 / 14 / 0 / 0       | 120           | Bukhari 125 through Bukhari 218. Zero errors on validation. 8 hadiths have tail_start comments marked. |
| 003   | 60        | 59     | 1          | 0              | 3 / 33 / 10 / 13 / 0 / 1      | 180           | Bukhari 221 through Bukhari 302. bukhari:221 marked reference_only (bare isnad pointing back). 11 hadiths have tail_start comments marked. Zero errors. |
| 004   | 60        | 57     | 3          | 0              | 1 / 20 / 14 / 22 / 0 / 3      | 240           | Bukhari 303 through Bukhari 388. bukhari:339, 340, 342 marked reference_only. 9 hadiths have tail_start comments marked. Zero errors. |
| 005   | 60        | 58     | 2          | 0              | 2 / 30 / 10 / 16 / 0 / 2      | 300           | Bukhari 389 through Bukhari 494. bukhari:426 and bukhari:486 marked reference_only. 8 hadiths have tail_start comments marked. Zero errors. |
| 006   | 60        | 60     | 0          | 0              | 3 / 20 / 17 / 20 / 0 / 0      | 360           | Bukhari 495 through Bukhari 581. 12 hadiths have tail_start comments marked. Zero errors. |
| 007   | 60        | 58     | 2          | 0              | 7 / 17 / 10 / 24 / 0 / 2      | 420           | Bukhari 582 through Bukhari 698. bukhari:612 and bukhari:690b marked reference_only. 11 hadiths have tail_start comments marked. Zero errors. |
| 008   | 60        | 60     | 0          | 0              | 4 / 17 / 9 / 30 / 0 / 0       | 480           | Bukhari 699 through Bukhari 791. 9 hadiths have tail_start comments marked. Zero errors. |
| 009   | 60        | 60     | 0          | 0              | 0 / 18 / 16 / 26 / 0 / 0      | 540           | Bukhari 792 through Bukhari 892. 11 hadiths have tail_start comments marked. Zero errors. |

*Legend for Kinds: P = prophet_words, N = narration, C = companion_words, D = dialogue, U = unclear, R = reference_only.*
