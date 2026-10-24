import type { JsonRequest } from "../ai/types";

/** Source prose must not inherit an unchecked sibling's wording or a selector's
 * guessed generality. Keep originals/context, routing and restrictive conditions.
 * This reduces misleading input; it does not establish support or change audits. */
export function independentSourceWritingInput(request: JsonRequest): JsonRequest {
  const input = JSON.parse(request.prompt);
  if (!Array.isArray(input.sections_to_write) || !input.sections_to_write.length
    || input.sections_to_write.includes("summary")) return request;
  if (!Array.isArray(input.evidence_package?.passages)) throw Error("source_writing_package_invalid");
  delete input.source_explanations_already_drafted;
  delete input.source_explanations_status;
  for (const passage of input.evidence_package.passages) {
    if (passage.contribution && typeof passage.contribution === "object") {
      delete passage.contribution.scope;
    }
  }
  return { ...request, prompt: JSON.stringify(input), system: request.system + "\nThis source-writing request contains no sibling draft or selector scope verdict. Derive the actual audience and situation from each cited original and its restrictive context. Routing IDs and role/condition metadata are selection constraints, never independent evidence for a statement or its generality. The complete original/context package and all later independent checks remain in force." };
}
