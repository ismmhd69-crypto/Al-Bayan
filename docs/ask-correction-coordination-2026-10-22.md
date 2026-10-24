# Optional source groups and coordinated corrections

## Result

Two shared defects are repaired offline. These are changes to Ask's normal rich-answer path, not answers or exceptions for particular religious questions. No new paid call occurred, and no online reliability improvement is claimed by this work.

## 1. Stop treating every selected source group as mandatory prose

The writer was told that selected evidence need not be repeated. However, `parseRichClaims` refused an empty source array whenever that group contained selected evidence. This turned an intentional omission into `claim_count`, could spend the one correction filling unnecessary groups, and could label a completed answer as having failed research.

Source arrays may now be empty without establishing coverage. The summary must still contain checked explanatory content. Whole-answer checks still require every concern, necessary contribution, qualification and explained summary citation. A necessary source group cannot be omitted merely to obtain a complete status.

An intentionally unpresented source group carries the existing `not_checked` outcome plus optional `omitted: true` metadata. It does not pretend that the search found no evidence or that an explanation passed checking. The metadata is valid only on an empty non-summary section. Malformed responses, explicit declines, unsupported wording and actual source failures do not become successful omissions.

The reading view hides these empty groups without a false failure notice. Actual search failures still produce their notice. Rendering checks cover Arabic, English and German. Existing saved answer versions and outcome names remain readable; the optional metadata is preserved when source text is stripped for storage. Browser interaction and live save/reopen acceptance were not performed.

### Recorded-response replay

A zero-cost replay inspected **52 intact recorded writer responses**, skipping three unreadable responses. Every response was checked against its recorded strict envelope before inspection; no apparently valid fragment was extracted from broken data.

It found **eight selected-but-empty source groups** that the previous parser classified as failures, across the worship, parents and sincerity cases. It also confirmed the previously repaired semicolon rejection in one actual summary claim. These counts are occurrences, including corrections, not distinct questions or newly completed answers. The replay approves no religious meaning.

Private result: `work/private-ask-evaluation/arabic-quality-20261022-omission-replay.json`.

## 2. Collect sibling failures before spending the single correction

The system could find an unsupported first explanation, repair it, and only afterwards discover unsupported meaning in a later explanation. A similar problem occurred when it spent the correction on one group's formatting fault before examining another group's meaning. The only correction had already been consumed.

On that failure path, Ask now performs a bounded review of the available provisional drafts before requesting the correction. The correction receives the combined exact rejected wording, citation and contribution findings. It includes source groups with actual negative findings and refreshes their dependent summary. A previous negative finding is not silently replaced by a later positive model opinion.

There is still at most **one writer correction**. The preflight runs at most once and never automatically repeats after a checker failure. It is not a retry for uncertain paid requests. Provider privacy, paid-call journaling, conservative reservations and cancellation still apply.

If the first source needed rewriting, its corrected wording stays provisional until combined checking. This replaces the former separate review of the corrected first source. The ordinary failed-first path therefore retains **three primary audits**: initial section, pre-correction combined review, and final combined review. The source groups and summary are released only after their appropriate checks.

A failure in a later draft can require one additional pre-correction review. The number of model calls and the size of their inputs are distinct: a combined review can cost more or take longer than a short source-only review. No live cost or timing saving is established.

An earlier source that passes normally still appears before later work. A late genuine support failure still withdraws earlier text. New unsupported wording introduced by the correction still prevents completion. A malformed or unavailable preflight is not approval and does not earn another correction.

### Reproduced failure patterns

Two scripted integration regressions were run before the coordination change. Both returned incomplete:

- An unsupported first section plus an unsupported later section, with otherwise valid structure.
- A copied clause in one later group plus unsupported meaning in a different later group.

After the repair, the same scripted cases complete using their one correction, with both affected groups and the summary corrected. The fixtures use invented source wording; they establish control flow, not religious accuracy. Negative tests retain refusal after a preflight outage or a newly introduced unsupported assertion. Another asynchronous test confirms that no corrected first draft appears while its combined check is still pending.

## Verification

- **1,435 tests in 128 files passed**, including the coordination, omission, source-safety, protocol, storage and rendering suites.
- TypeScript and whitespace checks passed.
- No model changes, source approval changes, production deployment, database writes, commits or new paid requests.
- Spending remains **$0.89861773125** of the new $1 allowance; **$0.10138226875 remains**. Earlier charges and the unresolved reservation are untouched.

## Remaining boundary

This repairs two real control-flow defects. It does not establish that the models now write faithful complete answers across questions. The final summary is still drafted alongside later source explanations; fully separating it from source work remains a further staged-processing task. Live evaluation of this revision, source-faithfulness acceptance, timing and cost measurement remain open. The active reliability goal is not achieved by these offline passes.
