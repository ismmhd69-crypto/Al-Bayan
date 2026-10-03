# Plan: OpenRouter as an opt-in AI provider

Date: 2026-10-03. Status: built behind settings; defaults stay Gemini until a measurement passes.

## Why
Mo's Gemini key is a borrowed free-tier key (not usable for EU visitors). NVIDIA's free endpoint measured NO-GO (`docs/nvidia-switch-report.md`). Mo bought $10 of OpenRouter credit; the key has a $5 limit. Question: can Qwen3 235B (writer) and Mistral Small 3.2 (checker) run Ask?

## What gets built
- `lib/ai/openrouter.ts`, same style as `lib/ai/nvidia.ts`: same busy-error class, tolerant JSON reading (reuses `extractJsonObject`), per-model rate limiter, one short jittered retry. 429, 502, 503, 504 and timeouts count as busy; 401, 403, 404, 410 count as unavailable (the chain moves on); malformed JSON gives null, which every caller refuses.
- `lib/ai/index.ts`: new entry type `openrouter:model` (for example `openrouter:qwen/qwen3-235b-a22b-2507`). Without `OPENROUTER_API_KEY` those entries are left out. The writer and checker lists still share no model (the code refuses to start otherwise).
- `lib/ai/limits.ts`: OpenRouter limiter.
- Settings (documented in `.env.example`, no values): `OPENROUTER_API_KEY`, `OPENROUTER_TIMEOUT_MS` (25000), `OPENROUTER_RPM` (100), `OPENROUTER_DAILY_LIMIT` (1000 per model), plus two I added: `OPENROUTER_PRIVACY` and `OPENROUTER_REASONING`.
- `scripts/measure-ai-mix.ts`: now also adds up the real cost per question, saves the answer text, and stops by itself when the spend reaches $0.80.
- `tests/openrouter.test.ts`.

## Decisions taken (safest default)
1. **Privacy.** Every request sends `provider: { data_collection: "deny", zdr: true }` (checked against OpenRouter's provider-preferences docs on 2026-10-03). `deny` means only providers that do not store or train on prompts; `zdr` means only zero-data-retention endpoints. Default is both (`OPENROUTER_PRIVACY=zdr`). A model with no matching provider answers 404 and counts as "unavailable", so the chain moves on. A probe on 2026-10-03 showed all four models have such a provider. `OPENROUTER_PRIVACY=off` exists for tests only and must never be used with visitor questions.
2. **Reasoning models.** Every request sends `reasoning: { enabled: false, exclude: true }` so hidden thinking cannot eat the output budget and no reasoning text lands in the reply. `OPENROUTER_REASONING=low|medium|high|default` changes that. The tolerant JSON reader still copes with leftover thinking text.
3. **Cost.** OpenRouter returns `usage.cost` (dollars) in every response. The provider logs `ai cost: <model> <number>` in debug mode only (never prompt, answer or key); the measurement script adds it up.
4. **No native Gemini in the measured chains.** The Gemini key answers 429 all day; it would pollute the numbers. Mixes A and B are pure OpenRouter, mix C ends with OpenRouter's `google/gemini-2.5-flash-lite` as the fallback. For production a native Gemini entry can be added last in each chain once a paid key exists.
5. **Key safety.** The key is only read from `process.env`, only sent in the Authorization header, never logged. A test checks no log line contains it.
6. **Next.js docs.** No Next.js API is touched (provider code, tests and a script only), so no framework guide was needed.

## Measurement
- Script `scripts/measure-ai-mix.ts`, the same 20 questions as the NVIDIA run (12 English, 4 German, 4 Arabic; 3 must be refused).
- Environment: `QURAN_API_ENV=production`, `QURAN_CHAPTERS` empty, `HADITH_SOURCE=library`, `SHOW_AI_TRANSLATIONS=true`, `ASK_LEAN` off, deadline 50 s.
- Mixes: A writer `qwen/qwen3-235b-a22b-2507` + checker `mistralai/mistral-small-3.2-24b-instruct`; B same writer + checker `qwen/qwen3-32b`; C writer qwen3-235b then `google/gemini-2.5-flash-lite`, checker Mistral.
- Each mix twice, at least 30 minutes apart (runs of the three mixes alternate so the gap is real).
- Spend cap: stop and report at $0.80.
- Six answers read by hand against their sources.

## GO bar (per mix, both runs)
At least 90% correct answer or correct refusal; answerable questions answered at least 50%; median at most 25 s; 95th percentile under 45 s; every must-refuse question refused; no safety check bypassed.

## Rollback
Delete `AI_MODELS`, `AI_VERIFIER_MODELS` and the `OPENROUTER_*` variables and redeploy. Defaults are Gemini.
