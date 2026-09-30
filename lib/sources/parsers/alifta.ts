// Permanent Committee fatwas from alifta.gov.sa.
//
// This parser deliberately requires both an explicit answer marker and a separate signatory
// block. A committee fatwa is not one individual's words, and a page without its signatures
// must never be imported as if an approved scholar had signed it.

import { htmlToText, looksLikeQuestion, type ParsedFatwa } from "../scholar-excerpt";

export type ParsedAliftaFatwa = ParsedFatwa & {
  signatories: string[];
};

function textWithLines(html: string): string {
  return htmlToText(
    html
      .replace(/<(?:br|\/p|\/div|\/li|\/tr|\/td|\/h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, ""),
  );
}

function titleFrom(html: string): string {
  return htmlToText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "").trim();
}

function printedSourceFrom(text: string): string | null {
  const line = text
    .split("\n")
    .map((value) => value.trim())
    .find((value) => /^(?:المصدر|المرجع)\s*[:：]/.test(value) && /فتاوى اللجنة الدائمة/.test(value));
  return line ? line.replace(/^(?:المصدر|المرجع)\s*[:：]\s*/, "").trim() : null;
}

function signatoriesFrom(tail: string): string[] {
  const lines = tail
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const start = lines.findIndex((value) => /^(?:التوقيعات?|الموقعون|أعضاء اللجنة)(?:\s*[:：]|\s|$)/.test(value));
  if (start < 0) return [];

  const names: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^(?:المصدر|المرجع)\s*[:：]/.test(line)) break;
    const name = line.replace(/^(?:(?:الرئيس|نائب الرئيس|عضو|الأعضاء)\s*[:：-]?\s*)/, "").trim();
    // A name is at least two Arabic words. This excludes role headings, dates and fatwa numbers.
    if (/^[\p{Script=Arabic}\s]+$/u.test(name) && (name.match(/[\p{Script=Arabic}]+/gu) ?? []).length >= 2) {
      if (!names.includes(name)) names.push(name);
    }
  }
  return names.slice(0, 12);
}

export function parseAliftaFatwa(html: string): ParsedAliftaFatwa | null {
  const title = titleFrom(html);
  const text = textWithLines(html);
  const answerMatch = /(?:^|\n)\s*(?:الجواب|ج)\s*[:：]\s*/m.exec(text);
  if (!title || !answerMatch) return null;

  const afterAnswer = text.slice((answerMatch.index ?? 0) + answerMatch[0].length);
  const signatureMatch = /(?:^|\n)\s*(?:التوقيعات?|الموقعون|أعضاء اللجنة)(?:\s*[:：]|\s|$)/m.exec(afterAnswer);
  if (!signatureMatch) return null;

  const answer = afterAnswer.slice(0, signatureMatch.index).trim();
  const tail = afterAnswer.slice(signatureMatch.index);
  const signatories = signatoriesFrom(tail);

  if (answer.length < 40 || looksLikeQuestion(answer) || signatories.length === 0) return null;
  return { title, answer, printedSource: printedSourceFrom(text), signatories };
}
