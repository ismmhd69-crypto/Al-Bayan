# Optional next-step guidance in ordinary rich answers

## Implemented

The ordinary summary writer previously had to generate a next_step object even though the answer format, storage, view and final-check builders already supported an absent optional footer. This forced extra prose and could turn a footer problem into an incomplete answer.

The ordinary writer may now omit next_step entirely when it adds no useful information. This does not enable the experimental selected-summary mode. If a footer is supplied, its original shape, language, citation, safety and relevance requirements remain mandatory. Null, empty objects, malformed supplied text and unsafe advice are still rejected; code never strips a rejected received footer to promote the body. The single existing correction can explicitly return a new valid response with the optional property absent.

Every requested practical step and qualification still belongs in the supported answer and must pass full coverage. Only guidance-specific verdicts disappear when there is genuinely no guidance to assess. Citation binding, attribution, claim support, independent meaning, context, contribution, question coverage, final summary and late withdrawal remain in force. Missing guidance is not a substitute for answering a requested next step.

No model, source approval, privacy, output allowance, spending headroom, retry or deployment change. A supplied study suggestion can still be misclassified by a model; this repair removes mandatory filler, not the unresolved semantic false-approval problem.

## Offline verified

Focused tests cover ordinary synthesis without a footer, strict optional output shape, storage/hydration, existing all-language no-footer rendering, malformed supplied footers, one explicit omission correction, missing practical steps/conditions, unsafe supplied guidance, late independent withdrawal and the staged focused-checking branch without selected-summary mode.

The initial new mock omitted a separately required no_answer_feedback field, causing its strict-contract assertion to fail before final checking. The mock was corrected to supply that existing field; no production check was weakened. Sixty-eight focused tests in four files passed, then 61 in three files after the focused-path test; TypeScript passed. The final full suite passed **1,700 tests in 162 files**, zero failures/skips.

## Spending replay, no paid calls

The exact never-dispatched parents final A17 request was reconstructed using the current final-check builder. Removing the optional footer changes no claim, citation, original, restriction or coverage metadata. Actual provider wire bodies were captured through fake transport with no credentials or network calls. Existing 9,000-token output allowance, UTF-8 bound, framing margin, model price ceiling and two-times headroom remain unchanged.

| Historical final-primary request | With footer | Without footer |
|---|---:|---:|
| Message bytes | 71,260 | 70,575 |
| Full reservation | $0.11642040 | $0.11580390 |
| Fits current $0.10206744 remainder | No | No |

This saves $0.00061650 of reservation in that exact replay, not a demonstrated actual charge. It does not make another full test affordable. Earlier source costs, backups and the final independent meaning check would need their own reservations. The historical body defects remain present; this replay is not an answer or accuracy success.

## Status

**Implemented:** optional footer in ordinary local rich synthesis, with strict validation when present.

**Offline verified:** mechanics and exact historical sizing. No spending history changed, no provider request was sent and no request was rerun.

**Live verified:** pending. No paid full attempt or component was made for this change.

**Accepted:** absence and safety boundaries only. Named-source and ranking improvements remain separate. The parents Quran scope error and wider checker false approvals are still unresolved; no reliable-complete-answer, release, Mo acceptance or goal completion is claimed.
