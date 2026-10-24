import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "../lib/ask/rich-engine";
import { pack, dependencies, audit } from "./fixtures/rich";

it.each([true, false])("repairs Arabic-section language and respects the shared correction limit when later guidance is valid: %s", async validGuidance => {
 const local = structuredClone(pack); local.passages = local.passages.slice(0, 1); local.cards = local.cards.slice(0, 1);
 const deps = dependencies(); let corrections = 0;
 deps.writer.generateJson = async request => {
  const p = JSON.parse(request.prompt);
  expect(p.answer_language).toBe("Arabic");
  const correcting = !!p.correction;
  if (correcting) {
   corrections++;
   expect(p.correction.reason_codes).toEqual(expect.arrayContaining(["wrong_language"]));
   expect(p.correction.checker_findings.format_repair_rules.wrong_language).toContain("Arabic");
   expect(p.correction.checker_findings.format_repair_rules.guidance_invalid).toContain("refs []");
  }
  const output: Record<string, unknown> = { status: "answer", no_answer_feedback: [] };
  for (const group of p.sections_to_write) output[group] = [{ text: group === "quran" && !correcting ? "The Quran connects care with daily responsibility."
   : group === "quran" ? "يبين النص أن العناية ترتبط بتحمل المسؤولية في حياة الإنسان اليومية." : "توضح هذه المعاني دور الإنسان في التعامل مع مسؤولياته بعناية واهتمام.", source_ids: ["Q2:183"], requirement_id: "R1" }];
  if (p.sections_to_write.includes("summary")) output.next_step = { text: "راجع النص المذكور وتدبر المعنى الذي يوضحه في هذا الموضوع.", kind: "learning", refs: validGuidance ? [] : ["Q2:183"] };
  return output;
 };
 deps.verifier.generateJson = async request => audit(request.prompt);
 const result = await runRichAnswer(local, "ar", deps, new AbortController().signal, "اشرح هذه المعاني", {});
 expect(result.status).toBe(validGuidance ? "rich_answer" : "incomplete"); expect(corrections).toBe(1);
 if (!validGuidance && result.status === "incomplete") expect(result.sections?.[0].outcome).toBe("ready");
});
