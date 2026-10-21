# Combined evidence coverage, 21 October 2026

Local request: `a11ef261-1332-43c3-9029-1bb700a2ac87`.

## Proven behaviour

- No context-lookup crash or overall timeout. The terminal result was incomplete after 52.139 seconds.
- Search initially returned 16 Quran verses, seven hadith and two scholarly excerpts. The two scholarly excerpts received zero reranking scores. Recovery found two more excerpts and then no further results. Final selection rejected the scholarly excerpts as unrelated; a missing scholar section was not the terminal cause.
- Final selected evidence was Quran 51:56 as direct support, plus HE65007 and HE65936 as related background. This attempt did not retrieve the broader Quran evidence present in an earlier request.
- Initial summary repeated the Quran explanation and cited surrounding-verse material under Q51:56. The model's broad support verdict failed to identify that citation issue. A software repetition finding triggered correction.
- The correction removed the repeated Quran recap. All final model checks returned yes, but richCoverageChecked rejected the coverage row because it demanded a direct-evidence reference in every mapped sentence, including background explanations and the summary. This contradicted the combined-evidence design.

## Narrow shared repair

Validate source-to-question relevance for every mapped claim, then require direct evidence for the coverage row as a whole. Background-only rows still fail. Unknown, unrelated and unexplained summary citations still fail; explicit incomplete/uncertain coverage and lost conditions still fail. Every claim still undergoes the independent original-text, attribution, scope, causality and usefulness checks. Update the checker contract to match this rule.

111 focused tests passed across five files, including direct-plus-background coverage, background-only rejection, unrelated-point rejection, missing conditions, and a negative semantic scope assessment overriding a valid coverage map. TypeScript checking passed. No paid request ran.

## What this does not prove

The last model verdict is not independent scholarly acceptance. Its earlier acceptance of surrounding-verse material and of broad wording drawn from a narrow example remains an accuracy concern. This repair fixes the coverage contract, not that semantic reliability problem. Neither a replay that now passes the map nor a future complete label proves the religious answer is adequate.

Source discovery remains inconsistent. The complete search-engine acceptance gates, translation issues, guarded live comparisons, source-faithfulness review and owner acceptance remain open. No production changes.
