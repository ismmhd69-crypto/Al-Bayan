import fs from "node:fs";
import path from "node:path";

type DraftEntry = { collection: "prepared-answers" | "topic-answers"; source_file: string; topic_id: string; questions?: string[]; answers: Record<string, Array<Record<string, unknown>>> };
const file = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ?? "data/french-batches/prepared-answers-001.json";
const entries = JSON.parse(fs.readFileSync(file, "utf8")) as DraftEntry[];
const errors: string[] = [];
if (!entries.length || entries.length > 5) errors.push(`batch_size:${entries.length}`);
const seen = new Set<string>();
for (const entry of entries) {
  const sourcePath = path.join("data", entry.collection, entry.source_file);
  if (seen.has(sourcePath)) errors.push(`duplicate_source:${sourcePath}`);
  seen.add(sourcePath);
  if (!fs.existsSync(sourcePath)) { errors.push(`missing_source:${sourcePath}`); continue; }
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as any;
  if (entry.topic_id !== source.topic_id) errors.push(`topic_id_mismatch:${sourcePath}`);
  if (entry.collection === "prepared-answers") {
    if (!Array.isArray(entry.questions) || entry.questions.length !== source.questions.en.length) errors.push(`question_count_mismatch:${sourcePath}`);
    if (entry.questions?.some((question) => !question.trim())) errors.push(`empty_question:${sourcePath}`);
  } else if (entry.questions !== undefined) errors.push(`unexpected_questions:${sourcePath}`);
  const sourceAnswers = source.answers.en ?? {};
  if (JSON.stringify(Object.keys(entry.answers).sort()) !== JSON.stringify(Object.keys(sourceAnswers).sort())) errors.push(`answer_sections_mismatch:${sourcePath}`);
  for (const [section, sourceItems] of Object.entries(sourceAnswers) as [string, any[]][]) {
    const translatedItems = entry.answers[section];
    if (!Array.isArray(translatedItems) || translatedItems.length !== sourceItems.length) { errors.push(`answer_count_mismatch:${sourcePath}:${section}`); continue; }
    sourceItems.forEach((sourceItem, index) => {
      const translated = translatedItems[index] as any;
      if (typeof sourceItem === "string") {
        if (typeof translated !== "string" || !translated.trim()) errors.push(`empty_text_entry:${sourcePath}:${section}:${index}`);
        return;
      }
      if (!translated || !String(translated.text ?? "").trim()) errors.push(`empty_answer:${sourcePath}:${section}:${index}`);
      const stableFields = (value: any) => Object.fromEntries(Object.entries(value).filter(([key]) => key !== "text").sort(([a], [b]) => a.localeCompare(b)));
      if (JSON.stringify(stableFields(sourceItem)) !== JSON.stringify(stableFields(translated))) errors.push(`answer_metadata_mismatch:${sourcePath}:${section}:${index}`);
    });
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`French prepared-answer batch validated: ${entries.length} files; source IDs, question/answer counts, source links, requirements, and section structure passed.`);
