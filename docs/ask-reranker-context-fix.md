# Local ranking failure: context reference returned as a candidate

21 October 2026. Local fix only. No new model call or production deployment.

The first owner-submitted request after enabling the local rich preview failed
after 13.2 seconds, before evidence selection or writing. Its private trace is
`9aa18ea6-f61a-4215-bd7a-ec28995b8603`. Retrieval supplied 16 Quran candidates,
8 hadith and one scholarly excerpt. The reranker received 25 candidate IDs and
returned a valid score for all 25 plus `Q3:97`, which appeared in neighbouring
context rather than the candidate list. The former exact-length check threw
`invalid_reranker_result`, producing the generic error shown to Mo. It was not
the overall processing deadline, a failed source search or an unsupported-answer
verdict.

The ranking prompt now explicitly distinguishes context references from candidate
identifiers, and its schema limits IDs to the supplied candidates. Runtime checks
remain authoritative because provider JSON mode need not enforce the schema.

The shared ranking validator discards an extra non-candidate score **only when
every supplied candidate still has exactly one finite score within 0–100**.
Missing candidates, duplicate IDs, malformed rows and invalid scores still fail.
Input/output bounds remain finite. No score is invented; no unknown ID becomes
a source. Both the pipeline and corpus rerank adapters use the validator.

This changes discovery metadata handling, not evidence approval. Existing
authenticity, permission, source-selection and final claim checks still apply.
The pipeline logs the ignored-ID count without logging arbitrary model ID text.
There is no additional paid correction/retry.

The exact recorded ranking metadata was replayed offline: 25 known scores
survived, one context-only reference was excluded, and no new model request ran.
The regression fixture contains only source IDs/scores, not visitor text,
original passages, prompts or credentials. Tests also cover missing scores,
duplicates, nonfinite/out-of-range values, candidate-object preservation, no
retry and the constrained provider schema.

The local Ask page still serves `richEnabled: true`. A further owner-submitted
request is needed to observe subsequent real-model stages. Passing this recorded
ranking result does not establish whole-answer accuracy or completion.
