import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ ask: vi.fn(), released: 0, running: 0, slot: "ok" }));
vi.mock("@/lib/ask/pipeline", () => ({ ask: mock.ask }));
vi.mock("@/lib/ask/limits", () => ({ askEnabled: () => true, takeSlot: () => mock.slot, visitorKey: () => "test", withSlot: async (fn: () => Promise<unknown>) => { mock.running++; try { return await fn(); } finally { mock.running--; mock.released++; } } }));
import { POST } from "@/app/api/ask/stream/route";
import { consumeRichStream, emptyRichState, reduceRichEvent, type RichCallbacks, type RichEvent } from "@/lib/ask/rich-answer";
import { richAnswer, sections } from "./fixtures/rich";
const request = (body: unknown = { question: "Explain care", lang: "en" }, signal?: AbortSignal) => new Request("https://bayan.test/api/ask/stream", { method: "POST", signal, headers: { origin: "https://bayan.test", "content-type": "application/json" }, body: JSON.stringify(body) });
describe("opt-in rich endpoint", () => {
  it("continues the same server-owned question with an opaque token, without re-entering visitor text", async () => {
    mock.ask.mockImplementation(async (_q, _l, _t, _h, options: { rich: RichCallbacks }) => {
      options.rich.onSection?.(sections[0]); return { status: "incomplete", language: "en", withdraw: false, sections: [sections[0]] };
    });
    let first = emptyRichState();
    await consumeRichStream((await POST(request({ question: "Explain care", lang: "en", stream_version: 2 }))).body!, e => first = reduceRichEvent(first, e));
    expect(first.continuation?.available).toBe(true); expect(first.continuation?.remaining).toBe(3);
    let second = emptyRichState();
    await consumeRichStream((await POST(request({ lang: "en", stream_version: 2, continue_token: first.continuation!.token }))).body!, e => second = reduceRichEvent(second, e));
    expect(second.continuation?.remaining).toBe(2);
    expect(mock.ask.mock.calls.map(call => call[0])).toEqual(["Explain care", "Explain care"]);
  });

  it("rejects a lost checkpoint token without starting replacement paid work", async () => {
    const response = await POST(request({ lang: "en", stream_version: 2, continue_token: "0".repeat(64) }));
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ status: "research_expired" }); expect(mock.ask).not.toHaveBeenCalled();
  });
  it("researches a first-pass evidence gap before sending a terminal answer", async () => {
    mock.ask.mockImplementationOnce(async (_q, _l, _t, _h, options) => {
      options.checkpoint.needsEvidence = true;
      options.rich.onSection(sections[0]);
      return { status: "incomplete", language: "en", withdraw: false, sections: [sections[0]], failureKind: "question_coverage" };
    }).mockImplementationOnce(async (_q, _l, _t, _h, options) => {
      expect(options.checkpoint.retry).toBe(1);
      return { status: "rich_answer", answer: richAnswer };
    });
    const response = await POST(request({ question: "Explain care", lang: "en", stream_version: 2 }));
    const events: RichEvent[] = [];
    await consumeRichStream(response.body!, event => events.push(event));
    expect(mock.ask).toHaveBeenCalledTimes(2);
    expect(events.filter(e => e.type === "terminal")).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ type: "terminal", result: { status: "rich_answer" } });
  });
  it("does not turn a failed check into automatic paid recovery", async () => {
    mock.ask.mockImplementationOnce(async (_q, _l, _t, _h, options) => {
      options.checkpoint.needsEvidence = true;
      return { status: "incomplete", language: "en", withdraw: false, sections: [], failureKind: "checker_failure" };
    });
    const response = await POST(request({ question: "Explain care", lang: "en", stream_version: 2 }));
    await consumeRichStream(response.body!, () => {});
    expect(mock.ask).toHaveBeenCalledOnce();
  });
  beforeEach(() => { mock.ask.mockReset(); mock.slot = "ok"; mock.released = 0; mock.running = 0; vi.stubEnv("ASK_RICH_ENABLED", "true"); vi.stubEnv("ASK_STREAM_ENABLED", "true"); });
  afterEach(() => { vi.unstubAllEnvs(); });
  it("remains unavailable by default without making a model request", async () => {
    vi.stubEnv("ASK_RICH_ENABLED", "false");
    expect((await POST(request())).status).toBe(404); expect(mock.ask).not.toHaveBeenCalled();
  });
  it("streams sections with immediate sources and a single terminal result", async () => {
    mock.ask.mockImplementation(async (_q, _l, _t, _h, options: { rich: RichCallbacks }) => { options.rich.onProgress?.("searching"); sections.forEach(s => options.rich.onSection?.(s)); return { status: "rich_answer", answer: richAnswer }; });
    const response = await POST(request()); expect(response.headers.get("content-type")).toContain("text/event-stream");
    let state = emptyRichState(); const events: RichEvent[] = [];
    await consumeRichStream(response.body!, event => { events.push(event); state = reduceRichEvent(state, event); });
    expect(state.terminal).toBe(true); expect(state.sections).toEqual(sections);
    expect(events.map(e => e.sequence)).toEqual([1, 2, 3, 4, 5, 6]); expect(mock.released).toBe(1);
    expect(mock.ask).toHaveBeenCalledOnce();
  });
  it("returns rich JSON with streaming switched off, including safe sections on later failure", async () => {
    vi.stubEnv("ASK_STREAM_ENABLED", "false");
    mock.ask.mockResolvedValueOnce({ status: "rich_answer", answer: richAnswer });
    expect(await (await POST(request())).json()).toEqual({ status: "rich_answer", answer: richAnswer });
    mock.ask.mockImplementationOnce(async (_q, _l, _t, _h, options: { rich: RichCallbacks }) => { options.rich.onSection?.(sections[0]); throw new Error("remaining unavailable"); });
    expect(await (await POST(request())).json()).toMatchObject({ status: "incomplete", sections: [sections[0]], withdraw: false });
  });
  it("preserves a prepared answer's exact existing response rather than generating a new approval label", async () => {
    const prepared = { status: "answer", answer: { prepared: true, v2: { version: 2, origin: "prepared", review: "bayan_reviewed" } } };
    mock.ask.mockResolvedValueOnce(prepared);
    const response = await POST(request()); const events: RichEvent[] = [];
    await consumeRichStream(response.body!, e => events.push(e));
    expect(events).toHaveLength(1); expect(events[0]).toMatchObject({ type: "terminal", result: prepared });
  });
  it("aborts work and releases the slot on reader cancellation without retrying", async () => {
    let signal!: AbortSignal;
    mock.ask.mockImplementation((_q, _l, _t, _h, options: { signal: AbortSignal; rich: RichCallbacks }) => { signal = options.signal; options.rich.onProgress?.("searching"); return new Promise(() => {}); });
    const response = await POST(request()); const reader = response.body!.getReader(); await reader.read(); await reader.cancel();
    await vi.waitFor(() => expect(mock.released).toBe(1)); expect(signal.aborted).toBe(true); expect(mock.running).toBe(0); expect(mock.ask).toHaveBeenCalledOnce();
  });
  it.each([1, 2])("lets local unhurried stream v%i continue past the former overall deadline until the visitor stops it", async version => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_UNHURRIED", "true");
    vi.useFakeTimers();
    let signal!: AbortSignal;
    mock.ask.mockImplementation((_q, _l, _t, _h, options: { signal: AbortSignal; rich: RichCallbacks }) => {
      signal = options.signal; options.rich.onProgress?.("searching"); return new Promise(() => {});
    });
    try {
      const response = await POST(request({ question: "Explain care", lang: "en", ...(version === 2 ? { stream_version: 2 } : {}) }));
      const reader = response.body!.getReader(); await reader.read();
      await vi.advanceTimersByTimeAsync(180_000);
      expect(signal.aborted).toBe(false); expect(mock.running).toBe(1);
      await reader.cancel();
      await vi.waitFor(() => expect(mock.released).toBe(1));
      expect(signal.aborted).toBe(true);
    } finally { vi.useRealTimers(); }
  });
  it("visibly withdraws a section when a later full-answer check fails", async () => {
    mock.ask.mockImplementation(async (_q, _l, _t, _h, options: { rich: RichCallbacks }) => { options.rich.onSection?.(sections[0]); options.rich.onWithdraw?.(); return { status: "incomplete", language: "en", withdraw: true, sections: [] }; });
    const response = await POST(request()); let state = emptyRichState();
    await consumeRichStream(response.body!, e => state = reduceRichEvent(state, e));
    expect(state.sections).toEqual([]); expect(state.withdrawn).toBe(true); expect(state.result).toMatchObject({ status: "incomplete" });
  });
  it("keeps origin, rate and bounded conversation checks in front of work", async () => {
    const crossOrigin = request(); crossOrigin.headers.set("origin", "https://elsewhere.test");
    expect((await POST(crossOrigin)).status).toBe(403);
    expect((await POST(request({ question: "x".repeat(501), lang: "en" }))).status).toBe(413);
    expect((await POST(request({ question: "Question", lang: "en", previous_user_messages: Array(5).fill("old") }))).status).toBe(400);
    mock.slot = "limited"; expect((await POST(request())).status).toBe(429); expect(mock.ask).not.toHaveBeenCalled();
  });
});
