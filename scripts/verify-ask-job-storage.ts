// Real PostgreSQL execution in a private local PGlite database. No remote credentials/API calls.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { researchJobEncryption } from "../lib/ask/search-engine/job-encryption";
import { researchJobStore } from "../lib/ask/search-engine/job-store";
import { journalledModelTransport } from "../lib/ask/search-engine/transport-journal";
import { runNextResearchJob } from "../lib/ask/search-engine/job-worker";
import { modelFetch } from "../lib/ai/transport";
import { richAnswer, sections } from "../tests/fixtures/rich";
import { emptyPatientState, reducePatientEvent, type PatientEvent } from "../lib/ask/patient-protocol";
import type { PatientCheckpoint } from "../lib/ask/patient-engine";
import { runPatientResearch, type PatientEngineDeps } from "../lib/ask/patient-engine";
import { runPatientLease } from "../lib/ask/search-engine/patient-worker";
import { pack } from "../tests/fixtures/rich";
import { nextResearchProgress } from "../lib/ask/research-progress";

async function main() {
  const root = resolve(process.cwd(), "work/private-ask-evaluation");
  await mkdir(root, { recursive: true });
  const runtime = pathToFileURL(join(root, "sql-runtime/node_modules/@electric-sql/pglite/dist/index.js")).href;
  const { PGlite } = await import(runtime);
  const directory = await mkdtemp(join(root, "job-storage-check-"));
  let db = new PGlite(directory);
  const migration = await readFile("supabase/migrations/20261020145023_ask_research_jobs.sql", "utf8");
  const rightsMigration=await readFile("supabase/migrations/20261020152201_ask_scholar_rights_state.sql","utf8");
  const owner = "a".repeat(64), rate = "b".repeat(64), requestHash = "c".repeat(64);
  const cipher = { version: 1, keyId: "test", nonce: "test", tag: "test", ciphertext: "not-real-private-content" };
  const checks: string[] = [];
  const check = async (name: string, work: () => Promise<void>) => { console.info(`Checking: ${name}`); await work(); checks.push(name); };
  const rpc = async (operation: string, payload: Record<string, unknown> = {}) => {
    await db.exec("set role service_role");
    try { return (await db.query("select public.ask_research_job($1,$2::jsonb) result", [operation, JSON.stringify(payload)])).rows[0].result; }
    finally { await db.exec("reset role"); }
  };
  const reset = () => db.exec("truncate editorial.ask_research_jobs cascade");
  const enqueue = (dedupe = "d".repeat(64), extra: Record<string, unknown> = {}) => rpc("enqueue", {
    id: randomUUID(), owner, rate, dedupe, language: "en", request_hash: requestHash, request_cipher: cipher, max_cost_usd: 0.2, ...extra,
  });
  const claimed = async () => { await reset(); const job = await enqueue(); const lease = await rpc("claim"); assert.equal(lease.id, job.id); return lease; };
  const key = `${"f".repeat(64)}:1`;
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls");
    await db.exec("create schema auth; create table auth.users(id uuid primary key); create role auth_delete_fixture; grant usage on schema auth to auth_delete_fixture; grant select,delete on auth.users to auth_delete_fixture;");
    await db.exec(migration);
    await db.exec("create table editorial.source_rights(id uuid primary key,owner text,status text,max_quote_chars integer,search_index_allowed boolean,ai_processing_allowed boolean,expires_at date); grant select on editorial.source_rights to service_role;");
    await db.exec(rightsMigration);
    await check("server-only execution and table isolation", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        await assert.rejects(db.query("select public.ask_research_job('claim','{}')"), /permission denied/);
        await assert.rejects(db.query("select * from editorial.ask_research_jobs"), /permission denied/);
        await db.exec("reset role");
      }
    });
    await check("owner-scoped idempotency and conflict", async () => {
      const first = await enqueue(), same = await enqueue();
      assert.equal(first.id, same.id);
      assert.equal((await enqueue(undefined, { request_hash: "e".repeat(64) })).status, "idempotency_conflict");
      assert.equal((await rpc("read", { id: first.id, owner: "0".repeat(64) })).status, "not_found");
      assert.equal((await rpc("cancel", { id: first.id, owner: "0".repeat(64) })).status, "not_found");
    });
    await check("account deletion erases private research and fences stale submissions while preserving only unsettled billing", async () => {
      await reset();
      const account = randomUUID(), other = randomUUID();
      await db.query("insert into auth.users values($1),($2)", [account, other]);
      const first = await enqueue("1".repeat(64), { account_id: account });
      const lease = await rpc("claim");
      await rpc("reserve", { ...lease, key, max_cost_usd: 0.05 });
      await rpc("event", { ...lease, expected_sequence: 0, payload_cipher: cipher });
      const completed = await enqueue("2".repeat(64), { account_id: account });
      const secondLease = await rpc("claim");
      await rpc("reserve", { ...secondLease, key, max_cost_usd: 0.05 });
      await rpc("record", { ...secondLease, key, response_cipher: cipher, cost_usd: 0.01, provider_request_id: "gen-already-settled" });
      await rpc("finish", { ...secondLease, expected_sequence: 0, payload_cipher: cipher, state: "complete" });
      const uncertain = await enqueue("5".repeat(64), { account_id: account });
      const uncertainLease = await rpc("claim");
      await rpc("reserve", { ...uncertainLease, key, max_cost_usd: 0.05 });
      await rpc("record", { ...uncertainLease, key, response_cipher: cipher, cost_usd: null, provider_request_id: "gen-unsettled" });
      const unaffected = await enqueue("3".repeat(64), { account_id: other, owner: "9".repeat(64) });
      // Auth's deletion role has no editorial grant; only this narrow trigger uses definer rights.
      await db.exec("set role auth_delete_fixture");
      try {
        await assert.rejects(db.query("select * from editorial.ask_research_jobs"), /permission denied/);
        await db.query("delete from auth.users where id=$1", [account]);
      } finally { await db.exec("reset role"); }
      const retained = (await db.query("select * from editorial.ask_research_jobs where id=$1", [first.id])).rows[0];
      assert.equal(retained.account_id, null); assert.equal(retained.request_cipher, null); assert.equal(retained.lease_id, null);
      assert.equal(retained.status, "expired"); assert.notEqual(retained.owner_hash, owner);
      assert.equal((await db.query("select * from editorial.ask_research_events where job_id=$1", [first.id])).rows.length, 0, "deleted account events removed");
      assert.equal((await db.query("select * from editorial.ask_research_jobs where id=$1", [completed.id])).rows.length, 0, "settled account job removed");
      const stripped = (await db.query("select a.state,a.response_cipher,j.account_id,j.request_cipher from editorial.ask_research_attempts a join editorial.ask_research_jobs j on j.id=a.job_id where a.job_id=$1", [uncertain.id])).rows[0];
      assert.equal(stripped.state, "unsettled"); assert.equal(stripped.response_cipher, null); assert.equal(stripped.account_id, null); assert.equal(stripped.request_cipher, null);
      assert.equal((await rpc("event", { ...lease, expected_sequence: 1, payload_cipher: cipher })).status, "lease_lost");
      await assert.rejects(enqueue("4".repeat(64), { account_id: account }), /foreign key/);
      assert.equal((await db.query("select account_id from editorial.ask_research_jobs where id=$1", [unaffected.id])).rows[0].account_id, other);
      assert.equal((await rpc("record", { ...lease, key, response_cipher: cipher, cost_usd: 0.01, provider_request_id: "gen-late-bill" })).status, "ok");
      assert.equal((await db.query("select response_cipher from editorial.ask_research_attempts where job_id=$1", [first.id])).rows[0].response_cipher, null);
      await rpc("prune");
      assert.equal((await db.query("select * from editorial.ask_research_jobs where id=$1", [first.id])).rows.length, 0, "late settled expired job pruned");
    });
    await check("failed account deletion rolls back its research erasure atomically", async () => {
      await reset(); const account = randomUUID();
      await db.query("insert into auth.users values($1)", [account]);
      const before = await enqueue("6".repeat(64), { account_id: account });
      await db.exec("begin; set local role auth_delete_fixture");
      try { await db.query("delete from auth.users where id=$1", [account]); }
      finally { await db.exec("rollback"); }
      assert.equal((await db.query("select id from auth.users where id=$1", [account])).rows.length, 1);
      const job = (await db.query("select request_cipher,account_id,status from editorial.ask_research_jobs where id=$1", [before.id])).rows[0];
      assert.deepEqual(job.request_cipher, cipher); assert.equal(job.account_id, account); assert.equal(job.status, "queued");
    });
    await check("research export pages are account-scoped and exclude anonymous and newer requests", async () => {
      await reset(); const account = randomUUID(), other = randomUUID();
      await db.query("insert into auth.users values($1),($2)", [account, other]);
      for (let n = 1; n <= 11; n++) await enqueue(n.toString(16).padStart(64, "0"), { account_id: account, rate: n.toString(16).padStart(64, "0") });
      await enqueue("f".repeat(64), { owner: "9".repeat(64) });
      const first = await rpc("account_export", { account_id: account });
      assert.equal(first.jobs.length, 10); assert.ok(first.next);
      await enqueue("e".repeat(64), { account_id: account, rate: "e".repeat(64) });
      const second = await rpc("account_export", { account_id: account, after: first.next, as_of: first.as_of });
      assert.equal(second.jobs.length, 1); assert.equal(second.next, null);
      assert.equal(new Set([...first.jobs, ...second.jobs].map(row => row.id)).size, 11);
      assert.equal((await rpc("account_export", { account_id: other })).jobs.length, 0);
      assert.equal((await db.query("select count(*)::int n from editorial.ask_research_jobs")).rows[0].n, 13);
    });
    await check("Stop before enqueue prevents a late submission from starting",async()=>{
      await reset();
      const stopped=await rpc("cancel_key",{id:randomUUID(),owner,rate,dedupe:"d".repeat(64),language:"en"});
      assert.equal(stopped.state,"cancelled");
      const late=await enqueue();assert.equal(late.id,stopped.id);assert.equal(late.state,"cancelled");
      assert.equal((await rpc("claim")).status,"empty");
    });
    await check("shared per-visitor admission limit and idempotency exemption", async () => {
      await reset();
      for (let n = 0; n < 8; n++) assert.equal((await enqueue(n.toString(16).padStart(64, "0"))).status, "ok");
      assert.equal((await enqueue()).status, "rate_limited");
      assert.equal((await enqueue("0".repeat(64))).status, "ok");
    });
    await check("shared job polling limit does not block Stop",async()=>{
      const j=await claimed();
      await db.query("update editorial.ask_research_jobs set read_count=120,read_window_started=clock_timestamp() where id=$1",[j.id]);
      assert.equal((await rpc("read",{id:j.id,owner})).status,"rate_limited");
      assert.equal((await rpc("cancel",{id:j.id,owner})).state,"cancelled");
      await db.query("update editorial.ask_research_jobs set read_window_started=clock_timestamp()-interval '2 minutes' where id=$1",[j.id]);
      assert.equal((await rpc("read",{id:j.id,owner})).status,"ok");
    });
    await check("live scholar permission metadata respects revocation, expiry and duplicates",async()=>{
      const readRights=async()=>{
        await db.exec("set role service_role");
        try{return (await db.query("select * from public.read_current_scholar_site_rights($1::text[])",[["binbaz.org.sa"]])).rows;}
        finally{await db.exec("reset role");}
      };
      const rightsId=randomUUID();
      await db.query("insert into editorial.source_rights values($1,'binbaz.org.sa','short_quotes_only',600,true,true,null)",[rightsId]);
      assert.equal((await readRights()).length,1);
      await db.query("update editorial.source_rights set ai_processing_allowed=false where id=$1",[rightsId]);
      assert.equal((await readRights()).length,0);
      await db.query("update editorial.source_rights set ai_processing_allowed=true,expires_at=current_date-1 where id=$1",[rightsId]);
      assert.equal((await readRights()).length,0);
      await db.query("update editorial.source_rights set expires_at=null where id=$1",[rightsId]);
      await db.query("insert into editorial.source_rights values($1,'binbaz.org.sa','short_quotes_only',600,true,true,null)",[randomUUID()]);
      assert.equal((await readRights()).length,0);
      await db.exec("set role anon");
      await assert.rejects(db.query("select * from public.read_current_scholar_site_rights(array['binbaz.org.sa'])"),/permission denied/);
      await db.exec("reset role");
    });
    await check("event compare-and-swap and terminal exclusivity", async () => {
      const j = await claimed();
      assert.equal((await rpc("event", { ...j, expected_sequence: 0, payload_cipher: cipher })).sequence, 1);
      assert.equal((await rpc("event", { ...j, expected_sequence: 0, payload_cipher: cipher })).status, "sequence_conflict");
      assert.equal((await rpc("finish", { ...j, expected_sequence: 1, payload_cipher: cipher, state: "complete" })).status, "ok");
      assert.equal((await rpc("event", { ...j, expected_sequence: 2, payload_cipher: cipher })).status, "lease_lost");
      const view = await rpc("read", { id: j.id, owner, after: 1 });
      assert.equal(view.state, "complete"); assert.equal(view.events.length, 1); assert.equal(view.events[0].sequence, 2);
      assert.equal(view.request_cipher, undefined);
    });
    await check("expired worker lease can resume only settled work", async () => {
      const j = await claimed();
      await db.query("update editorial.ask_research_jobs set lease_expires_at=clock_timestamp()-interval '1 second' where id=$1", [j.id]);
      const next = await rpc("claim"); assert.equal(next.id, j.id); assert.notEqual(next.lease, j.lease);
      assert.equal((await rpc("pulse", j)).status, "lease_lost");
      assert.equal((await rpc("reserve", { ...next, key, max_cost_usd: 0.05 })).acquired, true);
      await db.query("update editorial.ask_research_jobs set lease_expires_at=clock_timestamp()-interval '1 second' where id=$1", [j.id]);
      assert.equal((await rpc("claim")).status, "empty");
      assert.equal((await rpc("read", { id: j.id, owner })).state, "reconciliation_required");
    });
    await check("Stop revokes work but permits recording a late billing receipt", async () => {
      const j = await claimed();
      await rpc("reserve", { ...j, key, max_cost_usd: 0.05 });
      assert.equal((await rpc("cancel", { id: j.id, owner })).state, "cancelled");
      assert.equal((await rpc("pulse", j)).status, "lease_lost");
      assert.equal((await rpc("record", { ...j, key, response_cipher: cipher, cost_usd: 0.01, provider_request_id: "gen-test" })).status, "ok");
      assert.equal((await rpc("read", { id: j.id, owner })).state, "cancelled");
      const costs = (await db.query("select spent_usd from editorial.ask_research_jobs where id=$1", [j.id])).rows[0];
      assert.equal(Number(costs.spent_usd), 0.01);
    });
    await check("reservations enforce the job cap and unknown charges stop completion", async () => {
      const j = await claimed();
      assert.equal((await rpc("reserve", { ...j, key, max_cost_usd: 0.15 })).acquired, true);
      assert.equal((await rpc("reserve", { ...j, key: `${"e".repeat(64)}:1`, max_cost_usd: 0.1 })).status, "budget_exhausted");
      assert.equal((await rpc("finish", { ...j, expected_sequence: 0, payload_cipher: cipher, state: "complete" })).status, "reconciliation_required");
      assert.equal((await rpc("record", { ...j, key, response_cipher: cipher, cost_usd: null })).status, "reconciliation_required");
      assert.equal((await rpc("read", { id: j.id, owner })).state, "reconciliation_required");
    });
    await check("settled response replay and actual cost above reservation", async () => {
      const j = await claimed();
      await rpc("reserve", { ...j, key, max_cost_usd: 0.05 });
      await rpc("record", { ...j, key, response_cipher: cipher, cost_usd: 0.01 });
      const repeat = await rpc("reserve", { ...j, key, max_cost_usd: 0.05 });
      assert.equal(repeat.acquired, false); assert.equal(repeat.state, "settled");
      assert.equal(Number(repeat.cost_usd), 0.01);
      const secondKey = `${"e".repeat(64)}:1`;
      await rpc("reserve", { ...j, key: secondKey, max_cost_usd: 0.05 });
      assert.equal((await rpc("record", { ...j, key: secondKey, response_cipher: cipher, cost_usd: 0.06 })).status, "reconciliation_required");
    });
    await check("expiry removes private bodies but retains uncertain billing metadata", async () => {
      const j = await claimed();
      await rpc("event", { ...j, expected_sequence: 0, payload_cipher: cipher });
      await rpc("reserve", { ...j, key, max_cost_usd: 0.05 });
      await rpc("record", { ...j, key, response_cipher: cipher, cost_usd: null, provider_request_id: "gen-uncertain" });
      await db.query("update editorial.ask_research_jobs set expires_at=clock_timestamp()-interval '1 second' where id=$1", [j.id]);
      await rpc("prune");
      const row = (await db.query("select request_cipher,status from editorial.ask_research_jobs where id=$1", [j.id])).rows[0];
      assert.equal(row.request_cipher, null); assert.equal(row.status, "expired");
      assert.equal((await db.query("select * from editorial.ask_research_events where job_id=$1", [j.id])).rows.length, 0);
      const attempt = (await db.query("select response_cipher,provider_request_id from editorial.ask_research_attempts where job_id=$1", [j.id])).rows[0];
      assert.equal(attempt.response_cipher, null); assert.equal(attempt.provider_request_id, "gen-uncertain");
      assert.equal((await rpc("read", { id: j.id, owner })).status, "expired");
    });
    await check("queue survives local database close and reopen", async () => {
      await reset(); const before = await enqueue();
      await db.close(); db = new PGlite(directory);
      const after = await rpc("read", { id: before.id, owner });
      assert.equal(after.id, before.id); assert.equal(after.state, "queued");
    });
    await check("encrypted repository and model journal work through actual SQL", async () => {
      await reset();
      const codec = researchJobEncryption("test-key", Buffer.alloc(32, 9).toString("base64"));
      const store = researchJobStore(rpc, codec), id = randomUUID();
      const request = { question: "synthetic private question", lang: "en", previous_user_messages: [] };
      await store.enqueue({ id, owner, rate, dedupe: "d".repeat(64), requestHash, request, maxCostUsd: 0.2 });
      const found=await store.find(owner,"d".repeat(64));assert.equal(found.id,id);assert.equal(found.question,request.question);
      const lease = await store.claim(); assert.ok(lease); assert.deepEqual(lease.request, request);
      let networkCalls = 0;
      const send = async () => {
        networkCalls++;
        return new Response(JSON.stringify({ id: "gen-local-fake", usage: { cost: 0.01 }, choices: [{ message: { content: "synthetic response" } }] }));
      };
      const target = "https://openrouter.ai/api/v1/chat/completions", init = { method: "POST", body: JSON.stringify({ prompt: "synthetic prompt" }) };
      await journalledModelTransport(store.attempts(lease, 0.05), send)(target, init);
      await journalledModelTransport(store.attempts(lease, 0.05), send)(target, init);
      assert.equal(networkCalls, 1);
      const event = { type: "progress", stage: "checking_evidence" };
      const n = await store.append(lease, 0, event); assert.equal(n, 1);
      const view = await store.read(id, owner); assert.deepEqual(view.events[0].payload, event);
      assert.deepEqual((await store.history(lease)).events[0].payload, event);
      const encrypted = JSON.stringify((await db.query("select request_cipher from editorial.ask_research_jobs where id=$1", [id])).rows);
      assert.ok(!encrypted.includes("synthetic private question"));
      const encryptedReplies = JSON.stringify((await db.query("select response_cipher from editorial.ask_research_attempts where job_id=$1", [id])).rows);
      assert.ok(!encryptedReplies.includes("synthetic response"));
      await store.cancel(id, owner);
      await assert.rejects(store.append(lease, 1, event), /lease_lost/);
    });
    await check("encrypted account export and lifecycle capability work through the real SQL store", async () => {
      await reset(); const account = randomUUID(), other = randomUUID();
      await db.query("insert into auth.users values($1),($2)", [account, other]);
      const codec = researchJobEncryption("account-fixture", Buffer.alloc(32, 12).toString("base64"));
      const store = researchJobStore(rpc, codec), id = randomUUID();
      const request = { version: 1, question: "Synthetic private account question", lang: "de", previous_user_messages: ["Synthetic earlier question"], engineRevision: "internal-only" };
      await store.enqueue({ id, owner, rate, dedupe: "d".repeat(64), requestHash, request, maxCostUsd: 0.2, accountId: account });
      const result = await store.exportAccount(account);
      assert.equal(result.jobs.length, 1); assert.equal(result.jobs[0].question, request.question);
      assert.equal(result.jobs[0].language, "de"); assert.deepEqual(result.jobs[0].previousUserMessages, request.previous_user_messages);
      assert.ok(!JSON.stringify(result).includes("internal-only")); assert.equal((await store.exportAccount(other)).jobs.length, 0);
      const stored = (await db.query("select account_id,request_cipher from editorial.ask_research_jobs where id=$1", [id])).rows[0];
      assert.equal(stored.account_id, account); assert.ok(!JSON.stringify(stored.request_cipher).includes(request.question));
    });
    await check("background worker completes and replays through the real SQL store", async () => {
      await reset();
      const codec = researchJobEncryption("test-key", Buffer.alloc(32, 9).toString("base64"));
      const store = researchJobStore(rpc, codec), id = randomUUID(), engineRevision = "f".repeat(64);
      const request = { version: 1, question: "Explain synthetic care", lang: "en", previous_user_messages: [], engineRevision };
      await store.enqueue({ id, owner, rate, dedupe: "d".repeat(64), requestHash, request, maxCostUsd: 0.2 });
      let networkCalls = 0;
      const stop = new AbortController();
      const append = store.append;
      store.append = async (...args) => {
        const n = await append(...args);
        if ((args[2] as { type?: string }).type === "section") stop.abort();
        return n;
      };
      const send = async () => { networkCalls++; return new Response(JSON.stringify({ id: "gen-worker-fake", usage: { cost: 0.01 }, choices: [] })); };
      const callFakeModel = () => modelFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({ prompt: "synthetic worker request" }) });
      assert.equal(await runNextResearchJob({ store, engineRevision, durationMs: 60_000, maxAttemptCostUsd: 0.05, send, signal: stop.signal,
        execute: async (_, callbacks, signal) => {
          await callFakeModel(); callbacks.onSection?.(sections[0]);
          await new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
          return { status: "rich_answer", answer: richAnswer };
        } }), "interrupted");
      const partial = await store.read(id, owner); assert.equal(partial.events.length, 1);
      store.append = append;
      // Simulate a dead worker lease. No second provider request may occur on redelivery.
      await db.query("update editorial.ask_research_jobs set lease_expires_at=clock_timestamp()-interval '1 second' where id=$1", [id]);
      assert.equal(await runNextResearchJob({ store, engineRevision, durationMs: 60_000, maxAttemptCostUsd: 0.05, send,
        execute: async (_, callbacks) => { await callFakeModel(); sections.forEach(s => callbacks.onSection?.(s)); return { status: "rich_answer", answer: richAnswer }; } }), "complete");
      const complete = await store.read(id, owner);
      assert.equal(complete.state, "complete"); assert.equal(networkCalls, 1);
      assert.equal(complete.events.filter(e => (e.payload as { type?: string }).type === "section").length, 4);
    });
    await check("patient pause checkpoint is private and Continue keeps the same job and sequence", async () => {
      await reset();
      const codec = researchJobEncryption("test-key", Buffer.alloc(32, 9).toString("base64"));
      const store = researchJobStore(rpc, codec), id = randomUUID(), engineRevision = "e".repeat(64);
      await store.enqueue({ id, owner, rate, dedupe: "d".repeat(64), requestHash, request: { version: 2, question: "Synthetic patient question", lang: "en", previous_user_messages: [], engineRevision }, maxCostUsd: 0.2 });
      const lease = (await store.claim())!;
      let state = emptyPatientState(id, "en");
      const event: PatientEvent = { version: 2, job_id: id, sequence: 1, type: "pause", reason: "source_failed" };
      state = reducePatientEvent(state, event);
      const checkpoint: PatientCheckpoint = { version: 2, engineRevision, state, evidenceRevision: 1, research: {} };
      await store.appendPatient(lease, event, checkpoint);
      const paused = await store.read(id, owner);
      assert.equal(paused.state, "paused"); assert.equal(paused.protocol, 2);
      assert.equal("checkpoint" in paused, false);
      await assert.rejects(store.continue(id, "0".repeat(64)), /not_found/);
      assert.deepEqual(await store.continue(id, owner), { id, state: "queued", sequence: 1 });
      const resumed = (await store.claim())!;
      assert.equal(resumed.id, id); assert.deepEqual(resumed.checkpoint, checkpoint);
      await assert.rejects(store.appendPatient(lease, { ...event, sequence: 2 }, { ...checkpoint, state: { ...state, sequence: 2 } }), /lease_lost/);
      const row = await db.query("select checkpoint_cipher::text as cipher, spent_usd from editorial.ask_research_jobs where id=$1", [id]);
      assert.equal(String(row.rows[0].cipher).includes("source_failed"), false);
      assert.equal(Number(row.rows[0].spent_usd), 0);
    });
    await check("unfinished discovery survives a worker lease restart without exposing originals or queries in events", async () => {
      await reset();
      const codec = researchJobEncryption("test-key", Buffer.alloc(32, 9).toString("base64"));
      const store = researchJobStore(rpc, codec), id = randomUUID(), engineRevision = "e".repeat(64);
      await store.enqueue({ id, owner, rate, dedupe: "d".repeat(64), requestHash, request: { version: 2, question: "Synthetic discovery", lang: "en", previous_user_messages: [], engineRevision }, maxCostUsd: 0.2 });
      const lease = (await store.claim())!;
      const discovery = nextResearchProgress(undefined, { candidates: pack.passages, working: pack.passages,
        queries: [{ query: { requirementId: "R1", family: "hadith", language: "en", text: "private unfinished query" }, attempt: 0, status: "planned" }],
        recoveryRounds: [{ attempt: 0, round: 1 }] });
      const event: PatientEvent = { version: 2, job_id: id, sequence: 1, type: "research_checkpoint", revision: discovery.revision, hash: discovery.hash };
      const checkpoint: PatientCheckpoint = { version: 2, engineRevision, state: reducePatientEvent(emptyPatientState(id, "en"), event), evidenceRevision: 1, research: {}, discovery };
      await store.appendPatient(lease, event, checkpoint);
      const view = await store.read(id, owner), publicText = JSON.stringify(view);
      assert.equal("checkpoint" in view, false);
      assert.equal(publicText.includes("private unfinished query"), false);
      assert.equal(publicText.includes(pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse.arabic : "invalid fixture"), false);
      assert.deepEqual(view.events[0].payload, event);
      await db.query("update editorial.ask_research_jobs set lease_expires_at=clock_timestamp()-interval '1 second' where id=$1", [id]);
      const restarted = (await store.claim())!;
      assert.equal(restarted.id, id); assert.deepEqual(restarted.checkpoint, checkpoint);
      const row = await db.query("select checkpoint_cipher::text as cipher, spent_usd from editorial.ask_research_jobs where id=$1", [id]);
      assert.equal(String(row.rows[0].cipher).includes("private unfinished query"), false);
      assert.equal(Number(row.rows[0].spent_usd), 0);
    });
    await check("patient worker pauses and continues through SQL without rerunning finished source work", async () => {
      await reset();
      const store = researchJobStore(rpc, researchJobEncryption("test-key", Buffer.alloc(32, 9).toString("base64")));
      const id = randomUUID(), engineRevision = "a".repeat(64);
      await store.enqueue({ id, owner, rate, dedupe: "d".repeat(64), requestHash, request: { version: 2, question: "Synthetic patient work", lang: "en", previous_user_messages: [], engineRevision }, maxCostUsd: 0.2 });
      let networkCalls = 0, resumed = false;
      const researched: string[] = [];
      const send = async () => { networkCalls++; return new Response(JSON.stringify({ id: `gen-patient-fake-${networkCalls}`, usage: { cost: 0.01 }, choices: [] })); };
      const section = (group: string) => ({ ...sections.find(s => s.group === group)!, sources: sections.find(s => s.group === group)!.sources.map(s => ({ ...s, role: "direct" as const, requirementIds: ["R1"], explanationRequirementIds: [] })) });
      const execute: Parameters<typeof runPatientLease>[1]["execute"] = async (request, checkpoint, append, signal) => {
        const deps: PatientEngineDeps = { engineRevision, signal, append, revalidate: async () => true,
          research: async group => {
            researched.push(group);
            if (group === "scholar" && !resumed) return { status: "failed", reason: "source_failed" };
            if (group === "quran" || group === "scholar") await modelFetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({ synthetic_stage: group }) });
            return { status: "ready", passages: pack.passages.filter(p => p.source.kind === group) };
          },
          checkSection: async group => section(group),
          finalReview: async () => resumed ? { status: "complete", summary: section("summary"), guide: { text: "Read the cited explanation.", kind: "learning", refs: [] } }
            : { status: "needs_attention", reason: "source_failed", requiredGroups: ["scholar"], withdrawGroups: [] },
        };
        return runPatientResearch({ jobId: id, language: request.lang, checkpoint }, deps);
      };
      assert.equal(await runPatientLease((await store.claim())!, { store, engineRevision, maxAttemptCostUsd: 0.05, execute, send }), "paused");
      const partial = await store.read(id, owner); assert.equal(partial.state, "paused");
      assert.equal(networkCalls, 1); assert.equal(partial.events.filter(e => (e.payload as PatientEvent).type === "section").length, 2);
      await store.continue(id, owner); resumed = true;
      assert.equal(await runPatientLease((await store.claim())!, { store, engineRevision, maxAttemptCostUsd: 0.05, execute, send }), "complete");
      assert.deepEqual(researched, ["quran", "hadith", "scholar", "scholar"]); assert.equal(networkCalls, 2);
      const completed = await store.read(id, owner); assert.equal(completed.state, "complete");
      assert.equal((completed.events.at(-1)!.payload as PatientEvent).type, "terminal");
      const costs = await db.query("select spent_usd from editorial.ask_research_jobs where id=$1", [id]); assert.equal(Number(costs.rows[0].spent_usd), 0.02);
    });
    const report = { status: "passed", checkedAt: new Date().toISOString(), database: "local PostgreSQL via PGlite 0.5.10", migration: "unapplied remotely",
      migrationSha256: createHash("sha256").update(migration).digest("hex"), rightsMigrationSha256:createHash("sha256").update(rightsMigration).digest("hex"), checks };
    await writeFile(join(root, "job-storage-verification.json"), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    console.info(JSON.stringify(report, null, 2));
  } finally { await db.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "job_storage_verification_failed"); process.exitCode = 1; });
