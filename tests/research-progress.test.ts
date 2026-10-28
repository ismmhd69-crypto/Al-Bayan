import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { nextResearchProgress, validateResearchProgress } from "@/lib/ask/research-progress";
import { pack } from "./fixtures/rich";
it("persists conclusion allowances in the hashed worker checkpoint without resetting on recovery", () => {
  const first = nextResearchProgress(undefined, { conclusion: { drafts: 2, meaningUsed: true, editorialUsed: false, raw: { summary: [] } } });
  const next = nextResearchProgress(first, { recoveryRounds: [{ attempt: 1, round: 2 }] });
  expect(next.conclusion).toEqual(first.conclusion);
  expect(() => nextResearchProgress(next, { conclusion: { drafts: 4, meaningUsed: true, editorialUsed: true } })).toThrow("conclusion_allowance");
  next.conclusion!.drafts = 0;
  expect(() => validateResearchProgress(next)).toThrow("hash");
});

it("keeps immutable discovery revisions separate from approved evidence", () => {
  const candidates = structuredClone(pack.passages);
  const first = nextResearchProgress(undefined, { candidates }, pack.question);
  const second = nextResearchProgress(first, { working: candidates }, pack.question);
  expect(first.working).toBeNull(); expect(second.previousHash).toBe(first.hash);
  expect(second.revision).toBe(2); expect(validateResearchProgress(second)).toEqual(second);
  candidates[0].id = "changed"; expect(first.candidates[0].id).toBe("Q2:183");
  const broken = structuredClone(second); broken.candidates.pop();
  expect(() => validateResearchProgress(broken)).toThrow("hash_or_budget");
});

it("rejects a working pool with the right ID but a different original or context", () => {
  const candidates = structuredClone(pack.passages), working = structuredClone(candidates);
  if (working[0].source.kind !== "quran") throw Error("fixture");
  working[0].source.verse.arabic += " مختلف";
  expect(() => nextResearchProgress(undefined, { candidates, working })).toThrow("working_identity");
});

it("rejects unknown concern IDs, ineligible sources and repeated query records", () => {
  const query = { requirementId: "R1", family: "hadith" as const, language: "en" as const, text: "care evidence" };
  const record = { query, attempt: 0, status: "planned" as const };
  expect(() => nextResearchProgress(undefined, { queries: [record, record] })).toThrow("duplicate");
  expect(() => nextResearchProgress(undefined, { queries: [{ ...record, query: { ...query, requirementId: "R4" } }] }, pack.question)).toThrow("query_invalid");
  const candidates = structuredClone(pack.passages);
  if (candidates[2].source.kind !== "scholar") throw Error("fixture");
  candidates[2].source.quote.url = "https://unapproved.invalid/";
  expect(() => nextResearchProgress(undefined, { candidates })).toThrow("candidates_invalid");
});
