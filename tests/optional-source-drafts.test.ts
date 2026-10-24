import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { validRichAnswer, validRichSection } from "@/lib/ask/rich-answer";
import { stripAnswer } from "@/lib/chat/answer-store";
import { dependencies, pack, drafts, audit } from "./fixtures/rich";

function only(group: "quran" | "hadith", local = structuredClone(pack)) {
  const deps = dependencies(); let writes = 0, corrections = 0;
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt); writes++; if (p.correction) corrections++;
    return { status: "answer", no_answer_feedback: [],
      ...Object.fromEntries(p.sections_to_write.map((g: string) => [g, g === group ? drafts[group] : g === "summary" ? [{ ...drafts.summary[0], source_ids: [drafts[group][0].source_ids[0]] }] : []])),
      ...(p.sections_to_write.includes("summary") ? { next_step: { text: "Read the cited explanation and note its stated conditions.", kind: "learning", refs: [] } } : {}),
    };
  };
  deps.verifier.generateJson = async req => audit(req.prompt);
  return { deps, local, counts: () => ({ writes, corrections }) };
}
it.each(["quran", "hadith"] as const)("does not spend the correction filling unused selected groups when %s covers the whole concern", async group => {
  const { deps, local, counts } = only(group);
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(counts()).toEqual({ writes: 3, corrections: 0 });
  if (result.status !== "rich_answer") throw Error("expected answer");
  expect(validRichAnswer(result.answer)).toBe(true);
  for (const section of result.answer.sections.filter(s => s.group !== group && s.group !== "summary")) {
    expect(section).toMatchObject({ outcome: "not_checked", omitted: true, claims: [], sources: [] });
  }
  expect(stripAnswer(result.answer).sections.find(s => s.omitted)?.omitted).toBe(true);
});
it("does not let an omitted group hide an unanswered second concern", async () => {
  const { deps, local } = only("quran");
  local.question.requirements.push({ id: "R2", text: "A distinct second concern", facet: "conditions" });
  local.passages.filter(p => p.source.kind !== "quran").forEach(p => p.requirementIds = ["R2"]);
  expect((await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain both concerns", {})).status).toBe("incomplete");
});
it("does not let an omitted group erase a necessary qualification for the same concern", async () => {
  const { deps, local } = only("quran");
  local.contributionPlan = [{ sourceIds: ["HE9001"], requirementIds: ["R1"], purpose: "qualification", necessary: true, description: "An essential restriction" }];
  expect((await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care with its restriction", {})).status).toBe("incomplete");
});
it("does not turn unsupported source wording into an intentional omission", async () => {
  const { deps, local } = only("quran");
  deps.verifier.generateJson = async req => {
    const r = audit(req.prompt);
    r.claim_assessments.forEach((c: { direct_support: string; reason_codes: string[]; explanation: string }) => { c.direct_support = "no"; c.reason_codes = ["unsupported_meaning"]; c.explanation = "The stated meaning does not follow from the original."; });
    return r;
  };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete");
  if (result.status === "incomplete") expect(result.sections?.find(s => s.group === "quran")).toMatchObject({ outcome: "failed_check" });
});
it("requires omission metadata to describe only empty unpresented source groups", () => {
  expect(validRichSection({ group: "hadith", outcome: "not_checked", omitted: true, claims: [], sources: [] })).toBe(true);
  expect(validRichSection({ group: "hadith", outcome: "failed_check", omitted: true, claims: [], sources: [] })).toBe(false);
  expect(validRichSection({ group: "summary", outcome: "not_checked", omitted: true, claims: [], sources: [] })).toBe(false);
});
