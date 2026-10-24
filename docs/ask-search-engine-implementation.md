# Ask search engine: implementation record

## Patient-source timing and blank-draft checkpoint

The latest blank answer had selected evidence in all three groups but failed pre-check formatting because draft text duplicated its structured source/requirement IDs. Exact duplicate suffixes are now removed before the unchanged support checks. Main source and display-translation transports obey unhurried local timing, and Quran/hadith checking no longer waits for unrelated scholar translations. Focused tests and TypeScript checking passed. No paid evaluation or production changes ran.

The main streaming barrier remains open: initial search/recovery still precedes rich writing. Section-state processing with late-evidence rechecking is required before claiming the requested patient streaming flow. See [evidence, implemented changes and remaining acceptance](ask-patient-sections-repair.md).

## Latest recovery parsing checkpoint

Owner request 27fb2e15-3b7b-4fb9-b75b-6f8b7bf276fa found the directly relevant hadith but stopped before writing because recovery ranking returned broken JSON. The shared parser incorrectly extracted a valid child object from that broken envelope. It now rejects the entire malformed envelope. 76 focused tests and TypeScript checking passed. This fixes false parsing success, not recovery availability or final answer quality. See [failure evidence and open work](ask-malformed-recovery-diagnosis.md). No paid request or production change ran.

## Latest local manual-test checkpoint

The latest owner request `a11ef261-1332-43c3-9029-1bb700a2ac87` passed source retrieval and correction but failed the software coverage map after 52.139 seconds. Coverage incorrectly demanded a direct source in every contributing sentence. The shared validator now checks direct support across the combined coverage row while retaining per-claim relevance and semantic checks. Background-only evidence remains insufficient. 111 focused tests and TypeScript checks passed. See [the diagnosis and remaining accuracy concerns](ask-combined-coverage-diagnosis.md).

This is not live accuracy acceptance. Search consistency, missed semantic errors, translations and broader engine gates remain open. The previous context-timeout and correction-feedback repairs are documented separately. No production change or automatic paid request ran.

Updated 21 October 2026. Full objective remains open. No production release or live accuracy claim.

## Enabled local preview and recorded ranking-crash repair

At Mo's request, the git-ignored local configuration now enables rich answers, streaming, meaning reranking and bounded recovery. The server was restarted on port 3000, and the rendered page confirmed `richEnabled: true`. The persistent corpus/vector model and durable worker remain unconfigured/off; production settings and model chains are unchanged. Earlier owner tests ran the legacy path and cannot validate the rich preview.

The first new rich attempt failed at reranking after 13.2 seconds: the model scored all 25 candidates but added one context-only reference, Q3:97. The exact-length validator threw before evidence selection. Candidate IDs are now schema-constrained, and a shared runtime validator excludes extra unknown IDs only if every real candidate retains exactly one valid score. Missing/duplicate/malformed scores remain rejected, and no context ID is promoted to evidence. The ignored count enters diagnostics. There is no added model retry or approval change. See the [failure and repair evidence](ask-reranker-context-fix.md).

The exact recorded response replayed successfully offline with 25 valid scores and one excluded context reference. Ninety-five focused ranking, rich-pipeline and shared-system tests passed, along with whole-project type checking and whitespace validation. No automated paid request ran. A subsequent manual request is still needed to observe later live stages; this fix does not prove whole-answer accuracy or finish the full engine objective.

## Source-context and real-question lookup checkpoint

The current-rights-revalidated forty-source pilot exposed three stored hadith with stale complete-context flags: Muslim 278e, 1343b and 2830b. Their official pages also describe dependent reports/variants. The shared structural detector no longer relies on chain length or a loose name-to-verb match, recognises additional back-reference forms and preserves explicit new speech/action. The library mapper now rechecks original text, closing the stale-generation and saved-source lookup bypass. No antecedent is guessed or source approval changed. See the [evidence, repairs and limits](ask-source-context-and-lookup-audit.md).

A fixed-question lexical component probe also exposed English questions matching formatting-tag names rather than teaching. Lookup now masks recognised tag attributes while retaining Arabic verse words and exact original bytes. Persistent generations pin a new lookup revision and reject stale lexical documents. For the same 75 tuning questions per language, Arabic candidate presence remained 74, English fell from 11 to 1 after removing tag matches, and German remained 1. Candidate presence is not accuracy; zero source labels are accepted and recall remains null. The pilot is not the full library or the live website pipeline. The initial full diagnostic exposed the draft held-out set, so a genuinely unseen frozen acceptance collection remains required.

The complete suite passed **1,075 tests across 90 files** with two workers, project type checking passed, and **14 actual local PostgreSQL/pgvector scenario groups** passed. One earlier run concurrent with PostgreSQL verification timed out in the existing spending-ledger disk-flush test; it passed unchanged in focused testing and in the final complete run. No accounting assertion or timeout was weakened. All SQL remains unapplied remotely. There were no model/embedding calls, imports, real approval changes or production changes; the spending hold remains active.

## Persistent database discovery checkpoint

The prepared `20261021101848_ask_persistent_search_index.sql` migration adds private immutable generations, atomic publication, current-source filtering, separate explicit embedding-capability receipts and exact/lexical/cosine fusion. No rights are seeded. Current originals, attribution, approved search documents and scholar/rights state are checked before candidate limits. Withdrawing a generation fences pinned reads; pruning removes expired/ineligible text and revoked vectors. All SQL remains unapplied remotely.

The validated TypeScript store and concern-by-family retriever use one pinned model recipe and one query batch, preserve candidate fairness and share the existing full-parent evidence reconstruction. A server-only project-pinned transport is available, but the website pipeline has not been switched to it. The real embedding provider, permissions, import, approximate indexing/scale work, deployment cleanup and broader acceptance remain open. See [persistent storage behaviour and gates](ask-persistent-search-storage.md).

Thirteen actual local PostgreSQL/pgvector scenario groups passed using invented text, vectors and permissions, including semantic discovery without word overlap and the multiconcern retrieval adapter. This proves the connection/storage rules, not religious or multilingual accuracy. The private report pins the SQL hash. Paid evaluation remains blocked by the same unreconciled receipt; the original spending ledger is unchanged.

The full offline suite passed **1,062 tests across 89 files** with four workers, and whole-project type checking passed. After a final manifest-type guard, the focused persistent/corpus tests and type check were rerun. No actual embedding model, remote database or production setting was used.

## Account research lifecycle checkpoint

Authenticated jobs now bind their verified account UUID privately in addition to HMAC ownership. The prepared migration's trigger erases private research inside the Auth deletion transaction, revokes work, removes settled jobs and detaches only minimal outstanding billing records. Late receipts cannot restore response text; detached records become pruneable after reconciliation. A failed deletion rolls its cleanup back. The repository checks an explicit lifecycle capability before authenticated enqueue, and the FK fences stale submissions after deletion. No live account or database was changed.

The account export route, encrypted repository export and actual account button now include retained user-request inputs through scoped ten-row pages. They exclude model drafts and source candidates. Chat and research reads use the same original bearer; a changed active account prevents releasing the download. English/Arabic/German privacy copy distinguishes private-text removal from text-free AI-cost reconciliation records. Native-language and rendered account-flow acceptance remain separate.

Nineteen actual local PostgreSQL scenario groups passed, including deletion-role isolation, unsettled-body erasure, rollback, stale writes, late receipts and account-scoped encrypted export. Report migration hash: `75266cdea6c5ea529424d3cac1b3d3b5ae932f29a0f6005b8ec72463de395103`. Unit/type checks cover the server and browser helpers. The [data lifecycle record](ask-research-data-lifecycle.md) lists precise behaviour and remaining deployment, browser, backup, logging, anonymous-retention and accounting gates. All new SQL remains unapplied remotely.

The full offline suite passed **1,049 tests in 88 files** with `npm test -- --maxWorkers=4`. An earlier unrestricted run had one five-second timeout in the spending guard's disk-flush test; that file passed unchanged in isolation, and the full suite then passed with fewer concurrent workers. Its timeout/assertions and ledger durability checks were not weakened. Whole-project type checking passed. No model evaluation, live account deletion, remote migration, approval change or deployment occurred; the spending ledger remains unchanged.

## Spending receipt investigation checkpoint

The original ledger and retained repaired-run report were re-examined. There are 266 entries, $0.51748087 in known charges and one $0.113472 reservation at 4 October 11:17:30.244 UTC with no generation ID, request fingerprint or HTTP status. The earlier saved report has no receipt for this exact attempt. An adjacent request is not safe billing evidence. No provider request was made without an ID, and the hold remains in place.

The evaluation-only guard now retains available header metadata and generation IDs before a missing-cost stop, records only a hash of outgoing request content and writes ledger updates through a flushed private temporary file under the existing lock. Invalid or negative recorded charges are rejected. The new read-only `npm run ask:spend:inspect` command reports the precise accounting gap without loading keys or changing the ledger. Thirteen focused spending-guard tests and whole-project type checking passed; tests used isolated temporary ledgers and mocked responses. See the [reconciliation evidence and recovery requirements](ask-spending-reconciliation.md).

Mo was asked for the provider generation ID and given the Activity dashboard steps. No cap increase, estimated charge, ledger reset, paid model call or production change occurred. The original ledger hash is unchanged. This blocks live evaluation, not the remaining independent local engineering work.

The subsequently supplied ID was checked with the provider's GET-only metadata endpoint. It is an already settled Mistral request at 11:17:15.109 UTC costing $0.00094047, matching the older saved report. It cannot settle the missing Gemini request reserved roughly 15 seconds later. The mismatch and bounded private receipt are recorded in the reconciliation document. No charge was reassigned and the hold remains active.

## Explicit local meaning-model adapter checkpoint

The index builder and actual local corpus retrieval can now share a concrete TEI embedding adapter, rather than only an injected test interface. It has no model default, installer, download, remote provider or retry. `ASK_LOCAL_EMBEDDINGS` remains off/unset; its explicit server-only JSON configuration pins a loopback endpoint, candidate model commit, dimensions, query/passage prefixes, precision, pooling, TEI version/build and reviewed deployment recipe. It cannot run in deployed mode. See the [local model connection contract and gates](ask-local-embedding-preview.md).

Before and after each batch the adapter checks reported deployment identity. It forbids auto truncation, requests unchanged originals with explicit role-specific prefixes, and rejects changed/malformed/nonfinite/zero vectors, wrong batch counts/dimensions, redirects and oversized responses. Cancellation stops waiting without an automatic retry. Only fixed failure codes escape; request text and provider error bodies are not logged. TEI identity and the operator-supplied recipe are not independent verification of loaded weights or hidden default prompts; actual deployment inspection remains required.

Vector-space identity now includes an optional recipe fingerprint covering all encoding settings. New query vectors cannot silently match an old index, or an index built using a different prefix/pooling recipe. Existing legacy generations remain compatible with their matching old contracts. Research-job configuration fingerprints also change when the local embedding configuration changes.

Offline checks use invented model responses and explicitly invented permissions. An actual loopback HTTP test verifies framing and redirect refusal; an actual immutable private index generation goes through `localCorpusRetriever`, exercises semantic discovery and restores the complete invented hadith parent. Removing its current eligibility prevents further query embedding. This is real connection and source-boundary behaviour, not evidence of real multilingual model performance.

The complete suite passed **1,033 tests across 86 files** before the final two adapter error/redirect cases were added. After those additions, 39 focused adapter/corpus/worker tests and whole-project type checking passed. No actual embedding inference or model download ran. No real source permission was changed, and the existing lexical pilot remains lexical-only. Real embedding-capability review, reviewed source labels, model/cost comparison, production vector storage and deployment remain open. The spending ledger hash remains unchanged at `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.

## Rich video learning attachments checkpoint

Rich v4 now supports an optional independently versioned `videos` attachment, with `version: 1` and `basis: title_only`. It permits at most two distinct structurally valid clips from the approved channels. Transcript/evidence claims, arbitrary channels and timestamp fields are not accepted. Existing v3/v2 formats remain unchanged. This does not complete semantic video/transcript search.

`ASK_RICH_VIDEOS=true` opts in, while `VIDEOS=off` still disables the route. Neither deployed settings nor `.env` were changed. Candidate title search runs alongside text retrieval. Optional relevance checking starts only after all checked source sections and the checked summary have streamed. It uses the existing checker with a separate metadata-only prompt and at most four seconds of the remaining request budget. Video text never enters the source selector, answer writer or religious claim checker. The new truthful `finding_videos` progress state is supported by event validation and all three language displays. Failure, timeout or no useful clips leaves the completed written answer intact. No paid evaluation of this added optional call has run; its cost still needs the guarded live comparison.

The actual rich chat renders a folded further-learning panel naming the channel and language. Its disclosure states that titles were matched and the recording was not checked as answer evidence. The existing player remains click-to-load with no thumbnail or iframe before consent to play. Ordinary JSON and terminal-stream results carry the same optional attachment; sections/order/citations remain unchanged.

Saved-chat hydration and durable reconnects check optional clips independently against current stored approval and exact metadata. Missing loaders, changed titles/channels, revoked entries and lookup failures hide clips without withdrawing the checked prose. The read-only database query uses the existing `public.videos` table and approved flag, bounded to the supplied IDs. This is freshness against the synchronised library, not a fresh YouTube availability/speaker-content check. Deployed sync/cleanup and recording review remain open.

The complete offline suite passed **1,011 tests across 84 files**, and project type checking passed. After adding the progress message and strict attachment envelope, focused regressions were rerun. Added checks cover pipeline ordering, independent opt-in, optional outages, strict metadata validation, saved-answer refresh, owned reconnect refresh and all-language server rendering. The offline browser used actual React components, mocked HTTP/history and invented clips: English disclosure was inspected, Arabic/German phone layouts stayed within 390 pixels, and no player or thumbnail existed before Play. Clicking Play created the privacy-enhanced iframe; its external request was explicitly blocked in the offline test. The private report is `work/private-ask-evaluation/related-video-browser-report.json`. Native-language acceptance, real clip relevance/availability, source-faithfulness and production acceptance remain unproven. No model API, embedding generation, schema write or deployment occurred.

## Browser integration and sentence-contribution checkpoint

The durable preview is now connected to the actual `AskChat` and `AskWorkspace` components behind the existing disabled switches. The browser stores only an expiring owner/language-scoped opaque locator, never the question, answer or bearer token. Reload and an ambiguous submission response find and read the same research job. Each request checks the bootstrapped owner scope before starting work. Unmount stops observation; explicit Stop cancels the work. A server-side submission-key cancellation tombstone also covers Stop arriving before enqueue.

Completed history saves use stable job/turn UUIDs, confirm matching existing records and pin writes to the original authenticated session. A lost insert response or save retry cannot intentionally create another turn or regenerate the answer. Account switches clear former messages and stale callbacks. Incomplete or cancelled work is not saved as complete. Production account deletion/export integration for temporary research data remains open.

The offline browser report at `work/private-ask-evaluation/browser-reconnection-report.json` uses the real React components with invented evidence and mocked HTTP/history, with no website model calls or real accounts. It covers ordinary completion, lost submission response, dropped read, reload, failed save/retry, Stop, New chat, account switch, changed source, Arabic phone layout and long German phone layout. Dedicated checks confirm one user message and one saved answer after reload/retry. Chromium repeated one lost HTTP submission; idempotency still produced one job. Discarded early async-wait/selector probes are documented in the report rather than counted as passes. This does not establish deployed source, model, native-language or database acceptance.

The latest local PostgreSQL verification report passed 15 scenario groups, including Stop-before-enqueue and restart/redelivery. Both migrations remain unapplied remotely. The owned offline UI fixture was stopped after inspection.

The independent rich-answer checker now must supply a contribution finding for every sentence, including what it adds, its role and any other sentence it repeats in meaning. Missing/duplicated findings, uncertain usefulness, restatements and a summary without direct synthesis prevent completion even if broad checker verdicts say yes. Findings join the existing checker call; no new model request is added. Brief findings are capped at 180 characters; checker output ceilings accommodate the added map. Only failure codes enter diagnostics, not the explanatory text. This is structured accountability for a semantic verdict, not proof that the verdict is correct. Blind source/usefulness review and the live cost/quality comparison remain open.

Validation at this checkpoint: **993 tests across 81 files passed**, and whole-project type checking passed. The focused quality/pipeline run passed 54 tests. Added tests cover contradictory broad-positive versus sentence-repetition findings and malformed/missing maps through the actual pipeline. No paid generation/embedding evaluation ran. The spending ledger remains unchanged at SHA-256 `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`.

## Reconnection API and current-source checkpoint

Five disabled-by-default POST routes now cover anonymous session bootstrap, idempotent submission, lookup by the original submission key, reading sequenced events and explicit Stop. They live under `/api/ask/jobs`. The bootstrap finishes before submission so a lost response cannot silently create a new anonymous owner. Anonymous ownership uses a signed HttpOnly/SameSite cookie and a separate stable HMAC secret. Signed-in ownership comes from Supabase's verified user lookup, with no anonymous fallback for an invalid bearer token. Questions, tokens and owner hashes are not placed in URLs.

The lookup route is read-only: it finds an already created job without enqueueing or making a model call. Only its verified owner receives the original question, decrypted from the bounded research request. The browser integration described above now retains an opaque submission/job locator rather than a plaintext question in browser storage.

Request bodies are byte-bounded while streaming in. The shared SQL store enforces 120 reads/lookups per job per minute, while Stop remains available when that polling allowance is exhausted. Source events are withheld until terminal status when the independent streaming switch is off. All replies are private/no-store; cancellation replies contain status only, not unchecked saved sources. Disabled-route testing confirms the path does not need storage or source credentials merely to remain off.

Every read replays and validates the full event history before releasing even a later cursor slice. `job-freshness.ts` checks request identity, order, section structure, language, terminal/state agreement and duplicate source consistency. `server-job-freshness.ts` compares current exact originals and attribution rather than substituting new text beneath an old explanation. Stored sources require current publication/permission receipts. Live scholar excerpts require current site permission, approved scholar identity and a direct official-original check outside the search cache. A withdrawn stored copy cannot be reintroduced merely through a URL-derived id or changed presentation slug. Ready display translations must still match their exact current record.

Prepared results require the current exact registry hash and approval decision, fresh source loading and current scholar permission/original checks. They do not receive a new generated explanation or inherit an unrelated approval. The existing prepared and legacy HTTP paths remain unchanged. The new metadata RPC in `20261020152201_ask_scholar_rights_state.sql` is service-only/invoker-rights and changes no permissions or approvals; it only reports currently eligible site metadata. Both it and the revised job migration remain unapplied remotely.

Changed evidence/approval is distinguished from a refresh outage. Neither returns the unchecked text or claims that religious evidence is absent. Changed material revokes remaining work where possible; a temporary refresh outage leaves the same job available for an unpaid read retry. These are read-integrity checks, not a new model source-faithfulness assessment. Full-parent context fingerprinting for live excerpts remains part of the outstanding source/context work.

Validation: all **971 tests in 77 files** passed, and the **whole-project type check now passes**. This supersedes the earlier unrelated learning-component typecheck limitation. New offline checks cover ownership, account switching, bootstrap-before-submission, ambiguous-submission lookup, full-history refresh, withdrawn sources and approvals, alias revocation, outages, scope isolation, byte limits and the independent streaming switch. A direct official-page test proves reconnect validation bypasses the earlier search cache. No model or live website-key evaluation ran.

The real local PostgreSQL run at `2026-10-20T18:56:48.440Z` passed fourteen scenario groups, including lookup of the encrypted original request, polling limits that do not block Stop, rights revocation/expiry/duplicate records and worker redelivery. Its report pins job migration SHA-256 `7180d0ec8a4e3c21fbe7841cfb4444c6a6f70cca6d45f3b1a9e7eeedfaa592fd` and rights migration SHA-256 `22063d25470f64557e3129516aa39f43d2647afd84238dc86a6a37e5564faeec`. This remains local SQL proof, not applied Supabase/Data API or multi-process proof. A local HTTP probe could not run because nothing was listening on port 3000; no rendered-browser acceptance is claimed.

The temporary encrypted job cache expires after 24 hours. Deployment must also verify actual cleanup, backup retention and source-specific storage obligations before enabling it. Quran Foundation's [current developer terms](https://api-docs.quran.com/legal/developer-terms/) distinguish temporary caching, offline Content Sync copies and derived material; encryption or SQL expiry alone does not establish compliance. Current flags, approval records, source data, the shared spending ledger and production are unchanged. Next: browser locator/reconnection/Stop integration and conversation-saving proof, followed by the remaining retrieval, answer-quality, video and release gates.

## Background worker checkpoint

`job-worker.ts` now runs one leased research job independently of an HTTP connection. It renews its database lease every five seconds, serialises checked-section events, verifies the terminal answer against the delivered sections, and stops when the database revokes its lease. Process interruption leaves the same job eligible for safe redelivery; Stop is a separate database cancellation. Late callbacks from interrupted work cannot continue writing.

On redelivery the worker loads its encrypted event history and replays recorded model responses through the transport journal. Previously delivered sections must match their newly checked counterparts before any new sections are appended. Changed or missing teaching withdraws the earlier material and returns an incomplete answer. A changed build/model/source configuration also prevents continuation under the old job contract. The configuration fingerprint records provider availability but never credential bytes. This is replay with recorded model output and revalidated source searches, not a guarantee that every external search result is immutable.

`research-runtime.ts` gives the separate worker an explicitly configured finite execution budget, bounded at ten minutes. Source/model transport stall limits remain active. The ordinary website route still has its existing 55-second ceiling; no browser field or environment deadline setting extends it. The worker's duration must be selected and accepted after measurement rather than silently set to a new default.

`scripts/run-ask-worker.ts` connects the worker to the existing real Ask pipeline and prepared-answer loader. It defaults off and requires explicit preview acceptance, an actual build revision, encryption configuration and conservative call reservations. It installs the **existing shared evaluation spending guard**, including interception of new OpenRouter calls; checking the old ledger once would not have been sufficient. Uncovered provider chains are rejected for this preview. The unsettled reservation still blocks a live run. This is a guarded preview launcher, not a deployed production queue service or permission to bypass the experiment budget for public traffic.

The SQL storage gained lease-protected history replay and a reconciliation hold. The local PostgreSQL verification now contains a twelfth scenario: run a worker with a fake model response, interrupt it after the first persisted section, expire its lease, and redeliver it through the real repository. It finishes with four sections and exactly **one fake network call**. No model, website key or remote database was used. The separate database close/reopen test remains in the suite; actual multi-process kill/restart and deployed queue tests remain release gates.

Fifteen focused worker/runtime/configuration tests cover ordering, rechecking without duplicate sections, changed teaching, changed engine configuration, uncertain billing, interrupted replay, revoked leases, false completion, honest partial status, ignored late callbacks, separate budgets and key-safe fingerprints. All **945 tests across 74 files** passed. The isolated Ask/AI/worker/script type check passed and its temporary configuration was removed. The twelve-group PostgreSQL repeat at `2026-10-20T15:14:54.877Z` pins the revised migration SHA-256 `f9ba84aa113f4d4eebafc97a52f5bbe5babc3bd48988a792473cc5545822b697`.

Website reconnect routes/UI, approval/source revalidation on every later read, production worker hosting and shared accounting acceptance remain open. The preview ledger's exclusive lock still requires verified operator recovery after a process crash; no automatic lock deletion or billing reconciliation has been introduced. The private database retry/replay proofs do not establish automatic recovery of that local preview launcher. This checkpoint does not make the browser resumable yet.

## Persistent job storage checkpoint

Migration `20261020145023_ask_research_jobs.sql` was created with the Supabase CLI and remains **unapplied remotely**. It adds private job, event and model-attempt tables, with RLS and no anonymous/authenticated table or function access. Its one server-only RPC runs with invoker rights and an empty search path. It adds no source data, approvals or new content permissions.

The storage design provides owner-scoped idempotency, request-conflict detection, shared admission limits matching the current defaults, a four-worker ceiling, 30-second renewable leases, stale-worker rejection, sequenced event compare-and-swap and exclusive terminal transitions. An expired worker with an uncertain provider attempt is held for reconciliation rather than redelivered. Model reservations count against a finite per-job cap before sending; missing or excessive receipts stop further work. Stop revokes permission to work while still allowing the original attempt to record a late receipt. This avoids losing billing information merely because the visitor cancelled.

Private input, events and recorded responses pass through authenticated encryption in `job-store.ts`. Ownership checks remain inside the SQL function as well as the server adapter. Event ciphertext is bound to its job and sequence; model-response ciphertext is bound to its job and attempt. Source/question bodies are not stored as plaintext. Expiry removes private bodies even for an uncertain bill; minimal unsettled billing metadata remains for operator reconciliation. The deployed cleanup schedule and reconciliation procedure remain to be built.

The migration and real application repository were executed against **local PostgreSQL through PGlite**, without remote credentials or model calls. Eleven scenario groups passed: visitor-role isolation, ownership/idempotency, shared rate limits, event/terminal conflicts, lease restart, Stop with late receipt, reservations/unknown bills, response replay/over-reservation, expiry, database close/reopen, and an encrypted repository/journal round trip through actual SQL. A confirmed fake model response was replayed without a second fake network call. These tests caught and repaired two PL/pgSQL variable/alias ambiguities. They are real SQL/persistence checks but do not prove multi-process locking on deployed Supabase, project-specific grants or Data API exposure.

Reproduce locally after installing the isolated test runtime into the ignored evaluation workspace:

```powershell
npm install --prefix work/private-ask-evaluation/sql-runtime --no-save --no-package-lock --ignore-scripts @electric-sql/pglite@0.5.10
npm run ask:jobs:verify
```

The report is `work/private-ask-evaluation/job-storage-verification.json`. The repeat at `2026-10-20T15:03:18.770Z` passed all eleven groups and pins the tested migration SHA-256 (`287bd20d0814a8a3bf379b49567e49d8c72ec51e1d99c916439eadc3ab6014ce`). The script uses synthetic content only and never opens `.env` or a remote database. It retains its private synthetic database directories for inspection. No application dependency or lockfile was changed by installing this test runtime.

All **930 tests across 73 files** passed after the storage changes. The isolated Ask/AI/script type check also passed and its temporary configuration was removed. The eight new repository tests check encryption before RPC, owner rejection, foreign/swapped ciphertext, missing event history, claimed-request decoding, sequence binding, held/lost worker state and malformed settled receipts. These checks do not establish the unfinished worker or public reconnect flow.

The server repository is prepared but unused by public routes. The worker, heartbeat loop, pipeline replay/checkpoints, reconnect API/browser flow and approval/source revalidation on later reads remain open. The new storage does not yet make the website resumable or allow longer production research. The paid-evaluation ledger and production settings remain unchanged.

## Research worker safety foundation

`lib/ai/transport.ts` provides a request-local transport hook for the future trusted worker. The three existing providers use it, while ordinary requests still resolve the current global fetch directly. Existing evaluation spending interception therefore remains in force. No worker context or new production behaviour is enabled.

`transport-journal.ts` reserves each exact HTTP attempt before sending it and can replay a recorded response with a confirmed cost receipt. Intentional identical calls have separate attempt ordinals. Unknown billing, a transport timeout or a failed receipt write raises a reconciliation error that is not the providers' retryable Busy error. A restarted job must check all older unsettled attempts before sending any new request, including when changed research would produce a different prompt. Missing cost is never assumed to be zero. The journal retains the provider response identifier where supplied, bounds response size and excludes credentials, headers and raw prompts from its hashed keys.

`job-encryption.ts` provides authenticated encryption for bounded private checkpoints using an explicitly supplied stable 256-bit key. Job identity, payload purpose and key version are authenticated, so ciphertext cannot be moved between jobs or from one payload type to another. Private model responses must be encrypted by the eventual persistent adapter.

These are worker integration foundations, not a durable queue implementation. The store interface requires atomic reservation, lease enforcement, encryption and spending-cap enforcement; the current tests use an in-memory fake and do not prove database durability, accounting reconciliation, provider exactly-once execution or browser reconnection. No job table, worker, new route or browser behaviour has been deployed. The production worker must also enforce shared admission limits and source/approval revalidation before serving a saved result.

Validation: the complete suite passed 921 tests in 72 files before the final job-wide replay guard was added. After that guard, all 31 focused transport and rich-pipeline tests passed, including 14 new transport/encryption cases. Ask and AI type checking passed using a temporary isolated configuration, which was removed. No provider was contacted, no paid evaluation ran, and the existing spending ledger hash is unchanged.

## Second implementation checkpoint

The current code passes 908 tests across 71 files. The isolated Ask search/pipeline type check passes. The last whole-project check still reports unrelated `secondaryPhoto` type errors in the concurrently edited `LearningMarkdown.tsx`; that file has not been changed by this task.

### Existing-source pilot and lifecycle

The new read-only exporter selects source family, publication, approved native search documents, rights, quote limits and scholar/grade metadata **before** its bounded result limit. It reads existing database rows only. The pilot at `2026-10-20T14:11:59.457Z` exported 20 hadith and 20 fatwa records, prepared 40 passages and revalidated all 40. Twenty have complete report context; twenty are scholarly excerpts whose wider context is explicitly unavailable. Stored-byte matching is distinguished from comparison against an official website, which was not performed by this pilot.

`source-passages.ts` preserves original characters and offset ranges. Oversized sentences stay whole instead of losing a condition through truncation. Context includes the complete stored parent. Continuation reports remain limited-context discovery records rather than being promoted to standalone hadith evidence. Publication does not automatically grant embedding rights: the pilot is explicitly **lexical only**, with no embedding model or query vector.

The pilot's reverse-lookup probe found all ten expected sources using body words absent from their titles. These queries were derived from the known originals, so this is a connection/full-text smoke check, not visitor accuracy, held-out recall or semantic performance.

Index generations now retain their own expiry metadata, use exclusive maintenance locks for publication/cleanup, and support physical removal of expired or withdrawn generations. Load-time receipts check both parent text and a fingerprint covering references, URLs, attribution, collection, numbering, grade and title. Rights are revalidated on load; missing or changed sources are excluded. An integration test caught and repaired a completion-clock bug that initially rejected permission receipts obtained after load began. Scheduled refresh and cleanup outside the local pilot still require deployment infrastructure.

### Corpus path connected to Ask

`corpus-retrieval.ts` pins one revalidated generation per question, batches query embeddings when an eligible vector index and matching embedder exist, reserves candidates across concerns and source families, and reports unrepresented concerns and truncation. It does not call an embedding service for a lexical-only generation.

`corpus-candidates.ts` deduplicates search windows by parent and restores the entire stored hadith before the existing authenticity checks. It retains approved scholar names and flags limited-context excerpts for the selector and writer. A translation search view cannot be relabelled as the Arabic original. Runtime source-group disable switches remain effective.

The rich pipeline can now receive these corpus candidates alongside its current searches. The local file adapter requires `ASK_CORPUS_RETRIEVAL=true`, an explicit private index path and, for this non-semantic pilot, `ASK_CORPUS_LEXICAL_PREVIEW=true`. These switches remain off; this is not a production filesystem search service or a completed multilingual embedding integration.

The server-only metadata reader uses a narrow proposed RPC rather than putting a Management API token in the visitor path. Migration `20261020141728_ask_index_source_state.sql` was created using the Supabase CLI. Its SELECT body was executed through the **read-only** Management API for two real hadith and two real fatwas: all four parent and metadata fingerprints matched the pilot. The migration itself, grants and RPC exposure have **not** been applied or deployed. The function is invoker-rights and explicitly revokes execution from public/anonymous/authenticated roles, granting only the server role; that access behaviour still needs verification after an authorised application.

### Gap-driven recovery connected to Ask

`recovery.ts` and `recovery-planner.ts` identify actual unsupported concerns or missing useful contributions, supply the earlier queries to a source-specific reformulation planner and allow at most two recovery rounds, each with at most six searches. Repeated queries and already visited source identities do not count as progress. Source outages, no new results, cancellation and operation caps remain distinct. Each novel batch goes back through independent evidence selection.

`ASK_RESEARCH_RECOVERY=true` enables this preview path; it remains off. Current writing/checking model chains are unchanged. If newly discovered material cannot be checked, the old evidence package is not silently retained as a complete answer, because the new material may contain a qualification. Tests cover this failure through the real pipeline. Existing non-rich model requests and approved prepared-answer boundaries remain compatible.

Additional commands:

```powershell
npm run ask:index:pilot
npm run ask:index:probe
npm run ask:index:prune
```

The first two need the existing read-only administrative token in the process environment for this local pilot. The last command deletes only expired local pilot generations, with optional explicit withdrawn-source IDs. No question bodies, model requests or database mutations are involved. It must eventually be run by deployed maintenance even without visitor traffic; merely having this command does not establish production retention compliance.

Real multilingual embedding comparison, the reviewed evidence benchmark, stronger final-answer usefulness acceptance, durable jobs, videos and production rollout remain open. The shared spending ledger is unchanged; no paid model call or embedding generation was made.

## Authoritative inventory

The read-only inventory completed at `2026-10-20T13:40:25.328Z` against Bayan project `jnietkyxgnocyizvjiel`:

| Material | Stored | Published | Approved Arabic search documents |
|---|---:|---:|---:|
| Hadith | 14,629 | 14,629 | 14,629 |
| Fatwa excerpts | 7,388 | 7,255 | 7,388 |

There were 21,482 approved video records, zero published source-translation records, and no orphan search documents. A search-document approval does not override an unpublished source: 133 unpublished fatwas remain excluded by the publication gate. None of these counts establishes exact original verification, adequate context or religious accuracy. Quran content comes from the external connector and was not included in stored-source counts.

The private rights metadata was read through the Management API's fixed **read-only** endpoint after the ordinary Data API could not expose the editorial schema. This did not change the schema, permissions, source rows or approvals. All eight rights records allow existing search and AI processing; seven are short-quotes-only and Sunnah.com is granted. Translation indexing is false in each record. Embedding-specific permission and the scope of correspondence must still be assessed; those capabilities were not silently inferred or granted by the inventory.

The standalone script's loaded environment files select `hadeethenc`, while a separate stored-hadith connector exists. This records the script's configuration, not the running dev process or production's environment. The previously captured local request independently confirmed HadeethEnc for that attempt.

Raw aggregate reports remain in the ignored `work/private-ask-evaluation/` directory. No source bodies, personal questions or credentials were written into the inventory report.

## Implemented and checked

### Source contract and private index prototype

`lib/ask/search-engine/contract.ts` preserves exact originals, fingerprints, parent/source identity, reference, span, context, attribution, rights state and model/vector-space identity. Runtime checks reject changed text, missing identity, malformed context, missing hadith grading, expiry and ineligible permissions. A limited-context excerpt can be discovered; that discovery does not approve an inference requiring its missing context.

`index-store.ts` builds embeddings in bounded batches through an injected provider. It never embeds a source without the explicit embedding capability, and never substitutes a translation or truncates an original. Provider vector dimensions, returned count, exact excerpt hashes and model versions are checked. There is no default embedding model, automatic model download, hosted embedding request or production corpus index yet.

Private index publication writes an immutable generation before atomically replacing the current pointer. Readers verify the file fingerprint, generation, model and expiry. Every load requires a current rights revalidation callback, so a stale index cannot itself preserve access to a revoked source. The prototype rejects expired generations and limits publication lifetime. Physical cleanup and source-change fingerprint checks have since been implemented in the second checkpoint above; deployed scheduling and the production Postgres/vector store remain open. This file prototype must not be mistaken for completed production retention infrastructure.

### Hybrid retrieval

`hybrid.ts` combines exact-reference lookup, full-content BM25-style lexical search, vector cosine search and reciprocal-rank fusion. It filters eligible sources before limits and interleaves source families and retrieval methods before the request-wide cap. Each hit retains concern and method provenance. Arabic lookup normalisation leaves originals unchanged.

There is a strict distinction between semantic retrieval available with a matching query vector and a lexical-only query. Missing query vectors are labelled explicitly; no word-matching fallback is called semantic search. Model/revision/dimension mismatches fail. Current tests use invented text and vectors; they prove mechanics, not multilingual model accuracy.

### Real pipeline meaning-ranking preview

`pipeline-ranking.ts` adapts the existing, already source-filtered pipeline candidates to a contextual meaning reranker before the old lexical caps. Each concern is scored separately, with source families preserved where they have a positive contribution. It has bounded candidate, context and model-call budgets. Ranking does not approve claims: the independent evidence selector and all existing answer checks still run.

The real pipeline uses this adapter only for rich answers when `ASK_MEANING_RANKING=true`. It defaults off. No `.env` file or deployed setting was changed. Existing writer/checker model chains are reused. Prepared-answer approval and legacy JSON behaviour are preserved. Invalid rankings fail explicitly, never silently masquerading as successful semantic ranking. An identical request-local recovery pool reuses its previous meaning ranking rather than paying to rank the same material twice.

This preview improves the ranking stage only. It cannot recover a passage that the upstream title-based provider never found, and it is not the complete corpus-wide hybrid path. That integration remains necessary.

### Duplicate scholarly sources

The rich pipeline now recognises the same official Ibn Baz fatwa ID and identical excerpt across differently spelled or encoded presentation URLs. Different excerpt wording remains distinct. Deduplication preserves combined per-concern search provenance and retains authoritative source objects. This is provider identity normalisation, not a topic-specific answer exception.

### Benchmark preparation and measurement

`prepare-ask-search-benchmark.ts` creates 100 intents and 300 language versions. It reuses the existing twelve-intent frozen checklist, adds 88 drafted concerns and keeps each intent's language versions together in one deterministic split. Drafts contain questions and concerns only. There are zero accepted source reviews and no invented religious answer key.

`benchmark.ts` measures retrieval evidence units, allows alternative valid passages, requires a reviewer and matching index generation for accepted labels, and reports unreviewed, missing-language and stale-generation cases separately. Its recall figure is not an answer-accuracy or scholarly-acceptance figure. Source-faithfulness labels, native-language review, held-out near-duplicate review and the frozen reviewed benchmark remain open. The generator refuses to overwrite review annotations.

## Commands

From the Bayan repository:

```powershell
npm run ask:inventory
npm run ask:benchmark:prepare
```

The inventory uses existing server credentials and GET/HEAD-only database metadata reads. If `SUPABASE_ACCESS_TOKEN` is supplied in the process environment, it can fall back to the fixed Management API read-only rights query. The script does not print the token and cannot execute arbitrary SQL. Without readable rights, the report marks eligibility unknown instead of claiming zero eligible material.

The benchmark command preserves an existing draft. Use `-- --replace-draft` only for an unannotated draft that should be regenerated. Human review work must be preserved separately.

## Validation evidence

- All 871 tests passed across 67 files after the pipeline, identity and index-store changes; type checking passed.
- A later whole-project type check found new syntax errors starting at `components/learning/LearningMarkdown.tsx:191`, after concurrent edits outside this Ask task. That learning file was not changed here. The earlier passing check is point-in-time evidence, not a claim that the current whole tree passes. An isolated search-engine/pipeline type check, including the new scripts and tests, passed using the same project compiler settings and explicit Node/React declarations. Its temporary configuration was removed. The full-project check must pass again before release.
- New checks cover meaning-only hits, absence of a query vector, exact references, family fairness, eligibility before limits, altered originals, version mismatches, Arabic-original preservation, contextual reranking, malformed scores, Stop, duplicate official-page URLs, source-kind retention through the real pipeline, rights-only metadata access, draft exclusion from metrics and immutable private index publication.
- The fixed synthetic regression showing eight retrieved hadith reaching the meaning ranker demonstrates that the old pre-selector four/three-item cap no longer precedes this optional ranking step. It does not establish eight useful real-world hadith.
- No embedding provider or live answer evaluation was invoked. Additional paid cost was zero.
- Shared ledger SHA-256 remains `FA92584AB52E6EC22A25D6A9C3C0C3412C5392CFBDEFC747EBD5010EA85844B7`. One $0.113472 reservation remains unsettled under the existing $1.50 cap. The ledger was not edited or reset.

## Full-plan completion audit

### Patient streaming checkpoint, 21 October 2026

The [ordered patient repair record](ask-patient-sections-repair.md) now distinguishes implemented, offline verified, live verified and accepted for each phase. Protocol-v2 coordination, actual search/model adapters, encrypted checkpoints, same-job Continue, lease/journal worker execution without a total elapsed answer deadline, and browser handling are implemented behind a disabled patient gate. The staged migration remains unapplied remotely. The existing site does not silently switch to this new worker path.

Local PostgreSQL checks and the offline real-component browser harness exercise pause/continue, source ordering, provisional sections, final saving and three-language presentation without paid calls. Exact-excerpt translation diagnosis found unpublished AI drafts, which remain withheld. The full-project type check now passes; the older LearningMarkdown type-check blocker described above is historical, not current.

Live source-faithfulness, measured latency/cost, the guarded six-question comparison, remote storage/worker acceptance and Mo's acceptance remain pending. The existing unsettled spending reservation still blocks automated paid evaluation. No migration, production deploy or approval change occurred.

Current automated result: **1,132 tests / 98 files passed**, whole-project TypeScript passed, and **21 local PostgreSQL verification groups passed**. The patient worker was exercised only with scripted sources and model transport, not paid live questions.

| Phase | Current evidence | Still required |
|---|---|---|
| 0. Inventory and baseline | Current metadata inventory; 100 drafted multilingual intents; recorded failing request | Corpus/context and permission correspondence audit, human source labels, frozen reviewed baseline, cost reconciliation |
| 1. Reliable index | Checked source contract; real 40-source exporter/passage pilot; immutable private generations, cleanup and current fingerprints | Official-source/context review, embedding permission assessment, real model pilot, approved persistent vector storage and deployed refresh/cleanup |
| 2. Meaning retrieval | Hybrid algorithm, actual corpus/ranking adapters and pinned local TEI connection; lexical-only real-data probe and invented-vector connection checks | Real permission-eligible multilingual embedding/model comparison, persistent production integration and held-out recall report |
| 3. Evidence research | Missing-support planner/controller, novel-source detection, two bounded rounds and pipeline regressions | Live source-faithfulness and coverage comparison after reconciliation |
| 4. Useful answers | Rich v4, independent checks and per-sentence contribution/repetition findings | Reviewed qualification/source-faithfulness, usefulness and translation comparison; live checker validity and cost |
| 5. Reliable lifetime | Encrypted leased store/preview worker; owned APIs; browser reconnection/Stop and saving; account erasure trigger and scoped export; local PostgreSQL/helper proof | Remote migration/Auth/grant acceptance, rendered account flow, production hosting/cleanup/backups/accounting, multi-process resilience proof |
| 6. Videos | Approved title suggestions integrated with rich v4, rendering, hydration and reconnect freshness; offline pipeline/browser proof | Real relevance/availability acceptance, semantic transcript retrieval, authorised transcript pipeline, checked segment/timestamp evidence and deployed library refresh |
| 7. Release | Offline checks above | Paid comparison after reconciliation, independent source/native-language review, UI/load checks, Mo acceptance and controlled deployment |
| 8. Growth | Preserved roadmap and approval boundaries | Only after preceding release gates; no new source, language or lesson evidence approval inferred |

The implementation is progressing; the full objective is **not complete**. Remaining engineering includes authorised transcript evidence, persistent index integration and production infrastructure, including deployed erasure/retention acceptance. Quality work still requires reviewed qualifications and source-faithfulness comparisons. All new migrations remain unapplied. Source labels, embedding capability review and the billing receipt remain acceptance prerequisites. Production remains unchanged.
