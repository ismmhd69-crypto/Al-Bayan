import fs from "node:fs";

type Entry = { id: string; source: string; english: string; french: string };
const file = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ?? "data/french-batches/hardcoded-copy-001.json";
const entries = JSON.parse(fs.readFileSync(file, "utf8")) as Entry[];
const errors: string[] = [];
if (!entries.length || entries.length > 25) errors.push(`batch_size:${entries.length}`);
const ids = new Set<string>();
for (const entry of entries) {
  if (ids.has(entry.id)) errors.push(`duplicate_id:${entry.id}`);
  ids.add(entry.id);
  if (!entry.english.trim() || !entry.french.trim()) errors.push(`empty_copy:${entry.id}`);
  const placeholders = (value: string) => [...value.matchAll(/\{[A-Za-z0-9_]+\}/gu)].map((match) => match[0]).sort();
  if (JSON.stringify(placeholders(entry.english)) !== JSON.stringify(placeholders(entry.french))) errors.push(`placeholder_mismatch:${entry.id}`);
  const firstSource = entry.source.split(";")[0].trim();
  if (!fs.existsSync(firstSource)) errors.push(`missing_source_file:${entry.id}:${firstSource}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`French hard-coded visitor-copy batch validated: ${entries.length} strings; sources, unique IDs, nonempty French, and placeholders passed.`);
