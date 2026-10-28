import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { StableAnswerView } from "@/components/StableAnswerView";
import AskChat from "@/components/AskChat";
import { graphemes, RevealContext } from "@/components/VerifiedReveal";
import { RichAnswerView, richSourceCards } from "@/components/RichAnswerView";
import { emptyPublication, reducePublication } from "@/lib/ask/publication";
import { emptyRichState } from "@/lib/ask/rich-answer";
import { getDictionary } from "@/lib/i18n";
import { sections, richAnswer } from "./fixtures/rich";
import type { RichSection } from "@/lib/ask/rich-answer";
import { richText } from "@/lib/ask/rich-text";

it.each(["en", "ar"] as const)("reveals every source group strictly from top to bottom in %s", language => {
  for (const group of ["quran", "hadith", "scholar"] as const) {
    const fixture = sections.find(s => s.group === group)!;
    const ids = group === "quran" ? ["Q42:41", "Q4:148", "Q42:40"] : group === "hadith" ? ["HE9003", "HE9001", "HE9002"]
      : ["S33333333-3333-3333-3333-333333333333", "S22222222-2222-2222-2222-222222222222", "S44444444-4444-4444-4444-444444444444"];
    const section: RichSection = { ...fixture, presentation: "originals", claims: [], sources: ids.map(id => {
      const source = fixture.sources[0], e = source.evidence;
      return { ...source, id, evidence: e.kind === "quran" ? { ...e, key: id.slice(1), url: `https://quran.com/${id.slice(1).replace(":", "/")}` }
        : e.kind === "hadith" ? { ...e, key: id, url: `https://hadeethenc.com/en/browse/hadith/${id.slice(2)}` }
        : { ...e, key: id } };
    }) };
    let publication = emptyPublication();
    for (const earlier of ["quran", "hadith", "scholar"] as const) {
      if (earlier === group) break;
      publication = reducePublication(publication, { type: "group_status", group: earlier, status: "empty" });
    }
    publication = reducePublication(publication, { type: "section_committed", section, commit_id: "a".repeat(64), evidence_snapshot: "b".repeat(64) });
    const state = { ...emptyRichState(), version: 3 as const, requestId: "ordered-fixture", publication, sections: [section] };
    const ordered = richSourceCards(section).flat();
    const visible = (count: number) => {
      const html = renderToStaticMarkup(createElement(StableAnswerView, { state, language, text: getDictionary(language).ask, working: true,
        memory: new Map([["ordered-fixture", { [group]: count }]]) }));
      return [...html.matchAll(new RegExp(`id="[^"]*-${group}-([^"]+)" tabindex="-1"`, "g"))].map(m => m[1]);
    };
    let count = graphemes(richText[language].titles[group], language).length;
    expect(visible(count)).toEqual([]);
    for (const [index, source] of ordered.entries()) {
      const prefix = ordered.slice(0, index + 1).map(s => s.id);
      expect(visible(count + 1)).toEqual(prefix);
      count += graphemes(source.evidence.arabic, language).length;
      const translation = source.evidence.kind === "scholar" ? null : source.evidence.translation;
      if (language !== "ar" && translation) count += graphemes(translation, language).length;
      expect(visible(count)).toEqual(prefix);
    }
    expect(visible(Infinity)).toEqual(ordered.map(s => s.id));
  }
});
it("updates Quran checking progress and stops the loader after a connection interruption", () => {
  const publication = reducePublication(emptyPublication(), { type: "group_status", group: "quran", status: "checking" });
  const state = { ...emptyRichState(), version: 3 as const, publication };
  const render = (value: typeof state, working: boolean) => renderToStaticMarkup(createElement(StableAnswerView, { state: value, language: "en", text: getDictionary("en").ask, working, memory: new Map() }));
  expect(render(state, true)).toContain("Checking the Quran");
  expect(render({ ...state, terminal: true, result: { status: "incomplete", failureKind: "connection_interrupted" } } as typeof state, false)).not.toContain("role=\"status\" aria-live=\"polite\"");
});
it.each(["en", "ar"] as const)("shows citation chips only after their sentence finishes revealing in %s", language => {
  const id = "quran-claim-0", text = language === "ar" ? "قُرْآنٌ" : sections[0].claims[0].text;
  const glyphs = graphemes(text, language), start = 5;
  const render = (count: number) => renderToStaticMarkup(createElement(RevealContext.Provider, {
    value: { texts: { [id]: { text, glyphs, start, group: "quran" } }, counts: { quran: count } },
  }, createElement(RichAnswerView, { language, sections: [{ ...sections[0], claims: [{ ...sections[0].claims[0], text }] }], text: getDictionary(language).ask })));
  const citation = 'href="#';
  expect(render(start + glyphs.length - 1)).not.toContain(citation);
  expect(render(start + glyphs.length)).toContain(citation);
  expect(render(Infinity)).toContain(citation);
});
it("keeps Arabic letters and attached tashkeel together without changing original text", () => {
  const original = "قُرْآنٌ وَسُنَّةٌ";
  const pieces = graphemes(original, "ar");
  expect(pieces[0]).toBe("قُ"); expect(pieces.join("")).toBe(original);
  expect(pieces.some(p => /^\p{Mark}/u.test(p))).toBe(false);
});
it.each(["en", "ar"] as const)("starts with the Quran loader and makes no invented scholar claim in %s", language => {
  const html = renderToStaticMarkup(createElement(StableAnswerView, { state: { ...emptyRichState(), version: 3 }, language, text: getDictionary(language).ask, working: true, memory: new Map() }));
  expect(html).toContain('data-research-stage="searching_quran"');
  expect(html).toContain('role="status"'); expect(html).not.toContain("Ibn Kathir");
  expect(html).not.toContain("This answer is incomplete"); expect(html).not.toContain("Bayan’s summary");
});
it("keeps Quran, Sunnah, scholars and conclusion in order with the final disclaimer", () => {
  let publication = emptyPublication();
  sections.forEach((section, index) => { publication = reducePublication(publication, { type: "section_committed", section, commit_id: String(index + 1).repeat(64), evidence_snapshot: "a".repeat(64) }); });
  const state = { ...emptyRichState(), version: 3 as const, requestId: "fixture", publication, sections, terminal: true, result: { status: "rich_answer", answer: richAnswer } };
  const html = renderToStaticMarkup(createElement(StableAnswerView, { state, language: "en", text: getDictionary("en").ask, working: false, memory: new Map([["fixture", { quran: Infinity, hadith: Infinity, scholar: Infinity, summary: Infinity }]]) }));
  const positions = ["From the Quran", "From the Sunnah", "Scholars’ explanations", "Bayan’s summary", "Not a fatwa."].map(t => html.indexOf(t));
  expect(positions.every(i => i >= 0)).toBe(true); expect(positions).toEqual([...positions].sort((a, b) => a - b));
});
it("hides only the rejected explanation and keeps its original source card", () => {
  let publication = reducePublication(emptyPublication(), { type: "section_committed", section: sections[0], commit_id: "1".repeat(64), evidence_snapshot: "a".repeat(64) });
  publication = reducePublication(publication, { type: "integrity_notice", notice: { group: "quran", claimIndexes: [0], sourceIds: [], reason: "unsupported_claim" } });
  const state = { ...emptyRichState(), version: 3 as const, requestId: "fixture", publication, sections: [sections[0]], terminal: true, result: { status: "incomplete" } };
  const html = renderToStaticMarkup(createElement(StableAnswerView, { state, language: "en", text: getDictionary("en").ask, working: false, memory: new Map([["fixture", { quran: Infinity }]]) }));
  expect(html).not.toContain(sections[0].claims[0].text); expect(html).toContain(sections[0].sources[0].evidence.arabic); expect(html).toContain("This section needs review");
});
it("buffers a completed Sunnah section while Quran research is still unfinished", () => {
  const publication = reducePublication(emptyPublication(), { type: "section_committed", section: sections[1], commit_id: "2".repeat(64), evidence_snapshot: "a".repeat(64) });
  const state = { ...emptyRichState(), version: 3 as const, requestId: "fixture", publication, sections: [sections[1]] };
  const html = renderToStaticMarkup(createElement(StableAnswerView, { state, language: "en", text: getDictionary("en").ask, working: true, memory: new Map() }));
  expect(html).toContain("Searching the Holy Quran"); expect(html).not.toContain("From the Sunnah");
  expect(html).not.toContain("Show full text");
});
it("tells the reader when a safe continuation is being checked", () => {
  const state = { ...emptyRichState(), version: 3 as const, requestId: "fixture", publication: emptyPublication() };
  const render = (language: "en" | "ar", reconnecting: boolean) => renderToStaticMarkup(createElement(StableAnswerView,
    { state, language, text: getDictionary(language).ask, working: true, reconnecting, memory: new Map() }));
  expect(render("en",true)).toContain("Checking whether research can continue safely");
  expect(render("ar",true)).toContain("انقطع الاتصال");
  expect(render("en",false)).not.toContain("Checking whether research can continue safely");
});
it("does not offer Continue for a locked answer with an integrity notice", () => {
  const committed = reducePublication(emptyPublication(), { type: "section_committed", section: sections[0], commit_id: "1".repeat(64), evidence_snapshot: "a".repeat(64) });
  const flagged = reducePublication(committed, { type: "integrity_notice", notice: { group: "quran", claimIndexes: [0], sourceIds: [], reason: "unsupported_claim" } });
  const render = (publication: typeof committed) => renderToStaticMarkup(createElement(AskChat, {
    lang: "en", t: getDictionary("en").ask, backLabel: "Home", suggestions: [], testMode: false, richEnabled: true,
    initialMessages: [{ role: "bayan", reply: { kind: "stable", question: "Invented public fixture", state: { ...emptyRichState(), version: 3, requestId: "fixture", publication, sections: [sections[0]], terminal: true,
      result: { status: "incomplete" }, continuation: { token: "1".repeat(64), available: true, remaining: 3, expires: Date.now() + 100000 } } } }],
  }));
  expect(render(committed)).toContain("Continue answer");
  expect(render(flagged)).not.toContain("Continue answer");
  expect(render(flagged)).toContain("This section needs review");
  expect(render(flagged)).not.toContain("A later check found a problem");
});
it("offers a status check, not a paid continuation, when the previous request is still busy", () => {
  const publication = reducePublication(emptyPublication(), { type:"section_committed", section:sections[0], commit_id:"1".repeat(64), evidence_snapshot:"a".repeat(64) });
  const html=renderToStaticMarkup(createElement(AskChat, { lang:"en", t:getDictionary("en").ask, backLabel:"Home", suggestions:[], testMode:false, richEnabled:true,
    initialMessages:[{role:"bayan",reply:{kind:"stable",question:"Invented public fixture",state:{...emptyRichState(),version:3,requestId:"fixture",publication,sections:[sections[0]],terminal:true,
      result:{status:"incomplete",failureKind:"connection_interrupted"},continuation:{token:"1".repeat(64),available:false,reason:"busy",remaining:1,expires:Date.now()+100000}}}}] }));
  expect(html).not.toContain("Continue answer");expect(html).toContain("Check again");
});

it("lets an Arabic answer read in its natural direction inside an English interface", () => {
  const section: RichSection = { ...sections[3], claims: [{ ...sections[3].claims[0], text: "هذه إجابة تجريبية عربية." }] };
  const html = renderToStaticMarkup(createElement(RichAnswerView, { sections: [section], language: "en", text: getDictionary("en").ask, complete: true }));
  expect(html).toMatch(/<p class="[^"]*claim[^"]*" dir="auto">/);
  expect(html).toContain("هذه إجابة تجريبية عربية.");
});
