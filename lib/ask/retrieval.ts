import type { Locale } from "@/lib/i18n";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";

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
  "general",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type AnswerFacet = (typeof ANSWER_FACETS)[number];

export type QuestionFrame = {
  language: Locale;
  kind: "question" | "personal" | "greeting" | "off_topic" | "harmful";
  questionType: QuestionType;
  subjects: string[];
  requiredFacets: AnswerFacet[];
  qualifiers: string[];
  searchQueries: Partial<Record<Locale, string[]>>;
};

const LOCALES = ["ar", "en", "de"] as const;
const KINDS = ["question", "personal", "greeting", "off_topic", "harmful"] as const;
const SAFE_PHRASE = /^[\p{L}\p{M}][\p{L}\p{M}' -]{0,79}$/u;
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
      .map((item) => item.trim().replace(/\s+/g, " "))
      .filter((item) => SAFE_PHRASE.test(item) && !INSTRUCTION_WORDS.test(item) && item.split(" ").length <= maxWords),
  )].slice(0, maxItems);
}

/**
 * Validates the AI's question analysis. Only bounded labels and filtered short phrases survive;
 * the raw visitor text is never forwarded to retrieval, drafting or screening.
 */
export function parseQuestionFrame(raw: unknown): QuestionFrame | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (!isString(record.language) || !(LOCALES as readonly string[]).includes(record.language)) return null;
  if (!isString(record.kind) || !(KINDS as readonly string[]).includes(record.kind)) return null;
  if (!isString(record.question_type) || !(QUESTION_TYPES as readonly string[]).includes(record.question_type)) return null;

  const subjects = phrases(record.subjects, 5, 4);
  const qualifiers = phrases(record.qualifiers, 5, 5);
  const requiredFacets = Array.isArray(record.required_facets)
    ? [...new Set(record.required_facets.filter(isString))]
        .filter((facet): facet is AnswerFacet => (ANSWER_FACETS as readonly string[]).includes(facet))
        .slice(0, 4)
    : [];
  if (!Array.isArray(record.required_facets) || requiredFacets.length !== record.required_facets.length) return null;
  const kind = record.kind as QuestionFrame["kind"];
  if ((kind === "question" || kind === "personal") && (subjects.length === 0 || requiredFacets.length === 0)) return null;

  const searchQueries = {
    en: phrases(record.search_queries_en, 6, 6),
    de: phrases(record.search_queries_de, 6, 6),
    ar: phrases(record.search_queries_ar, 6, 6),
  };
  if (kind === "question" && Object.values(searchQueries).every((list) => list.length === 0)) return null;

  return {
    language: record.language as Locale,
    kind,
    questionType: record.question_type as QuestionType,
    subjects,
    requiredFacets,
    qualifiers,
    searchQueries,
  };
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

// A candidate source: a Quran verse or a hadith (Sahih al-Bukhari / Sahih Muslim only).
export type Source = { kind: "quran"; verse: Verse } | { kind: "hadith"; hadith: Hadith };

export type PassageForSelection = {
  id: string; // "Q2:255" for verses, "HE4196" for hadith
  source: Source;
  context: Verse[]; // neighbouring verses; empty for hadith, which stand on their own
};

export type SelectedPassage = PassageForSelection & { facets: AnswerFacet[] };

export type EvidencePackage = {
  question: Pick<QuestionFrame, "language" | "questionType" | "subjects" | "requiredFacets" | "qualifiers">;
  passages: SelectedPassage[];
};

type Relevance = "direct" | "partial" | "context" | "mention_only" | "unrelated";

/**
 * Turns the independent selector's output into a sealed package. Code, not the writer, enforces
 * that every requested facet has direct, context-safe evidence.
 */
export function parseEvidencePackage(
  raw: unknown,
  frame: QuestionFrame,
  candidates: PassageForSelection[],
): EvidencePackage | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.status !== "ready" || record.coverage !== "complete" || record.conflict !== "none") return null;
  if (!Array.isArray(record.assessments) || record.assessments.length !== candidates.length) return null;

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const seen = new Set<string>();
  const selected: SelectedPassage[] = [];
  for (const item of record.assessments) {
    if (!item || typeof item !== "object") return null;
    const assessment = item as Record<string, unknown>;
    if (!isString(assessment.source_id) || !byId.has(assessment.source_id) || seen.has(assessment.source_id)) return null;
    if (!isString(assessment.relevance) || !(["direct", "partial", "context", "mention_only", "unrelated"] as Relevance[]).includes(assessment.relevance as Relevance)) return null;
    if (!isString(assessment.context_safe) || !["yes", "no", "unsure"].includes(assessment.context_safe)) return null;
    if (!Array.isArray(assessment.supported_facets)) return null;
    const facets = [...new Set(assessment.supported_facets.filter(isString))]
      .filter((facet): facet is AnswerFacet => frame.requiredFacets.includes(facet as AnswerFacet));
    if (facets.length !== assessment.supported_facets.length) return null;
    seen.add(assessment.source_id);
    if (assessment.relevance === "direct" && assessment.context_safe === "yes" && facets.length > 0) {
      selected.push({ ...byId.get(assessment.source_id)!, facets });
    }
  }
  if (seen.size !== candidates.length || selected.length === 0 || selected.length > 8) return null;
  if (!frame.requiredFacets.every((facet) => selected.some((passage) => passage.facets.includes(facet)))) return null;

  return {
    question: {
      language: frame.language,
      questionType: frame.questionType,
      subjects: frame.subjects,
      requiredFacets: frame.requiredFacets,
      qualifiers: frame.qualifiers,
    },
    passages: selected,
  };
}
