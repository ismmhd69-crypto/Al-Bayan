import { createHash } from "node:crypto";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { storedSourcePassages, storedSourceFingerprint, type StoredSearchSource } from "./search-engine/source-passages";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
export type TranslationPreparationRow = { source_id: string; lang: "en" | "de"; text: string; origin: "ai" | "human";
  published: boolean; version: number; translator?: string | null; reviewer?: string | null; reviewed_at?: string | null };

/** Existing drafts are material to review, not completed translation work. This
 * creates a private snapshot, never an approval, publication or historical receipt. */
export function prepareTranslationReview(sources: StoredSearchSource[], translations: TranslationPreparationRow[], now = new Date()) {
  if (!Number.isFinite(now.getTime()) || !Array.isArray(sources) || !sources.length || sources.length > 20 || new Set(sources.map(s => s.id)).size !== sources.length
    || !Array.isArray(translations) || translations.length > 400) throw Error("translation_preparation_batch_invalid");
  const originals = sources.map(source => {
    const prepared = storedSourcePassages(source, now);
    if (source.kind !== "fatwa" || source.text_original.length > 600 || prepared.reason || !prepared.passages.length || !source.scholar_id
      || !source.scholar_name_ar || !source.scholar_name_en || !source.scholar_name_de
      || !scholarQuoteAllowed({ id: `S${source.id}`, scholarId: source.scholar_id, scholarName: { ar: source.scholar_name_ar, en: source.scholar_name_en, de: source.scholar_name_de },
        title: source.title, reference: source.reference, arabic: source.text_original, url: source.url })) throw Error("translation_preparation_source_ineligible");
    return { id: source.id, scholarId: source.scholar_id, scholarNames: { ar: source.scholar_name_ar, en: source.scholar_name_en, de: source.scholar_name_de },
      title: source.title, reference: source.reference, url: source.url, original: source.text_original, originalHash: hash(source.text_original),
      sourceFingerprint: storedSourceFingerprint(source), permissions: prepared.passages[0].permissions,
      originalVerification: "stored_bytes_only_not_official_page_review", contextAvailability: "stored_excerpt_only" };
  });
  const seen = new Set<string>();
  for (const t of translations) {
    if (!t || !originals.some(s => s.id === t.source_id) || !["en", "de"].includes(t.lang) || !["ai", "human"].includes(t.origin)
      || typeof t.text !== "string" || !t.text.trim() || t.text.length > 16000 || typeof t.published !== "boolean"
      || !Number.isSafeInteger(t.version) || t.version < 1
      || [t.translator, t.reviewer, t.reviewed_at].some(v => v !== undefined && v !== null && typeof v !== "string")) throw Error("translation_preparation_row_invalid");
    const key = `${t.source_id}:${t.lang}:${t.version}`;
    if (seen.has(key)) throw Error("translation_preparation_duplicate_version");
    seen.add(key);
  }
  const items = originals.flatMap(source => (["en", "de"] as const).map(language => {
    const rows = translations.filter(t => t.source_id === source.id && t.lang === language).sort((a, b) => b.version - a.version);
    const t = rows[0];
    return { sourceId: source.id, originalHash: source.originalHash, sourceFingerprint: source.sourceFingerprint, language,
      state: t ? t.published ? "published_candidate_needs_review" : "draft_needs_review" : "translation_missing", displayEligible: false,
      originalAtTranslationCreation: "unrecorded_do_not_infer_from_current_snapshot",
      candidate: t ? { text: t.text, textHash: hash(t.text), version: t.version, origin: t.origin, publishedAtSnapshot: t.published,
        claimedProvenance: { translator: t.translator ?? null, reviewer: t.reviewer ?? null, reviewedAt: t.reviewed_at ?? null } } : null,
      checks: { exactOriginalAlignment: "pending", meaningAndQualifications: "pending", nativeLanguage: "pending", ownerAcceptance: "pending" } };
  }));
  const body = { version: 1, preparedAt: now.toISOString(), purpose: "private_translation_preparation_not_display_or_import",
    originals, items, paidModelCalls: 0, publicationChanges: 0, accepted: false };
  return { ...body, packetHash: hash(JSON.stringify(body)) };
}

/** Human-readable companion only. Fence source/draft text as data and preserve its
 * bytes; neither the packet's presence nor its checksum makes a review decision. */
export function renderTranslationReview(packet: ReturnType<typeof prepareTranslationReview>): string {
  const literal = (text: string) => {
    const fence = "`".repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(m => m[0].length + 1)));
    return `${fence}text\n${text}\n${fence}`;
  };
  const lines = ["# Translation drafts for review", "", "These are existing drafts, not approved answers or display-ready translations.",
    "Compare each draft with its exact Arabic excerpt. Check meaning, conditions, negation and natural language. Publication and owner acceptance are still pending.",
    "The saved original is a current snapshot. The original used when an old draft was created is not recorded. Do not assume they were the same.", "",
    `Prepared: ${packet.preparedAt}`, `Packet fingerprint: ${packet.packetHash}`, ""];
  for (const source of packet.originals) {
    lines.push(`## Source ${source.id}`, "", `Official page: ${source.url}`, `Scholar identity: ${source.scholarId}`,
      `Current original fingerprint: ${source.originalHash}`, "", "### Arabic original", "", literal(source.original), "",
      "This is a stored excerpt. Its full surrounding context and official-page comparison have not been independently reviewed here.", "");
    for (const item of packet.items.filter(i => i.sourceId === source.id)) {
      lines.push(`### ${item.language === "en" ? "English" : "German"} draft`, "");
      if (item.candidate) lines.push(`Origin: ${item.candidate.origin}; version: ${item.candidate.version}; published at snapshot: ${item.candidate.publishedAtSnapshot ? "yes" : "no"}.`, "", literal(item.candidate.text));
      else lines.push("No translation candidate is available. No substitute was generated.");
      lines.push("", "Exact-original alignment: pending. Meaning and qualifications: pending. Native-language review: pending. Owner acceptance: pending.", "");
    }
  }
  return lines.join("\n") + "\n";
}
