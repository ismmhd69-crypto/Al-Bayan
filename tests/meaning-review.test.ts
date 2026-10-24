import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { meaningReviewRequest, parseMeaningReview } from "@/lib/ask/meaning-review";
import { dependencies, pack, audit } from "./fixtures/rich";
import { runRichAnswer } from "@/lib/ask/rich-engine";
it("keeps unrelated originals out of the narrow meaning check and refuses uncertain or missing decisions", () => {
  const items = [{ text: "A test claim.", refs: ["Q1"] }];
  const req = meaningReviewRequest(items, { passages: [{ id: "Q1", arabic: "original", surrounding_context: [{ arabic: "restriction" }] }, { id: "Q2", arabic: "unrelated" }] }, new AbortController().signal);
  expect(JSON.parse(req.prompt).claims[0].originals.map((p: { source_id: string }) => p.source_id)).toEqual(["Q1"]);
  expect(parseMeaningReview({ claims: { C1: { verdict: "unsure", explanation: "The audience is not established." } } }, items)?.failures).toHaveLength(1);
  expect(parseMeaningReview({ claims: {} }, items)).toBeNull();
  expect(parseMeaningReview({ claims: { C1: { verdict: "no", explanation: "" } } }, items)).toBeNull();
});
it("feeds a narrow scope rejection into the existing single correction without streaming it as checked", async () => {
  const deps = dependencies(); deps.meaningReview = true; let rejected = false, corrected = false;
  const writer = deps.writer.generateJson;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.correction) { corrected = true; expect(input.correction.checker_findings.support_failures).toContainEqual({ claim_id: "C1", explanation: "A limited audience was broadened." }); }
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage !== "narrow_meaning_review_v1") return audit(req.prompt);
    const no = !rejected; rejected = true;
    return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string }) => [c.claim_id, { verdict: no ? "no" : "yes", explanation: no ? "A limited audience was broadened." : "" }])) };
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(corrected).toBe(true);
});
it("withdraws an earlier explanation when the later independent meaning check finds a real lost condition", async () => {
  const deps = dependencies(); deps.meaningReview = true;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage !== "narrow_meaning_review_v1") return audit(req.prompt);
    return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string }, i: number) => [c.claim_id, { verdict: input.claims.length > 1 && i === 0 ? "no" : "yes", explanation: input.claims.length > 1 && i === 0 ? "A newly noticed original condition is missing." : "" }])) };
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
});

it("checks survivors even when another claim already failed, preserving original claim IDs in feedback", async () => {
  const deps = dependencies(); deps.meaningReview = true; let checkedSurvivors = false;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage === "narrow_meaning_review_v1") {
      if (input.claims.length > 1) checkedSurvivors = true;
      return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string }) => [c.claim_id, { verdict: input.claims.length > 1 ? "no" : "yes", explanation: input.claims.length > 1 ? "A surviving claim broadened a specific activity." : "" }])) };
    }
    const result = audit(req.prompt);
    if (input.full_answer) {
      result.claim_assessments.at(-1)!.direct_support = "no";
      result.claim_assessments.at(-1)!.reason_codes = ["unsupported_meaning"];
      result.claim_assessments.at(-1)!.explanation = "The final summary contains an unsupported assertion.";
    }
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete"); expect(checkedSurvivors).toBe(true);
  // No unchecked survivor can become a ready section after another claim fails.
  if (result.status === "incomplete") expect(result.sections?.some(s => s.outcome === "ready")).toBe(false);
});

it("leaves room for reasoning and visible findings in the recorded seven-claim truncation shape", () => {
  const items = Array.from({ length: 7 }, (_, i) => ({ text: `Test claim ${i}.`, refs: ["Q1"] }));
  const req = meaningReviewRequest(items, { passages: [{ id: "Q1", arabic: "A test original." }] }, new AbortController().signal);
  // The actual failed seven-claim request exhausted 1,590 total tokens, including
  // 1,343 reasoning tokens, before its JSON could finish. No malformed fragment may pass.
  expect(req.maxOutputTokens).toBeGreaterThan(1590 + 1000);
  expect(req.system).toContain("explanation set to an empty string");
});
