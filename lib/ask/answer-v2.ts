// The one rendered answer shape for live and prepared answers (docs/answer-structure-design.md,
// section 4). TypeScript types are not a safety check: every AnswerV2 must pass validateAnswerV2
// before anything renders it. The validator refuses the whole answer on any doubt.
//
// Ids: Quran sources keep their internal id ("Q2:255") everywhere in data; only the view layer
// formats them for display (displaySourceId). Hadith are "HE<n>", scholar quotes "S<uuid>".
// Review labels and origin are assigned by trusted server code (AnswerV2Trust), never read from
// a model or a file.

import type { Locale } from "@/lib/i18n";
import { ATTRIBUTION, isRealVerse } from "@/lib/sources/quran-meta";
import { HADITH_ATTRIBUTION, hadithAllowed, type HadithCollection } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { approvedChannelIds } from "@/lib/sources/youtube-channels";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";
import {
  asciiUmlauts,
  copiesSource,
  fixedExplanationHeadings,
  hasQuotation,
  hasRulingTerm,
  inLanguage,
  isSingleSentence,
  LIMITS,
  sourceKindMismatch,
  type SourceText,
} from "./checks";
import { QURAN_ID, quranCardId } from "./ids";

export type RequirementId = "R1" | "R2" | "R3" | "R4";
export type ReviewLabel = "automatic" | "bayan_reviewed" | "scholar_reviewed";
export type Link = { text: string; url: string };

export type Cited = {
  text: string;
  source_ids: string[]; // 1..3 internal ids, all rendered in this answer
  requirement_id: RequirementId;
};

export type QuranVerseV2 = {
  id: string; // "Q2:255"
  key: string; // "2:255"
  arabic: string; // exactly as Quran Foundation serves it; fetched live, never stored
  translation: string | null;
  translation_name: string | null;
  url: string;
};
export type QuranItem = {
  id: string; // code-assigned card id, "quran-2-183-185"
  source_ids: string[]; // one or more consecutive verse ids
  points: string[];
  cited: boolean;
  verses: QuranVerseV2[];
};
type ItemBase = { id: string; points: string[]; cited: boolean };
export type HadithItem = ItemBase & {
  collection: HadithCollection;
  numbers: { bukhari: number | null; muslim: number | null };
  grade_ar: string;
  attribution_ar: string;
  arabic: string;
  translation: string | null;
  translation_language: "en" | "de" | null;
  url: string;
};
export type ScholarItem = ItemBase & {
  scholar_id: string;
  scholar_name: string;
  title: string | null;
  reference: string;
  arabic: string;
  translation?: string;
  url: string;
};

export const SCHOLAR_VIEW_LABEL_KEYS = ["position_a", "position_b", "position_c"] as const;
export type ScholarView = {
  id: string; // stable code-assigned id
  label_key: (typeof SCHOLAR_VIEW_LABEL_KEYS)[number]; // fixed localized site text, never AI text
  sentences: Cited[]; // 1..2, citing only this view's quotes
  scholars: ScholarItem[]; // 1..2 unique scholars
};

export type AnswerV2 = {
  version: 2;
  language: Locale;
  origin: "live" | "prepared";
  review: ReviewLabel;
  simple_answer: { sentences: Cited[]; list?: Cited[] };
  quran: QuranItem[];
  hadith: HadithItem[];
  scholars: ScholarItem[];
  videos: VideoSuggestion[];
  view_handling?:
    | { mode: "reviewed_main"; decision_id: string; other_views: ScholarView[] }
    | { mode: "side_by_side"; views: ScholarView[] };
  more_explanation?: { heading: string; sentences: Cited[] }[];
  limit_note?: string;
  attribution: { quran?: Link; hadith?: Link };
  provenance: { model: string; verifier: string } | { prepared_version: string; approval_hash: string };
};

export const ANSWER_V2_LIMITS = {
  simpleSentences: 4,
  listMin: 2,
  listMax: 8,
  listItemLength: 160,
  quranCards: 3,
  versesPerCard: 8,
  hadith: 2,
  scholars: 2,
  videos: 2,
  moreSections: 2,
  otherViews: 2,
  sideBySideViews: 3,
  viewSentences: 2,
  viewScholars: 2,
  maxCitedItems: 12, // AI-written cited sentences and list items in the whole answer
  headingLength: 80,
  limitNoteLength: 300,
} as const;

/** What only trusted server code knows. Anything the answer claims about itself must match. */
export type AnswerV2Trust = {
  origin: "live" | "prepared";
  review: ReviewLabel;
  requirementIds?: readonly string[]; // when known: every point must be covered by the simple answer or list
  listAllowed?: boolean; // code decides from the checklist facets; undefined = not known here
  limitNoteAllowed?: boolean;
  namedPassages?: readonly (readonly string[])[]; // complete passages the visitor named, e.g. al-Fatiha
};

export type AnswerV2Result = { ok: true; answer: AnswerV2 } | { ok: false; reason: string };

const HADITH_ID = /^HE(\d+)$/;
const SCHOLAR_ID = /^S[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REQUIREMENT_ID = /^R[1-4]$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const HADITH_URL = /^https:\/\/hadeethenc\.com\/(?:ar|en|de)\/browse\/hadith\/(\d+)$/;
const LOCALES: readonly string[] = ["ar", "en", "de"];

export { displaySourceId, quranCardId } from "./ids";

/** Number of AI-written cited items (the design's budget of 12). */
export function countCitedItems(answer: Pick<AnswerV2, "simple_answer" | "more_explanation" | "view_handling">): number {
  const views = !answer.view_handling ? [] : answer.view_handling.mode === "reviewed_main"
    ? answer.view_handling.other_views : answer.view_handling.views;
  return answer.simple_answer.sentences.length + (answer.simple_answer.list?.length ?? 0)
    + (answer.more_explanation ?? []).reduce((sum, section) => sum + section.sentences.length, 0)
    + views.reduce((sum, view) => sum + view.sentences.length, 0);
}

class Invalid extends Error {}
const fail = (reason: string): never => {
  throw new Invalid(reason);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function record(value: unknown, path: string, required: string[], optional: string[] = []): Record<string, unknown> {
  if (!isRecord(value)) return fail(`not_object:${path}`);
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) fail(`unknown_field:${path}.${key}`);
  }
  for (const key of required) if (!(key in value)) fail(`missing_field:${path}.${key}`);
  return value;
}

function array(value: unknown, path: string, min: number, max: number): unknown[] {
  if (!Array.isArray(value)) return fail(`not_array:${path}`);
  if (value.length < min || value.length > max) fail(`count:${path}`);
  return value;
}

function text(value: unknown, path: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || value.length > max) return fail(`text:${path}`);
  return value;
}

// Source fields are shown exactly as served, so surrounding whitespace is allowed there; only
// AI-written text must be trimmed.
function sourceText(value: unknown, path: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) return fail(`text:${path}`);
  return value;
}

const nullableSourceText = (value: unknown, path: string, max: number): string | null =>
  value === null ? null : sourceText(value, path, max);

function points(value: unknown, path: string, trust: AnswerV2Trust): string[] {
  const ids = array(value, path, trust.requirementIds ? 1 : 0, 4);
  if (!ids.every((id): id is string => typeof id === "string" && REQUIREMENT_ID.test(id))) fail(`points:${path}`);
  if (new Set(ids).size !== ids.length) fail(`points:${path}`);
  if (trust.requirementIds && !ids.every((id) => trust.requirementIds!.includes(id as string))) fail(`points:${path}`);
  return ids as string[];
}

// ---------- sources ----------

function quranCard(value: unknown, path: string, language: Locale, trust: AnswerV2Trust): QuranItem {
  const card = record(value, path, ["id", "source_ids", "points", "cited", "verses"]);
  const ids = array(card.source_ids, `${path}.source_ids`, 1, ANSWER_V2_LIMITS.versesPerCard);
  const verses = array(card.verses, `${path}.verses`, ids.length, ids.length);
  let surah = 0;
  let previous = 0;
  ids.forEach((id, index) => {
    const match = typeof id === "string" ? id.match(QURAN_ID) : null;
    if (!match) return fail(`quran_id:${path}`);
    const [s, v] = [Number(match[1]), Number(match[2])];
    if (!isRealVerse(s, v)) fail(`quran_id:${path}`);
    // One card is one passage: the same surah, consecutive verses, in order.
    if (index > 0 && (s !== surah || v !== previous + 1)) fail(`quran_not_consecutive:${path}`);
    [surah, previous] = [s, v];
    const verse = record(verses[index], `${path}.verses[${index}]`, ["id", "key", "arabic", "translation", "translation_name", "url"]);
    if (verse.id !== id || verse.key !== `${s}:${v}` || verse.url !== `https://quran.com/${s}/${v}`) fail(`quran_verse:${path}`);
    sourceText(verse.arabic, `${path}.arabic`, 20_000);
    const translation = nullableSourceText(verse.translation, `${path}.translation`, 20_000);
    const name = nullableSourceText(verse.translation_name, `${path}.translation_name`, 120);
    if (language === "ar" && translation !== null) fail(`quran_translation:${path}`);
    if ((translation === null) !== (name === null)) fail(`quran_translation:${path}`);
  });
  if (card.id !== quranCardId(ids as string[])) fail(`quran_card_id:${path}`);
  if (card.cited !== true) fail(`uncited_item:${path}`);
  points(card.points, `${path}.points`, trust);
  return card as QuranItem;
}

function hadithItem(value: unknown, path: string, language: Locale, trust: AnswerV2Trust): HadithItem {
  const h = record(value, path, ["id", "points", "cited", "collection", "numbers", "grade_ar", "attribution_ar", "arabic",
    "translation", "translation_language", "url"]);
  const id = typeof h.id === "string" ? h.id.match(HADITH_ID) : null;
  if (!id) return fail(`hadith_id:${path}`);
  if (!["bukhari", "muslim", "agreed"].includes(h.collection as string)) fail(`hadith_collection:${path}`);
  const numbers = record(h.numbers, `${path}.numbers`, ["bukhari", "muslim"]);
  for (const n of [numbers.bukhari, numbers.muslim]) {
    if (n !== null && !(Number.isInteger(n) && (n as number) > 0)) fail(`hadith_numbers:${path}`);
  }
  const url = typeof h.url === "string" ? h.url.match(HADITH_URL) : null;
  if (!url || url[1] !== id[1]) fail(`hadith_url:${path}`);
  const translation = nullableSourceText(h.translation, `${path}.translation`, 20_000);
  const translationLanguage = h.translation_language;
  if (translation === null ? translationLanguage !== null : !["en", "de"].includes(translationLanguage as string)) fail(`hadith_translation:${path}`);
  if (language === "ar" && translation !== null) fail(`hadith_translation:${path}`);
  if (language === "en" && translation !== null && translationLanguage !== "en") fail(`hadith_translation:${path}`);
  // Same Sahihayn and grade rule the pipeline applies before the selector sees a hadith.
  const allowed = hadithAllowed({
    id: h.id as string,
    collection: h.collection as HadithCollection,
    numbers: numbers as HadithItem["numbers"],
    attributionAr: sourceText(h.attribution_ar, `${path}.attribution_ar`, 500),
    gradeAr: sourceText(h.grade_ar, `${path}.grade_ar`, 200),
    arabic: sourceText(h.arabic, `${path}.arabic`, 20_000),
    translations: { en: null, de: null },
    url: h.url as string,
  });
  if (!allowed) fail(`hadith_rules:${path}`);
  if (h.cited !== true) fail(`uncited_item:${path}`);
  points(h.points, `${path}.points`, trust);
  return h as HadithItem;
}

function scholarItem(value: unknown, path: string, trust: AnswerV2Trust): ScholarItem {
  const s = record(value, path, ["id", "points", "cited", "scholar_id", "scholar_name", "title", "reference", "arabic", "url"]);
  if (typeof s.id !== "string" || !SCHOLAR_ID.test(s.id)) fail(`scholar_id:${path}`);
  const name = sourceText(s.scholar_name, `${path}.scholar_name`, 120);
  const allowed = scholarQuoteAllowed({
    id: s.id as string,
    scholarId: sourceText(s.scholar_id, `${path}.scholar_id`, 60),
    scholarName: { ar: name, en: name, de: name },
    title: nullableSourceText(s.title, `${path}.title`, 1_000),
    reference: sourceText(s.reference, `${path}.reference`, 500),
    arabic: sourceText(s.arabic, `${path}.arabic`, 2_000),
    url: sourceText(s.url, `${path}.url`, 1_000),
  });
  if (!allowed) fail(`scholar_rules:${path}`);
  if (s.cited !== true) fail(`uncited_item:${path}`);
  points(s.points, `${path}.points`, trust);
  return s as ScholarItem;
}

function video(value: unknown, path: string): VideoSuggestion {
  const v = record(value, path, ["youtubeId", "channelId", "title", "minutes", "language"]);
  if (typeof v.youtubeId !== "string" || !YOUTUBE_ID.test(v.youtubeId)) fail(`video_id:${path}`);
  if (typeof v.channelId !== "string" || !approvedChannelIds.has(v.channelId)) fail(`video_channel:${path}`);
  sourceText(v.title, `${path}.title`, 300);
  if (!Number.isInteger(v.minutes) || (v.minutes as number) < 1 || (v.minutes as number) > 40) fail(`video_minutes:${path}`);
  if (!LOCALES.includes(v.language as string)) fail(`video_language:${path}`);
  return v as VideoSuggestion;
}

/** Videos never block an answer: callers drop any video that would fail validation. */
export function isValidVideo(value: unknown): boolean {
  try {
    video(value, "video");
    return true;
  } catch {
    return false;
  }
}

// ---------- AI-written text ----------

function cited(value: unknown, path: string, language: Locale, maxLength: number): Cited {
  const c = record(value, path, ["text", "source_ids", "requirement_id"]);
  const t = text(c.text, `${path}.text`, maxLength);
  if (!inLanguage(t, language) || (language === "de" && asciiUmlauts(t))) fail(`wrong_language:${path}`);
  if (!isSingleSentence(t)) fail(`multiple_sentences:${path}`);
  if (hasQuotation(t)) fail(`quotation:${path}`);
  const ids = array(c.source_ids, `${path}.source_ids`, 1, LIMITS.maxRefsPerClaim);
  if (!ids.every((id): id is string => typeof id === "string") || new Set(ids).size !== ids.length) fail(`source_ids:${path}`);
  if (typeof c.requirement_id !== "string" || !REQUIREMENT_ID.test(c.requirement_id)) fail(`requirement_id:${path}`);
  if (sourceKindMismatch(t, ids as string[])) fail(`source_attribution:${path}`);
  return c as Cited;
}

function heading(value: unknown, path: string, language: Locale, trust: AnswerV2Trust): string {
  const h = text(value, path, ANSWER_V2_LIMITS.headingLength);
  const fixed = (fixedExplanationHeadings(language) as readonly string[]).includes(h);
  if ((!fixed && trust.origin === "live") || !inLanguage(h, language) || hasQuotation(h) || hasRulingTerm(h) || !isSingleSentence(h) || /\n/.test(h)) fail(`heading:${path}`);
  return h;
}

function views(value: unknown, path: string, min: number, max: number, language: Locale, trust: AnswerV2Trust): ScholarView[] {
  const list = array(value, path, min, max);
  return list.map((item, index) => {
    const at = `${path}[${index}]`;
    const view = record(item, at, ["id", "label_key", "sentences", "scholars"]);
    if (typeof view.id !== "string" || !/^[a-z][a-z0-9-]{0,39}$/.test(view.id)) fail(`view_id:${at}`);
    if (!(SCHOLAR_VIEW_LABEL_KEYS as readonly string[]).includes(view.label_key as string)) fail(`view_label:${at}`);
    const scholars = array(view.scholars, `${at}.scholars`, 1, ANSWER_V2_LIMITS.viewScholars)
      .map((s, i) => scholarItem(s, `${at}.scholars[${i}]`, trust));
    // Unique scholars, never a count of quotes by one scholar.
    if (new Set(scholars.map((s) => s.scholar_id)).size !== scholars.length) fail(`view_scholars:${at}`);
    const sentences = array(view.sentences, `${at}.sentences`, 1, ANSWER_V2_LIMITS.viewSentences)
      .map((s, i) => cited(s, `${at}.sentences[${i}]`, language, LIMITS.maxClaimLength));
    return { ...(view as ScholarView), scholars, sentences };
  });
}

// ---------- the whole answer ----------

/** Strict runtime check before rendering. Any unknown field, id, count, label or citation refuses. */
export function validateAnswerV2(raw: unknown, trust: AnswerV2Trust): AnswerV2Result {
  try {
    return { ok: true, answer: validate(raw, trust) };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, reason: err.message };
    return { ok: false, reason: "invalid" };
  }
}

function validate(raw: unknown, trust: AnswerV2Trust): AnswerV2 {
  const a = record(raw, "answer", ["version", "language", "origin", "review", "simple_answer", "quran", "hadith", "scholars",
    "videos", "attribution", "provenance"], ["view_handling", "more_explanation", "limit_note"]);
  if (a.version !== 2) fail("version");
  if (!LOCALES.includes(a.language as string)) fail("language");
  const language = a.language as Locale;

  // Origin and review labels come from trusted server code only; a model or file cannot raise them.
  if (a.origin !== trust.origin || a.review !== trust.review) fail("untrusted_label");
  if (trust.origin === "live" && trust.review !== "automatic") fail("untrusted_label");
  if (trust.origin === "prepared" && trust.review === "automatic") fail("untrusted_label");
  if (trust.origin === "live") {
    const p = record(a.provenance, "provenance", ["model", "verifier"]);
    text(p.model, "provenance.model", 120);
    text(p.verifier, "provenance.verifier", 120);
  } else {
    const p = record(a.provenance, "provenance", ["prepared_version", "approval_hash"]);
    if (typeof p.prepared_version !== "string" || !/^[A-Za-z0-9._-]{1,40}$/.test(p.prepared_version)) fail("provenance");
    if (typeof p.approval_hash !== "string" || !/^[a-f0-9]{64}$/.test(p.approval_hash)) fail("provenance");
  }

  // Sources first, so every citation can be resolved against what is actually rendered.
  const quran = array(a.quran, "quran", 0, ANSWER_V2_LIMITS.quranCards).map((c, i) => quranCard(c, `quran[${i}]`, language, trust));
  const hadith = array(a.hadith, "hadith", 0, ANSWER_V2_LIMITS.hadith).map((h, i) => hadithItem(h, `hadith[${i}]`, language, trust));
  const scholars = array(a.scholars, "scholars", 0, ANSWER_V2_LIMITS.scholars).map((s, i) => scholarItem(s, `scholars[${i}]`, trust));
  const videos = array(a.videos, "videos", 0, ANSWER_V2_LIMITS.videos).map((v, i) => video(v, `videos[${i}]`));
  if (new Set(videos.map((v) => v.youtubeId)).size !== videos.length) fail("duplicate_video");

  let viewList: ScholarView[] = [];
  if (a.view_handling !== undefined) {
    const mode = isRecord(a.view_handling) ? a.view_handling.mode : undefined;
    if (mode === "reviewed_main") {
      const v = record(a.view_handling, "view_handling", ["mode", "decision_id", "other_views"]);
      if (typeof v.decision_id !== "string" || !/^[a-z0-9][a-z0-9-]{0,59}$/.test(v.decision_id)) fail("view_decision");
      viewList = views(v.other_views, "view_handling.other_views", 1, ANSWER_V2_LIMITS.otherViews, language, trust);
    } else if (mode === "side_by_side") {
      const v = record(a.view_handling, "view_handling", ["mode", "views"]);
      viewList = views(v.views, "view_handling.views", 2, ANSWER_V2_LIMITS.sideBySideViews, language, trust);
      // Without a reviewed main view there is no winner: no scholar quote may sit above the views.
      if (scholars.length > 0) fail("side_by_side_main_scholar");
    } else {
      fail("view_mode");
    }
    if (new Set(viewList.map((view) => view.id)).size !== viewList.length) fail("duplicate_view");
  }

  // Every rendered id is unique across the whole answer, and one fatwa page appears once.
  const verseIds = quran.flatMap((card) => card.source_ids);
  const viewScholars = viewList.flatMap((view) => view.scholars);
  const allIds = [...verseIds, ...hadith.map((h) => h.id), ...scholars.map((s) => s.id), ...viewScholars.map((s) => s.id)];
  if (new Set(allIds).size !== allIds.length) fail("duplicate_source");
  const urls = [...scholars, ...viewScholars].map((s) => s.url);
  if (new Set(urls).size !== urls.length) fail("duplicate_fatwa_url");
  if (new Set(quran.map((card) => card.id)).size !== quran.length) fail("duplicate_quran_card");

  // AI-written text.
  const simple = record(a.simple_answer, "simple_answer", ["sentences"], ["list"]);
  const sentences = array(simple.sentences, "simple_answer.sentences", 1, ANSWER_V2_LIMITS.simpleSentences)
    .map((s, i) => cited(s, `simple_answer.sentences[${i}]`, language, LIMITS.maxClaimLength));
  let list: Cited[] = [];
  if (simple.list !== undefined) {
    if (trust.listAllowed === false) fail("list_not_allowed");
    list = array(simple.list, "simple_answer.list", ANSWER_V2_LIMITS.listMin, ANSWER_V2_LIMITS.listMax)
      .map((s, i) => cited(s, `simple_answer.list[${i}]`, language, ANSWER_V2_LIMITS.listItemLength));
  }
  let more: { heading: string; sentences: Cited[] }[] = [];
  if (a.more_explanation !== undefined) {
    more = array(a.more_explanation, "more_explanation", 1, ANSWER_V2_LIMITS.moreSections).map((section, i) => {
      const s = record(section, `more_explanation[${i}]`, ["heading", "sentences"]);
      return {
        heading: heading(s.heading, `more_explanation[${i}].heading`, language, trust),
        sentences: array(s.sentences, `more_explanation[${i}].sentences`, 1, ANSWER_V2_LIMITS.maxCitedItems)
          .map((c, j) => cited(c, `more_explanation[${i}].sentences[${j}]`, language, LIMITS.maxClaimLength)),
      };
    });
  }
  const mainText = [...sentences, ...list, ...more.flatMap((section) => section.sentences)];
  const total = mainText.length + viewList.reduce((sum, view) => sum + view.sentences.length, 0);
  if (total > ANSWER_V2_LIMITS.maxCitedItems) fail("cited_item_budget");

  // Citations resolve only to rendered sources. The main answer cites the Quran cards, hadith and
  // top-level quotes; a view sentence cites only its own view's quotes. Videos are never citable.
  const videoIds = new Set(videos.map((v) => v.youtubeId));
  const mainIds = new Set([...verseIds, ...hadith.map((h) => h.id), ...scholars.map((s) => s.id)]);
  const sourcePoints = new Map<string, Set<string>>([
    ...quran.flatMap((card) => card.source_ids.map((id) => [id, new Set(card.points)] as const)),
    ...hadith.map((item) => [item.id, new Set(item.points)] as const),
    ...scholars.map((item) => [item.id, new Set(item.points)] as const),
    ...viewScholars.map((item) => [item.id, new Set(item.points)] as const),
  ]);
  const citedIds = new Set<string>();
  const resolve = (item: Cited, allowed: Set<string>, path: string) => {
    for (const id of item.source_ids) {
      if (videoIds.has(id)) fail(`video_citation:${path}`);
      if (!QURAN_ID.test(id) && !HADITH_ID.test(id) && !SCHOLAR_ID.test(id)) fail(`invalid_source_id:${path}`);
      if (!allowed.has(id)) fail(`missing_cited_source:${path}`);
      citedIds.add(id);
    }
    // A valid id is not enough: at least one cited source must have been selected as direct
    // evidence for the checklist point this sentence claims to answer.
    if (!item.source_ids.some((id) => sourcePoints.get(id)?.has(item.requirement_id))) {
      fail(`unsupported_requirement:${path}`);
    }
  };
  mainText.forEach((item, i) => resolve(item, mainIds, `main[${i}]`));
  const viewCited = new Set<string>();
  for (const view of viewList) {
    const own = new Set(view.scholars.map((s) => s.id));
    view.sentences.forEach((item, i) => resolve(item, own, `view.${view.id}[${i}]`));
    view.sentences.forEach((item) => item.source_ids.forEach((id) => viewCited.add(id)));
  }

  // Uncited items are hidden, except a complete passage the visitor named, shown as one card.
  for (const card of quran) {
    const citedVerses = card.source_ids.filter((id) => citedIds.has(id));
    if (citedVerses.length === 0) fail(`uncited_item:${card.id}`);
    if (citedVerses.length < card.source_ids.length) {
      const named = (trust.namedPassages ?? []).some((passage) => passage.length === card.source_ids.length
        && passage.every((id, index) => card.source_ids[index] === id));
      if (!named) fail(`uncited_item:${card.id}`);
    }
  }
  for (const item of [...hadith, ...scholars]) if (!citedIds.has(item.id)) fail(`uncited_item:${item.id}`);
  for (const item of viewScholars) if (!viewCited.has(item.id)) fail(`uncited_item:${item.id}`);

  // Checklist: when the server knows the points, each one is answered in the simple answer or list.
  if (trust.requirementIds) {
    const known = new Set(trust.requirementIds);
    for (const item of [...mainText, ...viewList.flatMap((view) => view.sentences)]) {
      if (!known.has(item.requirement_id)) fail("unknown_requirement");
    }
    const direct = new Set<string>([...sentences, ...list].map((item) => item.requirement_id));
    if (!trust.requirementIds.every((id) => direct.has(id))) fail("requirement_not_in_simple_answer");
  }

  // No AI-written text may retype a rendered source, in Arabic or in a shown translation.
  const shownSources: SourceText[] = [
    ...quran.flatMap((card) => card.verses.map((v): SourceText => ({ id: v.id, kind: "quran", arabic: v.arabic,
      translations: v.translation && language !== "ar" ? { [language]: v.translation } : {} }))),
    ...hadith.map((h): SourceText => ({ id: h.id, kind: "hadith", arabic: h.arabic,
      translations: h.translation && h.translation_language ? { [h.translation_language]: h.translation } : {} })),
    ...[...scholars, ...viewScholars].map((s): SourceText => ({ id: s.id, kind: "scholar", arabic: s.arabic, translations: {} })),
  ];
  for (const item of [...mainText, ...viewList.flatMap((view) => view.sentences)]) {
    if (copiesSource(item.text, shownSources)) fail("copied_source");
  }

  // The limit note: one plain sentence, no citation, quotation or ruling, only where allowed.
  if (a.limit_note !== undefined) {
    if (trust.limitNoteAllowed === false) fail("limit_note_not_allowed");
    const note = text(a.limit_note, "limit_note", ANSWER_V2_LIMITS.limitNoteLength);
    if (!inLanguage(note, language) || !isSingleSentence(note) || hasQuotation(note) || hasRulingTerm(note)
      || /\bQ?\d{1,3}:\d{1,3}\b|\bHE\d+\b|\bS[0-9a-f-]{36}\b/.test(note) || copiesSource(note, shownSources)) fail("limit_note");
  }

  // Attribution links appear exactly for the source kinds shown.
  const attribution = record(a.attribution, "attribution", [], ["quran", "hadith"]);
  const sameLink = (value: unknown, expected: Link) => {
    const link = record(value, "attribution.link", ["text", "url"]);
    return link.text === expected.text && link.url === expected.url;
  };
  if ((quran.length > 0) !== ("quran" in attribution) || (quran.length > 0 && !sameLink(attribution.quran, ATTRIBUTION))) fail("attribution");
  if ((hadith.length > 0) !== ("hadith" in attribution) || (hadith.length > 0 && !sameLink(attribution.hadith, HADITH_ATTRIBUTION))) fail("attribution");

  return raw as AnswerV2;
}
