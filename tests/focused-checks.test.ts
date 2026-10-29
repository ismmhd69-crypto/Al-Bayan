import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { sourceSupportRequest, parseSourceSupport, parseAnswerQuality, parseDisplayAlignment } from "@/lib/ask/focused-checks";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { pack, drafts, dependencies } from "./fixtures/rich";
import type { Claim } from "@/lib/ask/checks";
import type { JsonRequest } from "@/lib/ai/types";

const claims: Claim[] = drafts.quran.map(c => ({ text: c.text, refs: c.source_ids, requirementId: c.requirement_id }));
function supportReply(req: JsonRequest) {
  const p = JSON.parse(req.prompt);
  return { claims: p.claims.map((c: { claim_id: string; source_ids: string[]; supporting_excerpts: { source_id: string; original_hash: string; original: string }[] }) => ({
    claim_id: c.claim_id, source_ids: c.source_ids, verdict: "supported", reason_codes: [], explanation: "",
    grounds: c.supporting_excerpts.map(s => ({ source_id: s.source_id, original_hash: s.original_hash, quote: s.original })),
  })) };
}
function qualityReply(req: JsonRequest) {
  const p = JSON.parse(req.prompt);
  return { claims: p.claims.map((c: { claim_id: string }) => ({ claim_id: c.claim_id, value: "useful", duplicate_of: [], explanation: "Distinct invented test explanation" })),
    coverage: p.full_answer ? p.requirements.map((r: { id: string }) => ({ requirement_id: r.id,
      claim_ids: p.claims.filter((c: { requirement_id: string; presentation_role: string }) => c.requirement_id === r.id && c.presentation_role !== "final_summary").map((c: { claim_id: string }) => c.claim_id), fully_answered: "yes", conditions_preserved: "yes" })) : [],
    consistent: "yes", complete: "yes", summary_direct: "yes", guidance_safe: "yes", guidance_relevant: "yes", scope_appropriate: "yes", earlier_section_safe: "yes" };
}
describe("focused support receipts and independent quality, invented evidence only", () => {
  it("keeps supporting originals separate from restrictive context and omits taxonomy/translation checks", () => {
    const local = structuredClone(pack);
    const v = local.passages[0];
    if (v.source.kind === "quran") v.context = [{ ...v.source.verse, key: "2:184", arabic: "سياق مختلف لا يثبت الدعوى" }];
    const req = sourceSupportRequest(claims, local, "en"), p = JSON.parse(req.prompt);
    expect(p.claims[0].supporting_excerpts).toHaveLength(1);
    expect(p.claims[0].restrictive_context).toMatchObject({ cannot_supply_support: true });
    expect(req.schema).not.toHaveProperty("properties.contribution_map");
    expect(req.schema).not.toHaveProperty("properties.translation_checks");
    expect(parseSourceSupport(supportReply(req), claims, local).supported).toBe(true);
    const leaked = supportReply(req); leaked.claims[0].grounds[0].quote = "سياق مختلف لا يثبت الدعوى";
    expect(parseSourceSupport(leaked, claims, local).valid).toBe(false);
  });
  it("rejects changed originals, invented citations and duplicate receipts", () => {
    const req = sourceSupportRequest(claims, pack, "en");
    const stale = supportReply(req); stale.claims[0].grounds[0].original_hash = "a".repeat(64);
    expect(parseSourceSupport(stale, claims, pack).supported).toBe(false);
    const foreign = supportReply(req); foreign.claims[0].source_ids = ["Q2:184"];
    expect(parseSourceSupport(foreign, claims, pack).supported).toBe(false);
    const duplicate = supportReply(req); duplicate.claims.push(duplicate.claims[0]);
    expect(parseSourceSupport(duplicate, claims, pack).valid).toBe(false);
  });
  it("preserves uncertainty rather than approving a plausible claim", () => {
    const raw = { claims: [{ claim_id: "C1", source_ids: claims[0].refs, verdict: "uncertain", grounds: [], reason_codes: ["uncertain"], explanation: "This excerpt does not settle the added claim." }] };
    expect(parseSourceSupport(raw, claims, pack)).toMatchObject({ valid: true, supported: false, safeIds: [] });
  });
  it("does not accept quality findings with invented claim IDs or missing flags", () => {
    expect(parseAnswerQuality({ claims: [{ claim_id: "C9", value: "useful", duplicate_of: [], explanation: "test" }], coverage: [] }, claims, false)).toBeNull();
  });
  it("rejects enum-shaped arrays instead of coercing malformed responses into decisions", () => {
    const support = supportReply(sourceSupportRequest(claims, pack, "en"));
    expect(parseSourceSupport({ claims: support.claims.map((c: Record<string, unknown>) => ({ ...c, verdict: ["supported"] })) }, claims, pack).valid).toBe(false);
    const quality = qualityReply({ prompt: JSON.stringify({ claims: [{ claim_id: "C1" }] }) } as JsonRequest);
    expect(parseAnswerQuality({ ...quality, consistent: ["yes"] }, claims, false)).toBeNull();
    expect(parseAnswerQuality({ ...quality, claims: quality.claims.map((c: Record<string, unknown>) => ({ ...c, value: ["useful"] })) }, claims, false)).toBeNull();
  });
  it("requires an exact complete translation-check batch rather than approving a valid-looking subset", () => {
    const candidates = [{ source_id: "Sfirst", original_hash: "a".repeat(64) }, { source_id: "Ssecond", original_hash: "b".repeat(64) }];
    const rows = candidates.map(c => ({ ...c, faithful: "yes", complete: "yes", conditions_preserved: "yes" }));
    expect(parseDisplayAlignment({ translations: rows }, candidates)).toMatchObject({ valid: true, acceptedIds: ["Sfirst", "Ssecond"] });
    expect(parseDisplayAlignment({ translations: rows.slice(0, 1) }, candidates)).toMatchObject({ valid: true, missing: true, acceptedIds: ["Sfirst"], missingIds: ["Ssecond"] });
    for (const translations of [[], [...rows, { ...rows[0], source_id: "Sunknown" }], [rows[0], rows[0]], [rows[0], { ...rows[1], original_hash: "c".repeat(64) }], [rows[0], { ...rows[1], faithful: ["yes"] }]]) {
      expect(parseDisplayAlignment({ translations }, candidates)).toMatchObject({ valid: false, acceptedIds: [] });
    }
    expect(parseDisplayAlignment({ translations: [rows[0], { ...rows[1], faithful: "no" }] }, candidates)).toMatchObject({ valid: true, acceptedIds: ["Sfirst"], rejectedIds: ["Ssecond"] });
  });
  it("uses focused support before quality in the actual rich writer/checker flow", async () => {
    const deps = dependencies(); deps.focusedChecks = true;
    const stages: string[] = [];
    deps.verifier.generateJson = async req => {
      const stage = JSON.parse(req.prompt).stage; stages.push(stage);
      return stage === "source_support_v1" ? supportReply(req) : qualityReply(req);
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    expect(stages).toEqual(["source_support_v1", "answer_quality_v1", "source_support_v1", "answer_quality_v1", "source_support_v1", "answer_quality_v1"]);
  });
  it("retains supported useful sources without a summary after its correction fails", async () => {
    const deps = dependencies(), write = deps.writer.generateJson; deps.focusedChecks = true;
    deps.writer.generateJson = async req => {
      const value = await write(req) as Record<string, unknown>;
      if (JSON.parse(req.prompt).sections_to_write.includes("summary")) value.summary = [];
      return value;
    };
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt);
      if (p.stage === "source_support_v1") return supportReply(req);
      const value = qualityReply(req);
      if (p.full_answer) { value.complete = "no"; value.summary_direct = "no"; }
      return value;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Invented care question", {});
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status === "incomplete") expect(result.sections?.map(s => [s.group, s.outcome])).toEqual([["quran", "ready"], ["hadith", "ready"], ["scholar", "ready"]]);
  });
  it("never lets positive quality override unsupported meaning or an uncertain earlier claim", async () => {
    const deps = dependencies(); deps.focusedChecks = true;
    const rejected = new Set<string>();
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt);
      if (p.stage !== "source_support_v1") {
        expect(p.full_answer).toBe(false);
        expect(p.claims.every((c: { text: string }) => !rejected.has(c.text))).toBe(true);
        return qualityReply(req);
      }
      const result = supportReply(req);
      rejected.add(p.claims[0].claim);
      Object.assign(result.claims[0], { verdict: "unsupported", grounds: [], reason_codes: ["scope_broadened"], explanation: "The original is a limited case." });
      return result;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") expect(result.sections?.flatMap(s => s.claims).every(c => !rejected.has(c.text))).toBe(true);
  });
  it("keeps a redundant source explanation withheld despite otherwise positive quality", async () => {
    const deps = dependencies(); deps.focusedChecks = true;
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt);
      if (p.stage === "source_support_v1") return supportReply(req);
      const raw = qualityReply(req);
      if (p.full_answer) { raw.claims[2].value = "repetitive"; raw.claims[2].duplicate_of = ["C1"]; }
      return raw;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("incomplete");
    expect(result).toMatchObject({ status: "incomplete", withdraw: true, sections: [] });
  });
  it("retains independently supported and useful source groups after another group's support fails", async () => {
    const deps = dependencies(); deps.focusedChecks = true;
    deps.verifier.generateJson = async req => {
      const p = JSON.parse(req.prompt);
      if (p.stage === "source_support_v1") {
        const raw = supportReply(req);
        for (let i = 0; i < p.claims.length; i++) if (p.claims[i].source_ids.some((id: string) => id.startsWith("S"))) {
          Object.assign(raw.claims[i], { verdict: "unsupported", grounds: [], reason_codes: ["condition_lost"], explanation: "The scholar explanation lost its necessary condition." });
        }
        return raw;
      }
      expect(p.full_answer).toBe(false);
      expect(p.claims.every((c: { source_ids: string[] }) => c.source_ids.every(id => !id.startsWith("S")))).toBe(true);
      return qualityReply(req);
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") {
      expect(result.withdraw).toBe(false);
      expect(result.sections?.filter(s => s.outcome === "ready").map(s => s.group)).toEqual(["quran", "hadith"]);
      expect(result.sections?.some(s => s.group === "summary")).toBe(false);
    }
  });
});
