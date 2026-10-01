// Rules for scholar quotes (Mo's decisions, 2026-09-28): short quotes only, at most 600 characters
// of the scholar's own answer, unchanged, with the printed source and a link to the original page.
// Pure functions with no network access, so they can be tested (tests/scholar-excerpt.test.ts).

import { normalizeArabic } from "@/lib/ask/checks";

export const MAX_QUOTE_CHARS = 600;

// Removes tags and footnote markers, decodes the few entities these pages use, and collapses
// whitespace. Words and punctuation are never changed.
export function htmlToText(html: string): string {
  return html
    .replace(/<sup[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// Opening words of a question or of a letter written TO the scholar.
export function looksLikeQuestion(text: string): boolean {
  const start = text.trim().slice(0, 300);
  if (/^(سماحة|فضيلة|صاحب الفضيلة|السلام عليكم|سؤال|السؤال|س\s*[:：]|ما حكم|ما هو|ما هي|هل|يقول السائل|يسأل)/.test(start)) return true;
  return /[؟?]/.test(start);
}

// The printed collection reference, when the footnote names Majmu' Fatawa Ibn Baz.
export function printedCollection(cite: string | null): { reference: string; collection: string } | null {
  const m = cite?.match(/مجموع فتاوى ومقالات[^()]*?ابن باز\s*\(?\s*(\d+)\s*\/\s*(\d+)\s*\)?/);
  if (!m) return null;
  return { reference: `مجموع فتاوى ومقالات الشيخ ابن باز (${m[1]}/ ${m[2]})`, collection: "مجموع فتاوى ومقالات الشيخ ابن باز" };
}

export type ParsedFatwa = {
  title: string;
  answer: string; // the scholar's answer only (the question is left out)
  printedSource: string | null; // e.g. "مجموع فتاوى ومقالات الشيخ ابن باز (6/ 298)"
};

import type { AIProvider } from "@/lib/ai/types";

// Rule 1: Opening formula (Basmalah, Hamd, Salawat ending with أما بعد / وبعد)
export function stripOpeningFormula(text: string): string {
  let t = text.trim();
  const praise = /^(?:بسم\s+الله\s+الرحمن\s+الرحيم[،.\s]*)?(?:الحمد\s+لله|حمداً\s+لله|نحمده|إن\s+الحمد\s+لله)[\s\S]{0,500}?(?:أما\s+بعد|وبعد)\s*[:：،,]?\s*/i.exec(t);
  if (praise) {
    t = t.slice(praise[0].length).trim();
  }
  const basmalah = /^بسم\s+الله\s+الرحمن\s+الرحيم[،.\s]*/i.exec(t);
  if (basmalah && basmalah[0].length < 60 && t.length > basmalah[0].length + 40) {
    t = t.slice(basmalah[0].length).trim();
  }
  const amaBaad = /^(?:أما\s+بعد|وبعد|بعده)\s*[:：،,]?\s*/i.exec(t);
  if (amaBaad) {
    t = t.slice(amaBaad[0].length).trim();
  }
  return t;
}

// Rule 2: Letters (heading, greetings, receipt preambles, and signoffs)
export function stripLetterHeading(text: string): string {
  let t = text.trim();
  const letterHead = /^من\s+(?:عبد\s*العزيز\s+بن\s+عبد\s*الله\s+بن\s+باز|محمد\s+(?:بن\s+صالح|الصالح)\s+(?:العثيمين|بن\s+عثيمين))[\s\S]{0,450}?(?:سلام\s+عليكم|السلام\s+عليكم|وعليكم\s+السلام)[\s\S]{0,200}?(?:أما\s+بعد|وبعد|بعده)\s*[:：،,]?\s*/i.exec(t);
  if (letterHead) {
    t = t.slice(letterHead[0].length).trim();
  }

  const greeting = /^(?:وعليكم\s+السلام|السلام\s+عليكم|سلام\s+عليكم)(?:\s+ورحمة\s+الله(?:\s+وبركاته)?)?[،.\s]*(?:(?:أما\s+بعد|وبعد|بعده)\s*[:：،,]?\s*)?/i.exec(t);
  if (greeting) {
    t = t.slice(greeting[0].length).trim();
  }

  const letterPreamble = /^فقد\s+(?:وصلني|اطلعت\s+على|تكررت\s+الأسئلة|ورد\s+(?:إلينا|إلي|لنا))[\s\S]{0,250}?(?:وهذا\s+جوابها|والجواب\s+عن\s+ذلك|والجواب)\s*[:：،,]?\s*/i.exec(t);
  if (letterPreamble) {
    t = t.slice(letterPreamble[0].length).trim();
  }

  const advicePreamble = /^(?:أقول\s+وبالله\s+التوفيق|والجواب\s+عن\s+ذلك|والجواب\s*[:：])\s*[:：،,]?\s*/i.exec(t);
  if (advicePreamble) {
    t = t.slice(advicePreamble[0].length).trim();
  }

  t = t.replace(/(?:والسلام\s+عليكم\s+ورحمة\s+الله\s+وبركاته|وفق\s+الله\s+الجميع|والله\s+الموفق|وصلى\s+الله\s+وسلم\s+على\s+نبينا\s+محمد)\.?\s*$/i, "").trim();

  return t;
}

// Strips letter heading, greeting, and opening formula
export function stripLetterAndFormula(text: string): string {
  return stripOpeningFormula(stripLetterHeading(text));
}

// Rule 5: AI relevance checker
export async function checkQuoteRelevance(
  verifier: AIProvider,
  title: string,
  quote: string
): Promise<{ answers: boolean; reason: string }> {
  try {
    const prompt = `Title: ${title}\nQuote: ${quote}\n\nDoes this quote answer or directly address the title's question/topic?`;
    const res = (await verifier.generateJson({
      system:
        "You are a precise classifier checking if an Islamic scholar fatwa quote directly answers or addresses the specific question/topic in the title. If the quote is about an unrelated topic, or only addresses a different question, answer false. Answer strictly in JSON.",
      prompt,
      schema: {
        type: "object",
        properties: {
          answers: { type: "boolean", description: "Whether the quote directly answers or addresses the title question/topic" },
          reason: { type: "string", description: "Short explanation in English" },
        },
        required: ["answers", "reason"],
      },
    })) as { answers: boolean; reason: string };
    return res;
  } catch (err) {
    return { answers: false, reason: (err as Error).message };
  }
}

// Rule 4: Ibn Uthaymeen tafsir lessons are lessons, not fatwas
export function isUthaymeenTafsirLesson(title: string): boolean {
  return /^(تفسير\s+(سورة|آيات|أواخر|أوائل|الآيات|السورة)|في\s+ظلال\s+سورة)/i.test(title.trim());
}

// binbaz.org.sa fatwa page: <article class="fatwa"> ... <section class="footnotes"><cite>source</cite>.
export function parseBinBazFatwa(
  html: string,
  options?: { title?: string; printedSource?: string | null; minChars?: number }
): ParsedFatwa | null {
  const start = html.indexOf('<article class="fatwa"');
  if (start < 0) return null;
  const end = html.indexOf("</article>", start);
  const article = html.slice(start, end < 0 ? undefined : end);
  const title = htmlToText(options?.title ?? (article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "")).trim();
  const cite = article.match(/<section class="footnotes">[\s\S]*?<cite>([\s\S]*?)<\/cite>/i)?.[1];
  const body = htmlToText(
    article
      .replace(/<section class="footnotes">[\s\S]*$/i, "")
      .replace(/<h1[\s\S]*?<\/h1>/i, "")
      // audio player and download buttons of radio-programme fatwas
      .replace(/<(audio|button)[\s\S]*?<\/\1>/gi, ""),
  )
    .replace(/play\s+max\s+volume/gi, "")
    .replace(/تحميل المادة/g, "");
  // Question-and-answer formats: keep only what follows the answer mark ("ج:" or "الجواب:").
  const answerMark = body.search(/(^|\s)(ج|الجواب)\s*[:：]/);
  // Without an answer mark the whole text must be the Shaykh's own words. A page that opens with a
  // question or a letter addressed to him is skipped: his name must never carry someone else's words.
  if (answerMark < 0 && looksLikeQuestion(body)) return null;
  let answer = (answerMark >= 0 ? body.slice(answerMark).replace(/^\s*(ج|الجواب)\s*[:：]\s*/, "") : body).trim();
  // Radio programmes continue with the presenter or a follow-up question: stop the answer there.
  const dialogue = answer.search(/(^|\s)(الشيخ|المقدم|السائل|السؤال|سؤال|س)\s*[:：]/);
  if (dialogue > 0) answer = answer.slice(0, dialogue).trim();

  // Rule 1 & 2: Skip letter heading and opening formula
  answer = stripLetterAndFormula(answer);

  // Rule 3: When page holds multiple numbered answers, take the one matching the title
  const hasMultipleNumbered = /(?:^|\s)(?:أولًا|أولا|1|١)\s*[:：]/.test(answer) && /(?:^|\s)(?:ثانيًا|ثانيا|2|٢)\s*[:：]/.test(answer);
  if (hasMultipleNumbered) {
    const parts = answer.split(/(?=(?:أولًا|ثانيًا|ثالثًا|رابعًا|خامسًا|أولا|ثانيا|ثالثا|رابعا|خامسا|\n\d+\s*[-–:])\s*[:：]?)/);
    for (const p of parts) {
      const cleanP = stripLetterAndFormula(p.replace(/^(?:أولًا|ثانيًا|ثالثًا|رابعًا|خامسًا|أولا|ثانيا|ثالثا|رابعا|خامسا|\d+\s*[-–:])\s*[:：]?\s*/, ""));
      if (sharesContentWord(title, cleanP) && cleanP.length >= (options?.minChars ?? 40)) {
        answer = cleanP;
        break;
      }
    }
  }

  const minChars = options?.minChars ?? 40;
  if (!title || answer.length < minChars) return null;
  return { title, answer, printedSource: options?.printedSource ?? (cite ? htmlToText(cite).replace(/\.$/, "") : null) };
}

// binothaimeen.net fatwa: parsed from page HTML or the site's fatwa objective snippet.
// Extracts only Shaykh Ibn Uthaymeen's own answer, excluding questioner and presenter.
export function parseUthaymeenFatwa(
  html: string,
  options?: { title?: string; printedSource?: string | null; minChars?: number }
): ParsedFatwa | null {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = htmlToText(options?.title ?? (h1Match ? h1Match[1] : "")).replace(/^-\s*/, "").trim();

  // Rule 4: skip tafsir lessons
  if (!title || isUthaymeenTafsirLesson(title)) return null;

  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<audio[\s\S]*?<\/audio>/gi, "")
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "");

  if (h1Match) {
    body = body.replace(/<h1[\s\S]*?<\/h1>/i, "");
  }

  let answerHtml = "";
  const fatwahDivMatch = body.match(/<div[^>]*class=["'][^"']*fatwah-ans-cont[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (fatwahDivMatch) {
    answerHtml = fatwahDivMatch[1];
  } else {
    const ansMarker = body.search(/(<span[^>]*class=["']sidetitle["'][^>]*>\s*الجواب|(?:\s|^)(?:الجواب|ج)\s*[:：])/i);
    if (ansMarker >= 0) {
      answerHtml = body.slice(ansMarker);
      answerHtml = answerHtml.replace(/^[\s\S]*?(الجواب|ج)\s*[:：]?\s*(<\/span>\s*[:：]?)?/i, "");
    } else {
      // Must have an explicit answer marker or fatwah-ans-cont div to guarantee this is a fatwa answer.
      return null;
    }
  }

  answerHtml = answerHtml
    .replace(/^[\s\S]*?<span[^>]*>\s*الشيخ\s*[:：]?\s*<\/span>\s*[:：]?/i, "")
    .replace(/^\s*الشيخ\s*[:：]\s*/i, "");

  let answer = htmlToText(answerHtml).replace(/^الشيخ\s*[:：]\s*/, "").trim();

  const dialogue = answer.search(
    /(^|\s)(الشيخ|المقدم|السائل|السؤال|سؤال|س)\s*[:：]|شكر الله لكم|بارك الله فيكم وفي علمكم|أيها (الأخوة|الإخوة) المستمعون|أجاب على أسئلتكم/
  );
  if (dialogue > 0) {
    answer = answer.slice(0, dialogue).trim();
  }

  // Rule 1 & 2: Strip opening formula and greetings
  answer = stripLetterAndFormula(answer);

  const minChars = options?.minChars ?? 40;
  if (answer.length < minChars) return null;
  if (looksLikeQuestion(answer)) return null;

  return {
    title,
    answer,
    printedSource: options?.printedSource ?? null,
  };
}

// Common Arabic stop words for fatwa titles and questions
export const ARABIC_STOP_WORDS = new Set(
  [
    "ما", "هل", "من", "عن", "في", "على", "الى", "إلى", "حتى", "مع", "عند", "او", "أو", "ثم", "ام", "أم",
    "ان", "انّ", "إن", "إنّ", "انه", "انها", "كان", "كانت", "يكون", "تكون", "ليس", "ليست",
    "هو", "هي", "هم", "هن", "انت", "أنت", "انا", "أنا", "نحن", "هذا", "هذه", "ذلك", "تلك", "هؤلاء",
    "هنا", "هناك", "الذي", "التي", "الذين", "كل", "بعض", "البعض", "غير", "بعد", "قبل",
    "بين", "حول", "مثل", "نحو", "دون", "حين", "فقط", "جدا", "جدًا", "لا", "نعم", "بلى", "لم",
    "لن", "لما", "لو", "لولا", "كيف", "لماذا", "فلماذا", "اين", "أين", "متى", "كم", "اي", "أي", "اية", "أية",
    "يا", "ايها", "أيها", "ايتها", "أيتها", "حكم", "ماحكم", "قول", "ماقول", "مساله", "مسألة", "حديث", "صحة",
    "معنى", "بيان", "كلمة", "كلام", "الكلام", "سؤال", "جواب", "شيخ", "الشيخ", "شيخنا",
    "العلامة", "الامام", "الإمام", "رحمه", "الله", "تعالى", "رسول", "النبي", "صلى", "وسلم",
    "واله", "وآله", "اكثر", "أكثر", "اقل", "أقل", "خاصة", "عامة"
  ].map(normalizeArabic)
);

// Extracts content word stems (ignoring stop words and common prefixes)
export function extractContentStems(text: string): Set<string> {
  const norm = normalizeArabic(text);
  const words = norm.match(/[ء-ي]+/g) ?? [];
  const stems = new Set<string>();
  for (const w of words) {
    if (ARABIC_STOP_WORDS.has(w)) continue;
    const bare = w.replace(/^(وال|فال|بال|كال|ولل|فلل|لل|ال|و|ف|ب|ل)(?=.{3,})/, "");
    if (!ARABIC_STOP_WORDS.has(bare) && bare.length >= 3) {
      stems.add(/^(?:غيبه|اغتاب(?:ه|ها|هم|هن)?|يغتاب(?:ه|ها|هم|هن)?|مغتاب(?:ه|ها|هم|هن)?)$/.test(bare) ? "غيب" : bare);
    } else if (w.length >= 3 && !ARABIC_STOP_WORDS.has(w)) {
      stems.add(/^(?:غيبه|اغتاب(?:ه|ها|هم|هن)?|يغتاب(?:ه|ها|هم|هن)?|مغتاب(?:ه|ها|هم|هن)?)$/.test(w) ? "غيب" : w);
    }
  }
  return stems;
}

// Checks if the text shares at least one content word stem with the title
export function sharesContentWord(title: string, text: string): boolean {
  const titleStems = extractContentStems(title);
  if (titleStems.size === 0) return true;
  const textStems = extractContentStems(text);
  for (const ts of titleStems) {
    if (textStems.has(ts)) return true;
  }
  return false;
}

// Computes content stem set for deduplication
export function quoteStemSet(quote: string): Set<string> {
  return extractContentStems(quote);
}

// Checks if a quote has high content stem overlap with any existing quote (>= 70% overlap)
export function isNearDuplicate(stems: Set<string>, existingStemSets: Set<string>[], threshold = 0.70): boolean {
  if (stems.size < 5) return false;
  for (const existing of existingStemSets) {
    if (existing.size < 5) continue;
    let common = 0;
    for (const s of stems) {
      if (existing.has(s)) common++;
    }
    const minSize = Math.min(stems.size, existing.size);
    if (minSize > 0 && common / minSize >= threshold) {
      return true;
    }
  }
  return false;
}

// Detects conversational room talk at the start of a quote (e.g. "بس", "طيب", "يا أبا", "يا أخي")
export function startsLikeRoomTalk(text: string): boolean {
  const t = text.trim();
  const roomPattern = /^(?:بس|طيب|يا\s+أبا|يا\s+ابا|يا\s+أخي|يا\s+اخي|يا\s+أختي|يا\s+اختي|يا\s+شيخ|يا\s+شيخنا|يا\s+سيدي)(?:\s|[،,:؛.!?]|$)/i;
  if (roomPattern.test(t)) return true;
  if (/^(?:هذا\s+دليل\s+أن\s+(?:أبا|أبو)|(?:أبا|أبو)\s+[\u0621-\u064A]+\s+[:：])/i.test(t)) return true;
  return false;
}

// al-albany.com fatwa: parsed from audio content page HTML.
// Extracts only Shaykh al-Albani's first answer right after the opening question in the transcript,
// stopping at any questioner interruption, student comment or other speaker.
export function parseAlbaniFatwa(
  html: string,
  options?: { title?: string; printedSource?: string | null }
): ParsedFatwa | null {
  const titleMatch =
    html.match(/<div class="title">[\s\S]*?<div class="col-lg-10[^>]*>([\s\S]*?)<\/div>/i) ??
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = htmlToText(titleMatch ? titleMatch[1] : (options?.title ?? "")).trim();

  if (/(خطبة|كلمة|شعر|محاضرة|موعظة)\s+(لـ|للشيخ|للأخ|لأبي|لـ)\s+(?!الألباني)/i.test(title)) return null;
  if (/لعلي حسن|لإبراهيم شقرة|لمشهور|لأبي مالك/i.test(title)) return null;

  const textMatch = html.match(/<div class="content-text"[^>]*>([\s\S]*?)<\/div>/i);
  if (!textMatch) return null;
  const rawContent = textMatch[1];

  // Must begin with the question (ignoring leading whitespace and HTML linebreaks)
  const cleanStart = rawContent.replace(/^(\s*<br\s*\/?>|\s*<p>\s*|\s*<\/p>\s*|\s*&nbsp;\s*)+/i, "").trim();

  // Find the first speaker in the transcript
  const firstSpeakerMatch = cleanStart.match(/^<span[^>]*class=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/span>\s*[:：]/i);
  if (!firstSpeakerMatch) {
    const textStartMatch = cleanStart.match(/^(?:السائل|سائل)\s*[:：]/i);
    if (!textStartMatch) return null;
  }

  // The first speaker MUST be a questioner / student (the question at the start of the transcript)
  if (firstSpeakerMatch) {
    const speakerClass = firstSpeakerMatch[1].toLowerCase();
    const speakerName = firstSpeakerMatch[2].trim();
    const isQuestioner = /questioner|student/.test(speakerClass) || /السائل|طالب|الطالب/.test(speakerName);
    if (!isQuestioner) {
      // Another speaker or earlier Shaykh turn came first -> skip
      return null;
    }
  }

  // Find the Shaykh's answer immediately after the question
  const firstMarkerEnd = firstSpeakerMatch ? firstSpeakerMatch[0].length : cleanStart.indexOf(":") + 1;
  const afterFirstMarker = cleanStart.slice(firstMarkerEnd);

  const sheikhMarker = afterFirstMarker.search(/<span[^>]*class=['"]sheikh['"][^>]*>\s*الشيخ\s*<\/span>\s*[:：]/i);
  if (sheikhMarker < 0) return null;

  // Ensure no other speaker intervened between the question and the Shaykh
  const between = afterFirstMarker.slice(0, sheikhMarker);
  if (/<span[^>]*class=['"]|<span[^>]*>[^<]+<\/span>\s*[:：]|(?:^|\s)(?:السائل|المقدم|طالب|الطالب|القارئ)\s*[:：]/i.test(between)) {
    return null;
  }

  let afterSheikh = afterFirstMarker.slice(sheikhMarker);
  afterSheikh = afterSheikh.replace(/^<span[^>]*class=['"]sheikh['"][^>]*>\s*الشيخ\s*<\/span>\s*[:：]\s*/i, "");

  // Cut off at ANY subsequent speaker span (questioner, student, another sheikh, etc.)
  const spanSpeaker = afterSheikh.search(/<span[^>]*class=/i);
  if (spanSpeaker >= 0) {
    afterSheikh = afterSheikh.slice(0, spanSpeaker);
  }

  // Also cut off at any subsequent text-based speaker indicator
  const textSpeaker = afterSheikh.search(
    /(?:^|\s|>)(?:السائل|المقدم|الحلبي|طالب|الطالب|القارئ|مداخلة|أبو\s+[\u0621-\u064A]+|الأخ|أحد\s+الحاضرين)\s*[:：]/i
  );
  if (textSpeaker >= 0) {
    afterSheikh = afterSheikh.slice(0, textSpeaker);
  }

  let answer = htmlToText(afterSheikh).trim();

  // Skip Friday sermon / lecture opening formula (Khutbat al-Hajah)
  if (/^إن\s+الحمد\s+لله/i.test(answer)) return null;

  // Rule 3: minimum 200 characters
  if (!title || answer.length < 200) return null;

  // Rule 3: skip room talk starters
  if (startsLikeRoomTalk(answer)) return null;

  // Rule 2: must share content word with title
  if (!sharesContentWord(title, answer)) return null;

  // Also verify that the excerpt can produce a valid quote >= 200 characters
  const quote = excerpt(answer);
  if (!quote || quote.length < 200) return null;
  if (startsLikeRoomTalk(quote)) return null;
  if (!sharesContentWord(title, quote)) return null;
  if (looksLikeQuestion(answer)) return null;

  return {
    title,
    answer,
    printedSource: options?.printedSource ?? null,
  };
}



// The first part of the answer, ending at a sentence end, at most `max` characters. Never cuts
// inside a sentence: if no sentence end fits, nothing is returned (the fatwa is skipped).
export function excerpt(answer: string, max = MAX_QUOTE_CHARS): string | null {
  const text = answer.replace(/\s*\n\s*/g, " ").trim();
  if (text.length <= max) return text;
  const window = text.slice(0, max);
  let cut = -1;
  for (const m of window.matchAll(/[.!؟?](?=\s|$)/g)) cut = m.index! + 1;
  if (cut < 120) return null; // too little meaning survives; skip rather than mislead
  return window.slice(0, cut).trim();
}

// Search-only copy (never shown): no vowel marks, unified letters, no punctuation, at most `max`
// characters, so that whole-word database search finds "الصيام" in "والصيام" style text too.
export function searchText(title: string, quote: string, max = MAX_QUOTE_CHARS): string {
  const words = normalizeArabic(`${title} ${quote}`).match(/[ء-ي]+/g) ?? [];
  const withStems = words.flatMap((w) => {
    const bare = w.replace(/^(وال|بال|فال|كال|لل|ال|و|ف|ب|ل)(?=.{3,})/, "");
    return bare !== w ? [w, bare] : [w];
  });
  let out = "";
  for (const w of withStems) {
    if (out.length + w.length + 1 > max) break;
    out += (out ? " " : "") + w;
  }
  return out;
}
