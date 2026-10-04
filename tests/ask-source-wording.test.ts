import { describe, expect, it } from "vitest";
import { sealedPackageJson } from "@/lib/ask/core";
import type { EvidencePackage, Source } from "@/lib/ask/retrieval";
import type { Locale } from "@/lib/i18n";

const source = (translations: { en: string | null; de: string | null }): Source => ({
  kind: "hadith", hadith: { id: "SH11111111-1111-4111-a111-111111111111", arabic: "الأصل العربي الكامل", translations,
    collection: "bukhari", numbers: { bukhari: 1, muslim: null }, gradeAr: "صحيح", attributionAr: "رواه البخاري", url: "https://sunnah.com/bukhari:1" },
});
const pack = (s: Source): EvidencePackage => ({
  question: { language: "en", questionType: "general", subjects: ["intentions"], requirements: [{ id: "R1", text: "teaching about intentions", facet: "general" }], requiredFacets: ["general"], qualifiers: [] },
  passages: [{ id: "SH11111111-1111-4111-a111-111111111111", source: s, context: [], requirementIds: ["R1"], facets: ["general"] }], cards: [],
});
describe("writer receives eligible wording", () => {
  it.each(["en", "de", "ar"] as Locale[])("retains the sole stored original for %s", (lang) => {
    expect(sealedPackageJson(pack(source({ en: null, de: null })), lang, true).passages[0]).toHaveProperty("arabic", "الأصل العربي الكامل");
  });
  it("keeps Arabic when German is missing even if English is present", () => {
    expect(sealedPackageJson(pack(source({ en: "Authoritative English", de: null })), "de", true).passages[0]).toHaveProperty("arabic");
  });
  it("uses the original for Arabic answers even with a translation", () => {
    expect(sealedPackageJson(pack(source({ en: "Authoritative English", de: null })), "ar", true).passages[0]).toHaveProperty("arabic");
  });
  it("keeps the existing English translated payload short", () => {
    const item = sealedPackageJson(pack(source({ en: "Authoritative English", de: null })), "en", true).passages[0];
    expect(item).toHaveProperty("translation_en", "Authoritative English");
    expect(item).not.toHaveProperty("arabic");
  });
  it("cannot serialize a metadata-only source", () => {
    const s = source({ en: null, de: null });
    if (s.kind === "hadith") s.hadith.arabic = "  ";
    expect(() => sealedPackageJson(pack(s), "en", true)).toThrow("sealed_source_text_missing");
  });
});
