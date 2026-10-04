# Ask end-to-end diagnostics — 2026-10-04

This change makes Ask's existing decisions visible. It does not repair retrieval or prove religious accuracy. Model requests, evidence acceptance, source approval rules, model chains, output allowances, retries and deadlines remain unchanged by this logging update.

## What appears in the logs

With `ASK_DEBUG=true`, each `/api/ask` request has one server-generated `request_id`. Its response also carries `X-Ask-Request-Id`. Timings use the same request start, including approved-answer lookup. Every diagnostic contains the deployment revision and active claim-audit, tiered, lean and library-flow flags. Intake and prepared lookup initially show unknown model chains; live processing identifies its configured chains, and AI events identify the actual models used.

| Stage | Observations |
| --- | --- |
| Request | Intake, rejected requests, question length, language, bounded history count and enabled source paths |
| Approved reuse | Lookup skipped, matched or missed; matching checker calls when used; saved answers identified separately |
| Question plan | Question type, requested-point IDs and facets, qualifier/interpretation counts and query counts per language |
| Retrieval | Reader query/hit counts, mixed-search ceiling, authenticity/text/length/continuation/title filters, eligible and returned totals, loaded source-group counts |
| Candidates | Before/after counts, dropped IDs, source IDs, original/authoritative translation lengths, context count and passage fingerprints |
| Selection | Raw assessment counts, duplicate/unknown/omitted IDs, relevance, context safety, requirement assignments and observed direct support per point; exact validator failure codes and correction pass |
| Sealed package | Accepted passage IDs/fingerprints and sources covering each required point |
| Writing | Actual payload text-presence flags, citation IDs, draft-local claim IDs and lengths, section counts, parse result, missing-point IDs when validated feedback exists, correction attempts and failure codes |
| Checking | Individual claim verdicts, whole-answer completeness/fairness/context verdicts and per-point verdicts; audit dimensions when that flag is enabled; validation failure categories and the complete-answer retry |
| Optional videos | Whether allowed, available time and retained video count; model calls if title checking runs |
| Answer/display/response | Automatically checked answer source shares, explicit `manual_reviewed:false`, live/saved outcome, display-translation attachment time, final HTTP status and total elapsed time |
| AI | Logical call ID, writer/checker role, phase, input/schema lengths, output allowance, actual fallback models, each OpenRouter HTTP attempt/status/time, returned token/cost/finish metadata and safe failure category |

Original `ask step`, `ask refused`, `ai answered` and `ai cost` lines remain. Prefer the structured `ask diagnostic` entries to correlate requests; older standalone lines can interleave between visitors. Costs are provider-reported values from replies, including truncated replies. An absent cost is unknown, not zero. Logging does not reconcile billing, settle reservations or replace the experiment spending ledger.

## How Mo can use this

Open the deployment's function logs and filter to `/api/ask`. Copy all `ask diagnostic` entries for one `request_id`, from `request_received` through `request_finished`. Sort by `elapsed_ms` if the viewer presents them out of order. Include the exact question separately when reporting a controlled test; it is deliberately absent from server logs.

The source journey is `ranked_sources` → `source_assessments` → `sealed_evidence` → `writer_evidence_payload` → `answer_assessments`. For example, direct support counts of zero followed by `no_direct_evidence_with_requirements` show selection refused before writing. A sealed package followed by `model_no_answer` shows the writer declined despite selection. Missing or uncertain screening verdicts show why an answer cannot be published.

The recent production charity trace reported 50 mixed hits, 46 reader-eligible hadith and 8 returned hadith, with the sole stored scholar hit rejected by its title/topic filter. Both selection attempts reported `no_direct_evidence_with_requirements`; neither drafting nor checking ran. Those counts demonstrate a selection-stage refusal, not that 46 hadith answered the visitor's question. The local response about Zakat al-Fitr alone does not establish complete coverage of a general charity question.

## Privacy and interpretation

Logs exclude visitor questions/history, answer text, source excerpts, search wording, model explanations, URLs, keys, headers, account identifiers and IP addresses. An explicit nested field/type allowlist admits only bounded metadata, fixed verdicts, known ID formats and SHA-256 passage fingerprints. Unknown keys disappear; malformed IDs/verdicts become `invalid` or `missing`. Oversized events retain a small `logging_truncated` marker. Diagnostic sink failures do not change model results. Request and call scopes remain separate under concurrency.

Selection and screening observations may themselves be malformed or mistaken: validators remain the acceptance authority. `supported:true` means the existing automatic checks passed; it is not a scholar review or independent proof of correctness. Detailed logs expose conditions, audience and causal checks only when the stronger audit runs; this update does not enable that experimental audit. Source wording still requires controlled source review to judge semantic quality.

## Validation and rollout

Offline verification: full suite **660 tests across 52 files**, `npx tsc --noEmit`, and production build **44 pages**. Tests cover recursive privacy filtering, disabled/failed sinks, concurrency, original request/result/error identity, physical HTTP retries and usage, existing recorded selection failures, unchanged legacy model requests and complete pipeline trace coverage. The build retains an existing `metadataBase` warning; it does not affect this diagnostics verification.

The update is based on `fd7331f`, the revision already reported by production. Moving `origin/main` forward therefore includes the previously committed source-wording repair and gated library flow already present in that deployment; it does not enable `ASK_LIBRARY_FLOW` or `ASK_CLAIM_AUDIT`. No translation files, database rows or hosting settings are changed. Detailed tracing uses the existing `ASK_DEBUG` setting; Mo must have it set to `true` in the deployed environment to see these entries.

No paid model evaluation was performed: additional experiment cost **$0**. Shared ledger SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`; the older reservation is still unsettled and the $1.50 cap remains in force. Model accuracy, live answer rates and latency acceptance gates remain unverified. A passing build and this logging change are not evidence that Ask is reliable. Confirm Vercel reaches Ready on the new commit before testing production and collecting a complete request trace.
