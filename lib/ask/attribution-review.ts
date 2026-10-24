import type { Claim } from "./checks";

type AttributionFinding = { claim_id: string; verdict: "yes" | "no" | "unsure" };

/** Identity completeness is a checker contract, distinct from a negative finding.
 * Read complete legacy arrays without inventing missing approvals. New requests use keyed rows. */
export function parseAttributionReview(raw: unknown, items: Claim[]): AttributionFinding[] | null {
  if (!raw || typeof raw !== "object") return null;
  const ids = items.map((_, i) => `C${i + 1}`);
  const rows: unknown[] = Array.isArray(raw) ? raw : Object.entries(raw).map(([key, row]) =>
    row && typeof row === "object" && !Array.isArray(row) && (row as Record<string, unknown>).claim_id === key ? row : null);
  if (rows.length !== ids.length) return null;
  const findings: AttributionFinding[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const { claim_id, verdict } = row as Record<string, unknown>;
    if (typeof claim_id !== "string" || !ids.includes(claim_id) || findings.some(f => f.claim_id === claim_id)
      || !["yes", "no", "unsure"].includes(verdict as string)) return null;
    findings.push({ claim_id, verdict: verdict as AttributionFinding["verdict"] });
  }
  return findings;
}
