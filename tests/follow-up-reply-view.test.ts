import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { RichAnswerView } from "@/components/RichAnswerView";
import { FollowUpReply, conversationalOf } from "@/components/FollowUpReply";
import { emptyRichState, type RichAnswer, type RichSection } from "@/lib/ask/rich-answer";
import { richText } from "@/lib/ask/rich-text";
import { getDictionary } from "@/lib/i18n";
import { toEvidence } from "@/lib/ask/core";
import { pack, scholarId } from "./fixtures/rich";

// Invented wording. These fixtures establish display behaviour, not theology.
const source = (id: string) => { const p = pack.passages.find(x => x.id === id)!; return { id, evidence: toEvidence(p.source, "en"), role: "direct" as const, requirementIds: ["R1"], explanationRequirementIds: [] }; };
const originals = (group: "quran" | "hadith" | "scholar", ids: string[]): RichSection => ids.length
  ? { group, outcome: "ready", presentation: "originals", claims: [], sources: ids.map(source) } : { group, outcome: "no_direct_evidence", claims: [], sources: [] };
const sections: RichSection[] = [originals("quran", ["Q2:183"]), originals("hadith", []), originals("scholar", [scholarId]),
  { group: "summary", outcome: "ready", claims: [{ text: "Put simply, care is a thoughtful responsibility.", refs: ["Q2:183", scholarId], requirementId: "R1" }], sources: [source("Q2:183"), source(scholarId)] }];
const text = getDictionary("en").ask;
const cards = (html: string) => [...html.matchAll(/data-source-id="([^"]+)"/g)].map(m => m[1]);

it("shows a follow-up as natural text and does not repeat cards already in the chat", () => {
  const html = renderToStaticMarkup(createElement(RichAnswerView, { sections, language: "en", text, guide: null, complete: true, conversational: { repeated: new Set(["Q2:183", scholarId]) } }));
  expect(html).toContain("Put simply, care is a thoughtful responsibility.");
  expect(cards(html)).toEqual([]);
  expect(html).not.toContain(richText.en.newSources);
  // The links to earlier sources stay, pointing at the exact passage.
  expect(html).toContain("https://quran.com/2/183");
  // No repeated disclaimers or four-part layout on a chat reply.
  expect(html).not.toContain("Not a fatwa");
  expect(html).toContain('class="sr-only"');
});

it("shows cards only for sources new to the chat", () => {
  const html = renderToStaticMarkup(createElement(RichAnswerView, { sections, language: "en", text, guide: null, complete: true, conversational: { repeated: new Set(["Q2:183"]) } }));
  expect(cards(html)).toEqual([scholarId]);
  expect(html).toContain(richText.en.newSources);
  expect(html.indexOf("Put simply")).toBeLessThan(html.indexOf(`data-source-id="${scholarId}"`));
});

it("leaves a normal answer unchanged: every card and the usual footer", () => {
  const html = renderToStaticMarkup(createElement(RichAnswerView, { sections, language: "en", text, guide: null, complete: true }));
  expect(cards(html).sort()).toEqual(["Q2:183", scholarId].sort());
  expect(html).toContain("Not a fatwa");
});

it("shows only a short status while a follow-up is being written, and an honest note if it cannot be", () => {
  const working = { ...emptyRichState(), conversational: "explain" as const, progress: "follow_up_explain" as const };
  expect(conversationalOf(working)).toBe("explain");
  const props = { mode: "explain" as const, language: "en" as const, text, repeated: new Set<string>() };
  const waiting = renderToStaticMarkup(createElement(FollowUpReply, { ...props, state: working, working: true }));
  expect(waiting).toContain(richText.en.progress.follow_up_explain); expect(cards(waiting)).toEqual([]);
  const failed = renderToStaticMarkup(createElement(FollowUpReply, { ...props, working: false,
    state: { ...working, terminal: true, result: { status: "incomplete", language: "en", withdraw: false, failureKind: "wording_rejected" } } }));
  expect(failed).toContain(richText.en.followUpFailed); expect(failed).not.toContain("Put simply");
  const answer: RichAnswer = { version: 4, language: "en", review: "automatic", complete: true, sections, conversational: "explain" };
  const done = renderToStaticMarkup(createElement(FollowUpReply, { ...props, working: false, repeated: new Set(["Q2:183", scholarId]),
    state: { ...emptyRichState(), terminal: true, result: { status: "rich_answer", answer } } }));
  expect(done).toContain("Put simply, care is a thoughtful responsibility."); expect(cards(done)).toEqual([]);
  // The finished answer decides the mode, including after a fall-back to searching.
  expect(conversationalOf({ ...working, terminal: true, result: { status: "rich_answer", answer: { ...answer, conversational: "look_further" } } })).toBe("look_further");
  expect(conversationalOf(emptyRichState())).toBeUndefined();
});

it("tells the visitor plainly when a search follow-up found nothing on the new point", () => {
  const state = { ...emptyRichState(), conversational: "look_further" as const, terminal: true, result: { status: "incomplete", language: "en", withdraw: false, failureKind: "question_coverage" } };
  const html = renderToStaticMarkup(createElement(FollowUpReply, { state, mode: "look_further", language: "en", text, working: false, repeated: new Set<string>() }));
  expect(html).toContain("find a checked source that answers this specific point"); expect(html).not.toContain(richText.en.followUpFailed);
  const arabic = renderToStaticMarkup(createElement(FollowUpReply, { state, mode: "look_further", language: "ar", text: getDictionary("ar").ask, working: false, repeated: new Set<string>() }));
  expect(arabic).toContain(richText.ar.followUpNotFound);
});
