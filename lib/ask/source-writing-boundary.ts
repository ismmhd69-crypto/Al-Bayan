import type { JsonRequest } from "@/lib/ai/types";

/** Source explanations receive only originals they can actually cite, plus
 * each original's attached restrictive context. Whole-answer checks still see
 * the full package. Does not establish entailment or select new evidence. */
export function sourceWritingBoundary(request: JsonRequest): JsonRequest {
  const input = JSON.parse(request.prompt);
  const groups = input.sections_to_write;
  if (!Array.isArray(groups) || !groups.length || groups.includes("summary")) return request;
  if (!groups.every(g => ["quran", "hadith", "scholar"].includes(g)) || !Array.isArray(input.evidence_package?.passages)
    || groups.some(g => !Array.isArray(input.citable_source_ids_by_section?.[g]))) throw Error("source_writing_boundary_invalid");
  const ids = new Set(groups.flatMap(g => input.citable_source_ids_by_section[g]));
  input.evidence_package.passages = input.evidence_package.passages.filter((p: { id: string }) => ids.has(p.id));
  // Generated planning prose and unchecked sibling drafts are not evidence and
  // can introduce a wider teaching before its actual source is available here.
  delete input.evidence_package.contribution_plan;
  delete input.source_explanations_already_drafted;
  delete input.source_explanations_status;
  if (!groups.includes("scholar")) delete input.scholar_attribution_names;
  input.citable_source_ids_by_section = Object.fromEntries(groups.map(g => [g, input.citable_source_ids_by_section[g]]));
  return { ...request, prompt: JSON.stringify(input), system: request.system + "\nSource-writing boundary: only originals citable by the requested source sections are included. Do not borrow a wider rule from another section, rejected draft, planning text or familiar knowledge. Keep every attached context restriction. If a source supports only a limited example, explain that example. Summary synthesis and full combined-source checking happen separately." };
}
