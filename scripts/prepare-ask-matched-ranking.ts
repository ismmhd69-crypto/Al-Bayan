// Offline request preflight only. No provider, network, labels, inference or ledger mutation.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareMatchedRanking, type MatchedRankingInput } from "../lib/ask/search-engine/matched-ranking";
import { pipelineMeaningRanker } from "../lib/ask/search-engine/pipeline-ranking";
import { meaningRerankingRequest } from "../lib/ask/search-engine/reranker";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export async function main() {
  const args = process.argv.slice(2), root = resolve("work/private-ask-evaluation");
  if (!args.includes("--dry-run") || args.some(a => a !== "--dry-run" && !a.startsWith("--input=") && !a.startsWith("--out="))) throw Error("matched_ranking_preflight_only");
  const input = args.find(a => a.startsWith("--input="))?.slice(8), output = args.find(a => a.startsWith("--out="))?.slice(6);
  if (!input || !output || !resolve(input).startsWith(root + sep) || !resolve(output).startsWith(root + sep) || existsSync(output)) throw Error("use_private_input_and_new_report_path");
  const body = readFileSync(input, "utf8"), document = JSON.parse(body) as { version: unknown; cases: MatchedRankingInput[] };
  if (document.version !== 1 || !Array.isArray(document.cases) || !document.cases.length || document.cases.length > 300
    || new Set(document.cases.map(c => c.id)).size !== document.cases.length) throw Error("matched_ranking_manifest_invalid");
  const cases = [];
  for (const item of document.cases) {
    const prepared = prepareMatchedRanking(item), requests: string[] = [];
    // The real pipeline adapter enumerates its exact concern/context requests.
    // Zero scores are placeholders only; no ranking result or quality metric is saved.
    await pipelineMeaningRanker(async (concern, passages) => {
      requests.push(hash(meaningRerankingRequest(concern, passages)));
      return passages.map(p => ({ id: p.id, score: 0 }));
    }, undefined, prepared.input.limit)(prepared.input.frame, prepared.input.candidates, new AbortController().signal);
    cases.push({ id: item.id, language: item.frame.language, inputHash: prepared.inputHash, commonPoolHash: prepared.commonPoolHash,
      candidates: prepared.input.candidates.length, limit: item.limit, baselineIds: prepared.baselineIds, rankingRequestHashes: requests,
      review: "pending", freshSourcePermissions: "not_checked_by_offline_preflight" });
  }
  const report = { version: 1, at: new Date().toISOString(), status: "preflight_only_no_models_or_selection", manifestHash: hash(body),
    codeFingerprints: Object.fromEntries(["lib/ask/search-engine/matched-ranking.ts", "lib/ask/search-engine/pipeline-ranking.ts", "lib/ask/search-engine/reranker.ts",
      "lib/ask/search-engine/reranker-result.ts", "lib/ask/search-engine/concern-meaning.ts", "lib/ask/search-engine/research-candidate-pool.ts",
      "lib/ask/search-engine/pipeline-corpus.ts", "lib/ask/search-engine/candidate-identity.ts", "lib/ask/patient-models.ts", "lib/ask/retrieval.ts",
      "lib/ask/package.ts", "lib/ask/contribution-plan.ts", "scripts/prepare-ask-matched-ranking.ts"]
      .map(path => [path, hash(readFileSync(path, "utf8"))])), cases, modelCalls: 0, costUsd: 0,
    sourceFaithfulness: "not_established", recall: null, answerAccuracy: null, liveComparison: "blocked_until_billing_reconciliation_review_and_current_permission_validation",
    note: "Equal frozen candidate/context access and equal downstream caps for ranking isolation. Order baseline is concern/family order, not the old website's upstream retrieval. No held-out retrieval, ranking benefit or speed improvement measured." };
  mkdirSync(dirname(resolve(output)), { recursive: true }); writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ report: resolve(output), cases: cases.length, rankingRequestsPrepared: cases.reduce((n, c) => n + c.rankingRequestHashes.length, 0), modelCalls: 0, costUsd: 0 }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { console.error("matched ranking preflight failed; no model calls started"); process.exitCode = 1; });
