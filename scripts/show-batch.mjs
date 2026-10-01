import fs from "node:fs";
const n = String(process.argv[2]).padStart(3, "0");
const b = JSON.parse(fs.readFileSync(`docs/binbaz-batches/batch-${n}.json`, "utf8"));
for (const c of b.candidates) console.log(`#${c.url.match(/fatwas\/(\d+)\//)[1]} | ${c.title}\n${c.quote}\n`);
