import { expect, it } from "vitest";
import { emptyPublication, reducePublication, presentationStage } from "@/lib/ask/publication";
import { sections } from "./fixtures/rich";
import { emptyRichState, reduceRichEvent, mergeContinuationDisplay, type RichEvent } from "@/lib/ask/rich-answer";
import { emptyPatientState, patientPublication, reducePatientEvent, type PatientEvent } from "@/lib/ask/patient-protocol";
const commit = (index: number) => ({ type: "section_committed" as const, section: sections[index], commit_id: String(index + 1).repeat(64), evidence_snapshot: "a".repeat(64) });
it("keeps a Quran commit intact through later work and exact duplicates", () => {
  const q = reducePublication(emptyPublication(), commit(0));
  expect(reducePublication(q, commit(0))).toBe(q);
  const h = reducePublication(q, commit(1));
  expect(h.groups.quran).toBe(q.groups.quran);
  expect(reducePublication(h, { type: "group_status", group: "quran", status: "searching" })).toBe(h);
});
it("rejects a changed commit instead of clearing or replacing earlier work", () => {
  const q = reducePublication(emptyPublication(), commit(0));
  expect(() => reducePublication(q, { ...commit(0), section: { ...sections[0], claims: [{ ...sections[0].claims[0], text: "A changed sentence." }] } })).toThrow("replacement_forbidden");
  expect(q.groups.quran.section).toEqual(sections[0]);
});
it("retains card and section identity under a targeted integrity notice", () => {
  const q = reducePublication(emptyPublication(), commit(0));
  const invalid = reducePublication(q, { type: "integrity_notice", notice: { group: "quran", claimIndexes: [0], sourceIds: [], reason: "unsupported_claim" } });
  expect(invalid.groups.quran.section).toBe(q.groups.quran.section);
  expect(invalid.groups.quran.status).toBe("blocked");
  expect(invalid.groups.quran.notices[0].claimIndexes).toEqual([0]);
});
it("buffers later groups behind Quran and does not show the conclusion early", () => {
  const h = reducePublication(emptyPublication(), commit(1));
  expect(presentationStage(h, {}, false)).toBe("searching_quran");
  expect(() => reducePublication(h, commit(3))).toThrow("summary_before_resolved_sources");
  const q = reducePublication(h, commit(0));
  expect(presentationStage(q, {}, false)).toBe("streaming_quran");
  expect(presentationStage(q, { quran: true }, false)).toBe("streaming_sunnah");
});
it("advances past an explicitly empty scholar group without inventing a card", () => {
  let state = reducePublication(reducePublication(emptyPublication(), commit(0)), commit(1));
  state = reducePublication(state, { type: "group_status", group: "scholar", status: "empty", section: { group: "scholar", outcome: "no_direct_evidence", claims: [], sources: [] } });
  expect(state.groups.scholar.commitId).toBeUndefined();
  state = reducePublication(state, commit(3));
  expect(presentationStage(state, { quran: true, hadith: true }, true)).toBe("streaming_summary");
  expect(presentationStage(state, { quran: true, hadith: true, summary: true }, true)).toBe("complete");
});
it("isolates requests, rejects destructive legacy events and keeps progress after a commit", () => {
  const event = { ...commit(0), version: 3 as const, request_id: "request-a", sequence: 1 };
  const state = reduceRichEvent(emptyRichState(), event);
  expect(() => reduceRichEvent(state, { ...commit(1), version: 3, request_id: "request-b", sequence: 2 })).toThrow("identity");
  expect(() => reduceRichEvent(state, { type: "withdraw", version: 3, request_id: "request-a", sequence: 2 })).toThrow("unstable_event");
  const next = reduceRichEvent(state, { type: "progress", stage: "understanding", version: 3, request_id: "request-a", sequence: 2 });
  expect(next.sections[0]).toEqual(sections[0]);
  expect(next.publication).toBe(state.publication);
});
it("merges an explicit continuation without replacing the earlier committed section", () => {
  const first = reduceRichEvent(emptyRichState(), { ...commit(0), version: 3, request_id: "first", sequence: 1 });
  const event: RichEvent = { ...commit(1), version: 3, request_id: "second", sequence: 1 };
  const second = reduceRichEvent(emptyRichState(), event);
  expect(mergeContinuationDisplay(first, second, event).sections.map(s => s.group)).toEqual(["quran", "hadith"]);
});
it("applies the same publication rules to patient transport snapshots", () => {
  let state = emptyPatientState("00000000-0000-4000-8000-000000000001", "en");
  state.groups.quran = { state: "ready", revision: 1, evidenceRevision: 1, section: sections[0] };
  state = { ...state, publication: patientPublication(state) };
  state.groups.quran = { ...state.groups.quran, state: "needs_attention", section: undefined, reason: "evidence_changed" };
  const publication = patientPublication(state);
  expect(publication.groups.quran.section).toEqual(sections[0]);
  expect(publication.groups.quran.notices[0].sourceIds).toEqual(sections[0].sources.map(s => s.id));
});
it("keeps a patient source card when a precise late notice rejects only its explanation", () => {
  let state = emptyPatientState("00000000-0000-4000-8000-000000000001", "en");
  state.groups.quran = { state: "ready", revision: 1, evidenceRevision: 1, section: sections[0] };
  state = { ...state, publication: patientPublication(state) };
  state.groups.quran = { ...state.groups.quran, state: "needs_attention", section: undefined, reason: "evidence_changed",
    integrity: { group: "quran", reason: "unsupported_claim", claimIndexes: [0], sourceIds: [] } };
  const slot = patientPublication(state).groups.quran;
  expect(slot.section).toEqual(sections[0]); expect(slot.notices[0].claimIndexes).toEqual([0]); expect(slot.notices[0].sourceIds).toEqual([]);
});
it("makes exact patient commit redelivery harmless and rejects conflicting duplicates", () => {
  const initial = emptyPatientState("00000000-0000-4000-8000-000000000001", "en");
  const event: PatientEvent = { version: 2, job_id: initial.jobId, sequence: 1, type: "section", section: sections[0], revision: 1, evidence_revision: 1 };
  const state = reducePatientEvent(initial, event), published = { ...state, publication: patientPublication(state) };
  expect(reducePatientEvent(published, event)).toBe(published);
  expect(() => reducePatientEvent(published, { ...event, section: { ...sections[0], claims: [{ ...sections[0].claims[0], text: "Different checked wording" }] } })).toThrow("replacement");
});
