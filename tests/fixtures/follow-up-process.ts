import { privateResearch, privateResearchOwner } from "../../lib/ask/private-research";
import { claimContinuationSession, continuationTransport, finishContinuationSession, readContinuationSession } from "../../lib/ask/continuation-session";

globalThis.fetch = async () => { throw new Error("fixture_network_forbidden"); };
let sends = 0;
process.on("message", async (message: { cookie?: string; token?: string }) => {
  try {
    let foreignExpired = false;
    if (message.token) {
      try { readContinuationSession(message.token, "en"); }
      catch (error) { foreignExpired = error instanceof Error && error.message === "research_expired"; }
    }
    const owner = privateResearchOwner(message.cookie ?? null);
    const record = privateResearch(owner.owner, "Invented duplicate fixture", "en", []);
    const session = claimContinuationSession(record.token, "en");
    const send = async () => { sends++; return Response.json({ choices: [{ message: { content: "{}" } }], usage: { cost: 0.001 } }); };
    await continuationTransport(session, send)("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({
      model: "fixture", max_tokens: 100, provider: { data_collection: "deny" }, messages: [{ role: "user", content: "Invented duplicate fixture" }],
    }) });
    finishContinuationSession(session, false);
    process.send?.({ mode: record.mode, token: record.token, cookie: owner.cookie.split(";")[0], foreignExpired, sends, calls: session.calls });
  } catch { process.send?.({ error: "fixture_failed" }); }
});
