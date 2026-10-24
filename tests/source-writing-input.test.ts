import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { independentSourceWritingInput } from "../lib/ask/source-writing-input";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";
import type { JsonRequest } from "../lib/ai/types";

it("removes only sibling draft history and selector scope from source-writing input", () => {
  const input = { sections_to_write: ["hadith"], source_explanations_already_drafted: { quran: [{ text: "An unapproved assertion" }] }, source_explanations_status: "provisional",
    evidence_package: { question: { requirements: [{ id: "R1", scope: "general" }] }, passages: [{ id: "a", arabic: "Exact original", surrounding_context: [{ arabic: "Restriction" }],
      supported_requirement_ids: ["R1"], contribution: { role: "limited_example", scope: "general", conditions: ["Condition retained"] } }] },
    correction: { rejected_draft: "Rejected text remains untrusted correction data" } };
  const request: JsonRequest = { prompt: JSON.stringify(input), system: "Original rules", schema: { type: "object", properties: {}, required: [] }, maxOutputTokens: 2200 };
  const result = independentSourceWritingInput(request), next = JSON.parse(result.prompt), expected = structuredClone(input) as any;
  delete expected.source_explanations_already_drafted; delete expected.source_explanations_status; delete expected.evidence_package.passages[0].contribution.scope;
  expect(next).toEqual(expected); expect(JSON.parse(request.prompt)).toEqual(input);
  expect(result.schema).toBe(request.schema); expect(result.maxOutputTokens).toBe(2200);
  expect(result.system).toContain("never independent evidence");
  for (const groups of [["summary"], ["hadith", "summary"]]) expect(independentSourceWritingInput({ ...request, prompt: JSON.stringify({ ...input, sections_to_write: groups }) }).prompt).toBe(JSON.stringify({ ...input, sections_to_write: groups }));
});

it("uses input isolation in the real engine but retains originals, final audits and failure withdrawal", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let sourceRequests = 0, finalRequests = 0;
  deps.independentSourceWriting = true;
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (!p.sections_to_write.includes("summary")) {
      sourceRequests++;
      expect(p).not.toHaveProperty("source_explanations_already_drafted");
      expect(p.evidence_package.passages.every((x: any) => x.arabic)).toBe(true);
      expect(p.evidence_package.passages.every((x: any) => x.contribution?.scope === undefined)).toBe(true);
    }
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt), raw = strictAudit(req.prompt);
    if (p.full_answer) { finalRequests++; raw.earlier_section_safe = "no"; }
    return raw;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(sourceRequests).toBeGreaterThan(0); expect(finalRequests).toBeGreaterThan(0);
  expect(result).toMatchObject({ status: "incomplete", withdraw: true });
});
