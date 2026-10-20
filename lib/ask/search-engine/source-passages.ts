import { textHash, passageProblem, type SearchPassage, type SourcePermissions } from "./contract";
import { isContinuationHadith } from "@/lib/sources/hadith-rules";

export type StoredSearchSource = {
  id: string; kind: "hadith" | "fatwa"; language: "ar";
  title: string | null; reference: string; text_original: string; url: string;
  scholar_id: string | null; grade: "sahih" | "hasan" | null; grader: string | null;
  collection: string | null; numbering: string | null;
  rights_id: string; rights_status: string; search_index_allowed: boolean; ai_processing_allowed: boolean;
  max_quote_chars: number | null; expires_at: string | null;
  published: boolean; approved_search_document: boolean;
  scholar_name_ar?: string | null; scholar_name_en?: string | null; scholar_name_de?: string | null;
};

export function storedSourceFingerprint(source: StoredSearchSource) {
  const fields = [source.kind, source.language, source.reference, source.text_original, source.url, source.scholar_id, source.grade, source.grader, source.collection, source.numbering, source.title, source.scholar_name_ar, source.scholar_name_en, source.scholar_name_de];
  return textHash(fields.map(value => { const s = value ?? ""; return `${Buffer.byteLength(s, "utf8")}:${s}`; }).join(""));
}

/** UTF-16 offsets into the unchanged stored original. Only sentence/paragraph
 * boundaries are used. Oversized sentences remain whole for later model checks. */
export function coherentRanges(text: string, preferredChars = 1600) {
  if (!Number.isSafeInteger(preferredChars) || preferredChars < 100 || preferredChars > 16_000 || !text || text.length > 100_000) throw new Error("invalid_passage_split");
  const boundaries = [...text.matchAll(/(?:\n\s*\n|[.!?؟؛。](?:[»”"')\]]*)\s+|$)/gu)].map(m => m.index! + m[0].length).filter(n => n > 0);
  if (boundaries.at(-1) !== text.length) boundaries.push(text.length);
  const ranges: { start: number; end: number }[] = [];
  let start = 0;
  while (start < text.length) {
    const before = boundaries.filter(n => n > start && n <= start + preferredChars);
    const end = before.at(-1) ?? boundaries.find(n => n > start)!;
    ranges.push({ start, end }); start = end;
  }
  return ranges;
}

/** Converts a rights-filtered database snapshot, not an approval of its teaching.
 * Stored-byte verification is labelled separately from official-page verification. */
export function storedSourcePassages(source: StoredSearchSource, now = new Date(), preferredChars = 1600) {
  if (source.published !== true || source.approved_search_document !== true || source.language !== "ar" || !source.rights_id
    || !["granted", "short_quotes_only"].includes(source.rights_status) || source.search_index_allowed !== true || source.ai_processing_allowed !== true) return { passages: [], reason: "source_not_eligible" };
  if (!source.text_original || source.text_original.length > 100_000 || (source.rights_status === "short_quotes_only" && (!source.max_quote_chars || source.text_original.length > source.max_quote_chars))) return { passages: [], reason: "source_storage_limit" };
  const expiry = source.expires_at ? /^\d{4}-\d{2}-\d{2}$/.test(source.expires_at) ? `${source.expires_at}T23:59:59.999Z` : source.expires_at : null;
  const permissions: SourcePermissions = { published: true, search: true, ai: true, embeddings: false, record: source.rights_id, verifiedAt: now.toISOString(), expiresAt: expiry, revoked: false };
  const parentHash = textHash(source.text_original);
  const passages: SearchPassage[] = coherentRanges(source.text_original, preferredChars).map(span => {
    const original = source.text_original.slice(span.start, span.end);
    return { id: `${source.id}-${span.start}-${span.end}`, sourceId: source.id, parentId: source.id,
      family: source.kind === "hadith" ? "hadith" : "scholar", language: "ar", original, originalHash: textHash(original), parentOriginalHash: parentHash,
      originalVerified: true, verificationBasis: "stored_source_bytes", sourceFingerprint: storedSourceFingerprint(source), title: source.title || source.reference, reference: source.reference, canonicalUrl: source.url, span,
      context: { before: source.text_original.slice(0, span.start), after: source.text_original.slice(span.end), complete: source.kind === "hadith" && !isContinuationHadith(source.text_original) }, permissions: { ...permissions },
      attribution: { ...(source.scholar_id ? { scholarId: source.scholar_id } : {}), ...(source.scholar_name_ar && source.scholar_name_en && source.scholar_name_de ? { scholarName: { ar: source.scholar_name_ar, en: source.scholar_name_en, de: source.scholar_name_de } } : {}), ...(source.grade ? { grade: source.grade } : {}), ...(source.grader ? { grader: source.grader } : {}), ...(source.collection ? { collection: source.collection } : {}), ...(source.numbering ? { numbering: source.numbering } : {}) } };
  });
  const issue = passages.map(p => passageProblem(p, now, false)).find(Boolean);
  return issue ? { passages: [], reason: issue } : { passages, reason: null };
}
