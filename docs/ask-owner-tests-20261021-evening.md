# Owner test diagnosis — 21 October 2026, evening

These are owner-submitted attempts on the ordinary local rich stream, not the gated patient worker. No new question or paid model call was submitted during this investigation. Existing private traces remain in the ignored, short-retention trace directory; do not commit the full prompts, originals or user history.

| Attempt | Observed stages | Proven failure |
|---|---|---|
| Worship, `4e5a8450-25cd-46d6-a32c-c369330e8a8c` | Search returned 16 Quran, 8 hadith, 6 scholarly candidates. Selected Q51:56, Q29:17 and HE65936. Finished in 42.378 seconds. | The accepted summary cites Q51:56 for a joined claim including provision/sustenance, a detail outside the displayed verse. A general benefit claim also exceeds what the displayed citations explicitly establish. The checker accepted these claims; completion is not evidence of source faithfulness. |
| Repentance, `917dc7fa-706f-4010-a043-c4f5cf29fa26` | Search returned 16 Quran, 8 hadith, 6 scholarly candidates; source groups ready at 81.230 seconds. Ranked HE5438 highly. | Selector assigned `position-a` to HE5438. `position` identifies a scholarly position, not a hadith. Strict parser rejected `position_on_non_scholar` at 98.520 seconds; no writer ran. This is malformed selection metadata, not absence of relevant hadith or an overall timeout. |
| Parents, `585fac8c-9ef6-4e08-81b6-372e3ea395cc` | Search returned 16 Quran, 7 hadith, 8 scholarly candidates. Evidence sealed at 26.300 seconds, including Q29:8, Q31:15, Q17:23, HE66184 and three scholarly excerpts. | Initial writer failed copied-source wording, selected scholarly source unexplained and a summary sentence with six citations against the three-citation limit. The existing correction repeated copied wording and the six citations. Rejected at 31.842 seconds before independent semantic approval. |

## Implemented bounded repair

- Tiered Quran/hadith assessment schemas now restrict `position` to the empty string. Instructions explicitly distinguish a scholarly disagreement label from agreement with a hadith. The parser still rejects misplaced labels.
- The rich path uses one bounded correction for this exact metadata failure, with the rejected selection, exact reason and unchanged candidates. It does not silently strip a label or approve the religious content. A repeated failure remains incomplete; this repair does not stack another selection-recovery retry.
- Writer instructions now state the actual three-reference limit, copying constraints, selected-source explanation requirement and prohibition on using neighbouring context as an uncited fact.
- The existing single writing correction receives group-specific validation failures and actionable format rules alongside the actual rejected draft. Semantic support checks, citation limits and copying checks remain intact.

## Verification and limits

Seventy focused tests passed across rich pipeline, rich answer and tiered tests; full-project TypeScript passed. New regressions cover successful bounded correction of a misplaced label, refusal when it persists and exact group-specific copying feedback. Tests use invented evidence and scripted providers. No automated paid comparison was run.

The worship checker false acceptance is **not proven fixed** by stronger instructions or passing scripted tests. Source-faithfulness review and paired incorrect/correct checker evaluation remain required. Unavailable scholarly translations and weak explanation/relevance also remain quality concerns. The patient worker/storage gate remains off; it must not be presented as what these screenshots tested. No production deployment, model-chain change, source publication or spending-ledger reset occurred.

## Follow-up parents attempt, 19:59 local

Request `3ed47b16-0347-4847-ae8a-c0420bdee839` retrieved 16 Quran candidates, zero hadith and eight scholarly candidates. It ended incomplete after 65.566 seconds, not an overall timeout. The scholar draft contained Quran-only sentences in the scholarly section and failed attribution validation. Its structurally valid summary preserved a partial writing result. Meanwhile the Quran checker returned a prohibited `synthesis` label for a non-summary explanation, causing `contribution_map_invalid` despite its positive support findings. The later Quran correction still failed usefulness/repetition checks.

The coordinator treated the partial remainder as if it needed no writing correction. It spent the only correction on Quran alone, leaving the known-invalid scholar section unrepaired. The final summary then correctly failed `summary_without_explanation` and surviving coverage. This is an additional coordination failure, not evidence that the question has no supported answer.

Repair: when the first section needs correction, combine its failures with known validation failures in the retained remainder. Use the existing one correction request, unchanged evidence and the same independent support checks. A regression reproduces the valid-summary/invalid-scholar combination and verifies a single combined correction. **43 focused tests passed** across rich answer/pipeline; TypeScript passed. No paid reproduction was submitted. This does not establish that the live checker will now make correct semantic judgements; its inconsistent contribution labels remain a separate acceptance concern.

## Generic-error attempt, 20:03 local

Request `9fd0c6e6-0fba-4c13-b7e0-0583fbb833c4` stopped after 4.605 seconds with `question_frame_invalid`. Both framing responses from the configured primary writer contained invalid JSON; the first included a stray hyphen between object fields. Both parsed to null. No evidence search, answer writer or semantic checker ran. The server error log also contains a connection timeout, but the request trace establishes malformed framing as this attempt's refusal cause; the timeout is not attributed to this answer without matching evidence.

The existing two-attempt framing flow had repeated the primary model because configured model fallback only responded to busy errors. Repair: an internal request flag routes the already-budgeted framing correction to the existing configured backup after a null/unreadable response. Valid JSON with invalid question meaning does not trigger this routing. Both ordinary rich framing and patient framing use the flag. No model configuration changes, third framing attempt, automatic malformed-output repair or fragment extraction were introduced. A second malformed response still fails safely. Uncertain billing exceptions continue to propagate rather than trigger this path.

**56 focused tests passed** across OpenRouter, rich pipeline and patient model tests; TypeScript passed. Fake transport verifies exactly two model calls (primary then configured backup), and pipeline regression verifies no third framing attempt. No paid request was submitted during diagnosis or verification. Live answer quality and the broader checker concerns remain unaccepted.

## Partial scholar answer, 20:08 local

Request `d814df06-6f24-4c83-a5f3-2e11e8f98973` ended incomplete after 36.320 seconds. Initial Quran checking had positive support findings but called a source explanation `synthesis`; the presentation contract treated that label as invalid outside the final summary. The rewrite then failed copied-source wording. Final contribution findings flagged duplicate scholar and summary claims despite a positive overall no-repetition flag; the missing Quran explanation also invalidated summary coverage.

Repair: presentation role remains assigned by code via `summary_claim_ids`. A source explanation may itself connect passages and receive the usefulness category `synthesis`; that category alone no longer forces religious wording to be rewritten. This does not change any source-support, attribution, scope, condition, cause, completeness or duplication requirement. Final-summary claims still require synthesis. Flagged duplicate/restatement or non-useful claims can no longer enter the independently passed claim list merely because the overall repetition flag is positive. They remain withheld.

Offline regressions verify no correction is consumed just for the source synthesis label and that a flagged duplicate source section stays withheld despite positive aggregate flags. Twenty-five focused contribution/rich-answer checks passed after these regressions. No paid test or production deployment occurred. The repeated scholarly excerpts and the live checker's overly broad support decisions remain quality issues; no successful end-to-end live repair is claimed.
