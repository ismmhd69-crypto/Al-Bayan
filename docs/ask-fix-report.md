# Ask repair report

Date: 2026-10-04. Local work only. Findings: `ask-findings.md`. Raw public-test records and shared cost ledger: `ask-repair-runs/`.

## Current status

Partial implementation, stopped under the agreed spending rule. The required repeated measurements, 85% target and safety acceptance were not achieved. Do not deploy this as a proven reliability fix. No database writes or manual hosting changes were made. Mo subsequently authorized pushing; the original repair and build-type correction were pushed to main. This follow-up includes only its own repair files.

## What changed

- The writer sees the existing 300-character sentence and 160-character list limits on the first request and in the response schema. Code still rejects excess length; nothing is truncated.
- The attribution correction explains exactly why a Quran sentence cannot impersonate a hadith and why a scholar-only sentence cannot be presented as Quran. Existing source-kind checks are unchanged.
- OpenRouter responses with `finish_reason=length` are rejected before JSON extraction, so an inner object from an incomplete reply cannot masquerade as a complete selection. The existing model chain can fall back. A larger same-model retry was tested, used more reasoning and time, and was removed from the final code. This final fallback variant has offline tests but no completed live measurement.
- Writer and checker instructions explicitly prohibit inventing a causal link between adjacent source statements and broadening a scholar's stated scope.
- The existing separate Quran/hadith/fatwa selection remains behind `ASK_TIERED`. Its existing safety and source rules stay in place. The prompts clarify that introducing a ruling with “The Quran states” does not bypass the approved-scholar requirement.
- Optional video search/checking is bounded independently by the remaining answer deadline. Errors or ignored cancellation cannot swallow a checked answer. Default tiered eligibility is 20 seconds; cap is four videos.
- Ask can reuse the 12 approved topic answers through `ASK_APPROVED_TOPICS`, default on when prepared publishing is on. Topic question wording is read from published database rows; approval status, exact file hash, independent same-question verdict and the existing source loader must all pass. A read-only check confirmed all 12 topic approvals currently match; 31/32 common approvals match, with music deliberately unavailable.
- A durable, locked experiment ledger reserves a conservative allowance before every paid call. It applies provider price ceilings, counts retries/fallbacks and retains reservations if billing is unknown. It never stores headers or keys.
- Generated batch/translation-output scripts are excluded from the website build. Maintained scripts remain checked; `.ts` imports are allowed under the existing no-emit configuration.

## Measurements

All live rounds bypassed approved-answer reuse. These are pipeline answer counts, not proof that every answer is correct. Music was declared an expected refusal before testing. The original denominator includes music; the adjusted denominator excludes it.

| Run | Cases | Answerable answered | Original denominator | Median / p95 | Known round cost | Cost per returned answer |
|---|---:|---|---|---|---:|---:|
| Baseline 1 | 26 | 16/22 (72.7%) | 16/23 (69.6%) | 16.7 / 27.2 s | $0.18666 including a repeated lost checkpoint | $0.01167 |
| Exploratory tiered pilot | 26 | 15/22 (68.2%) | 15/23 (65.2%) | 19.5 / 26.4 s | $0.22548 | $0.01503 |
| Interrupted repaired trial | 11 | 6/10 (60.0%), incomplete subset | 6/11 (54.5%) | 20.2 / 50.0 s | $0.10534 plus unknown final call | at least $0.01756 |

Both complete runs correctly refused all four expected refusal cases. The partial run reached music and refused it; it stopped before the personal/off-topic cases. It had one deadline error. The partial trial used the subsequently removed larger retry and is not a measurement of the final code.

Source shares count cited evidence entries, not sentences or correctness: baseline Quran 20/30 (66.7%), hadith 2/30 (6.7%), fatwas 8/30 (26.7%); pilot 22/36 (61.1%), 2/36 (5.6%), 12/36 (33.3%); partial 8/14 (57.1%), 0/14, 6/14 (42.9%). Tiering did not raise the hadith share in this trial.

Confirmed total experiment spending is **$0.51748087**. An aborted checker request has an unresolved **$0.113472** reservation, so conservative total exposure is **$0.63095287**, below $1.50. The durable ledger is stopped and must not be reset or its reservation released without billing evidence. Across 37 returned answers, total experiment cost per returned answer is at least **$0.01399**, or $0.01705 using conservative exposure. These are experimental returns, not 37 independently accepted answers.

The second baseline and second repaired rounds at least 30 minutes apart were **not run**. Approved reuse has unit tests and read-only approval/hash confirmation, but no separate paid timing/answer-rate measurement. Stored answers did not hide live failures. The 85% target remains unmet, and tiered mode stays **off by default**.

### Six answers read against their recorded sources

| Answer | Review result |
|---|---|
| Exact Quran preservation question | Quran 15:9 claim is supported. The Ibn Baz paraphrase removes the source's tentative qualifier about a possible reason; this is a confidence concern. |
| Zakah | Quran instructions are supported. Scholar summaries broaden specific ownership and earmarked-fund cases and omit conditions; full coverage is not established. |
| Fasting | Mindfulness claim matches 2:183. The draft infers a causal link between Ramadan fasting and revelation from 2:185; the source does not explicitly establish that causal claim. This fails manual acceptance. |
| Divorce | The verse-based permission and omitted scholar conditions raise a ruling-support concern despite the automatic checker accepting it. |
| Hijab | Recorded verse and explicitly attributed Ibn Baz explanations support the returned claims; this is a named view, not proof of consensus. |
| Suffering | The narrow claim about trials with good and bad matches 21:35. |

These concerns mean safety acceptance is incomplete. No source rule was weakened, but passing automated checks was insufficient. Further answer tuning stopped; these results cannot justify enabling tiered mode or claiming the root cause fully repaired.

## Verification

Final full suite: **543 tests pass in 42 files**. Regression coverage includes length, source competition/caps/order/empty tiers, video deadlines, topic matching/hash/source validation, incomplete OpenRouter responses and the shared spending guard. Existing unsupported-claim, invented-ID, unsafe-context, incomplete-answer, invalid-hadith, unapproved-scholar and writer/checker separation tests remain passing.

The original full checks failed on the maintained translation-validator type error. After Mo supplied the matching deployment error, commit `648b0fd` corrected its types without changing validation behavior. The current full typecheck and production build both pass; maintained scripts remain checked.

## What Mo must set in Vercel

Use the **Production** environment for project **al-bayan**. These are instructions only; no settings were changed.

| Variable | Value |
|---|---|
| `ASK_ENABLED` | `true` |
| `ASK_CLAIM_AUDIT` | `false` until real-model acceptance passes |
| `QURAN_API_ENV` | `production` |
| `QURAN_FOUNDATION_CLIENT_ID` | Existing production Quran client ID, entered privately |
| `QURAN_FOUNDATION_CLIENT_SECRET` | Matching production secret, marked sensitive |
| `QURAN_CHAPTERS` | Delete it or leave empty, allowing all chapters |
| `HADITH_SOURCE` | `library` |
| `SUPABASE_SECRET_KEY` | Existing Al-Bayan server key, marked sensitive |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Al-Bayan project URL, ref `jnietkyxgnocyizvjiel` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing Al-Bayan public key |
| `PREPARED_PUBLISHING_ENABLED` | `true` |
| `ASK_APPROVED_TOPICS` | `true` |
| `SHOW_AI_TRANSLATIONS` | `true` |
| `OPENROUTER_API_KEY` | Existing key, marked sensitive; never paste into chat |
| `OPENROUTER_REASONING` | `low` |
| `OPENROUTER_PRIVACY` | `zdr` |
| `ASK_VIDEO_BUDGET_MS` | `20000` |
| `MAX_VIDEOS` | `4` |
| `ASK_DEBUG` | `true` while checking refusal reasons; disable afterwards |

`ASK_TIERED`: **`false`**, because repeated benefit and safety have not been established. Keep `ASK_LEAN` off. Ensure `SCHOLAR_QUOTES`, `PREPARED_ANSWERS` and `VIDEOS` are not set to `off` if those features are wanted.

Remove stale `AI_MODELS`, `AI_MODEL`, `AI_FALLBACK_MODEL`, `AI_VERIFIER_MODELS`, `AI_VERIFIER_MODEL`, `AI_VERIFIER_FALLBACK_MODEL`, `AI_PROVIDER` and `AI_VERIFIER_PROVIDER` overrides to use the current OpenRouter defaults. Remove old `NVIDIA_*` settings rather than carrying an unused older configuration. The defaults are writer `google/gemini-3.5-flash-lite`, then `google/gemini-3.8-flash`; checker `google/gemini-3.1-flash-lite`, then `mistralai/mistral-small-3.2-24b-instruct`. No model is shared between roles.

Settings take effect on a new deployment. Nothing here has been pushed or deployed. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Finding a live refusal reason

In Vercel, open **al-bayan → Logs**, select the production deployment and `/api/ask`, then ask the failing public question once. Look for `ask refused: <reason>` and nearby `ask step:` entries. Logs use UTC, which is three hours behind Istanbul. A retry or `video_skipped_budget` line is not the final refusal when an answer succeeds. `ask pipeline failed:` indicates an error; `ask: AI busy` indicates the service/deadline path. Use runtime logs, not build logs. See [Vercel runtime logs](https://vercel.com/docs/logs/runtime).

## Remaining limits

- No supported explanation for why exactly five prayers was established; that question still refuses instead of inventing a reason.
- The writer can say `no_answer` even after evidence selection succeeds. This remains a refusal; it is not force-retried into answering.
- Relevant stored hadith and useful fatwa excerpts are not guaranteed for every question. No database search changes were made.
- Two AI models and six hand-read answers cannot prove religious correctness. Local results do not prove Vercel has the same code, keys, settings or latency.
- Missing billing evidence blocks additional paid tests. Manual review concerns block safety acceptance. The validator build blocker has since been resolved.
- Commit identity is provided in the delivery message; the report is committed with the implementation. The live website remains unverified until Mo deploys and checks it.

## General claim audit implementation and acceptance status

This follow-up strengthens the existing final screen under `ASK_CLAIM_AUDIT=true`, default **off**. It does not enable tiered mode, change model chains, change saved-answer review, add conversation memory or alter the response API/UI.

Each flattened draft claim gets C1/C2/etc. within that draft. Screening sees its exact source IDs, source text and surrounding context; adjacent context has no selectable ID. Results must cover every claim once, repeat its exact citation set and separately confirm direct support, audience, conditions, scope and causal meaning. Unknown IDs, duplicated/missing citations, missing/malformed decisions, inconsistent reason codes and uncertain results fail. Failed claims carry bounded (240-character) comparison explanations. Validated feedback goes into the existing writer correction as untrusted JSON comparison data, never new evidence. The complete corrected answer is screened again within the original deadline and draft-call cap.

Whole-answer support, required points, fairness and completeness still apply. Successful first drafts use the same number of calls and a 2,048-token checker output allowance. Cut-off output never passes. Debug messages contain only reason categories and elapsed timings. The old screen remains active when the flag is absent/false.

Final offline verification: **561 tests pass across 44 files**, full `npx tsc --noEmit --incremental false` passes, and `npm run build` passes (44 pages). Next's metadataBase warning is unrelated and non-blocking. New tests exercise strict parsing, all five negative/uncertain dimensions, identity/citation matching, preserved context, exact feedback, one full-answer correction, continued refusal, whole-answer checks and recorded-fixture integrity. Existing safety tests remain passing.

| Acceptance requirement | Current evidence |
|---|---|
| Fixed source set | 12 packages, 72 paired-language cases, source/provenance hashes verified offline |
| Deliberately wrong summaries rejected by real models | Not measured |
| At least 95% faithful summaries accepted by real models | Not measured |
| Matched median/p95 latency no more than 10% slower | Not measured |
| Two baseline and two repaired live rounds at least 30 minutes apart | Still incomplete |
| 85% answerable live questions answered | Not established |
| Saved-answer reuse measured separately | Still incomplete |
| Added experiment cost | $0.00; known total remains $0.51748087 plus the $0.113472 unresolved reservation |
| Live website acceptance | Not performed for this flag-off experimental change |

The evaluator was blocked before any request by the unchanged original ledger. Its record is `ask-repair-runs/claim-audit-evaluation.json`. Detection and latency must not be inferred from mocked tests, frozen labels or earlier live rounds. Do not enable the flag in production yet.

### Evaluation commands after billing reconciliation

Run from the Bayan repository. Do not delete/reset the ledger or release the reservation without verified billing evidence. No automatic reconciliation is supplied.

- Fixed-source paired old/new comparison: `npx tsx --conditions=react-server scripts/evaluate-claim-audit.ts --out=docs/ask-repair-runs/claim-audit-model-comparison.json`. Existing output cannot be overwritten. The runner measures every variant against both screens with the same default chains, retaining individual outcomes/timing/cost. An incomplete run cannot pass the detection gate. Full comparison needs 144 calls; the guard may stop sooner if the cap cannot cover them.
- Live baseline: `npx tsx --conditions=react-server scripts/measure-ai-mix.ts --phase=baseline --claim-audit=off --out=docs/ask-repair-runs/claim-live-baseline-1.json`.
- Live repaired: `npx tsx --conditions=react-server scripts/measure-ai-mix.ts --phase=repaired --claim-audit=on --out=docs/ask-repair-runs/claim-live-repaired-1.json`.
- Repeat both with distinct round-2 paths at least 30 minutes apart within each arm. Both arms keep tiered mode off, clear model overrides only in their test processes, use production Quran/all chapters/stored hadith and bypass saved answers. Music remains an expected refusal with the historical denominator retained.
- Measure approved reuse independently with the measurement command plus `--approved` and distinct output paths. Saved answers must not contribute to live answer rates.

All experiments share the original $1.50 ledger. If reconciliation or budget prevents these measurements, deliver **tested offline, general semantic improvement unverified, flag off**. The pushed commit identifies this follow-up in the delivery message. Vercel settings were not changed by this task.
