// Scripted source/meaning decisions over invented originals. Tests publication,
// not whether any real religious teaching or removed condition is correct.
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { pack, dependencies, audit, drafts } from "./fixtures/rich";

const run = async (mode: "safe" | "dependent" | "invalid" | "no_safe_claim" | "inconsistent" | "inconsistent_dependent") => {
  const deps = dependencies(), shown: unknown[] = [], diagnostics: string[] = [], writes: unknown[] = [], reviews: string[][] = [];
  deps.meaningReview = true;
  deps.rich = { onSection: s => shown.push(structuredClone(s)) };
  deps.onDiagnostic = (_stage, code) => diagnostics.push(code);
  deps.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt); writes.push(input);
    const bad = { text: "The Quran connects care with a further daily duty.", source_ids: ["Q2:183"], requirement_id: "R1" };
    return { status: "answer", next_step: [], quran: input.correction
      ? { P1: { text: "The Quran describes care as another daily responsibility." } }
      : [drafts.quran[0], bad] };
  };
  deps.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (input.stage === "narrow_meaning_review_v1") return { claims: Object.fromEntries(input.claims.map((c: any) => [c.claim_id,
      { verdict: /further daily|another daily/.test(c.text) || mode === "no_safe_claim" ? "no" : "yes", explanation: /further daily|another daily/.test(c.text) || mode === "no_safe_claim" ? "The extra duty is not established by this invented excerpt." : "",
        finding: { category: "source_support", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic } }])) };
    reviews.push(input.claims.map((c: any) => c.claim ?? c.text));
    if (mode === "invalid") return {};
    const result = audit(request.prompt);
    if (mode.startsWith("inconsistent") && input.claims.length > 1) {
      result.all_claims_consistent = "no";
      const bad = result.claim_assessments[1];
      bad.direct_support = "no"; bad.reason_codes = ["unsupported_meaning"];
      bad.explanation = "The second invented statement is not supported.";
      bad.finding = { category: "source_support", claim_quote: input.claims[1].claim, source_id: "Q2:183", source_quote: pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse.arabic : "" };
    }
    if (["dependent", "inconsistent_dependent"].includes(mode) && input.claims.length === 1) result.useful_explanation = "no";
    return result;
  };
  const result = await runRichAnswer({ ...pack, passages: [pack.passages[0]] }, "en", deps, new AbortController().signal,
    "Explain care", {}, Infinity, { sourceOnly: "quran" });
  return { result, shown, diagnostics, writes, reviews };
};

it("publishes the unchanged safe sentence only after checking the settled surviving set", async () => {
  const state = await run("safe");
  expect(state.result).toMatchObject({ status: "incomplete", sections: [{ group: "quran", outcome: "ready", claims: [{ text: drafts.quran[0].text }] }] });
  if (state.result.status !== "incomplete") throw Error("fixture");
  expect(state.result.sections?.[0].claims).toHaveLength(1); expect(state.shown).toHaveLength(1);
  expect(state.writes).toHaveLength(2); expect(state.reviews.at(-1)).toEqual([drafts.quran[0].text]);
  expect(state.diagnostics).toContain("rich_surviving_source_set_ready");
});
it("does not publish a surviving sentence when removing its sibling leaves it unhelpful", async () => {
  const state = await run("dependent");
  expect(state.result).toMatchObject({ status: "incomplete", sections: [{ outcome: "failed_check", claims: [] }] });
  expect(state.diagnostics).not.toContain("rich_surviving_source_set_ready"); expect(state.writes).toHaveLength(2);
});
it("never extracts a safe fragment from an invalid checker envelope", async () => {
  const state = await run("invalid");
  expect(state.result).toMatchObject({ status: "incomplete", sections: [{ outcome: "failed_check", claims: [] }] });
  expect(state.diagnostics).not.toContain("rich_surviving_source_set_check");
});
it("independently rechecks a supported candidate when a rejected sibling failed combined consistency", async () => {
  const state = await run("inconsistent");
  expect(state.result).toMatchObject({ status: "incomplete", sections: [{ outcome: "ready", claims: [{ text: drafts.quran[0].text }] }] });
  expect(state.diagnostics).toContain("rich_surviving_source_set_ready");
  expect(state.reviews.at(-1)).toEqual([drafts.quran[0].text]);
  expect(state.writes).toHaveLength(2); expect(state.shown).toHaveLength(1);
});
it("withholds a candidate subset that fails its new independent usefulness check", async () => {
  const state = await run("inconsistent_dependent");
  expect(state.result).toMatchObject({ status: "incomplete", sections: [{ outcome: "failed_check", claims: [] }] });
  expect(state.diagnostics).not.toContain("rich_surviving_source_set_ready");
});
it("does not fabricate a subset when all claims fail their meaning check", async () => {
  const state = await run("no_safe_claim");
  expect(state.result).toMatchObject({ status: "incomplete", sections: [{ outcome: "failed_check", claims: [] }] });
  expect(state.diagnostics).not.toContain("rich_surviving_source_set_check");
});
