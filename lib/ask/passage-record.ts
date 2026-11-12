import { createHash } from "node:crypto";
import { isRealVerse } from "@/lib/sources/quran-meta";

export type PassageRecord = {
  id: string;
  kind: "quran" | "hadith" | "scholar";
  original: string;
  translation?: string;
  context?: string;
};

type PassageInput = {
  id: string;
  kind: PassageRecord["kind"];
  original: string;
  translation?: string;
  context?: { key: string; arabic: string }[];
};
const uuid = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
const verseKey = (key: string) => /^\d+:\d+$/.test(key) && isRealVerse(...key.split(":").map(Number) as [number, number]);

// Fingerprints exact originals after checking, not approval or source eligibility.
// No normalization: even a whitespace change must invalidate the checked text.
export function passageRecord(input: PassageInput): PassageRecord | null {
  const stored = input.kind === "quran" ? input.id.startsWith("Q") && verseKey(input.id.slice(1))
    : new RegExp(`^${input.kind === "hadith" ? "SH" : "S"}${uuid}$`, "i").test(input.id);
  if (!stored || !input.original.trim() || input.translation !== undefined && !input.translation.trim()) return null;
  if (input.context !== undefined && (input.kind !== "quran" || input.context.some(v => !verseKey(v.key) || !v.arabic.trim()))) return null;
  const hash = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
  return { id: input.id, kind: input.kind, original: hash(input.original),
    ...(input.translation !== undefined ? { translation: hash(input.translation) } : {}),
    ...(input.context !== undefined ? { context: hash(JSON.stringify(input.context.map(v => [v.key, v.arabic]))) } : {}) };
}
