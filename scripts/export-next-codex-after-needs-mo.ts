import fs from "node:fs";

const skip: string[] = ["https://sunnah.com/muslim:447b", "https://sunnah.com/muslim:567a"];
for (let n = 467; n <= 479; n++) {
  skip.push(`https://sunnah.com/muslim:${n}`);
  for (const l of ["a", "b", "c", "d", "e", "f"]) skip.push(`https://sunnah.com/muslim:${n}${l}`);
}
for (let n = 513; n <= 533; n++) {
  skip.push(`https://sunnah.com/muslim:${n}`);
  for (const l of ["a", "b", "c", "d", "e", "f"]) skip.push(`https://sunnah.com/muslim:${n}${l}`);
}
for (let n = 534; n <= 544; n++) {
  skip.push(`https://sunnah.com/muslim:${n}`);
  for (const l of ["a", "b", "c", "d", "e", "f"]) skip.push(`https://sunnah.com/muslim:${n}${l}`);
}
for (let n = 480; n <= 521; n++) {
  skip.push(`https://sunnah.com/muslim:${n}`);
  for (const l of ["a", "b", "c", "d", "e", "f"]) skip.push(`https://sunnah.com/muslim:${n}${l}`);
}
const current = JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-current.json", "utf8")) as { url: string }[];
// Batch 265 inserted the ten records before 567a; after that long record is reviewed, skip only it.
const processedCount = current[0]?.url === "https://sunnah.com/muslim:567a" ? 1
  : current[0]?.url === "https://sunnah.com/muslim:567b" ? 6
  : current[0]?.url === "https://sunnah.com/muslim:572b" ? 6
  : current[0]?.url === "https://sunnah.com/muslim:572h" ? 7
  : current[0]?.url === "https://sunnah.com/muslim:573a" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:577" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:579b" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:583c" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:588e" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:592c" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:594a" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:598a" ? 10
  : current[0]?.url === "https://sunnah.com/muslim:604a" ? 30
  : current[0]?.url === "https://sunnah.com/muslim:619b" ? 30
  : current[0]?.url === "https://sunnah.com/muslim:570a" ? 6
  : 10;
const processedCurrent = current.slice(0, processedCount);
skip.push(...processedCurrent.map((row) => row.url));
const skipPath = "data/hadith-words-translations/codex-needs-mo-skip-next.txt";
fs.writeFileSync(skipPath, skip.join("\n") + "\n", "utf8");
async function main() {
  process.argv = [process.argv[0], "scripts/export-codex-hadith-batch.ts", "--collection=Sahih Muslim", "--size=30", "--out=data/hadith-words-translations/codex-batch-current.json", `--skip-file=${skipPath}`];
  await import("./export-codex-hadith-batch.ts");
}
main();
