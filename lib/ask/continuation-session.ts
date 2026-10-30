import { createHash, randomBytes } from "node:crypto";
import type { Locale } from "@/lib/i18n";
import { currentModelPriority, ModelDispatchRefusal, type ModelTransport } from "@/lib/ai/transport";
import { abortable } from "./abort";
import { emitAiTrace, currentAskStarted } from "./trace-context";
import type { ProgressiveCheckpoint } from "./progressive-checkpoint";
import { modelPriceCeiling, modelReservation, VERTEX_PRICES } from "@/lib/ai/price-ceiling";
import { localAskUnhurried } from "./settings";
import { sourceRequestTimeout } from "./timing";
import { remainingResearchMs } from "./research-runtime";
import { providerRejectionCategory } from "@/lib/ai/provider-error";
import { recordLocalAskEvent } from "./local-trace";

export const CONTINUATION_LIMITS = { ttlMs: 20 * 60_000, sessions: 16, continuations: 3, runMs: 50_000,
  calls: 48, outputTokens: 150_000, runCalls: 24, runOutputTokens: 75_000, concurrent: 3, costUsd: 0.50, bytes: 8 * 1024 * 1024, responseBytes: 2 * 1024 * 1024 } as const;
export class ResearchSessionStop extends Error {
  constructor(readonly code: "expired" | "busy" | "limit" | "billing_uncertain" | "cancelled" | "incompatible") { super(`research_${code}`); this.name = "ResearchSessionStop"; }
}
type Attempt = { state: "reserved" | "settled" | "accounted"; reserved: number; cost?: number; body?: string; status?: number; contentType?: string; generation?: string; callerStopped?: boolean };
export type ContinuationSession = {
  protocol: 2 | 3;
  engine: string;
  question: string; language: Locale; history: string[]; checkpoint: ProgressiveCheckpoint;
  expires: number; active: boolean; complete: boolean; held: boolean; cancelled: boolean; runs: number;
  calls: number; tokens: number; bytes: number; actualUsd: number; inFlight: number; attempts: Map<string, Attempt>;
  holdReason?: "missing_receipt" | "unexpected_cost";
  dispatchBlocked?: true;
  researchVersion?: 1; owner?: string; simple?: boolean; cacheOnly?: boolean; stop?: () => void;
};
const sessions = new Map<string, ContinuationSession>();
function expireWhenIdle(key: string, session: ContinuationSession) {
  const timer = setTimeout(() => {
    if (sessions.get(key) !== session) return;
    if (session.active || session.expires > Date.now()) expireWhenIdle(key, session);
    else sessions.delete(key);
  }, session.active ? CONTINUATION_LIMITS.ttlMs : Math.max(1, session.expires - Date.now()));
  timer.unref?.();
}
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
// Bump the contract when checking/reuse rules change. Configuration changes also
// expire existing approvals; credentials themselves never enter the fingerprint.
export const engineIdentity = () => digest(JSON.stringify({ contract: "progressive-20261027-simple-research-17",
  configuration: ["ASK_SIMPLE_PIPELINE", "AI_MODELS", "AI_VERIFIER_MODELS", "AI_PROVIDER", "AI_MODEL", "AI_VERIFIER_MODEL", "AI_FALLBACK_MODEL", "AI_VERIFIER_FALLBACK_MODEL", "OPENROUTER_STRUCTURED_OUTPUTS", "OPENROUTER_REASONING_EFFORT", "ASK_FOCUSED_CHECKS", "ASK_DISTINCT_SELECTION", "ASK_LIBRARY_FLOW", "ASK_MEANING_RANKING", "HADITH_SOURCE", "SCHOLAR_QUOTES", "SCHOLARS_LIVE", "ASK_CORPUS_RETRIEVAL", "QURAN_API_ENV", "QURAN_CHAPTERS"].map(name => [name, process.env[name] ?? ""]),
  doors: [!!process.env.OPENROUTER_API_KEY, !!process.env.VERTEX_API_KEY, !!process.env.GEMINI_API_KEY, !!process.env.NVIDIA_API_KEY] }));
// Module-local memory intentionally disappears on restart or code reload. No disk,
// database, browser persistence, background worker, or cross-instance recovery claim.
export function createContinuationSession(question: string, language: Locale, history: string[], now = Date.now(), protocol: 2 | 3 = 2, profile?: { owner: string; simple: boolean }) {
  for (const [key, value] of sessions) if (!value.active && value.expires <= now) sessions.delete(key);
  if (sessions.size >= CONTINUATION_LIMITS.sessions) throw new ResearchSessionStop("limit");
  const token = randomBytes(32).toString("hex");
  const session: ContinuationSession = { ...profile, ...(profile?.simple ? {researchVersion:1 as const} : {}), protocol, engine: engineIdentity(), question, language, history: [...history], checkpoint: { lanes: {}, meaningApprovals: new Set(), retry: 0 },
    expires: now + CONTINUATION_LIMITS.ttlMs, active: false, complete: false, held: false, cancelled: false, runs: 0, calls: 0, tokens: 0, bytes: 0, actualUsd: 0, inFlight: 0, attempts: new Map() };
  const ownedKey = digest(token);
  sessions.set(ownedKey, session);
  expireWhenIdle(ownedKey, session);
  return { token, session };
}
export function readContinuationSession(token: string, language: Locale, now = Date.now()): ContinuationSession {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ResearchSessionStop("expired");
  const session = sessions.get(digest(token));
  if (!session || !session.active && session.expires <= now || session.language !== language) throw new ResearchSessionStop("expired");
  if (session.engine !== engineIdentity()) throw new ResearchSessionStop("incompatible");
  return session;
}
export function claimContinuationSession(token: string, language: Locale, now = Date.now(), cacheOnly = false): ContinuationSession {
  const session = readContinuationSession(token, language, now);
  if (session.active) throw new ResearchSessionStop("busy");
  if (session.held || [...session.attempts.values()].some(a => a.state === "reserved")) throw new ResearchSessionStop("billing_uncertain");
  if (session.dispatchBlocked) throw new ResearchSessionStop("limit");
  if (session.cancelled) throw new ResearchSessionStop("cancelled");
  if (!cacheOnly && session.checkpoint.simple?.terminalNegative) throw new ResearchSessionStop("limit");
  if (!cacheOnly && (session.complete || session.runs > CONTINUATION_LIMITS.continuations || session.simple && session.calls >= 9)) throw new ResearchSessionStop("limit");
  if (cacheOnly) { session.active = true; session.cacheOnly = true; return session; }
  session.active = true; session.cacheOnly = false; session.checkpoint.retry = session.runs++; return session;
}
export function continuationAvailable(session: ContinuationSession) {
  return !session.checkpoint.simple?.terminalNegative && !session.held && !session.dispatchBlocked && !session.cancelled && !session.complete && !session.checkpoint.integrityBlocked && session.runs <= CONTINUATION_LIMITS.continuations && (session.active || session.expires > Date.now())
    && ![...session.attempts.values()].some(a => a.state === "reserved" && (!session.active || a.callerStopped))
    && session.calls < (session.simple ? 9 : CONTINUATION_LIMITS.calls) && session.tokens < CONTINUATION_LIMITS.outputTokens && session.actualUsd < CONTINUATION_LIMITS.costUsd;
}

/** Read-only receipt lookup. No prompt/content request, model retry, or research. */
export async function reconcileContinuationReceipts(session: ContinuationSession, key: string, send: typeof fetch = fetch) {
  if (session.active || session.holdReason === "unexpected_cost") return;
  for (const attempt of session.attempts.values()) {
    if (attempt.state !== "reserved" || !attempt.generation) continue;
    try {
      const response = await send(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(attempt.generation)}`, { headers: { Authorization: `Bearer ${key}` }, signal: sourceRequestTimeout(undefined, 5000, "receipt_lookup"), cache: "no-store" });
      const data = response.ok ? (await response.json()).data : null;
      if (!data || data.id !== attempt.generation || !(typeof data.finish_reason === "string" && data.finish_reason || data.cancelled === true)
        || typeof data.total_cost !== "number" || !Number.isFinite(data.total_cost) || data.total_cost < 0 || attempt.state !== "reserved") continue;
      session.actualUsd += data.total_cost - (attempt.cost ?? 0); attempt.cost = data.total_cost;
      if (data.total_cost > attempt.reserved) { session.held = true; session.holdReason = "unexpected_cost"; return; }
      let reusable = false;
      try { const body = JSON.parse(attempt.body ?? "null"); reusable = attempt.status === 200 && typeof body?.choices?.[0]?.message?.content === "string"; } catch { /* Truncated output has no reusable approval. */ }
      attempt.state = reusable ? "settled" : "accounted";
    } catch { /* Keep the reservation and require a later explicit receipt check. */ }
  }
  if (![...session.attempts.values()].some(a => a.state === "reserved")) { session.held = false; delete session.holdReason; }
}
export function finishContinuationSession(session: ContinuationSession, complete: boolean) {
  session.active = false; session.complete = complete; session.expires = Date.now() + CONTINUATION_LIMITS.ttlMs;
  const checkpointBytes = Buffer.byteLength(JSON.stringify({ ...session.checkpoint, meaningApprovals: [...session.checkpoint.meaningApprovals] }));
  if (checkpointBytes + session.bytes > CONTINUATION_LIMITS.bytes) { session.cancelled = true; session.checkpoint = { lanes: {}, meaningApprovals: new Set(), retry: session.checkpoint.retry }; }
}

/** A process-local attempt journal. A lost process makes the token unrecoverable;
 * an ambiguous send on the current process blocks ALL subsequent paid dispatches. */
export function continuationTransport(session: ContinuationSession, send: ModelTransport = (url, init) => fetch(url, init)): ModelTransport {
  const ordinals = new Map<string, number>();
  let runCalls = 0, runTokens = 0, sequence = 0;
  const queue: { priority: number; order: number; grant: () => void; deny: (reason: unknown) => void }[] = [];
  const pump = () => {
    queue.sort((a, b) => a.priority - b.priority || a.order - b.order);
    if (session.dispatchBlocked) {
      for (const waiter of queue.splice(0)) waiter.deny(new ResearchSessionStop("limit"));
      return;
    }
    if (session.held || !session.active || [...session.attempts.values()].some(a => a.state === "reserved" && a.callerStopped)) {
      for (const waiter of queue.splice(0)) waiter.deny(new ResearchSessionStop("billing_uncertain"));
      return;
    }
    while (session.inFlight < CONTINUATION_LIMITS.concurrent && queue.length) queue.shift()!.grant();
  };
  const acquire = (signal: AbortSignal | null | undefined) => new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const cleanup = () => signal?.removeEventListener("abort", aborted);
    const waiter = { priority: currentModelPriority(), order: sequence++, grant: () => { cleanup(); session.inFlight++; resolve(); }, deny: (reason: unknown) => { cleanup(); reject(reason); } };
    function aborted() { const index = queue.indexOf(waiter); if (index >= 0) queue.splice(index, 1); cleanup(); reject(signal?.reason); }
    signal?.addEventListener("abort", aborted, { once: true });
    queue.push(waiter); pump();
  });
  return async (url, init) => {
    const unhurried = localAskUnhurried() || remainingResearchMs() === Infinity;
    init.signal?.throwIfAborted();
    if (!session.active || session.cancelled) throw new ResearchSessionStop("expired");
    if (session.held) throw new ResearchSessionStop("billing_uncertain");
    if (session.dispatchBlocked) throw new ResearchSessionStop("limit");
    if ([...session.attempts.values()].some(a => a.state === "reserved" && a.callerStopped)) throw new ResearchSessionStop("billing_uncertain");
    // Direct Vertex (Mo, 2026-10-30): only a priced model, under every limit below.
    const vertexModel = /^https:\/\/aiplatform\.googleapis\.com\/v1\/publishers\/google\/models\/([\w.-]+):generateContent$/.exec(url)?.[1];
    const vertexPrice = vertexModel ? VERTEX_PRICES[vertexModel] : undefined;
    if ((url !== "https://openrouter.ai/api/v1/chat/completions" && !vertexPrice) || init.method !== "POST" || typeof init.body !== "string") throw new ResearchSessionStop("limit");
    const body = JSON.parse(init.body);
    const maxTokens: number = vertexPrice ? body.generationConfig?.maxOutputTokens : body.max_tokens;
    if (vertexPrice) {
      if (!Number.isSafeInteger(maxTokens) || maxTokens <= 0 || body.tools || !Array.isArray(body.contents)) throw new ResearchSessionStop("limit");
    } else {
      if (!Number.isSafeInteger(body.max_tokens) || body.max_tokens <= 0 || body.stream || body.tools || body.plugins || !Array.isArray(body.messages)
        || body.messages.some((m: { content?: unknown }) => typeof m.content !== "string") || !body.provider || body.provider.data_collection !== "deny") throw new ResearchSessionStop("limit");
      // Ceiling is provider routing, not a price estimate. Reserve pessimistically
      // using UTF-8 bytes, output allowance and margin, before any network dispatch.
      body.provider = { ...body.provider, max_price: modelPriceCeiling(body.model) };
    }
    const label = vertexPrice ? `vertex/${vertexModel}` : `openrouter/${body.model}`;
    const encoded = JSON.stringify(body), fingerprint = digest(encoded), ordinal = (ordinals.get(fingerprint) ?? 0) + 1;
    ordinals.set(fingerprint, ordinal);
    let key = `${fingerprint}:${ordinal}`, previous = session.attempts.get(key);
    // A reconciled truncated result has a known charge but no reusable output.
    // Only a new explicit continuation may dispatch a fresh bounded attempt.
    while (previous?.state === "accounted") { key = `${fingerprint}:${(ordinals.get(fingerprint) ?? ordinal) + 1}`; ordinals.set(fingerprint, Number(key.split(":")[1])); previous = session.attempts.get(key); }
    if (previous) {
      if (previous.state !== "settled") { session.held = true; throw new ResearchSessionStop("billing_uncertain"); }
      return new Response(previous.body, { status: previous.status!, headers: { "content-type": previous.contentType ?? "application/json" } });
    }
    // Replaying a known response consumes no paid connection slot. New work is
    // queued with checked-explanation work ahead of broader optional research.
    await acquire(init.signal);
    try {
    init.signal?.throwIfAborted();
    if (session.dispatchBlocked) throw new ResearchSessionStop("limit");
    if (session.held || !session.active || [...session.attempts.values()].some(a => a.state === "reserved" && a.callerStopped)) throw new ResearchSessionStop("billing_uncertain");
    const reserved = modelReservation(vertexPrice ? { model: label, messages: [body.systemInstruction, body.contents], max_tokens: maxTokens } : body);
    const exposure = [...session.attempts.values()].reduce((sum, a) => sum + (a.cost ?? a.reserved), 0);
    if (session.cacheOnly || session.calls >= (session.simple ? 9 : CONTINUATION_LIMITS.calls) || session.tokens + maxTokens > CONTINUATION_LIMITS.outputTokens
      || runCalls >= (unhurried ? CONTINUATION_LIMITS.calls : CONTINUATION_LIMITS.runCalls)
      || runTokens + maxTokens > (unhurried ? CONTINUATION_LIMITS.outputTokens : CONTINUATION_LIMITS.runOutputTokens)
      || exposure + reserved > CONTINUATION_LIMITS.costUsd || session.bytes + encoded.length > CONTINUATION_LIMITS.bytes) throw new ResearchSessionStop("limit");
    const attempt: Attempt = { state: "reserved", reserved };
    session.attempts.set(key, attempt); session.calls++; session.tokens += maxTokens; runCalls++; runTokens += maxTokens;
    const callerStopped = () => { attempt.callerStopped = true; pump(); };
    init.signal?.addEventListener("abort", callerStopped, { once: true });
    let responseReceived = false;
    try {
      // A lane stops accepting output at its deadline. Already dispatched work
      // gets a bounded receipt-collection window, not permission for more research.
      const started = unhurried ? undefined : currentAskStarted();
      const receiptMs = Math.max(1, Math.min(40_000, started === undefined ? 40_000 : 58_000 - (Date.now() - started)));
      const stop = unhurried ? init.signal ?? new AbortController().signal : AbortSignal.timeout(receiptMs);
      const response = await abortable(send(url, { ...init, signal: stop, body: encoded }), stop);
      responseReceived = true;
      const generation = response.headers.get("x-generation-id");
      if (generation && /^gen-[a-zA-Z0-9_-]{1,196}$/.test(generation)) attempt.generation = generation;
      const reader = response.body?.getReader(); let count = 0; const chunks: Uint8Array[] = [];
      if (reader) try {
        while (true) {
          const chunk = await abortable(reader.read(), stop); if (chunk.done) break;
          count += chunk.value.byteLength;
          if (count > CONTINUATION_LIMITS.responseBytes || session.bytes + count > CONTINUATION_LIMITS.bytes) { void reader.cancel().catch(() => {}); throw new Error("response_limit"); }
          chunks.push(chunk.value);
        }
      } finally { reader?.releaseLock(); }
      const text = Buffer.concat(chunks).toString("utf8"), data = JSON.parse(text);
      // Google does not charge a refused request; a successful one must report its token counts.
      const googleUsage = data?.usageMetadata;
      const cost = !vertexPrice ? data?.usage?.cost : !response.ok ? 0 : typeof googleUsage?.promptTokenCount === "number"
        ? (googleUsage.promptTokenCount * vertexPrice.prompt + ((googleUsage.candidatesTokenCount ?? 0) + (googleUsage.thoughtsTokenCount ?? 0)) * vertexPrice.completion) / 1_000_000 : undefined;
      if (typeof data?.id === "string" && /^gen-[a-zA-Z0-9_-]{1,196}$/.test(data.id)) attempt.generation = data.id;
      attempt.body = text; attempt.status = response.status; attempt.contentType = response.headers.get("content-type") ?? "application/json";
      session.bytes += count;
      if (!response.ok) {
        const outcome = providerRejectionCategory(response.status, data);
        // This recorder exists only in opted-in PRIVATE local traces. Ordinary
        // telemetry receives the fixed category, never the error body/message.
        recordLocalAskEvent("provider_rejection_private", { http_status: response.status, generation: attempt.generation, error: data?.error });
        emitAiTrace("provider_request_rejected", { model: label, http_status: response.status, outcome, output_contract: vertexPrice || body.response_format?.type === "json_schema" ? "schema" : "legacy" });
      }
      if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0) { emitAiTrace("billing_receipt_missing", { model: label, http_status: response.status }); throw new Error("unknown_cost"); }
      session.actualUsd += cost - (attempt.cost ?? 0); attempt.cost = cost;
      if (cost > reserved) { session.holdReason = "unexpected_cost"; throw new Error("unexpected_cost"); }
      attempt.state = "settled";
      return new Response(text, { status: response.status, headers: { "content-type": attempt.contentType } });
    } catch (error) {
      if (error instanceof ModelDispatchRefusal && !responseReceived) {
        // The trusted outer guard certifies that this one attempt never left
        // the process. Preserve every other reservation and unresolved charge.
        session.attempts.delete(key); session.calls--; session.tokens -= maxTokens; runCalls--; runTokens -= maxTokens;
        session.dispatchBlocked = true;
        emitAiTrace("model_dispatch_refused", { reason: error.reason, dispatched: false });
        throw new ResearchSessionStop("limit");
      }
      session.holdReason ??= "missing_receipt";
      session.held = true; throw new ResearchSessionStop("billing_uncertain");
    } finally { init.signal?.removeEventListener("abort", callerStopped); }
    } finally { session.inFlight--; pump(); }
  };
}
