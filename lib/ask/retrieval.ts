import type { Locale } from "@/lib/i18n";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";
import { chooseSealedPackage, type ChooserOptions, type QuranCard } from "./package";
import { parseContributionPlan, type ContributionUnit } from "./contribution-plan";

export const QUESTION_TYPES = [
  "identity",
  "definition",
  "ruling",
  "evidence",
  "reason",
  "practice",
  "history",
  "comparison",
  "objection",
  "reference",
  "general",
] as const;

export const ANSWER_FACETS = [
  "identity",
  "definition",
  "attributes",
  "ruling",
  "evidence",
  "reason",
  "steps",
  "conditions",
  "exceptions",
  "history",
  "comparison",
  "response",
  "meaning",
  "quantity",
  "time",
  "place",
  "general",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type AnswerFacet = (typeof ANSWER_FACETS)[number];

export type AnswerRequirement = {
  id: string; // Assigned by code as R1...R4. The understanding model never chooses ids.
  text: string;
  facet: AnswerFacet;
  scope?: "general" | "case_specific";
  essentialConditions?: string[]; // Question constraints, never answer facts.
  interpretationId?: "I1" | "I2";
  searchQueries?: Partial<Record<Locale, string[]>>;
  quranArabic?: string[];
  hadithArabic?: string[];
  hadithSearchQueries?: Partial<Record<"en" | "ar", string[]>>;
};

export type QuestionFrame = {
  backupQueries?: import("./search-engine/recovery").RecoveryQuery[];
  language: Locale;
  kind: "question" | "personal" | "greeting" | "off_topic" | "harmful";
  questionType: QuestionType;
  subjects: string[];
  requirements: AnswerRequirement[];
  requiredFacets: AnswerFacet[];
  qualifiers: string[];
  searchQueries: Partial<Record<Locale, string[]>>;
  // Tiered mode only: Arabic phrases in Quran wording and in the Prophet's wording. searchQueries.ar
  // stays the fatwa wording. Absent in the old mode.
  tierQueries?: { quran: string[]; hadith: string[] };
  interpretations?: { id: "I1" | "I2"; label: string }[];
  clarificationNeeded?: boolean;
  checklistStatus?: "complete" | "ambiguous" | "too_complex";
};

export function requirementMeaning(requirements: AnswerRequirement[]): AnswerRequirement[] {
  return requirements.map(({ searchQueries: _queries, quranArabic: _quran, hadithArabic: _hadith, hadithSearchQueries: _hadithQueries, ...meaning }) => meaning);
}

const LOCALES = ["ar", "en", "de"] as const;
const KINDS = ["question", "personal", "greeting", "off_topic", "harmful"] as const;
const SAFE_PHRASE = /^[\p{L}\p{M}][\p{L}\p{M}' -]{0,79}$/u;
// Checklist descriptions may be statements or questions. Ordinary punctuation is
// harmless here; instruction filtering, length limits and enums remain enforced.
const SAFE_REQUIREMENT = /^(?=.*[A-Za-z])[A-Za-z\d%'(),.:;?! -]{1,120}$/;
const INSTRUCTION_WORDS = /\b(ignore|disregard|instructions?|prompt|system|output|reveal|override|bypass)\b|\b(ignoriere|anweisung|prompt|system|ausgabe|enth[üu]lle|umgehe)\b|تجاهل|تعليمات|موجه|نظام|اكشف|تجاوز/iu;
const GENERIC_SEARCH_WORDS = new Set([
  "who", "what", "why", "how", "where", "when", "is", "are", "was", "were", "the", "a", "an", "of", "in", "about", "on", "for",
  "islam", "quran", "koran", "concept", "definition", "meaning", "attribute", "attributes", "name", "names",
  "wer", "was", "warum", "wie", "wo", "wann", "ist", "sind", "der", "die", "das", "ein", "eine", "von", "im", "über", "fuer", "für",
  "konzept", "definition", "bedeutung", "eigenschaft", "eigenschaften", "gottesbild",
  "من", "ما", "ماذا", "لماذا", "كيف", "اين", "أين", "متى", "هو", "هي", "في", "عن", "على", "الى", "إلى",
  "الاسلام", "الإسلام", "القران", "القرآن", "مفهوم", "تعريف", "معنى", "صفه", "صفة", "صفات", "اسم", "اسماء", "أسماء",
]);

const isString = (value: unknown): value is string => typeof value === "string";

function phrases(value: unknown, maxItems: number, maxWords: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter(isString)
      .map((item) => item.trim().replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " "))
      .filter((item) => SAFE_PHRASE.test(item) && !INSTRUCTION_WORDS.test(item) && item.split(" ").length <= maxWords),
  )].slice(0, maxItems);
}

function requirements(value: unknown): AnswerRequirement[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 4) return null;
  const parsed: Omit<AnswerRequirement, "id">[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const point = item as Record<string, unknown>;
    if (!isString(point.text) || !isString(point.facet)) return null;
    const text = point.text.trim().replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ");
    const key = text.toLocaleLowerCase("en");
    if (!SAFE_REQUIREMENT.test(text) || INSTRUCTION_WORDS.test(text) || text.split(" ").length > 16) return null;
    if (!(ANSWER_FACETS as readonly string[]).includes(point.facet) || seen.has(key)) return null;
    seen.add(key);
    const extras: Partial<AnswerRequirement> = {};
    if (point.scope !== undefined) {
      if (point.scope !== "general" && point.scope !== "case_specific") return null;
      extras.scope = point.scope;
    }
    if (point.essential_conditions !== undefined) {
      if (!Array.isArray(point.essential_conditions) || point.essential_conditions.length > 3) return null;
      // Conditions must retain the visitor's actual qualification. A five-word
      // cap rejected ordinary constraints such as "the request conflicts with
      // the visitor's religion", which then invalidated the entire question.
      const conditions = phrases(point.essential_conditions, 3, 8);
      if (conditions.length !== point.essential_conditions.length) return null;
      extras.essentialConditions = conditions;
    }
    if (point.interpretation_id !== undefined && point.interpretation_id !== "") {
      if (point.interpretation_id !== "I1" && point.interpretation_id !== "I2") return null;
      extras.interpretationId = point.interpretation_id;
    }
    if (point.search_queries !== undefined) {
      if (!point.search_queries || typeof point.search_queries !== "object") return null;
      const queries = point.search_queries as Record<string, unknown>;
      extras.searchQueries = Object.fromEntries(LOCALES.map((lang) => [lang, phrases(queries[lang], 2, 6)
        .filter((query) => lang !== "ar" || /\p{Script=Arabic}/u.test(query))]));
      if (!Object.values(extras.searchQueries).some((list) => list!.length > 0)) return null;
      extras.quranArabic = phrases(point.quran_ar, 2, 8).filter((q) => /\p{Script=Arabic}/u.test(q));
      extras.hadithArabic = phrases(point.hadith_ar, 2, 8).filter((q) => /\p{Script=Arabic}/u.test(q));
    }
    if (point.hadith_search_queries !== undefined) {
      if (!point.hadith_search_queries || typeof point.hadith_search_queries !== "object" || Array.isArray(point.hadith_search_queries)) return null;
      const q = point.hadith_search_queries as Record<string, unknown>;
      extras.hadithSearchQueries = { en: phrases(q.en, 2, 6), ar: phrases(q.ar, 2, 6).filter(text => /\p{Script=Arabic}/u.test(text)) };
    }
    parsed.push({ text, facet: point.facet as AnswerFacet, ...extras });
  }
  return parsed.map((point, index) => ({ id: `R${index + 1}`, ...point }));
}

/**
 * Validates the AI's question analysis. Only bounded labels and filtered short phrases survive;
 * the raw visitor text is never forwarded to retrieval, drafting or screening.
 */
/** Fixed, privacy-safe correction hints. Never coerce a rejected plan into approval. */
export function questionFrameRejection(raw: unknown): string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "frame_response_unreadable";
  const points = (raw as Record<string, unknown>).requested_points;
  if (Array.isArray(points)) for (const item of points) {
    if (!item || typeof item !== "object") return "requested_point_malformed";
    const p = item as Record<string, unknown>;
    if (typeof p.text === "string" && !SAFE_REQUIREMENT.test(p.text.trim().replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ")))
      return "requested_point_text_must_be_short_plain_English";
    if (typeof p.facet === "string" && !(ANSWER_FACETS as readonly string[]).includes(p.facet)) return "requested_point_facet_not_in_allowed_enum";
  }
  const record = raw as Record<string, unknown>;
  if (["question", "personal"].includes(String(record.kind)) && phrases(record.subjects, 5, 4).length === 0)
    return "subjects_must_be_short_English_labels_max_4_words_each";
  return "question_frame_contract_invalid";
}

export function parseQuestionFrame(raw: unknown): QuestionFrame | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (!isString(record.language) || !(LOCALES as readonly string[]).includes(record.language)) return null;
  if (!isString(record.kind) || !(KINDS as readonly string[]).includes(record.kind)) return null;
  if (!isString(record.question_type) || !(QUESTION_TYPES as readonly string[]).includes(record.question_type)) return null;

  const subjects = phrases(record.subjects, 5, 4);
  const qualifiers = phrases(record.qualifiers, 5, 5);
  const kind = record.kind as QuestionFrame["kind"];
  const requested = requirements(record.requested_points);
  if ((kind === "question" || kind === "personal") && (subjects.length === 0 || !requested)) return null;
  if (!(kind === "question" || kind === "personal") && Array.isArray(record.requested_points) && record.requested_points.length > 0) return null;
  const answerRequirements = requested ?? [];
  const requiredFacets = [...new Set(answerRequirements.map((point) => point.facet))];

  const searchQueries = {
    en: phrases(record.search_queries_en, 6, 6),
    de: phrases(record.search_queries_de, 6, 6),
    ar: phrases(record.search_queries_ar, 6, 6).filter((query) => /\p{Script=Arabic}/u.test(query)),
  };
  if (kind === "question" && Object.values(searchQueries).every((list) => list.length === 0)) return null;
  const arabicOnly = (value: unknown) => phrases(value, 3, 8).filter((query) => /\p{Script=Arabic}/u.test(query));
  const tiered = "search_queries_quran_ar" in record || "search_queries_hadith_ar" in record;
  let interpretations: QuestionFrame["interpretations"];
  if (record.interpretations !== undefined) {
    if (!Array.isArray(record.interpretations) || record.interpretations.length > 2) return null;
    const labels = phrases(record.interpretations, 2, 5);
    if (labels.length !== record.interpretations.length || labels.length === 1) return null;
    interpretations = labels.map((label, index) => ({ id: index === 0 ? "I1" : "I2", label }));
    if (interpretations.length && !interpretations.every((item) => answerRequirements.some((r) => r.interpretationId === item.id))) return null;
  }
  // A meaning label with no meanings listed says nothing (seen from Gemini Flash-Lite, 2026-10-30): remove it.
  if (!interpretations?.length) for (const r of answerRequirements) delete r.interpretationId;
  if (answerRequirements.some((r) => r.interpretationId && !interpretations?.some((i) => i.id === r.interpretationId))) return null;
  if (record.clarification_needed !== undefined && typeof record.clarification_needed !== "boolean") return null;
  if (record.checklist_status !== undefined && !["complete", "ambiguous", "too_complex"].includes(String(record.checklist_status))) return null;

  let backupQueries: QuestionFrame["backupQueries"];
  if (record.backup_queries !== undefined) {
    if (!Array.isArray(record.backup_queries)) return null;
    backupQueries = [];
    // Search hints only, never evidence: a bad one is dropped and does not lose the plan (Mo, 2026-10-30).
    for (const q of record.backup_queries.slice(0, 6)) {
      // A bare "1" (seen from Gemini Flash-Lite, 2026-10-30) means R1.
      if (q && typeof q === "object" && /^\d$/.test(String(q.requirementId))) q.requirementId = `R${q.requirementId}`;
      if (!q || typeof q !== "object" || !answerRequirements.some(r => r.id === q.requirementId)
        || !["quran", "hadith", "scholar"].includes(q.family) || !["en", "ar"].includes(q.language)
        || typeof q.text !== "string" || !q.text.trim() || q.text.length > 120
        || q.language === "ar" && !/\p{Script=Arabic}/u.test(q.text)) continue;
      backupQueries.push({ requirementId: q.requirementId, family: q.family, language: q.language, text: q.text.trim() });
    }
  }
  return {
    ...(backupQueries ? { backupQueries } : {}),
    language: record.language as Locale,
    kind,
    questionType: record.question_type as QuestionType,
    subjects,
    requirements: answerRequirements,
    requiredFacets,
    qualifiers,
    searchQueries,
    ...(record.checklist_status ? { checklistStatus: record.checklist_status as QuestionFrame["checklistStatus"] } : {}),
    ...(interpretations ? { interpretations, clarificationNeeded: record.clarification_needed === true } : {}),
    ...(tiered ? { tierQueries: { quran: arabicOnly(record.search_queries_quran_ar), hadith: arabicOnly(record.search_queries_hadith_ar) } } : {}),
  };
}

const asksAboutRepentance = (question: string) => /\u062a\u0648\u0628|repent|bereu|reue/i.test(question);
const asksForRepentanceConditions = (question: string) => asksAboutRepentance(question)
  && /\u0634\u0631\u0648\u0637|conditions?|requirements?|bedingungen|voraussetzungen/i.test(question);
const asksAboutRestoringRights = (question: string) => asksAboutRepentance(question)
  && /harm(?:ed|ing)?\s+(?:another|someone|a person)|hurt\s+(?:another|someone|a person)|violat(?:e|ed|ing).{0,20}rights?|another person'?s rights?|people'?s rights?|restore.{0,20}rights?|make amends|jemandem geschadet|rechte (?:anderer|verletzt)|wiedergutmachen|\u062d\u0642\u0648\u0642|\u0638\u0644\u0645|[\u0623\u0627]\u0630\u0649/i.test(question);
const asksBackbitingDisclosure = (question: string) => /\u063a\u064a\u0628\u0629|\u0627\u063a\u062a\u0627\u0628|backbit|gossip|\u00fcble nachrede|l\u00e4ster|laester/i.test(question)
  && /must.{0,25}(?:tell|inform)|tell.{0,35}(?:person|them|him|her)|inform|notify|disclos|\u0627\u062e\u0628\u0627\u0631|\u0627\u0639\u0644\u0627\u0645|\u064a\u062e\u0628\u0631|\u0627\u0628\u0644\u0627\u063a|mitteil|informier|sagen/i.test(question);

/** Check explicit requests against the original text before any search is run. */
export function questionFrameMismatch(question: string, frame: QuestionFrame): string | null {
  if (frame.kind !== "question") return null;
  const points = frame.requirements;
  const has = (facet: AnswerFacet) => points.some((point) => point.facet === facet);
  const wording = points.map((point) => point.text.toLowerCase()).join(" ");
  const goldZakat = /زكاة.{0,25}الذهب|الذهب.{0,25}زكاة|gold.{0,25}zakat|zakat.{0,25}gold|gold.{0,25}zaka|zaka.{0,25}gold|gold.{0,25}zakāt/i.test(question);
  const amountDue = /كم مقدارها|كم (?:مقدار|نسبة|قدر) الزكاة|how much (?:zakat|zakah|zaka).{0,30}(?:due|pay)|how much.{0,30}(?:zakat|zakah|zaka)|wie viel.{0,30}zakat/i.test(question);
  if (goldZakat && amountDue) {
    if (!has("quantity")) return "gold_zakat_rate_missing";
    const quantities = points.filter((point) => point.facet === "quantity").map((point) => point.text.toLowerCase());
    if (!quantities.some((point) => /rate|amount due|amount to pay|percentage|percent/.test(point))) return "gold_zakat_rate_confused";
    if (quantities.some((point) => /nisab|threshold|minimum/.test(point)) && !/نصاب|threshold|nisab|mindestbetrag/i.test(question)) return "gold_zakat_threshold_added";
  }
  if (asksForRepentanceConditions(question)) {
    const hasConditionsPoint = points.some((point) => !/rights?|harm|amends|restore|victim/i.test(point.text)
      && (point.facet === "conditions" || /repentance.{0,20}(?:conditions?|requirements?|steps)|conditions?.{0,20}repentance/i.test(point.text)));
    if (!hasConditionsPoint) return "repentance_conditions_missing";
  }
  if (asksAboutRestoringRights(question)
    && !points.some((point) => /rights?|harm|amends|restore|repay|compensat|satisfy|victim/i.test(point.text))) {
    return "repentance_rights_missing";
  }
  if (asksBackbitingDisclosure(question)
    && !points.some((point) => /tell|inform|notify|disclos|whether.{0,20}(?:tell|inform)/i.test(point.text))) {
    return "backbiting_disclosure_missing";
  }
  if (/شروط|conditions|voraussetzungen/i.test(question) && goldZakat && !has("conditions")) return "conditions_missing";
  if (/\bwhy\b|لماذا|\bwarum\b/i.test(question) && !has("reason") && !has("response")) return "reason_missing";
  if (/\bhow many\b|كم عدد|\bwie viele\b/i.test(question) && !has("quantity")) return "quantity_missing";
  if (/\bhow\b.{0,35}\b(repent|convert|become muslim)\b|كيف.{0,30}(أتوب|التوبة|أسلم)|\bwas muss ich tun, um muslim zu werden\b|wie.{0,35}(muslim werden|bereue)/i.test(question) && !has("steps")) return "steps_missing";
  if (/\b(if god is merciful|if allah is merciful)\b|إذا كان الله رحيما/i.test(question) && /hell|جهنم|النار/i.test(question) && !has("response")) return "objection_response_missing";
  if (goldZakat && amountDue && /\bdefinition\b/.test(wording) && !/ما هي الزكاة|what is zakat/i.test(question)) return "unasked_definition";
  return null;
}

/** Repair only explicit facets detected from the visitor's wording. This changes a search plan,
 * never an answer: the ordinary evidence selector must still find direct support for each point. */
export function repairExplicitFrame(question: string, frame: QuestionFrame): QuestionFrame {
  if (frame.kind !== "question") return frame;
  const problem = questionFrameMismatch(question, frame);
  const enteringIslam = /become (?:a )?muslim|convert to islam|muslim werden|zum islam konvertier|أصبح مسلما|أسلم/i.test(question)
    && !/forced?|gezwungen|إكراه|إجبار/i.test(question);
  if (!problem && !enteringIslam) return frame;
  let points: Omit<AnswerRequirement, "id">[] = frame.requirements.map(({ id: _id, ...point }) => point);
  const subject = frame.subjects[0] ?? "the question";
  const add = (facet: AnswerFacet, text: string) => {
    if (!points.some((point) => point.facet === facet) && points.length < 4) points.push({ facet, text });
  };
  const addDistinct = (facet: AnswerFacet, text: string) => {
    if (!points.some((point) => point.text.toLowerCase() === text.toLowerCase()) && points.length < 4) points.push({ facet, text });
  };
  if (problem === "gold_zakat_rate_confused" || problem === "gold_zakat_threshold_added") {
    points = points.map((point) => point.facet === "quantity"
      ? { facet: "quantity" as const, text: "rate or amount of gold zakat due" } : point);
  } else if (problem === "gold_zakat_rate_missing") add("quantity", "rate or amount of gold zakat due");
  else if (problem === "conditions_missing") add("conditions", `conditions of ${subject}`);
  else if (problem === "reason_missing") add("reason", `reason for ${subject}`);
  else if (problem === "quantity_missing") add("quantity", `requested number for ${subject}`);
  else if (problem === "steps_missing") add("steps", `steps for ${subject}`);
  else if (problem === "objection_response_missing") add("response", `response to the challenge about ${subject}`);
  else if (problem === "unasked_definition") points = points.filter((point) => point.facet !== "definition");
  if (asksForRepentanceConditions(question)
    && !points.some((point) => !/rights?|harm|amends|restore|victim/i.test(point.text)
      && (point.facet === "conditions" || /repentance.{0,20}(?:conditions?|requirements?|steps)|conditions?.{0,20}repentance/i.test(point.text)))) {
    addDistinct("conditions", "conditions of sincere repentance");
  }
  if (asksAboutRestoringRights(question)
    && !points.some((point) => /rights?|harm|amends|restore|repay|compensat|satisfy|victim/i.test(point.text))) {
    addDistinct("steps", "restoring rights after harming another person");
  }
  if (asksBackbitingDisclosure(question)
    && !points.some((point) => /tell|inform|notify|disclos|whether.{0,20}(?:tell|inform)/i.test(point.text))) {
    addDistinct("ruling", "whether the person must tell the one they spoke about");
  }
  // A second pass catches a question that asks for both conditions and the payable rate.
  const provisional = { ...frame, requirements: points.map((point, index) => ({ ...point, id: `R${index + 1}` })) };
  if (questionFrameMismatch(question, provisional) === "conditions_missing") add("conditions", `conditions of ${subject}`);
  if (enteringIslam) {
    if (!points.some((point) => /allah alone|only allah|one god/.test(point.text.toLowerCase()))) {
      add("steps", "testimony that only Allah is God");
    }
    if (!points.some((point) => /muhammad.*messenger|muhammad.*prophet/.test(point.text.toLowerCase()))) {
      add("steps", "testimony that Muhammad is Allah's messenger");
    }
  }
  const requirements = points.map((point, index) => ({ ...point, id: `R${index + 1}` }));
  return { ...frame, requirements, requiredFacets: [...new Set(requirements.map((point) => point.facet))] };
}

/** Orders a small multilingual query set. Search phrases are hints only; they never become claims. */
export function buildSearchQueries(frame: QuestionFrame, limit = 6): string[] {
  const languageOrder = [...new Set<Locale>([frame.language, "ar", "en", "de"])];
  const ordered = languageOrder.flatMap((language) => frame.searchQueries[language] ?? []);
  const subjectWords = new Set([
    "allah", "god", "gott", "الله",
    ...frame.subjects.flatMap((subject) => subject.toLocaleLowerCase("en").match(/[\p{L}\p{M}]+/gu) ?? []),
  ]);
  const seen = new Set<string>();
  return ordered.filter((query) => {
    const key = query.toLocaleLowerCase(frame.language);
    if (seen.has(key)) return false;
    seen.add(key);
    const meaningful = key.match(/[\p{L}\p{M}]+/gu)?.filter((word) => !GENERIC_SEARCH_WORDS.has(word) && !subjectWords.has(word)) ?? [];
    return meaningful.length > 0;
  }).slice(0, limit);
}

// A candidate source: a Quran verse, a hadith (Sahih al-Bukhari / Sahih Muslim only), or a short
// quote from an approved scholar.
export type Source =
  | { kind: "quran"; verse: Verse }
  | { kind: "hadith"; hadith: Hadith }
  | { kind: "scholar"; quote: ScholarQuote };

export type PassageForSelection = {
  id: string; // "Q2:255" for verses, "HE4196" for hadith, "S<uuid>" for scholar quotes
  source: Source;
  context: Verse[]; // neighbouring verses; empty for hadith and scholar quotes, which stand on their own
  retrievedFor?: string[]; // Search provenance only. Never establishes supported requirements.
  contextAvailability?: "complete_parent" | "stored_excerpt_only";
};

function searchWords(text: string): string[] {
  return [...new Set((text.toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f]/g, "").match(/[\p{L}\p{M}]{3,}/gu) ?? [])
    .filter((word) => !GENERIC_SEARCH_WORDS.has(word)))];
}

/** Ranks a wider retrieved set before the independent evidence selector sees it. */
export function rankCandidatesForQuestion(
  frame: QuestionFrame,
  candidates: PassageForSelection[],
  mappedIds: ReadonlySet<string>,
  limits: { quran: number; hadith: number; scholar: number },
): PassageForSelection[] {
  const requested = frame.requirements.map((point) => searchWords(point.text));
  const arabic = searchWords((frame.searchQueries.ar ?? []).join(" "));
  const scored = candidates.map((candidate, index) => {
    const source = candidate.source;
    const main = source.kind === "quran"
      ? [source.verse.translations.en, source.verse.translations.de, source.verse.arabicPlain]
      : source.kind === "hadith"
        ? [source.hadith.translations.en, source.hadith.translations.de, source.hadith.arabic]
        : [source.quote.title, source.quote.arabic];
    const words = new Set(searchWords(main.filter(Boolean).join(" ")));
    const pointScores = requested.map((point, i) => point.filter((word) => words.has(word)).length
      + (candidate.retrievedFor?.includes(frame.requirements[i].id) ? 4 : 0));
    const coverage = pointScores.filter((score) => score > 0).length;
    const score = (mappedIds.has(candidate.id) ? 100 : 0)
      + coverage * 8 + pointScores.reduce((sum, item) => sum + item, 0) * 2
      + arabic.filter((word) => words.has(word)).length * 2;
    return { candidate, index, score, pointScores };
  });
  const kinds = ["quran", "hadith", "scholar"] as const;
  return kinds.flatMap((kind) => {
    const group = scored.filter((item) => item.candidate.source.kind === kind)
      .sort((a, b) => b.score - a.score || a.index - b.index);
    // Legacy ranking is unchanged when no per-point search provenance is present.
    if (!group.some((item) => item.candidate.retrievedFor?.length)) return group.slice(0, limits[kind]).map((item) => item.candidate);
    const chosen = new Set<string>();
    for (let i = 0; i < requested.length && chosen.size < limits[kind]; i++) {
      const best = [...group].filter((item) => !chosen.has(item.candidate.id) && item.pointScores[i] > 0)
        .sort((a, b) => b.pointScores[i] - a.pointScores[i] || b.score - a.score || a.index - b.index)[0];
      if (best) chosen.add(best.candidate.id);
    }
    for (const item of group) if (chosen.size < limits[kind]) chosen.add(item.candidate.id);
    return group.filter((item) => chosen.has(item.candidate.id)).map((item) => item.candidate);
  });
}

export type SourceContribution = { role: "direct" | "background" | "limited_example"; scope: "general" | "case_specific"; conditions: string[] };
export type SelectedPassage = PassageForSelection & {
  // Internal, explicit source links only; selection model output cannot populate this.
  explanationSourceIds?: string[];
  requirementIds: string[]; // Direct contributions only; context never establishes coverage.
  explanationRequirementIds?: string[];
  facets: AnswerFacet[]; contribution?: SourceContribution;
};

export type EvidencePackage = {
  partial?: true; // Source explanation only; never a completed answer package.
  contributionPlan?: ContributionUnit[]; // Checked identity/scope only; not approved religious content.
  question: Pick<QuestionFrame, "language" | "questionType" | "subjects" | "requirements" | "requiredFacets" | "qualifiers" | "interpretations">;
  passages: SelectedPassage[]; // capped, in writer order
  cards: QuranCard[]; // how the package's verses form Quran passage cards
  scholarDifference?: { positions: Record<string, string[]> };
};

type Relevance = "direct" | "partial" | "context" | "mention_only" | "unrelated";

/**
 * Turns the independent selector's output into a sealed package. Code, not the writer, enforces
 * that every exact requested point has direct, context-safe evidence.
 */
export function parseEvidencePackage(
  raw: unknown,
  frame: QuestionFrame,
  candidates: PassageForSelection[],
  options: ChooserOptions & { requireContributions?: boolean; partialPreview?: boolean; distinctSelection?: boolean } = {},
  onFailure?: (code: string) => void,
): EvidencePackage | null {
  const fail = (code: string): null => { onFailure?.(code); return null; };
  if (options.distinctSelection && !options.requireContributions) return fail("evidence_plan_requires_contributions");
  if (!raw || typeof raw !== "object") return fail("response_not_object");
  const record = raw as Record<string, unknown>;
  if (!isString(record.status) || !["ready", "insufficient", "ambiguous", "conflicting"].includes(record.status)) return fail(record.status === undefined ? "status_missing" : "status_invalid");
  if (!isString(record.coverage) || !["complete", "incomplete"].includes(record.coverage)) return fail(record.coverage === undefined ? "coverage_missing" : record.coverage === "uncertain" ? "coverage_uncertain" : "coverage_invalid");
  const conflictType = typeof record.conflict_type === "string" ? record.conflict_type
    : record.conflict === "none" ? "none" : "uncertain";
  if (!["none", "revelation_conflict", "scholar_difference", "uncertain"].includes(conflictType)) return fail("conflict_invalid");
  // Quran or hadith conflict always refuses. Only explicit scholar-position grouping may proceed,
  // and the caller still needs a reviewed decision or an equal-view answer path.
  if (conflictType === "revelation_conflict" || conflictType === "uncertain") return fail("conflict_unsafe_or_uncertain");
  if (!Array.isArray(record.assessments) || record.assessments.length === 0) return fail(record.assessments === undefined ? "assessments_missing" : "assessments_invalid_or_empty");

  // Budget models sometimes list a candidate twice or skip one. A skipped candidate is simply not
  // used; a candidate listed more than once is used only if EVERY listing says direct and
  // context-safe, with the requirement ids they all agree on. An invented id still refuses.
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const requirementById = new Map(frame.requirements.map((requirement) => [requirement.id, requirement]));
  const verdicts = new Map<string, { ok: boolean; requirementIds: string[]; position: string | null }>();
  const contributions = new Map<string, SourceContribution>();
  const supporting = new Map<string, string[]>();
  const scopeExcluded = new Set<string>();
  for (const item of record.assessments) {
    if (!item || typeof item !== "object") return fail("assessment_not_object");
    const assessment = item as Record<string, unknown>;
    if (options.distinctSelection && (!isString(assessment.distinct_contribution) || !["yes", "no", "unsure"].includes(assessment.distinct_contribution))) return fail("distinct_contribution_invalid");
    if (!isString(assessment.source_id) || !byId.has(assessment.source_id)) return fail(assessment.source_id === undefined ? "source_id_missing" : "source_id_invalid_or_unknown");
    if (!isString(assessment.relevance) || !(["direct", "partial", "context", "mention_only", "unrelated"] as Relevance[]).includes(assessment.relevance as Relevance)) return fail(assessment.relevance === undefined ? "relevance_missing" : "relevance_invalid");
    if (!isString(assessment.context_safe) || !["yes", "no", "unsure"].includes(assessment.context_safe)) return fail(assessment.context_safe === undefined ? "context_decision_missing" : "context_decision_invalid");
    if (!Array.isArray(assessment.supported_requirement_ids)) return fail("requirement_ids_missing");
    const requirementIds = [...new Set(assessment.supported_requirement_ids.filter(isString))];
    if (requirementIds.length !== assessment.supported_requirement_ids.length
      || !requirementIds.every((id) => requirementById.has(id))) return fail("requirement_ids_invalid_or_unknown");
    const direct = assessment.relevance === "direct" || (!!options.requireContributions && assessment.relevance === "partial"
      && (assessment.contribution as SourceContribution | undefined)?.role === "direct");
    let scopeCompatible = true;
    if (options.requireContributions) {
      const c = assessment.contribution as Record<string, unknown> | undefined;
      if (!c || !isString(c.role) || !["direct", "background", "limited_example"].includes(c.role)
        || !isString(c.scope) || !["general", "case_specific"].includes(c.scope) || !Array.isArray(c.conditions)
        || c.conditions.length > 6 || !c.conditions.every(s => typeof s === "string" && s.length > 0 && s.length <= 400)
        || !isString(assessment.scope_matches_question) || !["yes", "no", "unsure"].includes(assessment.scope_matches_question)) return fail("contribution_invalid");
      if (direct && c.role !== "direct") return fail("source_scope_mismatch");
      // An explicit no/unsure about one otherwise well-formed candidate does
      // not invalidate independent evidence elsewhere in the pool. This source
      // remains excluded; no relevance or coverage verdict is promoted.
      if ((direct || ["context", "partial"].includes(assessment.relevance)) && assessment.scope_matches_question !== "yes") {
        scopeCompatible = false;
        scopeExcluded.add(assessment.source_id);
        onFailure?.("source_scope_rejected");
      }
      // The question frame and evidence selector make separate scope decisions. A selector's
      // blanket "yes" cannot turn a narrow case into instructions for a general requested point.
      let limitedExample = false;
      if (direct && c.scope === "case_specific" && requirementIds.some(id => requirementById.get(id)?.scope !== "case_specific")) {
        scopeCompatible = false;
        onFailure?.("source_scope_rejected");
        // Never direct support for a general point, but a relevant, in-scope and context-safe case is
        // kept as a labelled limited example (seen live: every zakat fatwa answered a specific case,
        // so a general question lost all of them). The reviewer still checks it is not generalised.
        if (options.partialPreview && assessment.scope_matches_question === "yes" && assessment.context_safe === "yes") limitedExample = true;
      }
      const contribution = (limitedExample ? { ...c, role: "limited_example" } : c) as SourceContribution;
      const previous = contributions.get(assessment.source_id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(contribution)) return fail("contribution_conflict");
      contributions.set(assessment.source_id, contribution);
      // Context must have an explicit question link and a distinct useful contribution. A
      // keyword match or a selector's contradictory duplicate verdict is never enough.
      if (!direct && ["context", "partial"].includes(assessment.relevance)
        && scopeCompatible && c.role !== "direct" && assessment.context_safe === "yes"
        && assessment.distinct_contribution === "yes"
        && Array.isArray(assessment.related_requirement_ids) && assessment.related_requirement_ids.length > 0
        && assessment.related_requirement_ids.every(id => typeof id === "string" && requirementById.has(id))) {
        supporting.set(assessment.source_id, [...new Set(assessment.related_requirement_ids as string[])]);
      } else if (limitedExample) {
        supporting.set(assessment.source_id, [...new Set(requirementIds)]);
        onFailure?.("case_specific_kept_as_limited_example");
      } else supporting.delete(assessment.source_id);
    }
    if (!direct && requirementIds.length > 0) return fail("non_direct_requirement_assignment");
    const ok = direct && scopeCompatible && assessment.context_safe === "yes" && requirementIds.length > 0;
    let position = typeof assessment.position === "string" && /^[a-z][a-z0-9-]{0,39}$/.test(assessment.position)
      ? assessment.position : null;
    const candidate = byId.get(assessment.source_id)!;
    if (position && candidate.source.kind !== "scholar") {
      if (!options.requireContributions) return fail("position_on_non_scholar");
      // The known source kind is code-owned. This presentation label has no
      // meaning for revelation; leave all substantive assessment fields intact.
      position = null;
      onFailure?.("presentation_position_normalised");
    }
    if (conflictType === "scholar_difference" && ok && candidate.source.kind === "scholar" && !position) return fail("scholar_position_missing");
    const before = verdicts.get(assessment.source_id);
    verdicts.set(
      assessment.source_id,
      before
        ? { ok: before.ok && ok, requirementIds: before.requirementIds.filter((id) => requirementIds.includes(id)),
            position: before.position === position ? position : null }
        : { ok, requirementIds, position },
    );
  }
  const direct: SelectedPassage[] = candidates
    .filter((candidate) => {
      const v = verdicts.get(candidate.id);
      return v?.ok && v.requirementIds.length > 0;
    })
    .map((candidate) => {
      const requirementIds = verdicts.get(candidate.id)!.requirementIds;
      return {
        ...candidate,
        requirementIds,
        ...(contributions.has(candidate.id) ? { contribution: contributions.get(candidate.id)! } : {}),
        facets: [...new Set(requirementIds.map((id) => requirementById.get(id)!.facet))],
      };
    });
  const context: SelectedPassage[] = options.requireContributions ? candidates
    .filter(candidate => supporting.has(candidate.id) && !direct.some(p => p.id === candidate.id)
      && (record.assessments as Record<string, unknown>[]).filter(a => a.source_id === candidate.id).length === 1)
    .map(candidate => ({ ...candidate, requirementIds: [], explanationRequirementIds: supporting.get(candidate.id)!,
      contribution: contributions.get(candidate.id)!, facets: [] })) : [];
  if (options.namedPassages?.some(group => group.some(id => scopeExcluded.has(id)))) return fail("named_passage_scope_unresolved");
  if (direct.length === 0 && (!options.partialPreview || context.length === 0)) return fail(
    record.assessments.some((item) => item.relevance === "direct" && item.context_safe !== "yes")
      ? "no_direct_evidence_unsafe_context" : "no_direct_evidence_with_requirements",
  );
  if (options.requireContributions && !options.partialPreview && (record.status !== "ready" || record.coverage !== "complete")) return fail("direct_requirement_coverage_missing");
  // "conflicting" is acceptable only for a difference among approved scholars; revelation and
  // uncertain conflicts were refused above. Each position is validated below.
  if (options.partialPreview && !["ready", "insufficient", ...(conflictType === "scholar_difference" ? ["conflicting"] : [])].includes(String(record.status))) return fail("partial_status_unsafe");

  // The preview uses explicit contributions instead of filling spare source slots. The legacy
  // chooser remains available for unchanged clients while the new selection is being evaluated.
  const contributionPlan = options.distinctSelection ? parseContributionPlan(record.evidence_plan, [...direct, ...context], frame,
    !!options.partialPreview, record.assessments as Record<string, unknown>[], fail) : undefined;
  if (contributionPlan === null) return null;
  if (contributionPlan) {
    const planned = new Set(contributionPlan.flatMap(u => u.sourceIds));
    for (const group of options.namedPassages ?? []) {
      if (group.every(id => direct.some(p => p.id === id)) && group.some(id => planned.has(id)) && !group.every(id => planned.has(id))) return fail("evidence_plan_named_passage_incomplete");
    }
  }
  const chosen = chooseSealedPackage([...direct, ...context], options.partialPreview ? [] : frame.requirements.map((requirement) => requirement.id),
    { ...options, ...(contributionPlan ? { contributionPlan } : {}) });
  if (!chosen) return fail(frame.requirements.every((requirement) => direct.some((passage) => passage.requirementIds.includes(requirement.id)))
    ? "package_caps_prevent_coverage" : "direct_requirement_coverage_missing");
  const selected = chosen.passages;
  if (!options.partialPreview && !frame.requirements.every((requirement) => selected.some((passage) => passage.requirementIds.includes(requirement.id)))) return fail("sealed_requirement_coverage_missing");

  let scholarDifference: EvidencePackage["scholarDifference"];
  if (conflictType === "scholar_difference") {
    const positions: Record<string, string[]> = {};
    for (const passage of selected) {
      if (passage.source.kind !== "scholar") continue;
      const position = verdicts.get(passage.id)?.position;
      if (!position) return fail("sealed_scholar_position_missing");
      (positions[position] ??= []).push(passage.id);
    }
    // Only one position may survive scope and context checks among the usable quotes. In a preview
    // selection the answer continues, attributed to its named scholars.
    if (Object.keys(positions).length < 2) {
      if (!options.partialPreview) return fail("scholar_difference_positions_missing");
      // Keep the difference marked even with one usable position, so that view is never
      // written or approved as the only view or a consensus (ranking words stay blocked).
      onFailure?.("scholar_difference_single_position");
    }
    scholarDifference = { positions };
  }
  return {
    ...(options.partialPreview ? { partial: true as const } : {}),
    question: {
      language: frame.language,
      questionType: frame.questionType,
      subjects: frame.subjects,
      requirements: requirementMeaning(frame.requirements),
      requiredFacets: frame.requiredFacets,
      qualifiers: frame.qualifiers,
      ...(frame.interpretations?.length ? { interpretations: frame.interpretations } : {}),
    },
    passages: selected,
    ...(contributionPlan ? { contributionPlan: contributionPlan.filter(unit => unit.sourceIds.every(id => selected.some(p => p.id === id))) } : {}),
    cards: chosen.cards,
    ...(scholarDifference ? { scholarDifference } : {}),
  };
}
