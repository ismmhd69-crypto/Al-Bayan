import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { meaningReviewRequest, parseMeaningReview } from "@/lib/ask/meaning-review";
import { dependencies, pack, audit } from "./fixtures/rich";
import { runRichAnswer } from "@/lib/ask/rich-engine";
it("keeps unrelated originals out of the narrow meaning check and refuses uncertain or missing decisions", () => {
  const items = [{ text: "A test claim.", refs: ["Q1"] }];
  const req = meaningReviewRequest(items, { passages: [{ id: "Q1", arabic: "original", surrounding_context: [{ arabic: "restriction" }] }, { id: "Q2", arabic: "unrelated" }] }, new AbortController().signal);
  expect(JSON.parse(req.prompt).claims[0].originals.map((p: { source_id: string }) => p.source_id)).toEqual(["Q1"]);
  expect(parseMeaningReview({ claims: { C1: { verdict: "unsure", explanation: "The audience is not established." } } }, items)?.failures).toHaveLength(1);
  expect(parseMeaningReview({ claims: {} }, items)).toBeNull();
  expect(parseMeaningReview({ claims: { C1: { verdict: "no", explanation: "" } } }, items)).toBeNull();
});
it("pairs English claims only with their cited original's source-provided translation", () => {
  const items = [{ text: "A test claim.", refs: ["Q1", "HE1"] }];
  const serialized = { question: { language: "en" }, passages: [
    { id: "Q1", type: "quran", arabic: "untouched original", translation_en: "Source-provided wording", displayTranslation: { status: "ready", text: "AI display wording" } },
    { id: "HE1", type: "hadith", arabic: "another original", displayTranslation: { status: "ready", text: "Unapproved display wording" } },
    { id: "Q2", type: "quran", arabic: "unrelated", translation_en: "Unrelated source wording" },
  ] };
  const req = meaningReviewRequest(items, serialized, new AbortController().signal, true), input = JSON.parse(req.prompt);
  expect(input.claims[0].originals[0]).toMatchObject({ arabic: "untouched original", source_translation: { text: "Source-provided wording", role: "reading_aid_only" } });
  expect(input.claims[0].originals[1].source_translation).toBeUndefined();
  expect(req.prompt).not.toContain("display wording"); expect(req.prompt).not.toContain("Unrelated source wording");
  const arabic = JSON.parse(meaningReviewRequest(items, { ...serialized, question: { language: "ar" } }, new AbortController().signal).prompt);
  expect(arabic.claims[0].originals.every((p: any) => p.source_translation === undefined)).toBe(true);
  const invalid = { claims: { C1: { verdict: "no", explanation: "A translation-only finding is not grounded in Arabic.",
    finding: { category: "source_support", claim_quote: "A test claim.", source_id: "Q1", source_quote: "Source-provided wording" } } } };
  expect(parseMeaningReview(invalid, items.slice(0, 1), serialized)).toBeNull();
});
it("feeds a narrow scope rejection into the existing single correction without streaming it as checked", async () => {
  const deps = dependencies(); deps.meaningReview = true; let rejected = false, corrected = false;
  const writer = deps.writer.generateJson;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.correction) { corrected = true; expect(input.correction.checker_findings.support_failures).toContainEqual(expect.objectContaining({ claim_id: "C1", explanation: "A limited audience was broadened." })); }
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage !== "narrow_meaning_review_v1") return audit(req.prompt);
    const no = !rejected; rejected = true;
    return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string; text: string; originals: { source_id: string; arabic: string }[] }) => [c.claim_id, { finding: { category: "source_support", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic.slice(0, 900) }, verdict: no ? "no" : "yes", explanation: no ? "A limited audience was broadened." : "" }])) };
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(corrected).toBe(true);
});
it("withdraws an earlier explanation when the later independent meaning check finds a real lost condition", async () => {
  const deps = dependencies(); deps.meaningReview = true;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage !== "narrow_meaning_review_v1") return audit(req.prompt);
    return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string; text: string; originals: { source_id: string; arabic: string }[] }, i: number) => [c.claim_id, { finding: { category: "source_support", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic.slice(0, 900) }, verdict: input.claims.length > 1 && i === 0 ? "no" : "yes", explanation: input.claims.length > 1 && i === 0 ? "A newly noticed original condition is missing." : "" }])) };
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
});

it("checks new survivors after a sibling fails without discarding an earlier exact approval", async () => {
  const deps = dependencies(); deps.meaningReview = true; let checkedSurvivors = false;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage === "narrow_meaning_review_v1") {
      if (input.claims.length > 1) checkedSurvivors = true;
      return { claims: Object.fromEntries(input.claims.map((c: { claim_id: string; text: string; originals: { source_id: string; arabic: string }[] }) => [c.claim_id, { finding: { category: "source_support", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic.slice(0, 900) }, verdict: input.claims.length > 1 ? "no" : "yes", explanation: input.claims.length > 1 ? "A surviving claim broadened a specific activity." : "" }])) };
    }
    const result = audit(req.prompt);
    if (input.full_answer) {
      result.claim_assessments.at(-1)!.direct_support = "no";
      result.claim_assessments.at(-1)!.reason_codes = ["unsupported_meaning"];
      result.claim_assessments.at(-1)!.explanation = "The final summary contains an unsupported assertion.";
    }
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete"); expect(checkedSurvivors).toBe(true);
  // The Quran sentence passed its own meaning review before the sibling failure.
  // Neither failed, newly reviewed sibling may become ready from that approval.
  if (result.status === "incomplete") {
    expect(result.sections?.find(s => s.group === "quran")).toMatchObject({ outcome: "ready", claims: [{ text: "The Quran connects care with daily responsibility." }] });
    expect(result.sections?.filter(s => s.group !== "quran").every(s => s.outcome !== "ready" && !s.claims.length)).toBe(true);
  }
});

it("leaves room for reasoning and visible findings in the recorded seven-claim truncation shape", () => {
  const items = Array.from({ length: 7 }, (_, i) => ({ text: `Test claim ${i}.`, refs: ["Q1"] }));
  const req = meaningReviewRequest(items, { passages: [{ id: "Q1", arabic: "A test original." }] }, new AbortController().signal);
  // The actual failed seven-claim request exhausted 1,590 total tokens, including
  // 1,343 reasoning tokens, before its JSON could finish. No malformed fragment may pass.
  expect(req.maxOutputTokens).toBeGreaterThan(1590 + 1000);
  expect(req.system).toContain("explanation set to an empty string");
});
