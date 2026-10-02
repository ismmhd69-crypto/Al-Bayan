import fs from "node:fs";

type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-105.json", "utf8"));
if (batch.length !== 60) throw new Error("Expected 60");

const kinds: Kind[] = [
  "companion_words", "companion_words", "companion_words", "companion_words", "narration", "narration", "narration", "dialogue", "dialogue", "reference_only",
  "dialogue", "reference_only", "narration", "narration", "narration", "narration", "dialogue", "dialogue", "dialogue", "reference_only",
  "reference_only", "dialogue", "narration", "dialogue", "narration", "dialogue", "narration", "companion_words", "companion_words", "reference_only",
  "companion_words", "companion_words", "companion_words", "companion_words", "reference_only", "reference_only", "narration", "reference_only", "reference_only", "narration",
  "narration", "companion_words", "companion_words", "narration", "companion_words", "narration", "narration", "companion_words", "narration", "reference_only",
  "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words", "companion_words"
];
const marks = batch.map((x: any, i: number) => ({ id: x.id, url: x.url, start: null as string | null, kind: kinds[i] }));
const cp1252: Record<string, string> = { "€":"\x80", "‚":"\x82", "ƒ":"\x83", "„":"\x84", "…":"\x85", "†":"\x86", "‡":"\x87", "ˆ":"\x88", "‰":"\x89", "Š":"\x8a", "‹":"\x8b", "Œ":"\x8c", "Ž":"\x8e", "‘":"\x91", "’":"\x92", "“":"\x93", "”":"\x94", "•":"\x95", "–":"\x96", "—":"\x97", "˜":"\x98", "™":"\x99", "š":"\x9a", "›":"\x9b", "œ":"\x9c", "ž":"\x9e", "Ÿ":"\x9f" };
const decodeNeedle = (s: string) => Buffer.from([...s].map(c => cp1252[c] ?? c).join(""), "latin1").toString("utf8");
function cleanMap(text: string) { const clean: string[] = [], map: number[] = []; for (let i = 0; i < text.length; i++) { if (/[\u064b-\u065f\u0670]/.test(text[i])) continue; clean.push(text[i]); map.push(i); } return { clean: clean.join(""), map }; }
const strip = (s: string) => s.replace(/[\u064b-\u065f\u0670]/g, "");
function locate(text: string, needle: string) { needle = decodeNeedle(needle); const { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate: ${needle}`); const start = map[p]; return text.slice(start, start + Math.min(100, text.length - start)); }
function setStart(i: number, needle: string) { marks[i].start = locate(batch[i].text_original, needle); }
function setTail(i: number, needle: string) { needle = decodeNeedle(needle); const text = batch[i].text_original as string, { clean, map } = cleanMap(text), p = clean.indexOf(strip(needle)); if (p < 0) throw new Error(`Could not locate tail: ${needle}`); marks[i].tail_start = text.slice(map[p]); }

const starts: Array<[number, string]> = [
  [0, "Ù‚ÙŽØ§Ù„ÙŽ ÙÙŽØ±ÙŽÙ…ÙŽÙ‰ Ø§Ù„Ù’Ø¬ÙŽÙ…Ù’Ø±ÙŽØ©ÙŽ"],
  [1, "Ù‚ÙŽØ§Ù„ÙŽ ÙÙŽÙ„ÙŽÙ…Ù‘ÙŽØ§ Ø£ÙŽØªÙŽÙ‰ Ø¬ÙŽÙ…Ù’Ø±ÙŽØ©ÙŽ"],
  [2, "Ù‚ÙŽØ§Ù„ÙŽ Ù‚ÙÙŠÙ„ÙŽ Ù„ÙØ¹ÙŽØ¨Ù’Ø¯Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [3, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ Ø­ÙŽØ¬ÙŽØ¬Ù’ØªÙ Ù…ÙŽØ¹ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [4, "ÙŠÙŽÙ‚ÙÙˆÙ„Ù Ø±ÙŽØ£ÙŽÙŠÙ’ØªÙ Ø§Ù„Ù†Ù‘ÙŽØ¨ÙÙŠÙ‘ÙŽ"],
  [5, "Ù‚ÙŽØ§Ù„ÙŽ Ø±ÙŽÙ…ÙŽÙ‰ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [6, "ÙƒÙŽØ§Ù†ÙŽ Ø§Ù„Ù†Ù‘ÙŽØ¨ÙÙŠÙ‘Ù"],
  [7, "Ø£ÙŽÙ†Ù‘ÙŽ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [8, "Ø£ÙŽÙ†Ù‘ÙŽ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [10, "Ù‚ÙŽØ§Ù„ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [12, "Ø£ÙŽÙ†Ù‘ÙŽÙ‡ÙŽØ§ Ø³ÙŽÙ…ÙØ¹ÙŽØªÙ Ø§Ù„Ù†Ù‘ÙŽØ¨ÙÙŠÙ‘ÙŽ"],
  [13, "Ø£ÙŽÙ†Ù‘ÙŽ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [14, "ÙˆÙŽØ£ÙŽØ´ÙŽØ§Ø±ÙŽ Ø¨ÙÙŠÙŽØ¯ÙÙ‡Ù"],
  [15, "Ø£ÙŽÙ†Ù‘ÙŽ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [16, "Ù‚ÙŽØ§Ù„ÙŽ Ù„ÙŽÙ…Ù‘ÙŽØ§ Ø±ÙŽÙ…ÙŽÙ‰ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [17, "Ù‚ÙŽØ§Ù„ÙŽ ÙˆÙŽÙ‚ÙŽÙÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [18, "ÙŠÙŽÙ‚ÙÙˆÙ„Ù ÙˆÙŽÙ‚ÙŽÙÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [21, "Ø£ÙŽØªÙŽÙ‰"],
  [22, "Ø±ÙŽØ£ÙŽÙŠÙ’ØªÙ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [23, "Ù‚ÙŽØ§Ù„ÙŽ Ø³ÙŽÙ…ÙØ¹Ù’ØªÙ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [24, "Ø£ÙŽÙ†Ù‘ÙŽ Ø±ÙŽØ³ÙÙˆÙ„ÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [25, "Ù‚ÙŽØ§Ù„ÙŽ Ø³ÙŽØ£ÙŽÙ„Ù’ØªÙ Ø£ÙŽÙ†ÙŽØ³ÙŽ Ø¨Ù’Ù†ÙŽ Ù…ÙŽØ§Ù„ÙÙƒÙ"],
  [26, "Ø£ÙŽÙ†Ù‘ÙŽ Ø§Ù„Ù†Ù‘ÙŽØ¨ÙÙŠÙ‘ÙŽ"],
  [27, "Ø£ÙŽÙ†Ù‘ÙŽ Ø§Ø¨Ù’Ù†ÙŽ Ø¹ÙÙ…ÙŽØ±ÙŽ"],
  [28, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ Ù†ÙØ²ÙÙˆÙ„Ù Ø§Ù„Ø£ÙŽØ¨Ù’Ø·ÙŽØ­Ù"],
  [30, "Ø£ÙŽÙ†Ù‘ÙŽÙ‡ÙŽØ§ Ù„ÙŽÙ…Ù’ ØªÙŽÙƒÙÙ†Ù’ ØªÙŽÙÙ’Ø¹ÙŽÙ„Ù"],
  [31, "Ù‚ÙŽØ§Ù„ÙŽ Ù„ÙŽÙŠÙ’Ø³ÙŽ Ø§Ù„ØªÙ‘ÙŽØ­Ù’ØµÙÙŠØ¨Ù"],
  [32, "Ù‚ÙŽØ§Ù„ÙŽ Ù‚ÙŽØ§Ù„ÙŽ Ø£ÙŽØ¨ÙÙˆ Ø±ÙŽØ§ÙÙØ¹Ù"],
  [33, "Ø£ÙŽÙ†Ù‘ÙŽ Ø§Ù„Ù’Ø¹ÙŽØ¨Ù‘ÙŽØ§Ø³ÙŽ Ø¨Ù’Ù†ÙŽ Ø¹ÙŽØ¨Ù’Ø¯Ù Ø§Ù„Ù…ÙØ·Ù‘ÙŽÙ„ÙØ¨Ù"],
  [37, "Ø£ÙŽÙ†Ù‘ÙŽ Ù†ÙŽØ¨ÙÙŠÙŽ Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [39, "Ù‚ÙŽØ§Ù„ÙŽ Ù†ÙŽØ­ÙŽØ±Ù’Ù†ÙŽØ§ Ù…ÙŽØ¹ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [40, "Ù‚ÙŽØ§Ù„ÙŽ Ø®ÙŽØ±ÙŽØ¬Ù’Ù†ÙŽØ§ Ù…ÙŽØ¹ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [41, "Ù‚ÙŽØ§Ù„ÙŽ Ø­ÙŽØ¬ÙŽØ¬Ù’Ù†ÙŽØ§ Ù…ÙŽØ¹ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [42, "Ù‚ÙŽØ§Ù„ÙŽ Ø§Ø´Ù’ØªÙŽØ±ÙŽÙƒÙ’Ù†ÙŽØ§ Ù…ÙŽØ¹ÙŽ Ø§Ù„Ù†Ù‘ÙŽØ¨ÙÙŠÙ‘Ù"],
  [43, "Ø£ÙŽÙ†Ù‘ÙŽÙ‡Ù Ø³ÙŽÙ…ÙØ¹ÙŽ Ø¬ÙŽØ§Ø¨ÙØ±ÙŽ"],
  [44, "Ù‚ÙŽØ§Ù„ÙŽ ÙƒÙÙ†Ù‘ÙŽØ§ Ù†ÙŽØªÙŽÙ…ÙŽØªÙ‘ÙŽØ¹Ù Ù…ÙŽØ¹ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [45, "Ù‚ÙŽØ§Ù„ÙŽ Ø°ÙŽØ¨ÙŽØ­ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [46, "Ø£ÙŽÙ†Ù‘ÙŽÙ‡Ù Ø³ÙŽÙ…ÙØ¹ÙŽ Ø¬ÙŽØ§Ø¨ÙØ±ÙŽ"],
  [47, "Ø£ÙŽÙ†Ù‘ÙŽ Ø§Ø¨Ù’Ù†ÙŽ Ø¹ÙÙ…ÙŽØ±ÙŽØŒ Ø£ÙŽØªÙŽÙ‰ Ø¹ÙŽÙ„ÙŽÙ‰ Ø±ÙŽØ¬ÙÙ„Ù"],
  [48, "Ø£ÙŽÙ†Ù‘ÙŽ Ø¹ÙŽØ§Ø¦ÙØ´ÙŽØ©ÙŽØŒ Ù‚ÙŽØ§Ù„ÙŽØªÙ’ ÙƒÙŽØ§Ù†ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [50, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ ÙƒÙŽØ£ÙŽÙ†Ù‘ÙÙŠ"],
  [51, "ØªÙŽÙ‚ÙÙˆÙ„Ù ÙƒÙÙ†Ù’ØªÙ Ø£ÙŽÙÙ’ØªÙÙ„Ù"],
  [52, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ ÙÙŽØªÙŽÙ„Ù’ØªÙ Ù‚ÙŽÙ„Ø§ÙŽØ¦ÙØ¯ÙŽ"],
  [53, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ ÙƒÙŽØ§Ù†ÙŽ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [54, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ Ø£ÙŽÙ†ÙŽØ§ ÙÙŽØªÙŽÙ„Ù’ØªÙ"],
  [55, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ Ù„ÙŽÙ‚ÙŽØ¯Ù’"],
  [56, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ Ø±ÙØ¨Ù‘ÙŽÙ…ÙŽØ§ ÙÙŽØªÙŽÙ„Ù’ØªÙ"],
  [57, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ Ø£ÙŽÙ‡Ù’Ø¯ÙŽÙ‰ Ø±ÙŽØ³ÙÙˆÙ„Ù Ø§Ù„Ù„Ù‘ÙŽÙ‡Ù"],
  [58, "Ù‚ÙŽØ§Ù„ÙŽØªÙ’ ÙƒÙÙ†Ù‘ÙŽØ§ Ù†ÙÙ‚ÙŽÙ„Ù‘ÙØ¯Ù Ø§Ù„Ø´Ù‘ÙŽØ§Ø¡ÙŽ"],
  [59, "Ù‚ÙŽØ§Ù„ÙŽ Ù…ÙŽÙ†Ù’ Ø£ÙŽÙ‡Ù’Ø¯ÙŽÙ‰ Ù‡ÙŽØ¯Ù’ÙŠÙ‹Ø§"]
];
for (const [i, needle] of starts) setStart(i, needle);
for (const i of [9, 11, 19, 20, 29, 34, 35, 36, 38, 49]) { marks[i].start = null; marks[i].kind = "reference_only"; }
marks[37].kind = "narration";

const tails: Array<[number, string]> = [
  [22, "Ø¨ÙÙ…ÙŽØ¹Ù’Ù†ÙŽÙ‰ Ø­ÙŽØ¯ÙÙŠØ«Ù Ø§Ø¨Ù’Ù†Ù Ø¹ÙÙŠÙŽÙŠÙ’Ù†ÙŽØ©ÙŽ"],
  [32, "ÙˆÙŽÙÙÙŠ Ø±ÙÙˆÙŽØ§ÙŠÙŽØ©Ù Ù‚ÙØªÙŽÙŠÙ’Ø¨ÙŽØ©ÙŽ"],
  [46, "ÙˆÙŽÙÙÙŠ Ø­ÙŽØ¯ÙÙŠØ«Ù Ø§Ø¨Ù’Ù†Ù Ø¨ÙŽÙƒÙ’Ø±Ù"]
];
for (const [i, needle] of tails) setTail(i, needle);

fs.writeFileSync("data/hadith-split/marks-105.json", JSON.stringify(marks, null, 2) + "\n", "utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-105.json");
