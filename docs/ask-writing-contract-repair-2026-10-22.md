# Writing references and dependent-summary repair — 22 October 2026

## Result and limits

Two shared defects were repaired offline. Unavailable references are now excluded from the active rich writer's schema, and the existing bounded correction regenerates the summary when it repairs the first explanation. A summary-only correction is restricted to originals represented in actual source drafts.

No new online answer was generated. There is no new completion-rate, cost-saving or religious-accuracy claim. The last online findings and their failures remain unchanged.

## 1. Enforce available reference identities before accepting the draft

The recorded worship attempt twice cited Q51:57 although the selected Quran identities were Q51:56, Q14:8 and Q41:46. Previously the writing schema allowed any string in `source_ids`; only the later parser detected the problem.

The active writing schema now lists the allowed source IDs for each requested section and the code-assigned requirement IDs. A source section cannot introduce a neighbouring verse or a citation belonging only to another source group. An empty eligible group still has a locally enforced empty-array contract. Google transport retains these identity enums even where provider-side size bounds are omitted; the full local contract remains authoritative.

An otherwise valid-looking response containing an unknown reference fails as a whole. Code does not rescue its valid siblings, silently rewrite the identifier or supply an answer from religious memory. The previous exact-reference correction feedback remains available for provider-independent validation failures.

An allowed identifier does **not** establish meaning. Original-excerpt binding, semantic support, scope, qualifications and full-answer checks are unchanged. A regression explicitly refuses unsupported wording carrying an eligible citation.

## 2. Keep the summary aligned with repaired explanations

The first explanation and later summary could be corrected separately. Repairing the first explanation could change its sources or restore a previously missing answer component while leaving the earlier summary unchanged.

When that explanation needs the existing correction, its summary is now requested in the same correction response. This applies even if the old summary omitted the first section entirely, because the repaired section may supply a missing concern. Both source text and summary are still independently checked before completion. Already checked unrelated source sections are not rewritten just to repair this dependency.

The same single correction allowance is retained. No extra retry or model round was added; the joint correction can be larger, and the spending guard continues to reserve its full permitted cost.

## 3. Limit summary citations to actual explanations

For a summary generated alongside source sections, allowed references come from those sections' eligible sources plus the actual drafts of sections outside that writing request. A later summary-only correction therefore retains real Quran/hadith/scholar references while excluding merely selected, unexplained passages.

Source drafts remain provisional wording, never independent evidence. Final checking still refuses a summary whose citations are not explained by surviving checked claims, or whose concerns and qualifications are incomplete. The new identity restriction does not bypass that check.

## Verification

- A zero-cost replay inspected five recorded writer responses from the last worship/parents follow-up. **Both real drafts containing Q51:57 failed the new identity contract.** The other three passed the identity/shape check only; none received semantic approval from this replay.
- New regressions cover whole-response rejection, wrong source groups, unknown requirement IDs, preservation of identity enums in Google transport, a source/summary citation change inside one correction, summary-only corrections using actual drafts, and continued refusal of unsupported meaning with a permitted citation.
- Full offline suite: **1,405 tests passed in 124 files**. After broadening summary dependency to include an omitted first section, **40 focused tests** passed and TypeScript passed. Whitespace checks passed.
- Models, privacy, source boundaries, patient-worker switches, production and the retry allowance are unchanged. No deployment, database write, commit or paid request occurred.

## Spending and acceptance

The additional 50-cent campaign remains at 97 dispatches and **$0.36075190** charged. The nominal remainder is **$0.13924810**. It remains stopped because the next maximum-cost reservation did not fit. No new unsettled charge, reservation reset or change to either older ledger occurred.

The replay is saved privately at `work/private-ask-evaluation/arabic-quality-20261022-retest-5/writing-identity-replay.json`. It stores finding codes and identities, not original religious text.

**Acceptance: offline behaviour verified; live outcome unverified.** The next useful step is a reviewed online run that exercises the constrained writer and joint correction, followed by unfamiliar Arabic questions. Semantic-checker consistency and complete final coverage still need independent evidence. Nothing here establishes overall Ask reliability.
