import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const ask = vi.hoisted(() => vi.fn());
const slot = vi.hoisted(() => ({ value: "ok" as string }));
vi.mock("@/lib/ask/pipeline", () => ({ ask }));
vi.mock("@/lib/ask/limits", () => ({ askEnabled: () => true, takeSlot: () => slot.value, visitorKey: () => "fixture", withSlot: (f: () => unknown) => f() }));
import { POST } from "@/app/api/ask/stream/route";
import { consumeRichStream } from "@/lib/ask/rich-answer";
import { readContinuationSession } from "@/lib/ask/continuation-session";
import { richAnswer } from "./fixtures/rich";
import { stableResearchReply, removeCardOnReply } from "@/lib/ask/auto-continuation";

// Reliability plan Phase 1: truthful status, and controls that never use a visitor's allowance.
const tokens: string[] = [];
beforeEach(() => { vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_RICH_ENABLED", "true"); vi.stubEnv("ASK_STREAM_ENABLED", "true");
  vi.stubEnv("ASK_SIMPLE_PIPELINE", "true"); ask.mockReset(); slot.value = "ok"; });
afterEach(() => { for (const token of tokens.splice(0)) try { const s = readContinuationSession(token, "en"); s.active = false; s.expires = 0; } catch {} vi.unstubAllEnvs(); });
const request = (body: object, cookie = "") => new Request("http://localhost:3000/api/ask/stream", { method: "POST",
  headers: { origin: "http://localhost:3000", "content-type": "application/json", cookie }, body: JSON.stringify({ lang: "en", stream_version: 3, ...body }) });
async function start(question: string, work: (options: any) => Promise<unknown>) {
  ask.mockImplementation(async (_q, _l, _t, _h, options) => work(options));
  const response = await POST(request({ question })), cookie = response.headers.get("set-cookie")!.split(";")[0];
  const events: any[] = [], reading = consumeRichStream(response.body!, e => { events.push(e); });
  await vi.waitFor(() => expect(events[0]?.type).toBe("continuation"));
  const token = events[0].continuation.token; tokens.push(token);
  return { cookie, token, events, reading };
}

it("Stop and status work while every request slot is full, and new questions are still rate limited", async () => {
  let release!: () => void; const wait = new Promise<void>(r => { release = r; });
  const run = await start("Explain care", async () => { await wait; return { status: "incomplete", language: "en", withdraw: false }; });
  slot.value = "busy";
  const status = await POST(request({ continue_token: run.token, action: "status" }, run.cookie));
  expect(status.status).toBe(200); expect(await status.json()).toMatchObject({ status: "research_status", continuation: { reason: "busy" } });
  expect(await (await POST(request({ continue_token: run.token, action: "stop" }, run.cookie))).json()).toMatchObject({ status: "research_cancelled" });
  const fresh = await POST(request({ question: "Another question" }, run.cookie));
  expect(fresh.status).toBe(429);
  release(); await run.reading;
});

it("status reports a finished, approved answer so the client can reuse it", async () => {
  const run = await start("Explain care", async options => {
    options.checkpoint.simple = { version: 1, recoveryUsed: false, correctionUsed: false, gaps: [], queries: [], approved: { answer: richAnswer, fingerprint: "x" } };
    return { status: "rich_answer", answer: richAnswer };
  });
  await run.reading;
  const value = await (await POST(request({ continue_token: run.token, action: "status" }, run.cookie))).json();
  expect(value.continuation).toMatchObject({ token: run.token, available: false, approved: true });
});

it("a reuse request never starts new research", async () => {
  const response = await POST(request({ question: "A question that was never answered", reuse_only: true }));
  expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ status: "research_expired" });
  expect(ask).not.toHaveBeenCalled();
});

const base = { requestId: null, sequence: 0, sections: [], progress: "understanding", withdrawn: false, terminal: false, version: 3 } as any;
const link = { token: "a".repeat(64), remaining: 3, expires: Date.now() + 60_000, available: true };
it("a busy reply on a new card keeps the server's link and says research is running, not interrupted", () => {
  const next = stableResearchReply(base, "busy", { continuation: { ...link, available: false, reason: "busy" } }, false, "en");
  expect(next.continuation).toMatchObject({ token: link.token, reason: "busy", available: false });
  expect(next.result).toMatchObject({ failureKind: "research_running" });
});
it("a busy reply during Continue keeps the earlier result", () => {
  const earlier = { status: "incomplete", language: "en", withdraw: false, failureKind: "billing_uncertain" };
  const next = stableResearchReply({ ...base, terminal: true, result: earlier, continuation: link }, "busy", {}, true, "en");
  expect(next.result).toEqual(earlier); expect(next.continuation?.reason).toBe("busy");
});
it.each([["expired", "expired"], ["incompatible", "expired"], ["cancelled", "cancelled"], ["limit", "limit"], ["billing_uncertain", "billing_uncertain"]])(
  "a %s reply gets the real reason %s, so the receipt button only shows for uncertain charges", (reply, reason) => {
    const next = stableResearchReply({ ...base, continuation: link }, reply, {}, true, "en");
    expect(next.continuation?.reason).toBe(reason);
    expect(["billing_uncertain", "busy", ""].includes(next.continuation?.reason ?? "")).toBe(reason === "billing_uncertain");
  });
it("never removes a card that is being continued", () => {
  expect(removeCardOnReply(true)).toBe(false); expect(removeCardOnReply(false)).toBe(true);
});

it.each([["production", "", 50_000], ["development", "true", Infinity]])("a %s stable run gets a research limit of %s ms (Phase 5: never rely on the host's cut-off)", async (mode, unhurried, limit) => {
  vi.stubEnv("NODE_ENV", mode); vi.stubEnv("ASK_LOCAL_UNHURRIED", unhurried as string);
  const { remainingResearchMs } = await import("@/lib/ask/research-runtime");
  let seen: number | undefined;
  ask.mockImplementation(async () => { seen = remainingResearchMs(); return { status: "incomplete", language: "en", withdraw: false }; });
  const response = await POST(request({ question: `Explain care ${mode}` }));
  const events: any[] = []; await consumeRichStream(response.body!, e => { events.push(e); });
  const token = events.find(e => e.type === "continuation")?.continuation.token; if (token) tokens.push(token);
  if (limit === Infinity) expect(seen).toBe(Infinity); else { expect(seen).toBeLessThanOrEqual(limit as number); expect(seen).toBeGreaterThan(40_000); }
});

it("runs the simple pipeline when hosted only with both keys set (Phase 5, step 1)", async () => {
  const { askSimplePipeline } = await import("@/lib/ask/settings");
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("VERCEL", "1"); vi.stubEnv("ASK_SIMPLE_PIPELINE", "true");
  vi.stubEnv("ASK_SIMPLE_PIPELINE_HOSTED", ""); expect(askSimplePipeline()).toBe(false);
  vi.stubEnv("ASK_SIMPLE_PIPELINE_HOSTED", "true"); expect(askSimplePipeline()).toBe(true);
  vi.stubEnv("ASK_SIMPLE_PIPELINE", ""); expect(askSimplePipeline()).toBe(false);
});
