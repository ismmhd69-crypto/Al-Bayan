# Fresh Arabic Ask online test — 22 October 2026

## Result

**Ask is still failing ordinary answerable questions.** All five requested Arabic pilot questions were retested with live sources and the current active rich-answer pipeline. Four ordinary questions finished incomplete. The personal divorce case correctly returned a scholar referral.

This run was not interrupted by the spending guard. All 43 model dispatches returned HTTP 200 with settled cost. The completed five-question batch cost **$0.16381065 (16.38 cents)** of Mo's newly authorized additional 50 cents. No answer-system code, model, privacy setting or experimental switch changed during the run.

The evidence identifies a regression in the latest citation protection, alongside older writing and semantic-checking problems. More online tests alone will not repair these failures.

## Same five questions

| Question | Final result | First checked section | Total time | Cost |
| --- | --- | ---: | ---: | ---: |
| Worship despite Allah's independence | Incomplete; no checked section | None | 83.849 s | $0.05461585 |
| Non-Muslim parents and obedience | Incomplete; no checked section | None | 57.270 s | $0.04359540 |
| Fasting and good conduct | Incomplete; Quran section briefly displayed, then withdrawn | 27.724 s | 38.708 s | $0.02790915 |
| Managing anger without harming others | Incomplete; Quran section briefly displayed, then withdrawn | 49.497 s | 59.264 s | $0.03526885 |
| Particular triple-divorce incident | Appropriate referral; did not determine marriage status | Not applicable | 3.139 s | $0.00242140 |

**Useful completed answers: 0/4 ordinary attempts (0%). Appropriate personal-case referrals: 1/1.** These are separate behaviour measurements. They are not an overall religious-accuracy score. Four claims appeared transiently across two sections; both sections were later withdrawn, so neither is counted as a completed answer. Their Arabic originals and checker outputs were reviewed, without accepting the broader wording as fully source-faithful or claiming scholarly certification.

The same visitor questions were used as before, but live source selection and generated wording varied. This is not a frozen-evidence comparison proving causality for every changed outcome. The remaining forty-five bank questions remain untested.

## What is actually going wrong

### 1. The latest citation guard has an unnecessarily strict punctuation rule

The server requires the checker's reconstructed clauses, joined together, to equal the complete sentence. The checker frequently omitted a full stop or comma while retaining the words. That caused real sections to be rejected and earlier sections to be withdrawn.

Offline replay of the exact live responses found **19 claim assessments whose reconstruction mismatch consisted only of punctuation**. These are assessment occurrences across source and combined checks, not nineteen unique answers, and they can overlap other genuine failures. For example, the corrected worship statement lost its final full stop in the checker output and failed the server comparison. The earlier worship draft also lost substantive words, which correctly needed rejection.

This is a bug in our new protection. It must distinguish harmless punctuation differences from missing words, negation, conditions or changed certainty. **Removing this bug alone would not make the batch pass**: support, coverage and summary problems also occurred.

### 2. The AI checker still approves citation and scope errors

In the parents explanation, the writer attached Quran 17:23, 31:14 and 29:8 to a sentence. The checker used wording from **31:15**, which was not one of that sentence's citations, and still returned positive ordinary support findings. The new citation guard caught this. The same borrowed citation appeared again after correction. Replay found two such uncited-proof findings.

The checker also approved expanding the shirk-specific wording of 29:8 and 31:15 into a broader statement about all disobedience without its broader supporting citation. That broader teaching may have separate support; these particular verse excerpts do not establish every clause attributed to them. Relevant original sources: [31:15](https://quran.com/31/15), [29:8](https://quran.com/29/8).

Other positive judgments generalized from a narrow hadith example more broadly than its supplied excerpt establishes. Genuine copied excerpts do not prove that every explanation attached to them is supported. The additional guard helps catch structural mismatches, but still cannot independently decide all religious meaning.

### 3. Later checking reverses earlier decisions on unchanged wording

The fasting source check approved both Quran explanations. The combined check later marked the unchanged phrase about improvement in conduct unsupported, while still reporting `earlier_section_safe=yes`. The server withdrew the earlier section because its per-claim findings failed. This shows contradictory checker decisions, not a source outage or evidence that a final answer was delivered.

For anger, the combined semantic audit approved the earlier claims, but the reconstructed clauses lost punctuation. That technical mismatch helped trigger withdrawal. Summary repetition was a separate failure.

The system needs consistent, claim-specific revision decisions. A later failure should not erase an unrelated still-supported section. Genuine changed support or qualifications must still cause visible revision or withdrawal.

### 4. Summary generation still tends to repeat the source sections

Fasting and anger summaries mostly repeated source-section statements. The contribution checker rejected them as restatements instead of a direct combined answer. The worship summary also cited a passage that had not been explained by a surviving section, so completion could not pass.

The repair should improve the writer/checker agreement about a short, useful summary. It should not invent new religious claims merely to make the summary sound different, or simply disable repetition and coverage checks.

### 5. Search is imperfect, but it is not the only blocker

Useful original material reached writing/checking: the worship scholar passage directly discussed worship and its benefit; the parents verses and scholarly material were available; anger research found the hadith about self-control. The parents hadith search still failed on this run. Source availability and ranking need work, but these logs disprove an explanation based solely on missing sources or provider failure.

All 43 model responses were HTTP 200. The earlier Google schema rejection did not recur in this batch. An HTTP 200 still does not prove a sound explanation or useful completed answer.

## Spending and evidence

- New allowance: up to **$0.50 additional**, explicitly authorized by Mo.
- Batch: **43 model dispatches**, **285,318 input tokens**, **55,162 output tokens**. Combined 340,480 tokens, about 68,096 per attempted question across the entire multi-call pipeline. This is not the length of the visible answer.
- Batch charges: **$0.16381065**. New allowance unspent: **$0.33618935**.
- Inherited prior actual/reserved exposure: **$0.40098868125**. Combined exposure after this batch: **$0.56479933125**. This includes the older unresolved reservation, which was not retried.
- Separate ledger: `docs/ask-repair-runs/arabic-quality-20261022-retest-3-spend.json`. Both earlier ledgers remain unchanged. No new unsettled charge.
- Private reviewed results: `work/private-ask-evaluation/arabic-quality-20261022-retest-3/report.json`; punctuation/citation replay: `contract-replay-findings.json`. Original-source trace retention remains unchanged; persistent result reports strip Quran/hadith originals.
- The guard's separately authorized carry-forward allowance passed eleven focused spending tests and TypeScript before inference. The active answer code remained unchanged throughout the test. Testing stopped after the requested five for review, not because the new allowance ran out.

## Next repair priorities

1. Fix punctuation-sensitive reconstruction using the recorded responses, while proving that omitted words, negation and qualifications still fail. This is the most clearly demonstrated new regression.
2. Replace generic citation-failure feedback with the actual missing/borrowed clause and source identity so correction can repair the specific error. Preserve existing proof and meaning checks.
3. Resolve contradictory source-only versus combined checker findings and excessive whole-section withdrawal. Test unchanged claims, genuinely new qualifications and affected-claim revisions separately.
4. Align summary writing and checking around a concise direct answer, then repeat the same questions on a frozen code revision with original-source review.
5. Measure semantic checking with recorded supported/unsupported pairs before claiming model reliability. More prompt rules or a different model name do not establish a fix.

No production deployment or religious-accuracy acceptance. **The current release remains unready.** The next repair should begin with the demonstrated punctuation regression, without claiming that it resolves the remaining semantic problems.
