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
