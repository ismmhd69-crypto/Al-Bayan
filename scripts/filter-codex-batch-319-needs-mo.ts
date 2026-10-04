import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-probe10.json", "utf8")) as any[];
const done = new Set(JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-319.json", "utf8")).map((r: any) => r.url));
const skipped = rows.filter(r => !done.has(r.url)).map(r => r.url);
fs.appendFileSync("data/hadith-words-translations/codex-needs-mo-skip-next.txt", skipped.join("\n") + "\n", "utf8");
console.log(`needs-mo=${skipped.length}`);
