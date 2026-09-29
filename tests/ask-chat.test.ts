import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerView } from "@/components/AskChat";
import en from "@/dictionaries/en";
import type { Answer } from "@/lib/ask/core";

const base: Answer = {
  language: "en",
  claims: [{ text: "A short checked explanation.", refs: ["2:1"] }],
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
