import "server-only";
import type { Locale } from "@/lib/i18n";
import { hadithAllowed, toEvidence, type Answer } from "@/lib/ask/core";
import type { Source } from "@/lib/ask/retrieval";
import { getVerse, ATTRIBUTION } from "@/lib/sources/quran";
import { getHadith, HADITH_ATTRIBUTION } from "@/lib/sources/hadith";
import { scholarQuoteAllowed, type ScholarQuote } from "@/lib/sources/scholar-rules";
import { getScholarNames } from "@/lib/content";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";
import { convertPreparedToAnswerV2, preparedContentHash } from "@/lib/prepared-v2";

// Prepared answers: researched in advance (data/topic-answers, later data/prepared-answers), shown only
// after Mo approves them. Quran text is never stored (Quran Foundation allows at most one week of
// caching): verses are fetched live by key. Hadith are fetched fresh from HadeethEnc by id. Scholar
// quotes are stored short quotes and pass the same site rules as the library. If any cited source cannot
// be loaded or fails its rule, the whole answer is not shown (fail closed).

export type PreparedSentence = { text: string; source_ids: string[]; requirement_id?: string };
type LangAnswer = {
  direct_answer: PreparedSentence[];
  list?: PreparedSentence[];
  explanation: { heading: string; sentences: PreparedSentence[] }[];
  not_established?: ({ text: string } | string)[];
};
type StoredSource =
  | { id: string; kind: "quran"; reference?: string }
  | { id: string; kind: "hadith" }
  | { id: string; kind: "scholar"; scholar_id: string; title?: string | null; reference: string; arabic: string; url: string };

export type PreparedFile = {
  topic_id?: string;
  status: "draft" | "approved" | "rejected";
  review_note?: string;
  researched_at?: string;
  questions?: Partial<Record<Locale, string[]>>; // common wordings (prepared answers only)
  sources: StoredSource[];
  answers: Record<Locale, LangAnswer>;
  videos?: VideoSuggestion[];
};

/** The answer in the Ask answer shape, or null when not approved (unless allowed) or a source fails. */
export type PreparedLoadOptions = { allowDraft?: boolean; approvalHash?: string; videos?: VideoSuggestion[]; onFailure?: (reason: string) => void };

export async function loadPrepared(file: PreparedFile, language: Locale, options?: PreparedLoadOptions): Promise<Answer | null> {
  try {
    return await build(file, language, options);
  } catch (err) {
    // Next.js page-rendering signals must pass through (loaded here so scripts can use this file too).
    (await import("next/navigation")).unstable_rethrow(err);
    // A source service is down or not configured (for example no Quran keys on this server): show nothing.
    console.error("prepared answer could not be loaded:", err instanceof Error ? err.message : "unknown error");
    return null;
  }
}

async function build(file: PreparedFile, language: Locale, options?: PreparedLoadOptions): Promise<Answer | null> {
  if (file.status !== "approved" && !(options?.allowDraft && file.status === "draft")) return null;
  const a = file.answers?.[language];
  if (!a || !Array.isArray(a.direct_answer) || a.direct_answer.length === 0) return null;
  // Lists are part of the checked answer, not decoration. A source may support only a listed
  // step or condition, so it must be resolved and fail closed exactly like every prose sentence.
  const sentences = [...a.direct_answer, ...(a.list ?? []), ...(a.explanation ?? []).flatMap((s) => s.sentences)];
  const usedIds = [...new Set(sentences.flatMap((s) => s.source_ids))];
  if (sentences.some((s) => !s.text || s.source_ids.length === 0)) return null;

  const stored = new Map(file.sources.map((s) => [s.id, s]));
  const names = await getScholarNames();
  const resolved = await Promise.all(
    usedIds.map(async (id): Promise<[string, Source | null]> => {
      const s = stored.get(id);
      if (!s) return [id, null];
      if (s.kind === "quran") {
        const verse = await getVerse(id.replace(/^Q/, ""));
        return [id, verse ? { kind: "quran", verse } : null];
      }
      if (s.kind === "hadith") {
        const hadith = await getHadith(id.replace(/^HE/, ""));
        return [id, hadith && hadithAllowed(hadith) ? { kind: "hadith", hadith } : null];
      }
      const name = names[s.scholar_id];
      if (!name) return [id, null];
      const quote: ScholarQuote = { id, scholarId: s.scholar_id, scholarName: name, title: s.title ?? null, reference: s.reference, arabic: s.arabic, url: s.url };
      return [id, scholarQuoteAllowed(quote) ? { kind: "scholar", quote } : null];
    }),
  );
  if (resolved.some(([, source]) => !source)) return null;
  const byId = new Map(resolved as [string, Source][]);

  // Same display ids as live answers: verses as "2:255", hadith and quotes by their id.
  const shown = (id: string) => (id.startsWith("Q") ? id.slice(1) : id);
  const sentence = (s: PreparedSentence) => ({ text: s.text, source_ids: s.source_ids.map(shown) });
  const notes = (a.not_established ?? []).map((n) => (typeof n === "string" ? n : n.text)).filter(Boolean);
  const used = usedIds.map((id) => byId.get(id)!);
  const contentHash = preparedContentHash(file);
  // Public prepared answers require the exact content hash recorded by the approval decision.
  // Draft review may convert the current bytes for preview, but it never grants publication.
  const approvalHash = options?.allowDraft ? contentHash : options?.approvalHash;
  if (!approvalHash) return null;
  const converted = convertPreparedToAnswerV2({ file, language, sources: byId,
    review: "bayan_reviewed", approvalHash, videos: options?.videos });
  if (!converted.ok) {
    options?.onFailure?.(converted.reason);
    return null;
  }
  return {
    language,
    prepared: true,
    claims: sentences.map((s) => ({ text: s.text, refs: s.source_ids.map(shown) })),
    direct_answer: a.direct_answer.map(sentence),
    explanation: (a.explanation ?? []).map((section) => ({ heading: section.heading, sentences: section.sentences.map(sentence) })),
    not_established: notes.map((text) => ({ text })),
    evidence: used.map((s) => toEvidence(s, language)),
    attribution: { ...ATTRIBUTION },
    ...(used.some((s) => s.kind === "hadith") ? { hadithAttribution: { ...HADITH_ATTRIBUTION } } : {}),
    model: "prepared",
    verifier: "reviewed-by-mo",
    v2: converted.answer,
  };
}

export { preparedContentHash } from "@/lib/prepared-v2";
