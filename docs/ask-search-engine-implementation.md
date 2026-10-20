# Ask search engine: implementation record

Updated 20 October 2026. Full objective remains open. No production release or live accuracy claim.

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

| Phase | Current evidence | Still required |
|---|---|---|
| 0. Inventory and baseline | Current metadata inventory; 100 drafted multilingual intents; recorded failing request | Corpus/context and permission correspondence audit, human source labels, frozen reviewed baseline, cost reconciliation |
| 1. Reliable index | Checked source contract; real 40-source exporter/passage pilot; immutable private generations, cleanup and current fingerprints | Official-source/context review, embedding permission assessment, real model pilot, approved persistent vector storage and deployed refresh/cleanup |
| 2. Meaning retrieval | Hybrid algorithm, corpus adapters and optional actual-pipeline contextual ranking; lexical-only real-data probe | Real multilingual embedding/model comparison, persistent production integration and held-out recall report |
| 3. Evidence research | Missing-support planner/controller, novel-source detection, two bounded rounds and pipeline regressions | Live source-faithfulness and coverage comparison after reconciliation |
| 4. Useful answers | Existing rich v4 and independent checks retained | Stronger distinct-contribution/qualification evidence, reviewed usefulness and translation comparison |
| 5. Reliable lifetime | Encrypted leased store and connected guarded preview worker; local PostgreSQL ownership, admission, Stop, budget, worker redelivery/recheck and persistence proofs | Reconnect API/UI, approval/source revalidation on later reads, remote migration/grant acceptance, production hosting/cleanup/accounting, multi-process resilience proof |
| 6. Videos | Existing approved metadata inventory and legacy connector | Rich attachments, authorised transcript pipeline, checked segment/timestamp evidence and hydration |
| 7. Release | Offline checks above | Paid comparison after reconciliation, independent source/native-language review, UI/load checks, Mo acceptance and controlled deployment |
| 8. Growth | Preserved roadmap and approval boundaries | Only after preceding release gates; no new source, language or lesson evidence approval inferred |

The implementation is progressing; the full objective is **not complete**. The next engineering work is durable research jobs and stronger answer-quality checks, followed by rich video support and the remaining persistent index integration. The source-state migration remains unapplied. Source labels, embedding capability review and the billing receipt remain acceptance prerequisites. Production remains unchanged.
