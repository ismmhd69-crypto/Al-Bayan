// Parses the saved copy of othmanalkhamees.com/books/10/read into data/khamis/sections.json.
// No network access: reads data/khamis/book10.html. Each section = one written fatwa (number = position).
import fs from "node:fs";
import { htmlToText, stripLetterAndFormula, excerpt, looksLikeQuestion, startsLikeRoomTalk, quoteStemSet, isNearDuplicate } from "../lib/sources/scholar-excerpt";

const html = fs.readFileSync("data/khamis/book10.html", "utf-8");
const parts = html.split('<section class="book-page-section').slice(1);
const out: any[] = [];
const stems: Set<string>[] = [];
parts.forEach((raw, i) => {
  const sec = raw.slice(0, raw.indexOf("</section>"));
  const blocks = [...sec.matchAll(/<div class="book-qa-block"><h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)<\/div>(?=<div class="book-qa-block">|<\/div>|$)/g)];
  let q = "", a = "";
  for (const b of blocks) {
    const label = htmlToText(b[1]);
    const text = htmlToText(b[2]);
    if (label.includes("السؤال")) q += (q ? "\n" : "") + text;
    else if (label.includes("الجواب")) a += (a ? "\n" : "") + text;
  }
  const answerClean = stripLetterAndFormula(a);
  const ex = excerpt(answerClean);
  const flags: string[] = [];
  if (!q) flags.push("no_question");
  if (!a) flags.push("no_answer");
  if (ex === null) flags.push(answerClean.length > 600 ? "no_sentence_cut" : "empty");
  else {
    if (ex.length < 120) flags.push("short<120");
    if (startsLikeRoomTalk(ex)) flags.push("room_talk");
    if (looksLikeQuestion(ex)) flags.push("looks_like_question");
    const st = quoteStemSet(ex);
    if (isNearDuplicate(st, stems, 0.7)) flags.push("near_dup");
    stems.push(st);
  }
  out.push({ n: i + 1, question: q, answerFull: answerClean, answerLen: answerClean.length, excerpt: ex, flags, hasMultiBlocks: blocks.length !== 2 });
});
fs.writeFileSync("data/khamis/sections.json", JSON.stringify(out, null, 1), "utf-8");
const c: Record<string, number> = {};
for (const o of out) for (const f of o.flags.length ? o.flags : ["ok"]) c[f] = (c[f] ?? 0) + 1;
console.log(out.length, c, "oddBlocks:", out.filter((o) => o.hasMultiBlocks).map((o) => o.n).join(","));
