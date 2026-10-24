import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";
import { validRichAnswer } from "@/lib/ask/rich-answer";
import { structuredOutputContract } from "@/lib/ai/structured-output";
import { stripAnswer } from "@/lib/chat/answer-store";
import { hydrateAnswer } from "@/lib/chat/hydrate";

function setup() {
  const deps = dependencies(), writer = deps.writer.generateJson;
  deps.selectedSummary = true;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage === "selected_checked_summary_v1") return { selected_ids: input.checked_explanations.slice(0, 2).map((c: any) => c.explanation_id) };
    expect(input.sections_to_write).not.toContain("summary");
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    const result = strictAudit(req.prompt);
    expect(structuredOutputContract(req.schema).parse(JSON.stringify(result))).not.toBeNull();
    return result;
  };
  return deps;
}

it("selects exact checked source claims, omits the optional footer and still performs the full final audit", async () => {
  const deps = setup(), review = deps.verifier.generateJson; let finalCalls = 0;
  deps.verifier.generateJson = async req => {
    if (JSON.parse(req.prompt).full_answer) {
      finalCalls++;
      const p = JSON.parse(req.prompt);
      expect(p).not.toHaveProperty("next_step");
      expect(p.claim_evidence.every((c: any) => c.cited_originals.length)).toBe(true);
      expect(p.summary_claim_ids).toHaveLength(2);
    }
    return review(req);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(finalCalls).toBe(1);
  if (result.status !== "rich_answer") return;
  expect(validRichAnswer(result.answer)).toBe(true); expect(result.answer).not.toHaveProperty("guide");
  const sourceClaims = result.answer.sections.filter(s => s.group !== "summary").flatMap(s => s.claims);
  expect(result.answer.sections.at(-1)!.claims).toEqual(sourceClaims.slice(0, 2));
  expect(validRichAnswer({ ...result.answer, guide: null })).toBe(false);
  expect(validRichAnswer({ ...result.answer, guide: { kind: "sourced_instruction", refs: [], text: "Invented advice" } })).toBe(false);
  const saved = JSON.parse(JSON.stringify(stripAnswer(result.answer)));
  const hydrated = await hydrateAnswer(saved, {
    getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined,
    getHadith: async () => pack.passages[1].source.kind === "hadith" ? pack.passages[1].source.hadith : null,
  });
  expect(hydrated.ok).toBe(true);
  if (hydrated.ok) expect(hydrated.answer).not.toHaveProperty("guide");
});

it("cannot complete on selected IDs when final coverage fails, and spends at most the shared single correction", async () => {
  const deps = setup(), writer = deps.writer.generateJson; let choices = 0;
  deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).stage === "selected_checked_summary_v1") choices++; return writer(req); };
  deps.verifier.generateJson = async req => {
    const raw = strictAudit(req.prompt);
    if (JSON.parse(req.prompt).full_answer) { raw.requirement_coverage.R1.fully_answered = "no"; raw.complete_coverage = "no"; }
    return raw;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result).toMatchObject({ status: "incomplete", withdraw: false }); expect(choices).toBe(2);
  if (result.status === "incomplete") expect(result.sections?.some(s => s.group === "summary")).toBe(false);
});

it("rejects a generated-text response whole instead of falling back to prose synthesis", async () => {
  const deps = setup(), writer = deps.writer.generateJson; let choices = 0;
  deps.writer.generateJson = async req => {
    if (JSON.parse(req.prompt).stage === "selected_checked_summary_v1") { choices++; return { selected_ids: ["E1"], text: "Unsupported added claim" }; }
    return writer(req);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete"); expect(choices).toBe(2);
});

it("withdraws when original context changes while a source selection is pending", async () => {
  const local = structuredClone(pack), deps = setup(), writer = deps.writer.generateJson;
  deps.writer.generateJson = async req => {
    if (JSON.parse(req.prompt).stage === "selected_checked_summary_v1") {
      if (local.passages[0].source.kind !== "quran") throw Error("fixture");
      local.passages[0].context.push({ ...local.passages[0].source.verse, key: "2:184", url: "https://quran.com/2/184" });
    }
    return writer(req);
  };
  expect(await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
});

it("still withdraws an earlier claim rejected by the independent final meaning check", async () => {
  const deps = setup(), review = deps.verifier.generateJson;
  deps.meaningReview = true;
  let finalMeaningSeen = false;
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.stage === "narrow_meaning_review_v1") {
      const final = p.claims.length > 3; finalMeaningSeen ||= final;
      return { claims: Object.fromEntries(p.claims.map((c: any, i: number) => [c.claim_id, { finding: { category: "source_support", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic.slice(0, 900) }, verdict: final && i === 0 ? "no" : "yes", explanation: final && i === 0 ? "A material original restriction was missed." : "" }])) };
    }
    return review(req);
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
  expect(finalMeaningSeen).toBe(true);
});

it("never offers rejected source claims to the summary selector", async () => {
  const deps = setup(), writer = deps.writer.generateJson; let selected = false;
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.stage === "selected_checked_summary_v1") {
      selected = true;
      expect(p.checked_explanations.every((c: any) => !c.source_ids.includes("HE9001"))).toBe(true);
    }
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt), r = strictAudit(req.prompt);
    for (const claim of p.claims.filter((c: any) => c.source_ids.includes("HE9001"))) {
      const finding = r.claim_assessments.find((c: any) => c.claim_id === claim.claim_id);
      finding.direct_support = "no"; finding.reason_codes = ["unsupported_meaning"]; finding.explanation = "Invented unsupported wording.";
    }
    return r;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(selected).toBe(true);
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(result.answer.sections.at(-1)!.claims.every(c => !c.refs.includes("HE9001"))).toBe(true);
});

it("retains four distinct concerns instead of imposing a two-point summary limit", async () => {
  const local = structuredClone(pack), deps = setup(), writer = deps.writer.generateJson;
  local.question.requirements = Array.from({ length: 4 }, (_, i) => ({ id: `R${i + 1}`, text: `Explain invented concern ${i + 1}`, facet: "general" }));
  local.passages[0].requirementIds = ["R1", "R4"]; local.passages[1].requirementIds = ["R2"]; local.passages[2].requirementIds = ["R3"];
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.stage === "selected_checked_summary_v1") return { selected_ids: p.checked_explanations.map((c: any) => c.explanation_id) };
    const r = structuredClone(await writer(req)) as any;
    if (r.quran) { r.quran[0].requirement_id = "R1"; r.quran.push({ text: "The Quran describes a separate invented fourth concern.", source_ids: [local.passages[0].id], requirement_id: "R4" }); }
    if (r.hadith) r.hadith[0].requirement_id = "R2";
    if (r.scholar) r.scholar[0].requirement_id = "R3";
    return r;
  };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain all four concerns", {});
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(new Set(result.answer.sections.at(-1)!.claims.map(c => c.requirementId))).toEqual(new Set(["R1", "R2", "R3", "R4"]));
});

it("keeps final coverage checks when combined with the staged focused-checking path", async () => {
  const deps = setup(); deps.focusedChecks = true; let finalQuality = false;
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.stage === "source_support_v1") return { claims: p.claims.map((c: any) => ({ claim_id: c.claim_id, source_ids: c.source_ids, verdict: "supported", reason_codes: [], explanation: "",
      grounds: c.supporting_excerpts.map((s: any) => ({ source_id: s.source_id, original_hash: s.original_hash, quote: s.original })) })) };
    if (p.stage !== "answer_quality_v1") throw Error("unexpected test request");
    const r: any = { claims: p.claims.map((c: any) => ({ claim_id: c.claim_id, value: "useful", duplicate_of: [], explanation: "Distinct invented contribution" })),
      coverage: p.full_answer ? p.requirements.map((requirement: any) => ({ requirement_id: requirement.id,
        claim_ids: p.claims.filter((c: any) => c.requirement_id === requirement.id && c.presentation_role === "source_explanation").map((c: any) => c.claim_id), fully_answered: "yes", conditions_preserved: "yes" })) : [],
      consistent: "yes", complete: "yes", summary_direct: "yes", scope_appropriate: "yes", earlier_section_safe: "yes" };
    if (p.full_answer) { finalQuality = true; expect(p).not.toHaveProperty("guidance"); }
    else { r.guidance_safe = "yes"; r.guidance_relevant = "yes"; }
    return r;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(finalQuality).toBe(true);
});
