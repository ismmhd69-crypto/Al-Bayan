import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ ask: vi.fn() }));
vi.mock("@/lib/ask/pipeline", () => ({ ask: mock.ask }));
vi.mock("@/lib/ask/limits", () => ({ askEnabled: () => true, takeSlot: () => "ok", visitorKey: () => "test", withSlot: (fn: () => unknown) => fn() }));
vi.mock("@/lib/ask/display-translations", () => ({ attachScholarTranslations: (value: unknown) => value }));
import { currentAskRequestId } from "@/lib/ask/trace-context";
import { POST } from "@/app/api/ask/route";
import { getDictionary } from "@/lib/i18n";
const request = (body: unknown) => new Request("https://bayan.test/api/ask", { method: "POST", headers: { origin: "https://bayan.test", "content-type": "application/json" }, body: JSON.stringify(body) });
describe("Ask conversation request contract", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it("correlates intake, pipeline and final response without logging visitor content", async () => {
    vi.stubEnv("ASK_DEBUG", "true");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    let pipelineId: string | undefined;
    mock.ask.mockImplementationOnce(async () => { pipelineId = currentAskRequestId(); return { status: "no_source", language: "en" }; });
    const response = await POST(request({ question: "PRIVATE VISITOR QUESTION", lang: "en" }));
    expect(response.headers.get("X-Ask-Request-Id")).toBe(pipelineId);
    const lines = info.mock.calls.map(([line]) => JSON.parse(String(line).split("ask diagnostic: ")[1]));
    expect(lines.map((line) => line.code)).toEqual(["request_received", "request_validated", "request_finished"]);
    expect(lines.every((line) => line.request_id === pipelineId)).toBe(true);
    expect(JSON.stringify(info.mock.calls)).not.toContain("PRIVATE");
  });
  it("logs terminal rejection and sanitizes arbitrary provider errors", async () => {
    vi.stubEnv("ASK_DEBUG", "true");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const invalid = await POST(request({ question: "", lang: "en" }));
    expect(invalid.status).toBe(400); expect(invalid.headers.get("X-Ask-Request-Id")).toBeTruthy();
    mock.ask.mockRejectedValueOnce(new Error("PRIVATE QUESTION KEY SOURCE"));
    expect((await POST(request({ question: "PRIVATE QUESTION", lang: "en" }))).status).toBe(502);
    expect(JSON.stringify([...info.mock.calls, ...error.mock.calls])).not.toContain("PRIVATE");
    expect(info.mock.calls.at(-1)?.[0]).toContain('"status":"error"');
  });
  beforeEach(() => { mock.ask.mockReset(); mock.ask.mockResolvedValue({ status: "no_source", language: "en" }); });
  it("retains the old request shape", async () => {
    expect((await POST(request({ question: "Question", lang: "en" }))).status).toBe(200);
    expect(mock.ask).toHaveBeenCalledWith("Question", "en");
  });
  it("accepts four Unicode user messages within the bounded body size", async () => {
    const previous = Array(4).fill("س".repeat(500));
    expect((await POST(request({ question: "س".repeat(500), lang: "ar", previous_user_messages: previous }))).status).toBe(200);
    expect(mock.ask).toHaveBeenCalledWith("س".repeat(500), "ar", undefined, previous);
  });
  it.each([Array(5).fill("question"), ["x".repeat(501)], [{ role: "assistant", text: "answer" }]])("rejects excessive or non-user-string context %j", async (history) => {
    expect((await POST(request({ question: "Question", lang: "en", previous_user_messages: history }))).status).toBe(400);
    expect(mock.ask).not.toHaveBeenCalled();
  });
  it.each(["en", "de", "ar"] as const)("returns localized clarification for %s", async (lang) => {
    mock.ask.mockResolvedValue({ status: "clarify", language: lang, clarification: { choices: ["topic A", "topic B"] } });
    const response = await POST(request({ question: "Question", lang, supports_clarification: true }));
    expect(await response.json()).toMatchObject({ status: "clarify", clarification: { prompt: getDictionary(lang).ask.clarify, choices: ["topic A", "topic B"] } });
  });
  it("gives old clients a supported status instead of an unknown-status error", async () => {
    mock.ask.mockResolvedValue({ status: "clarify", language: "en", clarification: { choices: [] } });
    expect(await (await POST(request({ question: "Question", lang: "en" }))).json()).toMatchObject({ status: "no_summary", text: getDictionary("en").ask.clarify });
  });
});
