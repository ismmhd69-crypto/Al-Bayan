import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { fatwaTitleTranslation } from "@/lib/ask/fatwa-titles";
import { validRichSection, type RichSection } from "@/lib/ask/rich-answer";
import { RichAnswerView } from "@/components/RichAnswerView";
import { getDictionary } from "@/lib/i18n";
import { toEvidence } from "@/lib/ask/core";
import { pack, scholarId } from "./fixtures/rich";

// A real stored Ibn Baz source id from the 2026-11-12 tests, with its translated heading.
const realId = "S23c4fc51-a2aa-4c4d-86fa-33a217177ac7";

it("finds the English and German heading for a stored fatwa, never for Arabic or unknown sources", () => {
  expect(fatwaTitleTranslation(realId, "en")?.text).toMatch(/\w/);
  expect(fatwaTitleTranslation(realId, "en")?.language).toBe("en");
  expect(fatwaTitleTranslation(realId, "de")?.language).toBe("de");
  expect(fatwaTitleTranslation(realId, "ar")).toBeUndefined();
  expect(fatwaTitleTranslation("S00000000-0000-0000-0000-000000000000", "en")).toBeUndefined();
  expect(fatwaTitleTranslation("SH" + realId.slice(1), "en")).toBeUndefined();
});

it("shows the translated heading with an AI label in English, and the Arabic heading in Arabic", () => {
  const p = pack.passages.find(x => x.id === scholarId)!;
  const section = (language: "en" | "ar"): RichSection => ({ group: "scholar", outcome: "ready", presentation: "originals", claims: [],
    sources: [{ id: scholarId, evidence: toEvidence(p.source, language), role: "direct", requirementIds: ["R1"], explanationRequirementIds: [],
      ...(language === "en" ? { displayTitle: { text: "Ruling on repeating a sin after repentance", language: "en" as const } } : {}) }] });
  expect(validRichSection(section("en"), "en")).toBe(true);
  const en = renderToStaticMarkup(createElement(RichAnswerView, { sections: [section("en")], language: "en", text: getDictionary("en").ask, complete: true, guide: null }));
  expect(en).toContain("Ruling on repeating a sin after repentance"); expect(en).toContain("AI-translated title");
  const ar = renderToStaticMarkup(createElement(RichAnswerView, { sections: [section("ar")], language: "ar", text: getDictionary("ar").ask, complete: true, guide: null }));
  expect(ar).not.toContain("AI-translated title");
  // A heading in the wrong language or on a non-scholar card is rejected.
  const wrong = section("en"); wrong.sources[0].displayTitle = { text: "Falsch", language: "de" };
  expect(validRichSection(wrong, "en")).toBe(false);
});
