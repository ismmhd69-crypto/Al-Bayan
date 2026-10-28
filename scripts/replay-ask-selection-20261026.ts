// Offline contract replay. Reconstructs source snapshots from a saved selection
// request; does not fetch sources, rerun a model or approve religious wording.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseEvidencePackage, type PassageForSelection } from "../lib/ask/retrieval";

const trace = "1347add9-4c58-4c45-a7d5-89ed01ac1dca";
const rows = readFileSync(resolve("work/local-ask-traces", `${trace}.jsonl`), "utf8").trim().split(/\r?\n/).map(line => JSON.parse(line));
const request = rows.find(row => row.event === "model_request" && row.data.call_id === "A12").data.prompt;
const response = rows.find(row => row.event === "model_response" && row.data.call_id === "A12").data.value;
const candidates: PassageForSelection[] = request.candidates.map(({ source }: any) => {
  if (source.type !== "quran" || !/^Q\d+:\d+$/.test(source.id) || typeof source.arabic !== "string") throw Error("unexpected_saved_source");
  const key = source.id.slice(1);
  return { id: source.id, source: { kind: "quran", verse: { key, arabic: source.arabic, arabicPlain: source.arabic,
    translations: { en: source.translation_en ?? null, de: null }, url: `https://quran.com/${key.replace(":", "/")}` } }, context: [] };
});
const reasons: string[] = [];
const result = parseEvidencePackage(response, request.question, candidates, { requireContributions: true, partialPreview: true }, code => reasons.push(code));
if (result !== null || reasons.at(-1) !== "no_direct_evidence_with_requirements") throw Error("saved_negative_control_changed");
const report = { trace, call: "A12", candidateCount: candidates.length, recordedRejection: "source_scope_mismatch",
  currentReasons: reasons, selected: 0, assertion: "Excluding a scope-uncertain candidate does not invent support from the remaining recorded verdicts.",
  limitations: "Source identities/context are saved snapshots, not freshly revalidated. This proves parser behavior, not semantic answer quality.", modelCalls: 0 };
const root = resolve("work/private-ask-evaluation/reliability-20261026"); mkdirSync(root, { recursive: true });
writeFileSync(resolve(root, "selection-replay.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
