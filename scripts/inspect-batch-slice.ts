import fs from "node:fs";

const batchNum = process.argv[2] || "005";
const start = parseInt(process.argv[3] || "0", 10);
const end = parseInt(process.argv[4] || "20", 10);

const file = `data/hadith-split/batch-${batchNum.padStart(3, "0")}.json`;
const data = JSON.parse(fs.readFileSync(file, "utf8"));

for (let i = start; i < Math.min(end, data.length); i++) {
  const item = data[i];
  console.log(`\n================== ITEM ${i} | ${item.url} ==================`);
  console.log(item.text_original);
}
