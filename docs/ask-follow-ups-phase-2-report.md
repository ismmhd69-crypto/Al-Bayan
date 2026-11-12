# Ask follow-ups: phase 2 local implementation

2026-10-30. Release 1 is implemented locally. Recorded model evaluation, Mo's acceptance and deployment are still pending. No paid model calls, commits or pushes were made.

## Done

- The false-claim isolation tests were the first deliverable. The tests cover false text in both `resolved_question` and `parent_sentences`, through the real review builder and rich engine, and through framing, retrieval, selection and final review in the actual pipeline. The false text is absent from candidates, the evidence package, cited originals and restriction context. A checker-shaped all-yes response that tries to use task text as an original is rejected by the real binding checks; no summary is published. A valid original-bound positive control still publishes.
- All four guard families moved to `lib/ask/follow-up.ts`: premise matching, bare references, exact user quotes for conditions, and invalid/missing follow-up fallbacks. The offline tool imports/re-exports this implementation. Its tests import the production guards directly; there is no weaker duplicate.
- Added حيث إن and إذ إن, conjunction/pronoun forms, simpler-wording endings in English and Arabic, feminine ordinals and a leading و. Standalone لان keeps the owner-accepted rare false alarm. The two self-contained pillar questions remain new questions.
- First questions without history/parent retain the existing planner request. A frozen pre-port system/schema/output-allowance fingerprint test passes. The retained non-rich AnswerV2 flow keeps its existing behavior. Existing fixed personal, greeting and harmful handling takes precedence; related rich follow-ups also check current/resolved/earlier user text with the personal gate.
- Signed parent references are checked before planner input. Forgery, altered/reordered sentences, changed IDs, language mismatch, expiry and secret rotation are tested. Invalid material is dropped, not forwarded. All new answerable follow-ups still search normally; source reuse is not built.
- The final review receives separate untrusted `task_context`. It is not added to the evidence pack. Context is also included in approval fingerprints and bound to process-local attempt identity/checkpoints, preventing a different parent from inheriting a previous answer's attempt. The existing cross-instance duplicate limitation is unchanged.
- Completed API answers capture passage hashes. Quran neighbours are copied and sorted by the same verse-key ordering as freshness checking. Only translations whose checks passed receive translation hashes. The summary must pass final review before a parent reference is issued. Metadata is added on the actual API pipeline boundary without mutating previously emitted source sections.
- New saved answers retain hashes when Quran/hadith text is stripped. Current sources are checked on hydration, with an Arabic/English update notice when hashes differ. Scholar hydration reads the current row and approved Arabic index terms by source ID, then applies the existing rights/publication RPC. A read-only check returned a current eligible quote from project `jnietkyxgnocyizvjiel`. No database writes or schema changes occurred.
- Saved answers discard parent references, including when hydrated. There is no new saved-chat continuation.
- The composer and follow-up progress use plain English/Arabic messages. Internal labels remain hidden. No jump labels, source-reuse flag or phases 3–5 work was added. Existing German strings were preserved; new required shared keys use an English fallback for the inactive German interface.

## What the stubbed tests establish

These tests exercise real application code, not a stub that simply answers rejected. The model fixtures return ordinary selections/drafts and apparently affirmative review fields, including an invalid evidence binding drawn from task text. The actual validators reject that binding. The positive control establishes that the exercised path can publish an original-bound answer.

This proves the tested data separation, citation-binding and publication boundaries. It does not prove that a real model will understand every false claim or always reject unsupported meaning while citing a syntactically valid original. It does not establish Arabic/English answer quality, rewrite fidelity or real-model injection resistance. Those need the separately approved recorded evaluation. Accepted format is not proof of meaning.

## Verification

- `npx tsc --noEmit`: passed.
- `npx vitest run`: 2,429 passed, sixteen skipped, the same four owner-listed failures only. No timeout failures.
- `npx next build`: passed after the final code edits.
- Five isolation tests, twenty-one Release 1 contract/signature/hash tests, two saved-hash tests and three stream-boundary/attempt-identity tests passed. Earlier guard tests now run against production implementations.
- Existing tracked tests and their expected call counts were not edited to obtain passing results. No safety assertion or production spending limit was removed or reduced.
- No real model calls, browser/device acceptance, production request testing or deployment. The only live source verification was read-only; it did not call an AI model.
- Logs: `work/ask-follow-ups-phase-2-vitest.log` and `work/ask-follow-ups-phase-2-build.log`.

The four retained failures are three in `tests/ask-legacy-compatibility.test.ts` and the labelled-translation test in `tests/ask-shared-system.test.ts`.

## Every plan amendment in this phase

The plan remains version 4.2.

1. Updated status: phases 0/1 accepted, Release 1 implemented locally, recorded evaluation and owner acceptance pending; no deployment.
2. Added the requested simpler-wording endings, feminine ordinals and initial و to the narrow dependent-reference list, retaining its exceptions and limitations.
3. Added حيث إن and إذ إن and documented the accepted standalone لان false alarm. Whole-word matching and user-written connector allowances remain.
4. Documented one shared production guard implementation, direct production tests, the frozen first-question contract, preservation of the retained AnswerV2 flow, and fixed-kind handling before follow-up validation.
5. Documented conservative parent-reference availability: only bounded references covering all shown stored sources are issued; otherwise the parent is marked unavailable. Oversize optional parent data is replaced with an unavailable marker rather than truncating signed sentences.
6. Documented current scholar hydration by source ID and approved index terms, saved hash preservation, and removal of parent references from saved/hydrated answers.
7. Recorded Mo's confirmation that live Ask works and that the secret is provided. The sixteen-session cap and `ASK_DAILY_LIMIT` stay unchanged. Recorded paid evaluation still requires separate approval.

The first-phase-2 isolation ordering and its stop/ship gate were retained. The false-parent planner result is not a planner blocker. Wrong intent, a lost scholar object and virtues search drift remain phase 3 diagnostics, not new release gates.

## What Mo should test

Without submitting any question, check the English and Arabic composer text and layout locally. Real-question tests spend money and wait for approval.

After approval, use these two conversations. Start a new chat before each language pair:

1. English first message: **What does Ibn Baz say about repentance when a sin is later repeated?**
2. English follow-up: **Explain that more simply.**

Check that the second reply addresses the cited topic, has its own checked sources and sentences, and searches again. During research it should show the plain checking-more-sources message, without internal labels or jump links. This is not a test that the AI may issue its own ruling.

3. Arabic first message: **ما هي الأحكام العامة لجمع الصلاة في السفر؟**
4. Arabic follow-up: **هل ينطبق ذلك على رحلتي غدا؟**

Check that the second message gets a scholar referral rather than a ruling on Mo's own journey. Confirm Arabic layout and wording read naturally. Tampering, expiry, saved-text changes and reference size are covered by automated tests; Mo need not edit source records or use developer tools.

## Approval needed next

Proposed recorded local pipeline evaluation: these four messages in two conversations, Vertex Gemini 3.1 Flash-Lite for writing/checking, at most thirty-six actual model dispatches within the existing per-message limits. Rough estimated cost $0.06–$0.20, with an additional hard $0.25 allowance for the whole evaluation. It must stop before exceeding the allowance or if billing becomes uncertain. This is a new run, not covered by earlier phase 1 approvals, and has not been started.

The cap is a stopping limit, not a promised charge or a guarantee all four messages will complete. Current-model quality and final owner acceptance remain open. No commits, pushes, phase 3 measurements, reuse or saved-chat continuation are authorized by completing this local implementation.
