// Invented evidence and scripted verdicts verify correction/accounting behaviour,
// not religious truth. No provider calls.
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { pack, sections, dependencies, audit } from "./fixtures/rich";
import type { ProgressiveCheckpoint } from "@/lib/ask/progressive-checkpoint";

it.each([false, true])("separates meaning and editorial corrections, preserves siblings and persists limits (bad patch=%s)", async badPatch => {
  const checkpoint: ProgressiveCheckpoint = { lanes: {}, retry: 0, meaningApprovals: new Set() };
  const deps = dependencies(), requests: any[] = [];
  deps.progressiveCheckpoint = checkpoint; deps.meaningReview = true;
  const sibling = { text: "The Prophet describes careful conduct in people's actions.", source_ids: ["HE9001"], requirement_id: "R1" };
  deps.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt); requests.push(input);
    if (requests.length === 1) return { status: "answer", next_step: [], summary: [
      { text: "The Quran guarantees care in every circumstance.", source_ids: ["Q2:183"], requirement_id: "R1" }, sibling] };
    if (requests.length === 2) return { status: "answer", next_step: [], summary: { P0: { text: "The Quran explains invented source wording solely for tests." } } };
    return { status: "answer", next_step: [], summary: badPatch ? { P1: { text: "Changed the wrong sentence." } } : { P0: { text: "The Quran connects care with a thoughtful daily duty." } } };
  };
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.stage === "narrow_meaning_review_v1") return { claims: Object.fromEntries(input.claims.map((c: any) => [c.claim_id, {
      verdict: c.text.includes("guarantees") ? "no" : "yes", explanation: c.text.includes("guarantees") ? "This invented original does not establish a guarantee." : "",
      finding: { category: "source_support", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic },
    }])) };
    return audit(request.prompt);
  };
  const run = () => runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, Infinity,
    { committedSources: true, checkedSections: sections.slice(0, 3) });
  const result = await run();
  expect(requests).toHaveLength(3);
  expect(checkpoint.conclusion).toMatchObject({ drafts: 3, meaningUsed: true, editorialUsed: true });
  expect(requests[2].correction.checker_findings.sentence_patches[0].findings[0].overlap.normalizedMatch).toContain("invented source wording");
  if (badPatch) expect(result.status).toBe("incomplete");
  else {
    expect(result.status).toBe("rich_answer");
    if (result.status !== "rich_answer") throw Error("fixture");
    expect(result.answer.sections.find(s => s.group === "summary")?.claims[1].text).toBe(sibling.text);
  }
  await run();
  expect(requests).toHaveLength(3); // Continue cannot obtain another initial draft.
});
