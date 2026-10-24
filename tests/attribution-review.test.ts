import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseAttributionReview } from "@/lib/ask/attribution-review";
import { richReviewRequest } from "@/lib/ask/rich-review-request";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";
import { archivedReviewSchemaMatches } from "../scripts/archived-ask-review-schema";
import type { JsonSchema } from "@/lib/ai/types";

const items = [
  { text: "Invented first explanation.", refs: ["Q1"], requirementId: "R1" },
  { text: "Invented second explanation.", refs: ["Q1"], requirementId: "R1" },
];
const rows = [{ claim_id: "C1", verdict: "yes" }, { claim_id: "C2", verdict: "unsure" }];

describe("exact checker attribution identities", () => {
  it("accepts complete keyed or legacy findings without turning uncertainty into approval", () => {
    expect(parseAttributionReview(rows, items)).toEqual(rows);
    expect(parseAttributionReview(Object.fromEntries(rows.map(r => [r.claim_id, r])), items)).toEqual(rows);
    expect(parseAttributionReview([{ ...rows[1], verdict: "no" }, rows[0]], items)).toEqual([{ ...rows[1], verdict: "no" }, rows[0]]);
  });
  it.each([
    undefined, null, "yes", [], [rows[1]], [rows[0], rows[0]], [rows[0], { claim_id: "C99", verdict: "yes" }],
    [rows[0], { ...rows[1], verdict: "approved" }], [rows[0], { claim_id: "C2" }],
    { C1: rows[0] }, { C1: rows[1], C2: rows[0] }, { C1: rows[0], C2: rows[1], C3: { claim_id: "C3", verdict: "yes" } },
  ])("rejects incomplete, duplicate, unknown or malformed finding sets (%j)", value => {
    expect(parseAttributionReview(value, items)).toBeNull();
  });
  it.each(["ar", "en", "de"] as const)("requires every claim key in actual structured source and final requests (%s)", language => {
    for (const full of [false, true]) {
      const request = richReviewRequest({ items, language, full, sourceStage: !full, question: "Invented concern", serialized: {
        question: { requirements: [{ id: "R1" }] }, passages: [{ id: "Q1", arabic: "نص افتراضي طويل للقراءة فقط", supported_requirement_ids: ["R1"] }],
      }, guidance: null, translationCandidates: [], summaryCount: full ? 1 : 0, earlierCount: 1 });
      if (request.schema.type !== "object") throw Error("schema");
      const schema = request.schema.properties.attribution_checks;
      expect(schema.type).toBe("object");
      if (schema.type !== "object") throw Error("schema");
      expect(schema.required).toEqual(["C1", "C2"]);
      const contract = structuredOutputContract(schema);
      const valid = Object.fromEntries(rows.map(r => [r.claim_id, r]));
      expect(contract.parse(JSON.stringify(valid))).toEqual(valid);
      expect(contract.parse(JSON.stringify({ C2: rows[1] }))).toBeNull();
      expect(contract.parse(JSON.stringify(rows))).toBeNull();
      expect(contract.parse(JSON.stringify({ C1: rows[1], C2: rows[0] }))).toBeNull();
      expect(contract.parse(JSON.stringify({ ...valid, C3: { claim_id: "C3", verdict: "yes" } }))).toBeNull();
      expect(request.structuredOutput).toBe(true);
      expect(request.maxOutputTokens).toBe(9000);
      expect(JSON.parse(request.prompt).earlier_claim_ids).toEqual(["C1"]);
    }
  });
  it("allows historical replays only the declared attribution upgrade, never another contract relaxation", () => {
    const decision: JsonSchema = { type: "string", enum: ["yes", "no", "unsure"] };
    const archived: JsonSchema = { type: "object", properties: {
      attribution_checks: { type: "array", items: { type: "object", properties: { claim_id: { type: "string" }, verdict: decision }, required: ["claim_id", "verdict"] } },
      all_claims_consistent: decision,
    }, required: ["attribution_checks", "all_claims_consistent"] };
    const current = structuredClone(archived);
    current.properties.attribution_checks = { type: "object", properties: { C1: { type: "object", properties: {
      claim_id: { type: "string", enum: ["C1"] }, verdict: decision,
    }, required: ["claim_id", "verdict"] } }, required: ["C1"] };
    expect(archivedReviewSchemaMatches(current, archived, ["C1"])).toBe(true);
    const altered = structuredClone(current); altered.properties.all_claims_consistent = { type: "string" };
    expect(archivedReviewSchemaMatches(altered, archived, ["C1"])).toBe(false);
    expect(archivedReviewSchemaMatches(current, archived, ["C1", "C2"])).toBe(false);
    expect(archived.properties.attribution_checks.type).toBe("array");
  });
});

describe("incomplete checker attribution is not a religious negative finding", () => {
  it.each(["missing_earlier", "duplicate", "unknown", "bad_verdict", "key_mismatch", "missing_field"])("preserves earlier checked sources, approves no siblings and spends no writer correction (%s)", async mode => {
    const deps = dependencies(), write = deps.writer.generateJson;
    let corrections = 0, summaries = 0, withdrawals = 0, badResponses = 0;
    deps.rich = { onWithdraw: () => withdrawals++ };
    deps.writer.generateJson = async req => {
      const p = JSON.parse(req.prompt);
      if (p.correction) corrections++;
      if (p.sections_to_write.includes("summary")) summaries++;
      return write(req);
    };
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt), r = strictAudit(req.prompt);
      if (p.review_stage === "source_explanations") {
        expect(p.earlier_claim_ids).toEqual(["C1"]); badResponses++;
        if (mode === "missing_earlier") delete r.attribution_checks.C1;
        if (mode === "duplicate") r.attribution_checks = [r.attribution_checks.C1, r.attribution_checks.C1, r.attribution_checks.C3];
        if (mode === "unknown") { r.attribution_checks.C99 = { claim_id: "C99", verdict: "yes" }; delete r.attribution_checks.C1; }
        if (mode === "bad_verdict") r.attribution_checks.C1.verdict = "approved";
        if (mode === "key_mismatch") r.attribution_checks.C1.claim_id = "C2";
        if (mode === "missing_field") delete r.attribution_checks;
      }
      return r;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status !== "incomplete") throw Error("expected incomplete");
    expect(result.sections?.filter(s => s.claims.length).map(s => s.group)).toEqual(["quran"]);
    expect(corrections).toBe(0); expect(summaries).toBe(0); expect(withdrawals).toBe(0); expect(badResponses).toBe(1);
  });
  it("withholds the final conclusion and retains all checked source sections on a final contract failure", async () => {
    const deps = dependencies(), write = deps.writer.generateJson; let corrections = 0;
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).correction) corrections++; return write(req); };
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt), r = strictAudit(req.prompt);
      if (p.full_answer) delete r.attribution_checks.C1;
      return r;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status !== "incomplete") throw Error("expected incomplete");
    expect(result.sections?.filter(s => s.claims.length).map(s => s.group)).toEqual(["quran", "hadith", "scholar"]);
    expect(corrections).toBe(0);
  });
  it.each(["no", "unsure"])("still withdraws an earlier section for a complete negative condition finding (%s)", async verdict => {
    const deps = dependencies(); let withdrawals = 0;
    deps.rich = { onWithdraw: () => withdrawals++ };
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt), r = strictAudit(req.prompt);
      if (p.review_stage === "source_explanations") {
        r.attribution_checks.C1.verdict = verdict;
        Object.assign(r.claim_assessments[0], { conditions_preserved: verdict, reason_codes: ["condition_lost"], explanation: "An explicit condition is absent." });
        r.earlier_section_safe = verdict;
      }
      return r;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result).toMatchObject({ status: "incomplete", withdraw: true, sections: [] });
    expect(withdrawals).toBe(1);
  });
  it("still permits complete independently checked answers with exact keyed attribution findings", async () => {
    const deps = dependencies();
    deps.verifier.generateJson = async req => strictAudit(req.prompt);
    expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
  });
});
