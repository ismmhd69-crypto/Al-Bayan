// Code checks on everything the AI returns (plan sections 3 and 7).
// Pure functions with no network access, so they can be tested automatically (tests/checks.test.ts).
// Rule: when anything is doubtful, the whole answer is refused. We never publish the leftover pieces.

import type { Locale } from "@/lib/i18n";
import { isRealVerse } from "@/lib/sources/quran-meta";
import type { AnswerRequirement, Source } from "./retrieval";

export { parseQuestionFrame } from "./retrieval";

export type SourceText = {
  id: string; // e.g. "Q2:255"
  kind: Source["kind"];
  arabic: string;
  translations: Partial<Record<"en" | "de", string>>;
};

export type Claim = { text: string; refs: string[]; requirementId?: string };

export const LIMITS = {
  maxClaims: 4,
  maxAnswerSentences: 12,
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
  requirements: AnswerRequirement[];
  sourceRequirements: Record<string, string[]>;
  requireNoAnswerFeedback?: boolean;
};

export function parseDraft(raw: unknown, citable: SourceText[], language: Locale, policy?: DraftPolicy, maxClaims = LIMITS.maxClaims): DraftResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "malformed" };
  const r = raw as Record<string, unknown>;
  if (r.status === "no_answer") return { ok: false, reason: "model_no_answer" };
  if (r.status !== "answer" || !Array.isArray(r.claims)) return { ok: false, reason: "malformed" };
  if (r.claims.length === 0 || r.claims.length > maxClaims) return { ok: false, reason: "claim_count" };

  const byId = new Map(citable.map((s) => [s.id, s]));
  const claims: Claim[] = [];
  for (const c of r.claims) {
    if (!c || typeof c !== "object") return { ok: false, reason: "malformed" };
    const { text, source_ids, requirement_id } = c as Record<string, unknown>;
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
      if (!isStr(requirement_id)) return { ok: false, reason: "requirement_count" };
      const requirement = policy.requirements.find((item) => item.id === requirement_id);
      if (!requirement) return { ok: false, reason: "unknown_requirement" };
      const supportedByRefs = new Set(refs.flatMap((id) => policy.sourceRequirements[id] ?? []));
      if (!supportedByRefs.has(requirement.id)) return { ok: false, reason: "unsupported_requirement" };
      claims.push({ text: t, refs, requirementId: requirement.id });
    } else {
      claims.push({ text: t, refs });
    }
  }
  if (policy && !policy.requirements.every((requirement) => claims.some((claim) => claim.requirementId === requirement.id))) {
    return { ok: false, reason: "missing_requirement" };
  }
  return { ok: true, claims };
}

export type AnswerSection = { heading: string; sentences: Claim[] };
// directAnswer is the design's simple answer (1 to 4 sentences); list is its optional step,
// condition or exception list. Together they form the direct answer for every coverage check.
export type StructuredDraft = { directAnswer: Claim[]; list: Claim[]; explanation: AnswerSection[]; notEstablished: string[]; claims: Claim[] };
export const NO_ANSWER_REASONS = ["missing_evidence", "incomplete_conditions", "ambiguous_scope", "unsafe_context", "cannot_paraphrase"] as const;
export type NoAnswerFeedback = { missing_requirement_ids: string[]; reason_code: typeof NO_ANSWER_REASONS[number] };
export function parseNoAnswerFeedback(raw: unknown, requirementIds: string[]): NoAnswerFeedback | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.missing_requirement_ids) || !r.missing_requirement_ids.length
    || r.missing_requirement_ids.length > requirementIds.length
    || !r.missing_requirement_ids.every((id) => typeof id === "string" && requirementIds.includes(id))
    || new Set(r.missing_requirement_ids).size !== r.missing_requirement_ids.length
    || !NO_ANSWER_REASONS.includes(r.reason_code as NoAnswerFeedback["reason_code"])) return null;
  return { missing_requirement_ids: [...r.missing_requirement_ids], reason_code: r.reason_code as NoAnswerFeedback["reason_code"] };
}
export type StructuredDraftResult = { ok: true; answer: StructuredDraft } | { ok: false; reason: string; feedback?: NoAnswerFeedback };

// Design section 4.3. The total counts every AI-written cited item (sentences and list items).
export const DRAFT_LIMITS = {
  simpleSentences: 4,
  listMin: 2,
  listMax: 8,
  listItemLength: 160,
  moreSections: 2,
  totalItems: LIMITS.maxAnswerSentences, // 12
  headingLength: 80,
  limitNoteLength: 300,
} as const;

const LIST_FACETS = new Set(["steps", "conditions", "exceptions"]);

/** Code, not the model, decides whether a list is permitted: steps, conditions or exceptions only.
 * A quantity point alone never permits a list. */
export function listPermitted(requirements: Pick<AnswerRequirement, "facet">[]): boolean {
  return requirements.some((requirement) => LIST_FACETS.has(requirement.facet));
}

/** A limit note is allowed only for reason, objection, steps or conditions questions. */
export function limitNotePermitted(questionType: string, requirements: Pick<AnswerRequirement, "facet">[]): boolean {
  return questionType === "reason" || questionType === "objection"
    || requirements.some((requirement) => requirement.facet === "steps" || requirement.facet === "conditions");
}

const SOURCE_ID_IN_TEXT = /\bQ?\d{1,3}:\d{1,3}\b|\bHE\d+\b|\bS[0-9a-f-]{36}\b/;

/** One sentence in the answer language that only marks a limit: no citation, quotation or ruling. */
export function limitNoteOk(text: string, language: Locale, sources: SourceText[]): boolean {
  const t = text.trim();
  return !!t && t.length <= DRAFT_LIMITS.limitNoteLength && inLanguage(t, language) && isSingleSentence(t)
    && !hasQuotation(t) && !hasRulingTerm(t) && !SOURCE_ID_IN_TEXT.test(t)
    && !sources.some((source) => t.includes(source.id)) && !copiesSource(t, sources);
}

/** Headings are short neutral labels. A heading that could carry a claim is replaced by a fixed one. */
export function headingOk(text: string, language: Locale): boolean {
  const t = text.trim();
  return !!t && t.length <= DRAFT_LIMITS.headingLength && !/\n/.test(t) && inLanguage(t, language)
    && isSingleSentence(t) && !hasQuotation(t) && !hasRulingTerm(t);
}

/** Fixed site headings are the only headings rendered; model-written headings are never trusted text. */
export function fixedExplanationHeadings(language: Locale): readonly [string, string] {
  if (language === "ar") return ["التفصيل", "تفصيل إضافي"];
  if (language === "de") return ["Einzelheiten", "Weitere Einzelheiten"];
  return ["Details", "Further details"];
}

/** The live writer's shape (simple_answer, list, more_explanation, limit_note). Older drafts with a
 * flat claim array or direct_answer/explanation/not_established are read with the same checks. */
export function parseStructuredDraft(raw: unknown, citable: SourceText[], language: Locale, policy: DraftPolicy,
  questionType: string): StructuredDraftResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "malformed" };
  const record = raw as Record<string, unknown>;
  if (record.status === "no_answer") {
    if (!policy.requireNoAnswerFeedback) return { ok: false, reason: "model_no_answer" };
    if (!["simple_answer", "list", "more_explanation", "limit_note"].every((field) => Array.isArray(record[field]) && (record[field] as unknown[]).length === 0)) return { ok: false, reason: "no_answer_feedback_invalid" };
    const feedback = parseNoAnswerFeedback(record.no_answer_feedback, policy.requirements.map((r) => r.id));
    return feedback ? { ok: false, reason: "model_no_answer", feedback } : { ok: false, reason: "no_answer_feedback_invalid" };
  }
  const finish = (answer: StructuredDraft): StructuredDraftResult => {
    // Every requested point must be answered in the simple answer or its list, not only in the fold.
    const direct = [...answer.directAnswer, ...answer.list];
    if (!policy.requirements.every((requirement) => direct.some((claim) => claim.requirementId === requirement.id))) {
      return { ok: false, reason: "missing_requirement" };
    }
    // "The Quran says" must rest on a verse, never on a hadith or a scholar's words.
    if (answer.claims.some((claim) => sourceKindMismatch(claim.text, claim.refs))) return { ok: false, reason: "source_attribution" };
    return { ok: true, answer };
  };
  // Older checked draft records and pipeline fixtures have a flat claim array (at most 4 claims):
  // all of them form the simple answer.
  if (record.status === "answer" && Array.isArray(record.claims) && !("direct_answer" in record) && !("simple_answer" in record)) {
    const legacy = parseDraft(raw, citable, language, policy);
    if (!legacy.ok) return legacy;
    return finish({ directAnswer: legacy.claims, list: [], explanation: [], notEstablished: [], claims: legacy.claims });
  }
  const simpleRaw = record.simple_answer ?? record.direct_answer;
  const listRaw = record.list ?? [];
  const sectionsRaw = record.more_explanation ?? record.explanation;
  const notesRaw = record.limit_note ?? record.not_established;
  if (record.status !== "answer" || !Array.isArray(simpleRaw) || !Array.isArray(listRaw) || !Array.isArray(sectionsRaw)
    || !Array.isArray(notesRaw)) return { ok: false, reason: "malformed" };

  // Layout is tidied, never a reason to discard a correct answer: every sentence and list item below
  // still passes the full sentence checks (sources, copying, language, quotes, one fact) in parseDraft.
  const generic = language === "ar" ? "التفصيل" : language === "de" ? "Einzelheiten" : "Details";
  const fixedHeadings = fixedExplanationHeadings(language);
  const signature = (value: string) => normalizeArabic(value.toLowerCase()).replace(/[^\p{L}\p{N}]/gu, "");
  const seen = new Set<string>();
  const unique = (items: unknown[]) => items.filter((item) => {
    const text = item && typeof item === "object" ? (item as Record<string, unknown>).text : undefined;
    if (!isStr(text)) return true; // malformed sentences are refused by parseDraft
    const key = signature(text);
    if (seen.has(key)) return false; // an exact repeat is dropped, not the whole answer
    seen.add(key);
    return true;
  });
  let direct = unique(simpleRaw);
  let list = unique(listRaw);
  let sections: { heading: string; sentences: unknown[] }[] = [];
  for (const section of sectionsRaw) {
    if (!section || typeof section !== "object") return { ok: false, reason: "malformed" };
    const item = section as Record<string, unknown>;
    if (!Array.isArray(item.sentences)) return { ok: false, reason: "malformed" };
    const sentences = unique(item.sentences);
    if (sentences.length === 0) continue;
    // A one-sentence section joins the previous section.
    if (sentences.length === 1 && sections.length > 0) sections[sections.length - 1].sentences.push(...sentences);
    else sections.push({ heading: fixedHeadings[Math.min(sections.length, 1)], sentences });
  }
  if (direct.length === 0 && sections.length > 0) {
    direct = sections[0].sentences.splice(0, 1);
    sections = sections.filter((section) => section.sentences.length > 0);
  }
  // Models sometimes put the complete direct response entirely in the list. Promote one checked
  // item before validating list length, rather than discarding otherwise valid sourced wording.
  if (direct.length === 0 && list.length > 0) direct = list.splice(0, 1);
  if (direct.length === 0) return { ok: false, reason: "answer_shape" };
  // A single valid item is not rendered as a one-item list. Keep it as a simple-answer sentence
  // when there is room, so harmless model formatting does not discard supported content.
  if (list.length === 1 && direct.length < DRAFT_LIMITS.simpleSentences) {
    direct.push(list[0]);
    list = [];
  }
  if (direct.length > DRAFT_LIMITS.simpleSentences) {
    const extra = direct.splice(DRAFT_LIMITS.simpleSentences);
    if (sections.length > 0) sections[0].sentences.unshift(...extra);
    else sections.push({ heading: generic, sentences: extra });
  }
  if (sections.length > DRAFT_LIMITS.moreSections) {
    const tail = sections.splice(DRAFT_LIMITS.moreSections).flatMap((section) => section.sentences);
    sections[DRAFT_LIMITS.moreSections - 1].sentences.push(...tail);
  }
  // Lists are only for steps, conditions or exceptions (code decides), with 2 to 8 short items.
  if (list.length > 0) {
    if (!listPermitted(policy.requirements)) return { ok: false, reason: "list_not_allowed" };
    if (list.length < DRAFT_LIMITS.listMin || list.length > DRAFT_LIMITS.listMax) return { ok: false, reason: "list_count" };
    for (const item of list) {
      const text = item && typeof item === "object" ? (item as Record<string, unknown>).text : undefined;
      if (isStr(text) && text.trim().length > DRAFT_LIMITS.listItemLength) return { ok: false, reason: "claim_length" };
    }
  }

  const flattened = [...direct, ...list, ...sections.flatMap((section) => section.sentences)];
  const parsed = parseDraft({ status: "answer", claims: flattened }, citable, language, policy, DRAFT_LIMITS.totalItems);
  if (!parsed.ok) return parsed;
  const notes: string[] = [];
  // A Bayan note is optional: one that breaks its rules is left out rather than failing the answer.
  for (const note of notesRaw.slice(0, 1)) {
    if (!limitNotePermitted(questionType, policy.requirements)) break;
    if (!note || typeof note !== "object") continue;
    const item = note as Record<string, unknown>;
    if (!isStr(item.text) || "source_ids" in item || !limitNoteOk(item.text, language, citable)) continue;
    notes.push(item.text.trim());
  }
  let cursor = direct.length + list.length;
  const explanation = sections.map((section) => {
    const sentences = parsed.claims.slice(cursor, cursor + section.sentences.length);
    cursor += section.sentences.length;
    return { heading: section.heading, sentences };
  });
  return finish({
    directAnswer: parsed.claims.slice(0, direct.length),
    list: parsed.claims.slice(direct.length, direct.length + list.length),
    explanation,
    notEstablished: notes,
    claims: parsed.claims,
  });
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

// ---------- 3b. honest source kind and no free-text rulings ----------

// Explicit source attributions must match at least one cited source of that kind. These patterns
// target attribution wording, not every mention: "the Quran mentions the Prophet" may cite a verse,
// while "the Prophet taught" must cite a hadith and "Shaykh X explained" must cite a scholar quote.
const QURAN_WORD_IN_TEXT = /\b(quran|qur'an|koran)\b|القرآن|القران/iu;
const PROPHET_ATTRIBUTION = /\b(?:the\s+)?(?:prophet|messenger)(?:\s+muhammad)?\s+(?:taught|said|stated|reported|instructed|commanded|forbade|prohibited|allowed|permitted|explained)\b|\b(?:der\s+)?prophet\s+(?:lehrte|sagte|erklärte|berichtete|befahl|verbot|erlaubte)\b|(?:قال|بيّن|بين|أوضح|علّم|علم|أمر|نهى)\s+(?:النبي|الرسول)/iu;
const SCHOLAR_ATTRIBUTION = /\b(?:shaykh|sheikh|scheich)\b.{0,80}\b(?:explained|said|stated|ruled|held|taught|erklärte|sagte|urteilte|lehrte)\b|(?:قال|بيّن|بين|أوضح|أفتى|ذكر)\s+الشيخ/iu;

export function sourceKindMismatch(text: string, refs: string[]): boolean {
  if (QURAN_WORD_IN_TEXT.test(text) && !refs.some((id) => /^Q\d{1,3}:\d{1,3}$/.test(id))) return true;
  if (PROPHET_ATTRIBUTION.test(text) && !refs.some((id) => /^(HE\d+|SH[0-9a-f-]{36})$/.test(id))) return true;
  return SCHOLAR_ATTRIBUTION.test(text) && !refs.some((id) => /^S(?!H)/.test(id));
}

// Headings and limit notes are not screened claim by claim, so they may not carry a ruling.
const RULING_TERMS = /\b(halal|haram|forbidden|prohibited|obligat\w*|compulsory|permissible|permitted|allowed|lawful|unlawful|sinful|makruh|verboten|erlaubt|pflicht\w*|verpflichtend|zulässig|sünde)\b|حرام|حلال|واجب|محرم|يجوز|مباح|فرض|مكروه|يحرم|يجب/iu;

export function hasRulingTerm(text: string): boolean {
  return RULING_TERMS.test(text);
}

// ---------- 4. no re-typed verses, in any language ----------

// Arabic Quran/hadith text must never be re-typed by the AI: 4 consecutive words, a whole short
// passage (even one word long), or most of a passage with one word changed all count as copying.
// Scholar explanations may need short technical terms from the credited quote. They still fail on
// an 8-word copied clause or when a longer claim substantially follows the quote's wording.
// Translations: 6 consecutive words, or the whole translation when it is shorter than that.
// Honorific formulas said after the Prophet's, the Companions' or Allah's name. Hadith texts and
// their translations repeat them around the narration, and a correct paraphrase naturally repeats
// them too, so sharing one is not copying. They are removed from BOTH sides before comparing with a
// hadith or a scholar quote, which keeps every real run of narration words adjacent: retyping still
// fails, even with an honorific inserted to split it. Never applied to the Quran, whose own text
// contains some of these words (for example رضي الله عنهم).
const HONORIFICS_AR = [
  "صلى الله عليه وآله وسلم", "صلى الله عليه وسلم", "عليه الصلاة والسلام", "عليه السلام",
  "رضي الله عنهما", "رضي الله عنهم", "رضي الله عنها", "رضي الله عنه", "رحمهم الله", "رحمه الله",
  "سبحانه وتعالى", "تبارك وتعالى", "عز وجل",
].map(arabicWords).sort((a, b) => b.length - a.length);
const HONORIFICS_LATIN = [
  "may allah's peace and blessings be upon him", "peace and blessings of allah be upon him",
  "peace and blessings be upon him", "sallallahu alayhi wa sallam", "may allah be pleased with them",
  "may allah be pleased with both of them", "may allah be pleased with him", "may allah be pleased with her",
  "may allah have mercy on him", "glorified and exalted be he",
  "allahs segen und frieden auf ihm", "allah segne ihn und schenke ihm frieden", "friede und segen seien auf ihm",
  "segen und frieden auf ihm", "möge allah mit ihm zufrieden sein", "möge allah mit ihnen zufrieden sein",
  "möge allah zufrieden mit ihm sein",
].map(latinWords).sort((a, b) => b.length - a.length);

function withoutPhrases(words: string[], phrases: string[][]): string[] {
  const out: string[] = [];
  for (let i = 0; i < words.length;) {
    const hit = phrases.find((phrase) => phrase.length > 0 && phrase.every((word, k) => words[i + k] === word));
    if (hit) i += hit.length;
    else out.push(words[i++]);
  }
  return out;
}

export function copiesSource(text: string, sources: SourceText[]): boolean {
  const claimAr = arabicWords(text);
  const claimLat = latinWords(text);
  const strippedAr = withoutPhrases(claimAr, HONORIFICS_AR);
  const strippedLat = withoutPhrases(claimLat, HONORIFICS_LATIN);
  for (const s of sources) {
    const honorificsRemoved = s.kind !== "quran";
    const ar = honorificsRemoved ? strippedAr : claimAr;
    const lat = honorificsRemoved ? strippedLat : claimLat;
    const vs = honorificsRemoved
      ? withoutPhrases(arabicWords(s.arabic), HONORIFICS_AR)
      : arabicWords(s.arabic);
    if (ar.length >= 1 && vs.length > 0) {
      if (s.kind === "scholar") {
        if (ar.length >= 8 && vs.length >= 8) {
          const sourceEight = grams(vs, 8);
          for (const group of grams(ar, 8)) if (sourceEight.has(group)) return true;
        }
        const sourcePairs = grams(vs, 2);
        const claimPairs = [...grams(ar, 2)];
        if (ar.length >= 12 && claimPairs.length > 0
          && claimPairs.filter((group) => sourcePairs.has(group)).length / claimPairs.length > 0.7) return true;
      } else {
        if (vs.length < 4) {
          if (grams(ar, vs.length).has(vs.join(" "))) return true;
        } else {
          const sourceFour = grams(vs, 4);
          for (const group of grams(ar, 4)) if (sourceFour.has(group)) return true;
        }
        // One altered word: most of the claim's word pairs appear in the source.
        const sourcePairs = grams(vs, 2);
        const claimPairs = [...grams(ar, 2)];
        if (claimPairs.length >= 4
          && claimPairs.filter((group) => sourcePairs.has(group)).length / claimPairs.length > 0.6) return true;
      }
    }
    for (const tr of Object.values(s.translations)) {
      if (!tr) continue;
      const tw = honorificsRemoved ? withoutPhrases(latinWords(tr), HONORIFICS_LATIN) : latinWords(tr);
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

export const CLAIM_AUDIT_FIELDS = ["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"] as const;
export const CLAIM_AUDIT_REASONS = ["unsupported_meaning", "audience_changed", "condition_lost", "scope_broadened", "cause_inferred"] as const;
export type ClaimAuditFailure = {
  claim_id: string; source_ids: string[]; reason_codes: (typeof CLAIM_AUDIT_REASONS)[number][]; explanation: string;
};
export type ClaimAuditResult = { supported: boolean; failures: ClaimAuditFailure[] };

/** Draft-local IDs are stable across screening calls; never part of the public answer. */
export function identifiedClaims(claims: Claim[]) {
  return claims.map((claim, i) => ({ claim_id: `C${i + 1}`, source_ids: [...claim.refs], claim: claim.text, requirement_id: claim.requirementId }));
}

/** Validate the entire audit before accepting any feedback. Missing/extra IDs or verdicts fail closed. */
export function parseClaimAudit(raw: unknown, claims: Claim[], onFailure?: (code: string) => void): ClaimAuditResult | null {
  const fail = (code: string): null => { onFailure?.(code); return null; };
  if (!raw || typeof raw !== "object" || claims.length === 0) return fail("response_or_claims_missing");
  const assessments = (raw as Record<string, unknown>).claim_assessments;
  if (!Array.isArray(assessments)) return fail("assessments_missing");
  if (assessments.length !== claims.length) return fail("assessment_count_mismatch");
  const expected = new Map(identifiedClaims(claims).map((c) => [c.claim_id, c]));
  const seen = new Set<string>();
  const failures: ClaimAuditFailure[] = [];
  for (const item of assessments) {
    if (!item || typeof item !== "object") return fail("assessment_not_object");
    const r = item as Record<string, unknown>;
    if (typeof r.claim_id !== "string") return fail("claim_id_missing");
    if (seen.has(r.claim_id)) return fail("claim_id_duplicate");
    const claim = expected.get(r.claim_id);
    if (!claim) return fail("claim_id_unknown");
    if (!Array.isArray(r.source_ids) || r.source_ids.length !== claim.source_ids.length
      || new Set(r.source_ids).size !== r.source_ids.length
      || !r.source_ids.every((id) => typeof id === "string" && claim.source_ids.includes(id))) return fail("citation_ids_mismatch");
    seen.add(r.claim_id);
    for (const field of CLAIM_AUDIT_FIELDS) {
      if (r[field] === undefined) return fail(`${field}_missing`);
      if (typeof r[field] !== "string" || !["yes", "no", "unsure"].includes(r[field] as string)) return fail(`${field}_invalid`);
    }
    if (!Array.isArray(r.reason_codes) || new Set(r.reason_codes).size !== r.reason_codes.length
      || !r.reason_codes.every((code) => CLAIM_AUDIT_REASONS.includes(code))) return fail("reason_codes_missing_or_invalid");
    if (typeof r.explanation !== "string") return fail("explanation_missing");
    if (r.explanation.length > 240) return fail("explanation_too_long");
    const requiredReasons = CLAIM_AUDIT_FIELDS.flatMap((field, i) => r[field] === "yes" ? [] : [CLAIM_AUDIT_REASONS[i]]);
    if (r.reason_codes.length !== requiredReasons.length || !requiredReasons.every((code) => (r.reason_codes as unknown[]).includes(code))) return fail("reason_codes_disagree_with_decisions");
    if (requiredReasons.length === 0) {
      if (r.explanation !== "") return fail("positive_assessment_has_explanation");
    } else {
      if (!r.explanation.trim()) return fail("negative_assessment_explanation_empty");
      failures.push({ claim_id: r.claim_id, source_ids: [...claim.source_ids], reason_codes: requiredReasons, explanation: r.explanation });
    }
  }
  return { supported: failures.length === 0, failures };
}

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

/** Every exact requested point must have one clear yes verdict, with no missing or invented ids. */
export function requirementsCovered(raw: unknown, requirementIds: string[]): boolean {
  if (!raw || typeof raw !== "object") return false;
  const verdicts = (raw as Record<string, unknown>).requirement_verdicts;
  if (!Array.isArray(verdicts) || verdicts.length !== requirementIds.length) return false;
  const seen = new Set<string>();
  for (const item of verdicts) {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    if (!isStr(record.requirement_id) || !requirementIds.includes(record.requirement_id) || seen.has(record.requirement_id)) return false;
    if (record.verdict !== "yes") return false;
    seen.add(record.requirement_id);
  }
  return requirementIds.every((id) => seen.has(id));
}

/** Independent screening must confirm the direct answer and every requested source list item. */
export function structuredAnswerOk(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return r.direct_answer_complete === "yes" && r.listed_items_complete === "yes"
    && r.no_repetition === "yes" && r.not_established_ok === "yes";
}

/** Small source-triggered guard for high-impact lists the Lite checker has repeatedly missed.
 * It never creates an answer: it can only reject wording when the sealed source itself has the items. */
export function missingListedItems(question: string, language: Locale, sources: SourceText[], claims: Claim[]): string[] {
  const answer = claims.map((claim) => claim.text).join(" ").toLowerCase();
  const normalizedAnswer = normalizeArabic(answer);
  const source = normalizeArabic(sources.map((item) => item.arabic).join(" "));
  const missing: string[] = [];
  const requireItem = (name: string, pattern: RegExp) => { if (!pattern.test(answer)) missing.push(name); };
  if (/توب|repent|bereu/i.test(question) && /الندم/.test(source) && /الاقلاع/.test(source) && /العزم/.test(source)) {
    if (language === "ar") {
      requireItem("stop the sin", /اقلاع|ترك|توقف|يمتنع/);
      requireItem("regret", /ندم|يندم/);
      requireItem("resolve not to return", /عزم|عدم العود|لا يعود|الا يعود/);
    } else if (language === "de") {
      requireItem("stop the sin", /aufhör|unterlass|beend|lass.*sünde/);
      requireItem("regret", /bereu|reue/);
      requireItem("resolve not to return", /nicht wiederhol|nicht zurückkehr|nicht erneut|vorsatz|entschloss/);
    } else {
      requireItem("stop the sin", /stop|cease|leave|abandon|give up|refrain/);
      requireItem("regret", /regret|remorse/);
      requireItem("resolve not to return", /resolv|intend|determined|not return|not repeat|never return|never repeat/);
    }
  }
  if (asksAboutRestoringRights(question)) {
    if (language === "ar") {
      requireItem("restore or satisfy the person's rights", /\u0631\u062f.{0,20}\u062d\u0642\u0648\u0642|\u0627\u0639\u0627\u062f.{0,20}\u062d\u0642\u0648\u0642|\u0627\u0631\u0636\u0627\u0621.{0,20}\u0627\u0635\u062d\u0627\u0628.{0,20}\u062d\u0642\u0648\u0642|\u064a\u0631\u0636\u064a.{0,20}\u0627\u0635\u062d\u0627\u0628.{0,20}\u062d\u0642\u0648\u0642|\u0627\u062f\u0627\u0621.{0,20}\u062d\u0642\u0648\u0642|\u062a\u062d\u0644\u0644/);
    } else if (language === "de") {
      requireItem("restore or satisfy the person's rights", /zur\u00fcckgeb|zurueckgeb|erstat|entsch\u00e4d|entschaed|wiedergut|zufriedenstell/);
    } else {
      requireItem("restore or satisfy the person's rights", /restore.{0,40}rights?|return.{0,40}(?:rights?|property|money|what was taken)|repay|compensat|make amends|satisf(?:y|ied).{0,50}(?:person|people|owner|victim|rights?)|seek forgiveness.{0,40}(?:person|people|owner|victim)/);
    }
  }
  if (asksBackbitingDisclosure(question)) {
    if (language === "ar") {
      requireItem("state whether the person should be told", /\u064a\u062e\u0628\u0631|\u064a\u0639\u0644\u0645|\u064a\u0628\u0644\u063a|\u0627\u0633\u062a\u0633\u0645\u062d|\u064a\u0633\u062a\u062d\u0644/);
      requireItem("state the harm exception", /\u0641\u062a\u0646\u0647|\u0634\u0631|\u0627\u0630\u064a|\u0628\u063a\u0636\u0627\u0621|\u0644\u0627 \u064a\u0639\u0644\u0645/);
      requireItem("state the alternative when telling may cause harm", /\u064a\u0630\u0643\u0631.{0,30}\u0628\u062e\u064a\u0631|\u064a\u0630\u0643\u0631.{0,30}\u0645\u062d\u0627\u0633\u0646|\u064a\u0633\u062a\u063a\u0641\u0631.{0,20}\u0644/);
    } else if (language === "de") {
      requireItem("state whether the person should be told", /informier|mitteil|sag.{0,20}(?:person|betroffen)/);
      requireItem("state the harm exception", /schaden|feindschaft|streit|verschlimmer|zwietracht/);
      requireItem("state the alternative when telling may cause harm", /gut.{0,20}(?:sprechen|erw\u00e4hnen)|lob|f\u00fcr.{0,20}(?:vergebung|beten)|allah.{0,20}vergebung/);
    } else {
      requireItem("state whether the person should be told", /\btell(?:ing)?\b|\btold\b|\binform(?:ed|ing)?\b|\bdisclos/);
      requireItem("state the harm exception", /harm|hostility|resentment|conflict|discord|worse|greater evil|fitna/);
      requireItem("state the alternative when telling may cause harm", /mention.{0,30}(?:good|qualities)|speak well|praise|ask allah.{0,30}forgiv|pray.{0,20}for (?:them|him|her)/);
    }
    const categorical = language === "ar"
      ? /(?:\u064a\u062c\u0628|\u0644\u0627 \u0628\u062f).{0,25}(?:\u064a\u062e\u0628\u0631|\u064a\u0639\u0644\u0645|\u064a\u0628\u0644\u063a)/.test(normalizedAnswer)
        && !/\u0627\u0630\u0627|\u0627\u0646|\u0627\u0644\u0627|\u0644\u0643\u0646|\u0641\u062a\u0646\u0647|\u0634\u0631/.test(normalizedAnswer)
      : language === "de"
        ? /(?:muss|immer).{0,25}(?:informier|mitteil|sagen)/.test(answer)
          && !/wenn|falls|au\u00dfer|aber|schaden|streit/.test(answer)
        : /(?:must|always|required to).{0,25}(?:tell|inform|disclos)/.test(answer)
          && !/\bif\b|\bwhen\b|unless|except|however|harm|hostility|resentment|conflict/.test(answer);
    if (categorical) missing.push("do not say the person must always be told");
  }
  if (/convert|become muslim|muslim werden|konvertier|أسلم|أصبح مسلما/i.test(question)
    && /لا اله الا الله/.test(source) && /محمد(?:ا)? رسول الله/.test(source)) {
    if (language === "ar") {
      requireItem("testimony that Allah alone is God", /لا اله الا الله|اشهد ان لا اله الا الله/);
      requireItem("testimony that Muhammad is the Messenger", /محمد رسول الله|محمدا رسول الله/);
    } else if (language === "de") {
      requireItem("testimony that Allah alone is God", /kein(?:en)? gott außer allah|allah.*einzig.*gott|allein.*allah.*gott/);
      requireItem("testimony that Muhammad is the Messenger", /muhammad.*gesandt|mohammed.*gesandt|muhammad.*prophet/);
    } else {
      requireItem("testimony that Allah alone is God", /no god (?:but|except) allah|allah.*only god/);
      requireItem("testimony that Muhammad is the Messenger", /muhammad.*messenger|muhammad.*prophet/);
    }
  }
  if (/ذهب|gold/i.test(question) && /زكاة|zakat/i.test(question)
    && /مقدار|نسبة|how much|rate|wie viel/i.test(question) && /ربع العشر/.test(source)) {
    requireItem("gold zakat payable rate", language === "ar" ? /ربع العشر|٢[.,٫]٥|2[.,]5/ : /2[.,]5\s*%|one fortieth|quarter of a tenth|viertel.*zehntel/);
  }
  return missing;
}

const asksAboutRepentance = (question: string) => /\u062a\u0648\u0628|repent|bereu|reue/i.test(question);
const asksForRepentanceConditions = (question: string) => asksAboutRepentance(question)
  && /\u0634\u0631\u0648\u0637|conditions?|requirements?|bedingungen|voraussetzungen/i.test(question);
const asksAboutRestoringRights = (question: string) => asksAboutRepentance(question)
  && /harm(?:ed|ing)?\s+(?:another|someone|a person)|hurt\s+(?:another|someone|a person)|violat(?:e|ed|ing).{0,20}rights?|another person'?s rights?|people'?s rights?|restore.{0,20}rights?|make amends|jemandem geschadet|rechte (?:anderer|verletzt)|wiedergutmachen|\u062d\u0642\u0648\u0642|\u0638\u0644\u0645|[\u0623\u0627]\u0630\u0649/i.test(question);
const asksBackbitingDisclosure = (question: string) => /\u063a\u064a\u0628\u0629|\u0627\u063a\u062a\u0627\u0628|backbit|gossip|\u00fcble nachrede|l\u00e4ster|laester/i.test(question)
  && /must.{0,25}(?:tell|inform)|tell.{0,35}(?:person|them|him|her)|inform|notify|disclos|\u0627\u062e\u0628\u0627\u0631|\u0627\u0639\u0644\u0627\u0645|\u064a\u062e\u0628\u0631|\u0627\u0628\u0644\u0627\u063a|mitteil|informier|sagen/i.test(question);

/** Some high-impact procedures are complete only when the sealed source itself contains every
 * indispensable item. This gate can only refuse; it never supplies religious content. */
export function requiredSourceItemsPresent(question: string, sources: SourceText[]): boolean {
  const asksWhyFivePrayers = /why.{0,35}(?:(?:five|5).{0,25}pray|pray.{0,25}(?:five|5))|warum.{0,35}(?:(?:f(?:u|ü)nf|5).{0,25}(?:gebet|mal)|(?:bet|gebet).{0,25}(?:f(?:u|ü)nf|5))|(?:لماذا|ما الحكمة).{0,35}(?:(?:خمس|٥).{0,25}صل|صل.{0,25}(?:خمس|٥))/iu.test(question);
  // The current sealed library has texts about the number and reward of the prayers, but no direct
  // approved source explaining why five were prescribed. Refuse until that source is added.
  if (asksWhyFivePrayers) return false;

  const sealedSource = normalizeArabic(sources.map((item) => item.arabic).join(" "));
  if (asksForRepentanceConditions(question)
    && !(/\u0627\u0644\u0646\u062f\u0645/.test(sealedSource)
      && /\u0627\u0644\u0627\u0642\u0644\u0627\u0639/.test(sealedSource)
      && /\u0627\u0644\u0639\u0632\u0645/.test(sealedSource))) return false;
  if (asksAboutRestoringRights(question)
    && !sources.some((item) => {
      const text = normalizeArabic(item.arabic);
      return /\u062d\u0642\u0648\u0642/.test(text)
        && /\u064a\u0631\u0636\u064a|\u0631\u062f|\u0627\u062f\u0627\u0621|\u0627\u0639\u0627\u062f|\u0627\u0631\u062c\u0627\u0639|\u062a\u062d\u0644\u0644/.test(text);
    })) return false;
  if (asksBackbitingDisclosure(question)
    && !sources.some((item) => {
      const text = normalizeArabic(item.arabic);
      return /\u063a\u064a\u0628[\u0629\u0647]|\u0627\u063a\u062a\u0627\u0628/.test(text)
        && /\u064a\u0639\u0644\u0645|\u064a\u062e\u0628\u0631|\u064a\u0628\u0644\u063a|\u0627\u0633\u062a\u0633\u0645\u062d|\u064a\u0633\u062a\u062d\u0644/.test(text)
        && /\u0644\u0627 \u064a\u0639\u0644\u0645|\u064a\u062e\u0627\u0641|\u0641\u062a\u0646\u0647|\u0634\u0631|\u0628\u063a\u0636\u0627\u0621|\u062a\u064a\u0633\u0631/.test(text);
    })) return false;

  if (!/convert|become muslim|muslim werden|konvertier|أسلم|أصبح مسلما/i.test(question)) return true;
  const source = normalizeArabic(sources.map((item) => item.arabic).join(" "));
  return /لا اله الا الله/.test(source) && /محمد(?:ا)? رسول الله/.test(source);
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

export function isGeneralGuidanceQuestion(question: string): boolean {
  // Learning a general practice or entering Islam is not a case-specific fatwa.
  return /\b(how|what) (?:can |should |do )?i (?:do |need to |have to )?(?:become (?:a )?muslim|convert to islam|learn to pray)\b|\bhow do i repent(?: from (?:a |my )?sins?)?\s*[?.!]?\s*$|\bwie (?:kann |muss |soll )?ich.{0,20}(?:muslim werden|zum islam konvertieren|bereuen|beten lernen)\b|\bwas muss ich tun, um muslim zu werden\b|كيف (?:أصبح مسلما|أسلم|أتوب|أتعلم الصلاة)/i.test(question)
    && !/\b(my|mine|wife|husband|divorce|loan|debt|pregnant|ill|sick)\b|\b(meine?|ehe|scheidung|schulden|krank)\b|زوجتي|زوجي|ديني|مرضي/i.test(question);
}

export function looksPersonal(question: string): boolean {
  if (isGeneralGuidanceQuestion(question)) return false;
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

/** Complete passages named by their well-known name, as internal ids ("Q1:1" ... "Q1:7"). */
export function namedPassageGroups(question: string): string[][] {
  return NAMED_PASSAGES.filter(([pattern]) => pattern.test(question)).map(([, keys]) => keys.map((key) => `Q${key}`));
}

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
