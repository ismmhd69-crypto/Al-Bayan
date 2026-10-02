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
| 010   | 60        | 60     | 0          | 0              | 2 / 11 / 21 / 26 / 0 / 0      | 600           | Bukhari 893 through Bukhari 981. 12 hadiths have tail_start comments marked. Zero errors. |
| 011   | 60        | 60     | 0          | 0              | 1 / 23 / 13 / 23 / 0 / 0      | 660           | Bukhari 982 through Bukhari 1073. 12 hadiths have tail_start comments marked. Zero errors. |
| 012   | 60        | 60     | 0          | 0              | 1 / 4 / 41 / 14 / 0 / 0       | 720           | Bukhari 1074 through Bukhari 1156. 15 hadiths have tail_start comments marked. Zero errors. |
| 013   | 60        | 58     | 2          | 0              | 0 / 7 / 29 / 22 / 0 / 2       | 780           | Bukhari 1159 through Bukhari 1272. bukhari:1188 and bukhari:1199b marked reference_only. 16 hadiths have tail_start comments marked. Zero errors. |
| 014   | 60        | 60     | 0          | 0              | 5 / 4 / 17 / 34 / 0 / 0       | 840           | Bukhari 1273 through Bukhari 1370. 12 hadiths have tail_start comments marked. Zero errors. |
| 015   | 60        | 58     | 2          | 0              | 7 / 2 / 25 / 24 / 0 / 2       | 900           | Bukhari 1372 through Bukhari 1511. bukhari:1439 and bukhari:1444 marked reference_only. 13 hadiths have tail_start comments marked. Zero errors. |

*Legend for Kinds: P = prophet_words, N = narration, C = companion_words, D = dialogue, U = unclear, R = reference_only.*

## Milestone Quality Checks

### Check 1 (After 10 Batches / 600 Hadith)
- Sample size: 10 randomly selected hadiths across batches 1 through 10.
- Sample items inspected:
  1. Batch 1 (bukhari:58): companion_words. Matn starts cleanly with Jarir's speech on the day al-Mughirah died.
  2. Batch 2 (bukhari:158): narration. Matn starts cleanly with the Prophet's wudu once each.
  3. Batch 3 (bukhari:251): narration with tail_start. Matn starts with Abu Salamah and Aisha's brother entering, tail separates Yazid ibn Harun's comment.
  4. Batch 4 (bukhari:344): dialogue. Matn starts with the expedition narrative leading to tayammum dialogue.
  5. Batch 5 (bukhari:446): narration. Matn starts with the description of the Prophet's mosque.
  6. Batch 6 (bukhari:518): narration with tail_start. Matn starts with Aisha sleeping next to the Prophet praying, tail marks Musaddad's addition.
  7. Batch 7 (bukhari:634): companion_words. Matn starts with Abu Juhayfah watching Bilal call the adhan.
  8. Batch 8 (bukhari:754): narration. Matn starts with the morning prayer during the Prophet's final illness.
  9. Batch 9 (bukhari:841): companion_words. Matn starts with Ibn Abbas recounting loud dhikr after prayer.
  10. Batch 10 (bukhari:962): companion_words. Matn starts with Ibn Abbas witnessing the Eid prayer before the khutbah.
- Findings: All 10 samples have exact boundary placements, valid kinds, correct tail exclusions where present, and zero text corruption.
- Error rate: 0.0% (0 / 10). Quality benchmark satisfied.
