// Code checks on everything the AI returns (plan sections 3 and 7).
// Pure functions with no network access, so they can be tested automatically (tests/checks.test.ts).
// Rule: when anything is doubtful, the whole answer is refused. We never publish the leftover pieces.

import type { Locale } from "@/lib/i18n";

export type SourceText = {
  id: string; // e.g. "Q2:255"
  arabic: string;
  translations: Partial<Record<"en" | "de", string>>;
};

export type Claim = { text: string; refs: string[] };

export const LIMITS = {
  maxClaims: 4,
  maxRefsPerClaim: 3,
  maxClaimLength: 300,
  maxIntentLength: 240,
  maxKeywords: 8,
  maxKeywordLength: 40,
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

function arabicWords(s: string): string[] {
  return normalizeArabic(s).match(/[ء-ي]+/g) ?? [];
}

function latinWords(s: string): string[] {
  return s.toLowerCase().match(/[a-zäöüß]+/g) ?? [];
}

function grams(words: string[], n: number): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

// ---------- 1. runtime validation of AI output ----------

const LOCALES = ["ar", "en", "de"] as const;
const KINDS = ["question", "personal", "greeting", "off_topic", "harmful"] as const;

export type Understanding = {
  language: Locale;
  kind: (typeof KINDS)[number];
  intent: string;
  keywords: string[];
};

const isStr = (x: unknown): x is string => typeof x === "string";

// Returns null for anything malformed or unknown: the caller must refuse.
export function parseUnderstanding(raw: unknown): Understanding | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isStr(r.language) || !(LOCALES as readonly string[]).includes(r.language)) return null;
  if (!isStr(r.kind) || !(KINDS as readonly string[]).includes(r.kind)) return null;
  if (!isStr(r.intent)) return null;
  const intent = r.intent.replace(/[\u0000-\u001F<>{}`]/g, " ").trim().slice(0, LIMITS.maxIntentLength);
  const kw = (x: unknown) =>
    Array.isArray(x)
      ? x
          .filter(isStr)
          .map((w) => w.trim())
          .filter((w) => w.length > 0 && w.length <= LIMITS.maxKeywordLength)
          .slice(0, LIMITS.maxKeywords)
      : [];
  return {
    language: r.language as Locale,
    kind: r.kind as Understanding["kind"],
    intent,
    keywords: [...kw(r.keywords_en), ...kw(r.keywords_de), ...kw(r.keywords_ar)],
  };
}

export type DraftResult = { ok: true; claims: Claim[] } | { ok: false; reason: string };

// Validates the drafted answer. Any failure refuses the whole answer.
export function parseDraft(raw: unknown, citable: SourceText[]): DraftResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "malformed" };
  const r = raw as Record<string, unknown>;
  if (r.status === "no_answer") return { ok: false, reason: "model_no_answer" };
  if (r.status !== "answer" || !Array.isArray(r.claims)) return { ok: false, reason: "malformed" };
  if (r.claims.length === 0 || r.claims.length > LIMITS.maxClaims) return { ok: false, reason: "claim_count" };

  const byId = new Map(citable.map((s) => [s.id, s]));
  const claims: Claim[] = [];
  for (const c of r.claims) {
    if (!c || typeof c !== "object") return { ok: false, reason: "malformed" };
    const { text, source_ids } = c as Record<string, unknown>;
    if (!isStr(text) || !Array.isArray(source_ids)) return { ok: false, reason: "malformed" };
    const t = text.trim();
    if (!t || t.length > LIMITS.maxClaimLength) return { ok: false, reason: "claim_length" };
    if (!isSingleSentence(t)) return { ok: false, reason: "multiple_sentences" };
    if (hasQuotation(t)) return { ok: false, reason: "quotation" };
    const refs = [...new Set(source_ids.filter(isStr).map((s) => s.trim()))];
    if (refs.length === 0 || refs.length > LIMITS.maxRefsPerClaim) return { ok: false, reason: "ref_count" };
    if (!refs.every((id) => byId.has(id))) return { ok: false, reason: "unknown_ref" };
    const cited = refs.map((id) => byId.get(id)!);
    if (copiesSource(t, cited)) return { ok: false, reason: "copied_source" };
    claims.push({ text: t, refs });
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

// Arabic Quran text must never be re-typed by the AI: 4 consecutive words, a whole short verse,
// or most of a verse with one word changed all count as copying.
// Translations are checked more loosely, because a faithful explanation may share a few words.
export function copiesSource(text: string, cited: SourceText[]): boolean {
  const ar = arabicWords(text);
  const lat = latinWords(text);
  for (const s of cited) {
    const vs = arabicWords(s.arabic);
    if (ar.length >= 2 && vs.length > 0) {
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
      if (!tr || lat.length < 6) continue;
      const tw = latinWords(tr);
      const t7 = grams(tw, 7);
      for (const g of grams(lat, 7)) if (t7.has(g)) return true;
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

// ---------- 6. questions that need extra care ----------

// Requests for a ruling on the visitor's own case. Code rule on top of the AI's classification.
const PERSONAL = [
  /\b(should|can|may|must)\s+i\b/i,
  /\bmy\s+(wife|husband|son|daughter|mother|father|parents|family|boss|money|job|marriage)\b/i,
  /\b(soll|darf|kann|muss)\s+ich\b/i,
  /\bmein(e|en|em|er)?\s+(frau|mann|sohn|tochter|mutter|vater|eltern|familie|chef|geld|arbeit|ehe)\b/i,
  /(هل\s+يجوز\s+لي|هل\s+علي|زوجتي|زوجي|أمي|أبي|والدي|ابني|ابنتي)/,
];

export function looksPersonal(question: string): boolean {
  return PERSONAL.some((re) => re.test(question));
}

// Direct verse references like "2:255" or "2 : 255".
export function directRefs(question: string): string[] {
  return [...question.matchAll(/\b(\d{1,3})\s*:\s*(\d{1,3})\b/g)]
    .map((m) => `${Number(m[1])}:${Number(m[2])}`)
    .filter((k) => {
      const [c, v] = k.split(":").map(Number);
      return c >= 1 && c <= 114 && v >= 1 && v <= 286;
    });
}
