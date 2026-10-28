import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const ask = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ask/pipeline", () => ({ ask }));
vi.mock("@/lib/ask/limits", () => ({ askEnabled: () => true, takeSlot: () => "ok", visitorKey: () => "fixture", withSlot: (work: () => unknown) => work() }));
import { POST } from "@/app/api/ask/stream/route";
import { consumeRichStream, emptyRichState, reduceRichEvent, type RichCallbacks } from "@/lib/ask/rich-answer";
import { sections, richAnswer } from "./fixtures/rich";
import { withAskTimeout } from "@/lib/ask/timing";
beforeEach(() => { vi.stubEnv("ASK_RICH_ENABLED", "true"); vi.stubEnv("ASK_STREAM_ENABLED", "true"); ask.mockReset(); });
afterEach(() => vi.unstubAllEnvs());
const request = () => new Request("https://bayan.test/api/ask/stream", { method: "POST", headers: { origin: "https://bayan.test", "content-type": "application/json" }, body: JSON.stringify({ question: "Explain care", lang: "en", stream_version: 3 }) });
it("streams immutable commits without preview cards or a second whole-answer pass", async () => {
  ask.mockImplementation(async (_q, _l, _t, _h, options: { rich: RichCallbacks; checkpoint: { needsEvidence: boolean } }) => {
    expect(options.rich.stable).toBe(true);
    sections.forEach(s => options.rich.onSection!(s));
    return { status: "rich_answer", answer: richAnswer };
  });
  const response = await POST(request()); let state = emptyRichState();
  await consumeRichStream(response.body!, e => { expect(["source_card", "withdraw", "withdraw_group", "section_update"]).not.toContain(e.type); state = reduceRichEvent(state, e); });
  expect(state.version).toBe(3); expect(state.sections).toEqual(sections); expect(state.terminal).toBe(true); expect(ask).toHaveBeenCalledOnce();
});
it("preserves a committed section when a buggy producer attempts replacement", async () => {
  ask.mockImplementation(async (_q, _l, _t, _h, options: { rich: RichCallbacks }) => {
    options.rich.onSection!(sections[0]);
    options.rich.onSection!({ ...sections[0], claims: [{ ...sections[0].claims[0], text: "A changed sentence." }] });
  });
  let state = emptyRichState();
  await consumeRichStream((await POST(request())).body!, e => { state = reduceRichEvent(state, e); });
  expect(state.sections[0]).toEqual(sections[0]); expect(state.result).toMatchObject({ status: "incomplete" });
});
// Reliability plan Phase 5: outside the owner's unhurried local mode, a v3 run is bounded so it ends
// with a final message before the hosting platform cuts it off. Stage deadlines therefore apply.
it("bounds v3 research outside local unhurried mode, so a stalled stage ends with an incomplete result", async () => {
  vi.stubEnv("ASK_LOCAL_UNHURRIED", "false");
  ask.mockImplementation(async () => {
    await withAskTimeout(undefined, 1, "fixture_research", () => new Promise(resolve => setTimeout(resolve, 15)));
    return { status: "no_source" };
  });
  let state = emptyRichState();
  await consumeRichStream((await POST(request())).body!, e => { state = reduceRichEvent(state, e); });
  expect(state.result).toMatchObject({ status: "incomplete" });
});
it("rejects blanket withdrawal before changing the server's committed section list", async () => {
  ask.mockImplementation(async (_q, _l, _t, _h, options: { rich: RichCallbacks }) => {
    options.rich.onSection!(sections[0]); options.rich.onWithdraw!("quran");
  });
  let state = emptyRichState();
  await consumeRichStream((await POST(request())).body!, e => { state = reduceRichEvent(state, e); });
  expect(state.sections).toEqual([sections[0]]);
  expect(state.result).toMatchObject({ status: "incomplete", sections: [sections[0]], withdraw: false });
});
