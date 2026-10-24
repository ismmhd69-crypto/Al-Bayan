import { expect, it } from "vitest";
import { isolatedMeaningReviewRequest, parseMeaningReview } from "@/lib/ask/meaning-review";
import { structuredOutputContract } from "@/lib/ai/structured-output";

it("withholds all uncited original text from a single claim's positive support task", () => {
  const request = isolatedMeaningReviewRequest({ text: "A test assertion.", refs: ["Q1"] }, { passages: [
    { id: "Q1", arabic: "CITED ORIGINAL", surrounding_context: [{ id: "Q2", arabic: "NEIGHBOUR MUST NOT LEAK" }] },
    { id: "Q3", arabic: "OTHER CLAIM MUST NOT LEAK" },
  ] }, new AbortController().signal);
  expect(request.prompt).not.toContain("NEIGHBOUR MUST NOT LEAK");
  expect(request.prompt).not.toContain("OTHER CLAIM MUST NOT LEAK");
  expect(JSON.parse(request.prompt).claims).toEqual([{ claim_id: "C1", text: "A test assertion.", originals: [{ source_id: "Q1", arabic: "CITED ORIGINAL" }] }]);
  expect(request.maxOutputTokens).toBe(2100);
});
it("keeps complementary sources only when the claim explicitly cites both", () => {
  const request = isolatedMeaningReviewRequest({ text: "Compound test assertion.", refs: ["Q1", "Q2"] }, { passages: [
    { id: "Q1", arabic: "FIRST CITED ORIGINAL" }, { id: "Q2", arabic: "SECOND CITED ORIGINAL" },
  ] }, new AbortController().signal);
  expect(JSON.parse(request.prompt).claims[0].originals).toHaveLength(2);
});
it("retains strict whole-response shape and negative/uncertain decisions", () => {
  const item = { text: "A test assertion.", refs: ["Q1"] };
  const req = isolatedMeaningReviewRequest(item, { passages: [{ id: "Q1", arabic: "TEST" }] }, new AbortController().signal);
  const contract = structuredOutputContract(req.schema);
  const rejected = { claims: { C1: { verdict: "no", explanation: "Missing assertion." } } };
  expect(parseMeaningReview(contract.parse(JSON.stringify(rejected)), [item])?.failures).toHaveLength(1);
  expect(contract.parse(JSON.stringify({ ...rejected, coverage: "yes" }))).toBeNull();
  expect(contract.parse('{"claims":{"C1":{"verdict":"yes","explanation":""}}')).toBeNull();
});
