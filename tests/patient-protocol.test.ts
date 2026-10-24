import { describe, expect, it } from "vitest";
import { emptyPatientState, reducePatientEvent, type PatientEventBody, type PatientState } from "@/lib/ask/patient-protocol";
import { sections, richAnswer } from "./fixtures/rich";
const id = "00000000-0000-4000-8000-000000000001";
const initial = () => emptyPatientState(id, "en");
const apply = (state: PatientState, body: PatientEventBody) => reducePatientEvent(state, { ...body, version: 2, job_id: id, sequence: state.sequence + 1 });
const source = (group: string) => structuredClone(sections.find(s => s.group === group)!);
describe("patient protocol integrity", () => {
  it("replays private research metadata without treating discovery as an answer", () => {
    const state = apply(initial(), { type: "research_checkpoint", revision: 1, hash: "a".repeat(64) });
    expect(state.researchRevision).toBe(1); expect(state.groups).toEqual(initial().groups);
    expect(state.answer).toBeUndefined(); expect(state.status).toBe("working");
    expect(initial()).not.toHaveProperty("researchRevision");
    expect(() => apply(state, { type: "research_checkpoint", revision: 1, hash: "b".repeat(64) })).toThrow();
    expect(() => apply(state, { type: "research_checkpoint", revision: 2, hash: "invalid" })).toThrow();
    const paused = apply(state, { type: "pause", reason: "source_failed" });
    expect(() => apply(paused, { type: "research_checkpoint", revision: 2, hash: "b".repeat(64) })).toThrow();
  });
  it("rejects out-of-order source delivery and false completion", () => {
    expect(() => apply(initial(), { type: "section", section: source("hadith"), revision: 1, evidence_revision: 1 })).toThrow("order");
    expect(() => apply(initial(), { type: "terminal", status: "complete", answer: richAnswer })).toThrow("completion");
    expect(() => apply(initial(), { type: "state", group: "quran", state: "ready" })).toThrow("state");
  });
  it("requires explicit resume before a paused job can publish more content", () => {
    const paused = apply(initial(), { type: "pause", reason: "source_failed" });
    expect(() => apply(paused, { type: "state", group: "quran", state: "checking" })).toThrow("resume");
    expect(apply(paused, { type: "resume" }).status).toBe("working");
  });
  it("withdraws the original and synthesis and requires increasing revisions", () => {
    let state = initial();
    for (const section of sections) state = apply(state, { type: "section", section, revision: 1, evidence_revision: 1 });
    state = apply(state, { type: "withdraw", group: "quran", revision: 2, reason: "evidence_changed" });
    expect(state.groups.quran.section).toBeUndefined();
    expect(state.groups.summary.section).toBeUndefined();
    expect(() => apply(state, { type: "section", section: source("quran"), revision: 2, evidence_revision: 1 })).toThrow("revision");
    expect(apply(state, { type: "section", section: source("quran"), revision: 3, evidence_revision: 2 }).groups.quran.state).toBe("ready");
  });
  it("does not permit a terminal result to change a previously delivered claim", () => {
    let state = initial();
    for (const section of sections) state = apply(state, { type: "section", section, revision: 1, evidence_revision: 1 });
    const changed = structuredClone(richAnswer);
    changed.sections[0].claims[0].text = "Changed religious conclusion.";
    expect(() => apply(state, { type: "terminal", status: "complete", answer: changed })).toThrow("changed_section");
  });
});
