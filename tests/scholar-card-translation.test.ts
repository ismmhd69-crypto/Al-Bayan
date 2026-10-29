import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { translationOnly } from "@/lib/ask/rich-answer";

// Mo (2026-10-29): scholar cards show only the checked translation; Quran and hadith keep their Arabic.
const ready = { status: "ready", text: "Invented translation", language: "de", origin: "ai", original: "نص", originalHash: "a".repeat(64) } as const;
const scholar = { evidence: { kind: "scholar" }, displayTranslation: ready } as never;
const hadith = { evidence: { kind: "hadith" }, displayTranslation: ready } as never;

it("hides the Arabic of a scholar card only when a checked translation is shown", () => {
  expect(translationOnly(scholar, "de")).toBe(true);
  expect(translationOnly(scholar, "en")).toBe(true);
  expect(translationOnly(scholar, "ar")).toBe(false);
  expect(translationOnly({ evidence: { kind: "scholar" }, displayTranslation: { status: "unavailable" } } as never, "en")).toBe(false);
});
it("always keeps Quran and hadith Arabic visible", () => {
  expect(translationOnly(hadith, "en")).toBe(false);
  expect(translationOnly({ evidence: { kind: "quran" } } as never, "de")).toBe(false);
});
