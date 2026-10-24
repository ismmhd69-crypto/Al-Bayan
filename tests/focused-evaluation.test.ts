import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { focusedCases, focusedCaseFingerprint, focusedEvaluationRequest, focusedEvaluationOutcome,
  focusedEvaluationSummary, validFocusedReviews, focusedBatchTransport, type FocusedRow } from "../scripts/evaluate-ask-focused";
import { SpendGuard } from "../scripts/ask-spend-guard";
import { CLAIM_AUDIT_FIELDS } from "@/lib/ask/checks";

describe("actual rich/focused checker comparison preparation", () => {
  const inputs = focusedCases();
  const one = inputs.find(c => c.id === "recorded-creation/with-context/en/incorrect")!;
  it("covers the existing pairs and recorded context/benefit failures in all three languages", () => {
    expect(inputs).toHaveLength(96); expect(new Set(inputs.map(c => c.id)).size).toBe(96);
    for (const language of ["en", "de", "ar"]) {
      const group = inputs.filter(c => c.language === language); expect(group).toHaveLength(32);
      expect(group.filter(c => c.id.startsWith("recorded-") && c.variant === "incorrect")).toHaveLength(4);
    }
    for (const c of inputs) {
      const rich = focusedEvaluationRequest(c, "legacy_rich_support"), focused = focusedEvaluationRequest(c, "focused_support");
      expect(rich.system).toContain("You independently check Bayan explanations.");
      expect(focused.system).toContain("You check whether Bayan claims follow from their exact cited excerpts.");
      expect(JSON.parse(focused.prompt).claims[0].claim).toBe(c.summary);
      expect(JSON.parse(rich.prompt).claims[0].claim).toBe(c.summary);
    }
  });
  it("keeps the recorded provision detail in restrictive context, never silently in the supporting citation", () => {
    const p = JSON.parse(focusedEvaluationRequest(one, "focused_support").prompt);
    expect(p.claims[0].source_ids).toEqual(["Q51:56"]);
    expect(p.claims[0].supporting_excerpts).toHaveLength(1);
    expect(p.claims[0].restrictive_context.passages).toHaveLength(2);
    const without = inputs.find(c => c.id === "recorded-creation/without-context/en/incorrect")!;
    expect(JSON.parse(focusedEvaluationRequest(without, "focused_support").prompt).claims[0].restrictive_context.passages).toEqual([]);
    const benefit = inputs.find(c => c.id === "recorded-benefit/with-context/en/incorrect")!;
    expect(JSON.parse(focusedEvaluationRequest(benefit, "focused_support").prompt).claims[0].source_ids).toEqual(["Q29:17", "HE65936"]);
  });
  it("does not treat fixture expectations as human source/language approval", () => {
    expect(validFocusedReviews({}, [one])).toBe(false);
    const row = { id: one.id, inputHash: focusedCaseFingerprint(one), expected: one.expected, sourceFaithfulness: "reviewed", languageReview: "reviewed", reviewer: "Test reviewer", reviewedAt: "2026-10-21T00:00:00Z" };
    expect(validFocusedReviews({ version: 1, approvals: [row] }, [one])).toBe(true);
    for (const change of [{ inputHash: "a".repeat(64) }, { reviewer: "" }, { expected: "accept" }, { reviewedAt: "2099-01-01" }, { sourceFaithfulness: "pending" }, { languageReview: "pending" }]) {
      expect(validFocusedReviews({ version: 1, approvals: [{ ...row, ...change }] }, [one])).toBe(false);
    }
    expect(validFocusedReviews({ version: 1, approvals: [row, row] }, [one])).toBe(false);
    const changed = structuredClone(one); changed.candidate.context = [];
    expect(validFocusedReviews({ version: 1, approvals: [row] }, [changed])).toBe(false);
  });
  it("distinguishes uncertainty and malformed responses from a semantic rejection", () => {
    const raw = { claims: [{ claim_id: "C1", source_ids: ["Q51:56"], verdict: "uncertain", grounds: [], reason_codes: ["uncertain"], explanation: "Cannot establish the added clause." }] };
    expect(focusedEvaluationOutcome(raw, one, "focused_support")).toBe("uncertain");
    expect(focusedEvaluationOutcome({}, one, "focused_support")).toBe("invalid");
    const legacy = { claim_assessments: [{ claim_id: "C1", source_ids: ["Q51:56"], ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map(f => [f, "yes"])),
      direct_support: "unsure", reason_codes: ["unsupported_meaning"], explanation: "Cannot establish the extra clause." }] };
    expect(focusedEvaluationOutcome(legacy, one, "legacy_rich_support")).toBe("uncertain");
    legacy.claim_assessments[0].direct_support = "no";
    expect(focusedEvaluationOutcome(legacy, one, "legacy_rich_support")).toBe("unsupported");
  });
  it("does not claim a passed comparison from partial results, unreviewed labels or invalid outputs", () => {
    const rows: FocusedRow[] = [{ id: "a", mode: "focused_support", expected: "accept", outcome: "supported", ms: 10, cost: 0 },
      { id: "b", mode: "focused_support", expected: "reject", outcome: "invalid", ms: 10, cost: 0 }];
    const s = focusedEvaluationSummary(rows, ["a", "b"], true)[1];
    expect(s).toMatchObject({ complete: true, explicitIncorrectRejections: 0, invalidResponses: 1, designatedSamplePassed: false });
    rows[1].outcome = "unsupported";
    expect(focusedEvaluationSummary(rows, ["a", "b"], false)[1].designatedSamplePassed).toBe(false);
    expect(focusedEvaluationSummary(rows.slice(0, 1), ["a", "b"], true)[1].complete).toBe(false);
    expect(focusedEvaluationSummary(rows, ["a", "b"], true)[1].designatedSamplePassed).toBe(true);
  });
  it("blocks paid transport before a batch ceiling or unsettled billing can be bypassed", async () => {
    const guard = new SpendGuard({ cap: 1.5, entries: [] }), send = vi.fn<typeof fetch>(async () => Response.json({}));
    const url = "https://openrouter.ai/api/v1/chat/completions";
    const body = { messages: [{ role: "user", content: "Invented test" }], max_tokens: 3000 };
    await expect(focusedBatchTransport(guard, 0, .01, send)(url, { method: "POST", body: JSON.stringify(body) })).rejects.toThrow("batch ceiling");
    expect(send).not.toHaveBeenCalled();
    await expect(focusedBatchTransport(guard, 0, .25, send)("https://elsewhere.invalid", { method: "POST", body: JSON.stringify(body) })).rejects.toThrow("unexpected comparison");
    guard.reserve("test/model", .1);
    await expect(focusedBatchTransport(guard, 0, .25, send)(url, { method: "POST", body: JSON.stringify(body) })).rejects.toThrow("billing unresolved");
    expect(send).not.toHaveBeenCalled();
    expect(() => focusedBatchTransport(guard, -1, .25, send)).toThrow("invalid focused batch ceiling");
  });
});
