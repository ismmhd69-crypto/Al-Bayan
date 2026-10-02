# Plan: NVIDIA as the main AI provider

Date: 2026-10-02. Status: built behind settings; defaults stay Gemini until the measurement passes.

## Why
The Gemini key is a borrowed free-tier key (20 requests a day on the better models, free tier not allowed for users in the EEA, Switzerland and the UK, free-tier content used for training). Mo wants to try NVIDIA's hosted models.

## (a) Where AI is used
- Ask (`lib/ask/pipeline.ts`, `lib/ask/core.ts`): question frame and draft (writer), evidence selection, final screening, video relevance and the prepared-answer check (checker).
- Scripts: `collect-*`, `dry-run-*`, `translate-fatwas`, `process-batch`, `repair-flagged-quotes`, `link-topic-videos`, `import-validated-binbaz-candidates`, `eval-*` (quote relevance checks, translations, evaluations).
- All of them take their models from `getProvider()` / `getVerifier()` in `lib/ai/index.ts`, so switching needs **environment changes only**. Code changes are only in `lib/ai/nvidia.ts`, a new `lib/ai/limits.ts`, logging in `lib/ai/index.ts`, two optional Ask settings, tests, `.env.example` and docs.
- The privacy text (`dictionaries/*.ts`) names Google Gemini. It is not changed here because the default stays Gemini; it must be updated if NVIDIA goes live.

## (b) Models
- Writer chain: `nvidia:openai/gpt-oss-20b`, then `gemini-3.7-flash`.
- Checker chain: `nvidia:nvidia/nemotron-3-super-120b-a12b`, then `gemini-3.1-flash-lite`.
- The two chains share no model (the code refuses to start if they do). No third NVIDIA model: every other model tested was slow, queued, or 404. Gemini stays last, so an NVIDIA failure falls back to Gemini.

## (c) Speed
- Measure each step per model on real prompts (step timings from the pipeline's `onStep`).
- Lower the model's own reasoning effort (`NVIDIA_REASONING`, default `low`, `off` to try without).
- Optional lean mode (`ASK_LEAN=true`): fewer candidates for the evidence check (Quran 5, hadith 2, scholar quotes 3). Fewer candidates can only mean more refusals, never an unchecked answer. No safety prompt text changes.
- Pipeline deadline configurable (`ASK_DEADLINE_MS`, default 50 s, capped at 55 s, below the route's 60 s).
- The steps are already parallel where they can be (search, videos). Frame, selection, draft and screening depend on each other. No streaming (it would need changes to the checks).

## (d) Limits
- One short retry with jitter on 429 or 503, then the chain moves on.
- Per-model limit `NVIDIA_RPM` (default 35 a minute, under NVIDIA's about 40) and a daily cap `NVIDIA_DAILY_LIMIT` (default 1000). Over the limit counts as busy, so the chain moves to Gemini. The counters live in the server's memory (per instance).

## (e) Tests and go/no-go
- Unit tests: JSON wrapped in text, thinking blocks, malformed JSON, 429, 503, 404, timeout, caller cancel, limiter, daily cap, chain behaviour, the writer/checker rule, deadline setting.
- Measurement: 20 questions (12 English, 4 German, 4 Arabic, including refusals), run twice at least 30 minutes apart.
- GO only if, in both runs: at least 90% end in a correct answer or correct refusal (no timeout or error), median 25 s or less, 95th percentile under 45 s, no safety check bypassed.

## (f) Rollback
Remove `AI_MODELS` and `AI_VERIFIER_MODELS` (and the optional NVIDIA and Ask settings). The defaults are Gemini.
