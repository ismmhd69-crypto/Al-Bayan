# Report: NVIDIA as the main AI provider

Date: 2026-10-02. Plan: `docs/nvidia-switch-plan.md`.

## Result: NO-GO (defaults unchanged, Gemini stays the default)
Run 2 passed every bar, but run 1 did not, and GO needs both runs to pass. Even when it is fast enough, the NVIDIA mix answers far fewer questions than Gemini did (see Quality).

| | Run 1 (17:05) | Run 2 (17:36) | Bar |
|---|---|---|---|
| Correct answer or correct refusal (no timeout or error) | 17 of 20 (85%) | 20 of 20 (100%) | at least 90% |
| Median seconds | 25.9 | 20.2 | 25 or less |
| 95th percentile seconds | 50 (deadline) | 40 | under 45 |
| Timeouts | 3 (divorce, hijab, riba Arabic) | 0 | |
| Answered when it should refuse | none | none | none |
| Answerable questions that got an answer | 4 of 17 | 6 of 17 | |
| Model skipped by the chain | 1 (NVIDIA timeout, Gemini answered) | 0 | |

All 3 refusal questions (a personal ruling, two off-topic) were refused correctly in both runs, in 1 to 6 s. No 429 or 503 from NVIDIA in either run. No safety check was bypassed or changed.

## Settings measured
- Writer: `nvidia:nvidia/nemotron-3-super-120b-a12b`, then `gemini-3.7-flash`.
- Checker: `nvidia:openai/gpt-oss-20b`, then `gemini-3.1-flash-lite`.
- `NVIDIA_REASONING=off`, `ASK_LEAN=true`, `NVIDIA_TIMEOUT_MS=25000`, deadline 50 s.

How these were chosen (3-question probes):
- The original split (gpt-oss writer, Nemotron checker, normal reasoning): question frame 5 to 21 s, evidence selection 22 s or more, 2 of 3 timed out.
- Same split with thinking off and lean mode: selection usually 3 to 9 s, but the gpt-oss frame still took 7 to 11 s.
- Roles swapped (Nemotron writer with thinking off, gpt-oss checker): frame 2 to 5 s, selection 8 to 16 s. This was the fastest mix, so both runs used it.
- The search step (Quran, hadith and live scholar websites) takes about 4 s whatever the model.

## Quality compared with Gemini
- Earlier Gemini runs (`docs/eval-2026-09-29-baseline.txt`, `docs/answer-v2-old-baseline.md`) answered about 55 to 60% of answerable questions, with a median of 13 s and a 90th percentile of 18 s.
- The NVIDIA mix answered 24 to 35% of them, with a median of 20 to 26 s.
- The refusals are safe (the checks stop the answer), but they are often caused by the models: `draft_ref_count` (the writer cites sources wrongly), `copied_source`, failed screening, and `selection_retry_timeout` (the retry budget of 10 s is too short for NVIDIA).
- Answers that did pass went through the same checks as Gemini answers. I did not judge their wording by hand.
- I could not run Gemini for a same-day comparison: the Gemini key returned 503 and 429 all day.

## What changed in code (all opt-in)
- `lib/ai/nvidia.ts`:
  - It reads JSON even with reasoning text or `<think>` blocks around it. Malformed output still means a refusal.
  - New reasoning setting (`NVIDIA_REASONING`).
  - One short retry on 429 or 503.
  - Per-model limit of 35 a minute and a daily cap of 1000 (`NVIDIA_RPM`, `NVIDIA_DAILY_LIMIT`). Hitting either counts as busy, so the chain moves on.
- `lib/ai/limits.ts`: the limiter (in memory, per server instance).
- `lib/ai/index.ts`: in debug mode it logs which model answered or was skipped (model id and reason only). The writer and checker rule is unchanged.
- `lib/ask/settings.ts` and `pipeline.ts`, `core.ts`: `ASK_DEADLINE_MS` (default 50 s, limited to 10 to 55 s) and `ASK_LEAN` (fewer candidates for the evidence check). Both are off by default.
- `scripts/measure-ai-mix.ts`: the 20-question measurement.
- `.env.example`: the measured mix, documented.
- Tests: `tests/nvidia.test.ts` (17 tests) and a lean-mode pipeline test. The full suite passes (441 tests, including tests another session added meanwhile), and so do `tsc` and `npm run build`.
- No database writes. The Gemini code is not changed.

## How to switch (only if Mo still wants to try it, for example as an emergency backup)
In Vercel, add these, then redeploy:
- `AI_MODELS` = `nvidia:nvidia/nemotron-3-super-120b-a12b,gemini-3.7-flash`
- `AI_VERIFIER_MODELS` = `nvidia:openai/gpt-oss-20b,gemini-3.1-flash-lite`
- `NVIDIA_API_KEY` = the key (already in `.env` locally)
- `NVIDIA_REASONING` = `off`
- `ASK_LEAN` = `true`
- `NVIDIA_TIMEOUT_MS` = `25000`

To switch back, delete those variables and redeploy. The defaults are Gemini.

## Terms and privacy
- NVIDIA's free hosted endpoint is for development, testing and research, not production. It allows about 40 requests a minute per model, and its queues are unpredictable. Run 1 shows this: the same settings were slower and timed out 3 times, 30 minutes before run 2 passed.
- When NVIDIA is used, the visitor's question and our source texts are sent to NVIDIA. The privacy text (`dictionaries/*.ts`) currently names only Google Gemini, so it needs a line before NVIDIA is ever used live.
- The current Gemini key is also a borrowed free-tier key: 20 requests a day on the better models, not allowed for users in the EEA, Switzerland and the UK, and its content is used for training. Neither free option is fit for production.

## What would be needed for a GO
1. A paid or production NVIDIA plan (NVIDIA AI Enterprise, or a dedicated endpoint) for steady speed, then measure again.
2. Or a paid Gemini key (or Vertex AI): this is the setup the pipeline was tuned for (median 13 s), with business terms.
3. Or a self-hosted model on a rented GPU. This is more work, and quality is unknown.
4. Separately, the NVIDIA mix needs prompt and check tuning before its answer rate is acceptable (wrong citations, copied wording).

## Follow-ups
- Mo decides on a paid provider. Recommended: a paid Gemini or Vertex key with business terms.
- Keep NVIDIA selectable for tests and as an emergency backup.
- If NVIDIA is ever used live, update the privacy text first.
