import type { JsonRequest } from "../ai/types";

/** Owner-only experiment, not imported by the active answer engine.
 * A text-only copy repair cannot change citations or untouched sentences.
 * Supply just the originals needed by those locked edits, retaining all their
 * restrictions. Never apply this reduction to semantic, merge or summary repair. */
export function isolateCopyRepair(request: JsonRequest): JsonRequest {
  const input = JSON.parse(request.prompt), correction = input.correction;
  const groups = input.sections_to_write;
  if (!correction || !Array.isArray(groups) || !groups.length || groups.includes("summary")) return request;
  if (!Array.isArray(correction.reason_codes) || !correction.reason_codes.includes("copied_source")
    || correction.reason_codes.some((r: unknown) => r !== "copied_source" && r !== "failed_section_draft")) return request;
  const feedback = correction.checker_findings, patches = feedback?.sentence_patches;
  if (!feedback || !Array.isArray(patches) || patches.length !== groups.length
    || new Set(patches.map((p: any) => p?.group)).size !== groups.length
    || patches.some((p: any) => !groups.includes(p.group))
    || ["support_failures", "contribution_failures", "citation_failures", "source_merge_plan", "reference_failures"].some(k => !Array.isArray(feedback[k]) || feedback[k].length)
    || !Array.isArray(feedback.format_failures) || !feedback.format_failures.length
    || feedback.format_failures.some((f: any) => !groups.includes(f.group) || f.reason !== "copied_source")) return request;
  const passages = input.evidence_package?.passages;
  if (!Array.isArray(passages) || new Set(passages.map((p: any) => p?.id)).size !== passages.length || request.schema.type !== "object") throw Error("copy_repair_package_invalid");
  const ids = new Set<string>();
  for (const patch of patches) {
    const section = request.schema.properties[patch.group];
    if (!section || section.type !== "object" || !Array.isArray(patch.replace_indices) || !patch.replace_indices.length
      || new Set(patch.replace_indices).size !== patch.replace_indices.length || !Array.isArray(patch.findings)
      || patch.findings.length !== patch.replace_indices.length
      || section.required.length !== patch.replace_indices.length
      || Object.keys(section.properties).length !== patch.replace_indices.length) return request;
    for (const index of patch.replace_indices) {
      const findings = patch.findings.filter((f: any) => f?.index === index);
      if (!Number.isSafeInteger(index) || index < 0 || !section.required.includes(`P${index}`) || findings.length !== 1) throw Error("copy_repair_layout_invalid");
      const f = findings[0];
      if (typeof f.rejected_text !== "string" || !f.rejected_text.trim() || !Array.isArray(f.source_ids) || !f.source_ids.length
        || new Set(f.source_ids).size !== f.source_ids.length || !Array.isArray(f.cited_originals) || f.cited_originals.length !== f.source_ids.length) throw Error("copy_repair_identity_invalid");
      for (const id of f.source_ids) {
        const original = passages.find((p: any) => p.id === id), matching = f.cited_originals.filter((p: any) => p?.id === id);
        if (!original || matching.length !== 1 || original.type !== patch.group || original.arabic !== matching[0].arabic) throw Error("copy_repair_original_changed");
        ids.add(id);
      }
    }
  }
  const next = structuredClone(input);
  // Keep each full own original and surrounding_context, not a clipped proof.
  next.evidence_package.passages = next.evidence_package.passages.filter((p: any) => ids.has(p.id));
  delete next.source_explanations_already_drafted;
  delete next.source_explanations_status;
  next.citable_source_ids_by_section = Object.fromEntries(groups.map((g: string) => [g, next.evidence_package.passages.filter((p: any) => p.type === g).map((p: any) => p.id)]));
  next.correction.rejected_draft = patches.map((p: any) => ({ group: p.group, rejected_sentences: p.findings.map((f: any) => ({ index: f.index, text: f.rejected_text, source_ids: f.source_ids })) }));
  // Other draft claims are not proof or needed for locked text edits. Negative
  // semantic findings cause the function to abstain above, never get discarded.
  delete next.correction.checker_findings.claims;
  return { ...request, prompt: JSON.stringify(next), system: request.system + "\nThis is an isolated copy-only text repair. The server preserves every citation identity and all untouched sentences. Only rewrite the indicated sentence structure using its own full originals and restrictions. Do not add causes, reasons, beneficiaries or promises to make the wording different. Other source sections and final question coverage are handled separately. All normal copy, meaning, context and final checks still run." };
}
