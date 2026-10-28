/** Encode scripted selections in the model's requested short-reference contract. */
export function selectionReply(input: any, value: any) {
  if (input.selection_contract !== "candidate_refs_v1") return value;
  const reference = (id: string) => input.candidates.find((c: any) => c.source.id === id)?.candidate_ref ?? "INVALID_REFERENCE";
  return { ...value, selection_contract: input.selection_contract,
    assessments: value.assessments.map(({ source_id, ...fields }: any) => ({ ...fields, source_ref: reference(source_id) })),
    ...(value.evidence_plan ? { evidence_plan: value.evidence_plan.map((row: any) => ({ ...row, source_ids: row.source_ids.map(reference) })) } : {}),
  };
}
