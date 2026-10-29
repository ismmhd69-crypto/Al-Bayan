// Checks data/learning/lesson-extras.json against the lessons: 3 takeaways and a 4-option quiz in
// Arabic, English and German, and every source already cited in that lesson.
// Run: npx tsx scripts/validate-lesson-extras.ts
import extras from "../data/learning/lesson-extras.json";
import { learningLessons } from "../lib/learning/course";
import { lessonExtrasProblems, type LessonExtrasEntry } from "../lib/learning/extras";

const entries = extras as Record<string, LessonExtrasEntry>;
let failed = 0;
for (const id of Object.keys(entries)) {
  if (!learningLessons.some((lesson) => lesson.id === id)) { console.log(`✗ ${id}: no lesson with this id`); failed++; }
}
const counts = { approved: 0, draft: 0, missing: 0 };
for (const lesson of learningLessons) {
  const entry = entries[lesson.id];
  if (!entry) { counts.missing++; continue; }
  counts[entry.status]++;
  const problems = lessonExtrasProblems(lesson, entry);
  if (problems.length) { failed++; console.log(`✗ ${lesson.number} ${lesson.id}: ${problems.join("; ")}`); }
}
console.log(`${learningLessons.length} lessons: ${counts.approved} approved, ${counts.draft} draft, ${counts.missing} not written yet. ${failed ? `${failed} with problems.` : "No problems."}`);
process.exit(failed ? 1 : 0);
