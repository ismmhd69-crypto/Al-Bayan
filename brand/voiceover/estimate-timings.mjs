// Estimated word timings from the script text alone (no audio, no API).
// Used to lay out and check a new language version before the real voice exists.
// Usage (from brand/): node voiceover/estimate-timings.mjs <id> <lang>
// Writes <id>-<lang>.durations.json and <id>-<lang>.words.json with "estimated": true.
// Replace them by running generate.mjs + word-timings.mjs once the voice exists.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [id, lang] = process.argv.slice(2);
if (!id || !lang) throw new Error("usage: node voiceover/estimate-timings.mjs <id> <lang>");
const script = JSON.parse(readFileSync(join(here, `${id}.json`), "utf8"));

const CHAR = 0.062; // seconds per character, a calm reading pace
const PAUSE = { ",": 0.25, ":": 0.35, ";": 0.3, ".": 0.45, "?": 0.45, "!": 0.45 };
const durations = { estimated: true };
const words = { estimated: true };
for (const [scene, texts] of Object.entries(script.scenes)) {
  const text = texts[lang];
  if (!text) throw new Error(`no ${lang} text for ${scene}`);
  let t = 0.05;
  words[scene] = text.split(/\s+/).filter(Boolean).map((w) => {
    const start = t;
    const end = start + Math.max(0.18, w.replace(/[^\p{L}]/gu, "").length * CHAR);
    t = end + 0.06 + (PAUSE[w.slice(-1)] ?? 0);
    return { word: w, start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100 };
  });
  durations[scene] = Math.round((t + 0.1) * 100) / 100;
}
writeFileSync(join(here, `${id}-${lang}.durations.json`), JSON.stringify(durations, null, 2) + "\n");
writeFileSync(join(here, `${id}-${lang}.words.json`), JSON.stringify(words, null, 1) + "\n");
console.log(id, lang, "estimated", durations);
