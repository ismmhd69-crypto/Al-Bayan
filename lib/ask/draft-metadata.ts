/** Remove only an exact duplicate of the structured citation/requirement fields.
 * Religious wording is untouched and still passes parsing and independent checking. */
export function removeDuplicateDraftMetadata(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map(claim => {
    if (!claim || typeof claim !== "object" || typeof claim.text !== "string"
      || !Array.isArray(claim.source_ids) || typeof claim.requirement_id !== "string") return claim;
    const match = claim.text.match(/\s+\[([^\]\r\n]+)\]\s+(R[1-9]\d*)\s*$/u);
    if (!match || match[2] !== claim.requirement_id) return claim;
    const refs = match[1].split(",").map((id: string) => id.trim());
    if (new Set(refs).size !== refs.length || refs.length !== claim.source_ids.length
      || !refs.every((id: string) => claim.source_ids.includes(id))) return claim;
    return { ...claim, text: claim.text.slice(0, match.index).trimEnd() };
  });
}
