# Othman al-Khamis fatwa book: log

Source: https://othmanalkhamees.com/books/10/read, saved once on 2026-10-01 as data/khamis/book10.html (414 sections, parsed by scripts/parse-khamis-book.ts into data/khamis/sections.json).
Rights record: 2e553d2f-01aa-4ce6-8eef-65c9045d7c80 (short_quotes_only, 600 chars, created 2026-10-01 at Mo's approval).
Links: no per-fatwa anchor exists. All quotes share the book link; the fatwa number goes in the reference text (Mo approved).

## Dry run, sections 1 to 30
Result: below the 30 percent stop line, so the run stopped before any import. Nothing was stored.

| Rule | Approved of 30 |
|---|---|
| Strict (answer at least 200 characters, as for the other scholars) | 2 (sections 3, 7), about 7 percent |
| Relaxed (answer at least about 90 characters) | 6 (sections 2, 3, 4, 7, 20, 26), 20 percent |

Whole book, by the code rules only: 85 of 414 answers are 200 characters or longer (21 percent); 218 are 80 or longer.

Common failures:
- Answer too short to quote alone ("نعم", "لا بأس", "يجوز"): about 15 of 30.
- Answer only makes sense with the question ("هذا الحديث", "الإسناد الذي ذكرته", "أ- ... ب- ..."): about 6.
- Personal story, personal sin or private family matter: about 8.
- Harsh wording about a group or a named scholar: 2.
- Error text instead of an answer (section 6): 1.
- 40 sections (about 36 to 58 and a few more) use another page layout (no question/answer blocks) and need their own parser.

Titles: write from the question; the page has no real titles for the question/answer sections.

## Full run, 2026-10-01 (Mo's middle option: answers of 120+ characters with a ruling and a reason)
Reviewed by hand: 154 answers (the others failed the code checks). Stored 23. Needs Mo 19. Rejected 112.
Skipped for page layout: 40. Skipped as too short: 218. Cut by code checks: 2.
Batch 1 (sections 1 to 414, one import of 23 items): stored 23, running total 23.
Approved sections: 2, 3, 7, 26, 66, 69, 89, 117, 136, 156, 167, 180, 190, 201, 257, 275, 281, 359, 391, 404, 405, 406, 412.
Decisions: docs/khamis-batches/decisions.json. Import script: scripts/import-khamis.ts.
Database check after import: 23 sources, 23 approved search entries for othman-al-khamis.
