import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, audit } from "./fixtures/rich";
import { runSimplePipeline } from "@/lib/ask/simple-pipeline";
import { selectionReply } from "./fixtures/selection";
import type { QuestionFrame } from "@/lib/ask/retrieval";

it.each(["pass", "reject", "malformed", "interrupt", "correction_approved"])("keeps the publication boundary with %s review", async mode => {
  const deps = dependencies(), stop = new AbortController(), events: string[] = [];
  let accepted = false, finalReviews = 0;
  deps.rich = { onSection: section => {
    if (section.group === "summary") expect(accepted).toBe(true);
    events.push(section.group);
  } };
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (!input.full_answer) return audit(request.prompt);
    finalReviews++;
    expect(events).not.toContain("summary");
    if (mode === "interrupt") { stop.abort(); throw new Error("fixture_interruption"); }
    if (mode === "malformed") return {};
    const result = audit(request.prompt);
    if (mode === "reject" || mode === "correction_approved" && finalReviews === 1) {
      result.complete_coverage = "no";
      result.direct_summary = "no";
    } else accepted = true;
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, stop.signal, "Explain care", {});
  expect(finalReviews).toBeGreaterThan(0);
  if (mode === "pass" || mode === "correction_approved") {
    expect(result.status).toBe("rich_answer");
    expect(events.at(-1)).toBe("summary");
    if (mode === "correction_approved") expect(finalReviews).toBeGreaterThan(1);
  } else {
    expect(result.status).toBe("incomplete");
    expect(events).not.toContain("summary");
  }
});

it.each(["pass", "malformed", "interrupt"])("rechecks a reduced summary before publication: %s", async mode => {
  const deps = dependencies(), stop = new AbortController(), shown: string[] = [];
  const frame: QuestionFrame = { ...pack.question, kind: "question", checklistStatus: "complete", searchQueries: { en: ["care"] }, backupQueries: [] };
  let reviews = 0, accepted = false;
  deps.rich = { onSection: section => {
    if (section.group === "summary") { expect(accepted).toBe(true); expect(section.claims).toHaveLength(1); }
    shown.push(section.group);
  } };
  deps.sourceAvailability = { hadith: false, scholar: false };
  deps.search = async () => ["2:183"];
  deps.getVerse = async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
  deps.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.correction) return { status: "answer", summary: { P1: { text: "The passage also promises a second unlimited outcome.", source_refs: [input.correction.summary_citation_choices[0].reference] } }, next_step: [], no_answer_feedback: [] };
    return { status: "answer", summary: [
      { text: "The source describes care as a thoughtful responsibility.", source_ids: ["Q2:183"], requirement_id: "R1" },
      { text: "The passage promises an unlimited outcome.", source_ids: ["Q2:183"], requirement_id: "R1" },
    ], next_step: [], no_answer_feedback: [] };
  };
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.candidates) return selectionReply(input, { status: "ready", coverage: "complete", conflict_type: "none", missing_requirement_ids: [],
      assessments: input.candidates.map((p: { source: { id: string } }) => ({ source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "",
        contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) });
    reviews++; expect(shown).not.toContain("summary");
    if (reviews >= 3) {
      expect(input.claims).toHaveLength(1);
      if (mode === "malformed") return {};
      if (mode === "interrupt") { stop.abort(); throw new Error("fixture_interruption"); }
      accepted = true;
    }
    const result = audit(request.prompt);
    if (reviews <= 2) {
      const row = result.claim_assessments[1], claim = input.claims[1];
      row.direct_support = "no"; row.explanation = "The original does not establish this claim.";
      row.finding = { category: "source_support", claim_quote: claim.claim, source_id: claim.source_ids[0], source_anchor_id: input.claim_evidence[1].negative_excerpt_choices[0].anchor_id };
    }
    return result;
  };
  const result = await runSimplePipeline("Explain care", frame, deps, stop.signal, { quran: [], hadith: [], scholars: [] });
  expect(reviews).toBeGreaterThanOrEqual(3);
  expect(result.status).toBe(mode === "pass" ? "rich_answer" : "incomplete");
  expect(shown.includes("summary")).toBe(mode === "pass");
});
