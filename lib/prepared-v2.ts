import "server-only";

import { createHash } from "node:crypto";
import type { Locale } from "@/lib/i18n";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { HADITH_ATTRIBUTION } from "@/lib/sources/hadith-rules";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";
import { toEvidence } from "./ask/core";
import { consecutiveRuns, quranCardId } from "./ask/ids";
import {
  ANSWER_V2_LIMITS,
  isValidVideo,
  validateAnswerV2,
  type AnswerV2,
  type Cited,
  type HadithItem,
  type QuranItem,
  type RequirementId,
  type ScholarItem,
} from "./ask/answer-v2";
import type { Source } from "./ask/retrieval";
import type { PreparedFile, PreparedSentence } from "./prepared";

export type PreparedConversion =
  | { ok: true; answer: AnswerV2; contentHash: string }
  | { ok: false; reason: string; contentHash: string };

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Hashes every reader-visible language, source, citation, view and video field, not workflow notes. */
export function preparedContentHash(file: PreparedFile): string {
  const { status: _status, review_note: _note, researched_at: _researched, ...content } = file;
  return createHash("sha256").update(canonical(content), "utf8").digest("hex");
}

const requirement = (sentence: PreparedSentence, fallback: number): RequirementId =>
  sentence.requirement_id && /^R[1-4]$/.test(sentence.requirement_id)
    ? sentence.requirement_id as RequirementId
    : `R${Math.min(4, fallback + 1)}` as RequirementId;

export function convertPreparedToAnswerV2(input: {
  file: PreparedFile;
  language: Locale;
  sources: ReadonlyMap<string, Source>;
  review: "bayan_reviewed" | "scholar_reviewed";
  approvalHash: string;
  videos?: VideoSuggestion[];
}): PreparedConversion {
  const contentHash = preparedContentHash(input.file);
  const fail = (reason: string): PreparedConversion => ({ ok: false, reason, contentHash });
  if (input.approvalHash !== contentHash) return fail("approval_hash_mismatch");
  const stored = input.file.answers?.[input.language];
  if (!stored || !Array.isArray(stored.direct_answer) || stored.direct_answer.length === 0) return fail("missing_answer");
  if (stored.direct_answer.length > ANSWER_V2_LIMITS.simpleSentences) return fail("simple_answer_over_cap");
  if ((stored.explanation?.length ?? 0) > ANSWER_V2_LIMITS.moreSections) return fail("explanation_over_cap");
  if (stored.list && (stored.list.length < ANSWER_V2_LIMITS.listMin || stored.list.length > ANSWER_V2_LIMITS.listMax)) return fail("list_count");

  const direct = stored.direct_answer.map((sentence, index): Cited => ({
    text: sentence.text,
    source_ids: [...sentence.source_ids],
    requirement_id: requirement(sentence, index),
  }));
  const list = (stored.list ?? []).map((sentence, index): Cited => ({
    text: sentence.text,
    source_ids: [...sentence.source_ids],
    requirement_id: requirement(sentence, Math.min(index, direct.length - 1)),
  }));
  const directBySource = [...direct, ...list];
  const more = (stored.explanation ?? []).map((section) => ({
    heading: section.heading,
    sentences: section.sentences.map((sentence): Cited => ({
      text: sentence.text,
      source_ids: [...sentence.source_ids],
      requirement_id: sentence.requirement_id && /^R[1-4]$/.test(sentence.requirement_id)
        ? sentence.requirement_id as RequirementId
        : directBySource.find((item) => item.source_ids.some((id) => sentence.source_ids.includes(id)))?.requirement_id ?? "R1",
    })),
  }));
  const allText = [...direct, ...list, ...more.flatMap((section) => section.sentences)];
  if (allText.length > ANSWER_V2_LIMITS.maxCitedItems) return fail("cited_item_budget");
  const usedIds = [...new Set(allText.flatMap((sentence) => sentence.source_ids))];
  if (usedIds.some((id) => !input.sources.has(id))) return fail("cited_source_missing");
  const points = (id: string) => [...new Set(allText.filter((sentence) => sentence.source_ids.includes(id)).map((sentence) => sentence.requirement_id))];

  const quran: QuranItem[] = consecutiveRuns(usedIds.filter((id) => input.sources.get(id)?.kind === "quran")).map((ids) => ({
    id: quranCardId(ids), source_ids: ids, points: [...new Set(ids.flatMap(points))], cited: true,
    verses: ids.map((id) => {
      const source = input.sources.get(id)!;
      if (source.kind !== "quran") throw new Error("prepared quran source mismatch");
      const evidence = toEvidence(source, input.language);
      if (evidence.kind !== "quran") throw new Error("prepared quran evidence mismatch");
      return { id, key: evidence.key, arabic: evidence.arabic, translation: evidence.translation, translation_name: evidence.translationName, url: evidence.url };
    }),
  }));
  const hadith: HadithItem[] = [];
  const scholars: ScholarItem[] = [];
  for (const id of usedIds) {
    const source = input.sources.get(id)!;
    const evidence = toEvidence(source, input.language);
    if (evidence.kind === "hadith") hadith.push({ id, points: points(id), cited: true, collection: evidence.collection,
      numbers: { ...evidence.numbers }, grade_ar: evidence.gradeAr, attribution_ar: evidence.attributionAr,
      arabic: evidence.arabic, translation: evidence.translation, translation_language: evidence.translationLanguage, url: evidence.url });
    if (evidence.kind === "scholar") scholars.push({ id, points: points(id), cited: true, scholar_id: evidence.scholarId,
      scholar_name: evidence.scholarName, title: evidence.title, reference: evidence.reference, arabic: evidence.arabic, url: evidence.url });
  }
  if (quran.length > ANSWER_V2_LIMITS.quranCards || hadith.length > ANSWER_V2_LIMITS.hadith || scholars.length > ANSWER_V2_LIMITS.scholars) {
    return fail("source_cap");
  }
  const notes = (stored.not_established ?? []).map((note) => typeof note === "string" ? note : note.text).filter(Boolean);
  if (notes.length > 1) return fail("limit_note_count");
  const videos = (input.videos ?? input.file.videos ?? []).filter(isValidVideo).slice(0, ANSWER_V2_LIMITS.videos);
  const answer: AnswerV2 = {
    version: 2,
    language: input.language,
    origin: "prepared",
    review: input.review,
    simple_answer: { sentences: direct, ...(list.length ? { list } : {}) },
    quran,
    hadith,
    scholars,
    videos,
    ...(more.length ? { more_explanation: more } : {}),
    ...(notes.length ? { limit_note: notes[0] } : {}),
    attribution: {
      ...(quran.length ? { quran: { ...ATTRIBUTION } } : {}),
      ...(hadith.length ? { hadith: { ...HADITH_ATTRIBUTION } } : {}),
    },
    provenance: { prepared_version: "2", approval_hash: contentHash },
  };
  const requirementIds = [...new Set([...direct, ...list].map((sentence) => sentence.requirement_id))];
  const checked = validateAnswerV2(answer, { origin: "prepared", review: input.review, requirementIds,
    listAllowed: !!stored.list, limitNoteAllowed: notes.length > 0 });
  return checked.ok ? { ok: true, answer: checked.answer, contentHash } : fail(checked.reason);
}
