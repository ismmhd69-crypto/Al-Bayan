import fs from "node:fs";
import path from "node:path";
import { richText } from "../lib/ask/rich-text";

type Entry = { key: string; source: string; fr: string };
const root = process.cwd();
const batchDirectory = path.join(root, "data/french-batches");
const outputPath = path.join(root, "lib/ask/rich-text-fr.ts");
const flat: Record<string, string> = {};
function flatten(value: unknown, prefix = "") {
  if (typeof value === "string") flat[prefix] = value;
  else if (Array.isArray(value)) value.forEach((item, index) => flatten(item, `${prefix}.${index}`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key));
}
function get(object: any, key: string): unknown {
  return key.split(".").reduce((value, part) => value?.[part], object);
}
function set(object: any, key: string, value: string) {
  const parts = key.split(".");
  const leaf = parts.pop()!;
  const parent = parts.reduce((current, part) => current[part], object);
  parent[leaf] = value;
}
const placeholders = (value: string) => [...value.matchAll(/\{([A-Za-z0-9_]+)\}/gu)].map((match) => match[1]).sort();
flatten(richText.en);
const errors: string[] = [];
const translated = new Set<string>();
const files = fs.readdirSync(batchDirectory).filter((name) => /^ask-status-\d{3}\.json$/u.test(name)).sort();
for (const file of files) {
  const entries = JSON.parse(fs.readFileSync(path.join(batchDirectory, file), "utf8")) as Entry[];
  if (entries.length > 25) errors.push(`${file}:batch_too_large`);
  for (const entry of entries) {
    if (!(entry.key in flat)) errors.push(`${file}:unknown_key:${entry.key}`);
    else if (flat[entry.key] !== entry.source || get(richText.en, entry.key) !== entry.source) errors.push(`${file}:source_mismatch:${entry.key}`);
    if (translated.has(entry.key)) errors.push(`${file}:duplicate_key:${entry.key}`);
    translated.add(entry.key);
    if (!entry.fr.trim()) errors.push(`${file}:empty_french:${entry.key}`);
    if (JSON.stringify(placeholders(entry.source)) !== JSON.stringify(placeholders(entry.fr))) errors.push(`${file}:placeholder_mismatch:${entry.key}`);
  }
}
for (const key of Object.keys(flat)) if (!translated.has(key)) errors.push(`missing_translation:${key}`);
if (translated.size !== Object.keys(flat).length) errors.push(`coverage_mismatch:${translated.size}/${Object.keys(flat).length}`);
if (errors.length) throw new Error(errors.join("\n"));

const french = structuredClone(richText.en) as Record<string, any>;
for (const file of files) {
  const entries = JSON.parse(fs.readFileSync(path.join(batchDirectory, file), "utf8")) as Entry[];
  for (const entry of entries) set(french, entry.key, entry.fr);
}
const source = `// Private French draft assembled from data/french-batches/ask-status-*.json.\n// Do not import into the live Ask flow until French support is separately approved.\nexport const richTextFr = ${JSON.stringify(french, null, 2)} as const;\n`;
fs.writeFileSync(outputPath, source, "utf8");
console.log(`Built ${path.relative(root, outputPath)} from ${translated.size} validated French strings in ${files.length} batches.`);
