# Ask reliability findings

Investigation started 2026-10-04. This document is written before answer-behaviour repairs. The first baseline is complete; later required rounds were blocked by the spending stop.

## Exact failure reproduced

The live pipeline (prepared answers bypassed) refused **How do we know the Quran was not changed?** in 20.7 seconds, costing $0.00793. Final reason: `no_summary_after_draft_source_attribution`.

The first draft described Quran 10:15 as something the Prophet explained, without a hadith citation. The corrected draft mentioned the Quran in a sentence citing only Ibn Baz. The current attribution check rejects both. This is a writing/retry-guidance failure; the safety check was not bypassed. Full inputs, sealed sources and both drafts are in `ask-repair-runs/baseline-1.json`.

## Confirmed code findings

| Finding | Root cause | Repair boundary |
|---|---|---|
| `claim_length` in previous runs | Code caps every sentence at 300 characters and each retained list item at 160. The initial writer prompt states the list limit but omits the sentence limit; its text schema has no maximum length. | State the existing limits before the first draft and in its schema. Do not truncate or relax them. |
| Quran/hadith compete with fatwas | Tiered code already exists, but is off by default. Separate tier lists and 2/2/3 caps are implemented. | Validate and improve the existing implementation; enable by default only if repeated measurements justify it. |
| Suggested topic questions use live writing | `askPreparedOnly` consults common answers and `prepared` approvals only. Topic answers have no local `questions` field; their published question wording lives in `topic_texts`. | Match published topic questions read-only, require the topic approval hash and independent same-question check, then use the existing source-validating loader. |
| Optional videos can delay a checked answer | The answer awaits video search and title checking. The title request has an abort signal, but there is no independent race ensuring optional work ends before returning. | Bound the entire optional stage by the remaining answer deadline and return the checked answer without videos on failure. |
| Prayer always refused | `requiredSourceItemsPresent` unconditionally rejects why-five-prayers questions because no source explaining that reason was established. | Keep the gate. Number/reward sources cannot justify an invented reason. Report this source gap. |
| Build includes other sessions' temporary scripts | The default `**/*.ts` includes generated batch and temporary translation scripts with syntax errors. | Exclude only these temporary patterns; do not edit their contents. |
| Old spending cap is per process/question | The measurement checks totals only between questions; retries/fallbacks can overshoot and separate rounds reset the total. | A shared durable ledger reserves before every HTTP call, enforces provider price ceilings, records `usage.cost`, locks concurrent runs and stops on unknown billing. |

## Evaluation rules fixed before testing

26 cases: the original 20 plus six additions, with the exact failing question first. Music remains an expected safe refusal because its reviewed view decision is unresolved. Both the original denominator and the denominator excluding music will be reported. Personal circumstances and off-topic questions must never receive answers. Runtime failures are not counted as correct refusals. Live-pipeline measurements bypass all prepared/topic answers; approved-answer reuse is measured separately.

All rounds use the same default OpenRouter chains, production Quran access, all chapters, stored hadith, low reasoning and zero-data-retention routing. Price ceiling: $2/m input tokens, $10/m output tokens, $0 request fee, identical in all rounds. Spend reservations count UTF-8 bytes, framing allowance, maximum output including reasoning, and a 2x margin. No more calls after unknown cost. No keys, visitor questions or database writes.

## Baseline counts

Round 1: 26 cases, 16/22 answerable answered (16/23 using the historical music denominator), all 4 expected safe refusals, no timeout/error, median 16.7 s, p95 27.2 s. Per-row cost $0.17832; the experiment ledger is $0.18666 because one completed call's result could not be checkpointed during a transient Windows file error and was repeated. Every call's billing remains accounted for.

| Final reason or outcome | Count | Failed step | Root cause |
|---|---:|---|---|
| `no_summary_after_draft_source_attribution` | 1 | draft | Writer and its correction break existing source-attribution rules. |
| `required_source_items_missing` | 1 | after selection | Intentional why-five-prayers source gap. |
| `evidence_insufficient` | 2 | selection retry | Zakah and the exact home suffering question lacked a complete direct selected package. No evidence gate will be relaxed. |
| `scholar_difference_unresolved_known_topic` | 1 | frame | Intended unresolved music refusal. |
| `no_summary_after_screening_retry_multiple_sentences` | 1 | screening correction | Correction put more than one sentence inside a claim. Existing sentence rule applies to retries too. |
| `no_summary_after_draft_copied_source` | 1 | draft | Sword question's writer copied source wording twice. Keep copy protection. |
| `personal` / `ask_scholar` | 1 | frame | Correct referral for personal divorce circumstances. |
| `out_of_scope` | 2 | frame | Correct off-topic refusals. |

`scholar_dropped_by_rules` occurred on successful interest answers and is a warning, not a final refusal. Selection-retry diagnostics are attempts, not separate failed questions. The older `claim_length` failure did not reproduce in round 1; the omission in its initial writing contract is confirmed in code and now has a regression test.

Round 2 was not run. A later checker call hit the 50-second deadline without returning a final cost. The shared ledger retained its $0.113472 reservation and stopped further paid work, as required. Known total across all experiments is $0.51748087.

## Additional reproduced faults and stop

The tiered pilot's intentions selection ended with `finish_reason=length`: 2,947 of 3,072 output tokens were hidden reasoning. The old tolerant JSON extraction could return an inner candidate object from that incomplete response, producing an evidence-insufficient refusal despite Bukhari 1 being retrieved. Final code rejects cut-off responses and uses the existing fallback chain. The tested larger same-model retry also cut off, consumed 5,895 reasoning tokens out of 6,144 and contributed to the deadline; it was removed.

Six returned answers were read against the sealed evidence. Fasting inferred a causal relationship not explicitly stated in its verse; preservation dropped a tentative qualifier; zakah/divorce summaries raised scope or ruling-support concerns. Stronger prompts did not establish safety acceptance. See the final report. Do not describe automated answer counts as religious correctness. Further paid and answer-behaviour experiments stopped.

## General claim audit follow-up, 2026-10-04

The selector already checks source context and the final checker already asks for audience, conditions and scope preservation. However, the final response contains only a per-sentence support verdict and an answer-wide context verdict; it does not identify the changed audience or qualifier. The screening correction gives generic advice rather than the failed comparison. Mocked tests establish rejection of a checker failure, not that the model notices subtle distortions.

The experimental audit replaces the bare verdict with draft-local claim IDs, exact cited IDs, five separate decisions and bounded failure feedback. It reuses the final checker and its existing correction. Every field must pass. The corrected whole answer is screened again; no failed sentence is silently removed to publish the rest. Audit mode is off by default, and approved saved answers retain their existing gates.

A frozen set contains four Quran, four hadith and four scholar packages taken verbatim from recorded candidates, each with paired faithful and incorrect summaries in English, German and Arabic (72 cases). Provenance hashes tie each package back to its original run/row. Cases cover addressed groups, missing qualifications, case scope, tentative wording, named-scholar attribution, causal inference and mixed supported/unsupported clauses. Labels are authored comparison expectations, not a scholar review or evidence of model performance.

The evaluation runner stopped before loading the model or making a paid request: `unsettled earlier call; reconcile before continuing`. The ledger SHA-256 was identical before and after. Real-model detection, unnecessary refusal and latency results remain unavailable. No new spending or change to the $1.50 cap occurred.

## Precise refusal diagnostics follow-up, 4 October 2026

Diagnostics now identify the exact source-selection and screening rejection branch under `ASK_DEBUG`, without visitor or source content. Pre-audit commit `648b0fd` and current flag-off builders send identical controlled model requests; successful and refusing outcomes are preserved. Historical baseline selections also replay unchanged. See `ask-diagnostics-report.md`. This is a diagnostic delivery, not a confirmed fix for the latest production promises failure. Paid reproduction and real-model acceptance remain blocked by the unchanged shared ledger; additional experiment cost is $0.00. Claim audit remains off by default, and no model/prompt/schema/limit or Vercel setting was changed.
# Library evidence-path repair (2026-10-04, isolated branch)

The writer serializer removed Arabic from Quran and hadith regardless of whether a usable translation existed. The stored hadith reader correctly supplied originals but no authoritative translations. Historical recorded writer requests therefore lost the only readable passage: 4/4 stored-hadith appearances in baseline-1 and 28/28 in pilot-1. These count appearances including retries, not distinct questions or successful answers.

The repair retains original Arabic whenever the requested-language authoritative translation is absent, and for all Arabic answers. Metadata-only sealed sources now fail before model dispatch. Display-only AI translations still enter only after screening; their publication and approval states are unchanged. Regression tests inspect the actual writer request, alongside an English/German/Arabic serialization matrix. This proves wording delivery, not model understanding or religious answer accuracy.

## Library reliability implementation and measured boundaries

Read-only audit at `2026-10-04T15:32:54.507Z`: 14,629 published hadith and 7,255 published fatwa extracts. English/German translation rows linked to published sources number 7,461 each for hadith and 7,255 each for fatwas; none of those translation rows are published. Total fatwa translation rows are 7,324 per language, including other source publication states. No publication, rights or approval status was changed.

Local `HADITH_SOURCE=hadeethenc` selects the external service rather than this stored library. The matched test profile explicitly selects `library` in its process. The deployed configuration/revision was not independently verified in this task.

Four fixed Arabic probes demonstrate reader recall differences, with independent relevance still unmeasured:

| Probe | Old eligible scholar results returned | Revised results returned | Hadith returned |
|---|---:|---:|---:|
| Intentions | 1 | 6 | 8 |
| Promises | 0 | 0 | 8 |
| Voluntary charity | 2 | 2 | 8 |
| Zakat amount | 2 | 6 | 8 |

Old scholar search stopped after its first nonempty RPC result, even when the result contained a competing kind or all title-filtered extracts. Revised search examines at most four bounded variants in parallel within the existing 50-result mixed ceiling and interleaves before filtering/capping. Reader return caps and final evidence caps are unchanged. Across these probes, examined scholar hits rose from 26 to 104, eligible hits from 5 to 27, and returned results from 5 to 14. Title losses were 20 before and 76 after; the latter reflects examining more hits, not weakening the filter. Wrong-kind/unavailable loss was one in either path. Promises scholar retrieval remains a gap in this probe.

The hadith reader already searched variants in parallel. Its four probes examined 234 distinct hits within individual probes (aggregated, not globally unique), lost 33 to mixed-kind/unavailable rows, five to the existing length rule and 18 to continuation reports; 178 were eligible and 32 returned under caps. Every probe encountered a 50-result ceiling. Missing text/authenticity losses were zero in these probes, not proven zero across the library. Rights-blocked rows hidden by the RPC are not measurable from these hits.

Recorded writer replay confirms missing hadith wording **32 before → 0 after**, with no missing replay originals. These are appearances including retries, not answer counts. Evidence files: `ask-repair-runs/library-audit.json` and `ask-repair-runs/wording-replay.json`.

The experimental `ASK_LIBRARY_FLOW` adds per-point/group search, candidate reservation, bounded user-only history, two-meaning planning, localized clarification, and validated selector/writer disagreement feedback inside existing corrections. Query provenance never grants direct support. Search hints/history are excluded from answer evidence. Whole corrected answers are screened; failed claims are not removed to publish the remainder. `ASK_LIBRARY_FLOW` and `ASK_CLAIM_AUDIT` remain off by default; tiered mode and model/deadline/token/retry limits are unchanged.

The 44-case multilingual manifest was frozen before calls, including the original 26, promises, equivalent wording, charity ambiguity and follow-ups. Complete accepted success requires original-source review, all requested points, and support; clarifications and partial/unreviewed answers remain separate. Music's expected refusal and original 23/adjusted 22 denominators remain recorded. The 85% target must pass both original and expanded answerable subsets.

Final offline proof: 647 tests across 51 files, full TypeScript check and production build pass. Actual model evaluations stopped before the first call due to the old unsettled reservation. No new answer-rate, refusal-frequency, source-share, accuracy or latency result is available. The original ledger hash is unchanged; new model cost is $0.00. Repeated rounds, saved/live separation measurements, six new original-source reviews and claim-audit detection/speed gates remain incomplete. See `ask-fix-report.md` for complete configuration, costs and rollout limits.

