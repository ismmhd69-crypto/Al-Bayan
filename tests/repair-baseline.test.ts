import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { REPAIR_TRACE_IDS, summariseRepairTrace } from "@/scripts/record-ask-repair-baseline";
it("replays a broken envelope without retaining question, credentials or source text", () => {
  const id = REPAIR_TRACE_IDS[0];
  const report = summariseRepairTrace(id, [
    { request_id: id, sequence: 1, event: "model_request", data: { call_id: "A1", prompt: { visitor_text: "PRIVATE_QUESTION", secret: "PRIVATE_SECRET" } } },
    { request_id: id, sequence: 2, event: "stage", data: { code: "provider_visible_output", details: { call_id: "A1", content: '{"broken": - "PRIVATE_ORIGINAL"}' } } },
    { request_id: id, sequence: 3, event: "terminal_result", elapsed_ms: 10, data: { status: "error" } },
  ]);
  expect(report.replays).toContainEqual(expect.objectContaining({ parsed: false }));
  expect(JSON.stringify(report)).not.toMatch(/PRIVATE_QUESTION|PRIVATE_SECRET|PRIVATE_ORIGINAL/);
  expect(report.acceptance).toBe("unreviewed_baseline_only");
});
it("rejects missing and crossed trace sequences instead of claiming a valid baseline", () => {
  expect(() => summariseRepairTrace(REPAIR_TRACE_IDS[0], [])).toThrow();
  expect(() => summariseRepairTrace(REPAIR_TRACE_IDS[0], [{ request_id: REPAIR_TRACE_IDS[1], sequence: 1, event: "terminal_result", data: {} }])).toThrow();
});
