// Fixed public discovery hints only. No Ask/model call, configuration change or write to any server.
import { loadEnvConfig } from "@next/env";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getHadith } from "../lib/sources/hadith";
import { findLibraryHadithByReference } from "../lib/sources/hadith-library";
import { resolveLibraryHadithHint } from "../lib/ask/hadith-hints";

async function main() {
  loadEnvConfig(process.cwd());
  if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname !== "jnietkyxgnocyizvjiel.supabase.co") throw Error("wrong_project");
  const fetcher = globalThis.fetch;
  globalThis.fetch = async (target, init) => {
    const url = new URL(typeof target === "string" ? target : target instanceof URL ? target.href : target.url);
    const method = init?.method ?? (target instanceof Request ? target.method : "GET");
    const library = url.hostname === "jnietkyxgnocyizvjiel.supabase.co" && (["GET", "HEAD"].includes(method)
      || method === "POST" && url.pathname === "/rest/v1/rpc/search_approved_source_candidates");
    const hint = url.origin === "https://hadeethenc.com" && url.pathname === "/api/v1/hadeeths/one/" && method === "GET"
      && url.searchParams.get("language") === "ar" && ["66511", "66512"].includes(url.searchParams.get("id") ?? "");
    if (!library && !hint) throw Error("hint_review_read_only_violation");
    return fetcher(target, init);
  };
  try {
    const results = [];
    for (const id of ["HE66511", "HE66512"]) {
      const hints: unknown[] = [];
      const found = await resolveLibraryHadithHint(id, async key => { const h = await getHadith(key, "ar"); hints.push(h); return h; }, findLibraryHadithByReference);
      results.push({ id, hints, stored: found });
      console.log(JSON.stringify({ id, stored: found.map(h => ({ id: h.id, numbers: h.numbers, originalChars: h.arabic.length })), outcome: found.length ? "resolved_for_independent_selection" : "unresolved" }));
    }
    const root = resolve("work/private-ask-evaluation/reliability-20261026"); mkdirSync(root, { recursive: true });
    writeFileSync(resolve(root, "library-hints.json"), JSON.stringify({ at: new Date().toISOString(), readOnly: true, modelCalls: 0,
      scope: "Bibliographic discovery compatibility and current approved-search eligibility. No equivalence or religious meaning approval.", results }, null, 2), { mode: 0o600 });
  } finally { globalThis.fetch = fetcher; }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
