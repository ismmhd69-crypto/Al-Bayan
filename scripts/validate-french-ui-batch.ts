import fs from "node:fs";
import en from "../dictionaries/en";

type Entry = { key: string; source: string; fr: string };
const file = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ?? "data/french-batches/ui-strings-001.json";
const entries = JSON.parse(fs.readFileSync(file, "utf8")) as Entry[];
const flat: Record<string, string> = {};
function walk(value: unknown, path = "") {
  if (typeof value === "string") flat[path] = value;
  else if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}.${index}`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => walk(item, path ? `${path}.${key}` : key));
}
walk(en);
const errors: string[] = [];
if (entries.length > 25) errors.push(`batch_too_large:${entries.length}`);
if (new Set(entries.map((entry) => entry.key)).size !== entries.length) errors.push("duplicate_keys");
for (const entry of entries) {
  if (flat[entry.key] !== entry.source) errors.push(`source_mismatch:${entry.key}`);
  if (!entry.fr.trim()) errors.push(`empty_french:${entry.key}`);
  const names = (text: string) => [...text.matchAll(/\{([A-Za-z0-9_]+)\}/gu)].map((match) => match[1]).sort();
  if (JSON.stringify(names(entry.source)) !== JSON.stringify(names(entry.fr))) errors.push(`placeholder_mismatch:${entry.key}`);
  const acceptedLoanwords = new Set(["nav.hadith"]);
  if (!acceptedLoanwords.has(entry.key) && entry.fr.trim() === entry.source.trim() && /[A-Za-z]/u.test(entry.source)) errors.push(`unchanged_english:${entry.key}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`French UI batch validated: ${entries.length} entries, key/source parity, nonempty values, and placeholder parity passed.`);
