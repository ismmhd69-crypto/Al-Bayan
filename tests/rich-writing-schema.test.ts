import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { richWritingClaimsSchema } from "@/lib/ask/rich-writing-schema";
import { structuredOutputContract, providerShapeSchema } from "@/lib/ai/structured-output";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, drafts, audit } from "./fixtures/rich";

it("rejects the entire recorded unavailable-verse pattern, without salvaging valid siblings", () => {
  const schema = { type: "object" as const, properties: { quran: richWritingClaimsSchema(["Q51:56", "Q14:8", "Q41:46"], ["R1", "R2"]) }, required: ["quran"] };
  const c = (source: string) => ({ text: "شرح اختباري مستقل لا يعد دليلا دينيا", source_ids: [source], requirement_id: "R1" });
  const contract = structuredOutputContract(schema);
  expect(contract.parse(JSON.stringify({ quran: [c("Q51:56"), c("Q51:57")] }))).toBeNull();
  expect(contract.parse(JSON.stringify({ quran: [c("Q51:56")] }))).not.toBeNull();
  expect(contract.parse(JSON.stringify({ quran: [c("HE9001")] }))).toBeNull();
  expect(contract.parse(JSON.stringify({ quran: [{ ...c("Q51:56"), requirement_id: "R9" }] }))).toBeNull();
  expect(JSON.stringify(providerShapeSchema(contract.schema))).toContain('"enum":["Q51:56","Q14:8","Q41:46"]');
});

it("repairs a source within one correction and writes synthesis from the corrected citation", async () => {
  const local = structuredClone(pack), extra = structuredClone(local.passages[0]); extra.id = "Q2:184"; if (extra.source.kind === "quran") { extra.source.verse.key = "2:184"; extra.source.verse.url = "https://quran.com/2/184"; } local.passages.push(extra);
  const deps = dependencies(), write = deps.writer.generateJson; let corrections = 0, initial = true;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await write(req)) as any;
    if (!input.correction && input.sections_to_write.includes("summary")) {
      expect(input.source_explanations_already_drafted.quran[0].source_ids).toEqual(["Q2:184"]);
      result.summary = [{ ...drafts.summary[0], source_ids: ["Q2:184", "HE9001"] }];
    }
    if (input.correction) {
      corrections++;
      expect(input.sections_to_write).toEqual(["quran"]);
      result.quran = [{ ...drafts.quran[0], source_ids: ["Q2:184"] }];
    }
    return result;
  };
  deps.verifier.generateJson = async req => {
    const r = audit(req.prompt);
    if (initial && !JSON.parse(req.prompt).full_answer) { initial = false; r.useful_explanation = "no"; }
    return r;
  };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(corrections).toBe(1); expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") {
    expect(result.answer.sections[0].claims[0].refs).toEqual(["Q2:184"]);
    expect(result.answer.sections.at(-1)?.claims[0].refs).toEqual(["Q2:184", "HE9001"]);
  }
});

it("restricts a summary-only correction to actual drafts, preserving later source references", async () => {
  const local = structuredClone(pack), extra = structuredClone(local.passages[0]); extra.id = "Q2:184"; if (extra.source.kind === "quran") { extra.source.verse.key = "2:184"; extra.source.verse.url = "https://quran.com/2/184"; } local.passages.push(extra);
  const deps = dependencies(), write = deps.writer.generateJson; let corrections = 0;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await write(req)) as any;
    if (input.sections_to_write.includes("summary") && !input.correction) result.summary = [];
    if (input.correction) {
      corrections++;
      expect(input.sections_to_write).toEqual(["summary"]);
      expect(input.citable_source_ids_by_section.summary).toEqual(["Q2:183", "HE9001", local.passages[2].id]);
      expect(input.citable_source_ids_by_section.summary).not.toContain("Q2:184");
    }
    return result;
  };
  expect((await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
  expect(corrections).toBe(1);
});

it("still rejects unsupported meaning when a writer uses an allowed identity", async () => {
  const deps = dependencies();
  deps.verifier.generateJson = async req => {
    const r = audit(req.prompt);
    r.claim_assessments.forEach((row: { direct_support: string; reason_codes: string[]; explanation: string }) => { row.direct_support = "no"; row.reason_codes = ["unsupported_meaning"]; row.explanation = "The allowed citation does not support this invented claim."; });
    return r;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete");
  if (result.status === "incomplete") expect(result.sections?.some(s => s.outcome === "ready")).toBe(false);
});

it("repairs an unexplained summary citation before final checking within the existing correction", async () => {
  const local = structuredClone(pack), extra = structuredClone(local.passages[1]); extra.id = "HE9002";
  local.passages.push(extra);
  const deps = dependencies(), writer = deps.writer.generateJson; let corrections = 0;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.correction && input.sections_to_write.includes("summary")) result.summary[0].source_ids = ["Q2:183", "HE9002"];
    if (input.correction) {
      corrections++;
      expect(input.sections_to_write).toEqual(["summary"]);
      expect(input.correction.reason_codes).toContain("summary_without_explanation");
      expect(input.citable_source_ids_by_section.summary).not.toContain("HE9002");
    }
    return result;
  };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(corrections).toBe(1);
});

it("writes synthesis after a sibling copy correction instead of freezing an earlier summary", async () => {
  const local = structuredClone(pack), deps = dependencies(), writer = deps.writer.generateJson;
  if (local.passages[1].source.kind !== "hadith") throw Error("fixture");
  local.passages[1].source.hadith.translations.en = "A patient person can face difficult circumstances with steady care.";
  const revised = "Care connects daily conduct with responsibility toward others.";
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (input.sections_to_write.includes("summary")) {
      expect(input.source_explanations_status).toBe("checked");
      result.summary[0].text = revised;
      return result;
    }
    if (!input.sections_to_write.includes("hadith")) return result;
    if (!input.correction) {
      result.hadith[0].text = "The Prophet taught that a patient person can face difficult circumstances.";
      return result;
    }
    expect(input.sections_to_write).toEqual(["hadith"]);
    expect(input.correction.checker_findings.sentence_patches.every((p: { group: string }) => p.group !== "summary")).toBe(true);
    return result;
  };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(result.answer.sections.at(-1)?.claims[0].text).toBe(revised);
});
