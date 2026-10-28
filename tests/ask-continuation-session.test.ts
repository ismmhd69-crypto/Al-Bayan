import { afterEach, expect, it, vi } from "vitest";
import { CONTINUATION_LIMITS, createContinuationSession, claimContinuationSession, finishContinuationSession, continuationTransport, continuationAvailable, reconcileContinuationReceipts, readContinuationSession, type ContinuationSession } from "@/lib/ask/continuation-session";
import { abortable } from "@/lib/ask/abort";
import { withAskRequest } from "@/lib/ask/trace-context";
import { ModelDispatchRefusal, withModelPriority } from "@/lib/ai/transport";
import { withResearchRuntime } from "@/lib/ask/research-runtime";
const testSessions: ContinuationSession[] = [];
afterEach(() => {
  for (const session of testSessions.splice(0)) { session.active = false; session.expires = 0; }
  vi.useRealTimers();
});
const url = "https://openrouter.ai/api/v1/chat/completions";
const request = (signal?: AbortSignal): RequestInit => ({ method: "POST", signal, body: JSON.stringify({ model: "fixture", max_tokens: 100,
  provider: { data_collection: "deny", zdr: true }, messages: [{ role: "user", content: "Invented public test input" }] }) });
const response = () => Response.json({ choices: [{ message: { content: "{}" } }], usage: { cost: 0.001 } });
function start() { const created = createContinuationSession("Invented public question", "en", []); testSessions.push(created.session); return { ...created, session: claimContinuationSession(created.token, "en") }; }

it("binds opaque tokens to the current session and language, with a single active run", () => {
  const { session, token } = start();
  session.checkpoint.integrityBlocked = true; expect(continuationAvailable(session)).toBe(false); session.checkpoint.integrityBlocked = false;
  expect(() => claimContinuationSession(token, "en")).toThrow("research_busy");
  expect(() => claimContinuationSession(token, "de")).toThrow("research_expired");
  expect(() => claimContinuationSession("0".repeat(64), "en")).toThrow("research_expired");
  finishContinuationSession(session, false);
  expect(claimContinuationSession(token, "en")).toBe(session);
  finishContinuationSession(session, false); session.engine = "old-engine";
  expect(() => claimContinuationSession(token, "en")).toThrow("research_incompatible");
});

it("replays a committed response after delivery/checkpoint interruption without another paid send", async () => {
  const { session, token } = start(), send = vi.fn(async () => response());
  expect((await continuationTransport(session, send)(url, request())).status).toBe(200);
  finishContinuationSession(session, false); claimContinuationSession(token, "en");
  expect((await continuationTransport(session, send)(url, request())).status).toBe(200);
  expect(send).toHaveBeenCalledOnce(); expect(session.actualUsd).toBe(0.001); expect(session.calls).toBe(1);
});

it("dispatches nothing if cancelled before reservation", async () => {
  const { session } = start(), stop = new AbortController(), send = vi.fn(async () => response()); stop.abort();
  await expect(continuationTransport(session, send)(url, request(stop.signal))).rejects.toThrow();
  expect(send).not.toHaveBeenCalled(); expect(session.attempts.size).toBe(0);
});

it("holds an ambiguous send and prevents both another call and manual continuation", async () => {
  const { session, token } = start(), send = vi.fn(async () => { throw Error("lost after dispatch"); });
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_billing_uncertain");
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_billing_uncertain");
  finishContinuationSession(session, false);
  expect(() => claimContinuationSession(token, "en")).toThrow("research_billing_uncertain"); expect(send).toHaveBeenCalledOnce();
});

it("does not invent an unknown charge when a trusted guard refuses before dispatch", async () => {
  const { session, token } = start(), send = vi.fn(async () => { throw new ModelDispatchRefusal("allowance"); });
  session.attempts.set("known", { state: "settled", reserved: 0.002, cost: 0.001 });
  session.actualUsd = 0.001;
  const dispatch = continuationTransport(session, send);
  await expect(dispatch(url, request())).rejects.toThrow("research_limit");
  expect(session.held).toBe(false); expect(session.holdReason).toBeUndefined(); expect(session.actualUsd).toBe(0.001);
  expect(session.attempts.size).toBe(1); expect(session.attempts.has("known")).toBe(true);
  expect(session.calls).toBe(0); expect(session.tokens).toBe(0); expect(session.inFlight).toBe(0);
  expect(continuationAvailable(session)).toBe(false);
  await expect(dispatch(url, request())).rejects.toThrow("research_limit"); expect(send).toHaveBeenCalledOnce();
  finishContinuationSession(session, false); expect(() => claimContinuationSession(token, "en")).toThrow("research_limit");
});

it("does not trust a provider body or an ordinary error claiming it was not dispatched", async () => {
  const { session } = start(), send = vi.fn(async () => { throw Error("model_dispatch_refused_allowance"); });
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_billing_uncertain");
  expect(session.held).toBe(true); expect(session.attempts.size).toBe(1); expect(session.calls).toBe(1);
});

it("retains the charge reservation if a response stream fails after dispatch", async () => {
  const { session } = start();
  const send = vi.fn(async () => new Response(new ReadableStream({ start(controller) { controller.error(new ModelDispatchRefusal("allowance")); } })));
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_billing_uncertain");
  expect(session.held).toBe(true); expect(session.attempts.size).toBe(1); expect(session.calls).toBe(1);
});

it("does not treat a provider error without a cost receipt as a free retry", async () => {
  const { session } = start(), send = vi.fn(async () => Response.json({ error: { message: "private response" } }, { status: 400 }));
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_billing_uncertain");
  expect(session.held).toBe(true); expect(continuationAvailable(session)).toBe(false); expect(send).toHaveBeenCalledOnce();
});

it("enforces cumulative cost, output-token and call ceilings before dispatch", async () => {
  const { session } = start(), send = vi.fn(async () => response());
  session.calls = CONTINUATION_LIMITS.calls;
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_limit");
  session.calls = 0; session.tokens = CONTINUATION_LIMITS.outputTokens;
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_limit");
  session.tokens = 0; session.attempts.set("old", { state: "settled", reserved: 0.499, cost: 0.499 });
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_limit");
  expect(send).not.toHaveBeenCalled(); expect(session.inFlight).toBe(0);
});

it("enforces the explicit continuation cap and expires without creating a replacement job", () => {
  const { session, token } = start();
  for (let i = 0; i < CONTINUATION_LIMITS.continuations; i++) { finishContinuationSession(session, false); claimContinuationSession(token, "en"); }
  finishContinuationSession(session, false);
  expect(continuationAvailable(session)).toBe(false); expect(() => claimContinuationSession(token, "en")).toThrow("research_limit");
  const next = start(); finishContinuationSession(next.session, false);
  expect(() => claimContinuationSession(next.token, "en", next.session.expires + 1)).toThrow("research_expired");
});

it("does not change privacy preferences while imposing a provider price ceiling", async () => {
  const { session } = start(), send = vi.fn(async (_url: string, init: RequestInit) => {
    expect(JSON.parse(String(init.body)).provider).toMatchObject({ data_collection: "deny", zdr: true, max_price: { prompt: 2, completion: 10, request: 0 } }); return response();
  });
  await continuationTransport(session, send)(url, request()); expect(send).toHaveBeenCalledOnce();
});

it("limits concurrent paid sends and does not reserve a cancelled queued call", async () => {
  const { session } = start(), stop = new AbortController(); let release!: () => void, active = 0, maximum = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  const send = vi.fn(async () => { active++; maximum = Math.max(maximum, active); await held; active--; return response(); });
  const transport = continuationTransport(session, send);
  const first = [transport(url, request()), transport(url, request()), transport(url, request())];
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(3));
  const queued = transport(url, request(stop.signal)).catch(e => e); stop.abort(); await queued;
  release(); await Promise.all(first);
  expect(maximum).toBe(3); expect(session.calls).toBe(3); expect(session.held).toBe(false);
});

it("discards a stopped caller's answer while allowing the already-started call to settle its receipt", async () => {
  const { session, token } = start(), stop = new AbortController();
  let body!: ReadableStreamDefaultController<Uint8Array>;
  const send = vi.fn(async () => new Response(new ReadableStream<Uint8Array>({ start(controller) { body = controller; } }), { headers: { "x-generation-id": "gen-receipt-fixture" } }));
  const paid = continuationTransport(session, send)(url, request(stop.signal));
  const caller = abortable(paid, stop.signal).catch(e => e);
  await vi.waitFor(() => expect([...session.attempts.values()][0]?.generation).toBe("gen-receipt-fixture"));
  stop.abort(new DOMException("Lane stopped", "AbortError"));
  expect(await caller).toMatchObject({ name: "AbortError" }); finishContinuationSession(session, false);
  expect(continuationAvailable(session)).toBe(false); expect(() => claimContinuationSession(token, "en")).toThrow("research_billing_uncertain");
  body.enqueue(new TextEncoder().encode(JSON.stringify({ choices: [{ message: { content: "{}" } }], usage: { cost: 0.001 } }))); body.close();
  await paid;
  expect(session.held).toBe(false); expect(continuationAvailable(session)).toBe(true);
  claimContinuationSession(token, "en"); await continuationTransport(session, send)(url, request());
  expect(send).toHaveBeenCalledOnce(); expect(session.actualUsd).toBe(0.001);
});

it("reconciles only the exact completed generation and never treats truncated output as an answer", async () => {
  const { session, token } = start();
  const send = vi.fn(async () => new Response("{", { headers: { "x-generation-id": "gen-truncated-fixture" } }));
  await expect(continuationTransport(session, send)(url, request())).rejects.toThrow("research_billing_uncertain");
  finishContinuationSession(session, false);
  const lookup = vi.fn(async () => Response.json({ data: { id: "gen-wrong", total_cost: 0, cancelled: true } }));
  await reconcileContinuationReceipts(session, "fixture", lookup); expect(session.held).toBe(true);
  lookup.mockImplementationOnce(async () => Response.json({ data: { id: "gen-truncated-fixture", total_cost: 0, cancelled: true } }));
  await reconcileContinuationReceipts(session, "fixture", lookup);
  expect(session.held).toBe(false); expect([...session.attempts.values()][0].state).toBe("accounted");
  claimContinuationSession(token, "en");
  const next = vi.fn(async () => response()); await continuationTransport(session, next)(url, request());
  expect(next).toHaveBeenCalledOnce(); expect(session.calls).toBe(2);
});

it("keeps late receipt collection inside the route execution window", async () => {
  const { session } = start(), windows: number[] = [];
  const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => { windows.push(ms); return new AbortController().signal; });
  try {
    await withAskRequest("bounded-receipt-fixture", () => continuationTransport(session, async () => response())(url, request()), Date.now() - 35_000);
    expect(windows[0]).toBeGreaterThan(22_000); expect(windows[0]).toBeLessThanOrEqual(23_000);
  } finally { timeout.mockRestore(); }
});

it("does not impose a connection or route-age timer on explicitly unhurried local research", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_UNHURRIED", "true");
  vi.useFakeTimers();
  const { session, token } = start(), windows: number[] = [];
  const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => { windows.push(ms); return new AbortController().signal; });
  try {
    await vi.advanceTimersByTimeAsync(CONTINUATION_LIMITS.ttlMs + 1);
    expect(readContinuationSession(token, "en")).toBe(session);
    await withAskRequest("unhurried-receipt-fixture", () => continuationTransport(session, async () => response())(url, request()), Date.now() - 180_000);
    expect(windows).toEqual([]);
    const send = vi.fn(async () => response()), transport = continuationTransport(session, send);
    for (let i = 0; i <= CONTINUATION_LIMITS.runCalls; i++) await transport(url, request());
    expect(session.calls).toBe(CONTINUATION_LIMITS.runCalls + 1);
    expect(send).toHaveBeenCalledTimes(CONTINUATION_LIMITS.runCalls);
    session.calls = CONTINUATION_LIMITS.calls;
    await expect(transport(url, request())).rejects.toThrow("research_limit");
  } finally { timeout.mockRestore(); vi.unstubAllEnvs(); }
});
it("uses the stable runtime policy without depending on the local debugging switch", async () => {
  vi.stubEnv("ASK_LOCAL_UNHURRIED", "false");
  const { session } = start(), windows: number[] = [], send = vi.fn(async () => response());
  // Install the transport before the stable execution context, as the route does.
  const transport = continuationTransport(session, send);
  const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => { windows.push(ms); return new AbortController().signal; });
  try {
    await withResearchRuntime(Infinity, () => withAskRequest("stable-runtime-fixture", async () => {
      for (let i = 0; i <= CONTINUATION_LIMITS.runCalls; i++) await transport(url, request());
    }, Date.now() - 180_000));
    expect(windows).toEqual([]); expect(session.held).toBe(false);
    expect(session.calls).toBe(CONTINUATION_LIMITS.runCalls + 1);
  } finally { finishContinuationSession(session, true); session.expires = 0; timeout.mockRestore(); vi.unstubAllEnvs(); }
});

it("serves cached results immediately and prioritizes checked work over queued research", async () => {
  const { session, token } = start();
  const tagged = (tag: string) => ({ ...request(), body: JSON.stringify({ ...JSON.parse(String(request().body)), messages: [{ role: "user", content: tag }] }) });
  const original = vi.fn(async () => response());
  await continuationTransport(session, original)(url, tagged("cached"));
  finishContinuationSession(session, false); claimContinuationSession(token, "en");
  const releases: (() => void)[] = [], order: string[] = [];
  const send = vi.fn(async (_url: string, init: RequestInit) => {
    order.push(JSON.parse(String(init.body)).messages[0].content);
    await new Promise<void>(resolve => releases.push(resolve)); return response();
  });
  const transport = continuationTransport(session, send);
  const running = ["one", "two", "three"].map(tag => transport(url, tagged(tag)));
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(3));
  const background = withModelPriority(4, () => transport(url, tagged("background")));
  const checked = withModelPriority(0, () => transport(url, tagged("checked")));
  expect((await transport(url, tagged("cached"))).status).toBe(200);
  expect(send).toHaveBeenCalledTimes(3);
  releases.shift()!();
  await vi.waitFor(() => expect(order[3]).toBe("checked"));
  releases.shift()!();
  await vi.waitFor(() => expect(order[4]).toBe("background"));
  for (const release of releases) release();
  await Promise.all([...running, background, checked]);
  expect(session.calls).toBe(6);
});

it("enforces the actual paid-send cap separately for each explicit run", async () => {
  const { session, token } = start(), send = vi.fn(async () => response());
  const transport = continuationTransport(session, send);
  for (let i = 0; i < CONTINUATION_LIMITS.runCalls; i++) await transport(url, request());
  await expect(transport(url, request())).rejects.toThrow("research_limit");
  expect(send).toHaveBeenCalledTimes(CONTINUATION_LIMITS.runCalls);
  finishContinuationSession(session, false); claimContinuationSession(token, "en");
  const resumed = continuationTransport(session, send);
  // Existing responses replay for free before this run makes one genuinely new send.
  for (let i = 0; i <= CONTINUATION_LIMITS.runCalls; i++) await resumed(url, request());
  expect(send).toHaveBeenCalledTimes(CONTINUATION_LIMITS.runCalls + 1);
  finishContinuationSession(session, false); claimContinuationSession(token, "en");
  const third = continuationTransport(session, send);
  const large = { ...request(), body: JSON.stringify({ ...JSON.parse(String(request().body)), model: "openai/gpt-6-luna", max_tokens: CONTINUATION_LIMITS.runOutputTokens }) };
  await third(url, large);
  const different = { ...request(), body: JSON.stringify({ ...JSON.parse(String(request().body)), messages: [{ role: "user", content: "New output reservation" }] }) };
  await expect(third(url, different)).rejects.toThrow("research_limit");
  expect(send).toHaveBeenCalledTimes(CONTINUATION_LIMITS.runCalls + 2);
});
