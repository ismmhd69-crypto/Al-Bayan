import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { audit, dependencies, pack } from "./fixtures/rich";

it.each([false, true])("a text-only correction remains subject to its own independent meaning review (drift=%s)", async drift => {
  const local = structuredClone(pack), deps = dependencies(), writer = deps.writer.generateJson;
  if (local.passages[1].source.kind !== "hadith") throw Error("fixture");
  local.passages[1].source.hadith.translations.en = "A patient person can face difficult circumstances with steady care.";
  const replacement = drift ? "The Prophet promised automatic absolution for every action." : "The Prophet connected careful conduct with responsibility toward others.";
  let corrections = 0, reviewedReplacement = false;
  deps.meaningReview = true;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.sections_to_write.includes("hadith")) return result;
    if (!input.correction) result.hadith[0].text = "The Prophet taught that a patient person can face difficult circumstances.";
    else {
      corrections++;
      const patch = input.correction.checker_findings.sentence_patches.find((p: any) => p.group === "hadith");
      expect(patch.findings[0]).toMatchObject({ assigned_concern: "Explain care", source_ids: ["HE9001"] });
      expect(patch.findings[0].cited_originals.map((p: any) => p.id)).toEqual(["HE9001"]);
      expect(patch.findings[0].preserve_meaning).toContain("Do not replace it with a neighbouring sentence");
      result.hadith.P0.text = replacement;
    }
    return result;
  };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.stage === "narrow_meaning_review_v1") return { claims: Object.fromEntries(input.claims.map((c: any) => {
      if (c.text === replacement) { reviewedReplacement = true; expect(c.originals.map((p: any) => p.source_id)).toEqual(["HE9001"]); }
      return [c.claim_id, { verdict: drift && c.text === replacement ? "no" : "yes", explanation: drift && c.text === replacement ? "Its own original does not establish this asserted promise." : "" }];
    })) };
    // Deliberately overconfident primary review, like the recorded failure.
    return audit(req.prompt);
  };
  const shown: any[] = [];
  deps.rich = { onSection: s => shown.push(s) };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(corrections).toBe(1); expect(reviewedReplacement).toBe(true);
  if (drift) {
    expect(result.status).toBe("incomplete");
    expect(shown.flatMap(s => s.claims).some(c => c.text === replacement)).toBe(false);
  } else expect(result.status).toBe("rich_answer");
});

it("assigns each source writer only its available concerns while retaining the whole question for context", async () => {
  const local = structuredClone(pack), deps = dependencies(), writer = deps.writer.generateJson;
  local.question.requirements.push({ id: "R2", text: "A separate test concern", facet: "general" });
  local.passages[1].requirementIds = ["R2"];
  let seen = false;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.sections_to_write.includes("hadith")) {
      seen = true;
      expect(input.source_group_scope.hadith).toMatchObject({ must_answer_every_question_concern: false,
        concerns_with_selected_direct_evidence: [{ requirement_id: "R2", concern: "A separate test concern" }] });
      expect(input.evidence_package.question.requirements).toHaveLength(2);
    }
    return writer(req);
  };
  await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain both concerns", {});
  expect(seen).toBe(true);
});
