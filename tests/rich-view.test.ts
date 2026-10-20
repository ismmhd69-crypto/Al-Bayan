import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichAnswerView, richSourceCards } from "@/components/RichAnswerView";
import { getDictionary } from "@/lib/i18n";
import { richText } from "@/lib/ask/rich-text";
import { sections } from "./fixtures/rich";
describe("rich evidence reading view", () => {
  it("prominently discloses limited coverage when source searches timed out", () => {
    const partialSources = structuredClone(sections);
    partialSources[0] = { group: "quran", outcome: "timeout", claims: [], sources: [] };
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: "en", sections: partialSources, text: getDictionary("en").ask, complete: true }));
    expect(html).toContain("This answer is based only on the sources shown below");
  });
  it("keeps consecutive Quran verses in one passage card without losing citation targets", () => {
    const section = structuredClone(sections[0]);
    const next = structuredClone(section.sources[0]);
    next.id = "Q2:184"; if (next.evidence.kind === "quran") { next.evidence.key = "2:184"; next.evidence.url = "https://quran.com/2/184"; }
    section.sources.push(next);
    expect(richSourceCards(section).map(card => card.map(source => source.id))).toEqual([["Q2:183", "Q2:184"]]);
  });
  it.each(["en", "ar", "de"] as const)("keeps source previews, full text, existing review wording and reporting in %s", lang => {
    const text = getDictionary(lang).ask;
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: lang, sections, text, complete: true }));
    expect(html).toContain(text.v2.review.automatic); expect(html).toContain(richText[lang].scopeNotice); expect(html).toContain(text.report.button);
    expect(html).toContain('dir="' + (lang === "ar" ? "rtl" : "ltr") + '"');
    expect(html).toContain('href="https://quran.com/2/183"'); expect(html).toContain("M.A.S. Abdel Haleem");
    expect(html).toContain("1904"); expect(html).toContain("1151"); expect(html).toContain("Ibn Baz");
  });
  it("visibly removes earlier source material after withdrawal", () => {
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: "en", sections, text: getDictionary("en").ask, incomplete: true, withdrawn: true }));
    expect(html).toContain("was withdrawn"); expect(html).not.toContain("The Quran connects care"); expect(html).not.toContain('<blockquote');
  });
  it("renders full sources once and points summary citations at their existing cards", () => {
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: "en", sections, text: getDictionary("en").ask, complete: true }));
    expect((html.match(/<blockquote/g) ?? []).length).toBe(3);
    const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    for (const id of targets) expect(html).toContain(`id="${id}"`);
    expect(targets.some(id => id.includes("summary-Q"))).toBe(false);
    expect(html).not.toContain("original is shown below");
  });

  it("does not claim any section passed when all explanations were withheld", () => {
    const empty = sections.slice(0, 3).map(s => ({ ...s, outcome: "failed_check" as const, claims: [], sources: [] }));
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: "en", sections: empty, text: getDictionary("en").ask, incomplete: true }));
    expect(html).toContain("could not produce a checked answer");
    expect(html).not.toContain("sections below passed");
  });

});
