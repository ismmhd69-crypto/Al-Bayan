// Experimental source-context-first writing. Context clauses are generated claims,
// never evidence or approval. Case/condition clauses become part of the exact text
// sent through every normal check before display; no independent fact is trusted.
import type { JsonRequest, JsonSchema } from "../ai/types";
import { structuredOutputContract } from "../ai/structured-output";
import { reviewAnchors } from "./review-excerpts";
import { inLanguage } from "./checks";

const scope = ["particular_event", "general_teaching", "conditional_teaching"];
export function groundedWritingRequest(request: JsonRequest): JsonRequest {
  const input = JSON.parse(request.prompt), schema = structuredClone(request.schema);
  if (schema.type !== "object" || !Array.isArray(input.sections_to_write) || !input.evidence_package?.passages) throw Error("grounded_writing_input_invalid");
  const ids = input.evidence_package.passages.map((p: any) => p.id);
  const anchors = reviewAnchors([{ text: "Source context", refs: ids }], input.evidence_package).C1;
  input.source_grounding_choices = anchors;
  for (const group of input.sections_to_write) {
    const section = schema.properties[group];
    if (section?.type !== "array") continue; // Existing identity-locked text patches keep their contract.
    if (section.items.type !== "object") throw Error("grounded_writing_claim_schema_invalid");
    const p = section.items.properties;
    const grounding: JsonSchema = { type: "array", maxItems: 6, items: { type: "object", properties: {
      source_id: structuredClone(p.source_ids.type === "array" ? p.source_ids.items : { type: "string" }),
      anchor_id: { type: "string", enum: anchors.length ? anchors.map(a => a.anchor_id) : ["__no_original__"] },
      treatment: { type: "string", enum: scope }, context_clause: { type: "string", maxLength: 120,
        description: input.answer_language === "Arabic" ? "عبارة عربية قصيرة، بلا نقطة أو اقتباس، تحدد المخاطب والحالة والقيد أو التصرف الصريح في النص" : "A short clause in the answer language naming the actual subject, situation and explicit condition or response; no sentence-ending punctuation or quotation" },
    }, required: ["source_id", "anchor_id", "treatment", "context_clause"] } };
    section.items.properties = { source_ids: p.source_ids, grounding, requirement_id: p.requirement_id, text: p.text };
    section.items.required = ["source_ids", "grounding", "requirement_id", "text"];
  }
  return { ...request, schema, prompt: JSON.stringify(input), system: request.system + `
Before composing EACH sentence, choose source_ids, then grounding, then requirement_id, then text. For grounding read the actual originals, not a selector's generated scope label. Identify whether each original reports a particular event, states a general teaching, or states a conditional teaching. context_clause MUST be in the answer language, briefly naming the actual subject, situation and explicit condition or response. Use a clause, not a separate sentence or quotation. Include an original anchor for every cited source. Context clauses are generated wording, not evidence or approval.
The server attaches a case/condition clause to the explanation before checking it, so that scope cannot disappear. Keep context_clause and text together short enough for the existing 300-character claim limit including a short scope prefix. Do not repeat the same case details in both. General-teaching context clauses are drafting context only. Then explain only what those originals establish. A question's broad wording cannot broaden an original; synthesis must preserve case limits too. Do not quote source wording in either clause or explanation. Return no_answer rather than manufacture a missing general rule.` };
}

export function unwrapGroundedWriting(raw: unknown, request: JsonRequest): unknown | null {
  if (structuredOutputContract(request.schema).parse(JSON.stringify(raw)) === null) return null;
  const input = JSON.parse(request.prompt), value = structuredClone(raw) as any;
  const anchors = input.source_grounding_choices as { anchor_id: string; source_id: string }[];
  const language = input.answer_language === "Arabic" ? "ar" : input.answer_language === "German" ? "de" : "en";
  if (!Array.isArray(anchors)) return null;
  for (const group of input.sections_to_write) {
    if (!Array.isArray(value[group])) continue;
    for (const claim of value[group]) {
      if (!claim.source_ids.length || !claim.grounding.length || new Set(claim.grounding.map((g: any) => g.anchor_id)).size !== claim.grounding.length
        || claim.source_ids.some((id: string) => !claim.grounding.some((g: any) => g.source_id === id))
        || claim.grounding.some((g: any) => !claim.source_ids.includes(g.source_id) || !g.context_clause.trim() || !inLanguage(g.context_clause, language)
          || !anchors.some(a => a.anchor_id === g.anchor_id && a.source_id === g.source_id))) return null;
      const bounded = claim.grounding.filter((g: any) => g.treatment !== "general_teaching");
      if (bounded.length) {
        const context = [...new Set(bounded.map((g: any) => g.context_clause.trim()))].join(language === "ar" ? "؛ " : "; ");
        const event = bounded.some((g: any) => g.treatment === "particular_event");
        const prefix = language === "ar" ? event ? "في الحالة التي يصفها النص" : "ضمن الشرط الوارد في النص"
          : language === "de" ? event ? "Im beschriebenen Fall" : "Unter der genannten Bedingung"
            : event ? "In the case described in the text" : "Under the stated condition";
        claim.text = `${prefix} (${context})${language === "ar" ? "،" : ","} ${claim.text}`;
      }
      delete claim.grounding;
    }
  }
  return value;
}
