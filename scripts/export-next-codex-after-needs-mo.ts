import fs from "node:fs";

const skip: string[] = ["https://sunnah.com/muslim:447b"];
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
skip.push(...current.map((row) => row.url));
fs.writeFileSync("data/hadith-words-translations/codex-needs-mo-skip.txt", skip.join("\n") + "\n", "utf8");
async function main() {
  process.argv = [process.argv[0], "scripts/export-codex-hadith-batch.ts", "--collection=Sahih Muslim", "--size=30", "--out=data/hadith-words-translations/codex-batch-current.json", "--skip-file=data/hadith-words-translations/codex-needs-mo-skip.txt"];
  await import("./export-codex-hadith-batch.ts");
}
main();
