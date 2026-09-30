import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerView } from "@/components/AskChat";
import en from "@/dictionaries/en";
import ar from "@/dictionaries/ar";
import type { Answer } from "@/lib/ask/core";
import type { AnswerV2 } from "@/lib/ask/answer-v2";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { HADITH_ATTRIBUTION } from "@/lib/sources/hadith-rules";

const base: Answer = {
  language: "en",
  claims: [{ text: "A short checked explanation.", refs: ["2:1"] }],
  direct_answer: [{ text: "A short checked explanation.", source_ids: ["2:1"] }],
  explanation: [],
  not_established: [],
  evidence: [{
    kind: "quran",
    key: "2:1",
    arabic: "نص تجريبي",
    translation: "Test source text",
    translationName: "Test translation",
    url: "https://example.test/source",
  }],
  attribution: { text: "Test attribution", url: "https://example.test/attribution" },
  model: "test-writer",
  verifier: "test-verifier",
};

const render = (answer: Answer, id: number) => renderToStaticMarkup(createElement(AnswerView, { a: answer, t: en.ask, id }));

const v2 = (extra: Partial<AnswerV2> = {}): AnswerV2 => ({
  version: 2,
  language: "en",
  origin: "live",
  review: "automatic",
  simple_answer: {
    sentences: [{ text: "A clear checked answer.", source_ids: ["Q2:1"], requirement_id: "R1" }],
    list: [
      { text: "First checked step.", source_ids: ["Q2:1"], requirement_id: "R1" },
      { text: "Second checked step.", source_ids: ["Q2:1"], requirement_id: "R1" },
    ],
  },
  quran: [{
    id: "quran-2-1", source_ids: ["Q2:1"], points: ["R1"], cited: true,
    verses: [{ id: "Q2:1", key: "2:1", arabic: "نص عربي تجريبي", translation: "Made-up translation.",
      translation_name: "Test translation", url: "https://quran.com/2/1" }],
  }],
  hadith: [],
  scholars: [],
  videos: [],
  attribution: { quran: { ...ATTRIBUTION } },
  provenance: { model: "test-writer", verifier: "test-verifier" },
  ...extra,
});

describe("Ask answer sections", () => {
  it("shows the direct answer, cited sections and a clearly separate source-limit note", () => {
    const html = render({ ...base,
      explanation: [{ heading: "Why", sentences: [{ text: "A further explanation.", source_ids: ["2:1"] }] }],
      not_established: [{ text: "These sources leave another reason open." }],
    }, 3);
    expect(html.indexOf("A short checked explanation.")).toBeLessThan(html.indexOf("A further explanation."));
    expect(html).toContain(en.ask.parts.limit);
    expect(html).toContain("These sources leave another reason open.");
    expect(html.match(/class="ref"/g)).toHaveLength(2);
  });
  it("keeps Arabic answer text right to left with keyboard source links", () => {
    const answer: Answer = { ...base, language: "ar",
      direct_answer: [{ text: "هذا جواب موثق.", source_ids: ["2:1"] }], explanation: [], not_established: [] };
    const html = renderToStaticMarkup(createElement(AnswerView, { a: answer, t: ar.ask, id: 4 }));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('href="#ev-4-2-1"');
    expect(html).toContain('aria-label=');
  });
  it("does not render an empty scholar section", () => {
    const html = render(base, 1);
    expect(html).not.toContain(en.ask.parts.scholars);
    expect(html).not.toContain(en.ask.scholarsEmpty);
  });

  it("renders optional videos inside a collapsed details section with their language", () => {
    const answer: Answer = {
      ...base,
      videos: [{
        youtubeId: "abcdefghijk",
        channelId: "UCiiJRwQ0MUaQo8ZZuf18pPw",
        title: "Directly relevant title",
        minutes: 4,
        language: "en",
      }],
    };
    const html = render(answer, 2);
    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("English · 4 min");
  });

  it("renders AnswerV2 in the fixed section order and keeps More explanation closed", () => {
    const answer: Answer = { ...base, v2: v2({
      simple_answer: { sentences: [
        { text: "A clear checked answer.", source_ids: ["Q2:1"], requirement_id: "R1" },
        { text: "The Prophet taught another checked point.", source_ids: ["HE9"], requirement_id: "R1" },
        { text: "Shaykh Ibn Baz explained a checked point.", source_ids: ["S22222222-2222-2222-2222-222222222222"], requirement_id: "R1" },
      ] },
      hadith: [{ id: "HE9", points: ["R1"], cited: true, collection: "bukhari", numbers: { bukhari: 9, muslim: null },
        grade_ar: "صحيح", attribution_ar: "رواه البخاري", arabic: "نص حديث تجريبي", translation: "Made-up hadith translation.",
        translation_language: "en", url: "https://hadeethenc.com/en/browse/hadith/9" }],
      scholars: [{ id: "S22222222-2222-2222-2222-222222222222", points: ["R1"], cited: true, scholar_id: "ibn-baz",
        scholar_name: "Shaykh Ibn Baz", title: "عنوان تجريبي", reference: "مرجع تجريبي", arabic: "نص عالم تجريبي",
        url: "https://binbaz.org.sa/fatwas/9/test" }],
      more_explanation: [{ heading: "Details", sentences: [
        { text: "A further checked detail.", source_ids: ["Q2:1"], requirement_id: "R1" },
      ] }],
      attribution: { quran: { ...ATTRIBUTION }, hadith: { ...HADITH_ATTRIBUTION } },
    }) };
    const html = render(answer, 8);
    expect(html.indexOf(en.ask.v2.simpleAnswer)).toBeLessThan(html.indexOf(en.ask.v2.quran));
    expect(html.indexOf(en.ask.v2.quran)).toBeLessThan(html.indexOf(en.ask.v2.hadith));
    expect(html.indexOf(en.ask.v2.hadith)).toBeLessThan(html.indexOf(en.ask.v2.scholars));
    expect(html).toContain(`<summary><svg`);
    expect(html).toContain(en.ask.v2.moreExplanation);
    expect(html).not.toContain("<details open");
    expect(html).not.toContain(en.ask.parts.evidence);
  });

  it("uses internal source anchors, isolated left-to-right chips and Arabic source direction", () => {
    const html = render({ ...base, v2: v2() }, 9);
    expect(html).toContain('href="#source-9-Q2-1"');
    expect(html).toContain('id="source-9-Q2-1"');
    expect(html).toContain('<bdi dir="ltr">2:1</bdi>');
    expect(html).toContain('lang="ar" dir="rtl" translate="no"');
  });

  it("renders the complete AnswerV2 reading direction right to left in Arabic", () => {
    const arabicV2 = v2({
      language: "ar",
      simple_answer: { sentences: [{ text: "هذا جواب عربي تجريبي.", source_ids: ["Q2:1"], requirement_id: "R1" }] },
      quran: [{ id: "quran-2-1", source_ids: ["Q2:1"], points: ["R1"], cited: true,
        verses: [{ id: "Q2:1", key: "2:1", arabic: "نص عربي تجريبي", translation: null, translation_name: null,
          url: "https://quran.com/2/1" }] }],
    });
    const html = renderToStaticMarkup(createElement(AnswerView, { a: { ...base, language: "ar", v2: arabicV2 }, t: ar.ask, id: 12 }));
    expect(html).toContain('class="answer answer-v2" lang="ar" dir="rtl"');
    expect(html).toContain('<bdi dir="ltr">2:1</bdi>');
  });

  it("hides every empty optional AnswerV2 section", () => {
    const html = render({ ...base, v2: v2() }, 10);
    expect(html).not.toContain(en.ask.v2.hadith);
    expect(html).not.toContain(en.ask.v2.scholars);
    expect(html).not.toContain(en.ask.v2.otherViews);
    expect(html).not.toContain(en.ask.v2.watchMore);
  });

  it("keeps reviewed other views in a closed native fold", () => {
    const quoteId = "S33333333-3333-3333-3333-333333333333";
    const answer: Answer = { ...base, v2: v2({ view_handling: {
      mode: "reviewed_main", decision_id: "test-decision", other_views: [{
        id: "view-b", label_key: "position_b",
        sentences: [{ text: "A scholar explained another supported view.", source_ids: [quoteId], requirement_id: "R1" }],
        scholars: [{ id: quoteId, points: ["R1"], cited: true, scholar_id: "ibn-uthaymeen", scholar_name: "Shaykh Ibn Uthaymeen",
          title: null, reference: "مرجع تجريبي", arabic: "نص عالم تجريبي آخر", url: "https://binothaimeen.net/content/1" }],
      }],
    } }) };
    const html = render(answer, 11);
    expect(html).toContain(en.ask.v2.otherViews);
    expect(html).toContain(en.ask.v2.views.position_b);
    expect(html).not.toContain("<details open");
    expect(html).toContain(`id="source-11-${quoteId}"`);
  });
});
