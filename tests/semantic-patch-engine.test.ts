import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "../lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";

// Invented claims and scripted verdicts prove correction boundaries only.
it("the real engine cannot rewrite an untargeted sentence during a source-support correction", async () => {
  const deps = dependencies(), baseWriter = deps.writer.generateJson;
  const stable = "The Quran connects care with daily responsibility.";
  const defective = "A distinct explanation currently lacks its necessary condition.";
  const repaired = "The distinct explanation now retains its necessary condition.";
  let corrected = false, correctionCalls = 0, replacementChecked = false;
  deps.writer.generateJson = async request => {
    const p = JSON.parse(request.prompt);
    if (p.correction) {
      correctionCalls++;
      expect(p.correction.checker_findings.sentence_patches).toContainEqual(expect.objectContaining({ group: "quran", replace_indices: [1], preserve_other_sentences: true }));
      expect(request.schema.type).toBe("object");
      if (request.schema.type === "object") expect(request.schema.properties.quran).toMatchObject({ type: "object", required: ["P1"] });
      corrected = true;
      return { status: "answer", no_answer_feedback: [], quran: { P1: { text: repaired } } };
    }
    const raw = await baseWriter(request) as any;
    if (p.sections_to_write.includes("quran")) raw.quran.push({ text: defective, source_ids: ["Q2:183"], requirement_id: "R1" });
    return raw;
  };
  deps.verifier.generateJson = async request => {
    const p = JSON.parse(request.prompt), raw = strictAudit(request.prompt);
    if (!corrected) {
      const row = raw.claim_assessments.find((r: any) => p.claims.find((c: any) => c.claim_id === r.claim_id)?.claim === defective);
      if (row) { row.direct_support = "no"; row.reason_codes = ["unsupported_meaning"]; row.explanation = "A necessary condition is missing."; }
    }
    if (p.claims.some((c: any) => c.claim === repaired)) {
      replacementChecked = true;
      expect(p.claims.some((c: any) => c.claim === stable)).toBe(true);
    }
    return raw;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(correctionCalls).toBe(1); expect(replacementChecked).toBe(true);
  if (result.status === "rich_answer") expect(result.answer.sections.find(s => s.group === "quran")?.claims.map(c => c.text)).toEqual([stable, repaired]);
});
