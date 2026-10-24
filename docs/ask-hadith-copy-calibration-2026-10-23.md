# Hadith editorial copying regression repair - 23 October 2026

## Observed failure

The last paid R01 continuation withheld its corrected hadith explanation before semantic review. The exact editorial match was the four-word phrase meaning Allah's right over His servants. An unrelated synthetic terminology case reproduced the same false positive. Both cases failed before this change.

## Implemented

The shared Arabic hadith editorial check now rejects six consecutive normalized words instead of four. Entire shorter originals and substantial near-copy patterns still fail. Honorific handling is unchanged. Quran retains its four-word and short-original rules; scholar and translated-text rules are unchanged. There is no question, topic, source-ID or phrase whitelist.

The rich writer instruction now matches the editorial check. This changes the writer request: previously paid drafts must not be replayed as exact current requests. Existing checkpoint identity binding already refuses a changed request.

This is an editorial calibration, not permission to quote or an approval of religious meaning. Citation, source identity, attribution, audience, qualifications, scope and independent meaning checks remain required.

## Offline verified

- The actual corrected R01 hadith sentence no longer fails on its short shared noun phrase.
- An unrelated short-terminology example also passes without a whitelist.
- Complete short hadiths, six-word copied clauses, substantial lightly altered copies and honorific-split copies remain rejected.
- A pipeline control sends the newly admitted short-overlap wording to semantic review and withholds it when that review rejects support. Editorial acceptance cannot itself produce a checked answer.
- Full suite: 1,494 tests in 133 files passed. TypeScript passed. Focused run: 149 tests in six files passed.

## Live verified and accepted

No new live call or live acceptance. The source wording that previously failed is recorded evidence; its editorial acceptance now is not a newly checked religious answer. No claim of improved complete-answer rate, accuracy, first-section time or cost is established by this repair.

No deployment, database/source/rights changes, model/privacy changes or commits. No additional spend. Latest allowance remains $0.15412445 used and $0.09587555 unspent; 41 settled calls and inherited exposure $1.8775841125 remain unchanged.

## Still required

Write the final summary from surviving independently checked explanations, repair optional study-guidance handling, and reproduce the known parents qualification loss against any proposed checker repair. Then use guarded live testing only when its maximum reservation fits the remaining authorized allowance. Do not rerun old uncertain calls or bypass exact-request replay rules.

The reliability goal remains active and unfinished.
