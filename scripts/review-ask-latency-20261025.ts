// Fixed public quality sample. No dispatch without --run. Separate, capped ledger;
// previous experiment ledgers and private visitor questions are never replayed.
import { loadEnvConfig } from "@next/env";
import { mkdirSync, readFileSync, existsSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createServer, type ServerResponse } from "node:http";
import { connect } from "node:net";
import { abortable } from "../lib/ask/abort";
import { modelPriceCeiling, modelReservation } from "../lib/ai/price-ceiling";
import { ModelDispatchRefusal } from "../lib/ai/transport";

const cases = {
  "ar-parents": { lang: "ar", question: "ما حدود طاعة الوالدين مع وجوب الإحسان إليهما؟" },
  "en-promises": { lang: "en", question: "What do the Quran and authentic hadith say about keeping promises?" },
  "en-promises-sunnah": { lang: "en", question: "What do the Quran and authentic Sunnah teach about keeping promises?" },
  "de-speech": { lang: "de", question: "Was lehren Koran und authentische Hadithe über gute Worte und respektvollen Umgang?" },
} as const;
type Entry = { model: string; fingerprint: string; reserved: number; at: string; status?: number; cost?: number; generation?: string; durationMs?: number; inputTokens?: number; outputTokens?: number };
type Ledger = { cap: number; entries: Entry[]; held?: boolean };
// Separate $0.25 browser allowance explicitly approved by Mo on 2026-10-26.
// Never clear or reuse the earlier ledger's unresolved receipt.
const haikuBrowser = process.argv.includes("--haiku-browser");
const sampleCap = haikuBrowser ? 0.25 : 0.50;
const root = resolve("work", haikuBrowser ? "ask-haiku-browser-20261026" : "ask-latency-review-20261025"), ledgerPath = resolve(root, "spend.json");
function save(path: string, value: unknown) { const pending = path + ".pending"; writeFileSync(pending, JSON.stringify(value, null, 2), { mode: 0o600 }); renameSync(pending, path); }
async function main() {
  const id = process.argv.find(v => v.startsWith("--case="))?.slice(7) as keyof typeof cases;
  if (!cases[id]) throw Error("unknown_fixed_case");
  if (id === "de-speech") throw Error("german_work_paused_until_after_launch");
  if (haikuBrowser && (!process.argv.includes("--browser") || !process.argv.includes("--stable") || process.argv.includes("--continue") || process.argv.includes("--source-translation-review"))) throw Error("haiku_allowance_requires_new_stable_browser_test");
  if (process.argv.includes("--flex-price-only")) throw Error("flex_route_not_validated_for_required_privacy");
  if (!process.argv.includes("--run")) { console.log(JSON.stringify({ mode: "offline_manifest", id, language: cases[id].lang, sampleCapUsd: 0.50, maximumCases: 2 })); return; }
  mkdirSync(root, { recursive: true });
  loadEnvConfig(process.cwd());
  const unhurried = process.argv.includes("--unhurried");
  const stable = process.argv.includes("--stable"), streamVersion = stable ? 3 : 2;
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_UNHURRIED: unhurried ? "true" : "false" });
  const attempt = Number(process.argv.find(v => /^--attempt=[1-9][0-9]{0,2}$/.test(v))?.slice(10) ?? 1);
  const artifact = resolve(root, `${id}${stable ? "-stable-v3" : ""}${attempt > 1 ? `-attempt${attempt}` : ""}.json`);
  if (!process.argv.includes("--source-translation-review") && existsSync(artifact) && !process.argv.includes("--continue")) throw Error("case_already_attempted");
  let previous = process.argv.includes("--continue") && existsSync(artifact) ? JSON.parse(readFileSync(artifact, "utf8")) : null;
  if (process.argv.includes("--continue") && (!previous?.state?.continuation?.available || previous.continued)) throw Error("continuation_not_available");
  const lockPath = ledgerPath + ".lock", lock = openSync(lockPath, "wx");
  let ledger: Ledger;
  let guardReady = false;
  // Mo explicitly requested another run after the failed Haiku request. Keep
  // that exact rejected attempt fully reserved; never mark its cost as zero.
  const quarantine = new Set<string>();
  const unresolved = (entry: Entry) => entry.cost === undefined && !quarantine.has(entry.generation ?? "");
  const blockingHold = () => ledger.entries.some(e => unresolved(e) && e.durationMs !== undefined)
    || ledger.entries.some(e => e.cost !== undefined && e.cost > e.reserved)
    || !!ledger.held && quarantine.size === 0;
  try {
    ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, "utf8")) : { cap: sampleCap, entries: [] };
    if (process.argv.includes("--retest-with-reserved-receipt")) {
      const rejected = ledger.entries.find(e => e.generation === "gen-1793010904-HCORStb6JK7tLSi1Jgaz");
      if (!haikuBrowser || !rejected || rejected.status !== 400 || rejected.model !== "anthropic/claude-haiku-5.5"
        || Math.abs(rejected.reserved - 0.0126568) > 1e-10) throw Error("unexpected_quarantined_receipt");
      quarantine.add(rejected.generation!);
      // Only already finished, rejected Haiku attempts can be fully reserved
      // for this explicitly requested retest. A new failure still stops it.
      for (const entry of ledger.entries.filter(e => e.cost === undefined)) {
        if (entry.model !== "anthropic/claude-haiku-5.5" || entry.status !== 400 || !entry.generation?.startsWith("gen-")
          || !Number.isFinite(entry.durationMs) || entry.reserved > 0.02) throw Error("unrecognized_prior_hold");
        quarantine.add(entry.generation);
      }
    }
    if (ledger.cap !== sampleCap || blockingHold() || ledger.entries.some(unresolved)) throw Error("evaluation_requires_reconciliation");
  } catch (error) { closeSync(lock); unlinkSync(lockPath); throw error; }
  const original = globalThis.fetch, info = console.info;
  const diagnostics: unknown[] = [];
  const pendingReceipts = new Set<Promise<void>>();
  console.info = (...args: unknown[]) => { for (const arg of args) if (typeof arg === "string" && arg.startsWith("ask diagnostic: ")) try { diagnostics.push(JSON.parse(arg.slice(16))); } catch { /* Fixed metadata only. */ } };
  globalThis.fetch = async (target, init) => {
    const url = typeof target === "string" ? target : target instanceof URL ? target.href : target.url;
    if (url !== "https://openrouter.ai/api/v1/chat/completions") return original(target, init);
    if (blockingHold()) throw new ModelDispatchRefusal("billing_hold");
    if (init?.method !== "POST" || typeof init.body !== "string") throw new ModelDispatchRefusal("contract");
    const body = (() => { try { return JSON.parse(init.body); } catch { throw new ModelDispatchRefusal("contract"); } })();
    if (!body || typeof body !== "object" || Array.isArray(body)
      || !(haikuBrowser ? ["anthropic/claude-haiku-5.5", "google/gemini-3.8-flash", "mistralai/mistral-small-3.2-24b-instruct"] : ["openai/gpt-6-luna", "google/gemini-3.8-flash", "mistralai/mistral-small-3.2-24b-instruct"]).includes(body.model)
      || body.tools || body.plugins || body.stream || body.provider?.data_collection !== "deny" || body.provider?.zdr !== true
      || !Number.isSafeInteger(body.max_tokens) || body.max_tokens <= 0) throw new ModelDispatchRefusal("contract");
    // Restrict routing to the same price used by the reservation. This opt-in
    // narrows eligible endpoints; it never assumes a cheaper price after sending.
    const price = process.argv.includes("--base-price-only") && ["openai/gpt-6-luna", "anthropic/claude-haiku-5.5"].includes(body.model)
      ? { prompt: 0.10, completion: 0.50, request: 0 } : modelPriceCeiling(body.model);
    body.provider = { ...body.provider, max_price: price };
    const encoded = JSON.stringify(body), reserved = modelReservation(body, price);
    const exposureNow = () => ledger.entries.reduce((sum, e) => sum + (e.cost ?? e.reserved), 0);
    // Wait for already reserved calls to settle before declaring the fixed
    // sample unaffordable. Waiting dispatches no model request or paid retry.
    while (exposureNow() + reserved > ledger.cap && pendingReceipts.size && !blockingHold()) {
      await abortable(Promise.race([...pendingReceipts]), init.signal ?? new AbortController().signal);
    }
    if (blockingHold()) throw new ModelDispatchRefusal("billing_hold");
    const exposure = exposureNow();
    if (exposure + reserved > ledger.cap) throw new ModelDispatchRefusal("allowance");
    const entry: Entry = { model: body.model, fingerprint: createHash("sha256").update(encoded).digest("hex"), reserved, at: new Date().toISOString() };
    ledger.entries.push(entry); save(ledgerPath, ledger);
    let receiptDone!: () => void;
    const receipt = new Promise<void>(resolve => { receiptDone = resolve; }); pendingReceipts.add(receipt);
    const started = Date.now();
    try {
      const response = await original(target, { ...init, body: encoded }); entry.status = response.status;
      const headerId = response.headers.get("x-generation-id");
      if (headerId && /^gen-[a-zA-Z0-9_-]+$/.test(headerId)) entry.generation = headerId;
      save(ledgerPath, ledger);
      const data = await abortable(response.clone().json(), init.signal ?? new AbortController().signal);
      entry.durationMs = Date.now() - started;
      if (typeof data?.id === "string" && /^gen-[a-zA-Z0-9_-]+$/.test(data.id)) entry.generation = data.id;
      if (haikuBrowser && !response.ok) save(resolve(root, `${entry.generation ?? entry.fingerprint}.rejection.json`), { status: response.status, error: data?.error ?? null });
      if (typeof data?.usage?.cost !== "number" || !Number.isFinite(data.usage.cost) || data.usage.cost < 0) throw Error("missing_receipt");
      entry.cost = data.usage.cost as number; if (entry.cost! > reserved) throw Error("unexpected_cost");
      if (Number.isSafeInteger(data.usage.prompt_tokens) && data.usage.prompt_tokens >= 0) entry.inputTokens = data.usage.prompt_tokens;
      if (Number.isSafeInteger(data.usage.completion_tokens) && data.usage.completion_tokens >= 0) entry.outputTokens = data.usage.completion_tokens;
      save(ledgerPath, ledger); return response;
    } catch { entry.durationMs = Date.now() - started; ledger.held = true; save(ledgerPath, ledger); throw Error("evaluation_billing_uncertain"); }
    finally { receiptDone(); pendingReceipts.delete(receipt); }
  };
  guardReady = true;
  try {
    if (process.argv.includes("--source-translation-review")) {
      const { reviewSourceTranslation } = await import("./review-ask-source-translation-20261026");
      const result = await reviewSourceTranslation(attempt, () => guardReady && globalThis.fetch !== original);
      await Promise.all(pendingReceipts);
      console.log(JSON.stringify({ ...result, billingHeld: !!ledger.held, totalSampleCostUsd: ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0) }));
      return;
    }
    if (process.argv.includes("--condition-review")) {
      const { reviewConditionLogic } = await import("./review-ask-condition-logic-20261025");
      const results = await reviewConditionLogic(attempt, () => guardReady && globalThis.fetch !== original);
      await Promise.all(pendingReceipts);
      console.log(JSON.stringify({ mode: "fixed_condition_control", results, billingHeld: !!ledger.held,
        totalSampleCostUsd: ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0) }));
      return;
    }
    const { POST } = await import("../app/api/ask/stream/route");
    const { consumeRichStream, reduceRichEvent, emptyRichState } = await import("../lib/ask/rich-answer");
    const maximumPasses = process.argv.includes("--allow-three-continuations") ? 4 : process.argv.includes("--allow-two-continuations") ? 3 : process.argv.includes("--allow-one-continuation") ? 2 : 1;
    let browserResponse: ServerResponse | undefined;
    const browserCancel = new AbortController();
    if (process.argv.includes("--browser")) {
      if (!stable || maximumPasses !== 1 || previous) throw Error("browser_acceptance_requires_one_new_stable_request");
      await new Promise<void>(ready => {
        let dispatched = false;
        createServer(async (req, res) => {
          const path = new URL(req.url ?? "/", "http://127.0.0.1:8766").pathname;
          if (req.method === "POST" && path === "/api/ask/stream") {
            if (dispatched || req.headers.origin !== "http://127.0.0.1:8766") { res.writeHead(409).end(); return; }
            let body = ""; for await (const chunk of req) { body += chunk; if (body.length > 4000) { res.writeHead(413).end(); return; } }
            let value; try { value = JSON.parse(body); } catch { res.writeHead(400).end(); return; }
            if (value.question !== cases[id].question || value.lang !== cases[id].lang || value.stream_version !== 3) { res.writeHead(400).end(); return; }
            dispatched = true; browserResponse = res;
            res.on("close", () => browserCancel.abort());
            res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" }); res.flushHeaders(); ready(); return;
          }
          if (haikuBrowser) {
            // The real Next.js page and assets, not the isolated reader fixture.
            // Other mutations stay disabled in the operator's temporary bridge.
            if (req.method !== "GET") { res.writeHead(405).end(); return; }
            try {
              const upstream = await original(`http://127.0.0.1:3000${req.url ?? "/"}`, { cache: "no-store", redirect: "manual" });
              res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") ?? "application/octet-stream", "cache-control": "no-store" });
              if (upstream.body) for await (const chunk of upstream.body) res.write(chunk);
              res.end();
            } catch { res.writeHead(502).end(); }
            return;
          }
          const file = path === "/" ? "index.html" : path === "/review.js" ? "review.js" : path === "/review.css" ? "review.css" : null;
          if (!file || req.method !== "GET") { res.writeHead(404).end(); return; }
          res.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
          res.end(readFileSync(resolve("work/stable-chat-review", file)));
        }).on("upgrade", (req, socket, head) => {
          if (!haikuBrowser || !req.url?.startsWith("/_next/")) { socket.destroy(); return; }
          const upstream = connect(3000, "127.0.0.1", () => {
            upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${Object.entries(req.headers).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join("\r\n")}\r\n\r\n`);
            if (head.length) upstream.write(head);
            socket.pipe(upstream).pipe(socket);
          });
          upstream.on("error", () => socket.destroy()); socket.on("error", () => upstream.destroy());
          socket.on("close", () => upstream.destroy());
        }).listen(8766, "127.0.0.1", () => console.log(JSON.stringify({ browserReady: true, language: cases[id].lang, port: 8766 })));
      });
    }
    for (let pass = 0; pass < maximumPasses; pass++) {
    const fixture = cases[id], beforeCalls = ledger.entries.length, beforeDiagnostics = diagnostics.length, beforeCost = ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);
    const started = Date.now(), events: { type: string; ms: number; group?: string; outcome?: string }[] = [];
    const displayedSections: unknown[] = [];
    let state = emptyRichState(), firstCardMs: number | undefined, firstExplanationMs: number | undefined;
    const body = previous ? { lang: fixture.lang, stream_version: streamVersion, continue_token: previous.state.continuation.token }
      : { ...fixture, stream_version: streamVersion, supports_clarification: true };
    const response = await POST(new Request("http://localhost:3000/api/ask/stream", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(body), signal: browserCancel.signal }));
    if (!response.headers.get("content-type")?.startsWith("text/event-stream") || !response.body) throw Error(`route_status_${response.status}`);
    await consumeRichStream(response.body, event => {
      browserResponse?.write(`data: ${JSON.stringify(event)}\n\n`);
      state = reduceRichEvent(state, event);
      const ms = Date.now() - started;
      if (event.type === "source_card") firstCardMs ??= ms;
      if ((event.type === "section_update" || event.type === "section" || event.type === "section_committed") && event.section.outcome === "ready") firstExplanationMs ??= ms;
      if ((event.type === "section_update" || event.type === "section" || event.type === "section_committed") && event.section.outcome === "ready") displayedSections.push({ ms, section: event.section });
      events.push({ type: event.type, ms, ...("section" in event && event.section ? { group: event.section.group, outcome: event.section.outcome } : {}) });
    });
    browserResponse?.end();
    const terminalMs = Date.now() - started;
    await Promise.all(pendingReceipts);
    // Read-only reconciliation is allowed while billing is held. It cannot
    // create a model attempt or treat an unfinished receipt as a free retry.
    for (const entry of ledger.entries.filter(e => e.cost === undefined && e.generation)) {
      try {
        const receipt = await original(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(entry.generation!)}`, { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, signal: AbortSignal.timeout(5000), cache: "no-store" });
        const data = receipt.ok ? (await receipt.json()).data : null;
        const modelMatches = data && (data.model === entry.model || entry.model === "openai/gpt-6-luna" && data.model === "openai/gpt-6-luna-20260922");
        if (!data || data.id !== entry.generation || !modelMatches || !(data.cancelled === true || typeof data.finish_reason === "string" && data.finish_reason)
          || !Number.isFinite(data.total_cost) || data.total_cost < 0 || data.total_cost > entry.reserved || Math.abs(Date.parse(data.created_at) - Date.parse(entry.at)) > 10000) continue;
        entry.cost = data.total_cost;
        save(resolve(root, `${entry.generation}.receipt.json`), { id: data.id, model: data.model, cancelled: data.cancelled, finish_reason: data.finish_reason, total_cost: data.total_cost });
      } catch { /* Keep uncertainty held; no paid retry follows. */ }
    }
    if (ledger.entries.every(e => Number.isFinite(e.cost) && e.cost! <= e.reserved)) { delete ledger.held; save(ledgerPath, ledger); }
    if (state.continuation && !ledger.held && (state.result as { status?: string })?.status === "incomplete") {
      const check = await POST(new Request("http://localhost:3000/api/ask/stream", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
        body: JSON.stringify({ lang: fixture.lang, stream_version: streamVersion, action: "status", continue_token: state.continuation.token }) }));
      const value = await check.json();
      if (value.continuation) state = { ...state, continuation: value.continuation };
    }
    const summary = { id, language: fixture.lang, runtime: unhurried ? "local_unhurried" : "bounded_diagnostic", totalMs: terminalMs, receiptSettlementMs: Date.now() - started - terminalMs, firstCardMs: firstCardMs ?? null, firstExplanationMs: firstExplanationMs ?? null,
      status: (state.result as { status?: string })?.status ?? "interrupted", readyGroups: state.sections.filter(s => s.outcome === "ready").map(s => s.group),
      modelCalls: ledger.entries.length - beforeCalls, costUsd: ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0) - beforeCost,
      totalSampleCostUsd: ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0), billingHeld: !!ledger.held,
      continuation: state.continuation ? { available: state.continuation.available, remaining: state.continuation.remaining, reason: state.continuation.reason } : null };
    save(artifact, { summary, events, displayedSections, state, diagnostics: diagnostics.slice(beforeDiagnostics), ...(previous ? { continued: true, initialSummary: previous.summary } : {}) });
    console.log(JSON.stringify(summary));
    if (pass + 1 < maximumPasses && summary.status === "incomplete" && state.continuation?.available && !ledger.held) {
      previous = { summary, state };
      save(artifact.replace(/\.json$/, pass === 0 ? ".initial.json" : `.continuation${pass}.json`), { summary, events, displayedSections, state, diagnostics: diagnostics.slice(beforeDiagnostics) });
      // This command-line opt-in is the operator's explicit continuation action;
      // the website never performs this second POST automatically.
      continue;
    }
    break;
    }
  } finally { await Promise.all(pendingReceipts); guardReady = false; globalThis.fetch = original; console.info = info; closeSync(lock); unlinkSync(lockPath); }
}
main().catch(error => { console.error(JSON.stringify({ error: error instanceof Error ? error.message.replace(/[^a-zA-Z0-9_ -]/g, "").slice(0, 120) : "evaluation_failed" })); process.exitCode = 1; });
