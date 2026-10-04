import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-319.json", "utf8")) as any[];
if (rows.length < 10) throw new Error(`count ${rows.length}`);
const nums = (s: string) => [...s.matchAll(/\d+/g)].map(x => x[0]).filter((x, i, a) => a.indexOf(x) === i).sort().join(",");
for (const r of rows) for (const lang of ["en", "de"] as const) {
  const v = r.translations[lang];
  if (!v.trim()) throw new Error(`${r.url} ${lang} empty`);
  if (/[\u0600-\u06ff]/u.test(v)) throw new Error(`${r.url} ${lang} Arabic`);
  if (nums(r.text_original) !== nums(v)) throw new Error(`${r.url} ${lang} numbers`);
  const ratio = v.length / Math.max(1, r.text_original.length);
  if (ratio < .6 || ratio > 3.5) throw new Error(`${r.url} ${lang} ratio ${ratio.toFixed(2)}`);
  if (lang === "de" && !/[äöüÄÖÜß]/u.test(v)) throw new Error(`${r.url} German umlaut`);
  if (/\[quran\b/i.test(v)) throw new Error(`${r.url} Quran tag`);
}
console.log(`validated=${rows.length}`);
