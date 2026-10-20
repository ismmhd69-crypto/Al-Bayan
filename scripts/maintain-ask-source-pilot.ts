import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PrivateSearchIndexStore } from "../lib/ask/search-engine/index-store";

export async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !/^--withdraw-source=[a-f0-9-]{36}$/i.test(arg)) || args.length > 500) throw new Error("invalid_index_maintenance_arguments");
  const withdrawn = args.map(arg => arg.slice("--withdraw-source=".length));
  const result = await new PrivateSearchIndexStore(resolve("work/private-ask-evaluation/source-index-pilot")).prune(new Date(), withdrawn);
  console.log(JSON.stringify({ at: new Date().toISOString(), ...result, databaseWrites: 0, modelCalls: 0 }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { console.error("source_index_maintenance_failed"); process.exitCode = 1; });
