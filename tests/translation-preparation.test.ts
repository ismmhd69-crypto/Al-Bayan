// Invented originals/translations only. Preparing a packet never approves its content.
import { expect, it } from "vitest";
import { prepareTranslationReview, renderTranslationReview, type TranslationPreparationRow } from "@/lib/ask/translation-preparation";
import type { StoredSearchSource } from "@/lib/ask/search-engine/source-passages";

const now = new Date("2026-10-22T00:00:00Z");
const source: StoredSearchSource = { id: "00000000-0000-4000-8000-000000000001", kind: "fatwa", language: "ar", title: "مثال مخترع",
  reference: "Invented fixture reference", text_original: "هذا مثال عربي مخترع للاختبار ولا يمثل فتوى أو كلام عالم ولا يجوز نسبته إلى مصدر حقيقي.",
  url: "https://binbaz.org.sa/fatwas/999999/invented", scholar_id: "ibn-baz", scholar_name_ar: "اسم اختباري", scholar_name_en: "Test name", scholar_name_de: "Testname",
  rights_id: "invented-permission", rights_status: "short_quotes_only", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: 600,
  expires_at: "2026-10-23", published: true, approved_search_document: true, grade: null, grader: null, collection: null, numbering: null };
const row: TranslationPreparationRow = { source_id: source.id, lang: "en", text: "Invented English translation fixture", origin: "ai", published: false, version: 1 };

it("does not call existing bilingual drafts done or invent old original-binding receipts", () => {
  const german = { ...row, lang: "de" as const, text: "Erfundener deutscher Testtext" };
  const packet = prepareTranslationReview([source], [row, german], now);
  expect(packet.items.map(i => i.state)).toEqual(["draft_needs_review", "draft_needs_review"]);
  expect(packet.items.every(i => !i.displayEligible && Object.values(i.checks).every(v => v === "pending"))).toBe(true);
  expect(packet.items.every(i => i.originalAtTranslationCreation === "unrecorded_do_not_infer_from_current_snapshot")).toBe(true);
  expect(packet).toMatchObject({ accepted: false, paidModelCalls: 0, publicationChanges: 0 });
});

it("identifies a missing language without generating a substitute or English fallback", () => {
  const packet = prepareTranslationReview([source], [row], now);
  expect(packet.items[1]).toMatchObject({ language: "de", state: "translation_missing", candidate: null, displayEligible: false });
});

it("binds identities to current exact originals and metadata without mutating input", () => {
  const original = structuredClone(source), draft = structuredClone(row);
  const before = prepareTranslationReview([source], [row], now);
  expect(source).toEqual(original); expect(row).toEqual(draft);
  const changedOriginal = prepareTranslationReview([{ ...source, text_original: source.text_original + " نص مختلف." }], [row], now);
  expect(changedOriginal.packetHash).not.toBe(before.packetHash);
  expect(changedOriginal.items[0].originalHash).not.toBe(before.items[0].originalHash);
  const changedTranslation = prepareTranslationReview([source], [{ ...row, text: row.text + " Changed." }], now);
  expect(changedTranslation.items[0].candidate?.textHash).not.toBe(before.items[0].candidate?.textHash);
  const changedMetadata = prepareTranslationReview([{ ...source, scholar_name_en: "Different name" }], [row], now);
  expect(changedMetadata.items[0].sourceFingerprint).not.toBe(before.items[0].sourceFingerprint);
});

it.each([
  { published: false }, { ai_processing_allowed: false }, { search_index_allowed: false }, { expires_at: "2026-10-20" },
  { text_original: "طويل ".repeat(150) }, { url: "https://unapproved.invalid/source" }, { scholar_name_en: null },
])("rejects ineligible source snapshots rather than exporting presumed usable material %#", changed => {
  expect(() => prepareTranslationReview([{ ...source, ...changed }], [row], now)).toThrow("translation_preparation_source_ineligible");
});

it.each([
  [{ ...row, source_id: "unknown" }], [{ ...row, lang: "ar" }], [{ ...row, version: 0 }], [{ ...row, published: "false" }],
  [{ ...row, text: "" }], [row, row], [row, { ...row, text: "Conflicting same-version text" }],
].map(rows => ({ rows })))("refuses defective/mismatched batches as a whole %#", ({ rows }) => {
  expect(() => prepareTranslationReview([source], rows as TranslationPreparationRow[], now)).toThrow(/translation_preparation_/);
});

it("preserves claimed human review as unverified provenance rather than accepting the candidate", () => {
  const packet = prepareTranslationReview([source], [{ ...row, origin: "human", reviewer: "Fixture reviewer", reviewed_at: "2026-10-21T00:00:00Z" }], now);
  expect(packet.items[0].candidate?.claimedProvenance.reviewer).toBe("Fixture reviewer");
  expect(packet.items[0].checks.exactOriginalAlignment).toBe("pending"); expect(packet.accepted).toBe(false);
});

it("keeps an existing publication fact distinct from this packet's pending review", () => {
  const packet = prepareTranslationReview([source], [{ ...row, published: true }], now);
  expect(packet.items[0]).toMatchObject({ state: "published_candidate_needs_review", displayEligible: false, candidate: { publishedAtSnapshot: true } });
  expect(packet.publicationChanges).toBe(0); expect(packet.accepted).toBe(false);
});

it("keeps source/draft text literal in the readable review instead of executing embedded formatting", () => {
  const text = "A literal invented draft.\n```\n# Pretend approval\n```";
  const packet = prepareTranslationReview([source], [{ ...row, text }], now), rendered = renderTranslationReview(packet);
  expect(rendered).toContain("````text\n" + text + "\n````");
  expect(rendered).toContain(source.text_original);
  expect(rendered).toContain("not approved answers");
  expect(rendered).toContain("Owner acceptance: pending");
  expect(packet.items[0].displayEligible).toBe(false);
});
