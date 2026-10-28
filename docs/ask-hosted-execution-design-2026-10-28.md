# Ask on Vercel: hosted execution design (reliability plan Phase 5)

Date: 28 October 2026  
Status: **Design for Mo's decision. Nothing here has been deployed, migrated or switched on.** Each step marked "needs Mo" changes the live site, the database or a paid platform setting.

## The problem

Ask works locally but would not work reliably on askbayan.org yet:

- **The live site runs a different pipeline.** The simple pipeline that passed local testing only runs in local development (`askSimplePipeline` in `lib/ask/settings.ts`). Production would run the older stable-lanes pipeline, which has not been through this acceptance work.
- **Answers take longer than the route allows.** Local answers take 35 to 192 seconds, but the route sets `maxDuration = 60`. Since the Phase 5 code fix, a hosted run stops cleanly at 50 seconds with a Continue link, instead of being cut off without a message. Most answers would still need one or more Continues.
- **Sessions live in one server's memory.** Stop, status, Continue, duplicate detection and approved-answer reuse use process memory (`lib/ask/continuation-session.ts`, `lib/ask/private-research.ts`). On Vercel, a follow-up request can reach a different instance and find nothing.

## Facts about Vercel (from its documentation, last updated 24 August 2026)

- With Fluid compute, which is on by default for current projects, a function may run up to 300 seconds on Hobby and up to 800 seconds on Pro and Enterprise. Pro and Enterprise also have a 30-minute beta.
- Without Fluid compute, Hobby is limited to 60 seconds.
- `maxDuration` is set per route as a fixed export in the route file.
- Fluid compute reuses instances, so in-memory sessions survive more often, but this is not guaranteed.
- Vercel Workflows offer unlimited background execution; this would be a new integration.

## Recommendation: two steps

### Step 1: let most answers finish in one request (small change, needs Mo)

1. **Mo:** in the Vercel dashboard (Project, Settings, Functions), confirm Fluid compute is on and note the plan.
2. **Code (one line each):** set `maxDuration = 300` in `app/api/ask/stream/route.ts`, and give hosted stable runs a research limit of about 280 seconds instead of 50 (`CONTINUATION_LIMITS.runMs` in the stable branch of the route). This leaves time to send the final message.
3. **Decide which pipeline production runs.** The tested simple pipeline needs its development-only gate opened behind its existing flag. The safest form is two keys: `ASK_SIMPLE_PIPELINE=true` plus a new `ASK_SIMPLE_PIPELINE_HOSTED=true`, both off by default.
4. **Mo:** a Vercel preview deployment with `ASK_ENABLED` for a private test, then the same 10 fixed questions on the preview.

Expected result: most answers finish in one request. Stop, Continue and status still depend on the same instance, so they work most of the time but not always.

Risk: if Fluid compute is off, a 300-second setting can fail the deployment. Confirm step 1 first.

### Step 2: shared sessions (larger, needs Mo)

Reuse the existing, unapplied durable job system instead of building a new one:

- Migration `supabase/migrations/20261020145023_ask_research_jobs.sql` (prepared, **not applied**). It adds `editorial.ask_research_jobs` with an owner hash, encrypted request and checkpoint, status, leases, event replay and a model-attempt journal.
- `lib/ask/search-engine/job-store.ts`, `job-api.ts` and `job-worker.ts`, and `lib/ask/patient-server.ts`: the gated worker and client protocol (`ASK_DURABLE_ENABLED`, `ASK_PATIENT_ENABLED`, `ASK_JOB_WORKER_ACCEPTED`).

Work needed:
1. Store the simple pipeline's `ProgressiveCheckpoint.simple` record (frame, candidates, pending reassessment, search problems, frozen sections, approval fingerprint) in the encrypted checkpoint column, instead of process memory.
2. Make Stop, status, Continue and reuse read that row by owner hash, so any instance can answer.
3. Keep the dispatch and receipt ledger in the existing model-attempt journal, so an uncertain charge blocks paid sends across instances too.
4. Tests: two simulated instances sharing one store, covering Stop on one and status on the other, Continue after a restart, a duplicate in a second tab, and an uncertain charge.

**Needs Mo:**
- Apply the migration to project `jnietkyxgnocyizvjiel`.
- Set the private encryption and owner keys in Vercel environment variables. They must never be in chat or Git.
- Approve a preview deployment.

**Privacy:** the job design already encrypts the question and checkpoint, keys rows by an owner hash rather than an IP address, and has erasure and expiry fields. Review retention before launch.

## What is already done (offline, 28 October)

- A hosted stable run is bounded and ends with a final message and Continue link (`app/api/ask/stream/route.ts`, tested in `tests/reliability-phase-one-route.test.ts`).
- Stop and status no longer use the visitor's rate allowance.
- Status reports a finished, approved answer, and the client reuses it with a request the server refuses to turn into new research (`reuse_only`).
- Production logs record per-answer dispatches, cost and outcome as fixed codes and numbers (`research_accounting`).

## Decisions for Mo

1. Is Fluid compute on for the Vercel project, and which plan is it on?
2. Should production run the tested simple pipeline (recommended), behind two keys?
3. Should step 2 (shared sessions) be built before launch, or after a limited launch using step 1 only?
