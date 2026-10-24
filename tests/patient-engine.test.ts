import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runPatientResearch, type PatientEngineDeps } from "@/lib/ask/patient-engine";
import { emptyPatientState, reducePatientEvent, type PatientEvent } from "@/lib/ask/patient-protocol";
import { pack, sections } from "./fixtures/rich";

const id = "00000000-0000-4000-8000-000000000019";
const currentSection = (group: string) => {
  const section = structuredClone(sections.find(s => s.group === group)!);
  section.sources = section.sources.map(source => ({ ...source, role: "direct", requirementIds: ["R1"], explanationRequirementIds: [] }));
  return section;
};
function setup() {
  const events: PatientEvent[] = [];
  const deps: PatientEngineDeps = {
    engineRevision: "a".repeat(64), signal: new AbortController().signal,
    research: vi.fn<PatientEngineDeps["research"]>(async group => ({ status: "ready", passages: structuredClone(pack.passages.filter(p => p.source.kind === group)) })),
    revalidate: vi.fn(async () => true),
    checkSection: vi.fn(async group => currentSection(group)),
    finalReview: vi.fn<PatientEngineDeps["finalReview"]>(async () => ({ status: "complete", summary: currentSection("summary"), guide: { text: "Read the cited explanation of care.", kind: "learning", refs: [] } })),
    append: vi.fn(async event => { events.push(structuredClone(event)); }),
  };
  return { deps, events };
}

describe("patient staged coordinator, invented sources only", () => {
  it("publishes Quran and Sunnah before a delayed scholar search resolves", async () => {
    const { deps, events } = setup(), research = deps.research;
    let release!: () => void, scholarDone = false;
    const delayed = new Promise<void>(resolve => { release = resolve; });
    deps.research = async (group, signal) => {
      if (group === "scholar") { await delayed; scholarDone = true; }
      return research(group, signal);
    };
    deps.append = async event => {
      events.push(event);
      if (event.type === "section" && event.section.group === "hadith") { expect(scholarDone).toBe(false); release(); }
    };
    const checkpoint = await runPatientResearch({ jobId: id, language: "en" }, deps);
    expect(checkpoint.state.status).toBe("complete");
    expect(events.filter(e => e.type === "section").map(e => e.section.group)).toEqual(["quran", "hadith", "scholar", "summary"]);
    expect(events.map(e => e.sequence)).toEqual(events.map((_, i) => i + 1));
  });
  it("pauses on a necessary scholar failure and resumes only its unfinished research", async () => {
    const { deps, events } = setup(), research = deps.research;
    deps.research = vi.fn<PatientEngineDeps["research"]>(async (group, signal) => group === "scholar" ? { status: "failed", reason: "source_failed" } : research(group, signal));
    deps.finalReview = async () => ({ status: "needs_attention", reason: "source_failed", requiredGroups: ["scholar"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, deps);
    expect(paused.state.status).toBe("paused");
    expect(paused.state.groups.quran.section).toBeDefined(); expect(paused.state.groups.hadith.section).toBeDefined();
    expect(paused.state.answer).toBeUndefined();
    const next = setup(); next.deps.append = deps.append;
    const completed = await runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps);
    expect(completed.state.status).toBe("complete");
    expect(vi.mocked(next.deps.research).mock.calls.map(([group]) => group)).toEqual(["scholar"]);
    expect(vi.mocked(next.deps.checkSection).mock.calls.map(([group]) => group)).toEqual(["scholar"]);
    let state = emptyPatientState(id, "en"); for (const event of events) state = reducePatientEvent(state, event);
    expect(state.status).toBe("complete");
  });
  it("withdraws earlier material when late combined checking finds a lost qualification", async () => {
    const { deps, events } = setup();
    deps.finalReview = async () => ({ status: "needs_attention", reason: "evidence_changed", requiredGroups: ["quran"], withdrawGroups: ["quran"] });
    const result = await runPatientResearch({ jobId: id, language: "en" }, deps);
    expect(result.state.status).toBe("paused"); expect(result.state.groups.quran.section).toBeUndefined();
    expect(events).toContainEqual(expect.objectContaining({ type: "withdraw", group: "quran" }));
    expect(events.some(e => e.type === "terminal")).toBe(false);
  });
  it("retries a necessary evidence gap after a successful but insufficient search", async () => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps);
    expect(paused.state.groups.scholar.section).toBeDefined();
    expect(paused.research.scholar?.status).toBe("ready");
    expect(paused.retryGroups).toEqual(["scholar"]);
    expect(paused.research.scholar?.status === "ready" && paused.research.scholar.passages).toEqual(pack.passages.filter(p => p.source.kind === "scholar"));
    const next = setup();
    const result = await runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps);
    expect(result.state.status).toBe("complete");
    expect(vi.mocked(next.deps.research).mock.calls.map(([group]) => group)).toEqual(["scholar"]);
    expect(vi.mocked(next.deps.checkSection).mock.calls.map(([group]) => group)).toEqual([]);
    expect(next.events.some(e => e.type === "withdraw")).toBe(false);
    expect(result.retryGroups).toEqual([]);
  });
  it("does not silently reuse a checkpoint from a different engine or owner job", async () => {
    const { deps } = setup();
    const checkpoint = { version: 2 as const, engineRevision: "b".repeat(64), state: emptyPatientState(id, "en"), evidenceRevision: 1, research: {} };
    await expect(runPatientResearch({ jobId: id, language: "en", checkpoint }, deps)).rejects.toThrow("invalid_patient_checkpoint");
  });
  it.each(["failed", "empty"])("preserves eligible checked evidence after a %s recovery and resumes only that group", async outcome => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps), before = structuredClone(paused);
    const next = setup();
    next.deps.research = vi.fn(async () => outcome === "failed" ? { status: "failed" as const, reason: "source_failed" as const } : { status: "ready" as const, passages: [] });
    next.deps.finalReview = async snapshot => {
      expect(snapshot.passages.map(p => p.id)).toEqual(pack.passages.map(p => p.id));
      if (outcome === "failed") expect(snapshot.unavailable).toContain("scholar");
      return { status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] };
    };
    const result = await runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps);
    expect(paused).toEqual(before);
    expect(result.state.status).toBe("paused");
    expect(result.retryGroups).toEqual(["scholar"]);
    expect(result.research.scholar?.status === "ready" && result.research.scholar.passages).toEqual(pack.passages.filter(p => p.source.kind === "scholar"));
    expect(result.state.groups.scholar.section).toEqual(before.state.groups.scholar.section);
    expect(vi.mocked(next.deps.research).mock.calls.map(([group]) => group)).toEqual(["scholar"]);
    expect(next.events.some(e => e.type === "withdraw" || e.type === "terminal")).toBe(false);
    expect(next.deps.revalidate).toHaveBeenCalledWith(pack.passages.filter(p => p.source.kind === "scholar"), next.deps.signal);
  });

  it("rechecks a changed recovery revision instead of carrying the old explanation into new context", async () => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps);
    const next = setup(), original = pack.passages.find(p => p.source.kind === "scholar")!, quran = pack.passages[0].source;
    if (quran.kind !== "quran") throw Error("fixture");
    const revised = { ...original, context: [quran.verse] };
    next.deps.research = vi.fn(async () => ({ status: "ready" as const, passages: [revised] }));
    next.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] });
    const result = await runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps);
    expect(next.events).toContainEqual(expect.objectContaining({ type: "withdraw", group: "scholar" }));
    expect(vi.mocked(next.deps.checkSection).mock.calls.map(([group]) => group)).toEqual(["scholar"]);
    expect(result.research.scholar?.status === "ready" && result.research.scholar.passages).toEqual([revised]);
    expect(result.evidenceRevision).toBeGreaterThan(paused.evidenceRevision);
  });

  it("still withdraws revoked earlier evidence before attempting recovery", async () => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps), next = setup();
    next.deps.revalidate = vi.fn<PatientEngineDeps["revalidate"]>(async passages => passages.every(p => p.source.kind !== "scholar"));
    next.deps.research = vi.fn(async () => ({ status: "failed" as const, reason: "source_unavailable" as const }));
    next.deps.finalReview = async snapshot => {
      expect(snapshot.passages.every(p => p.source.kind !== "scholar")).toBe(true);
      return { status: "needs_attention", reason: "source_unavailable", requiredGroups: ["scholar"], withdrawGroups: [] };
    };
    const result = await runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps);
    expect(result.state.groups.scholar.section).toBeUndefined();
    expect(next.events).toContainEqual(expect.objectContaining({ type: "withdraw", group: "scholar", reason: "evidence_changed" }));
  });

  it("propagates uncertain paid outcomes without another attempt or erasing prior evidence", async () => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps), next = setup(), before = structuredClone(paused);
    next.deps.research = vi.fn(async () => { throw Object.assign(Error("mock uncertain billing"), { name: "ModelReconciliationRequired" }); });
    await expect(runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps)).rejects.toMatchObject({ name: "ModelReconciliationRequired" });
    expect(next.deps.research).toHaveBeenCalledTimes(1); expect(next.deps.finalReview).not.toHaveBeenCalled();
    expect(paused).toEqual(before);
  });

  it("rejects unknown or repeated retry groups before emitting or researching", async () => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: [], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps);
    for (const retryGroups of [["summary"], ["scholar", "scholar"]]) {
      const next = setup();
      await expect(runPatientResearch({ jobId: id, language: "en", checkpoint: { ...paused, retryGroups } as typeof paused }, next.deps)).rejects.toThrow("invalid_patient_checkpoint");
      expect(next.deps.append).not.toHaveBeenCalled(); expect(next.deps.research).not.toHaveBeenCalled();
    }
  });
  it.each([false, true])("carries missing-point scope forward, broadening it when earlier evidence is revoked=%s", async revoked => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], requiredRequirementIds: ["R2"], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps);
    expect(paused.retryRequirementIds).toEqual(["R2"]);
    const next = setup(), revalidate = next.deps.revalidate;
    if (revoked) next.deps.revalidate = async (passages, signal) => passages.some(p => p.source.kind === "scholar") ? false : revalidate(passages, signal);
    next.deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"], requiredRequirementIds: ["R2"], withdrawGroups: [] });
    await runPatientResearch({ jobId: id, language: "en", checkpoint: paused }, next.deps);
    expect(vi.mocked(next.deps.research).mock.calls.map(([group, _signal, scope]) => ({ group, scope }))).toEqual([{ group: "scholar", scope: revoked ? undefined : ["R2"] }]);
  });

  it("rejects malformed persisted missing-point scopes before any retry", async () => {
    const first = setup();
    first.deps.finalReview = async () => ({ status: "needs_attention", reason: "explanation_failed", requiredGroups: [], withdrawGroups: [] });
    const paused = await runPatientResearch({ jobId: id, language: "en" }, first.deps);
    for (const retryRequirementIds of [["R9"], ["R1", "R1"]]) {
      const next = setup();
      await expect(runPatientResearch({ jobId: id, language: "en", checkpoint: { ...paused, retryRequirementIds } }, next.deps)).rejects.toThrow("invalid_patient_checkpoint");
      expect(next.deps.research).not.toHaveBeenCalled(); expect(next.deps.append).not.toHaveBeenCalled();
    }
  });
  it("never accepts a fabricated full summary after the final checker requests attention", async () => {
    const { deps, events } = setup();
    deps.finalReview = async () => ({ status: "needs_attention", reason: "insufficient_evidence", requiredGroups: [], withdrawGroups: [] });
    expect((await runPatientResearch({ jobId: id, language: "en" }, deps)).state.status).toBe("paused");
    expect(events.some(e => e.type === "section" && e.section.group === "summary")).toBe(false);
  });
});
