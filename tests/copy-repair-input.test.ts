import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readFileSync } from "node:fs";
import { privateFile, privateTrace } from "./helpers/private-fixtures";
import { isolateCopyRepair } from "../lib/ask/copy-repair-input";
import type { JsonRequest } from "../lib/ai/types";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";
import { sourceSupportTextPatch, applyTextOnlyPatch } from "../lib/ask/text-only-patch";
const make = (): JsonRequest => ({ system: "All existing safety rules", maxOutputTokens: 2200, thinking: "low", schema: { type: "object", properties: {
  hadith: { type: "object", properties: { P0: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } }, required: ["P0"] },
}, required: ["hadith"] }, prompt: JSON.stringify({ sections_to_write: ["hadith"], citable_source_ids_by_section: { hadith: ["H1", "H2"] },
  source_explanations_already_drafted: { quran: [{ text: "An unchecked sibling" }] }, source_explanations_status: "provisional",
  evidence_package: { question: { requirements: ["both concerns retained"] }, passages: [
    { id: "H1", type: "hadith", arabic: "Full own original", surrounding_context: [{ arabic: "Restriction retained" }], contribution: { conditions: ["Own condition"] } },
    { id: "H2", type: "hadith", arabic: "Unrelated selected original" }, { id: "Q1", type: "quran", arabic: "Unrelated sibling original" },
  ] }, correction: { reason_codes: ["failed_section_draft", "copied_source"], rejected_draft: [{ quran: [{ text: "Unrelated rejected wording" }] }], instructions: "Original correction rules",
    checker_findings: { claims: [{ claim: "Unrelated draft" }], support_failures: [], contribution_failures: [], citation_failures: [], source_merge_plan: [], reference_failures: [],
      format_failures: [{ group: "hadith", reason: "copied_source" }], sentence_patches: [{ group: "hadith", replace_indices: [0], findings: [{ index: 0, rejected_text: "Rejected own wording", source_ids: ["H1"], cited_originals: [{ id: "H1", arabic: "Full own original" }] }] }] } },
}) });
it("isolates locked copy edits without changing original/context/schema/model allowance", () => {
  const request = make(), before = JSON.parse(request.prompt), result = isolateCopyRepair(request), p = JSON.parse(result.prompt);
  expect(p.evidence_package.passages).toEqual([before.evidence_package.passages[0]]);
  expect(p.evidence_package.question).toEqual(before.evidence_package.question);
  expect(p.correction.checker_findings.sentence_patches).toEqual(before.correction.checker_findings.sentence_patches);
  expect(p.source_explanations_already_drafted).toBeUndefined();
  expect(p.correction.checker_findings.claims).toBeUndefined();
  expect(p.correction.rejected_draft[0].rejected_sentences[0].source_ids).toEqual(["H1"]);
  expect(result.schema).toBe(request.schema); expect(result.maxOutputTokens).toBe(request.maxOutputTokens); expect(result.thinking).toBe(request.thinking);
  expect(JSON.parse(request.prompt)).toEqual(before);
});
it.each(["support_failures", "contribution_failures", "citation_failures", "source_merge_plan", "reference_failures"])("retains full input when %s exists", key => {
  const request = make(), p = JSON.parse(request.prompt); p.correction.checker_findings[key].push({ claim_id: "C1" }); request.prompt = JSON.stringify(p);
  expect(isolateCopyRepair(request)).toBe(request);
});
it.each(["summary", "semantic_failure", "unlocked_layout"])("does not reduce %s requests", kind => {
  const request = make(), p = JSON.parse(request.prompt);
  if (kind === "summary") p.sections_to_write.push("summary");
  if (kind === "semantic_failure") p.correction.reason_codes.push("unsupported_meaning");
  if (kind === "unlocked_layout") request.schema = { type: "object", properties: { hadith: { type: "array", items: { type: "string" } } }, required: ["hadith"] };
  request.prompt = JSON.stringify(p); expect(isolateCopyRepair(request)).toBe(request);
});
it.each(["original", "source_id", "index"])("refuses inconsistent %s bindings", field => {
  const request = make(), p = JSON.parse(request.prompt), f = p.correction.checker_findings.sentence_patches[0].findings[0];
  if (field === "original") f.cited_originals[0].arabic = "Changed";
  if (field === "source_id") f.source_ids[0] = "Q1";
  if (field === "index") f.index = 1;
  request.prompt = JSON.stringify(p); expect(() => isolateCopyRepair(request)).toThrow();
});
const failedCorrection = privateTrace("d9e9b89d-1e12-44d2-bb08-2749ea930946");
it.skipIf(!failedCorrection.available)(`replays the actual failed correction with own original/restrictions intact${failedCorrection.note}`, () => {
  const events = readFileSync(failedCorrection.path, "utf8").trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const saved = events.find((e: any) => e.event === "model_request" && e.data.call_id === "A14").data;
  const request: JsonRequest = { prompt: JSON.stringify(saved.prompt), system: saved.system, schema: saved.schema, maxOutputTokens: saved.max_output_tokens };
  const result = isolateCopyRepair(request), p = JSON.parse(result.prompt);
  expect(p.evidence_package.passages.map((x: any) => x.id)).toEqual(["HE65007"]);
  expect(p.evidence_package.passages[0]).toEqual(saved.prompt.evidence_package.passages.find((x: any) => x.id === "HE65007"));
  expect(result.schema).toEqual(saved.schema);
});

it("owner-only transformation isolates the real engine's copy patch while later checks retain all originals", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson;
  let correction = 0, finalChecks = 0, checkedReplacement = false;
  deps.writer.generateJson = async originalRequest => {
    const request = isolateCopyRepair(originalRequest);
    const p = JSON.parse(request.prompt);
    if (p.correction?.checker_findings.sentence_patches?.length) {
      correction++;
      expect(p.evidence_package.passages.map((s: any) => s.id)).toEqual(["HE9001"]);
      expect(p.source_explanations_already_drafted).toBeUndefined();
      expect(request.maxOutputTokens).toBe(2200);
      return { status: "answer", hadith: { P0: { text: "The Prophet taught people to take care with their actions." } }, no_answer_feedback: [] };
    }
    const raw = await writer(request) as any;
    if (p.sections_to_write.includes("hadith")) raw.hadith[0].text = "The source describes Invented hadith wording solely for tests.";
    return raw;
  };
  deps.verifier.generateJson = async request => {
    const p = JSON.parse(request.prompt);
    if (p.claims.some((c: any) => c.claim === "The Prophet taught people to take care with their actions.")) checkedReplacement = true;
    if (p.full_answer) {
      finalChecks++;
      expect(p.claim_evidence.flatMap((x: any) => x.cited_originals.map((s: any) => s.id))).toContain("Q2:183");
    }
    return strictAudit(request.prompt);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(correction).toBe(1); expect(finalChecks).toBeGreaterThan(0); expect(checkedReplacement).toBe(true);
});

const parentsTrace = privateTrace("fadc13d1-9af2-402a-b490-4af97684233f");
it.skipIf(!parentsTrace.available)(`locks the parents trace's untargeted scholar sentence without pretending to fix flagged Quran overlap${parentsTrace.note}`, () => {
  const events = readFileSync(parentsTrace.path, "utf8").trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const request = events.find((e: any) => e.event === "model_request" && e.data.call_id === "A13").data.prompt;
  const feedback = request.correction.checker_findings;
  const claims = (id: string) => events.find((e: any) => e.event === "model_response" && e.data.call_id === id).data.value;
  const scholarly = claims("A8").scholar.map((c: any) => ({ text: c.text, refs: c.source_ids, requirementId: c.requirement_id }));
  const quran = claims("A7").quran.map((c: any) => ({ text: c.text, refs: c.source_ids, requirementId: c.requirement_id }));
  const patch = sourceSupportTextPatch(scholarly, feedback, scholarly[0].refs)!;
  expect(patch.indices).toEqual([0]);
  expect(applyTextOnlyPatch({ P0: { text: "An invented replacement for a mechanical test only." } }, patch)?.[1]).toEqual(claims("A8").scholar[1]);
  expect(sourceSupportTextPatch(quran, feedback, [...new Set<string>(quran.flatMap((c: any) => c.refs))])).toBeNull();
});
