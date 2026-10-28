import { expect, it } from "vitest";
import { emptyRichState, reduceRichEvent, validVerifiedQuranCard, type VerifiedQuranCard } from "@/lib/ask/rich-answer";
import { sections } from "./fixtures/rich";
const card: VerifiedQuranCard = { id: "a".repeat(64), evidenceSnapshot: "b".repeat(64), group: "quran",
  sources: sections[0].sources.map(s => ({ ...s, role: "direct", requirementIds: ["R1"], explanationRequirementIds: [] })) };

it("requires approved Quran identities and explicit evidence roles on cards", () => {
  expect(validVerifiedQuranCard(card)).toBe(true);
  expect(validVerifiedQuranCard({ ...card, sources: sections[0].sources })).toBe(false);
  expect(validVerifiedQuranCard({ ...card, sources: [{ ...card.sources[0], evidence: { ...card.sources[0].evidence, url: "https://unapproved.test" } }] })).toBe(false);
});

it("rejects duplicate source cards and stale withdrawals, then replaces cards with the checked explanation", () => {
  let state = reduceRichEvent(emptyRichState(), { request_id: "fixture", sequence: 1, version: 2, type: "source_card", card, revision: 1 });
  expect(state.cards).toHaveLength(1);
  expect(() => reduceRichEvent(state, { request_id: "fixture", sequence: 2, version: 2, type: "source_card", card: { ...card, id: "c".repeat(64) }, revision: 1 })).toThrow("invalid_source_card");
  expect(() => reduceRichEvent(state, { request_id: "fixture", sequence: 2, version: 2, type: "withdraw_card", id: card.id, revision: 1 })).toThrow("invalid_card_revision");
  state = reduceRichEvent(state, { request_id: "fixture", sequence: 2, version: 2, type: "section_update", section: sections[0], revision: 1, evidence_snapshot: card.evidenceSnapshot });
  expect(state.cards).toEqual([]); expect(state.sections).toEqual([sections[0]]);
});

it("removes card text on withdrawal and rejects late cards after whole-answer withdrawal", () => {
  let state = reduceRichEvent(emptyRichState(), { request_id: "fixture", sequence: 1, version: 2, type: "source_card", card, revision: 1 });
  state = reduceRichEvent(state, { request_id: "fixture", sequence: 2, version: 2, type: "withdraw_card", id: card.id, revision: 2 });
  expect(state.cards).toEqual([]);
  state = reduceRichEvent(state, { request_id: "fixture", sequence: 3, version: 2, type: "withdraw" });
  expect(() => reduceRichEvent(state, { request_id: "fixture", sequence: 4, version: 2, type: "source_card", card, revision: 3 })).toThrow("invalid_card_event");
});
