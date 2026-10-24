// Source transport only. No model, database, prepared-answer or evaluation import.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  if (!process.argv.includes("--online-source-check-only")) throw Error("explicit_source_only_probe_required");
  const path = resolve("work/private-ask-evaluation/source-requests-20261023.json");
  if (existsSync(path)) throw Error("source_probe_already_recorded_no_automatic_repeat");
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_UNHURRIED: "true", ASK_LOCAL_TRACE: "false" });
  const { getHadith } = await import("../lib/sources/hadith");
  const rows = [];
  // Original identities used by the recorded worship attempts, not source hints
  // added to a visitor question. This probes the actual approved-source reader.
  for (const id of ["65007", "65936"]) {
    const started = Date.now();
    try {
      const source = await getHadith(id);
      rows.push({ id: `HE${id}`, status: source ? "eligible_original_returned" : "record_not_eligible_or_not_understood",
        durationMs: Date.now() - started, ...(source ? { originalCharacters: source.arabic.length,
          englishAvailable: !!source.translations.en, germanAvailable: !!source.translations.de } : {}) });
    } catch (error) {
      rows.push({ id: `HE${id}`, status: "source_request_failed", durationMs: Date.now() - started,
        failure: error instanceof Error && error.name === "TimeoutError" ? "request_timeout" : "connection_or_response_failure" });
    }
  }
  const result = { at: new Date().toISOString(), scope: "actual_source_connections_only", unhurriedLocalMode: true,
    totalAnswerDeadlineAdded: false, newModelCalls: 0, newModelCost: 0, rows,
    establishesReligiousAnswerAccuracy: false, establishesFullSearchLatency: false };
  mkdirSync(resolve("work/private-ask-evaluation"), { recursive: true });
  writeFileSync(path, JSON.stringify(result, null, 2), { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log(JSON.stringify(result));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "source_probe_failed"); process.exitCode = 1; });
