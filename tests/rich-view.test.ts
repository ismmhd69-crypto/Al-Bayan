import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichAnswerView, richSourceCards } from "@/components/RichAnswerView";
import { getDictionary } from "@/lib/i18n";
import { richText } from "@/lib/ask/rich-text";
import { sections } from "./fixtures/rich";
import { emptyPatientState } from "@/lib/ask/patient-protocol";
describe("rich evidence reading view", () => {
  it.each(["en", "ar", "de"] as const)("shows no invented or empty next-step footer when guidance is absent in %s", lang => {
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: lang, sections, text: getDictionary(lang).ask, complete: true, guide: null }));
    expect(html).not.toContain(richText[lang].guidance);
    expect(html).toContain(richText[lang].scopeNotice);
  });
  it.each(["en", "ar", "de"] as const)("hides empty source groups and headings in %s", lang => {
    const shown = structuredClone(sections);
    shown[1] = { group: "hadith", outcome: "no_direct_evidence", claims: [], sources: [] };
    shown[2] = { group: "scholar", outcome: "no_direct_evidence", claims: [], sources: [] };
    shown[3].claims = [{ ...shown[3].claims[0], refs: [shown[0].sources[0].id] }];
    shown[3].sources = shown[0].sources;
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: lang, sections: shown, text: getDictionary(lang).ask, complete: true }));
    expect(html).toContain(richText[lang].titles.quran);
    expect(html).not.toContain(richText[lang].titles.hadith);
    expect(html).not.toContain(richText[lang].titles.scholar);
    expect(html).not.toContain(richText[lang].outcomes.no_direct_evidence);
    expect(html).not.toContain(richText[lang].incomplete);
    expect(html).not.toContain(richText[lang].limited);
  });
  it.each(["en", "ar", "de"] as const)("describes pending patient work without claiming completion in %s", lang => {
    const patient = emptyPatientState("00000000-0000-4000-8000-000000000001", lang);
    const html = renderToStaticMarkup(createElement(RichAnswerView, { language: lang, sections: [], text: getDictionary(lang).ask, patient }));
    expect(html).toContain(richText[lang].patientNotice);
    expect(html).toContain(richText[lang].patientSummaryWaiting);
    expect(html).not.toContain(richText[lang].incomplete);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain(`dir="${lang === "ar" ? "rtl" : "ltr"}"`);
  });
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

it.each(["en", "ar", "de"] as const)("does not describe an intentionally omitted optional group as failed research in %s", lang => {
  const shown = structuredClone(sections);
  shown[1] = { group: "hadith", outcome: "not_checked", omitted: true, claims: [], sources: [] };
  shown[2] = { group: "scholar", outcome: "not_checked", omitted: true, claims: [], sources: [] };
  shown[3].claims = [{ ...shown[3].claims[0], refs: [shown[0].sources[0].id] }]; shown[3].sources = shown[0].sources;
  const props = { language: lang, sections: shown, text: getDictionary(lang).ask, complete: true };
  const html = renderToStaticMarkup(createElement(RichAnswerView, props));
  expect(html).not.toContain(richText[lang].limited);
  expect(html).not.toContain(richText[lang].titles.hadith);
  shown[1].searchOutcome = "search_failed";
  expect(renderToStaticMarkup(createElement(RichAnswerView, props))).toContain(richText[lang].limited);
});
