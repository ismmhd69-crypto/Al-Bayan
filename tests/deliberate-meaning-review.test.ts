import { expect, it } from "vitest";
import { deliberateMeaningRequest, parseDeliberateMeaning } from "@/lib/ask/deliberate-meaning-review";
import { structuredOutputContract } from "@/lib/ai/structured-output";
const item = { text: "A claim", refs: ["own"] };
const row = { original_meanings: [{ source_id: "own", meaning: "What the original says" }], comparison: "Comparison with the exact proposed wording", verdict: "yes" };
it("requires complete own-original analysis and rejects malformed envelopes in full", () => {
  expect(parseDeliberateMeaning(row, item)?.safeIds).toEqual(["C1"]);
  for (const invalid of [{ ...row, extra: true }, { ...row, comparison: "" }, { ...row, original_meanings: [] },
    { ...row, original_meanings: [{ source_id: "other", meaning: "External knowledge" }] }, { ...row, verdict: "probably" }]) {
    expect(parseDeliberateMeaning(invalid, item)).toBeNull();
  }
  expect(parseDeliberateMeaning({ ...row, verdict: "unsure" }, item)?.safeIds).toEqual([]);
});
it("includes only own unchanged originals and orders analysis before the verdict", () => {
  const req = deliberateMeaningRequest(item, [{ id: "own", arabic: "الأصل" }, { id: "other", arabic: "ليس مصدراً" }], new AbortController().signal);
  expect(JSON.parse(req.prompt).originals).toEqual([{ source_id: "own", arabic: "الأصل" }]);
  if (req.schema.type !== "object") throw Error("schema");
  expect(Object.keys(req.schema.properties)).toEqual(["original_meanings", "comparison", "verdict"]);
  expect(() => structuredOutputContract(req.schema)).not.toThrow();
  expect(req.maxOutputTokens).toBe(2100);
});
