import fs from "node:fs";
import source from "../data/learning/new-to-islam.json";

type Entry = { id: string; title: string; body: string };
const file = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ?? "data/french-batches/new-to-islam-001.json";
const entries = JSON.parse(fs.readFileSync(file, "utf8")) as Entry[];
const sourceById = new Map(source.lessons.map((lesson) => [lesson.id, lesson]));
const errors: string[] = [];
if (!entries.length || entries.length > 5) errors.push(`batch_size:${entries.length}`);
if (new Set(entries.map((entry) => entry.id)).size !== entries.length) errors.push("duplicate_ids");
const linkedTokens = (text: string) => [...text.matchAll(/\[[^\]]+\]\(([^\)]+)\)|\[[^\]]+\]\[([^\]]+)\]/gu)].map((match) => match[1] ? `url:${match[1]}` : `ref:${match[2]}`);
const inlineSources = (text: string) => [...text.matchAll(/\[(?:Quran|Coran|Bukhari|Muslim|Ibn Baz|Abu Dawud|Q\d|\d{1,3}:\d{1,3}|\d{1,3}[a-z]?|[A-Z]{1,3}\s?\d)[^\]]*\]/giu)].map((match) => match[0].replace(/^\[(?:Quran|Coran)/iu, "[Quran"));
for (const entry of entries) {
  const original = sourceById.get(entry.id);
  if (!original) { errors.push(`unknown_id:${entry.id}`); continue; }
  if (!entry.title.trim() || !entry.body.trim()) errors.push(`empty_translation:${entry.id}`);
  if (JSON.stringify(linkedTokens(original.body.en)) !== JSON.stringify(linkedTokens(entry.body))) errors.push(`link_or_reference_tag_mismatch:${entry.id}`);
  if (JSON.stringify(inlineSources(original.body.en)) !== JSON.stringify(inlineSources(entry.body))) errors.push(`source_citation_mismatch:${entry.id}`);
  const sectionCount = (text: string) => [...text.matchAll(/^\*\*[^*]+\*\*$/gmu)].length;
  if (sectionCount(original.body.en) !== sectionCount(entry.body)) errors.push(`section_heading_count_mismatch:${entry.id}`);
  const sourceBlocks = original.body.en.trim().split(/\n\s*\n/u).length;
  const translatedBlocks = entry.body.trim().split(/\n\s*\n/u).length;
  if (sourceBlocks !== translatedBlocks) errors.push(`paragraph_count_mismatch:${entry.id}:${sourceBlocks}/${translatedBlocks}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`French New to Islam batch validated: ${entries.length} lessons; IDs, all linked references, source citations, section headings, and paragraph structure passed.`);
