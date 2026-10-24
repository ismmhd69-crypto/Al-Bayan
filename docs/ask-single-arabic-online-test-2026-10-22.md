# Single Arabic online test, 22 October 2026

## Verdict

The latest worship attempt still did not complete. Quran and Sunnah explanations survived checking and remained visible; the final summary was withheld. This is a real completion failure, not a budget interruption. The system is not accepted as reliable.

## Scope and spending

Mo explicitly authorized up to 25 cents more for one Arabic attempt. The same current rich-answer pipeline, live retrieval, models, backups, source boundaries and zero-retention privacy were retained. Prepared reuse was skipped. No answer-system changes or deployment occurred during this test.

The fresh attempt cost **$0.04079065**, across nine settled HTTP 200 model dispatches: 66,950 input and 14,408 output tokens. No backup model was needed. The new allowance has **$0.20920935 unspent**, but testing stops after this one attempt as authorized. There is no new uncertain charge.

All earlier charges and the old unresolved $0.113472 reservation remain counted. Combined inherited and new exposure is **$0.82484193125** against the new cumulative ceiling of $1.03405128125. Both ancestor ledger hashes were verified unchanged. The prior budget-interrupted retest-6 cost $0.02231070 and remains a separate non-quality outcome.

Private evidence: `work/private-ask-evaluation/arabic-quality-20261022-retest-7/report.json`; request `a50b75af-3526-4a2d-81a3-145848778121`. Full original texts remain only in the existing short-lived private trace, not copied into this report.

## Observed result

Question: why Allah commands worship despite His self-sufficiency, and what benefit worship brings people. No reference hints were included.

| Measure | Result |
| --- | --- |
| Attempts | 1 |
| Completed answers | 0 |
| Retained explanations | Quran: 3 claims; Sunnah: 2 claims |
| Scholar explanations | 0 selected from 7 candidates |
| First checked section | 43.342 seconds |
| Total time | 57.298 seconds |
| Withdrawals | None |
| Corrections | One shared correction, used for source-copy overlap |

This exercised the same backend pipeline as the website, not a browser presentation test. Empty-group hiding, phone layout and reconnect behaviour were not verified here. The earlier unavailable Q51:57 citation did not recur; one attempt does not establish that the defect can never recur.

## Review against the original Arabic

All five displayed claims were read against their own supplied originals independently of the model's pass result. The Quran explanations on self-sufficiency (35:15), creation for worship (51:56) and worship toward taqwa (2:21) have direct support and address the two requested concerns. The Sunnah statement on worship without shirk is supported by HE65007.

The other Sunnah sentence has a supported core, but should preserve the specific burdensome walking-vow context of HE65936. It must not be read as saying ordinary effort in worship is unnecessary. Its selection as a general direct answer is less useful than its role as a limited illustration. The explanations remain brief attributed sentences; taqwa is not explained for a beginner. This is source-based review with a scope caution, not scholarly certification or an overall accuracy score.

The withheld reward summary also needs care with the warning against complacent reliance in the full HE65007 original. No serious unsupported personal instruction was displayed, but that does not approve the withheld summary.

## Exact completion blockers

1. **The checker ignored explicit coverage eligibility.** It mapped the first concern to summary C6, which combines citations assigned to different concerns. The request explicitly listed C1, C2 and C4 as eligible for that concern, excluding C6. Local validation refused this mapping with `rich_coverage_source_point_mismatch`. Suitable checked Quran explanations existed, but the model supplied an invalid completion map. Removing the guard would conceal the problem.
2. **The summary used an unexplained source.** C7 cited HE3419, which no surviving source explanation cited. It was available to the joint hadith/summary writer, so the new source-ID enum did not exclude it. The final `rich_summary_without_explanation` guard correctly withheld completion. Actual selection is not the same as actual explanation.
3. **The only correction was spent earlier on short formula overlap.** The copy detector flagged a short formula about Allah's right over servants in both hadith and summary. The writer returned a sentence patch. Only flagged sentence indices were applied, so its proposed change to the earlier mixed-concern summary sentence was intentionally ignored. The summary's coverage problem survived. This is not a reason to add unlimited retries.

There was no HTTP 400, writer transport failure, answer timeout or spending stop in this attempt. Four partial hadith-search failure diagnostics occurred, but eight candidates survived and supported hadith explanations appeared.

## Why scholars were absent

The selector marked all seven scholarly candidates unrelated. Their full Arabic passages were inspected. Most concern narrower topics, but several contain useful general teaching about divine wisdom, human benefit, or actions leading to mercy within those contexts. They should not automatically establish a universal conclusion; equally, calling all of them unrelated loses potentially useful background. This is a demonstrated selection-quality concern, not proof that a scholar section is mandatory or that suitable scholarship does not exist. No recovery ran because selected Quran/hadith evidence covered both concerns.

## Highest-value next work

- Reproduce the recorded final coverage response offline. Have completion mapping use eligible checked claims, or request a bounded mapping correction within a coordinated correction stage. Do not automatically approve semantic coverage from ID eligibility alone.
- After source drafts settle, constrain summary references to surviving explained references. When writing them together, detect unexplained citations before using the shared correction; repair the actual dependency, not just the wording.
- Replay the short-formula copy trigger and correction coordination. Avoid spending the only correction on ordinary shared terminology while still rejecting substantial source-copy presentation and malformed responses. No topic-specific exemption.
- Review background-versus-direct scholarly selection and preserve the narrow scope of illustrative hadith.

These are next repair priorities, not implemented fixes or promised completion improvements. No further paid attempts were run. English, German, unfamiliar questions, other pilot questions, durable streaming and production remain untested in this round.

**Acceptance: one live failure diagnosed; no reliability or release acceptance.**
