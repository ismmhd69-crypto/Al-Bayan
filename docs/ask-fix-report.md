# Ask library repair report — 4 October 2026

## Delivery status

The confirmed source-wording fault is repaired and tested. The broader search, question planning, clarification and follow-up work is implemented behind `ASK_LIBRARY_FLOW`, **off by default**. `ASK_CLAIM_AUDIT` remains **off**. Neither the 85% answer target nor the real-model accuracy and speed gates have been proved for this implementation.

Work is isolated on `ask-library-reliability`, starting from `e0b487f`. Commit `9dd6213` contains the confirmed wording repair separately. The subsequent branch commit contains the experimental flow, evaluation tools and this report. Only this task's files are included. Main, translation work, database contents, hosting settings and deployment were not changed. Branch push details are recorded in the delivery message; pushing the repair branch does not establish acceptance on the live website.

## What was actually broken

Stored hadith supplied readable Arabic, but their authoritative English/German translations were absent. The writer request then removed Arabic anyway. The writer received source IDs and metadata without the words it was supposed to explain. Having the hadith in the database did not mean the model received it.

The repair preserves Arabic whenever the requested-language authoritative translation is absent, and for Arabic answers. A source without readable wording in its actual serialized payload cannot be dispatched. An eligible English translation still uses the existing short English payload. Scholar originals remain available. Unpublished or display-only AI translations are not promoted to authoritative evidence.

Exact recorded-source replay:

| Recorded run | Stored-hadith appearances, including retries | Missing wording before | Missing wording after |
|---|---:|---:|---:|
| Baseline 1 | 4 | 4 | 0 |
| Tiered pilot 1 | 28 | 28 | 0 |
| Total | 32 | 32 | 0 |

All 32 appearances were replayable from their recorded selected originals. This proves source delivery, not that the models understand every passage or produce accurate complete answers. Evidence: `ask-repair-runs/wording-replay.json`; reproducible with `scripts/replay-ask-wording.ts`.

## Library and retrieval audit

A read-only audit of the configured database at `2026-10-04T15:32:54.507Z` found:

| Sources | Published source rows | English translation rows linked to published sources | German translation rows linked to published sources | Published translation rows |
|---|---:|---:|---:|---:|
| Hadith | 14,629 | 7,461 | 7,461 | 0 in either language |
| Fatwa extracts | 7,255 | 7,255 | 7,255 | 0 in either language |

There are 7,324 total fatwa translation rows per language, including rows linked to other source publication states. The extra 69 per language are not counted as published-source coverage. These counts were read directly; no rows, rights or approvals were edited.

The same four fixed Arabic search probes compared the old first-hit scholar path with the revised bounded variant search:

| Probe | Eligible scholar results returned before | Returned after | Hadith results returned |
|---|---:|---:|---:|
| Intentions | 1 | 6 | 8 |
| Promises | 0 | 0 | 8 |
| Voluntary charity | 2 | 2 | 8 |
| Zakat amount | 2 | 6 | 8 |
| Total across probes | 5 | 14 | 32 |

The scholar return cap stayed six per reader call; the pipeline candidate/package caps stayed unchanged. The revised path examines up to four existing query variants, each within the existing mixed 50-result RPC ceiling, before applying the same title and eligibility rules. The promises probe still found no eligible scholar extract; Quran/hadith support and question completeness require separate selection.

Filter losses in these probes:

- Hadith: 234 distinct hits within each probe, aggregated across probes; 33 were another kind or unavailable when read, 5 exceeded the existing 2,500-character limit, and 18 were continuation reports. 178 survived reader filtering; 32 were returned under the existing eight-result cap. Each probe hit the RPC ceiling at least once.
- Scholar old path: 26 examined, one wrong-kind/unavailable, 20 removed by title relevance, five eligible and returned.
- Scholar revised path: 104 examined, one wrong-kind/unavailable, 76 removed by title relevance, 27 eligible and 14 returned under the reader caps. The zakat probe hit the mixed RPC ceiling.
- Missing wording and authenticity losses were zero in these four probes. That does not establish zero losses across the whole library. Rights-blocked rows are hidden by the RPC, so their count cannot be inferred from returned hits.

These are eligible retrieval candidates, **not independently confirmed answers or point coverage**. A candidate count includes neither semantic support nor completeness. Audit evidence is in `ask-repair-runs/library-audit.json`; the maintained read-only runner is `scripts/audit-ask-library.ts`.

## Broader flow implemented, awaiting live acceptance

With `ASK_LIBRARY_FLOW=true` in an isolated test process:

- Question planning identifies up to four requested points, essential question conditions and at most two interpretations. Each point has bounded source-language queries. Queries suggest search terms only; they are removed from the selector's question meaning and the writer's sealed evidence package.
- Each point searches Quran, hadith and scholar groups separately in parallel. Results are interleaved across bounded variants. Candidate ranking reserves places for different points within the current per-group caps. Search provenance is a ranking hint; only the independent selector can establish relevance, context safety and supported points.
- Stored scholar extracts are primary. Existing mapped source pages remain available. General live scholar search is used only for a point still missing after stored selection, inside the existing single selection correction and deadline. Invented IDs and unsafe context do not trigger this recovery.
- The request can carry at most four earlier **user** messages, each at most 500 characters. Only question planning receives them. Every answer retrieves fresh evidence; previous AI answers never become evidence. Prepared reuse is skipped for contextual follow-ups.
- Ambiguities can cover two meanings with separately identified, cited sentences when both are supported. Otherwise the response requests one short clarification. English, German and Arabic have localized prompts. Only reviewed neutral charity/zakat topic names become clickable choices; arbitrary model wording cannot become an unchecked religious statement.
- Clarifications save through the existing text exchange format. Reopened chats retain the question history and clarification text; their old clarification buttons are not reconstructed. Typed follow-ups still work. Older clients receive their supported `no_summary` status instead of an unknown status; their older fixed wording will not show the new clarification controls until refreshed.
- The API body allowance is 12,288 bytes to fit bounded Unicode history. Missing history remains compatible with the previous request shape; oversize/malformed history is rejected.
- A writer decline must name known missing requirement IDs and a bounded reason code. Malformed feedback fails. Valid selector/writer disagreement reuses the existing wording correction against the same sealed source package. No feedback supplies facts. Unsafe-context feedback is not retried into an answer. The whole corrected answer is screened again.
- Missing evidence, clarification, failure to produce a checked explanation and personal-scholar referral have distinct response paths. A writer decline after selection no longer pretends retrieval found nothing in the experimental flow.
- Direct answers still come first. Required points, conditions and procedures must be covered; extra explanation must add distinct supported detail. Sentence/list limits, citation checks, whole-answer fairness/completeness and approved-scholar support remain enforced.

The writer/checker model chains, 50-second default deadline, output allowances, four-draft maximum and selection/screening correction limits are unchanged. The new planning fields must fit the existing 900-token allowance; their real-model completion rate remains unmeasured. Tiered mode was not promoted. No embeddings, new providers, tafsir, indexes, chunking or wider final evidence limits were introduced.

## Offline proof

Final verification: **647 tests in 51 files pass**, `npx tsc --noEmit --incremental false` passes, and `npm run build` passes with 44 generated pages. Next's existing `metadataBase` warning is unrelated and non-blocking. A first build attempt could not use a dependency junction; an isolated local dependency copy resolved that workstation issue.

Regression tests cover actual empty stored-hadith writer requests; absent English/German translations and Arabic output; metadata-only payloads; per-point/group retrieval; first-hit search stopping; candidate reservation and caps; query hints excluded from evidence; exact decline feedback; successful correction and continued refusal; full rescreening; ambiguous meanings; user-only conversation references; personal context; multilingual/older-client clarification; and frozen evaluation boundaries.

Existing tests for invented citations, unsupported claims, changed audiences, lost conditions, inferred causes, unsafe context, invalid hadith, unapproved scholars, incomplete procedures and overlapping writer/checker models remain passing. Flag-off controlled request compatibility tests still pass. Generated batch exclusions remain unchanged; application code, tests and these maintained scripts are typechecked.

Mocked enforcement tests cannot prove that an actual model detects a subtle distortion. The previous 72-case claim-audit set and its real-model gates remain outstanding.

## Frozen evaluations and live results

The new manifest contains **44 cases**: the original 26 plus promises, rewording, charity ambiguity and follow-up sequences in English, German and Arabic. Expected points, source suitability and refusals were frozen before model calls. SHA-256: `0467f5de302aae918e36ad47ae36c43f771f6879c726e4384b3666ea1b784b00`.

Its expectations are review criteria, not proof that suitable full evidence exists for every point. Music was declared an expected safe refusal in advance. The original answerable denominator of 23 remains documented; the adjusted original denominator is 22.

`scripts/evaluate-ask-library.ts` uses the actual pipeline/request builder, records retrieved/candidate/selected/writer-stage point counts separately, and privately captures controlled model requests and responses without headers or keys. Search-stage counts are query provenance, not supported-point verdicts. Live mode bypasses saved answers; approved reuse is a separate mode. Clarifications, unreviewed answers, partial answers, complete supported answers and refusals remain separate. Round 2 requires a complete matched first round at least 30 minutes old. Output files cannot overwrite earlier rounds.

Acceptance requires at least 85% reviewed complete supported answers both in the new answerable set and in the original 22-case answerable subset, no known unsupported evaluated claims, no unsafe answers to expected refusal cases, completed repeated rounds, the agreed claim-audit gates, and at most 10% median/p95 slowdown. Extra successes cannot conceal missing original points. Manual original-source review is still required; the runner does not automatically approve answers or enable production flags.

**No paid live questions ran for this repair.** The attempt stopped before loading providers or issuing its first call: `unsettled earlier call; reconcile before continuing`. New answer rates, refusal frequencies, source shares and median/p95 times are therefore unavailable. `ask-repair-runs/library-evaluation-status.json` records the block.

Historical results below predate this repair and cannot be presented as its after-results:

| Earlier run | Cases | Answerable returned | Original denominator | Median / p95 | Known cost |
|---|---:|---|---|---|---:|
| Baseline 1 | 26 | 16/22, 72.7% | 16/23, 69.6% | 16.7 / 27.2 s | $0.18665505, including repeated checkpoint work |
| Tiered pilot | 26 | 15/22, 68.2% | 15/23, 65.2% | 19.5 / 26.4 s | $0.22548205 |
| Interrupted repaired trial | 11 | 6/10, 60.0%, incomplete subset | 6/11, 54.5% | 20.2 / 50.0 s | $0.10534377 plus unresolved final call |

Historical cited source shares: baseline Quran/hadith/fatwa 20/2/8 (66.7%/6.7%/26.7%); pilot 22/2/12 (61.1%/5.6%/33.3%); partial trial 8/0/6 (57.1%/0%/42.9%). These count evidence entries, not correct claims.

Earlier baseline final failures included attribution correction, incomplete direct evidence, copied wording, multiple sentences in one claim and the intentional why-five-prayers source gap. Music, personal circumstances and two off-topic cases were expected refusals. The interrupted trial had a deadline failure. Earlier six-answer original-source review found a fasting causal inference, a removed tentative qualifier in preservation, and scope/condition concerns in zakah/divorce; it did not establish safety acceptance. Six new successful answers cannot be reviewed because the new live run has not occurred.

Both second baseline/repaired rounds at least 30 minutes apart remain incomplete. Separate saved-answer measurement, multilingual original-source review and claim-audit real-model detection (all deliberately wrong summaries rejected, at least 95% faithful accepted) remain incomplete. The 85% reliability target is **unproved**, and earlier returned-answer rates fell short.

## Spending

New paid model spending: **$0.00**. The original shared ledger remains byte-for-byte unchanged, SHA-256 `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.

Confirmed lifetime experiment cost is **$0.51748087**. The unresolved call retains **$0.113472**, for conservative exposure **$0.63095287**, under the original **$1.50** cap. The arithmetic unreserved allowance is $0.86904713, but **no spending is authorized by the guard while billing is unresolved**. That amount is not a promise that every required round can fit its conservative call reservations.

Across the earlier 37 returned answers, experiment cost per return was at least $0.01399 ($0.01705 using conservative exposure). Total cost per independently accepted successful answer is **unavailable**: those 37 returns were not all independently accepted. The new evaluator reports round cost per accepted answer only after complete original-source review.

All evaluation scripts now locate the main checkout's original ledger through Git's common directory, including when launched from a worktree. They cannot silently start from the worktree's copied ledger. Reservations, retries, fallback charges, provider price ceilings and unknown-cost stopping remain intact. Reconciliation requires billing evidence for the old call; the latest production logs do not settle it. Do not delete the stopped status or reservation without that evidence.

## Reproducible configuration and production differences

The local environment inspected for this work uses `HADITH_SOURCE=hadeethenc`; that selects the external catalogue, not the imported hadith library. Production Quran and all chapters were locally configured, with no local model overrides. `SHOW_AI_TRANSLATIONS=false` was local display configuration; it affects display, not source authority. The deployed revision, flags, keys and source mode were **not independently verified** in this task. Screenshots or one good answer cannot settle those differences.

`scripts/ask-test-profile.ts` supplies one process-only matched profile: production Quran, all chapters, stored hadith, current default nonoverlapping chains, low reasoning/ZDR, prepared publishing on, scholars on, tiered/lean/audit off. Only the baseline/repaired `ASK_LIBRARY_FLOW` value changes. Environment files are not edited. The shared ledger is installed before paid providers or network work.

Mo's Vercel checklist below is documentation, **not an instruction to enable the experimental flow now**. Use project `al-bayan`, Production; apply changes yourself after the appropriate review and deploy a reviewed revision explicitly.

| Variable | Required profile / safe rollout value |
|---|---|
| `ASK_ENABLED` | `true` |
| `ASK_LIBRARY_FLOW` | `false` or absent until the new acceptance gates pass |
| `ASK_CLAIM_AUDIT` | `false` until its separate real-model gates pass |
| `ASK_TIERED` | `false`; keep current mode unchanged |
| `ASK_LEAN` | `false` or absent |
| `QURAN_API_ENV` | `production` |
| `QURAN_CHAPTERS` | Absent or empty, allowing all chapters |
| `QURAN_FOUNDATION_CLIENT_ID` | Existing production ID, entered privately |
| `QURAN_FOUNDATION_CLIENT_SECRET` | Matching production secret, sensitive |
| `HADITH_SOURCE` | `library` for the matched library profile |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Al-Bayan project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing public key |
| `SUPABASE_SECRET_KEY` | Existing server key, sensitive |
| `OPENROUTER_API_KEY` | Existing key, sensitive; never paste into chat |
| `OPENROUTER_REASONING` | `low` |
| `OPENROUTER_PRIVACY` | `zdr` |
| `PREPARED_PUBLISHING_ENABLED` | `true` |
| `ASK_APPROVED_TOPICS` | `true` |
| `SHOW_AI_TRANSLATIONS` | Existing desired display setting; `true` shows eligible display translations, not authoritative evidence |
| `SCHOLAR_QUOTES` | `on` or absent |
| `SCHOLARS_LIVE` | `on` or absent; experimental flow invokes only unresolved coverage |
| `PREPARED_ANSWERS`, `VIDEOS` | Do not set `off` if these existing features are wanted |
| `ASK_VIDEO_BUDGET_MS`, `MAX_VIDEOS` | Existing `20000` / `4` settings; tiered mode stays off |
| `ASK_DEADLINE_MS` | Leave existing/default value; default 50000, unchanged |
| `ASK_DEBUG` | `true` for controlled diagnosis, then disable |

Obsolete override names to remove when matching defaults: `AI_MODELS`, `AI_MODEL`, `AI_FALLBACK_MODEL`, `AI_VERIFIER_MODELS`, `AI_VERIFIER_MODEL`, `AI_VERIFIER_FALLBACK_MODEL`, `AI_PROVIDER`, `AI_VERIFIER_PROVIDER`. Old `NVIDIA_*` settings are unnecessary for this OpenRouter profile. This task removed overrides only in test processes, not hosting.

Source-confirmed default writer chain: `google/gemini-3.5-flash-lite`, then `google/gemini-3.8-flash`. Checker: `google/gemini-3.1-flash-lite`, then `mistralai/mistral-small-3.2-24b-instruct`. No overlap was introduced. These defaults are unchanged in this repair.

To independently check a deployed configuration after a deliberate rollout, match the production commit to the reviewed commit, check Production variable names privately, and inspect controlled runtime diagnostics for revision, model chains, active flags and `hadith_mode_library`. A deployment with `revision=unknown` is not proof of the reviewed revision. No secret values or visitor text are needed for this check.

## Logs and evaluation commands

In Vercel, open **al-bayan → Logs**, select the intended production deployment and `/api/ask`. Use function/runtime logs rather than build logs. `ask diagnostic:` includes request ID, revision, model chains, flags, stage, bounded failure/category code and elapsed milliseconds. Retrieval diagnostics show source mode, missing configuration and numeric filter/cap losses. Writer decline codes distinguish missing evidence/conditions, ambiguity, unsafe context and inability to paraphrase. No visitor questions, answer text or excerpts are logged.

`ask refused: <reason>` identifies a final failure unless followed by a successful recovery. `selection_retry_started_*`, filter-loss counts and skipped videos are warnings/attempts, not independent final refusals. A completed checked answer must survive optional video failure. `ask pipeline failed:` / busy indicate operational failure rather than a correct evidence refusal. All source/claim safety gates remain strict.

After billing reconciliation, from this branch:

```text
npx tsx --conditions=react-server scripts/replay-ask-wording.ts --out=docs/ask-repair-runs/wording-replay-new.json
npx tsx --conditions=react-server scripts/audit-ask-library.ts --out=docs/ask-repair-runs/library-audit-new.json
npx tsx --conditions=react-server scripts/evaluate-ask-library.ts --arm=baseline --round=1 --mode=live --out=work/private-ask-evaluation/baseline-live-1.json
npx tsx --conditions=react-server scripts/evaluate-ask-library.ts --arm=repaired --round=1 --mode=live --out=work/private-ask-evaluation/repaired-live-1.json
```

The first two commands have no model calls or database writes. For round 2 use a fresh output name, `--round=2`, and `--previous-round=work/private-ask-evaluation/<matching-first-round>.json`, at least 30 minutes later. Run `--mode=approved` with separate paths for saved reuse. Add `--dry-run` to the evaluator for manifest-only validation without calls. Raw controlled captures stay private and ignored; publish only sanitized aggregate results after review. Do not overwrite previous rounds or freeze new expected labels after seeing results.

Use the existing `scripts/evaluate-claim-audit.ts` separately for its 72-case paired old/new model comparison. All experiments share the same original cap and stop rules. If reservations cannot cover further work, report incomplete results and keep both experimental flags off.

## Remaining library and product limits

- Quran verses and authoritative translations are loaded; tafsir is not integrated.
- Published fatwas are short extracts, at most 600 characters. They may omit a condition or procedural step contained in the full ruling.
- 7,168 published hadith have no English or German translation row in this audit; the 7,461 rows that exist are unpublished. Original delivery is repaired, but source eligibility, search recall and model comprehension still limit usable coverage.
- The mixed 50-result search ceiling still allows cross-kind competition. No database/index change was made, and reader-level separation cannot recover rows the RPC never returns.
- Title/word matching remains a recall limit. The revised probes improved scholar recall but did not prove direct support or complete answers. Missing configuration can still disable source groups.
- The why-five-prayers reason gap and reviewed unresolved music disagreement remain safe refusals. Personal rulings still require a qualified scholar.
- History is limited to four user messages; unresolved references request clarification. It is not unlimited or perfect conversation memory.
- Real models may still fail planning, select incomplete evidence, decline a usable package or produce a distortion missed by the legacy screen. The stronger audit's detection and speed gates remain unverified.
- A successful build, mocked tests, library size or one good answer cannot establish that Ask is reliable. The live site remains unchanged and unverified by this branch delivery.
