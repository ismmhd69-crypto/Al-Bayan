import type { Locale } from "@/lib/i18n";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";

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
};

export type QuestionFrame = {
  language: Locale;
  kind: "question" | "personal" | "greeting" | "off_topic" | "harmful";
  questionType: QuestionType;
  subjects: string[];
  requirements: AnswerRequirement[];
  requiredFacets: AnswerFacet[];
  qualifiers: string[];
  searchQueries: Partial<Record<Locale, string[]>>;
};

const LOCALES = ["ar", "en", "de"] as const;
const KINDS = ["question", "personal", "greeting", "off_topic", "harmful"] as const;
const SAFE_PHRASE = /^[\p{L}\p{M}][\p{L}\p{M}' -]{0,79}$/u;
const SAFE_REQUIREMENT = /^(?=.*[A-Za-z])[A-Za-z\d%'(),. -]{1,120}$/;
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
    parsed.push({ text, facet: point.facet as AnswerFacet });
  }
  return parsed.map((point, index) => ({ id: `R${index + 1}`, ...point }));
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

  return {
    language: record.language as Locale,
    kind,
    questionType: record.question_type as QuestionType,
    subjects,
    requirements: answerRequirements,
    requiredFacets,
    qualifiers,
    searchQueries,
  };
}

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
  if (/شروط|conditions|voraussetzungen/i.test(question) && goldZakat && !has("conditions")) return "conditions_missing";
  if (/\bwhy\b|لماذا|\bwarum\b/i.test(question) && !has("reason") && !has("response")) return "reason_missing";
  if (/\bhow many\b|كم عدد|\bwie viele\b/i.test(question) && !has("quantity")) return "quantity_missing";
  if (/\bhow\b.{0,35}\b(repent|convert|become muslim)\b|كيف.{0,30}(أتوب|التوبة|أسلم)|\bwas muss ich tun, um muslim zu werden\b|wie.{0,35}(muslim werden|bereue)/i.test(question) && !has("steps")) return "steps_missing";
  if (/\b(if god is merciful|if allah is merciful)\b|إذا كان الله رحيما/i.test(question) && /hell|جهنم|النار/i.test(question) && !has("response")) return "objection_response_missing";
  if (goldZakat && amountDue && /\bdefinition\b/.test(wording) && !/ما هي الزكاة|what is zakat/i.test(question)) return "unasked_definition";
  return null;
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
};

export type SelectedPassage = PassageForSelection & { requirementIds: string[]; facets: AnswerFacet[] };

export type EvidencePackage = {
  question: Pick<QuestionFrame, "language" | "questionType" | "subjects" | "requirements" | "requiredFacets" | "qualifiers">;
  passages: SelectedPassage[];
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
): EvidencePackage | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (!["ready", "insufficient", "ambiguous", "conflicting"].includes(String(record.status))) return null;
  if (!["complete", "incomplete"].includes(String(record.coverage))) return null;
  // Status and coverage are fallible summaries. Code derives coverage from the source-by-source
  // assessments below. A reported conflict still refuses because it can involve any candidate.
  if (record.conflict !== "none") return null;
  if (!Array.isArray(record.assessments) || record.assessments.length === 0) return null;

  // Budget models sometimes list a candidate twice or skip one. A skipped candidate is simply not
  // used; a candidate listed more than once is used only if EVERY listing says direct and
  // context-safe, with the requirement ids they all agree on. An invented id still refuses.
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const requirementById = new Map(frame.requirements.map((requirement) => [requirement.id, requirement]));
  const verdicts = new Map<string, { ok: boolean; requirementIds: string[] }>();
  for (const item of record.assessments) {
    if (!item || typeof item !== "object") return null;
    const assessment = item as Record<string, unknown>;
    if (!isString(assessment.source_id) || !byId.has(assessment.source_id)) return null;
    if (!isString(assessment.relevance) || !(["direct", "partial", "context", "mention_only", "unrelated"] as Relevance[]).includes(assessment.relevance as Relevance)) return null;
    if (!isString(assessment.context_safe) || !["yes", "no", "unsure"].includes(assessment.context_safe)) return null;
    if (!Array.isArray(assessment.supported_requirement_ids)) return null;
    const requirementIds = [...new Set(assessment.supported_requirement_ids.filter(isString))];
    if (requirementIds.length !== assessment.supported_requirement_ids.length
      || !requirementIds.every((id) => requirementById.has(id))) return null;
    const direct = assessment.relevance === "direct";
    if (!direct && requirementIds.length > 0) return null;
    const ok = direct && assessment.context_safe === "yes" && requirementIds.length > 0;
    const before = verdicts.get(assessment.source_id);
    verdicts.set(
      assessment.source_id,
      before
        ? { ok: before.ok && ok, requirementIds: before.requirementIds.filter((id) => requirementIds.includes(id)) }
        : { ok, requirementIds },
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
        facets: [...new Set(requirementIds.map((id) => requirementById.get(id)!.facet))],
      };
    });
  if (direct.length === 0) return null;

  // Build a bounded package without throwing away a valid large set. Cover every requirement first,
  // then retain direct scholar evidence, then fill the remaining places in retrieval order.
  const selected: SelectedPassage[] = [];
  const selectedIds = new Set<string>();
  const add = (passage: SelectedPassage) => {
    if (selected.length >= 8 || selectedIds.has(passage.id)) return;
    selected.push(passage);
    selectedIds.add(passage.id);
  };
  const requiredIds = frame.requirements.map((requirement) => requirement.id);
  let minimumCover: SelectedPassage[] | null = null;
  const findCover = (start: number, wanted: number, picked: SelectedPassage[]) => {
    if (minimumCover) return;
    if (picked.length === wanted) {
      const covered = new Set(picked.flatMap((passage) => passage.requirementIds));
      if (requiredIds.every((id) => covered.has(id))) minimumCover = [...picked];
      return;
    }
    for (let index = start; index <= direct.length - (wanted - picked.length); index += 1) {
      picked.push(direct[index]);
      findCover(index + 1, wanted, picked);
      picked.pop();
      if (minimumCover) return;
    }
  };
  for (let size = 1; size <= Math.min(8, direct.length) && !minimumCover; size += 1) findCover(0, size, []);
  const cover = minimumCover as SelectedPassage[] | null;
  if (!cover) return null;
  for (const passage of cover) add(passage);
  for (const passage of direct) if (passage.source.kind === "scholar") add(passage);
  for (const passage of direct) add(passage);
  if (!frame.requirements.every((requirement) => selected.some((passage) => passage.requirementIds.includes(requirement.id)))) return null;

  return {
    question: {
      language: frame.language,
      questionType: frame.questionType,
      subjects: frame.subjects,
      requirements: frame.requirements,
      requiredFacets: frame.requiredFacets,
      qualifiers: frame.qualifiers,
    },
    passages: selected,
  };
}
