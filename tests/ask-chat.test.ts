import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerView } from "@/components/AskChat";
import en from "@/dictionaries/en";
import ar from "@/dictionaries/ar";
import type { Answer } from "@/lib/ask/core";

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
});
