# Summary correction must be able to select suitable displayed originals

## Recorded run

Request `6abf8b79-bac6-4856-9e6b-29351f3b69b9` published hadith at 21.8 seconds, scholars at 29.6 seconds and Quran at 46.8 seconds. It ended incomplete at 121.951 seconds, with `missing_qualification`. No earlier source-ID or malformed-review failure occurred in this run.

The first summary failed the existing source-copy check. The editorial correction dropped one cited passage's contribution but retained both citation identities, and did not fully address the question. The meaning/coverage correction then added a disagreement application which the independent narrow review rejected for broadening the cited enmity passage. Those are not approvals to bypass. This run also exposed an avoidable correction limitation: only sentence text could change, so a repaired sentence could neither remove an obsolete citation nor select a more suitable original already displayed elsewhere in the answer.

The trace is frozen privately under `work/private-ask-evaluation/reliability-20261026/frozen-failures/`, SHA-256 `796099717db5713a6b850ee412fb80450b331b2f582ffe37841c12781184372d`.

## Repair

For original-mode summary patches only, the server now supplies fixed reference choices for the unchanged displayed originals. A targeted replacement returns `text` and one to three `source_refs`. Code resolves those references and preserves the sentence's concern and all untouched siblings. No unpublished original, neighbour context, new identity, arbitrary citation ID or additional sentence slot can be introduced through this contract. Source-group and legacy text-only corrections retain their citation locks.

Every changed sentence and citation still passes ordinary draft, copy, attribution, citation, meaning, scope, condition and whole-question coverage checks. Changed evidence changes its review identity; old approvals cannot establish support for a new citation. A choice of citation never constitutes proof. Existing one-meaning/one-editorial correction allowances and spending limits remain. This adds no writer/checker calls or retry allowance.

## Verification

80 focused tests across six files and TypeScript passed. Controls cover fixed reference selection, rejected unknown/duplicate/mixed references, preserved untouched wording and concern IDs, source/legacy citation locks, and actual pipeline correction to a different displayed original. A scripted supported replacement completes; an unsupported replacement remains incomplete and retains the source sections. Scripted verdicts are protocol controls, not religious acceptance.

The production build passed with the existing metadataBase and broad private-index tracing warnings. No paid live question was submitted. The captured answer is not retrospectively approved, and this repair alone does not establish future completion or general reliability.
