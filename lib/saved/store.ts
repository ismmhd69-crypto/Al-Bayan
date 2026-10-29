import type { Locale } from "@/lib/i18n";
import { stripAnswer, type SavedAnswer } from "@/lib/chat/answer-store";

// Saved answers and lessons (Mo, 2026-10-29). Pure helpers, safe for the browser and for tests.
// Signed-out visitors keep saves on their device; signed-in people keep them in public.saved_items.
// An answer is always stored through stripAnswer(): Quran and hadith text are never kept (licences);
// they are loaded fresh when a saved answer is opened.

export type SavedKind = "answer" | "lesson";
export type SavedItem = {
  kind: SavedKind;
  key: string;
  title: string;
  lang: Locale;
  savedAt: string;
  question?: string;
  answer?: SavedAnswer;
};

export const DEVICE_KEY = "bayan:saved:v1";
export const MAX_DEVICE_ANSWERS = 30;
const LOCALES: Locale[] = ["ar", "en", "de"];

const clip = (text: string, max: number) => text.trim().slice(0, max);

/** A saved answer: question as its title, the answer stripped of Quran and hadith text. */
export function answerItem(input: { key: string; question: string; lang: Locale; answer: SavedAnswer; now?: Date }): SavedItem {
  const question = clip(input.question, 500);
  return { kind: "answer", key: input.key, title: clip(question, 160) || "…", lang: input.lang, savedAt: (input.now ?? new Date()).toISOString(), question, answer: stripAnswer(input.answer) };
}

export function lessonItem(input: { id: string; title: string; lang: Locale; now?: Date }): SavedItem {
  return { kind: "lesson", key: input.id, title: clip(input.title, 160), lang: input.lang, savedAt: (input.now ?? new Date()).toISOString() };
}

/** Stable key for an answer, so saving the same reply twice never makes two items. */
export function answerKey(question: string, answer: unknown): string {
  const text = `${question}\u0000${JSON.stringify(answer)}`;
  let a = 0x811c9dc5, b = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x85ebca6b) >>> 0;
  }
  return `a-${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

const sameItem = (a: Pick<SavedItem, "kind" | "key">, b: Pick<SavedItem, "kind" | "key">) => a.kind === b.kind && a.key === b.key;

function validItem(value: unknown): value is SavedItem {
  const v = value as SavedItem;
  return !!v && typeof v === "object" && (v.kind === "answer" || v.kind === "lesson") && typeof v.key === "string" && v.key.length > 0 && v.key.length <= 120
    && typeof v.title === "string" && v.title.length > 0 && LOCALES.includes(v.lang) && typeof v.savedAt === "string"
    && (v.kind === "lesson" ? v.answer === undefined : typeof v.question === "string" && !!v.answer && typeof v.answer === "object");
}

/** Reads the device list. Broken or foreign data never throws; it is treated as an empty list. */
export function parseDevice(raw: string | null): SavedItem[] {
  try {
    const value = JSON.parse(raw ?? "null") as { v?: number; items?: unknown[] } | null;
    if (!value || value.v !== 1 || !Array.isArray(value.items)) return [];
    const items: SavedItem[] = [];
    for (const item of value.items) if (validItem(item) && !items.some((x) => sameItem(x, item))) items.push(item);
    return items;
  } catch { return []; }
}

export const serializeDevice = (items: SavedItem[]) => JSON.stringify({ v: 1, items });

/** Newest first. Adding an item already saved keeps one copy. Beyond the device limit the oldest answers drop. */
export function addItem(items: SavedItem[], item: SavedItem, maxAnswers = Infinity): { items: SavedItem[]; dropped: number } {
  const next = [item, ...items.filter((x) => !sameItem(x, item))];
  const answers = next.filter((x) => x.kind === "answer");
  if (answers.length <= maxAnswers) return { items: next, dropped: 0 };
  const drop = new Set(answers.slice(maxAnswers));
  return { items: next.filter((x) => !drop.has(x)), dropped: drop.size };
}

export const removeItem = (items: SavedItem[], kind: SavedKind, key: string) => items.filter((x) => !(x.kind === kind && x.key === key));

// ---------- account (public.saved_items) ----------

export type SavedRow = { kind: SavedKind; item_key: string; title: string; lang: Locale; question: string | null; answer: SavedAnswer | null; created_at: string };
export const toRow = (item: SavedItem) => ({ kind: item.kind, item_key: item.key, title: item.title, lang: item.lang, question: item.question ?? null, answer: item.answer ?? null });
export const fromRow = (row: SavedRow): SavedItem => ({
  kind: row.kind, key: row.item_key, title: row.title, lang: row.lang, savedAt: row.created_at,
  ...(row.kind === "answer" ? { question: row.question ?? "", answer: row.answer ?? undefined } : {}),
});

/** The small part of the Supabase client the account store needs, so tests can pass a fake. */
export type SavedTable = {
  list(): Promise<SavedRow[]>;
  insert(rows: ReturnType<typeof toRow>[]): Promise<void>;
  remove(kind: SavedKind, key: string): Promise<void>;
};

/** Moves device saves into the account. Items already in the account are skipped. The device copy is
 * cleared only when every upload succeeded; on any failure the device list is kept unchanged. */
export async function moveDeviceToAccount(device: SavedItem[], table: SavedTable): Promise<{ moved: number; keepDevice: boolean }> {
  if (!device.length) return { moved: 0, keepDevice: false };
  try {
    const existing = await table.list();
    const missing = device.filter((item) => !existing.some((row) => row.kind === item.kind && row.item_key === item.key));
    if (missing.length) await table.insert(missing.map(toRow));
    return { moved: missing.length, keepDevice: false };
  } catch {
    return { moved: 0, keepDevice: true };
  }
}
