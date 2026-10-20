// Invented originals exercise source identity and transport, not religious accuracy.
import { describe, expect, it } from "vitest";
import { corpusCandidates } from "@/lib/ask/search-engine/corpus-candidates";
import { storedSourcePassages, type StoredSearchSource } from "@/lib/ask/search-engine/source-passages";
import type { SearchIndex } from "@/lib/ask/search-engine/contract";
import type { QuestionFrame } from "@/lib/ask/retrieval";

const source: StoredSearchSource = { id: "00000000-0000-0000-0000-000000000001", kind: "hadith", language: "ar", title: "عنوان تجريبي", reference: "Sahih al-Bukhari, hadith 1, book 1", text_original: "عن شخص تجريبي قال رسول الله في مثال مخترع للاختبار لا يمثل نص حديث حقيقي. ".repeat(8),
  url: "https://sunnah.com/bukhari:1", scholar_id: null, grade: "sahih", grader: "fixture", collection: "Sahih al-Bukhari", numbering: "fixture", rights_id: "fixture-rights", rights_status: "granted", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: null, expires_at: null, published: true, approved_search_document: true };
const frame: QuestionFrame = { language: "en", kind: "question", questionType: "general", subjects: ["fixture"], requiredFacets: ["general"], requirements: [{ id: "R1", text: "Explain the concern", facet: "general", searchQueries: { ar: ["مثال مخترع للاختبار"] } }], qualifiers: [], searchQueries: {} };
const index = (row = source): SearchIndex => ({ version: 1, generation: "fixture", space: { model: "none", revision: "lexical-only", dimensions: 1 }, passages: storedSourcePassages(row, new Date(), 100).passages });

describe("corpus discovery to authoritative source candidates", () => {
  it("reconstructs the complete report instead of presenting a matching search chunk as the hadith", async () => {
    const snapshot = index(); expect(snapshot.passages.length).toBeGreaterThan(1);
    const result = await corpusCandidates(frame, async () => snapshot, { signal: new AbortController().signal, allowLexicalOnly: true });
    expect(result).toHaveLength(1); expect(result[0].id).toBe(`SH${source.id}`);
    expect(result[0].contextAvailability).toBe("complete_parent");
    if (result[0].source.kind !== "hadith") throw new Error("fixture_family");
    expect(result[0].source.hadith.arabic).toBe(source.text_original); expect(result[0].retrievedFor).toEqual(["R1"]);
  });
  it("does not silently present a lexical-only pilot as semantic-ready", async () => {
    await expect(corpusCandidates(frame, async () => index(), { signal: new AbortController().signal })).rejects.toThrow("corpus_semantic_provider_not_ready");
  });
  it("keeps the limited-context warning on a scholarly excerpt and preserves approved names", async () => {
    const row: StoredSearchSource = { ...source, kind: "fatwa", rights_status: "short_quotes_only", max_quote_chars: 600, scholar_id: "ibn-baz", scholar_name_ar: "اسم تجريبي", scholar_name_en: "Fixture Name", scholar_name_de: "Beispielname", reference: "Fixture fatwa", url: "https://binbaz.org.sa/fatwas/123/fixture", text_original: "هذا مثال مخترع للاختبار ولا يمثل نص فتوى حقيقية أو كلام أي عالم." };
    const result = await corpusCandidates(frame, async () => index(row), { signal: new AbortController().signal, allowLexicalOnly: true });
    expect(result).toHaveLength(1); expect(result[0].contextAvailability).toBe("stored_excerpt_only");
    if (result[0].source.kind !== "scholar") throw new Error("fixture_family");
    expect(result[0].source.quote.scholarName.en).toBe("Fixture Name");
  });
  it("does not promote an incomplete continuation report to standalone evidence", async () => {
    const snapshot = index(); snapshot.passages.forEach(p => { p.context.complete = false; });
    const result = await corpusCandidates(frame, async () => snapshot, { signal: new AbortController().signal, allowLexicalOnly: true });
    expect(result).toEqual([]);
  });
});
