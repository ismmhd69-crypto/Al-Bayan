import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { groundedWritingRequest, unwrapGroundedWriting } from "@/lib/ask/grounded-writing";
import { richWritingClaimsSchema } from "@/lib/ask/rich-writing-schema";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, audit } from "./fixtures/rich";
import type { JsonRequest } from "@/lib/ai/types";
import { parseDraft } from "@/lib/ask/checks";

function withNotes(value: any, input: any) {
  const result = structuredClone(value); result.no_answer_feedback = [];
  if (!input.sections_to_write.includes("summary")) delete result.next_step;
  for (const group of input.sections_to_write) if (Array.isArray(result[group])) for (const claim of result[group]) claim.grounding = claim.source_ids.map((id: string) => ({
    source_id: id, anchor_id: input.source_grounding_choices.find((a: any) => a.source_id === id).anchor_id,
    treatment: "particular_event", context_clause: "a reported test circumstance",
  }));
  return result;
}
it("puts source context before prose and rejects malformed or borrowed grounding in full", () => {
  const base: JsonRequest = { system: "Writing rules", prompt: JSON.stringify({ sections_to_write: ["quran"], evidence_package: { passages: [
    { id: "Q1", arabic: "نص تجريبي خاص بحالة معينة" }, { id: "Q2", arabic: "أصل تجريبي آخر" },
  ] } }), schema: { type: "object", properties: { quran: richWritingClaimsSchema(["Q1", "Q2"], ["R1"]) }, required: ["quran"] }, maxOutputTokens: 2200 };
  const req = groundedWritingRequest(base), input = JSON.parse(req.prompt);
  if (req.schema.type !== "object" || req.schema.properties.quran.type !== "array" || req.schema.properties.quran.items.type !== "object") throw Error("schema");
  expect(Object.keys(req.schema.properties.quran.items.properties)).toEqual(["source_ids", "grounding", "requirement_id", "text"]);
  const raw = { quran: [{ source_ids: ["Q1"], requirement_id: "R1", text: "An explanation", grounding: [{
    source_id: "Q1", anchor_id: input.source_grounding_choices[0].anchor_id, treatment: "particular_event", context_clause: "a specific narrated case",
  }] }] };
  expect(unwrapGroundedWriting(raw, req)).toEqual({ quran: [{ source_ids: ["Q1"], requirement_id: "R1", text: "In the case described in the text (a specific narrated case), An explanation" }] });
  expect(unwrapGroundedWriting({ ...raw, extra: true }, req)).toBeNull();
  const borrowed = structuredClone(raw); borrowed.quran[0].grounding[0].anchor_id = input.source_grounding_choices[1].anchor_id;
  expect(unwrapGroundedWriting(borrowed, req)).toBeNull();
  expect(unwrapGroundedWriting({ quran: [{ ...raw.quran[0], grounding: [] }] }, req)).toBeNull();
  expect(req.maxOutputTokens).toBe(2200);
  const ar = groundedWritingRequest({ ...base, prompt: JSON.stringify({ ...JSON.parse(base.prompt), answer_language: "Arabic" }) });
  expect(unwrapGroundedWriting(raw, ar)).toBeNull(); // English case metadata cannot enter Arabic displayed prose.
  const long = structuredClone(raw); long.quran[0].text = "A".repeat(300);
  const combined = unwrapGroundedWriting(long, req) as any;
  expect(parseDraft({ status: "answer", claims: combined.quran }, [{ id: "Q1", kind: "quran", arabic: "نص تجريبي", translations: {} }], "en")).toMatchObject({ ok: false, reason: "claim_length" });
});

it.each([false, true])("uses the experimental contract in the actual engine without treating notes as approval (drift=%s)", async drift => {
  const deps = dependencies(), writer = deps.writer.generateJson;
  deps.groundedSourceWriting = true; deps.meaningReview = true;
  const unsafe = "The Prophet guaranteed an automatic reward for every person.";
  let sawNewContract = false, independentlyReviewedUnsafe = false;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt); sawNewContract = true;
    expect(req.system).toContain("Context clauses are generated wording, not evidence or approval");
    const result = withNotes(await writer(req), input);
    if (drift && Array.isArray(result.hadith)) result.hadith[0].text = unsafe;
    // Keep the deliberately unsafe writer unsafe on identity-locked corrections
    // too; a new patch shape must not accidentally turn this into a good rewrite.
    else if (drift && result.hadith && typeof result.hadith === "object") {
      for (const patch of Object.values(result.hadith) as { text: string }[]) patch.text = unsafe;
    }
    return result;
  };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    expect(input).not.toHaveProperty("source_grounding_choices");
    expect(input.claims?.every((c: any) => !Object.hasOwn(c, "grounding"))).not.toBe(false);
    if (input.stage === "narrow_meaning_review_v1") return { claims: Object.fromEntries(input.claims.map((c: any) => {
      if (c.text.includes(unsafe)) independentlyReviewedUnsafe = true;
      return [c.claim_id, { verdict: c.text.includes(unsafe) ? "no" : "yes", explanation: c.text.includes(unsafe) ? "The original does not establish this universal promise." : "" }];
    })) };
    return audit(req.prompt);
  };
  const shown: any[] = []; deps.rich = { onSection: s => shown.push(s) };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(sawNewContract).toBe(true);
  if (drift) {
    expect(independentlyReviewedUnsafe).toBe(true);
    expect(result.status).toBe("incomplete");
    expect(shown.flatMap(s => s.claims).some(c => c.text.includes(unsafe))).toBe(false);
  } else expect(result.status).toBe("rich_answer");
});
