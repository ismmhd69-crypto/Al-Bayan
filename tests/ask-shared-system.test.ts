// Invented passages and scripted model decisions. These prove shared software behaviour,
// not religious accuracy. No external source, database or paid-model calls.
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseEvidencePackage, type QuestionFrame } from "@/lib/ask/retrieval";
import { runRichAnswer, richCoverageChecked } from "@/lib/ask/rich-engine";
import { runPipeline, sealedPackageJson } from "@/lib/ask/core";
import { validRichAnswer, reduceRichEvent, emptyRichState, type DisplayTranslation, type RichEvent } from "@/lib/ask/rich-answer";
import { stripAnswer } from "@/lib/chat/answer-store";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { RichAnswerView } from "@/components/RichAnswerView";
import { getDictionary } from "@/lib/i18n";
import { richText } from "@/lib/ask/rich-text";
import { pack, drafts, dependencies, audit, scholarId } from "./fixtures/rich";

const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care responsibility"] } };
const assessment = (id: string, role = "direct", relevance = role === "direct" ? "direct" : "context") => ({
  source_id: id, relevance, supported_requirement_ids: role === "direct" ? ["R1"] : [], related_requirement_ids: ["R1"],
  distinct_contribution: "yes", context_safe: "yes", position: "", scope_matches_question: "yes",
  contribution: { role, scope: "general", conditions: [] as string[] },
});
const selection = (assessments: unknown[]) => ({ status: "ready", coverage: "complete", conflict_type: "none", assessments });
const coverage = (id: string) => [{ requirement_id: "R1", claim_ids: ["C1"], source_ids: [id], fully_answered: "yes", conditions_preserved: "yes" }];

describe("shared evidence roles", () => {
  it("retains useful Quran background while reserving direct coverage for the actual answer", () => {
    const selected = parseEvidencePackage(selection(pack.passages.map(p => assessment(p.id, p.source.kind === "quran" ? "background" : "direct"))), frame, pack.passages, { requireContributions: true });
    const q = selected?.passages.find(p => p.id === "Q2:183");
    expect(q).toMatchObject({ requirementIds: [], explanationRequirementIds: ["R1"], contribution: { role: "background" } });
    expect(richCoverageChecked(coverage("Q2:183"), [{ text: "Limited background.", refs: ["Q2:183"], requirementId: "R1" }], selected!)).toBe(false);
    expect(sealedPackageJson(selected!, "en").passages.find(p => p.id === "Q2:183")).toMatchObject({ explanation_requirement_ids: ["R1"], supported_requirement_ids: [] });
  });
  it("accepts direct evidence and a separately checked background contribution together", () => {
    const selected = parseEvidencePackage(selection(pack.passages.map(p => assessment(p.id, p.source.kind === "quran" ? "direct" : "background"))), frame, pack.passages, { requireContributions: true })!;
    const items = [
      { text: "A direct part of the answer.", refs: ["Q2:183"], requirementId: "R1" },
      { text: "A useful limited explanation.", refs: ["HE9001"], requirementId: "R1" },
    ];
    const combined = [{ requirement_id: "R1", claim_ids: ["C1", "C2"], source_ids: ["Q2:183", "HE9001"], fully_answered: "yes", conditions_preserved: "yes" }];
    expect(richCoverageChecked(combined, items, selected)).toBe(true);
    expect(richCoverageChecked([{ ...combined[0], fully_answered: "no" }], items, selected)).toBe(false);
    expect(richCoverageChecked([{ ...combined[0], conditions_preserved: "unsure" }], items, selected)).toBe(false);
    selected.passages.find(p => p.id === "HE9001")!.explanationRequirementIds = ["R2"];
    expect(richCoverageChecked(combined, items, selected)).toBe(false);
  });
  it("does not let a correct coverage map override a failed source scope check", async () => {
    const deps = dependencies();
    deps.verifier.generateJson = async req => {
      const result = audit(req.prompt);
      if (JSON.parse(req.prompt).full_answer) {
        result.claim_assessments.at(-1)!.scope_preserved = "no";
        result.claim_assessments.at(-1)!.reason_codes = ["scope_broadened"];
      }
      return result;
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 9000)).toMatchObject({ status: "incomplete" });
  });
  it.each(["mention_only", "unrelated"])("does not relabel %s as usable background", relevance => {
    const raw = selection(pack.passages.map(p => assessment(p.id, p.source.kind === "quran" ? "background" : "direct", p.source.kind === "quran" ? relevance : "direct")));
    expect(parseEvidencePackage(raw, frame, pack.passages, { requireContributions: true })?.passages.some(p => p.source.kind === "quran")).toBe(false);
  });
  it.each(["unsafe", "unlinked", "duplicated", "not_distinct"])("rejects %s explanatory material", scenario => {
    const q = assessment("Q2:183", "background");
    if (scenario === "unsafe") q.context_safe = "unsure";
    if (scenario === "unlinked") q.related_requirement_ids = [];
    if (scenario === "not_distinct") q.distinct_contribution = "no";
    const selected = parseEvidencePackage(selection([q, ...(scenario === "duplicated" ? [q] : []), ...pack.passages.slice(1).map(p => assessment(p.id))]), frame, pack.passages, { requireContributions: true });
    expect(selected?.passages.some(p => p.source.kind === "quran")).toBe(false);
  });
  it("allows complementary explicitly stated parts, but requires combined completeness", () => {
    const raw = selection(pack.passages.slice(1).map(p => assessment(p.id, "direct", "partial")));
    expect(parseEvidencePackage(raw, frame, pack.passages, { requireContributions: true })?.passages).toHaveLength(2);
    expect(parseEvidencePackage({ ...raw, status: "insufficient", coverage: "incomplete" }, frame, pack.passages, { requireContributions: true })).toBeNull();
  });
  it("preserves a limited example without letting it establish a universal instruction", () => {
    const example = assessment("Q2:183", "limited_example"); example.contribution.scope = "case_specific";
    example.contribution.conditions = ["Only the circumstances described in this invented example"];
    const selected = parseEvidencePackage(selection([example, ...pack.passages.slice(1).map(p => assessment(p.id))]), frame, pack.passages, { requireContributions: true });
    expect(selected?.passages.find(p => p.id === "Q2:183")).toMatchObject({ requirementIds: [], contribution: { scope: "case_specific" } });
  });
  it("writes and independently checks the background without counting it as the practical answer", async () => {
    const local = structuredClone(pack), deps = dependencies();
    local.passages[0].requirementIds = []; local.passages[0].explanationRequirementIds = ["R1"];
    local.passages[0].contribution = { role: "background", scope: "general", conditions: [] };
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[0].sources[0].role).toBe("background");
  });
});

describe("shared question contract and useful answers", () => {
  const understood = { checklist_status: "complete", language: "en", kind: "question", question_type: "general", subjects: ["care"],
    requested_points: [{ text: "Explain care", facet: "general", scope: "general" }], qualifiers: [],
    search_queries_en: ["care responsibility"], search_queries_de: [], search_queries_ar: ["عناية يومية"] };
  it.each(["I want to learn about caring for family.", "What does Islam teach about my responsibilities toward parents?"])("does not refuse education merely because a question mentions I or family: %s", async question => {
    const deps = dependencies(); deps.disableReferenceHints = true;
    const write = vi.fn(async () => understood); deps.writer.generateJson = write;
    const result = await runPipeline(question, "en", deps);
    expect(result.status).not.toBe("ask_scholar"); // Empty fake searches still refuse evidence honestly.
    expect(write.mock.calls.length).toBe(1);
  });
  it.each(["ambiguous", "too_complex"])("requests clarification for %s rather than silently dropping concerns", async checklist_status => {
    const deps = dependencies(); deps.writer.generateJson = async () => ({ ...understood, checklist_status });
    const search = vi.fn(async () => []); deps.search = search;
    expect(await runPipeline("Please answer all of these concerns", "en", deps)).toMatchObject({ status: "clarify" });
    expect(search).not.toHaveBeenCalled();
  });
  it("keeps the personal-ruling boundary when actual circumstances require a decision", async () => {
    const deps = dependencies(); deps.writer.generateJson = async () => ({ ...understood, kind: "personal" });
    expect(await runPipeline("Decide what I must do in my particular dispute", "en", deps)).toMatchObject({ status: "ask_scholar" });
  });
  it.each(["useful_explanation", "guidance_safe", "guidance_relevant", "question_checklist_complete", "personal_application_avoided"])("cannot complete an answer that fails %s", async field => {
    const deps = dependencies(); deps.verifier.generateJson = async req => ({ ...audit(req.prompt), ...(JSON.parse(req.prompt).full_answer ? { [field]: "no" } : {}) });
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 9000)).toMatchObject({ status: "incomplete" });
  });
  it("rejects a repeating final summary even when all broad checker verdicts say yes", async () => {
    const deps = dependencies();
    deps.verifier.generateJson = async req => {
      const r = audit(req.prompt), request = JSON.parse(req.prompt);
      if (request.full_answer) {
        const summary = r.contribution_map.find((row: { claim_id: string }) => request.summary_claim_ids.includes(row.claim_id));
        summary.kind = "restatement"; summary.duplicates = [request.claims[0].claim_id];
      }
      return r;
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 9000)).toMatchObject({ status: "incomplete" });
  });
  it("passes the exact failed claim and explanation to the single bounded correction", async () => {
    const deps = dependencies(), originalWrite = deps.writer.generateJson;
    const corrections: unknown[] = [];
    deps.writer.generateJson = async req => {
      const request = JSON.parse(req.prompt);
      if (request.correction) corrections.push(request.correction);
      return originalWrite(req);
    };
    let rejected = false;
    deps.verifier.generateJson = async req => {
      const result = audit(req.prompt), request = JSON.parse(req.prompt);
      if (request.full_answer && !rejected) {
        rejected = true;
        const failure = result.claim_assessments.at(-1)!;
        failure.direct_support = "no";
        failure.reason_codes = ["unsupported_meaning"];
        failure.explanation = "The cited excerpt does not contain this additional detail.";
      }
      return result;
    };
    await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 30000);
    expect(corrections).toHaveLength(1);
    expect(corrections[0]).toMatchObject({ checker_findings: {
      support_failures: [{ explanation: "The cited excerpt does not contain this additional detail." }],
    } });
  });
  it("lets the semantic audit reject an independent ruling even if its wording passes parsing", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.writer.generateJson = async req => ({ ...await write(req) as object, ...(JSON.parse(req.prompt).sections_to_write.includes("quran") ? { quran: [{ ...drafts.quran[0], text: "This conduct is forbidden." }] } : {}) });
    deps.verifier.generateJson = async req => {
      const r = audit(req.prompt);
      if (JSON.parse(req.prompt).claims.some((c: { claim: string }) => c.claim === "This conduct is forbidden.")) r.attribution_checks[0].verdict = "no";
      return r;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 9000);
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") expect(result.sections?.[0].outcome).toBe("failed_check");
  });
});

describe("first available source streaming and safe completion", () => {
  it.each(["hadith", "scholar"] as const)("streams %s independently while the rest is still preparing", async firstGroup => {
    const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
    local.passages = local.passages.filter(p => firstGroup === "hadith" ? p.source.kind !== "quran" : p.source.kind === "scholar"); local.cards = [];
    const sourceId = firstGroup === "hadith" ? "HE9001" : scholarId;
    let release!: () => void; const gate = new Promise<void>(r => release = r);
    const seen: string[] = []; deps.rich = { onSection: s => { seen.push(s.group); if (s.group === firstGroup) release(); } };
    deps.writer.generateJson = async req => {
      const groups = JSON.parse(req.prompt).sections_to_write;
      if (groups.includes("summary")) await gate;
      return { ...await write(req) as object, ...(groups.includes("summary") ? { summary: [{ ...drafts.summary[0], source_ids: [sourceId] }] } : {}) };
    };
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer"); expect(seen).toEqual(["quran", "hadith", "scholar", "summary"]);
  });
  it("can complete when an omitted nonessential section leaves a genuinely complete checked answer", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.writer.generateJson = async req => ({ ...await write(req) as object, scholar: [], summary: [{ ...drafts.summary[0], source_ids: ["Q2:183", "HE9001"] }] });
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[2]).toMatchObject({ outcome: "not_checked", omitted: true });
  });
  it("does not complete if the only evidence for an essential concern is lost", async () => {
    const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
    local.question.requirements.push({ id: "R2", text: "Explain an essential qualification", facet: "conditions" });
    local.passages[2].requirementIds = ["R2"];
    deps.writer.generateJson = async req => ({ ...await write(req) as object, scholar: [], summary: [{ ...drafts.summary[0], source_ids: ["Q2:183", "HE9001"] }] });
    expect(await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care and its qualification", {}, 9000)).toMatchObject({ status: "incomplete" });
  });
});

describe("display translations and version compatibility", () => {
  const translation = (): DisplayTranslation => ({ status: "ready", text: "Invented translation of the exact test excerpt.", language: "en", origin: "ai",
    original: pack.passages[2].source.kind === "scholar" ? pack.passages[2].source.quote.arabic : "", originalHash: createHash("sha256").update(pack.passages[2].source.kind === "scholar" ? pack.passages[2].source.quote.arabic : "").digest("hex") });
  it("attaches a labelled translation only after checking it, without exposing it to writing", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.displayTranslationLookup = async () => new Map([[scholarId, translation()]]);
    deps.writer.generateJson = async req => { expect(req.prompt).not.toContain("Invented translation of the exact"); return write(req); };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") {
      expect(result.answer.version).toBe(4);
      expect(result.answer.sections[2].sources[0].displayTranslation).toMatchObject({ status: "ready", origin: "ai" });
      const html = renderToStaticMarkup(createElement(RichAnswerView, { sections: result.answer.sections, language: "en", text: getDictionary("en").ask, complete: true, guide: result.answer.guide }));
      expect(html).toContain(richText.en.aiTranslation);
      const labelIndex = html.indexOf(richText.en.aiTranslation);
      expect(html.lastIndexOf("</details>", labelIndex)).toBeGreaterThan(html.lastIndexOf("<details>", labelIndex)); // Label stays visible when originals are folded.
      expect(html).not.toContain("ask a qualified scholar");
      expect((html.match(/<blockquote/g) ?? []).length).toBe(3);
      for (const ref of [...html.matchAll(/href="#([^"]+)"/g)]) expect(html).toContain(`id="${ref[1]}"`);
      const reopened = await hydrateAnswer(stripAnswer(result.answer), { getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined, getHadith: async () => pack.passages[1].source.kind === "hadith" ? pack.passages[1].source.hadith : null });
      expect(reopened).toEqual({ ok: true, answer: result.answer });
      let state = emptyRichState(); let sequence = 0;
      for (const section of result.answer.sections) state = reduceRichEvent(state, { request_id: "v4-test", sequence: ++sequence, type: "section", section });
      expect(reduceRichEvent(state, { request_id: "v4-test", sequence: ++sequence, type: "terminal", result } as RichEvent).terminal).toBe(true);
      expect(validRichAnswer({ ...result.answer, guide: { text: "Test guidance", kind: "sourced_instruction", refs: ["Q4:92"] } })).toBe(false);
    }
  });
  it.each(["original", "language", "checker_rejection", "lookup_failure", "checker_omission"])("honestly withholds translation after %s without invalidating checked original evidence", async failure => {
    const deps = dependencies(), t = translation();
    if (t.status !== "ready") throw new Error("fixture");
    if (failure === "original") t.original = "مقتطف مختلف";
    if (failure === "language") t.language = "de";
    deps.displayTranslationLookup = async () => { if (failure === "lookup_failure") throw new Error("offline"); return new Map([[scholarId, t]]); };
    deps.verifier.generateJson = async req => {
      const r = audit(req.prompt);
      if (failure === "checker_rejection") r.translation_checks.forEach((c: { faithful: string }) => c.faithful = "no");
      if (failure === "checker_omission") r.translation_checks = [];
      return r;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[2].sources[0].displayTranslation?.status).toBe(failure === "lookup_failure" ? "lookup_failed" : failure === "checker_omission" ? "not_checked" : "rejected");
  });
});
