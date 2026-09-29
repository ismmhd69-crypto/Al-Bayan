import "server-only";
import type { Locale } from "@/lib/i18n";
import { hadithAllowed, toEvidence, type Answer } from "@/lib/ask/core";
import type { Source } from "@/lib/ask/retrieval";
import { getVerse, ATTRIBUTION } from "@/lib/sources/quran";
import { getHadith, HADITH_ATTRIBUTION } from "@/lib/sources/hadith";
import { scholarQuoteAllowed, type ScholarQuote } from "@/lib/sources/scholar-rules";
import { getScholarNames } from "@/lib/content";

// Prepared answers: researched in advance (data/topic-answers, later data/prepared-answers), shown only
// after Mo approves them. Quran text is never stored (Quran Foundation allows at most one week of
// caching): verses are fetched live by key. Hadith are fetched fresh from HadeethEnc by id. Scholar
// quotes are stored short quotes and pass the same site rules as the library. If any cited source cannot
// be loaded or fails its rule, the whole answer is not shown (fail closed).

type Sentence = { text: string; source_ids: string[] };
type LangAnswer = {
  direct_answer: Sentence[];
  explanation: { heading: string; sentences: Sentence[] }[];
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
  sources: StoredSource[];
  answers: Record<Locale, LangAnswer>;
};

/** The answer in the Ask answer shape, or null when not approved (unless allowed) or a source fails. */
export async function loadPrepared(file: PreparedFile, language: Locale, options?: { allowDraft?: boolean }): Promise<Answer | null> {
  try {
    return await build(file, language, options);
  } catch (err) {
    // A source service is down or not configured (for example no Quran keys on this server): show nothing.
    console.error("prepared answer could not be loaded:", err instanceof Error ? err.message : "unknown error");
    return null;
  }
}

async function build(file: PreparedFile, language: Locale, options?: { allowDraft?: boolean }): Promise<Answer | null> {
  if (file.status !== "approved" && !(options?.allowDraft && file.status === "draft")) return null;
  const a = file.answers?.[language];
  if (!a || !Array.isArray(a.direct_answer) || a.direct_answer.length === 0) return null;
  const sentences = [...a.direct_answer, ...(a.explanation ?? []).flatMap((s) => s.sentences)];
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
  const sentence = (s: Sentence) => ({ text: s.text, source_ids: s.source_ids.map(shown) });
  const notes = (a.not_established ?? []).map((n) => (typeof n === "string" ? n : n.text)).filter(Boolean);
  const used = usedIds.map((id) => byId.get(id)!);
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
  };
}
