import { describe, expect, it } from "vitest";
import { addItem, answerItem, answerKey, fromRow, lessonItem, moveDeviceToAccount, parseDevice, removeItem, serializeDevice, toRow, type SavedRow, type SavedTable } from "@/lib/saved/store";

// Invented answer shapes only; enough for storage rules, not a real religious answer.
const richAnswer = () => ({
  version: 4, language: "en", review: "automatic",
  sections: [
    { group: "quran", outcome: "ready", presentation: "originals", claims: [], sources: [{ id: "Q112:1", evidence: { kind: "quran", key: "112:1", arabic: "نص تجريبي", translation: "Invented translation", translationName: "Fixture", url: "https://quran.com/112/1" } }] },
    { group: "hadith", outcome: "ready", presentation: "originals", claims: [], sources: [{ id: "HE1", evidence: { kind: "hadith", key: "HE1", collection: "muslim", numbers: { bukhari: null, muslim: 1 }, gradeAr: "صحيح", attributionAr: "رواه مسلم", arabic: "حديث تجريبي", translation: "Invented hadith", translationLanguage: "en", url: "https://hadeethenc.com/en/browse/hadith/1" } }] },
  ],
}) as never;

describe("saved answers and lessons", () => {
  it("never stores Quran or hadith text in a saved answer", () => {
    const item = answerItem({ key: "k", question: "Invented question?", lang: "en", answer: richAnswer() });
    const text = JSON.stringify(item);
    expect(text).not.toContain("نص تجريبي");
    expect(text).not.toContain("Invented translation");
    expect(text).not.toContain("حديث تجريبي");
    expect(text).not.toContain("Invented hadith");
    expect(item.title).toBe("Invented question?");
  });
  it("does not keep a hadith translation with its copy of the Arabic original", () => {
    const answer = richAnswer() as unknown as { sections: { sources: { displayTranslation?: unknown }[] }[] };
    answer.sections[1].sources[0].displayTranslation = { status: "ready", text: "Invented display translation", language: "en", origin: "ai", original: "حديث تجريبي", originalHash: "a".repeat(64) };
    const item = answerItem({ key: "k", question: "Q?", lang: "en", answer: answer as never });
    expect(JSON.stringify(item)).not.toContain("حديث تجريبي");
    expect((item.answer as unknown as typeof answer).sections[1].sources[0].displayTranslation).toEqual({ status: "not_checked" });
  });
  it("gives the same answer the same key, so saving twice keeps one copy", () => {
    expect(answerKey("Q", { a: 1 })).toBe(answerKey("Q", { a: 1 }));
    expect(answerKey("Q", { a: 1 })).not.toBe(answerKey("Q", { a: 2 }));
    const item = lessonItem({ id: "who-is-allah", title: "Who is Allah?", lang: "en" });
    expect(addItem(addItem([], item).items, item).items).toHaveLength(1);
  });
  it("keeps lessons and answers apart even with the same key", () => {
    const lesson = lessonItem({ id: "x", title: "Lesson", lang: "en" });
    const answer = answerItem({ key: "x", question: "Question?", lang: "en", answer: richAnswer() });
    const items = addItem(addItem([], lesson).items, answer).items;
    expect(items).toHaveLength(2);
    expect(removeItem(items, "lesson", "x")).toEqual([answer]);
  });
  it("drops the oldest answers beyond the device limit, never lessons", () => {
    let items = [lessonItem({ id: "l", title: "Lesson", lang: "en" })], dropped = 0;
    for (let i = 0; i < 4; i++) ({ items, dropped } = addItem(items, answerItem({ key: `a${i}`, question: `Q${i}?`, lang: "en", answer: richAnswer() }), 3));
    expect(dropped).toBe(1);
    expect(items.filter((x) => x.kind === "answer").map((x) => x.key)).toEqual(["a3", "a2", "a1"]);
    expect(items.some((x) => x.kind === "lesson")).toBe(true);
  });
  it("treats broken or foreign device data as an empty list and round-trips good data", () => {
    for (const raw of [null, "", "{", "[]", JSON.stringify({ v: 2, items: [] }), JSON.stringify({ v: 1, items: [{ kind: "x" }] })]) expect(parseDevice(raw)).toEqual([]);
    const items = [lessonItem({ id: "who-is-allah", title: "Who is Allah?", lang: "ar" })];
    expect(parseDevice(serializeDevice(items))).toEqual(items);
  });
  it("moves device saves into the account, skipping ones already there", async () => {
    const rows: SavedRow[] = [];
    const table: SavedTable = {
      list: async () => rows,
      insert: async (add) => { for (const r of add) rows.push({ ...r, created_at: "2026-10-29T00:00:00Z" } as SavedRow); },
      remove: async () => {},
    };
    const device = [lessonItem({ id: "a", title: "A", lang: "en" }), lessonItem({ id: "b", title: "B", lang: "en" })];
    rows.push({ ...toRow(device[0]), created_at: "2026-10-28T00:00:00Z" } as SavedRow);
    expect(await moveDeviceToAccount(device, table)).toEqual({ moved: 1, keepDevice: false });
    expect(rows.map((r) => r.item_key)).toEqual(["a", "b"]);
    expect(fromRow(rows[1]).key).toBe("b");
  });
  it("keeps the device saves when moving to the account fails", async () => {
    const failing: SavedTable = { list: async () => [], insert: async () => { throw new Error("offline"); }, remove: async () => {} };
    expect(await moveDeviceToAccount([lessonItem({ id: "a", title: "A", lang: "en" })], failing)).toEqual({ moved: 0, keepDevice: true });
  });
});
