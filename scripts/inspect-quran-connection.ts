// Bounded source-only diagnosis. No model calls, visitor-question logging or secret output.
import { existsSync } from "node:fs";

async function main() {
  if (!process.argv.includes("--live-source-only")) { console.log("No calls. Pass --live-source-only for two Quran searches and one verse read."); return; }
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  process.env.ASK_LOCAL_TRACE = "false";
  const { searchQuran, getVerse } = await import("../lib/sources/quran");
  const started = Date.now(), failures: string[] = [];
  const [search, verse] = await Promise.allSettled([
    searchQuran(["controlling anger words actions", "والكاظمين الغيظ والعافين عن الناس"], 16, undefined, code => failures.push(code)),
    getVerse("3:134"),
  ]);
  console.log(JSON.stringify({ elapsedMs: Date.now() - started,
    search: search.status === "fulfilled" ? { status: "fulfilled", count: search.value.length, keys: search.value } : { status: "failed", kind: search.reason?.name, message: search.reason?.message },
    verse: verse.status === "fulfilled" ? { status: "fulfilled", found: !!verse.value, arabicChars: verse.value?.arabic.length, englishAvailable: !!verse.value?.translations.en }
      : { status: "failed", kind: verse.reason?.name, message: verse.reason?.message },
    failures, modelCalls: 0 }));
  if (search.status !== "fulfilled" || verse.status !== "fulfilled" || !verse.value) process.exitCode = 1;
}
main().catch(() => { console.error("Quran source diagnosis failed; no secrets printed."); process.exitCode = 1; });
