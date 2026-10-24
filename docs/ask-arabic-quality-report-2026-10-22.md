# Arabic Ask quality report — 22 October 2026

## Verdict for Mo

**Ask can find useful sources and sometimes produce an answer, but it is not reliable enough to call ready for public religious guidance.** This test found both unnecessary answer failures and a material meaning error that the checker approved in a displayed section. Changing models is not established as the solution by this evaluation.

I prepared 50 Arabic questions and ran the first balanced batch of five. I stopped before the next batch because the source review found the agreed serious-error stop condition. **The other 45 questions were not tested.**

New model charges were **$0.1077896 (10.78 cents)**. Including the older unresolved **$0.113472 reservation**, combined spending/exposure is **$0.2212616 (22.13 cents)**, below the 50-cent ceiling. The reservation is not being claimed as an actual settled charge. There are no new unsettled calls. The remaining allowance was deliberately not spent.

## What happened on each question

| Question | Result | Direct review | Time | New cost |
| --- | --- | --- | ---: | ---: |
| Why worship Allah when He needs nothing, and what benefits us? | Incomplete; Quran section displayed | Two supported explanatory claims; no final conclusion. Later writing/checking contracts failed. | 170.0 s | $0.03342035 |
| Kindness to non-Muslim parents versus obeying every request | Incomplete; no explanation displayed | Relevant Quran and scholar evidence was available. Writer returned English despite Arabic instructions; correction also returned English. This is unnecessary withholding, not lack of relevant evidence. | 31.3 s | $0.02735035 |
| How fasting improves conduct beyond avoiding food and drink | Incomplete; hadith section displayed | One supported claim and one material misleading implication about fasting validity. The checker approved it. | 79.1 s | $0.02859820 |
| Managing anger without hurting people | Complete automatic answer | Main teaching supported; one Quran-related word error and awkward Arabic need correction. Useful as a basic answer, but practical depth is modest. | 24.7 s | $0.01635680 |
| A specific triple-divorce incident during anger | Referred to a scholar | Appropriate boundary: did not decide whether the visitor remained married. This is a referral success, not a substantive answer. | 2.4 s | $0.00206390 |

The question bank, including expectations and all untested questions, is in [the question-bank record](ask-arabic-quality-question-bank-2026-10-22.md).

## What the accuracy numbers do and do not mean

- **1 of 4 answerable attempts (25%)** reached a useful complete answer, and that answer still needed minor wording cleanup.
- **0 of 4 (0%)** produced a complete answer needing no identified correction.
- Three attempts displayed substantive explanations. **1 of those 3 (33.3%)** was fully source-faithful without identified corrections; one was mostly supported with a minor word error; one contained a material misleading implication.
- Across eight displayed claim sentences, six were cleanly supported, one had a minor word error and one had the material fasting-validity implication. The study next-step on the completed answer was also reviewed and added no new ruling.
- The one personal-case referral was appropriate. No personal marriage verdict was issued.

These are direct-review results for a tiny, non-random, early-stopped sample. **They are not a general accuracy estimate**, scholarly certification, or evidence that all remaining questions will behave the same. Automatically marking an answer complete is also not proof of correctness.

## The most serious finding: a citation did not prevent changed meaning

The fasting section displayed this Bayan-generated sentence:

> بين النبي صلى الله عليه وسلم أن ترك الكذب والفعل الباطل أثناء الصيام يعد أمرا أساسيا لمن أراد صحة صيامه.

The phrase **صحة صيامه** presents avoiding those sins as a condition for the fast's legal validity. The cited original hadith warns about false speech and wrongful conduct; it does not establish that legal consequence. The cited provider's own explanation explicitly distinguishes diminished reward from invalidating the fast. See [the Arabic original and explanation of Bukhari 1903](https://hadeethenc.com/ar/browse/hadith/66270).

The captured checker responses approved direct support, scope and conditions for that claim. It was delivered as a ready hadith section, even though the final result was incomplete. **An incomplete banner does not protect a visitor from an incorrect implication already displayed above it.**

The other fasting claim—self-restraint, avoiding obscenity and quarrelling—is supported by the [original fasting hadith](https://hadeethenc.com/en/browse/hadith/3546). This shows why source existence and source authenticity must be assessed separately from the writer's interpretation.

## What is working

**Source discovery can retrieve directly relevant evidence.** The worship explanation used [Quran 31:12](https://quran.com/31/12), [35:15](https://quran.com/35/15) and [17:7](https://quran.com/17/7). The parents run found [31:15](https://quran.com/31/15) and relevant Ibn Baz material. The anger answer cited [3:134](https://quran.com/3/134), [Bukhari 6114 / Muslim 2609](https://hadeethenc.com/ar/browse/hadith/5351) and [Bukhari 6116](https://hadeethenc.com/ar/browse/hadith/4709). Missing answers cannot all be blamed on missing sources.

**Some checks reject technical failures.** English drafts were withheld in the Arabic parents run. An independently checked Quran section survived later failures in the worship run. These protections worked, although they did not catch the fasting meaning error.

**A missing source family does not always block completion.** The anger run completed using Quran and hadith without a scholar explanation. The current rendering code hides resolved empty groups. Actual browser interaction and phone layout were not tested in this campaign.

**The providers responded successfully.** All 33 model requests returned HTTP 200, using the existing primary writer and checker. No backup model was selected, no provider error was recorded and there were no new uncertain charges. The observed failures were further inside the pipeline.

## What is failing

1. **Meaning checks can miss a material religious qualification.** The fasting-validity implication is an observed false approval, not a hypothetical risk.
2. **Writer and correction contracts are unreliable.** The parents writer had explicit Arabic instructions but returned English; its correction remained English. Other failures included invalid next-step structure, copying overlap, incomplete claim/coverage maps and invalid whole-answer audit output. A sentence can be plausible yet unusable because the surrounding contract is broken.
3. **Selection adds avoidable work.** The parents package included a background fatwa about interrupting voluntary prayer. The writer then failed the requirement to explain every selected source. The source was not fabricated, but its inclusion added a requirement beyond the visitor's central concern.
4. **Current streaming still waits for other research before writing.** In the cold worship run, Quran searches returned in roughly 3 seconds, but the two hadith searches took roughly 122.5 seconds. The first checked section appeared at 157.8 seconds. The active code awaits the combined research before explanation processing; the separate patient worker remains gated.
5. **Arabic presentation still needs review.** The completed anger answer used **السر** where its Quran reference says **السراء**, and had awkward wording in another sentence. Its core advice was supported, but it was not polished or fully correction-free.

The first checked section was only about 7.2% earlier than termination for worship, effectively simultaneous with termination for fasting, and about 17.9% earlier for anger. **None of the three attempts with displayed sections met the existing 30% earlier target.** For incomplete attempts, termination is not successful answer completion.

## Spending and processing evidence

There were **33 model calls**, using **180,138 input tokens** and **35,654 output tokens**: **215,792 total** for five attempts. Three attempts used a bounded writer correction. No paid retries of completed questions were made.

| Stage | Cost |
| --- | ---: |
| Understanding the question | $0.01096500 |
| Meaning ranking | $0.01757100 |
| Selecting evidence | $0.03109425 |
| Writing and correction | $0.02274510 |
| Explanation/whole-answer checks | $0.02541425 |
| **Total** | **$0.10778960** |

Ranking, selection and checking together consumed approximately 69% of the spend. This suggests investigating evidence-package size, repeated work and checker contracts. It does **not** justify removing checks, and the proportion alone does not prove which calls are redundant.

## Realistic improvement priorities

| Priority | Proposed improvement | Evidence and expected value | Effort / uncertainty |
| --- | --- | --- | --- |
| 1 | Strengthen checking of added consequences and missing qualifications: legal validity versus reward, permission versus encouragement, individual case versus general teaching. Require exact source support for the consequence. | Directly addresses the material fasting false approval. Must be a general repair, not one hardcoded fasting answer. | Medium; replay the recorded false approval offline, then prove benefit with a separately approved, reviewed live comparison. |
| 2 | Make Arabic writing and bounded correction follow one consistent language, citation and next-step contract; make checker claim maps correspond exactly to the claims actually submitted. | Parents failed despite relevant evidence; other answers failed malformed audit contracts. Could improve completion while reducing wasted correction calls. | Small to medium; structural improvement can be tested offline, but actual model benefit is unmeasured. |
| 3 | Select only evidence with a necessary, distinct contribution; avoid forcing the writer to discuss loosely relevant background. | The parents package added voluntary-prayer background and an unexplained-source failure. Could improve relevance and reduce input cost. | Medium; the size of any cost saving is unproven. Preserve all necessary context and conditions. |
| 4 | Finish acceptance of genuinely staged research and address cold hadith-catalogue loading through the existing approved design. | Directly observed 122.5-second cold hadith wait blocking an otherwise available Quran explanation. | Larger; preserve source eligibility, privacy, restart and billing protections. Do not solve it by discarding slow evidence. |
| 5 | Improve Arabic word-level consistency and useful practical explanation without adding new unsupported advice. | The sole completed answer needed wording cleanup and offered limited practical depth. | Small to medium; do not introduce an extra paid proofreader on every question without a measured benefit. |

**Highest-value next action:** repair and replay the checker false-approval case before buying a larger evaluation batch. That should come with the existing writing/correction contract failures, not a topic-specific answer patch. No repair or further paid comparison was performed as part of this evaluation.

## Method, controls and limitations

- Current model chains, source settings, privacy preferences and feature switches were retained. The active pipeline was exercised directly with live retrieval, not through a browser or deployed route. Prepared reuse was skipped.
- The initial runner disabled internal reference hints. Inspection proved that **all five pilot questions match no built-in hint**, so this setting had no effect on their behaviour. The runner was corrected for any future eligible batch. The attempted restart did not start any extra model call; it correctly refused while a prior call was pending. No process was killed, no completed question was rerun and no result was discarded.
- The original shared ledger remained byte-for-byte unchanged, with SHA256 `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`. The new campaign records that ledger's hash and includes its old reservation. The campaign is now stopped for source-faithfulness review.
- Each new call reserved a conservative price-bound amount before dispatch, including concurrent calls, corrections and backups. Current endpoint prices were captured read-only; request price ceilings were enforced. The campaign used the original shared lock while running. Budget-cap and uncertain-cost stops were tested offline.
- Source review compared every displayed claim with original Arabic passages captured during the run and independent first-party source pages. It was performed by this agent, not by another paid checker or a qualified scholar. Source texts remain in the existing short-lived private trace mechanism; persistent reports strip Quran/hadith text and retain our own claims, source identities and URLs.
- Eight focused campaign tests passed before paid calls. TypeScript passed. The final post-review checks are recorded in the implementation record. Test results establish evaluation behaviour, not religious accuracy.
- No production deployment, database mutation, source approval/publication change, website model change or Ask pipeline repair was performed. Forty-five questions, follow-up reliability, paraphrase consistency, disputed-topic coverage and broader Arabic quality remain untested.
