import { fork, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { claimContinuationSession, createContinuationSession, continuationTransport, finishContinuationSession } from "@/lib/ask/continuation-session";

const url = "https://openrouter.ai/api/v1/chat/completions";
const request = (text: string) => ({ method: "POST", body: JSON.stringify({ model: "fixture", max_tokens: 100,
  provider: { data_collection: "deny" }, messages: [{ role: "user", content: text }] }) });
it("keeps Vertex Gemini calls, token charges and reservations across fallback and retry", async () => {
  const { token, session } = createContinuationSession("Invented Vertex fixture", "en", [], Date.now(), 3, { owner: "fixture", simple: true });
  claimContinuationSession(token, "en");
  const vertexUrl = "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.1-flash-lite:generateContent";
  const vertexRequest = (text: string) => ({ method: "POST", body: JSON.stringify({ contents: [{ role: "user", parts: [{ text }] }], generationConfig: { maxOutputTokens: 100 } }) });
  let sends = 0;
  const send = async () => { sends++; return Response.json({ candidates: [], usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 10 } }); };
  try {
    const initial = continuationTransport(session, send);
    for (let i = 0; i < 8; i++) await initial(vertexUrl, vertexRequest(`initial ${i}`));
    finishContinuationSession(session, false); claimContinuationSession(token, "en");
    await continuationTransport(session, send)(vertexUrl, vertexRequest("fallback"));
    await continuationTransport(session, send)(vertexUrl, vertexRequest("fallback"));
    expect(sends).toBe(9); expect(session.calls).toBe(9);
    expect(session.actualUsd).toBeCloseTo(9 * (100 * 0.25 + 30 * 1.5) / 1_000_000);
    await expect(continuationTransport(session, send)(vertexUrl, vertexRequest("fresh retry"))).rejects.toThrow("research_limit");
    session.calls = 0;
    session.attempts.set("prior_cost_fixture", { state: "accounted", reserved: 0.499, cost: 0.499 });
    await expect(continuationTransport(session, send)(vertexUrl, vertexRequest("cost fallback"))).rejects.toThrow("research_limit");
    expect(sends).toBe(9);
  } finally { session.active = false; session.expires = 0; }
});
it("shares nine calls and the cost allowance across retry and fallback transports", async () => {
  const { token, session } = createContinuationSession("Invented limit fixture", "en", [], Date.now(), 3, { owner: "fixture", simple: true });
  claimContinuationSession(token, "en");
  let sends = 0;
  const send = async () => { sends++; return Response.json({ choices: [{ message: { content: "{}" } }], usage: { cost: 0.001 } }); };
  try {
    const initial = continuationTransport(session, send);
    for (let i = 0; i < 8; i++) await initial(url, request(`initial ${i}`));
    finishContinuationSession(session, false); claimContinuationSession(token, "en");
    await continuationTransport(session, send)(url, request("fallback"));
    await continuationTransport(session, send)(url, request("fallback"));
    expect(sends).toBe(9); expect(session.calls).toBe(9); expect(session.actualUsd).toBeCloseTo(0.009);
    await expect(continuationTransport(session, send)(url, request("fresh retry"))).rejects.toThrow("research_limit");
    expect(sends).toBe(9);
  } finally { session.active = false; session.expires = 0; }
});
it("keeps cumulative cost reservations when changing to a fallback transport", async () => {
  const { token, session } = createContinuationSession("Invented cost fixture", "en", [], Date.now(), 3, { owner: "fixture", simple: true });
  claimContinuationSession(token, "en");
  let sends = 0;
  const send = async () => { sends++; return Response.json({ choices: [{ message: { content: "{}" } }], usage: { cost: 0.001 } }); };
  try {
    await continuationTransport(session, send)(url, request("initial"));
    session.attempts.set("prior_accounted_fixture", { state: "accounted", reserved: 0.498, cost: 0.498 });
    await expect(continuationTransport(session, send)(url, request("fallback"))).rejects.toThrow("research_limit");
    expect(sends).toBe(1); expect(session.calls).toBe(1);
  } finally { session.active = false; session.expires = 0; }
});

type Reply = { mode: string; token: string; cookie: string; foreignExpired: boolean; sends: number; calls: number; error?: string };
function query(child: ChildProcess, message: object): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error("fixture_timeout")); }, 10_000);
    const failed = () => { cleanup(); reject(new Error("fixture_process_failed")); };
    const receive = (reply: Reply) => { cleanup(); reply.error ? reject(new Error(reply.error)) : resolve(reply); };
    const cleanup = () => { clearTimeout(timer); child.off("message", receive); child.off("exit", failed); child.off("error", failed); };
    child.once("message", receive); child.once("exit", failed); child.once("error", failed); child.send(message);
  });
}
it("documents duplicate work across two isolated server-state processes", async () => {
  const fixture = fileURLToPath(new URL("./fixtures/follow-up-process.ts", import.meta.url));
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", ...Object.fromEntries(["PATH", "SystemRoot", "TEMP", "TMP"].flatMap(key => process.env[key] ? [[key, process.env[key]!]] : [])) };
  const children = [0, 1].map(() => fork(fixture, [], { execArgv: ["--import", "tsx", "--conditions=react-server"], env, stdio: ["ignore", "ignore", "pipe", "ipc"] }));
  try {
    const first = await query(children[0], {});
    const same = await query(children[0], { cookie: first.cookie, token: first.token });
    const other = await query(children[1], { cookie: first.cookie, token: first.token });
    expect(first).toMatchObject({ mode: "new", sends: 1, calls: 1 });
    expect(same).toMatchObject({ mode: "resume", sends: 1, calls: 1, foreignExpired: false });
    expect(other).toMatchObject({ mode: "new", sends: 1, calls: 1, foreignExpired: true });
    expect(other.token).not.toBe(first.token);
  } finally { await Promise.all(children.map(child => new Promise<void>(resolve => { child.once("exit", () => resolve()); if (child.exitCode !== null) resolve(); else child.kill(); }))); }
}, 25_000);
