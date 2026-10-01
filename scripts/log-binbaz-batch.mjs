import fs from "node:fs";
// Appends one batch to docs/binbaz-expansion-log.md with the running total of items stored in this run.
const n = String(process.argv[2]).padStart(3, "0");
const dir = "docs/binbaz-batches";
const b = JSON.parse(fs.readFileSync(`${dir}/batch-${n}.json`, "utf8"));
const d = JSON.parse(fs.readFileSync(`${dir}/batch-${n}-decisions.json`, "utf8"));
const title = (r) => b.candidates.find((c) => c.url.includes("/fatwas/" + r + "/"))?.title ?? "";
let total = 0;
for (const f of fs.readdirSync(dir).filter((f) => /decisions\.json$/.test(f))) {
  total += JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")).imported ?? 0;
}
const rej = Object.entries(d.rejected ?? {});
const need = Object.entries(d.needsMo ?? {});
let out = `\n## Batch ${n}\n\n- Candidates read: ${b.candidates.length}\n- Approved and stored: ${d.imported ?? 0}\n- Rejected: ${rej.length}\n- Needs Mo: ${need.length}\n- Page requests: ${b.requests}, request errors: ${b.requestErrors}\n- Running total stored in this run: ${total}\n`;
if (rej.length) out += "\nRejected:\n" + rej.map(([r, why]) => `- ${r} ${title(r)}: ${why}`).join("\n") + "\n";
if (need.length) out += "\nNeeds Mo:\n" + need.map(([r, why]) => `- ${r} ${title(r)}: ${why}`).join("\n") + "\n";
const log = "docs/binbaz-expansion-log.md";
if (!fs.existsSync(log)) fs.writeFileSync(log, "# Ibn Baz expansion run log\n\nEvery stored item keeps its official binbaz.org.sa link. Items listed under Rejected were not stored.\n");
fs.appendFileSync(log, out);
console.log(out.split("\n").slice(0, 9).join("\n"));
