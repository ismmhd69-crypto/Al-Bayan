import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { originalSection } from "@/lib/ask/original-sections";
import { validRichAnswer, validRichSection } from "@/lib/ask/rich-answer";
import { emptyPublication, reducePublication } from "@/lib/ask/publication";
import { RichAnswerView } from "@/components/RichAnswerView";
import { getDictionary } from "@/lib/i18n";
import { pack, dependencies, sections, scholarId } from "./fixtures/rich";

it.each(["en", "ar"] as const)("preserves selected originals without any source-writing calls in %s", async language => {
  const deps = dependencies();
  deps.writer.generateJson = vi.fn(() => { throw Error("No source writer allowed"); });
  deps.verifier.generateJson = vi.fn(() => { throw Error("No generated claim to review"); });
  for (const group of ["quran", "hadith", "scholar"] as const) {
    const section = await originalSection(group, pack, language, deps, new AbortController().signal);
    expect(validRichSection(section, language)).toBe(true);
    expect(section.claims).toEqual([]);
    const p = pack.passages.find(p => p.source.kind === group)!;
    const original = p.source.kind === "quran" ? p.source.verse.arabic : p.source.kind === "hadith" ? p.source.hadith.arabic : p.source.quote.arabic;
    expect(section.sources[0].evidence.arabic).toBe(original);
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language, sections: [section], text: getDictionary(language).ask }));
    expect(html).toContain(original);
    expect(html).toContain(section.sources[0].evidence.url);
    expect(html).not.toContain(sections.find(s => s.group === group)!.claims[0].text);
    const incomplete = renderToStaticMarkup(createElement(RichAnswerView, { language, sections: [section], incomplete: true, text: getDictionary(language).ask }));
    expect(incomplete).toContain(language === "ar" ? "المصادر المختارة متاحة أعلاه" : "The selected sources remain above");
    expect(incomplete).not.toContain("This attempt could not produce a checked answer");
    if (group === "quran" && language === "en") expect(html).toContain("Invented source wording solely for tests");
  }
  expect(deps.writer.generateJson).not.toHaveBeenCalled();
  expect(deps.verifier.generateJson).not.toHaveBeenCalled();
});

it("requires explicit original presentation, correct source family and a real summary", async () => {
  const deps = dependencies(), signal = new AbortController().signal;
  const originals = await Promise.all((["quran", "hadith", "scholar"] as const).map(g => originalSection(g, pack, "en", deps, signal)));
  const summary = { ...sections[3], sources: originals.flatMap(s => s.sources) };
  const answer = { version: 4, language: "en", review: "automatic", sections: [...originals, summary], complete: true };
  expect(validRichAnswer(answer)).toBe(true);
  expect(validRichSection({ ...originals[0], presentation: undefined })).toBe(false);
  expect(validRichSection({ ...originals[0], group: "hadith" })).toBe(false);
  expect(validRichSection({ ...summary, presentation: "originals", claims: [] })).toBe(false);
  expect(validRichAnswer({ ...answer, sections: [...originals, { ...summary, claims: [] }] })).toBe(false);
  const event = { type: "section_committed" as const, section: originals[0], commit_id: "a".repeat(64), evidence_snapshot: "b".repeat(64) };
  const published = reducePublication(emptyPublication(), event);
  expect(reducePublication(published, event)).toEqual(published);
  const flagged = reducePublication(published, { type: "integrity_notice", notice: { group: "quran", claimIndexes: [], sourceIds: [originals[0].sources[0].id], reason: "source_changed" } });
  expect(flagged.groups.quran.section).toEqual(originals[0]);
  expect(flagged.groups.quran.notices).toHaveLength(1);
});

it.each([true, false])("only displays an available scholar translation after alignment approval: %s", async approved => {
  const deps = dependencies(), p = pack.passages[2];
  if (p.source.kind !== "scholar") throw Error("fixture");
  const original = p.source.quote.arabic, originalHash = createHash("sha256").update(original).digest("hex");
  const translation = { status: "ready" as const, origin: "human" as const, language: "en" as const, original, originalHash, text: "An invented translated excerpt used only in this test." };
  deps.displayTranslationLookup = async () => new Map([[scholarId, translation]]);
  deps.verifier.generateJson = vi.fn(async () => ({ translations: [{ source_id: scholarId, original_hash: originalHash, faithful: approved ? "yes" : "no", complete: "yes", conditions_preserved: "yes" }] }));
  const section = await originalSection("scholar", pack, "en", deps, new AbortController().signal);
  expect(section.sources[0].displayTranslation?.status).toBe(approved ? "ready" : "unavailable");
  expect(section.sources[0].evidence.arabic).toBe(original);
  expect(deps.verifier.generateJson).toHaveBeenCalledOnce();
});
