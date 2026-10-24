// A separate, explicitly authorized $0.50 campaign, including the old unresolved exposure.
// The original ledger stays immutable and locked while this campaign makes calls.
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync, fsyncSync } from "node:fs";
import type { ModelTransport } from "../lib/ai/transport";

export const CAMPAIGN_CAP = .5;
export const PRIOR_EXPOSURE = .113472;
export const CURRENT_MODELS = ["google/gemini-3.5-flash-lite", "google/gemini-3.8-flash", "google/gemini-3.1-flash-lite", "mistralai/mistral-small-3.2-24b-instruct"];
export type Price = { prompt: number; completion: number; request: number };
export type CampaignCall = { fingerprint: string; model: string; reserved: number; at: string; cost?: number; generationId?: string; httpStatus?: number; promptTokens?: number; completionTokens?: number; finishReason?: string; rejection?: string };
export type CampaignLedger = { version: 1; cap: number; executionCap?: number; priorExposure: number; originalLedgerHash: string; prices: Record<string, Price>; calls: CampaignCall[]; evaluationCases?: { id: string; requestId: string; reportPath: string; revisionHash?: string; review: "pending" | "supported" | "failed" }[]; stopped?: string; reviewStops?: { at: string; reason: string; authorization: string }[]; priorCampaign?: { path: string; hash: string; exposure: number; authorization: string } };
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export function replaceCampaignFile(from: string, to: string, rename = renameSync,
  wait = (ms: number) => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }) {
  for (let attempt = 0; ; attempt++) {
    try { rename(from, to); return; }
    catch (error) {
      if (attempt >= 5 || !["EPERM", "EACCES", "EBUSY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      // Brief Windows file-reader/antivirus contention. Retry only the same
      // fsynced replacement, never delete the original ledger or dispatch early.
      wait(20 * (attempt + 1));
    }
  }
}
export function persistCampaign(path: string, value: unknown) {
  const temp = `${path}.pending-${process.pid}-${randomUUID()}`;
  const fd = openSync(temp, "wx", 0o600);
  try { writeFileSync(fd, JSON.stringify(value, null, 2)); fsyncSync(fd); } finally { closeSync(fd); }
  replaceCampaignFile(temp, path);
}
export class CampaignStop extends Error { constructor(message: string) { super(message); this.name = "CampaignStop"; } }
/** A reviewed continuation carries the existing ceiling, never renews an allowance.
 * Caller supplies the owner's resumed scope and must verify its prior result review. */
export function sameAllowanceContinuation(bytes: string, path: string, authorization: string): CampaignLedger {
  const previous: CampaignLedger = JSON.parse(bytes);
  if (!previous.stopped || previous.evaluationCases?.some(c => c.review === "pending") || !authorization.trim()) throw new CampaignStop("prior_campaign_review_required");
  const guard = new ArabicCampaignGuard(previous, () => {}, { cap: previous.cap, priorExposure: previous.priorExposure });
  if (guard.exposure > previous.cap) throw new CampaignStop("prior_campaign_over_ceiling");
  return { version: 1, cap: previous.cap, priorExposure: guard.exposure, originalLedgerHash: previous.originalLedgerHash,
    prices: structuredClone(previous.prices), calls: [], stopped: "reviewed_continuation_prepared",
    priorCampaign: { path, hash: digest(bytes), exposure: guard.exposure, authorization } };
}
export class ArabicCampaignGuard {
  private readonly executionCap: number;
  private capacityWaiters = new Set<() => void>();
  private wakeCapacity() { for (const wake of [...this.capacityWaiters]) wake(); }
  constructor(readonly ledger: CampaignLedger, private save: () => void = () => {}, limits = { cap: CAMPAIGN_CAP, priorExposure: PRIOR_EXPOSURE }) {
    if (!Number.isFinite(limits.cap) || !Number.isFinite(limits.priorExposure) || limits.cap <= limits.priorExposure || limits.priorExposure < 0 || ledger.version !== 1 || ledger.cap !== limits.cap || ledger.priorExposure !== limits.priorExposure || !Array.isArray(ledger.calls)) throw new CampaignStop("invalid_campaign");
    if (ledger.calls.some(c => !Number.isFinite(c.reserved) || c.reserved <= 0 || (c.cost !== undefined && (!Number.isFinite(c.cost) || c.cost < 0 || c.cost > c.reserved)))) throw new CampaignStop("invalid_campaign_receipt");
    if (ledger.calls.some(c => c.cost === undefined)) throw new CampaignStop("new_campaign_charge_unresolved_no_resume");
    this.executionCap = ledger.executionCap === undefined ? ledger.cap : ledger.executionCap;
    if (!Number.isFinite(this.executionCap) || this.executionCap <= ledger.priorExposure || this.executionCap > ledger.cap) throw new CampaignStop("invalid_campaign_execution_cap");
  }
  get actual() { return this.ledger.calls.reduce((sum, c) => sum + (c.cost ?? 0), 0); }
  get exposure() { return this.ledger.priorExposure + this.ledger.calls.reduce((sum, c) => sum + (c.cost ?? c.reserved), 0); }
  private requiredReservation(body: any) {
    if (this.ledger.stopped) throw new CampaignStop(this.ledger.stopped);
    const price = this.ledger.prices[body.model];
    if (!CURRENT_MODELS.includes(body.model) || !price || body.models || body.tools || body.plugins || body.route || body.stream !== false
      || !Array.isArray(body.messages) || body.messages.some((m: any) => typeof m.content !== "string")
      || !Number.isSafeInteger(body.max_tokens) || body.max_tokens <= 0 || body.provider?.zdr !== true || body.provider?.data_collection !== "deny") throw new CampaignStop("unexpected_model_request_or_privacy");
    // Pessimistic UTF-8 bound, framing allowance and 2x headroom; output includes reasoning.
    const reserved = Math.ceil((((Buffer.byteLength(JSON.stringify(body.messages), "utf8") + 4096) * price.prompt
      + body.max_tokens * price.completion) * 2 / 1_000_000 + price.request) * 1e9) / 1e9;
    if (!Number.isFinite(reserved) || reserved <= 0) throw new CampaignStop("invalid_campaign_reservation");
    return reserved;
  }
  reserve(body: any) {
    const reserved = this.requiredReservation(body);
    if (this.exposure + reserved > this.executionCap) {
      this.ledger.stopped = this.executionCap < this.ledger.cap ? "campaign_execution_limit_cannot_cover_next_call" : "campaign_budget_cannot_cover_next_call"; this.save(); throw new CampaignStop(this.ledger.stopped);
    }
    const entry: CampaignCall = { fingerprint: digest(JSON.stringify(body)), model: body.model, reserved, at: new Date().toISOString() };
    this.ledger.calls.push(entry);
    try { this.save(); }
    catch (error) {
      // reserveForDispatch has not returned; network() is unreachable. This is
      // a confirmed non-dispatch, not a receipt or an uncertain provider charge.
      entry.cost = 0; entry.rejection = "not_dispatched_reservation_storage_failed";
      this.ledger.stopped = "campaign_reservation_storage_failed_before_dispatch";
      try { this.save(); } catch { /* Keep the original durable journal and failed replacement for owner recovery. */ }
      this.wakeCapacity(); throw error;
    }
    return entry;
  }
  private async reserveForDispatch(body: any, signal: AbortSignal | null | undefined, originalUnchanged: () => boolean) {
    const required = this.requiredReservation(body);
    while (this.exposure + required > this.executionCap) {
      signal?.throwIfAborted();
      if (!originalUnchanged()) throw new CampaignStop("original_ledger_changed");
      if (this.ledger.stopped) throw new CampaignStop(this.ledger.stopped);
      const settledExposure = this.ledger.priorExposure + this.actual;
      // If it cannot fit even with zero cost for every pending call, waiting cannot help.
      if (settledExposure + required > this.executionCap || !this.ledger.calls.some(c => c.cost === undefined)) return this.reserve(body);
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => { this.capacityWaiters.delete(wake); signal?.removeEventListener("abort", aborted); };
        const wake = () => { cleanup(); resolve(); };
        const aborted = () => { cleanup(); reject(signal?.reason ?? new DOMException("Aborted", "AbortError")); };
        this.capacityWaiters.add(wake); signal?.addEventListener("abort", aborted, { once: true });
      });
    }
    signal?.throwIfAborted();
    if (!originalUnchanged()) throw new CampaignStop("original_ledger_changed");
    return this.reserve(body);
  }
  settle(entry: CampaignCall, data: any, response: Response) {
    entry.httpStatus = response.status;
    if (typeof data.id === "string" && /^gen-[A-Za-z0-9_-]{1,196}$/.test(data.id)) entry.generationId = data.id;
    const cost = data.usage?.cost;
    entry.promptTokens = data.usage?.prompt_tokens; entry.completionTokens = data.usage?.completion_tokens;
    entry.finishReason = data.choices?.[0]?.finish_reason;
    if (!response.ok) entry.rejection = response.status === 429 ? "rate_limit" : response.status === 404 ? "no_eligible_route" : "provider_rejected";
    // An explicit API rejection without any generation is distinct from uncertain completion.
    if (!response.ok && data.error && !data.id && !data.choices && cost === undefined) { entry.cost = 0; this.save(); return; }
    if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0 || cost > entry.reserved) {
      this.ledger.stopped = "new_charge_unknown_or_exceeds_reservation"; this.save(); throw new CampaignStop(this.ledger.stopped);
    }
    entry.cost = cost; this.save();
  }
  dispatch(network: ModelTransport = fetch, originalUnchanged: () => boolean = () => true): ModelTransport {
    return async (url, init) => {
      if (url !== "https://openrouter.ai/api/v1/chat/completions" || init.method !== "POST" || typeof init.body !== "string") throw new CampaignStop("model_transport_not_guarded");
      if (!originalUnchanged()) throw new CampaignStop("original_ledger_changed");
      const body = JSON.parse(init.body);
      const entry = await this.reserveForDispatch(body, init.signal, originalUnchanged);
      body.provider = { ...body.provider, max_price: this.ledger.prices[body.model] };
      let response: Response, data: any;
      try { response = await network(url, { ...init, body: JSON.stringify(body) }); data = await response.clone().json(); }
      catch {
        this.ledger.stopped = "new_transport_uncertain_no_retry";
        try { this.save(); } finally { this.wakeCapacity(); }
        throw new CampaignStop(this.ledger.stopped);
      }
      try { this.settle(entry, data, response); }
      catch (error) {
        this.ledger.stopped ??= "campaign_receipt_storage_failed";
        throw error;
      } finally { this.wakeCapacity(); }
      return response;
    };
  }
}
export function campaignLock(originalPath: string, expectedHash: string) {
  if (digest(readFileSync(originalPath, "utf8")) !== expectedHash) throw new CampaignStop("original_ledger_changed");
  const path = `${originalPath}.lock`, fd = openSync(path, "wx");
  return () => { closeSync(fd); unlinkSync(path); };
}
