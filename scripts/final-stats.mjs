import fs from "node:fs";
const dir = "docs/binbaz-batches";
let rej = 0, need = [], stored = [], reasons = {}, read = 0;
for (const f of fs.readdirSync(dir).filter((f) => /^batch-\d+-decisions\.json$/.test(f))) {
  const n = f.match(/\d+/)[0];
  const d = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
  const b = JSON.parse(fs.readFileSync(`${dir}/batch-${n}.json`, "utf8"));
  read += b.candidates.length;
  const t = (r) => b.candidates.find((c) => c.url.includes("/fatwas/" + r + "/")) ?? {};
  for (const [r, why] of Object.entries(d.rejected ?? {})) { rej++; const k = /near duplicate/.test(why) ? "near duplicate of an item already stored" : /cut off|ends|gap|missing word|garbled/.test(why) ? "cut off or gaps in the text" : /context|refers|starts with|question we do not show|unclear/.test(why) ? "needs outside context" : /does not answer|title/.test(why) ? "does not answer its own title" : "other"; reasons[k] = (reasons[k] || 0) + 1; }
  for (const [r, why] of Object.entries(d.needsMo ?? {})) need.push({ ref: r, title: t(r).title, url: t(r).url, why });
  for (const r of d.approved) stored.push(t(r).title + "  |  " + t(r).url);
}
const pick = [...stored].sort(() => Math.random() - 0.5).slice(0, 10);
console.log(JSON.stringify({ read, stored: stored.length, rej, reasons, needCount: need.length }, null, 1));
fs.writeFileSync(`${dir}/needs-mo-list.json`, JSON.stringify(need, null, 2));
console.log(need.map((n) => `${n.ref} ${n.title}: ${n.why}`).join("\n"));
console.log("\nSPOT CHECK\n" + pick.join("\n"));
