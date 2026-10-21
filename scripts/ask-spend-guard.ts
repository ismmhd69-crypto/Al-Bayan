// Local evaluation only. Never imported by the website. One ledger covers all rounds.
import { existsSync, readFileSync, writeFileSync, openSync, closeSync, unlinkSync, fsyncSync, renameSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";

export class AskSpendStop extends Error {
  constructor(message: string) { super(message); this.name = "AskSpendStop"; }
}
export type Entry = { model: string; reserved: number; cost?: number; at: string;
  requestFingerprint?: string; generationId?: string; providerRequestId?: string; httpStatus?: number; receivedAt?: string };
export type Ledger = { cap: number; entries: Entry[]; stopped?: string };
export const PRICE_CEILING = { prompt: 2, completion: 10, request: 0 };

export function reserveUsd(body: { messages: unknown; max_tokens: number }): number {
  if (!Number.isSafeInteger(body.max_tokens) || body.max_tokens <= 0) throw new AskSpendStop("invalid output allowance");
  // UTF-8 bytes overestimate text tokens; extra framing allowance and 2x margin cover token wrappers.
  return ((Buffer.byteLength(JSON.stringify(body.messages), "utf8") + 4096) * PRICE_CEILING.prompt
    + body.max_tokens * PRICE_CEILING.completion) * 2 / 1_000_000;
}

export class SpendGuard {
  constructor(readonly ledger: Ledger, private readonly save: () => void = () => {}) {
    if (!Number.isFinite(ledger.cap) || ledger.cap <= 0 || ledger.cap > 1.5) throw new AskSpendStop("invalid spending cap");
    if (!Array.isArray(ledger.entries) || ledger.entries.some(e => !e || typeof e.model !== "string" || !e.model
      || typeof e.at !== "string" || !Number.isFinite(e.reserved) || e.reserved <= 0
      || (e.cost !== undefined && (typeof e.cost !== "number" || !Number.isFinite(e.cost) || e.cost < 0 || e.cost > e.reserved))))
      throw new AskSpendStop("invalid spending ledger");
  }
  get actual() { return this.ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0); }
  get exposure() { return this.ledger.entries.reduce((sum, e) => sum + (e.cost ?? e.reserved), 0); }
  reserve(model: string, amount: number, requestFingerprint?: string): Entry {
    if (this.ledger.stopped) throw new AskSpendStop(this.ledger.stopped);
    if (!Number.isFinite(amount) || amount <= 0 || this.exposure + amount >= this.ledger.cap) {
      throw new AskSpendStop("remaining budget cannot cover the next call");
    }
    if (requestFingerprint !== undefined && !/^[a-f0-9]{64}$/.test(requestFingerprint)) throw new AskSpendStop("invalid request fingerprint");
    const entry: Entry = { model, reserved: amount, at: new Date().toISOString(), ...(requestFingerprint ? { requestFingerprint } : {}) };
    this.ledger.entries.push(entry);
    this.save(); // Persist BEFORE the paid request, including retries and fallbacks.
    return entry;
  }
  settle(entry: Entry, cost: unknown) {
    if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0 || cost > entry.reserved) {
      this.ledger.stopped = "missing or unexpected cost; reservation retained, no more paid calls";
      this.save();
      throw new AskSpendStop(this.ledger.stopped);
    }
    entry.cost = cost;
    this.save();
  }
  receipt(entry: Entry, status: number, providerRequestId?: string | null, generationId?: unknown) {
    if (!this.ledger.entries.includes(entry)) throw new AskSpendStop("unknown spending entry");
    if (Number.isInteger(status) && status >= 100 && status <= 599) entry.httpStatus = status;
    if (typeof providerRequestId === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(providerRequestId)) entry.providerRequestId = providerRequestId;
    if (typeof generationId === "string" && /^gen-[A-Za-z0-9_-]{1,196}$/.test(generationId)) entry.generationId = generationId;
    entry.receivedAt = new Date().toISOString();
    this.save(); // Capture identity before cost validation can stop the run.
  }
  stop() {
    this.ledger.stopped = "call did not finish with known cost; reservation retained";
    this.save();
  }
}

function writeLedger(path: string, ledger: Ledger) {
  const temporary = `${path}.pending-${randomUUID()}`;
  let fd: number | undefined;
  try {
    fd = openSync(temporary, "wx", 0o600);
    writeFileSync(fd, JSON.stringify(ledger, null, 2)); fsyncSync(fd); closeSync(fd); fd = undefined;
    renameSync(temporary, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function installSpendGuard(path: string, onCall?: (body: Record<string, unknown>, response: unknown) => void) {
  const lock = `${path}.lock`;
  const fd = openSync(lock, "wx"); // Never run two paid experiments against the same ledger.
  const original = globalThis.fetch;
  try {
    const ledger: Ledger = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { cap: 1.5, entries: [] };
    if (ledger.entries.some((e) => e.cost === undefined)) throw new AskSpendStop("unsettled earlier call; reconcile before continuing");
    const guard = new SpendGuard(ledger, () => writeLedger(path, ledger));
    globalThis.fetch = async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url !== "https://openrouter.ai/api/v1/chat/completions") return original(input, init);
      if (init?.method !== "POST" || typeof init.body !== "string") throw new AskSpendStop("unexpected AI request");
      const body = JSON.parse(init.body);
      if (!/^google\/gemini-3\.(5-flash-lite|8-flash|1-flash-lite)$|^mistralai\/mistral-small-3\.2-24b-instruct$/.test(body.model)
        || body.tools || body.plugins || body.stream || body.messages.some((m: { content: unknown }) => typeof m.content !== "string")) {
        throw new AskSpendStop("unexpected model or billable request type");
      }
      body.provider = { ...body.provider, max_price: PRICE_CEILING };
      const entry = guard.reserve(body.model, reserveUsd(body), createHash("sha256").update(JSON.stringify(body)).digest("hex"));
      let response: Response;
      let data: { id?: unknown; usage?: { cost?: number } };
      try {
        response = await original(input, { ...init, body: JSON.stringify(body) });
        guard.receipt(entry, response.status, response.headers.get("x-request-id"));
        data = await response.clone().json();
        guard.receipt(entry, response.status, response.headers.get("x-request-id"), data?.id);
      } catch {
        guard.stop();
        throw new AskSpendStop("unknown call cost; paid evaluation stopped");
      }
      guard.settle(entry, data?.usage?.cost);
      onCall?.(body, data); // Fixed public test cases only; never headers or secrets.
      return response;
    };
    return { guard, close: () => { globalThis.fetch = original; closeSync(fd); unlinkSync(lock); } };
  } catch (error) { closeSync(fd); unlinkSync(lock); throw error; }
}
