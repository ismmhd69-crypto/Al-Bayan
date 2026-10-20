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

async function main() {
  const root = resolve(process.cwd(), "work/private-ask-evaluation");
  await mkdir(root, { recursive: true });
  const runtime = pathToFileURL(join(root, "sql-runtime/node_modules/@electric-sql/pglite/dist/index.js")).href;
  const { PGlite } = await import(runtime);
  const directory = await mkdtemp(join(root, "job-storage-check-"));
  let db = new PGlite(directory);
  const migration = await readFile("supabase/migrations/20261020145023_ask_research_jobs.sql", "utf8");
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
    await db.exec(migration);
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
    await check("shared per-visitor admission limit and idempotency exemption", async () => {
      await reset();
      for (let n = 0; n < 8; n++) assert.equal((await enqueue(n.toString(16).padStart(64, "0"))).status, "ok");
      assert.equal((await enqueue()).status, "rate_limited");
      assert.equal((await enqueue("0".repeat(64))).status, "ok");
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
    const report = { status: "passed", checkedAt: new Date().toISOString(), database: "local PostgreSQL via PGlite 0.5.10", migration: "unapplied remotely",
      migrationSha256: createHash("sha256").update(migration).digest("hex"), checks };
    await writeFile(join(root, "job-storage-verification.json"), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    console.info(JSON.stringify(report, null, 2));
  } finally { await db.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "job_storage_verification_failed"); process.exitCode = 1; });
