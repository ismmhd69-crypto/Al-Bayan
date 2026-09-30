import { htmlToText, looksLikeQuestion, sharesContentWord, type ParsedFatwa } from "../scholar-excerpt";

// algodayan.com written fatwa pages put the question before "الجواب:" and the answer before the
// scholar-identification footer. Reject anything that lacks both boundaries.
export function parseGhudayyanFatwa(html: string): ParsedFatwa | null {
  const title = htmlToText(html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] ?? "");
  const text = htmlToText(
    html
      .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, ""),
  );
  const answerMark = /(?:^|\n)\s*الجواب\s*[:：]\s*/m.exec(text);
  if (!title || !answerMark) return null;
  const before = text.slice(0, answerMark.index);
  if (!/(?:السؤال|سؤال)\s*[:：]/.test(before)) return null;
  const after = text.slice((answerMark.index ?? 0) + answerMark[0].length);
  const footer = /(?:^|\n)\s*(?:فضيلة الشيخ\s*)?عبد\s*الله\s+بن\s+عبد\s*الرحمن\s+بن\s+غديان/m.exec(after);
  if (!footer) return null;
  const answer = after.slice(0, footer.index).trim();
  if (answer.length < 40 || looksLikeQuestion(answer) || !sharesContentWord(title, answer)) return null;
  return { title, answer, printedSource: null };
}
