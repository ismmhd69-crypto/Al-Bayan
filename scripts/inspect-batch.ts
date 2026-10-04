import fs from "fs";

const items = JSON.parse(fs.readFileSync("data/hadith-split/batch-001.json", "utf8"));
const lines: string[] = [];

items.forEach((it: any, idx: number) => {
  const t = it.text_original;
  lines.push(`=== [${idx + 1}] ${it.url} (ID: ${it.id}) ===`);
  lines.push(t);
  lines.push("");
});

fs.writeFileSync("data/hadith-split/batch-001-inspected.txt", lines.join("\n"), "utf8");
console.log("Wrote inspected text to data/hadith-split/batch-001-inspected.txt");
