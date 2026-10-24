# Persistent Ask discovery storage

21 October 2026. Implemented and verified locally; no remote migration, import,
permission change, website switch, model inference or production release.

## What exists

`20261021101848_ask_persistent_search_index.sql` prepares private PostgreSQL
generations, passages, a single publication pointer and an explicit embedding
capability register. It requires pgvector in the `extensions` schema and refuses
an existing installation in a different schema rather than silently relocating it.

`persistent-index.ts` validates and stages a complete generation in batches of 16.
Publication checks the expected count and current eligibility in one transaction.
An interrupted upload remains invisible and expires. There is no automatic
mutation retry after a lost reply. Published generations cannot be appended to;
an older pinned generation remains readable until withdrawn or expired.

The service-only, invoker-rights RPC supports begin, append, publish, manifest,
search, withdraw and prune. Private tables have RLS and no visitor grants. The
embedding register is empty on installation; service-role retrieval can read it
but cannot insert a review through the RPC. Ordinary indexing/AI rights do not
automatically allow embedding generation or storage. A capability receipt must
identify its rights record, reviewer, proof hash and expiry. This schema is a
place to record a real review, not evidence that one has occurred.

Only stored Arabic hadith/fatwa discovery is supported in this migration.
Quran remains with its existing connector. Videos/transcripts are not imported.
Neither search scores nor capability receipts approve religious statements.

## Retrieval and boundaries

The shared eligible-source view centralises the exact original and metadata
fingerprint used by `read_approved_index_source_state`. Before method limits,
retrieval joins current publication, source rights, native approved search
documents, acceptable hadith identity and approved scholar state. Original,
reference, URL, names and attribution changes invalidate the stored fingerprint.

Each concern and family receives separate exact-reference, lexical and cosine
candidate pools, capped at 20 per method and fused with reciprocal rank constant
60. SQL lexical ranking uses PostgreSQL `simple` full-text ranking; it is not the
filesystem prototype's BM25. The TypeScript adapter normalises lookup text only,
including Arabic diacritics, and masks recognised source-formatting tag attributes.
Generations pin the `source-lookup-v2` revision separately from the vector space;
the API refuses stale lexical revisions. The unchanged original and complete stored parent
remain available. Query vectors must match the pinned model, revision, dimensions
and deployment-recipe hash. Returned vectors are omitted. A current manifest with
no eligible vectors skips query inference rather than silently spending on it.

`persistent-corpus.ts` pins one generation, embeds the concerns in one batch and
makes at most eight bounded concern/family searches. Fairness precedes the final
request cap. The same `discoveredCorpusCandidates` helper now reconstructs parents
for both storage backends, retaining continuation and scholarly-context limits.
Final selection, meaning reranking, claim support and answer checking remain
necessary. Discovery does not bypass any of them.

`server-persistent-index.ts` supplies an explicit server-only Supabase transport,
pinned to Bayan's project. It sanitises storage errors, forwards cancellation and
bounds an individual storage request to ten seconds. Importing it does not load
keys or connect. Both server pipeline adapters now expose this store through
`server-corpus-router.ts`, behind `ASK_CORPUS_RETRIEVAL`, an explicit
`ASK_CORPUS_BACKEND=persistent` selection and `ASK_PERSISTENT_INDEX_ACCEPTED=true`.
The store is **not enabled locally or in production**. The default remains the
local adapter; an invalid or unaccepted persistent selection fails rather than
silently falling back. Production query-model and hosting acceptance remain open.

Hadith and scholar retrieval can be requested independently, so a pending scholar
index lookup does not block Quran or hadith work in the patient pipeline. Disabled
families are excluded before storage or query embedding. Semantic mode rejects
an absent embedder or eligible vector set before inference/search; lexical-only
preview is restricted to local development. Discovery still passes the shared
eligibility gate and independent evidence selection/checking.

Expired, withdrawn or currently ineligible passages are excluded immediately at
read time. Explicit pruning removes their stored text, deletes expired/withdrawn
generations and clears vectors whose capability was revoked or expired. Ordinary
still-permitted lexical search can continue without those vectors. Generations
expire within seven days; narrower source expiry takes priority. No scheduler
has been installed. Backups and database/provider logging remain deployment
obligations; the absence of visitor-text columns is not proof about query logs.

## Verification

`npm run ask:index:verify` executes the actual SQL and pgvector extension in a
private local PGlite database. The separate runtime is under ignored
`work/private-ask-evaluation/sql-runtime`, using PGlite 0.5.10 and
`@electric-sql/pglite-pgvector` 0.0.11. This is real PostgreSQL vector execution,
not a JavaScript replacement for SQL similarity. Source text, permission reviews
and vectors are all invented. The report records the tested migration hash at
`work/private-ask-evaluation/persistent-index-verification.json`.

Fourteen scenario groups cover visitor isolation, absent embedding rights,
cosine discovery without shared terms, exact/lexical/semantic fusion, pinned
multiconcern retrieval, immutability and vector-space mismatch, changed originals
and attribution, revoked capabilities, physical cleanup, rejected partial uploads,
scholar approval/name changes, withdrawal, expiry, cancellation and persisted
tag-metadata exclusion/revision mismatch. Unit tests also
exercise full-parent reconstruction, invalid hit/rank/score envelopes, inference
suppression, interrupted uploads and cancellation of an unresponsive transport.

## Still required before release

- Independently review real source and embedding/storage rights. Import no real
  vectors merely by changing the existing exporter's `embeddings: false` flag.
- Choose and evaluate a real multilingual model and its production query host;
  no real inference or multilingual accuracy comparison has run here.
- Prepare the accepted index and importer workflow, then activate and verify the
  already wired backend only after those gates. Keep source modes and rollback
  switches independent.
- Apply and verify the migration only with the deployment authorisation required
  by the repository. Test actual Supabase roles, Data API and extension placement.
- Implement and evaluate dimension-specific approximate vector indexes where
  justified. Current vector ranking is exact. Lexical/FK indexes exist, but no
  large-library query-plan, recall, concurrency or latency claim is made. This
  milestone does not establish worldwide-scale search.
- Schedule and inspect pruning, enforce retained-generation/storage budgets and
  verify backup, restore, logging and permission-revocation behaviour operationally.
- Complete the full benchmark, source-faithfulness/native-language review,
  spending reconciliation, guarded live comparison and Mo's preview acceptance.

Implementation follows the distinction between lexical and semantic candidate
ranking in [Supabase's hybrid-search guidance](https://supabase.com/docs/guides/ai/hybrid-search)
and uses the separately packaged [PGlite vector extension](https://pglite.dev/extensions/).
