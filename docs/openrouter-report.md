# Report: OpenRouter as an AI provider for Ask

Date: 2026-10-03 to 2026-10-04. Plan: `docs/openrouter-plan.md`. Raw runs: `docs/openrouter-runs/` (one JSON per run with every question, step timings, refusal reasons, real cost and the answers).

## Result: NO-GO for every mix. Defaults unchanged (Gemini).
Each mix was measured on the same 20 questions as the NVIDIA run, with `QURAN_API_ENV=production`, `QURAN_CHAPTERS` empty, `HADITH_SOURCE=library`, `SHOW_AI_TRANSLATIONS=true`, `ASK_LEAN` off, deadline 50 s. Total spend for all 12 runs: **$0.23** (cap was $0.80). No key was printed or written anywhere (checked by searching the repo for it).

"Answerable answered" = questions that should be answered and were, out of 17. "Correct" = answer or correct refusal, no timeout or error. Bars: correct at least 90%, answerable answered at least 50%, median 25 s or less, 95th percentile under 45 s, all 3 must-refuse questions refused.

| Mix and run | Correct | Answerable answered | Median s | 95th pct s | Must-refuse refused | Cost per answer |
|---|---|---|---|---|---|---|
| A run 1 (21:17) | 15/20 | 5/17 (29%) | 34.9 | 50 | 3/3 | $0.00137 |
| A run 2 (22:50, over 30 min later) | 13/20 | 3/17 (18%) | 35.4 | 50 | 3/3 | $0.00124 |
| B run 1 | 7/20 | 1/17 (6%) | 34.1 | 45.6 | 3/3 | $0.00053 |
| B run 2 | 8/20 | 2/17 (12%) | 34.8 | 39.2 | 3/3 | $0.00059 |
| C run 1 | 14/20 | 4/17 (24%) | 37.9 | 50 | 3/3 | $0.00159 |
| C run 2 | 16/20 | 7/17 (41%) | 33.6 | 50 | 3/3 | $0.00137 |
| D (free) run 1 (23:49) | 19/20 | 6/17 (35%) | 17.9 | 29 | 3/3 | $0 |
| D (free) run 2 (00:21, over 30 min later) | 19/20 | 4/17 (24%) | 15.1 | 21.5 | 3/3 | $0 |

Extra samples (not counted as the "second run" because they were less than 30 minutes after the first): A 3/17 and 5 failures, B 2/17, C 6/17. They agree with the table.

Mixes: A writer `qwen/qwen3-235b-a22b-2507`, checker `mistralai/mistral-small-3.2-24b-instruct`. B same writer, checker `qwen/qwen3-32b`. C writer Qwen3 235B then `google/gemini-2.5-flash-lite`, checker Mistral. D (added at Mo's request for free models only) writer `apodex/apodex-1.1-mini:free`, checker `inclusionai/ling-3.0-flash-sante:free`.

Test of "pick the fastest provider" (`OPENROUTER_SORT=throughput`) on mix A: 17/20 correct, 5/17 answered, median 27.7 s, p95 50 s. Faster than A without it (about 35 s) but still over the bar and the answer rate is unchanged. One run only.

## Verdict per mix
- **A: NO-GO.** Answer rate 18 to 29% (bar 50%), median about 35 s (bar 25 s), p95 50 s (bar 45 s), correct 65 to 75% (bar 90%).
- **B: NO-GO.** Worst. Qwen3 32B often did not finish within 25 s on the real prompts (12 to 14 of 20 timed out). It was fast on the short micro-benchmark but about 16 to 19 s for a 4,000-token test through DeepInfra.
- **C: NO-GO.** Best of the paid mixes on answers (24 to 41%), because the Gemini fallback catches some questions, but median 32 to 38 s and p95 50 s.
- **D (free): NO-GO, but closest.** It passes correct-or-refused (95% twice), all refusals, median (15 to 18 s) and p95 (21 to 29 s). It fails only the answer rate: 35% and 24% against 50%. Gemini earlier answered about 55 to 60%; NVIDIA 24 to 35%.

No question that must be refused was answered in any run. No safety check was bypassed or changed.

## Why they fail
- Speed (paid mixes): the slow step is evidence selection by the checker, 12 to 24 s per question on Mistral with about 12,000 tokens of sources. Then writing, then screening. Five or so model calls in a row add up to about 35 s. The privacy rule limits which providers can serve a model, and provider speed varies a lot (the same model took 4 s or 7 s depending on the provider).
- Answer rate (all mixes): most refusals are the checks working on weak model output: evidence judged thin (`selection_retry_failed`, `evidence_insufficient`), `question_frame_invalid`, `draft_malformed`, `copied_source`, failed screening. In mix D the small free models produce invalid question frames and too-strict selection.
- Mix D run 2 also had one 429 from the free provider (counted as busy).

## Reading 6 answers by hand (wording against sources)
- Fasting (mix A, English and German): one sentence, "to become mindful of God", from 2:183. Within the source.
- Hijab (mix A, Ibn Baz fatwa 4291): obligation in front of non-mahram men, covering face and body, attributed to Ibn Baz. Within the source.
- Quran preserved (mix A): "preserved without change on a preserved Tablet", cited to 85:22 which says "[written] on a preserved Tablet". "Without change" goes a little beyond the verse. Mild overreach.
- Qibla in German (mix A): claim 1 (2:144) fine. Claim 2 calls the Kaaba "a central point of the Islamic faith" and "Stätte der Unterstützung", but 5:97 says it was made a place of prayer for people. This goes beyond the source. Overreach.
- Hajj in German and compulsion in Arabic (mix C): both match 3:97 and 2:256 well.
- Zakah, hijab and fasting (mix D): the claims trace to the cited verses and fatwa text. One loose point: "uncles" in the hijab answer comes from "the husband's brother or his uncle", and a later claim about mahram uncles reads confusingly. The zakah answer attaches the threshold to Quran verses that do not mention it (the threshold is in the Uthaymeen fatwa, which is also cited).
Summary: wording mostly stays within the sources, with two small overreaches in 6 answers (preserved, Kaaba). The screening and copy checks are the same as for Gemini; I did not change them. Six answers is a small sample, not proof.

## What changed in code (all opt-in)
- `lib/ai/openrouter.ts` (new): OpenAI-compatible calls to OpenRouter in the style of `nvidia.ts`. Same busy-error class; JSON read from text with reasoning or code fences; per-model rate limiter; one jittered retry; 429, 502, 503, 504 and timeouts count as busy; 401, 403, 404, 410 count as unavailable; malformed JSON gives null; a 400 that rejects JSON mode is retried once without it (the free Ling model needed this); real cost logged as model id and number only.
- Privacy fields sent on every request: `provider: { data_collection: "deny", zdr: true }`. Reasoning: `reasoning: { enabled: false, exclude: true }`.
- `lib/ai/index.ts`: `openrouter:model` entries; skipped when `OPENROUTER_API_KEY` is missing; the writer and checker lists still share no model.
- `lib/ai/limits.ts`: OpenRouter limiter.
- Settings in `.env.example` (no values): `OPENROUTER_API_KEY`, `OPENROUTER_TIMEOUT_MS` (25000), `OPENROUTER_RPM` (100), `OPENROUTER_DAILY_LIMIT` (1000 per model), and extras `OPENROUTER_PRIVACY`, `OPENROUTER_REASONING`, `OPENROUTER_SORT`.
- `scripts/measure-ai-mix.ts`: adds real cost per question, saves answers, and stops at $0.80 spend.
- `tests/openrouter.test.ts` (21 tests): JSON with reasoning text, malformed JSON, 429, 503, 401/403/404/410, 400 handling, timeout, caller cancel, local limit, the privacy and reasoning fields are sent, no key, prompt or answer in any log line, chain building and the shared-model refusal.
- Checks: full test suite passes (509 tests). `npx tsc --noEmit` and `npm run build` both fail only on `scripts/generate-batch-067.ts` (invalid octal escape, a Codex-generated file). I did not touch it. The build compiles and then stops at the type check because of that file. Without it there are no type errors.
- No database writes. No Vercel or Netlify settings changed. Nothing pushed.

## Cost
Paid mixes A and C cost about $0.0014 to $0.0016 per answer, so about $1.40 to $1.60 per 1,000 answers. At 150 answers a day that is about $6.30 to $7.20 a month. Mix D and any `:free` model cost $0 (limit 1,000 calls a day and 20 a minute, about 200 answers a day at 5 calls each).

## Privacy and terms caveats
- Every request asks OpenRouter to use only providers that do not store or train on prompts and have zero data retention. This is a request-level setting; the account setting should also be checked. Effect on availability: of 17 free models with a large enough context window, only 3 have such a provider (two worked, one rate-limited); the rest return "not found". All four paid models tested had a provider.
- Questions and source texts are still processed by OpenRouter and by the model provider it picks (seen in the tests: DeepInfra, Novita, SiliconFlow, Venice). Some of these are outside the EU, and some are Asian companies. Before any visitor uses this, the privacy text (`dictionaries/*.ts`, which names only Google Gemini) must name OpenRouter and its providers, and a lawyer should look at the transfer outside the EU. OpenRouter's own terms for a public site with possible minors were not reviewed.
- Free models are meant for light use, can be rate limited without warning, and the small obscure ones (Apodex, Ling) have unknown Arabic quality.
- `OPENROUTER_PRIVACY=off` exists only for tests. Never use it with visitor questions.

## What would help (nothing here is switched on)
1. Fastest practical fix to try: a paid Gemini key (or Vertex), the setup this pipeline was tuned for (median 13 s, 55 to 60% answered).
2. For the free route: the failure is quality of the small models, not speed. One cheap test: keep the free Apodex writer, but use a stronger checker for evidence selection (the checker is the step that rejects most questions), and run with `OPENROUTER_SORT=throughput`. Another: raise the answer rate by tuning the question-frame and selection prompts for small models.
3. For the paid route: smaller prompts (fewer or shorter candidates, which `ASK_LEAN` does but costs answers) and `OPENROUTER_SORT=throughput` would bring the median near 25 s, but the answer rate stays near 30%.

## How to switch (only for a test, since no mix passed)
Add in Vercel and redeploy:
- `AI_MODELS` = `openrouter:apodex/apodex-1.1-mini:free` (or `openrouter:qwen/qwen3-235b-a22b-2507,openrouter:google/gemini-2.5-flash-lite`)
- `AI_VERIFIER_MODELS` = `openrouter:inclusionai/ling-3.0-flash-sante:free` (or `openrouter:mistralai/mistral-small-3.2-24b-instruct`)
- `OPENROUTER_API_KEY` = the key, marked sensitive
- For the free mix also `OPENROUTER_RPM` = `18`

To switch back: delete those variables and redeploy. The defaults are Gemini.
