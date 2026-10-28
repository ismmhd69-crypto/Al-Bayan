// Read-only discovery acceptance: fixed public topics, no Ask/model calls or writes.
import { loadEnvConfig } from "@next/env";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { searchLibraryHadith } from "../lib/sources/hadith-library";
import { searchScholarQuotes } from "../lib/sources/scholars";
import { hadithAllowed } from "../lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "../lib/sources/scholar-rules";

async function main() {
  loadEnvConfig(process.cwd());
  if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname !== "jnietkyxgnocyizvjiel.supabase.co") throw Error("wrong_project");
  const fetcher = globalThis.fetch;
  globalThis.fetch = async (target, init) => {
    const url = new URL(typeof target === "string" ? target : target instanceof URL ? target.href : target.url);
    const method = init?.method ?? (target instanceof Request ? target.method : "GET");
    if (url.hostname !== "jnietkyxgnocyizvjiel.supabase.co" || !["GET", "HEAD"].includes(method)
      && !(method === "POST" && url.pathname === "/rest/v1/rpc/search_approved_source_candidates")) throw Error("readiness_read_only_violation");
    return fetcher(target, init);
  };
  const cases = [
    { id: "promises", queries: ["الوفاء بالوعد", "إخلاف الوعد"] },
    { id: "parents", queries: ["طاعة الوالدين", "الإحسان إلى الوالدين"] },
    { id: "islam-truth", queries: ["دلائل صحة الإسلام", "أدلة صدق الرسول"] },
  ];
  const root = resolve("work/private-ask-evaluation/reliability-20261026"); mkdirSync(root, { recursive: true });
  try {
    const results = [];
    for (const item of cases) {
      const audits: unknown[] = [];
      const [hadith, scholars] = await Promise.all([
        searchLibraryHadith({ ar: item.queries }, { meaningCandidates: true, onAudit: a => audits.push(a) }),
        searchScholarQuotes(item.queries, 8, { allVariants: true, meaningCandidates: true, onAudit: a => audits.push(a) }),
      ]);
      if (hadith.some(h => !hadithAllowed(h)) || scholars.some(s => !scholarQuoteAllowed(s))) throw Error("ineligible_discovery_result");
      const report = { id: item.id, audits, hadith, scholars };
      results.push(report);
      console.log(JSON.stringify({ id: item.id, hadith: hadith.map(h => ({ id: h.id, collection: h.collection, numbers: h.numbers, originalChars: h.arabic.length })),
        scholars: scholars.map(s => ({ id: s.id, originalChars: s.arabic.length })), audits }));
    }
    writeFileSync(resolve(root, "library-readiness.json"), JSON.stringify({ at: new Date().toISOString(), readOnly: true, modelCalls: 0,
      scope: "Existing approved discovery routes and original source eligibility. Results still require relevance, meaning and context review.", results }, null, 2), { mode: 0o600 });
  } finally { globalThis.fetch = fetcher; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(e => { console.error(e.message); process.exitCode = 1; });
