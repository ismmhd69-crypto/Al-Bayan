import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { stripAnswer } from "@/lib/chat/answer-store";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { checkedPassages } from "@/lib/ask/checked-passages";
import { signParentReference, verifyParentReference, renewParentReference } from "@/lib/ask/parent-reference";
import { toEvidence } from "@/lib/ask/core";
import type { RichAnswer, RichSection } from "@/lib/ask/rich-answer";
import { pack, scholarId } from "./fixtures/rich";

// Invented wording. These fixtures establish behaviour, not theology.
const q = pack.passages[0].source, s = pack.passages[2].source;
if (q.kind !== "quran" || s.kind !== "scholar") throw Error("fixture");
const source = (id: string) => { const p = pack.passages.find(x => x.id === id)!; return { id, evidence: toEvidence(p.source, "en"), role: "direct" as const, requirementIds: ["R1"], explanationRequirementIds: [] }; };
const originals = (group: "quran" | "scholar", id: string): RichSection => ({ group, outcome: "ready", presentation: "originals", claims: [], sources: [source(id)] });
const sentence = "Together, these sources describe care as a thoughtful responsibility.";
const records = checkedPassages({ ...pack, passages: [pack.passages[0], pack.passages[2]] }, new Map(), new Set());
const DAY = 24 * 60 * 60_000;
function savedAnswer(signedAt = Date.now()) {
  const answer: RichAnswer = { version: 4, language: "en", review: "automatic", complete: true, checkedHashes: Object.fromEntries(records.map(r => [r.id, r])),
    sections: [originals("quran", "Q2:183"), { group: "hadith", outcome: "no_direct_evidence", claims: [], sources: [] }, originals("scholar", scholarId),
      { group: "summary", outcome: "ready", claims: [{ text: sentence, refs: ["Q2:183", scholarId], requirementId: "R1" }], sources: [source("Q2:183"), source(scholarId)] }] };
  answer.parentReference = signParentReference([sentence], records, "en", signedAt)!;
  return answer;
}
const reopen = (stored: unknown, changed = false) => hydrateAnswer(stored as RichAnswer, { getVerse: async () => q.verse, getHadith: async () => null,
  getScholar: async () => ({ ...s.quote, arabic: s.quote.arabic + (changed ? " جديد" : "") }), neighbours: async () => [] });
const reference = async (stored: unknown, changed = false) => { const r = await reopen(stored, changed); if (!r.ok || r.answer.version === 2) throw Error("fixture"); return r.answer.parentReference; };

beforeEach(() => { vi.stubEnv("ASK_FOLLOW_UP_SECRET", "synthetic-saved-secret"); });
afterEach(() => { vi.unstubAllEnvs(); });

it("renews the server's own reference when a saved chat is reopened with unchanged sources, even after it expired", async () => {
  const answer = savedAnswer(Date.now() - 3 * DAY);
  expect(verifyParentReference({ ref: answer.parentReference, sentences: [sentence] }, "en").parentUnavailable).toBe(true);
  const stored = stripAnswer(answer);
  expect(JSON.stringify(stored)).not.toContain(q.verse.arabic);
  const renewed = await reference(stored);
  expect(renewed).toBeTruthy(); expect(renewed).not.toBe(answer.parentReference);
  const verified = verifyParentReference({ ref: renewed, sentences: [sentence] }, "en");
  expect(verified.parentUnavailable).toBe(false);
  expect(verified.parentRecords).toEqual(records);
});

it("does not renew when a shown source changed since the answer", async () => {
  expect(await reference(stripAnswer(savedAnswer()), true)).toBeUndefined();
});

it("does not renew for edited sentences, a forged reference, another language or a rotated secret", async () => {
  const edited = stripAnswer(savedAnswer());
  edited.sections[3].claims[0].text = "An edited sentence the server never signed for this chat.";
  expect(await reference(edited)).toBeUndefined();
  const forged = stripAnswer(savedAnswer());
  forged.parentReference = `${forged.parentReference!.split(".")[0]}.${"A".repeat(43)}`;
  expect(await reference(forged)).toBeUndefined();
  const stored = stripAnswer(savedAnswer());
  expect(renewParentReference(stored.parentReference, [sentence], "ar")).toBeUndefined();
  vi.stubEnv("ASK_FOLLOW_UP_SECRET", "a-different-secret");
  expect(await reference(stored)).toBeUndefined();
  vi.stubEnv("ASK_FOLLOW_UP_SECRET", "");
  expect(await reference(stored)).toBeUndefined();
});

it("does not renew when a shown source has no recorded hash", async () => {
  const answer = savedAnswer();
  delete answer.checkedHashes![scholarId];
  expect(await reference(stripAnswer(answer))).toBeUndefined();
});
