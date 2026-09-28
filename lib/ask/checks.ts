// Code checks on everything the AI returns (plan sections 3 and 7).
// Pure functions with no network access, so they can be tested automatically (tests/checks.test.ts).
// Rule: when anything is doubtful, the whole answer is refused. We never publish the leftover pieces.

import type { Locale } from "@/lib/i18n";
import { isRealVerse } from "@/lib/sources/quran-meta";
import { ANSWER_FACETS, type AnswerFacet } from "./retrieval";

export { parseQuestionFrame } from "./retrieval";

export type SourceText = {
  id: string; // e.g. "Q2:255"
  arabic: string;
  translations: Partial<Record<"en" | "de", string>>;
};

export type Claim = { text: string; refs: string[]; facets?: AnswerFacet[] };

export const LIMITS = {
  maxClaims: 4,
  maxRefsPerClaim: 3,
  maxClaimLength: 300,
};

// ---------- text helpers ----------

// For matching only: strip Arabic diacritics and unify letter variants. Stored text is never changed.
export function normalizeArabic(s: string): string {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

// Word "skeletons" for the copy check only: Uthmani Quran spelling often drops or shrinks the alef
// (ٱلظُّلُمَٰتِ, ٱلرَّحْمَٰنِ) where modern spelling writes it (الظلمات). Ignoring every alef makes
// both spellings compare the same, so AI-typed Quran wording cannot slip through in modern spelling.
function arabicWords(s: string): string[] {
  return (normalizeArabic(s).match(/[ء-ي]+/g) ?? [])
    .map((w) => w.replace(/ا/g, ""))
    .filter((w) => w.length > 0);
}

function latinWords(s: string): string[] {
  return s.toLowerCase().match(/[a-zäöüß]+/g) ?? [];
}

function grams(words: string[], n: number): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

const isStr = (x: unknown): x is string => typeof x === "string";

// ---------- 1. runtime validation of AI output ----------

export type DraftResult = { ok: true; claims: Claim[] } | { ok: false; reason: string };

// The claim must be written in the answer's language: Arabic script for Arabic, Latin for English/German.
export function inLanguage(text: string, language: Locale): boolean {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-zÄÖÜäöüß]/g) ?? []).length;
  const letters = arabic + latin;
  if (letters === 0) return false;
  return language === "ar" ? arabic / letters >= 0.9 : latin / letters >= 0.95;
}

// German with umlauts written as ae/oe/ue ("moechte", "Muehe") is broken spelling. A general rule
// would also hit correct words (neue, Feuer, Quelle), so this lists frequent words only.
const ASCII_UMLAUT_WORDS = new Set([
  "fuer", "ueber", "ueberall", "uebrig", "moechte", "moechten", "muehe", "koennen", "koennte", "muessen",
  "waehrend", "spaeter", "frueh", "frueher", "glaeubige", "glaeubigen", "gebaeude", "maenner", "maedchen",
  "haende", "suende", "suenden", "pruefung", "pruefungen", "gefuehl", "gefuehle", "hoeren", "gehoert",
  "gehoeren", "hoechste", "hoechsten", "groesse", "groesste", "schoen", "schoene", "boese", "loesen",
  "loesung", "toeten", "voellig", "moeglich", "natuerlich", "wuerde", "wuerden", "fuehren", "fuehrt",
  "gefuehrt", "zurueck", "taeglich", "jaehrlich", "naechste", "naechsten", "aehnlich", "erklaert", "erklaeren",
  "waere", "haette", "haetten", "gewaehrt", "vergaenglich", "hoelle", "gaerten",
]);

export function asciiUmlauts(text: string): boolean {
  return (text.toLowerCase().match(/[a-zäöüß]+/g) ?? []).some((w) => ASCII_UMLAUT_WORDS.has(w));
}

// Validates the drafted answer. Any failure refuses the whole answer.
export type DraftPolicy = {
  requiredFacets: AnswerFacet[];
  sourceFacets: Record<string, AnswerFacet[]>;
};

export function parseDraft(raw: unknown, citable: SourceText[], language: Locale, policy?: DraftPolicy): DraftResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "malformed" };
  const r = raw as Record<string, unknown>;
  if (r.status === "no_answer") return { ok: false, reason: "model_no_answer" };
  if (r.status !== "answer" || !Array.isArray(r.claims)) return { ok: false, reason: "malformed" };
  if (r.claims.length === 0 || r.claims.length > LIMITS.maxClaims) return { ok: false, reason: "claim_count" };

  const byId = new Map(citable.map((s) => [s.id, s]));
  const claims: Claim[] = [];
  for (const c of r.claims) {
    if (!c || typeof c !== "object") return { ok: false, reason: "malformed" };
    const { text, source_ids, facet_ids } = c as Record<string, unknown>;
    if (!isStr(text) || !Array.isArray(source_ids)) return { ok: false, reason: "malformed" };
    const t = text.trim();
    if (!t || t.length > LIMITS.maxClaimLength) return { ok: false, reason: "claim_length" };
    if (!inLanguage(t, language)) return { ok: false, reason: "wrong_language" };
    if (language === "de" && asciiUmlauts(t)) return { ok: false, reason: "wrong_language" };
    if (!isSingleSentence(t)) return { ok: false, reason: "multiple_sentences" };
    if (hasQuotation(t)) return { ok: false, reason: "quotation" };
    const refs = [...new Set(source_ids.filter(isStr).map((s) => s.trim()))];
    if (refs.length === 0 || refs.length > LIMITS.maxRefsPerClaim) return { ok: false, reason: "ref_count" };
    if (!refs.every((id) => byId.has(id))) return { ok: false, reason: "unknown_ref" };
    // Copying is checked against every source the AI was given, not only the ones it cited.
    if (copiesSource(t, citable)) return { ok: false, reason: "copied_source" };
    if (policy) {
      if (!Array.isArray(facet_ids)) return { ok: false, reason: "facet_count" };
      const facets = [...new Set(facet_ids.filter(isStr))]
        .filter((facet): facet is AnswerFacet => (ANSWER_FACETS as readonly string[]).includes(facet))
        .filter((facet) => policy.requiredFacets.includes(facet));
      if (facets.length !== 1 || facets.length !== facet_ids.length) return { ok: false, reason: "facet_count" };
      const supportedByRefs = new Set(refs.flatMap((id) => policy.sourceFacets[id] ?? []));
      if (!facets.every((facet) => supportedByRefs.has(facet))) return { ok: false, reason: "unsupported_facet" };
      claims.push({ text: t, refs, facets });
    } else {
      claims.push({ text: t, refs });
    }
  }
  if (policy && !policy.requiredFacets.every((facet) => claims.some((claim) => claim.facets?.includes(facet)))) {
    return { ok: false, reason: "missing_facet" };
  }
  return { ok: true, claims };
}

// ---------- 2. one claim per item ----------

// A claim may end with one sentence mark; any sentence mark before the end means two sentences.
export function isSingleSentence(text: string): boolean {
  const body = text.trim().replace(/[.!?؟。]+$/u, "");
  return !/[.!?؟;؛](\s|$)/u.test(body);
}

// ---------- 3. no quotations from the AI ----------

// The AI explains; only the website shows quotations, from source data.
// Apostrophes inside words (God's, Mu'min) are allowed.
export function hasQuotation(text: string): boolean {
  if (/["“”„«»‹›「」]/u.test(text)) return true;
  if (/(^|\s)['‘’][^'‘’]+['‘’](\s|[.,!?؟]|$)/u.test(text)) return true;
  // "the Quran says: ..." / "Allah said: ..." style lead-ins
  return /(says|said|sagt|sagte|states|reads|قال|يقول|تقول)\s*:/iu.test(text);
}

// ---------- 4. no re-typed verses, in any language ----------

// Arabic Quran text must never be re-typed by the AI: 4 consecutive words, a whole short verse
// (even one word long), or most of a verse with one word changed all count as copying.
// Translations: 6 consecutive words, or the whole translation when it is shorter than that.
export function copiesSource(text: string, sources: SourceText[]): boolean {
  const ar = arabicWords(text);
  const lat = latinWords(text);
  for (const s of sources) {
    const vs = arabicWords(s.arabic);
    if (ar.length >= 1 && vs.length > 0) {
      if (vs.length < 4) {
        if (grams(ar, vs.length).has(vs.join(" "))) return true;
      } else {
        const v4 = grams(vs, 4);
        for (const g of grams(ar, 4)) if (v4.has(g)) return true;
      }
      // One altered word: most of the claim's word pairs appear in the verse.
      const v2 = grams(vs, 2);
      const c2 = [...grams(ar, 2)];
      if (c2.length >= 4 && c2.filter((g) => v2.has(g)).length / c2.length > 0.6) return true;
    }
    for (const tr of Object.values(s.translations)) {
      if (!tr) continue;
      const tw = latinWords(tr);
      const n = Math.min(6, tw.length);
      if (n === 0 || lat.length < n) continue;
      const tg = grams(tw, n);
      for (const g of grams(lat, n)) if (tg.has(g)) return true;
    }
  }
  return false;
}

// ---------- 5. support check result ----------

export type Verdict = "supported" | "not_supported" | "unsure";

// Every claim must be "supported". Unsure, missing or malformed counts as a failure.
export function allSupported(raw: unknown, claimCount: number): boolean {
  if (!raw || typeof raw !== "object") return false;
  const v = (raw as Record<string, unknown>).verdicts;
  if (!Array.isArray(v) || v.length !== claimCount) return false;
  return v.every((x) => x === "supported");
}

// The answer as a whole must directly answer the question and give a fair picture.
// Anything but a clear "yes" on both counts is a failure.
export function wholeAnswerOk(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return r.answers_question === "yes" && r.covers_facets === "yes" && r.fair_picture === "yes" && r.context_preserved === "yes";
}

// ---------- 6. questions that need extra care ----------

// Questions about the visitor's own situation. Code rule on top of the AI's classification;
// either one is enough to send the visitor to a scholar instead of answering.
const PERSONAL = [
  // Only clear signs of "what should I do": general questions like "how can I know..." must pass.
  /\b(should|must)\s+i\b/i,
  /\b(am\s+i|are\s+we)\s+(allowed|permitted|obliged|required|sinning)\b/i,
  /\bis\s+it\s+(ok|okay|allowed|halal|haram|permissible|a\s+sin)\s+(for\s+me|if\s+i)\b/i,
  /\bmy\s+(wife|husband|son|daughter|mother|father|parents|family|boss|money|job|marriage)\b/i,
  /\b(soll|darf|muss)\s+ich\b/i,
  /\bmein(e|en|em|er)?\s+(frau|mann|sohn|tochter|mutter|vater|eltern|familie|chef|geld|arbeit|ehe)\b/i,
  /(هل\s+يجوز\s+لي|هل\s+علي|زوجتي|زوجي|أمي|أبي|والدي|ابني|ابنتي)/,
];

export function looksPersonal(question: string): boolean {
  return PERSONAL.some((re) => re.test(question));
}

// Direct verse references like "2:255", only when the question also mentions the Quran, a surah
// or a verse (so "10:30" as a time is ignored), and only if that verse really exists.
const QURAN_WORD = /\b(quran|qur'an|koran|surah?|sure|ayah?|ayat|verse|vers)\b|القرآن|سورة|آية|اية/i;

// Well-known names of passages, which always mean the same verses.
const NAMED_PASSAGES: [RegExp, string[]][] = [
  [/ayat[\s-]*(?:al|ul|el)?[\s-]*kurs[iy]|throne\s*verse|thronvers|آي[ةه]\s*الكرسي/i, ["2:255"]],
  [/(?:al|el)?[\s-]*f[aā]ti[hḥ]a|الفاتح[ةه]/i, ["1:1", "1:2", "1:3", "1:4", "1:5", "1:6", "1:7"]],
];

export function directRefs(question: string): string[] {
  const named = NAMED_PASSAGES.flatMap(([pattern, keys]) => (pattern.test(question) ? keys : []));
  const marked = /\bQ\d{1,3}:\d{1,3}\b/i.test(question);
  if (!marked && !QURAN_WORD.test(question)) return named;
  const numbered = [...question.matchAll(/(?<![\d:])Q?(\d{1,3})\s*:\s*(\d{1,3})(?![\d:])(?!\s*(?:am|pm|uhr)\b)/gi)]
    .map((m) => [Number(m[1]), Number(m[2])])
    .filter(([c, v]) => isRealVerse(c, v))
    .map(([c, v]) => `${c}:${v}`);
  return [...new Set([...named, ...numbered])];
}
