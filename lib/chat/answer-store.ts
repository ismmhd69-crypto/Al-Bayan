// Saved chats: what is kept, and how the list is shown. Pure and safe for the browser.
//
// A saved answer is the checked AnswerV2 with the Quran and hadith TEXT removed: Quran Foundation allows
// no long-term storage and HadeethEnc text is never stored. Everything else (the sentences, source ids,
// our own scholar-library quotes, videos, provenance) is kept. lib/chat/hydrate.ts puts the texts back,
// fresh from their sources, when a chat is opened.

import type { AnswerV2 } from "@/lib/ask/answer-v2";

/** The stored copy: the same shape as AnswerV2, with the source texts blanked. */
export function stripAnswer(answer: AnswerV2): AnswerV2 {
  const copy = structuredClone(answer);
  for (const card of copy.quran) {
    for (const verse of card.verses) {
      verse.arabic = "";
      verse.translation = null;
      verse.translation_name = null;
    }
  }
  for (const hadith of copy.hadith) {
    hadith.arabic = "";
    hadith.translation = null;
    hadith.translation_language = null;
    hadith.grade_ar = "";
    hadith.attribution_ar = "";
  }
  return copy;
}

const TITLE_MAX = 60;

/** The chat's name in the list: its first question, tidied and shortened (no AI involved). */
export function chatTitle(question: string): string {
  const text = question.replace(/\s+/g, " ").trim();
  if (text.length <= TITLE_MAX) return text || "?";
  const cut = text.slice(0, TITLE_MAX);
  const space = cut.lastIndexOf(" ");
  return `${(space > 30 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export type DayGroup = "today" | "yesterday" | "earlier";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Recent chats grouped as Today, Yesterday and Earlier (this device's calendar), newest first. */
export function groupByDay<T extends { updated_at: string }>(items: T[], now: Date = new Date()): { group: DayGroup; items: T[] }[] {
  const today = startOfDay(now);
  const yesterday = today - 24 * 60 * 60 * 1000;
  const groups: Record<DayGroup, T[]> = { today: [], yesterday: [], earlier: [] };
  const sorted = [...items].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  for (const item of sorted) {
    const day = startOfDay(new Date(item.updated_at));
    groups[day >= today ? "today" : day >= yesterday ? "yesterday" : "earlier"].push(item);
  }
  return (["today", "yesterday", "earlier"] as const).filter((g) => groups[g].length > 0).map((group) => ({ group, items: groups[group] }));
}
