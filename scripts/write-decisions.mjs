// usage: node scripts/write-decisions.mjs <n> '<json {approved:[...], rejected:{ref:reason}, needsMo:{ref:reason}}>'
import fs from "node:fs";
const n = String(process.argv[2]).padStart(3, "0");
const d = JSON.parse(process.argv[3]);
const b = JSON.parse(fs.readFileSync(`docs/binbaz-batches/batch-${n}.json`, "utf8"));
const refs = b.candidates.map((c) => c.url.match(/fatwas\/(\d+)\//)[1]);
if (d.allOthers) d.approved = refs.filter((r) => !(d.rejected ?? {})[r] && !(d.needsMo ?? {})[r]);
delete d.allOthers;
const all = [...d.approved.map(String), ...Object.keys(d.rejected ?? {}), ...Object.keys(d.needsMo ?? {})];
const missing = refs.filter((r) => !all.includes(r));
const extra = all.filter((r) => !refs.includes(r));
if (missing.length || extra.length || new Set(all).size !== all.length) { console.error("MISMATCH missing:", missing, "extra:", extra); process.exit(1); }
fs.writeFileSync(`docs/binbaz-batches/batch-${n}-decisions.json`, JSON.stringify(d, null, 2));
const rate = ((Object.keys(d.rejected ?? {}).length + Object.keys(d.needsMo ?? {}).length) / refs.length * 100).toFixed(0);
console.log(`ok: ${d.approved.length} approved, ${Object.keys(d.rejected ?? {}).length} rejected, ${Object.keys(d.needsMo ?? {}).length} needs Mo (${rate}% not stored)`);
