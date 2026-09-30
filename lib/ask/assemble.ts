// Builds the rendered AnswerV2 from a checked live draft and its capped sealed package
// (design sections 4.1 and 4.2). Only cited sources are rendered; the package caps were applied
// before drafting, so nothing cited is ever cut here. If a cited source cannot be rendered, or the
// rendered Quran cards would exceed the cap, the answer fails closed instead of dropping it.
// The caller still runs validateAnswerV2 on the result.

import type { Locale } from "@/lib/i18n";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { HADITH_ATTRIBUTION } from "@/lib/sources/hadith-rules";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";
import type { Evidence } from "./core";
import type { Claim, StructuredDraft } from "./checks";
import { consecutiveRuns, quranCardId } from "./ids";
import type { QuranCard } from "./package";
import type { SelectedPassage } from "./retrieval";
import {
  ANSWER_V2_LIMITS,
  isValidVideo,
  type AnswerV2,
  type Cited,
  type HadithItem,
  type QuranItem,
  type RequirementId,
  type ScholarItem,
} from "./answer-v2";

export type LiveAnswerInput = {
  language: Locale;
  cards: QuranCard[]; // from the capped package
  passages: SelectedPassage[]; // the capped package
  evidence: ReadonlyMap<string, Evidence>; // display data for every package passage, by internal id
  draft: StructuredDraft; // checked claims with internal ids ("Q2:183")
  videos: VideoSuggestion[];
  model: string;
  verifier: string;
};

export type BuildResult = { ok: true; answer: AnswerV2 } | { ok: false; reason: string };

const toCited = (claim: Claim): Cited => ({
  text: claim.text,
  source_ids: [...claim.refs],
  requirement_id: claim.requirementId as RequirementId,
});

export function buildLiveAnswerV2(input: LiveAnswerInput): BuildResult {
  const { draft, evidence } = input;
  const cited = new Set(draft.claims.flatMap((claim) => claim.refs));
  const points = new Map(input.passages.map((passage) => [passage.id, passage.requirementIds]));
  const inPackage = new Set(input.passages.map((passage) => passage.id));
  for (const id of cited) {
    if (!inPackage.has(id) || !evidence.has(id)) return { ok: false, reason: "cited_source_missing" };
  }
  const pointsOf = (ids: string[]) => [...new Set(ids.flatMap((id) => points.get(id) ?? []))].sort();

  // Quran: a named passage the visitor asked about stays whole once any of it is cited; otherwise
  // only cited verses are shown, as runs of consecutive verses inside their package card.
  const quran: QuranItem[] = [];
  const shownVerses = new Set<string>();
  for (const card of input.cards) {
    const citedVerses = card.sourceIds.filter((id) => cited.has(id));
    if (citedVerses.length === 0) continue;
    const runs = card.named ? [card.sourceIds] : consecutiveRuns(citedVerses);
    for (const ids of runs) {
      const verses = ids.map((id) => evidence.get(id));
      if (verses.some((e) => e?.kind !== "quran")) return { ok: false, reason: "cited_source_missing" };
      ids.forEach((id) => shownVerses.add(id));
      quran.push({
        id: quranCardId(ids),
        source_ids: ids,
        points: pointsOf(ids),
        cited: true,
        verses: verses.map((e, index) => {
          const v = e as Extract<Evidence, { kind: "quran" }>;
          return { id: ids[index], key: v.key, arabic: v.arabic, translation: v.translation, translation_name: v.translationName, url: v.url };
        }),
      });
    }
  }
  // Never drop a cited verse to satisfy the card cap: refuse instead.
  if (quran.length > ANSWER_V2_LIMITS.quranCards) return { ok: false, reason: "rendered_quran_cards_over_cap" };

  const hadith: HadithItem[] = [];
  const scholars: ScholarItem[] = [];
  for (const passage of input.passages) {
    if (!cited.has(passage.id)) continue;
    const e = evidence.get(passage.id)!;
    if (e.kind === "quran") {
      if (!shownVerses.has(passage.id)) return { ok: false, reason: "cited_source_missing" };
    } else if (e.kind === "hadith") {
      hadith.push({ id: passage.id, points: pointsOf([passage.id]), cited: true, collection: e.collection, numbers: { ...e.numbers },
        grade_ar: e.gradeAr, attribution_ar: e.attributionAr, arabic: e.arabic, translation: e.translation,
        translation_language: e.translationLanguage, url: e.url });
    } else {
      scholars.push({ id: passage.id, points: pointsOf([passage.id]), cited: true, scholar_id: e.scholarId, scholar_name: e.scholarName,
        title: e.title, reference: e.reference, arabic: e.arabic, url: e.url });
    }
  }
  if (hadith.length > ANSWER_V2_LIMITS.hadith || scholars.length > ANSWER_V2_LIMITS.scholars) {
    return { ok: false, reason: "rendered_source_over_cap" };
  }

  const answer: AnswerV2 = {
    version: 2,
    language: input.language,
    origin: "live",
    review: "automatic",
    simple_answer: {
      sentences: draft.directAnswer.map(toCited),
      ...(draft.list.length > 0 ? { list: draft.list.map(toCited) } : {}),
    },
    quran,
    hadith,
    scholars,
    // Videos never block an answer: any clip that would fail validation is simply left out.
    videos: input.videos.filter(isValidVideo).slice(0, ANSWER_V2_LIMITS.videos),
    ...(draft.explanation.length > 0
      ? { more_explanation: draft.explanation.map((section) => ({ heading: section.heading, sentences: section.sentences.map(toCited) })) }
      : {}),
    ...(draft.notEstablished.length > 0 ? { limit_note: draft.notEstablished[0] } : {}),
    attribution: {
      ...(quran.length > 0 ? { quran: { ...ATTRIBUTION } } : {}),
      ...(hadith.length > 0 ? { hadith: { ...HADITH_ATTRIBUTION } } : {}),
    },
    provenance: { model: input.model, verifier: input.verifier },
  };
  return { ok: true, answer };
}
