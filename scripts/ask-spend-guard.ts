// Local evaluation only. Never imported by the website. One ledger covers all rounds.
import { existsSync, readFileSync, writeFileSync, openSync, closeSync, unlinkSync } from "node:fs";

export class AskSpendStop extends Error {
  constructor(message: string) { super(message); this.name = "AskSpendStop"; }
}
export type Entry = { model: string; reserved: number; cost?: number; at: string };
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
  }
  get actual() { return this.ledger.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0); }
  get exposure() { return this.ledger.entries.reduce((sum, e) => sum + (e.cost ?? e.reserved), 0); }
  reserve(model: string, amount: number): Entry {
    if (this.ledger.stopped) throw new AskSpendStop(this.ledger.stopped);
    if (!Number.isFinite(amount) || amount <= 0 || this.exposure + amount >= this.ledger.cap) {
      throw new AskSpendStop("remaining budget cannot cover the next call");
    }
    const entry = { model, reserved: amount, at: new Date().toISOString() };
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
  stop() {
    this.ledger.stopped = "call did not finish with known cost; reservation retained";
    this.save();
  }
}

export function installSpendGuard(path: string, onCall?: (body: Record<string, unknown>, response: unknown) => void) {
  const lock = `${path}.lock`;
  const fd = openSync(lock, "wx"); // Never run two paid experiments against the same ledger.
  const original = globalThis.fetch;
  try {
    const ledger: Ledger = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { cap: 1.5, entries: [] };
    if (ledger.entries.some((e) => e.cost === undefined)) throw new AskSpendStop("unsettled earlier call; reconcile before continuing");
    const guard = new SpendGuard(ledger, () => writeFileSync(path, JSON.stringify(ledger, null, 2)));
    globalThis.fetch = async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url !== "https://openrouter.ai/api/v1/chat/completions") return original(input, init);
      if (init?.method !== "POST" || typeof init.body !== "string") throw new AskSpendStop("unexpected AI request");
      const body = JSON.parse(init.body);
      if (!/^google\/gemini-3\.(5-flash-lite|8-flash|1-flash-lite)$|^mistralai\/mistral-small-3\.2-24b-instruct$/.test(body.model)
        || body.tools || body.plugins || body.stream || body.messages.some((m: { content: unknown }) => typeof m.content !== "string")) {
        throw new AskSpendStop("unexpected model or billable request type");
      }
      const entry = guard.reserve(body.model, reserveUsd(body));
      body.provider = { ...body.provider, max_price: PRICE_CEILING };
      let response: Response;
      let data: { usage?: { cost?: number } };
      try {
        response = await original(input, { ...init, body: JSON.stringify(body) });
        data = await response.clone().json();
      } catch {
        guard.stop();
        throw new AskSpendStop("unknown call cost; paid evaluation stopped");
      }
      guard.settle(entry, data.usage?.cost);
      onCall?.(body, data); // Fixed public test cases only; never headers or secrets.
      return response;
    };
    return { guard, close: () => { globalThis.fetch = original; closeSync(fd); unlinkSync(lock); } };
  } catch (error) { closeSync(fd); unlinkSync(lock); throw error; }
}
