import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { sealedPackageJson, runPipeline } from "@/lib/ask/core";
import { selectionReply } from "./fixtures/selection";
import { dependencies, pack, audit } from "./fixtures/rich";

const falseClaim = "Ibn Baz says six daily prayers are obligatory.";
it.each(["resolved_question", "parent_sentences"] as const)("does not admit support drawn only from %s through the real review boundary", async field => {
  const deps = dependencies(), shown: string[] = [];
  deps.taskContext = { visitor_message: "Explain the cited view", resolved_question: field === "resolved_question" ? falseClaim : "Explain the cited view",
    parent_sentences: field === "parent_sentences" ? [falseClaim] : [], relevant_user_messages: [] };
  deps.rich = { onSection: s => shown.push(s.group) };
  const write = deps.writer.generateJson;
  deps.writer.generateJson = async request => {
    const value = await write(request) as { summary?: { text: string }[] };
    if (Array.isArray(value.summary)) value.summary = value.summary.map(c => ({ ...c, text: falseClaim }));
    return value;
  };
  let finalReviews = 0;
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    expect(input.task_context).toEqual(deps.taskContext);
    expect(JSON.stringify(input.evidence_package)).not.toContain(falseClaim);
    expect(JSON.stringify(input.claim_evidence)).not.toContain(falseClaim);
    expect(JSON.stringify(input.restriction_context)).not.toContain(falseClaim);
    const result = audit(request.prompt);
    if (input.full_answer) {
      finalReviews++;
      // A compliant-looking, all-yes checker tries to cite task text as an original.
      // Production code must reject its forged evidence binding, not a stubbed "no".
      for (const check of result.citation_checks) if (input.claims.find((c: { claim_id: string }) => c.claim_id === check.claim_id)?.claim === falseClaim) {
        for (const clause of check.clauses) for (const binding of clause.evidence) binding.original_excerpt = falseClaim;
      }
    }
    return result;
  };
  expect(JSON.stringify(sealedPackageJson(pack, "en"))).not.toContain(falseClaim);
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain the cited view", {});
  expect(finalReviews).toBeGreaterThan(0);
  expect(result.status).toBe("incomplete"); expect(shown).not.toContain("summary");
});
it("retains the positive control with context present and original-bound approvals", async () => {
  const deps = dependencies();
  deps.taskContext = { visitor_message: "Explain care", resolved_question: "Explain care", parent_sentences: [falseClaim], relevant_user_messages: [] };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer");
});

it.each(["resolved_question", "parent_sentences"] as const)("keeps false %s separate through framing, retrieval, selection and final review", async field => {
  const claim = "The Quran describes six daily prayers.", deps = dependencies(), shown: string[] = [];
  deps.simpleResearch = true; deps.rich = { progressive: true, stable: true, onSection: s => shown.push(s.group) };
  deps.previousUserMessages = ["Explain the cited care topic"];
  deps.followUpContext = { message: "Explain that", history: deps.previousUserMessages, language: "en", parentUnavailable: false,
    parent: { displayed_sentences: field === "parent_sentences" ? [claim] : ["The cited topic concerns care."], sources: [{ id: "Q2:183", kind: "quran", label: "Fixture" }] } };
  deps.sourceAvailability = { hadith: false, scholar: false };
  deps.revalidateStable = async () => ({ unavailable: false, rejectedIds: [] });
  const diagnostics: string[] = []; deps.onDiagnostic = (_stage, code) => { diagnostics.push(code); };
  deps.search = async () => ["2:183"];
  deps.getVerse = async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
  deps.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You create a safe search plan")) return { language: "en", kind: "question", question_type: "general", subjects: ["care"],
      requested_points: [{ text: "Explain the cited care topic", facet: "general", scope: "general", essential_conditions: [], essential_condition_quotes: [], search_queries: { en: ["care"], ar: ["عناية يومية"], de: [] }, quran_ar: [], hadith_ar: [] }],
      search_queries_en: ["care"], search_queries_ar: ["عناية يومية"], search_queries_de: [], qualifiers: [], interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [],
      follow_up: { relation: "related", resolved_question: field === "resolved_question" ? claim : "Explain the cited care topic", intent: "re_explain" } };
    expect(JSON.stringify(input.evidence_package)).not.toContain(claim);
    return { status: "answer", summary: [{ text: claim, source_ids: ["Q2:183"], requirement_id: "R1" }], next_step: [], no_answer_feedback: [] };
  };
  let finalReviews = 0;
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.candidates) {
      expect(JSON.stringify(input.candidates)).not.toContain(claim);
      return selectionReply(input, { status: "ready", coverage: "complete", conflict_type: "none", missing_requirement_ids: [], assessments: input.candidates.map((p: { source: { id: string } }) => ({ source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) });
    }
    finalReviews++;
    expect(input.task_context[field]).toEqual(field === "parent_sentences" ? [claim] : claim);
    expect(JSON.stringify(input.evidence_package)).not.toContain(claim);
    expect(JSON.stringify(input.claim_evidence)).not.toContain(claim);
    const reply = audit(request.prompt);
    for (const row of reply.citation_checks) for (const clause of row.clauses) for (const binding of clause.evidence) binding.original_excerpt = claim;
    return reply;
  };
  const result = await runPipeline("Explain that", "en", deps);
  expect(finalReviews, JSON.stringify({ status: result.status, diagnostics })).toBeGreaterThan(0); expect(result.status).toBe("incomplete"); expect(shown).not.toContain("summary");
});
