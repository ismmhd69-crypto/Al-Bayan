import fs from 'node:fs';
import path from 'node:path';

// 1. Check dictionaries/de.ts vs dictionaries/en.ts
import enDict from '../dictionaries/en.ts';
import deDict from '../dictionaries/de.ts';

console.log('--- DICTIONARY CHECK ---');
const enKeys = Object.keys(enDict);
const deKeys = Object.keys(deDict);
console.log(`en keys: ${enKeys.length}, de keys: ${deKeys.length}`);

const missingInDe = enKeys.filter(k => !(k in deDict));
console.log('Keys missing in de.ts:', missingInDe);

const enRecord = enDict as Record<string, unknown>;
const deRecord = deDict as Record<string, unknown>;
const identicalToEn = enKeys.filter(k => k in deRecord && deRecord[k] === enRecord[k] && typeof enRecord[k] === 'string' && (enRecord[k] as string).length > 5);
console.log('Identical strings (>5 chars) in de.ts (potential English fallbacks):', identicalToEn);

// 2. Check learning lessons
console.log('\n--- LEARNING LESSONS CHECK ---');
const learningFile = 'data/learning/new-to-islam.json';
if (fs.existsSync(learningFile)) {
  const lessons = JSON.parse(fs.readFileSync(learningFile, 'utf8'));
  console.log(`Total lessons in new-to-islam.json: ${lessons.length || Object.keys(lessons).length}`);
  // check de fields
  let missingDe = 0;
  for (const item of (Array.isArray(lessons) ? lessons : Object.values(lessons))) {
    if (!item.de || Object.keys(item.de).length === 0) missingDe++;
  }
  console.log(`Lessons missing de: ${missingDe}`);
}

// 3. Check hard questions articles
console.log('\n--- HARD QUESTIONS CHECK ---');
const hardFile = 'data/learning/hard-questions.json';
if (fs.existsSync(hardFile)) {
  const hq = JSON.parse(fs.readFileSync(hardFile, 'utf8'));
  console.log(`Total items in hard-questions.json: ${hq.length || Object.keys(hq).length}`);
  let missingDe = 0;
  for (const item of (Array.isArray(hq) ? hq : Object.values(hq))) {
    if (!item.de || Object.keys(item.de).length === 0) missingDe++;
  }
  console.log(`Hard questions missing de: ${missingDe}`);
}

// 4. Check prepared answers
console.log('\n--- PREPARED ANSWERS CHECK ---');
const prepDir = 'data/prepared-answers';
const prepFiles = fs.readdirSync(prepDir).filter(f => f.endsWith('.json'));
console.log(`Prepared answer files: ${prepFiles.length}`);
let prepMissingDe = 0;
for (const f of prepFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(prepDir, f), 'utf8'));
  if (!data.de) {
    prepMissingDe++;
  }
}
console.log(`Prepared answers missing de: ${prepMissingDe}`);

// 5. Check topic answers
console.log('\n--- TOPIC ANSWERS CHECK ---');
const topicDir = 'data/topic-answers';
const topicFiles = fs.readdirSync(topicDir).filter(f => f.endsWith('.json'));
console.log(`Topic answer files: ${topicFiles.length}`);
let topicMissingDe = 0;
for (const f of topicFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(topicDir, f), 'utf8'));
  if (!data.de) {
    topicMissingDe++;
  }
}
console.log(`Topic answers missing de: ${topicMissingDe}`);
