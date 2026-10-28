# Ask: originals followed by one summary

Mo requested removing generated explanations above Quran, Sunnah and scholarly passages. New stable answers now display selected original passages and available translations, followed by one Bayan summary. Old saved explanation-based answers remain readable.

## Backend

- Stable source lanes retain discovery, ranking, source identity/authenticity, contextual selection and bounded recovery. Selected packages become immutable `presentation: originals` sections, with no generated claims.
- Those lanes no longer call the explanation writer, explanation audits or explanation corrections. An offline scripted successful run dispatches one writer request, for the summary only. Search, selection, summary review and permitted correction calls still exist; this is not a one-call answer or a measured live cost/speed claim.
- The summary uses displayed originals directly, with normal citation, meaning, condition, attribution and full-question coverage checks. No intermediate generated explanation is required to cite a displayed original. Unpublished sources remain unavailable to summary citations.
- Available scholar translations are looked up without generation and checked for alignment before publication. Missing or rejected translations leave the Arabic original visible. Quran and hadith retain their existing source-provided translations.
- One final summary replaces repeated source-group prose. The optional next-step output is an empty array for this mode.
- Stable patient transport uses the same original sections. Its background activation remains gated; no storage, deployment or worker activation was performed.

## Reading and continuation

The source sections still reveal in Quran, Sunnah, scholar order; summary is last. Empty groups do not fabricate cards. Source links, attribution, Arabic grapheme handling, citation timing, Stop, reporting and the support link remain. A failed summary preserves source sections and uses an accurate incomplete notice.

The section validator explicitly permits claim-free original sections, but never a claim-free summary. Source-family identity and all original metadata checks remain required. Stable commits, duplicate delivery and grounded source-integrity notices retain their existing rules. Continuation and worker identities were bumped to reject incompatible old checkpoints instead of silently mixing publication modes. Start a new question for this change; older saved answers are not rewritten.

## Verification

Focused checks cover unchanged originals, English/Arabic source rendering, absence of generated source prose, optional translation alignment approval/rejection, summary rejection without withdrawing originals, duplicate commits, changed-source notices, Continue and patient transport. TypeScript and the production build passed. Existing metadataBase and private-index file-tracing warnings remain.

No paid live test was performed. Offline scripted decisions establish execution and protocol behavior, not religious correctness or general live reliability. Live speed, cost and answer quality remain unmeasured for this new flow.

## Top-to-bottom reveal repair

The reveal scheduler previously iterated retrieval order, while the card renderer grouped Quran verses in numeric order. This could reveal a later-position card first and subsequently insert a newly revealed card above it. The scheduler now uses the renderer's existing `richSourceCards` order. Each verse inside a grouped card also has its own reveal boundary, preventing later verse headers and links from appearing before their turn. Original section data and committed source ordering are not rewritten.

The subsequent [selection and Continue repair](ask-selection-and-continue-repair-2026-10-27.md) replaces retyped selection IDs with fixed references and moves whole-answer coverage judgment to the actual generated summary, without treating source planning labels as proof or a final veto.

English and Arabic rendering regressions advance the cursor through Quran, hadith and scholar sections, asserting that visible source containers are always an unchanged prefix of the final displayed order. The Quran fixture deliberately uses out-of-order, consecutive verses and tests the boundary between the grouped originals and translations. Focused reader, original-source and publication tests passed (27 tests); TypeScript passed. No paid requests were used.
