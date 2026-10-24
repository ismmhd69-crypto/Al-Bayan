import { expect, it, vi } from "vitest";
import { concernMeaning } from "@/lib/ask/search-engine/concern-meaning";
import { pipelineMeaningRanker } from "@/lib/ask/search-engine/pipeline-ranking";
import { retrieveFromCorpus } from "@/lib/ask/search-engine/corpus-retrieval";
import { retrieveFromPersistentCorpus } from "@/lib/ask/search-engine/persistent-corpus";
import { SOURCE_LOOKUP_REVISION } from "@/lib/ask/search-engine/hybrid";
import { textHash, type SearchIndex } from "@/lib/ask/search-engine/contract";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import { pack } from "./fixtures/rich";

const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["SEARCH_HINT_NOT_A_QUESTION_FACT"] },
  interpretations: [{ id: "I1", label: "First meaning" }, { id: "I2", label: "Second meaning" }],
  requirements: [{ id: "R1", text: "Explain the first concern", facet: "general", scope: "general", interpretationId: "I1", essentialConditions: ["without permission", "keine Zusage", "دون ضمان"] },
    { id: "R2", text: "Explain the other concern", facet: "conditions", scope: "case_specific", interpretationId: "I2", essentialConditions: ["before completion"] }] };
const space = { model: "invented-fixture", revision: "1", dimensions: 2, recipe: "a".repeat(64) };
const original = "نص عربي مخترع للاختبار فقط وليس فتوى حقيقية.";
const index: SearchIndex = { version: 1, generation: "fixture", space, passages: [{ id: "p1", sourceId: "s1", parentId: "s1", family: "scholar", language: "ar",
  original, originalHash: textHash(original), originalVerified: true, title: "Invented fixture", reference: "Fixture only", canonicalUrl: "https://example.org/fixture",
  span: { start: 0, end: original.length }, context: { before: "", after: "", complete: true }, attribution: { scholarId: "invented" },
  permissions: { published: true, search: true, ai: true, embeddings: true, record: "invented", verifiedAt: "2026-10-01T00:00:00Z", expiresAt: null, revoked: false },
  vector: { space, values: [1, 0], textHash: textHash(original) } }] };
const signal = new AbortController().signal;

it("preserves each concern's own conditions, negations and meaning without treating search hints as facts", () => {
  const first = concernMeaning(frame, frame.requirements[0]), second = concernMeaning(frame, frame.requirements[1]);
  for (const condition of frame.requirements[0].essentialConditions!) expect(first).toContain(condition);
  expect(first).toContain("Meaning: First meaning"); expect(first).toContain("Scope: general");
  expect(second).toContain("before completion"); expect(second).toContain("Scope: case_specific");
  expect(second).not.toContain("without permission"); expect(first).not.toContain("Second meaning");
  expect(first).not.toContain("SEARCH_HINT_NOT_A_QUESTION_FACT");
});

it("uses the same complete concern input in both corpus backends and the actual meaning ranker", async () => {
  const before = JSON.stringify(frame), seen: string[][] = [];
  const embedQueries = vi.fn(async (texts: string[]) => { seen.push(texts); return texts.map(() => [1, 0]); });
  await retrieveFromCorpus(frame, async () => index, { signal, embedder: { space, embedQueries }, families: ["scholar"] });
  await retrieveFromPersistentCorpus(frame, async op => op === "manifest"
    ? { status: "ready", generation: "fixture", space, semantic_eligible: 1, lookup_revision: SOURCE_LOOKUP_REVISION, expires_at: new Date(Date.now() + 3600000).toISOString() }
    : { status: "ready", generation: "fixture", space, semantic_eligible: 1, eligible: 1, lookup_revision: SOURCE_LOOKUP_REVISION, hits: [] },
  { signal, embedder: { space, embedQueries }, families: ["scholar"] });
  const ranked: string[] = [];
  await pipelineMeaningRanker(async (concern, passages) => { ranked.push(concern.text); return passages.map(p => ({ id: p.id, score: 50 })); })(frame, pack.passages, signal);
  const expected = frame.requirements.map(r => concernMeaning(frame, r));
  expect(seen).toEqual([expected, expected]); expect(ranked).toEqual(expected);
  expect(JSON.stringify(frame)).toBe(before);
});

it("rejects missing meanings or excessive context before any ranking call, never truncating a necessary condition", async () => {
  const missing = structuredClone(frame); missing.interpretations = [];
  expect(() => concernMeaning(missing, missing.requirements[0])).toThrow("search_interpretation_missing");
  const excessive = structuredClone(frame); excessive.requirements[1].essentialConditions = ["x".repeat(600)];
  const reranker = vi.fn();
  await expect(pipelineMeaningRanker(reranker)(excessive, pack.passages, signal)).rejects.toThrow("search_concern_too_long");
  expect(reranker).not.toHaveBeenCalled();
});
