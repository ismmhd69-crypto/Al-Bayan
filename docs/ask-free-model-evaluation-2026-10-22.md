# Free model online evaluation — 22 October 2026

## Decision

No website model switch. No reliable free writer/checker combination was established under Bayan's existing zero-retention/no-training routing rule. Mo explicitly chose to keep that rule during this evaluation.

## What was actually run

Read current OpenRouter catalog and endpoint metadata, then sent fixed synthetic JSON compatibility requests through the actual OpenRouter adapter. Ten distinct candidates were probed:

| Candidate | Observed live result |
| --- | --- |
| Xing4.0 29B A4B free | Two small schema requests completed; both reported cost 0. Other requests returned 429. |
| Nemotron 3.5 Super VL free | HTTP 404; no eligible route established. |
| dots 3 Note Preview free | HTTP 404; no eligible route established. |
| MiniMax M3.1 Flash free | HTTP 404; error classified as privacy routing unavailable. |
| Gemma 4 31B free | HTTP 404; error classified as privacy routing unavailable. |
| Inkling free | HTTP 403; unavailable to this request/account configuration. |
| Nemotron 3.5 Lightning free | HTTP 404; no eligible route established. |
| Nemotron 3 Ultra free | HTTP 404; no eligible route established. |
| Cohere North Mini Code free | HTTP 404; no eligible route established. |
| Flint free | HTTP 404; no eligible route established. |

Xing was then exercised with the actual active rich-pipeline question-framing request builder on the recorded Arabic worship, other people's rights and non-Muslim parents questions. All three attempts returned rate limits; execution stopped after three consecutive transport failures. These are component attempts, not full source-search/answer runs. The remaining nine prepared questions were not run. No accuracy percentage can be calculated from this session.

HTTP 403/404/429 is availability/configuration evidence, not evidence of poor religious reasoning. A successful small JSON response is not evidence of reliable Arabic explanations. No provider's marketing benchmark was used as source-faithfulness approval.

## Controls and records

- Evaluation process only; `.env.local`, website defaults and production unchanged.
- Exact `:free` model allowlist; provider price ceilings of zero for input, output and requests; provider fallbacks disabled; no tools, plugins or non-text paid extras.
- Existing no-training and zero-retention preferences required on every request.
- Separate writer/checker model identities still mandatory for full pipeline work.
- Successful generation must report cost exactly zero. Unknown/nonzero generation cost or uncertain transport stops further requests in that run. Pre-generation HTTP rejections are recorded separately and are not counted as successful zero-cost generations.
- Existing paid evaluation reservation/ledger untouched; its SHA256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.
- Private reports: `work/private-ask-evaluation/free-2026-10-22T*.json`. Headers and credentials are not recorded.
- Five focused guard tests and TypeScript checks passed. This verifies the testing controls, not model accuracy.

## Status

Implemented: isolated free-only evaluation runner and transport guard, twelve varied Arabic questions, actual active framing capture, private receipt reports.

Offline verified: five guard regressions; typecheck; whitespace check.

Live verified: public metadata, two zero-cost compatibility completions, actual routing/rate-limit failures. Zero complete answers evaluated.

Accepted: no free model or religious answer-quality acceptance. Broad online answer testing remains blocked by the absence of a working separate free checker and unstable writer availability within the retained privacy rule.
