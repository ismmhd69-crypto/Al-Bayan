import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { passageRecord } from "@/lib/ask/passage-record";

const source = { id: "Q2:183", kind: "quran" as const, original: "نص اختباري فقط", translation: "Invented test text",
  context: [{ key: "2:182", arabic: "سياق اختباري أول" }, { key: "2:184", arabic: "سياق اختباري ثان" }] };
it("fingerprints exact text without storing it or accepting browser approval", () => {
  const record = passageRecord(source)!;
  expect(record.original).toBe(createHash("sha256").update(source.original).digest("hex"));
  expect(JSON.stringify(record)).not.toContain(source.original);
  expect(record).toEqual(passageRecord(structuredClone(source)));
  for (const original of [source.original + " ", source.original + " تغيير"]) expect(passageRecord({ ...source, original })!.original).not.toBe(record.original);
  expect(passageRecord({ ...source, translation: source.translation + " changed" })!.translation).not.toBe(record.translation);
  expect(passageRecord({ ...source, context: [...source.context].reverse() })!.context).not.toBe(record.context);
  expect(passageRecord({ ...source, context: [{ ...source.context[0], arabic: "تغيير" }] })!.context).not.toBe(record.context);
});
it("limits records to whole stored sources or real verses", () => {
  const id = "22222222-2222-2222-2222-222222222222";
  expect(passageRecord({ id: `S${id}`, kind: "scholar", original: "Full invented row" })).toMatchObject({ id: `S${id}` });
  expect(passageRecord({ id: `SH${id}`, kind: "hadith", original: "Full invented row" })).toMatchObject({ id: `SH${id}` });
  expect(passageRecord({ id: "HE9001", kind: "hadith", original: "Not a stored row" })).toBeNull();
  expect(passageRecord({ id: "LIVE9", kind: "scholar", original: "Live excerpt" })).toBeNull();
  expect(passageRecord({ ...source, id: "Q2:999" })).toBeNull();
  expect(passageRecord({ ...source, original: " " })).toBeNull();
  expect(passageRecord({ ...source, translation: "" })).toBeNull();
  expect(passageRecord({ id: `S${id}`, kind: "scholar", original: "Test", context: source.context })).toBeNull();
});
