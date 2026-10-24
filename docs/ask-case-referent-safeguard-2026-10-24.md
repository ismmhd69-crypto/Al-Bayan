# Arabic case-reference safeguard

Status: a narrow negative-only safeguard is implemented in the local rich engine. Offline enforcement passed; one live correction component still failed source-faithfulness review. No full-answer reliability or release acceptance.

## Demonstrated defect and code change

The recorded hadith explains a particular elderly man's walking vow and the instruction to ride. Multiple actual checker requests approved an explanation changing that person into an unrestricted human audience. Removing writer metadata and using a focused checker did not resolve it. The previous goal turn made progress by establishing those failures and keeping the experiments off, rather than accepting their verdicts.

`lib/ask/case-referent-check.ts` recognises a limited Arabic referent substitution: every cited original explicitly points to a particular person (or points reflexively to a person identified in the narration), while the explanation uses a recognised unrestricted human-role term. Direct demonstrative/relative/conditional binding and recognised explicit case limits abstain. The check also abstains if a cited original may state a broader proposition or complementary cited evidence is not confined to that case.

There are no hardcoded source IDs, religious topics, rulings or expected answers. The code rejects a recognised pattern; it does not prove truth, resolve grammar generally or cover every form of generalisation. Its conservative abstentions leave many unsafe statements undetected. For example the separate unsupported absolute rationale in the recorded Quran statement is outside this check. A newly introduced wrong noun also remains outside its scope.

The rich engine applies this additional negative finding after its normal review, in both current and gated focused paths and for source/final stages. A positive checker vote cannot override it. A flagged claim is excluded from safe IDs and receives specific correction feedback under the existing single shared correction limit. A detected late failure of an earlier displayed claim causes withdrawal. Existing source identity, copying, meaning, coverage, directness, guidance and spending checks remain. No extra model or retry was added.

This check can still cause unnecessary withholding on unfamiliar wording; its available positive controls are limited. Do not call it a full semantic parser or source-faithfulness certification.

## Offline evidence

Full suite: **1,608 tests in 152 files passed, zero skipped**. TypeScript passed before the live component. The first focused run exposed an Arabic conjunction-boundary bug in the new detector; that was fixed before the passing run. No claim is made that the first run passed.

Controls cover the exact recorded bad statement; unrelated invented case examples with six human-role terms; explicitly bounded references; broader teachings/complementary sources/missing identities; the existing Arabic faithful-paraphrase fixture set; and an actual-engine all-positive scripted audit that cannot stream the detected substitution. Exact cited originals and normal final rejection/withdrawal still apply. Local-recorded capture tests explicitly skip when their private evidence is absent; none were skipped in this run. These are enforcement/fixture results, not comprehensive religious accuracy.

## One live correction, independently reviewed

The actual engine generated its ordinary hadith-only correction request after the guard overrode deliberately scripted checker approvals on the saved four source explanations. This was an offline capture, not a full live Ask attempt. The captured request retained its current schema, full selected-original/context input, normal **2,200-token output allowance** and normal **six-second correction timeout**. One current-writer dispatch was then made with the existing privacy and price ceilings, a full **$0.04798368 reservation**, and no backup/retry. It settled before timeout.

Two corrected claims were produced and passed local structural/copying checks:

- The first preserves the supported worship/non-association and non-punishment core of the rights narration. Its closing warning against reliance is still not explained and remains available in the source original.
- The second now says “that elderly man,” so it exercises preservation of the previously lost case reference. However it uses **بالماشية المنذورة**, meaning vowed livestock, instead of the walking vow. This changes the event. It is **not accepted as a source-faithful correction**.

Independent result: **1/2 corrected claims fully supported; the targeted case claim still failed due to changed wording**. No final live checker, research run, complete answer, presentation acceptance or latency comparison occurred. The guard's empty failure list for the replacement is not a positive judgment of its meaning. No further correction was attempted.

Private evidence: `work/private-ask-evaluation/case-referent-repair-control-20261024.json`, marked reviewed correction failed. Input capture: `scripts/prepare-ask-case-referent-repair.ts`; guarded one-shot runner: `scripts/probe-ask-case-referent-repair.ts`. Defaults capture offline with zero model calls. Scripted upstream approvals are explicitly not source evidence.

## Spending and acceptance

One settled generation cost **$0.00189420**. Latest allowance used **$0.1870327975**, remainder **$0.0629672025**; combined recorded exposure **$2.06947661**, including the original unresolved reservation and all prior campaigns. Journal: **112 settled generations, ten zero-cost route rejections, one confirmed local non-dispatch, zero new uncertain charges**. Five immutable ancestors and the original journal hash were verified unchanged. No lock or paid process remains. No budget increase, lowered reservation or reduced output allowance.

**Accepted:** prevention of the recognised referent substitution in offline actual-engine controls, plus descriptive evidence that the live writer now kept that referent. **Not accepted:** a useful corrected case explanation, complete-answer accuracy, release, Mo acceptance or completion of the goal. The last full live question remains independently failed/incomplete. A normal full final-check reservation alone still exceeds the remaining allowance.

Current models/privacy/source boundaries remain. No deployment, storage activation, commit or push. Summary selection, focused checking, generated context binding and writer-input isolation remain disabled on the website. This safeguard is part of the local rich-engine checks; it does not activate those experiments.
