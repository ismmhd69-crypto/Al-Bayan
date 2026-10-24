// Offline actual-engine capture. Scripted checker approvals deliberately reproduce
// the false-positive condition; they provide no religious-accuracy evidence.
import type { JsonRequest } from "../lib/ai/types";
import { runRichAnswer } from "../lib/ask/rich-engine";
import { recordedFocusedControl } from "./probe-ask-focused-recorded";
import { dependencies, strictAudit } from "../tests/fixtures/rich";

export async function prepareCaseReferentRepair() {
  const control = recordedFocusedControl(), deps = dependencies();
  let captured: JsonRequest | undefined;
  deps.writer.generateJson = async request => {
    const p = JSON.parse(request.prompt);
    if (p.correction?.reason_codes.includes("case_referent_generalized")) {
      if (captured) throw Error("repeated_correction_capture");
      captured = { ...request, signal: undefined };
      return null; // No paid dispatch or automatic writer correction in preparation.
    }
    if (p.sections_to_write.includes("summary")) return null;
    return { status: "answer", no_answer_feedback: [], ...Object.fromEntries(p.sections_to_write.map((group: string) => [group,
      control.items.filter((c: any) => c.refs.every((id: string) => group === "quran" ? id.startsWith("Q") : id.startsWith("HE")))
        .map((c: any) => ({ text: c.text, source_ids: c.refs, requirement_id: c.requirementId }))])) };
  };
  deps.verifier.generateJson = async request => strictAudit(request.prompt);
  await runRichAnswer(control.pack, "ar", deps, new AbortController().signal, JSON.parse(control.control.request.prompt).visitor_question, {});
  if (!captured || captured.maxOutputTokens !== 2200) throw Error("ordinary_source_correction_not_captured");
  const p = JSON.parse(captured.prompt);
  if (JSON.stringify(p.sections_to_write) !== '["hadith"]' || !p.correction.checker_findings.support_failures.some((f: any) => f.code === "case_referent_generalized")) throw Error("specific_guard_feedback_missing");
  return { request: captured, pack: control.pack, traceHash: control.control.traceHash };
}
