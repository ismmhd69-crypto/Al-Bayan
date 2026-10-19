import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { sealedPackageJson } from "../lib/ask/core";
import type { EvidencePackage, PassageForSelection, QuestionFrame } from "../lib/ask/retrieval";
import type { Locale } from "../lib/i18n";
type RecordedRow = { id: string; lang: Locale; frame?: QuestionFrame; candidates?: PassageForSelection[];
  calls?: { body: { messages?: { role: string; content: string }[] } }[] };
function readable(p: Record<string, unknown>) { return [p.arabic, p.translation_en, p.translation_de].some((text) => typeof text === "string" && text.trim().length > 0); }
export function replayRecordedWording(path: string) {
  const rows = (JSON.parse(readFileSync(path, "utf8")) as { rows: RecordedRow[] }).rows;
  let appearances = 0, missingBefore = 0, missingAfter = 0, unavailableForReplay = 0;
  const questionIds = new Set<string>();
  for (const row of rows) for (const call of row.calls ?? []) {
    const system = call.body.messages?.find((m) => m.role === "system")?.content;
    if (!system?.startsWith("You write short explanations")) continue;
    const content = call.body.messages?.find((m) => m.role === "user")?.content;
    if (!content) continue;
    const input = JSON.parse(content) as { evidence_package?: { passages: Record<string, unknown>[] } };
    for (const passage of input.evidence_package?.passages ?? []) {
      if (typeof passage.id !== "string" || !passage.id.startsWith("SH")) continue;
      appearances++; questionIds.add(row.id);
      if (!readable(passage)) missingBefore++;
      const candidate = row.candidates?.find((c) => c.id === passage.id);
      if (!candidate || !row.frame) { unavailableForReplay++; continue; }
      const requirementIds = passage.supported_requirement_ids as string[];
      const evidence: EvidencePackage = { question: row.frame,
        passages: [{ ...candidate, requirementIds, facets: row.frame.requiredFacets }], cards: [] };
      const repaired = sealedPackageJson(evidence, row.lang, true).passages[0];
      if (!readable(repaired)) missingAfter++;
    }
  }
  return { recordedRun: path, appearances, questionIds: [...questionIds], missingBefore, missingAfter, unavailableForReplay,
    scope: "Exact recorded selected sources serialized offline; no model calls, semantic judgments or new answer-rate claims" };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
  if (!out) throw new Error("output path required");
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), runs: ["baseline-1", "pilot-1"].map((run) => replayRecordedWording(`docs/ask-repair-runs/${run}.json`)) }, null, 2));
  console.info("recorded wording replay completed without model calls");
}
