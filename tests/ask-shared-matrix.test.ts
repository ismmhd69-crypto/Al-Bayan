// This is a frozen multilingual transport/checklist regression, not an assessment of a real
// model's understanding or religious answers. All source wording and verdicts are scripted.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runPipeline } from "@/lib/ask/core";
import { sharedQuestionCases, sharedLiveCases, FROZEN_SHARED_HASH } from "@/scripts/ask-shared-cases";
import { audit, dependencies, drafts, pack } from "./fixtures/rich";

const writing = {
  en: { quran: drafts.quran[0].text, hadith: drafts.hadith[0].text, scholar: drafts.scholar[0].text, summary: drafts.summary[0].text, guide: "Compare the cited conditions and ask which part needs a clearer explanation." },
  ar: { quran: "يعرض النص المعنى العام مع الحدود المذكورة في أصله.", hadith: "يوضح هذا الحديث جانبًا آخر من السؤال دون توسيع دلالته.", scholar: "يبين ابن باز تفاصيل المسألة مع مراعاة الشروط المذكورة.", summary: "تجمع هذه الإجابة المعاني المدعومة مع إبقاء كل قيد في موضعه.", guide: "راجع الفرق بين الشرح العام والتفاصيل المذكورة، ثم اسأل عن الجزء الذي لم يتضح لك." },
  de: { quran: "Der Koran verbindet Fürsorge mit täglicher Verantwortung.", hadith: "Der Prophet lehrte einen achtsamen Umgang mit den eigenen Handlungen.", scholar: "Ibn Baz erläutert die Bedeutung unter den genannten Bedingungen.", summary: "Die belegten Erklärungen helfen, Verantwortung und ihre Grenzen gemeinsam zu verstehen.", guide: "Vergleiche die genannten Bedingungen und frage nach dem Punkt, der dir noch unklar ist." },
};
describe("frozen shared question set", () => {
  it("has six categories, 36 language cases and six live-comparison cases, two per language", () => {
    expect(createHash("sha256").update(readFileSync("tests/fixtures/ask-shared-cases.json")).digest("hex")).toBe(FROZEN_SHARED_HASH);
    expect(sharedQuestionCases).toHaveLength(36);
    expect(new Set(sharedQuestionCases.map(c => c.category)).size).toBe(6);
    expect(sharedLiveCases()).toHaveLength(6);
    for (const lang of ["en", "ar", "de"]) expect(sharedLiveCases().filter(c => c.lang === lang)).toHaveLength(2);
  });
  it.each(sharedQuestionCases)("preserves the declared checklist and language across the shared path without reference hints: $id", async c => {
    const deps = dependencies(), local = structuredClone(pack), text = writing[c.lang];
    deps.disableReferenceHints = true;
    deps.tiered = { videoBudgetMs: 0, maxVideos: 0 };
    const points = c.concerns.map((concern, i) => ({ text: concern, facet: c.facets[i] ?? c.facets[0], scope: c.kind === "personal" ? "case_specific" : "general",
      essential_conditions: [], interpretation_id: "", search_queries: { en: ["care responsibility"], ar: ["عناية يومية"], de: ["achtsame Verantwortung"] }, quran_ar: ["عناية يومية"], hadith_ar: ["عناية يومية"] }));
    const seen: string[] = [];
    deps.writer.generateJson = async req => {
      if (req.system.startsWith("You create a safe search plan")) return { language: c.lang, kind: c.kind, question_type: c.category === "objection" ? "objection" : "general", checklist_status: "complete",
        subjects: [c.category], requested_points: points, qualifiers: [], search_queries_en: ["care responsibility"], search_queries_de: ["achtsame Verantwortung"], search_queries_ar: ["عناية يومية"], search_queries_quran_ar: ["عناية يومية"], search_queries_hadith_ar: ["عناية يومية"], interpretations: [], clarification_needed: false };
      const groups = JSON.parse(req.prompt).sections_to_write as (keyof typeof drafts)[];
      return { status: "answer", no_answer_feedback: [], next_step: { text: text.guide, kind: "learning", refs: [] }, ...Object.fromEntries(groups.map(group => [group, [{ ...drafts[group][0], text: text[group], requirement_id: group === "hadith" && points.length > 1 ? "R2" : "R1" }]])) };
    };
    deps.verifier.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (!req.system.startsWith("You select evidence")) {
        expect(input.visitor_question).toBe(c.question);
        expect(input.evidence_package.question.requirements.map((r: { text: string }) => r.text)).toEqual(c.concerns);
        return audit(req.prompt);
      }
      const assess = (source: { id: string }) => ({ source_id: source.id, relevance: "direct", supported_requirement_ids: points.map((_, i) => `R${i + 1}`), context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" });
      return { status: "ready", coverage: "complete", conflict_type: "none", ...Object.fromEntries(["quran", "hadith", "scholar"].map(g => [`${g}_assessments`, input[`${g}_candidates`].map((p: { source: { id: string } }) => assess(p.source))])) };
    };
    deps.onFrame = frame => expect(frame.requirements.map(r => r.text)).toEqual(c.concerns);
    deps.onRetrieved = result => expect(result.hintIds).toEqual([]);
    deps.rich = { onSection: s => seen.push(s.group) };
    deps.search = async () => ["2:183"];
    deps.getVerse = async () => local.passages[0].source.kind === "quran" ? local.passages[0].source.verse : undefined;
    deps.searchHadith = async () => local.passages[1].source.kind === "hadith" ? [local.passages[1].source.hadith] : [];
    deps.searchScholars = async () => local.passages[2].source.kind === "scholar" ? [local.passages[2].source.quote] : [];
    const result = await runPipeline(c.question, c.lang, deps);
    expect(result.status).toBe(c.kind === "personal" ? "ask_scholar" : "rich_answer");
    if (result.status === "rich_answer") {
      expect(result.answer.language).toBe(c.lang); expect(result.answer.version).toBe(4);
      expect(seen).toEqual(["quran", "hadith", "scholar", "summary"]);
    }
  });
});
