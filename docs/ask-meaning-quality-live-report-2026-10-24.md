# Arabic live test: completed technically, failed source-faithfulness review

24 October 2026. Fixed approved sample: R03 (non-Muslim parents), then F13 (honesty and disclosing defects in selling), within the existing remaining allowance. No added funds. Current models, privacy and source boundaries retained. No deployment or answer-system edits during this evaluation.

## Outcome

| Measure | Result |
|---|---|
| Planned / attempted / reviewed | 2 / 1 / 1 |
| Technically completed | 1 of 1 attempted |
| Passed both completeness and source-faithfulness | 0 of 1 reviewed |
| Not tested | F13; stopped after R03's source-review failure |
| First checked section | 82.177 seconds |
| Total | 123.674 seconds |
| Model dispatches / logical requests | 16 / 15 |
| Input / completion tokens | 213,431 / 25,869; 239,300 total across all calls |
| Writer correction requests | 0 |
| Configured backup calls | 1 |
| New actual cost | $0.0936866, approximately 9.37 cents |
| Remaining evaluation allowance | $0.1249730525, approximately 12.50 cents |

These are one question's results, not an overall religious-accuracy percentage. The answer had useful content and addressed both concerns, but did not pass the stricter source-faithfulness requirement. All 16 charges settled. The original unresolved reservation remains counted. Fifteen historical ledger ancestor hashes were verified unchanged. The largest final primary-check reservation alone was $0.145395, above the remaining allowance; there is also no safe basis for promising a second full attempt within the remainder.

## What worked

- Quran and directly relevant named scholarship were retrieved. Ibn Baz 991 explicitly addresses non-Muslim parents, so the answer no longer had to rely on identifying their religious status from a verse's surface wording alone. [Published original](https://binbaz.org.sa/fatwas/991/الواجب-نحو-الوالدين-اذا-قصرا-في-الطاعة).
- Quran, scholarship and final summary were emitted, in order. Prepared reuse was skipped. The same active rich pipeline was used with live retrieval and an explicit parent signal, without the old artificial total cutoff.
- The final summary was produced despite the hadith source search failing. The stored hadith group was `search_failed`, not a finding that no relevant Sunnah exists. Its empty heading is hidden by the existing tested presentation rules; this run was through the pipeline, not an independent browser visual acceptance test.
- There was no blanket refusal, unnecessary referral or disconnected unfinished terminal result in this attempt.

This is an observed successful completion, not proof that a particular code edit caused better retrieval or reliable correctness.

## What failed

### A Quran sentence borrowed a wider rule from outside its own citations

The third Quran claim forbids parental obedience in disobedience generally, while citing only 29:8 and 31:15. Those supplied verses specifically describe pressure toward association with Allah. The broader prohibition is stated in the selected scholarly material, but that material is not cited by this sentence. This is an unsupported extension of its own citation scope, not evidence that the broader religious rule is false. [29:8](https://quran.com/29/8), [31:15](https://quran.com/31/15), [the broader scholarly statement](https://binbaz.org.sa/fatwas/2846/طاعة-الوالدين-تكون-في-المعروف).

The final summary's first sentence has a different citation set, including relevant scholarship. It should not automatically inherit the Quran-only sentence's citation failure.

### A practical financial qualification disappeared twice

The source on thanking parents conditions financial assistance on need. Both the scholarly explanation and the second summary sentence omit that condition. These have supported cores with missing practical qualifications. Neither is automatically classified as a completely invented doctrine or an explicit unconditional financial obligation. [Ibn Baz 2844](https://binbaz.org.sa/fatwas/2844/كيفية-شكر-الوالدين).

### One strength-of-obligation wording remains unverified

The third scholarly sentence adds explicit obligation wording about continuing ties. Its refusal-of-wrongdoing core is supported; the precise legal strength and practical qualification deserve closer wording review. Do not turn the source's qualification about continuing practical contact into a claim that parental rejection ends every duty of kindness. [Ibn Baz 2846](https://binbaz.org.sa/fatwas/2846/طاعة-الوالدين-تكون-في-المعروف).

### Checking and speed remain inadequate

Both checking stages allowed the cited-scope problem through. No writer correction was requested. Negative-finding receipts cannot prevent an incorrect positive approval: they validate a rejection's evidence, not the truth of an approval.

The hadith retrieval diagnostics recorded `hadith_partial_search_failed` twice. The underlying cause is not established by this report. This is a retrieval failure, not a relevance verdict. First checked output after 82 seconds and completion after 124 seconds remain slow. The 30% earlier-first-section target is not established; this was not a matched timing experiment.

## Claim review counts

All nine displayed claims, including the Quran explanations emitted before the final summary, were reviewed against their own Arabic originals. Their classifications are:

- 5 supported without a specific source defect identified in this review.
- 2 supported cores missing an important practical qualification.
- 1 unsupported extension of its own cited scope.
- 1 not independently verified regarding added strength-of-obligation wording.

This is an assistant source-based assessment, not independent scholarly certification. The first Quran sentence also has awkward Arabic; the second summary sentence awkwardly combines obedience, spending and speech. Most of the summary repeats earlier explanations. No rate of false rejection can be inferred from a run with no substantive withholding.

## Next priorities

1. **Positive approvals:** the highest-value next investigation is why the checker approved the expanded Quran claim and dropped practical condition. More negative-response formatting work alone cannot fix this. Reproduce these exact source comparisons offline, then require separately approved real-model evidence before claiming a repair.
2. **Source scope and qualifications:** keep source-family explanations within their own citations and retain practical limits in both explanation and summary. Existing relevant scholarship should support the wider rule in its own section, rather than silently lending authority to another section.
3. **Retrieval reliability:** diagnose the hadith failure separately from semantic checking. Do not fill the gap with unsupported material.
4. **Cost and time:** repeated source/answer checking consumed over 213,000 input tokens. Smaller requests may help, but savings and accuracy preservation remain unproven; no new experiment is authorized here.

The second question was not run. The new ledger is stopped after review, and the runner will not continue it automatically. No further paid calls, new repair, model switch, source import, storage activation or production release occurred.

Private evidence: `work/private-ask-evaluation/meaning-quality-live-R03-20261024.json`; request `5de3c2cd-01b6-4e02-ba21-4a7d9a9372b5`. Spending: `docs/ask-repair-runs/arabic-quality-20261024-meaning-quality-live-spend.json`.
