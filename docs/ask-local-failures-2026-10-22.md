# Recorded Arabic Ask failures — 22 October 2026

Status: reproduced from existing local traces; no automated paid replay. The recorded drafts are rejected model output, not approved religious content.

## Which code actually ran

The browser posted to `/api/ask/stream`, using the existing rich request pipeline. Patient execution, durable-worker acceptance, focused checks, distinct selection and provider-enforced structured output were not enabled in the local configuration. Recent patient-worker checkpoint repairs therefore do not establish that these browser requests exercise that worker. Launching the page and receiving HTTP 200 did not prove an answer could complete. This distinction should have been stated before asking Mo to test.

## Worship and benefit question

Trace: `work/local-ask-traces/2c562452-3a99-435d-804b-6cf56ad06fd8.jsonl`.

- Research returned 16 Quran verses, eight hadith and no eligible scholarly excerpts. The scholarly lookup recorded zero hits for one query set and five rejected hits for another; absence here is not proof of absence from the corpus.
- Context retrieval failed for Quran 35:15 and excluded that candidate. The local overall execution limit was disabled; the failure shown here is not an overall-answer timeout.
- Selection retained Quran 29:6, 51:56 and background verse 6:42, plus two background hadith. Quran 29:6 was assigned both concerns. This is a recorded model decision, not an independently reviewed completeness verdict.
- The first Quran draft did not explain selected verse 6:42. Local validation rejected it as `selected_source_unexplained` before independent checking. The extra background selection and mandatory explanation rule interacted badly; removing the rule would not prove the draft complete or useful.
- The remaining draft and shared correction contained malformed Unicode escapes in Arabic strings. JSON parsing rejected each complete response. No valid-looking child object was accepted. Their null results were then described misleadingly as invalid status/feedback.
- At about 52.9 seconds the result was incomplete, with no checked claims. This is not a success and is not fixed by choosing Arabic instead of English.

An earlier request, `3f273c03-a44e-4795-8d42-9634aee41952`, ended with `ResponseAborted` at about 8.4 seconds. The trace proves connection/request cancellation, not why the visitor's connection closed.

## Wronging someone: money versus words

Trace: `work/local-ask-traces/32a52ab1-af59-4f33-9e58-9829bf0d8a6a.jsonl`.

- Research returned 16 Quran verses, eight hadith and five scholarly excerpts.
- The second concern's ranking request supplied 29 candidates. The returned ranking contained 26, omitting `Q4:106`, `Q4:54` and `HE6035`.
- `checkedRerankerScores` correctly rejected an incomplete score set. The caller let that discovery failure terminate the whole answer with `invalid_reranker_result`, resulting in the generic browser error at about 36.4 seconds. It never reached evidence selection or answer writing.

## Repair made from this evidence

- The actual request adapter can discard a malformed discovery ranking and retain the fair bounded original-source pool for ordinary independent selection. No missing score is invented, no returned score is reused, and no extra ranking call is made. This grants no source, claim or completion approval. Cancellation, uncertain billing, storage errors and transport failures still propagate. The comparison adapter remains strict so a broken ranking cannot receive quality credit.
- The patient adapter uses the same explicit policy, while remaining disabled pending its existing acceptance requirements.
- The writer is instructed to emit literal UTF-8 Arabic rather than manually escaped letters. This is a preventive instruction, not a measured guarantee of valid future responses.
- Provider logs now identify rejected JSON objects without adding raw content to general diagnostics. Unreadable writer responses receive `writer_response_unreadable`, rather than being mistaken for refusals with defective refusal feedback.
- Minimal recorded ranking metadata and the two rejected Arabic outputs are offline regression fixtures. They contain no visitor conversation history or API credentials. The original private traces remain subject to the existing local retention policy.

## Still unproven

Live answer reliability, useful background selection, faithful complementary explanation, Arabic language quality, new strict-output routing, patient activation and the full source-review gates remain open. Offline replay shows that the deterministic failure is handled; it does not show that the next live answer will pass. Do not ask Mo to repeatedly pay to reproduce these same recorded failures.
