# Codex Handoff: Hadith Split and Translation Task

Date: 2026-10-02
Scope: Split isnad/matn boundaries across published hadith (`public.sources` where `kind = 'hadith' AND published = true`), followed by word-by-word translations.

## Core Rules and Constraints
1. **Read-only on Database**: Strictly `SELECT` only. Never run any `INSERT`, `UPDATE`, `DELETE`, or schema modifications on Supabase tables.
2. **No AI API from Code**: Do NOT call Gemini, OpenAI, or any other AI API from code. Work is done directly in the working session.
3. **Local Git Commits Only**: Never run `git push`. Commit locally every batch or few batches, staging only your own files (`data/hadith-split/`, `data/hadith-words-translations/`, `docs/hadith-split-log.md`, `scripts/generate-batch-*.ts`).
4. **Writing Style for Mo**: Plain English, short replies, **NO em dashes**.
5. **Autonomy**: Mo is away. Do not block or ask questions for individual hadiths. If a hadith is unclear, mark `kind: "unclear"`, `start: null`, and proceed.

## Current Progress Status (as of 2026-10-02 20:30)
- **Part 1 Target**: 10,943 hadiths in scope (Sahih al-Bukhari and Sahih Muslim).
- **Completed**: Batches 1 through 20 (1,200 hadiths processed, 0 errors).
  - All 20 batches are saved under `data/hadith-split/marks-001.json` through `marks-020.json`.
  - Batch log in `docs/hadith-split-log.md` is updated through Batch 20.
  - Milestone Check 1 (600 hadiths) and Milestone Check 2 (1,200 hadiths) both passed with a 0.0% error rate.
- **Pending Remaining**: 9,744 hadiths in scope (starting from Batch 21 / Bukhari 1960 onwards).

## Standard Workflow per Batch (Batches 21+)
1. **Export next batch of 60**:
   ```bash
   npx tsx scripts/export-hadith-for-marking.ts --out=data/hadith-split/batch-NNN.json
   ```
   (This automatically checks existing marks and grabs the next pending 60 items).

2. **Inspect batch contents**:
   - Check `data/hadith-split/batch-NNN.json`.
   - Identify the boundary `start` where isnad ends and matn begins.
   - Categorize each hadith into one of:
     - `prophet_words` / `prophet_statement`: Direct words/command of the Prophet.
     - `narration`: Action or description of the Prophet narrated without companion speech framing.
     - `companion_words`: Companion explaining, doing, or narrating an event.
     - `dialogue`: Conversation or Q&A involving the Prophet or companions.
     - `reference_only`: Bare isnad pointing to an earlier hadith with no matn (set `start: null`).
     - `unclear`: Ambiguous boundary (set `start: null`).
   - If there is an editorial note or narrator chain at the end, mark `tail_start`.

3. **Generate batch marks**:
   - Write script `scripts/generate-batch-NNN.ts` to output `data/hadith-split/marks-NNN.json`.
   - Run: `node -e "require('child_process').execSync('npx tsx scripts/generate-batch-NNN.ts', { stdio: 'inherit' })"` or `npx tsx scripts/generate-batch-NNN.ts`.

4. **Validate marks**:
   ```bash
   npx tsx scripts/validate-hadith-marks.ts --file=data/hadith-split/marks-NNN.json
   ```
   - Must have 0 errors: `start` must occur exactly once, word-boundary valid, chain length >= 10 chars, contains isnad keywords.

5. **Log & Commit**:
   - Compute stats: count kinds (P / N / C / D / U / R) and tails.
   - Append row to `docs/hadith-split-log.md`.
   - Stage and commit locally:
     ```powershell
     git add data/hadith-split/batch-NNN.json data/hadith-split/marks-NNN.json scripts/generate-batch-NNN.ts docs/hadith-split-log.md; git commit -m "feat(hadith-split): mark batch NNN"
     ```

6. **Milestone Quality Checks**:
   - Every 10 batches (600 hadiths), e.g., Batch 30 (1,800 hadiths), Batch 40 (2,400 hadiths), sample 10 random hadiths across the preceding 10 batches.
   - Inspect boundary accuracy, kinds, and tail exclusions. Record findings and error rate in `docs/hadith-split-log.md`.

## Key Files Reference
- `scripts/export-hadith-for-marking.ts`: Canonical export script.
- `scripts/validate-hadith-marks.ts`: Canonical validator script.
- `docs/hadith-split-log.md`: Milestone and batch progress tracking table.
- `data/hadith-split/`: Location of exported batches and marked results.
