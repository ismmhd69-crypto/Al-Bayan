# Anger follow-up failures

The first live attempts after the excerpt-anchor change failed for different reasons. They do not establish full Ask reliability.

## Recorded causes

- `cfdb7704-030a-4836-9ba9-ca410dde4d29`: the question planner returned a subject label longer than four words. Its one permitted correction also returned an overlong label. The runtime rejected both. The new hadith search fields themselves were present and valid.
- `8dcd76b1-8eb4-48aa-acf1-74a6e67f3b88`: the new anchored meaning check returned a valid positive response for Sunnah. Quran writing hit a copy check; its bounded correction rewrote a simile into an actual transformation of an adversary into an ally. The checker correctly rejected that stronger statement.
- The same Quran audit approved the first sentence individually, but marked the combined draft inconsistent. The old safe-subset path therefore had no eligible IDs. Both Quran sentences were withheld, and combined question coverage then failed. No conclusion was attempted in this run.
- Browser inspection found no console errors in the inspected Ask tab. This is pipeline failure evidence, not proof that every tab is free of UI errors.

## Narrow repairs

- Frame correction feedback now identifies the exact four-word subject-label constraint instead of returning only a generic invalid-frame reason. The provider schema also describes the label constraint. The constraint and existing correction limit remain unchanged; rejected labels are not silently shortened.
- Individually supported source claims can become candidates for one fresh subset review when another claim caused combined inconsistency. Candidates are not publication approvals. Existing safe IDs still require consistency; their use by other streaming paths is unchanged.
- This recovery applies only before source-only publication, after permitted correction has settled, and never to a malformed checker response, writer failure, integrity withdrawal or arbitrary fragment of rejected text. The remaining subset must pass the complete independent checks and usefulness assessment before appearing.
- Unknown citations, lost conditions, bad guarantees, grounded findings and total spending protections remain enforced. No additional writer retry or paid live test was added.

## Verification

44 focused tests across eight files and TypeScript passed. New controls cover precise frame correction hints, valid candidate retention after combined inconsistency, mandatory fresh review, and refusal when that subset is not independently useful. The captured traces are frozen privately alongside earlier failures.

Live regenerated-answer acceptance remains pending Mo's manual tests. Do not call the overall feature reliable based on these controls.
# Further failure: correction feedback lost before the writer

Request `81c72937-43b8-4dee-848d-b33c6bdc83f0` ended incomplete with `question_coverage` after 83 seconds. It did not attempt a conclusion. Sunnah and scholar groups passed; Quran failed its narrow review twice.

The initial narrow review identified omissions from both Quran originals. `parseMeaningReview` replaced that detailed explanation with a generic condition-logic message when a computed join mismatch also existed. The saved correction request confirms the writer received only that generic explanation and the finding for one original. Its repair addressed that original but left the other omission, which the next review rejected.

Repair: preserve the grounded negative explanation and append the computed condition warning. This changes correction feedback only. Approval, source identity, condition validation and correction allowances are unchanged. A focused regression checks that both pieces reach the parsed failure while the claim stays rejected. Four focused files passed (17 tests); TypeScript passed. No paid acceptance run was performed, so a successful new answer is not established.

