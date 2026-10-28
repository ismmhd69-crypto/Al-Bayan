import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { richFrameOutputAllowance, richWritingOutputAllowance } from "@/lib/ask/rich-writing-schema";
import { createContinuationSession, claimContinuationSession, continuationTransport, finishContinuationSession, CONTINUATION_LIMITS } from "@/lib/ask/continuation-session";
import { modelReservation } from "@/lib/ai/price-ceiling";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack } from "./fixtures/rich";

const haiku = "openrouter/anthropic/claude-haiku-5.5|fallback:openrouter/google/gemini-3.8-flash";
it("keeps reasoning room and a bounded price reservation for the DeepSeek trial", () => {
  const id = "openrouter/deepseek/deepseek-v4-flash|fallback:openrouter/google/gemini-3.8-flash";
  expect(richWritingOutputAllowance(["quran"], id)).toBe(6600);
  expect(richFrameOutputAllowance(id)).toBe(3200);
  expect(modelReservation({ model: "deepseek/deepseek-v4-flash", messages: [], max_tokens: 6600 })).toBeGreaterThan(0);
});
it("passes the measured source-writing allowance to the actual writer without changing the claim schema", async () => {
  const deps = dependencies(), write = deps.writer.generateJson;
  deps.writer = { ...deps.writer, id: haiku };
  const requests: { tokens: number | undefined; schema: any }[] = [];
  deps.writer.generateJson = request => { requests.push({ tokens: request.maxOutputTokens, schema: request.schema }); return write(request); };
  const sourcePack = { ...pack, passages: [pack.passages[0]] };
  const result = await runRichAnswer(sourcePack, "en", deps, new AbortController().signal, "Explain care", {}, Infinity, { sourceOnly: "quran" });
  expect(result.status).toBe("incomplete");
  if (result.status !== "incomplete") throw Error("fixture result");
  expect(result.sections?.[0].outcome).toBe("ready");
  expect(requests).toHaveLength(1); expect(requests[0].tokens).toBe(6600);
  expect(requests[0].schema.properties.quran.maxItems).toBe(8);
  expect(requests[0].schema.properties.quran.items.properties.text.maxLength).toBe(300);
});

it("reserves the transmitted allowance and still blocks aggregate output exhaustion before dispatch", async () => {
  const created = createContinuationSession("Invented public test question", "en", []), session = claimContinuationSession(created.token, "en");
  const body = { model: "anthropic/claude-haiku-5.5", messages: [{ role: "user", content: "Invented fixture" }],
    max_tokens: richWritingOutputAllowance(["hadith"], haiku), provider: { data_collection: "deny", zdr: true } };
  const send = vi.fn(async (_url: string, init: RequestInit) => {
    expect(JSON.parse(String(init.body)).max_tokens).toBe(6600);
    return Response.json({ choices: [{ message: { content: "{}" } }], usage: { cost: 0.001 } });
  });
  try {
    const dispatch = continuationTransport(session, send), request = { method: "POST", body: JSON.stringify(body) };
    await dispatch("https://openrouter.ai/api/v1/chat/completions", request);
    expect(session.tokens).toBe(6600); expect([...session.attempts.values()][0].reserved).toBe(modelReservation(body));
    session.tokens = CONTINUATION_LIMITS.outputTokens - 6599;
    await expect(dispatch("https://openrouter.ai/api/v1/chat/completions", request)).rejects.toThrow("research_limit");
    expect(send).toHaveBeenCalledOnce();
  } finally { finishContinuationSession(session, false); session.expires = 0; }
});

it("leaves other writers and the existing summary allowance unchanged", () => {
  expect(richWritingOutputAllowance(["quran"], "openrouter/google/gemini-3.8-flash")).toBe(2200);
  expect(richWritingOutputAllowance(["summary"], haiku)).toBe(6600);
  expect(richFrameOutputAllowance(haiku)).toBe(3200); expect(richFrameOutputAllowance("fixture")).toBe(1600);
});
