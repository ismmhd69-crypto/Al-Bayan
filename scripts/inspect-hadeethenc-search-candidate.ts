// Single public Arabic source read for an owner-only discovery control.
// No model call, anonymous explanation, production import or automatic retry.
import { existsSync } from "node:fs";
import { parseHadith } from "../lib/sources/hadith-rules";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";
async function main() {
  const id = process.argv.find(v => v.startsWith("--id="))?.slice(5);
  if (!id || !/^[1-9]\d{0,8}$/u.test(id)) throw Error("one_canonical_public_source_id_required");
  const path = `work/private-ask-evaluation/hadeethenc-official-search-candidate-${id}-20261024.json`;
  if (existsSync(path)) throw Error("completed_source_read_not_repeated");
  const response = await fetch(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (!response.ok) throw Error("official_source_read_failed_no_retry");
  const a = await response.json() as any;
  if (a?.id !== id || typeof a.title !== "string" || typeof a.hadeeth !== "string") throw Error("source_identity_or_original_invalid");
  const h = parseHadith(a, null, null);
  const report = { id, title: a.title, original: a.hadeeth, grade: a.grade, attribution: a.attribution, reference: a.reference,
    acceptedByCurrentRules: !!h, numbers: h?.numbers, originalHash: digest(a.hadeeth), anonymousExplanationUsed: false, modelCalls: 0 };
  persistCampaign(path, report);
  console.log(JSON.stringify({ id, title: report.title, acceptedByCurrentRules: report.acceptedByCurrentRules,
    numbers: report.numbers, originalChars: report.original.length, originalHash: report.originalHash, modelCalls: 0 }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "source_read_failed"); process.exitCode = 1; });
