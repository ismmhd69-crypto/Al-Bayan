# Ask refusal diagnostics, 4 October 2026

Status: **diagnostics implemented and tested; the latest live failure's root cause is not yet identified or repaired**. `ASK_CLAIM_AUDIT` remains off by default. No model, prompt, schema, deadline, retry limit, source cap or safety acceptance rule was changed in this follow-up.

## Evidence and limits

Mo's supplied claim-audit-enabled production logs show invalid claim assessments after the first screen at 15.698 seconds and the correction's screen at 20.327 seconds, followed by `no_summary_after_screening_claim_audit`. They do not contain the checker payload, so they cannot establish which validation rule failed or whether the claims were unsupported.

The later claim-audit-disabled request reached source selection at 12.871 seconds and refused with `evidence_insufficient`, before drafting or screening. That message represents several different validator failures. It does not prove that retrieval found no relevant source, nor that changing the flag caused this refusal.

The pre-audit production builder from commit `648b0fd` was replayed offline using a scripted writer/checker and the controlled question “What does the Quran say about keeping promises?”. Its complete model requests were frozen in `tests/fixtures/ask-legacy-promises-requests.json`. The current pipeline, with the flag explicitly false or unset, sends identical requests and preserves both a successful outcome and an invalid-source-ID refusal. These are scripted compatibility tests, not captured live model responses or a real-model reproduction.

Existing recorded baseline source-selection responses were replayed with and without diagnostics. The sealed packages and refusals are identical, and inputs are not mutated. One historical zakah refusal now identifies `no_direct_evidence_with_requirements`; this is not evidence for the cause of the newer promises refusal.

## What changed

- Source-selection and claim-assessment parsers accept optional internal failure callbacks. Every existing rejection branch retains its rejection, with a bounded reason code describing the failure.
- Source reasons distinguish malformed fields/decisions, source and requirement IDs, non-direct assignments, unsafe context, missing coverage, source caps and scholar-position problems.
- Claim reasons distinguish missing assessment fields, wrong counts, unknown/duplicate claim IDs, citation mismatch, invalid decisions, inconsistent reason codes and invalid explanations. Valid negative/uncertain assessments remain separate from malformed output.
- Existing whole-answer and requirement-check failures also emit reason codes, including when claim audit is off. A diagnostic can describe a failed first attempt that is later corrected; use the final refusal/result to determine whether it prevented an answer.
- `ASK_DEBUG=true` enables `ask diagnostic:` JSON lines with request ID, stage, code, elapsed milliseconds, claim/tiered/lean flags, configured writer/checker chains and `VERCEL_GIT_COMMIT_SHA` revision. Invalid metadata is replaced with `unknown`. Actual fallback model names remain in the existing `ai answered:` lines; the new chain fields must not be presented as the actual answering model.
- Function logs contain no visitor questions, answer text, checker explanations or source excerpts. No public API or display changes.

## Verification and spending

Verification passed: **583 tests across 46 files**, `npx tsc --noEmit --incremental false`, and `npm run build` with all 44 pages generated. Tests cover diagnostic privacy, historical replay, pre-audit request compatibility, valid/invalid counterparts, malformed assessments and continued safe refusal. The existing safety suite remains in place. The build's existing `metadataBase`/localhost social-preview warning remains unrelated and was not changed.

No paid calls were made. The shared ledger was not modified: SHA-256 `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`, confirmed experiment cost $0.51748087, outstanding reservation $0.113472, cap $1.50. The supplied production logs concern later requests and do not settle the outstanding experiment. Controlled live reproduction, model detection tests and repeated live measurements remain blocked. There is no new measured answer rate, latency improvement or semantic accuracy result.

## Next evidence needed

After Mo deploys this diagnostics commit with `ASK_DEBUG=true` and `ASK_CLAIM_AUDIT=false`, an already-occurring refusal will include a precise `ask diagnostic:` line. Inspect that line in the same Vercel function invocation as the final `ask refused:` line and check its revision/flags. No further setting toggles or model changes are needed for diagnosis.

Once billing is reconciled, reproduce the controlled question through the production pipeline using the existing shared spending guard. Retain controlled inputs and raw outputs privately, freeze the failing response and a valid counterpart, and repair only the demonstrated request/validation-contract or framing/selection fault. Re-screen complete corrected answers and retain every existing safety gate. Keep claim audit off until its original real-model accuracy and speed acceptance gates pass.

Only this task's files are committed and pushed. Other sessions' translation/brand work, the spending ledger, Vercel settings and manual deployment are untouched. Production behavior is unverified until Mo deploys and a diagnostic is observed.
