import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { premiseCheck, visitorConditions, expandedPlannerRequest } from "@/lib/ask/follow-up";
import { evaluatePlanner, currentPlannerRequest } from "../scripts/ask-follow-up-planner";
import { PLANNER_CASES } from "../scripts/ask-follow-up-fixtures";
import { plannerRunBudget, type RunLedger } from "../scripts/follow-up-run-budget";
import type { JsonRequest } from "@/lib/ai/types";

it.each([
  ["What applies, given that Hajj is required?", "Explain that simply.", true],
  ["Since that ruling applies, what happens?", "Explain that simply.", true],
  ["What applies because travel is allowed?", "Explain that simply.", true],
  ["ما الحكم بما أن هذا واجب؟", "اشرح ذلك", true],
  ["ما الحكم حيث أن هذا واجب؟", "اشرح ذلك", true],
  ["ما الحكم علما أن هذا واجب؟", "اشرح ذلك", true],
  ["ما الحكم لأن هذا واجب؟", "اشرح ذلك", true],
  ["What applies because I am traveling?", "What applies because I am traveling?", false],
  ["ما الحكم بما أنني مسافر؟", "ما الحكم بما أنني مسافر؟", false],
])("finds only premise connectors absent from visitor text: %s", (rewrite, message, rejected) => {
  expect(premiseCheck(String(rewrite), [String(message)]).introduced.length > 0).toBe(rejected);
});
it("allows premise connectors supplied in earlier user messages", () => {
  expect(premiseCheck("What applies since I am traveling?", ["Explain that", "Since I am traveling, what applies?"]).introduced).toEqual([]);
});
it.each([
  ["Hajj travel", "Hajj travel", "Explain that", [], false],
  ["not traveling", "NOT traveling", "What if I am NOT traveling?", [], true],
  ["inability to perform Hajj", "غير قادر على الحج", "وماذا لو كان الشخص غير قادر على الحج؟", [], true],
  ["traveling tomorrow", "traveling tomorrow", "Does that apply?", ["I am traveling tomorrow."], true],
])("keeps conditions only with an exact visitor quote: %s", (condition, quote, message, history, kept) => {
  const test = { ...PLANNER_CASES[0], message: String(message), history: history as string[],
    parent: { ...PLANNER_CASES[0].parent!, displayed_sentences: [String(quote)] } };
  const raw = { follow_up: { relation: "related", resolved_question: "What does the cited explanation mean?", intent: "re_explain" },
    requested_points: [{ text: "Explain Hajj travel", essential_conditions: [condition], essential_condition_quotes: [quote] }] };
  const result = visitorConditions(raw, test);
  expect(result.checks[0].kept).toBe(kept);
  const point = (result.cleaned!.requested_points as { text: string; essential_conditions: string[] }[])[0];
  expect(point.essential_conditions).toEqual(kept ? [condition] : []); expect(point.text).toBe("Explain Hajj travel");
  expect(raw.requested_points[0].essential_conditions).toEqual([condition]);
});
it("leaves first-question conditions unchanged", () => {
  const raw = { follow_up: { relation: "none", resolved_question: "", intent: "none" }, requested_points: [{ essential_conditions: ["traveling"] }] };
  expect(visitorConditions(raw, PLANNER_CASES[0]).cleaned).toEqual(raw);
});
it("uses one correction then clarification for an introduced premise, even if other frame data is invalid", async () => {
  const test = PLANNER_CASES[0], base = await currentPlannerRequest(test, "fixture");
  const generateJson = vi.fn(async (_request: JsonRequest) => ({ follow_up: { relation: "related", resolved_question: "Explain the view given that it is correct.", intent: "re_explain" } }));
  const result = await evaluatePlanner(expandedPlannerRequest(base, test), test, { id: "fixture", generateJson }, true);
  expect(generateJson).toHaveBeenCalledTimes(2); expect(result.fallback).toBe("clarify");
  expect(JSON.parse(generateJson.mock.calls[1][0].prompt).correction).toContain("introduced_premise_connector");
});
it("stops on a provider failure even with a usage receipt, preventing a provider retry", async () => {
  const ledger: RunLedger = { calls: 0, spentUsd: 0, reservedUsd: 0, held: false, receipts: [] };
  const send = vi.fn(async () => Response.json({ usageMetadata: { promptTokenCount: 0 } }, { status: 503 }));
  const guarded = plannerRunBudget(ledger, async () => {}, send, { calls: 64, usd: 0.15 });
  const request = { method: "POST", body: JSON.stringify({ systemInstruction: { parts: [{ text: "You create a safe search plan" }] }, contents: [{ parts: [{ text: JSON.stringify({ visitor_text: "Synthetic test" }) }] }], generationConfig: { maxOutputTokens: 4000 } }) };
  const url = "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.1-flash-lite:generateContent";
  await expect(guarded(url, request)).rejects.toThrow();
  await expect(guarded(url, request)).rejects.toThrow(); expect(send).toHaveBeenCalledTimes(1);
});
