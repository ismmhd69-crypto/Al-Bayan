import type { Locale } from "@/lib/i18n";
import type { PipelineDeps } from "./core";
import type { PassageForSelection, QuestionFrame } from "./retrieval";
import { pointSearchPlans } from "./library-flow";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { selectPatientEvidence, assessPatientEvidence, checkPatientSource, patientSelectionNeedsEvidence } from "./patient-models";
import { runPatientResearch, validPatientRetryRequirements, type PatientCheckpoint, type PatientEngineDeps, type PatientResearchResult } from "./patient-engine";
import type { PatientSourceGroup } from "./patient-protocol";
import { originalSection } from "./original-sections";
import { runRichAnswer } from "./rich-engine";
import { recoverEvidence, recoveryQueryKey, type EvidenceGap, type RecoveryQuery } from "./search-engine/recovery";
import { uniqueResearchCandidates } from "./search-engine/candidate-identity";
import { eligibleCorpusCandidates } from "./search-engine/pipeline-corpus";
import { abortable } from "./abort";
import { researchCandidatePool } from "./search-engine/research-candidate-pool";
import { nextResearchProgress, validateResearchProgress, type PatientResearchProgress, type SaveResearchProgress, type ResearchQueryRecord } from "./research-progress";

export type PatientPipelineDeps = PipelineDeps & Pick<PatientEngineDeps, "engineRevision" | "append" | "revalidate">;
const groups: PatientSourceGroup[] = ["quran", "hadith", "scholar"];

/** Real provider/search adapter. No provider is instantiated or invoked on import.
 * The caller supplies a validated, owner-bound question frame and journalled providers. */
export async function runPatientPipeline(input: { jobId: string; question: string; language: Locale; frame: QuestionFrame; checkpoint?: PatientCheckpoint }, deps: PatientPipelineDeps, signal: AbortSignal) {
  const frame = input.frame, stable = input.language !== "de" && process.env.NEXT_PUBLIC_ASK_STABLE_STREAMING === "true";
  if (stable) deps = { ...deps, fixedSelectionReferences: true };
  if (frame.kind !== "question" || frame.clarificationNeeded || frame.checklistStatus && frame.checklistStatus !== "complete") throw new Error("patient_question_requires_clarification");
  if (input.checkpoint?.retryRequirementIds !== undefined && !validPatientRetryRequirements(input.checkpoint.retryRequirementIds, frame)) throw Error("patient_retry_scope_invalid");
  const plans = pointSearchPlans(frame), pools = new Map<PatientSourceGroup, PassageForSelection[]>();
  let discovery = input.checkpoint?.discovery ? validateResearchProgress(input.checkpoint.discovery, frame) : undefined;
  const attempt = input.checkpoint?.attempt ?? 0;
  if (!Number.isSafeInteger(attempt) || attempt < 0) throw Error("patient_research_attempt_invalid");
  const updateDiscovery = async (changes: Parameters<typeof nextResearchProgress>[1], save?: SaveResearchProgress) => {
    if (!save) throw Error("patient_research_checkpoint_required");
    const next = nextResearchProgress(discovery, changes, frame); discovery = next; await save(next);
  };
  const mergeDiscovery = async (incoming: PassageForSelection[], changes: Partial<Pick<PatientResearchProgress, "working" | "queries" | "batches">>, save?: SaveResearchProgress) => {
    const candidates = uniqueResearchCandidates([...incoming, ...discovery?.candidates ?? []]);
    const ids = new Set(candidates.map(p => p.id));
    const batches = Object.fromEntries(Object.entries(changes.batches ?? discovery?.batches ?? {}).filter(([, b]) => b.candidateIds.every(id => ids.has(id))));
    const oldWorking = discovery?.working;
    await updateDiscovery({ ...changes, candidates, batches, working: changes.working !== undefined ? changes.working : oldWorking?.every(p => ids.has(p.id)) ? oldWorking : null }, save);
  };
  const validatedGroups = new Map<PatientSourceGroup, Promise<PassageForSelection[]>>();
  const currentDiscovery = (group: PatientSourceGroup, save?: SaveResearchProgress) => {
    if (!validatedGroups.has(group)) validatedGroups.set(group, (async () => {
      const prior = discovery?.candidates.filter(p => p.source.kind === group) ?? [], valid: PassageForSelection[] = [];
      for (let i = 0; i < prior.length; i += 8) {
        const checked = await Promise.all(prior.slice(i, i + 8).map(async p => group !== "quran" && deps.sourceAvailability?.[group] === false ? null
          : await abortable(deps.revalidate([{ ...p, requirementIds: [], facets: [] }], signal), signal) ? p : null));
        valid.push(...checked.filter((p): p is PassageForSelection => p !== null));
      }
      if (valid.length !== prior.length) {
        const invalid = new Set(prior.filter(p => !valid.some(v => v.id === p.id)).map(p => p.id));
        await updateDiscovery({ candidates: discovery!.candidates.filter(p => !invalid.has(p.id)),
          working: discovery?.working?.filter(p => !invalid.has(p.id)) ?? null,
          batches: Object.fromEntries(Object.entries(discovery?.batches ?? {}).filter(([, b]) => b.candidateIds.every(id => !invalid.has(id)))) }, save);
      }
      return valid;
    })());
    return validatedGroups.get(group)!;
  };
  const needsScholar = (passages: import("./retrieval").SelectedPassage[]) => frame.requirements.some(r => r.facet === "ruling" && r.scope === "case_specific"
    && !passages.some(p => p.source.kind === "scholar" && p.requirementIds.includes(r.id)));
  const searchProblems = new Set<PatientSourceGroup>();
  const context = new Map<string, Promise<PassageForSelection | null>>();
  const addContext = (p: PassageForSelection) => {
    if (p.source.kind !== "quran" || p.context.length) return Promise.resolve(p);
    if (!context.has(p.id)) context.set(p.id, abortable(deps.neighbours(p.source.verse.key), signal).then(rows => ({ ...p, context: rows.filter(v => v.key !== (p.source.kind === "quran" ? p.source.verse.key : "")) })).catch(() => { signal.throwIfAborted(); return null; }));
    return context.get(p.id)!;
  };
  const prepare = async (candidates: PassageForSelection[]) => {
    const unique = uniqueResearchCandidates(candidates);
    return (await Promise.all(unique.map(addContext))).filter((p): p is PassageForSelection => p !== null);
  };
  const search = async (group: PatientSourceGroup, text?: string, requirementId?: string, requirementIds?: string[]): Promise<PassageForSelection[]> => {
    signal.throwIfAborted();
    if (group !== "quran" && deps.sourceAvailability?.[group] === false) throw new Error("patient_source_disabled");
    // Start independent original-text discovery alongside the matching provider. Quran never
    // waits for a hadith/fatwa index, and one slow index family cannot hold another hostage.
    const searchFrame = requirementIds?.length ? { ...frame, requirements: frame.requirements.filter(r => requirementIds.includes(r.id)) } : frame;
    const corpusJob = !text && group !== "quran" && deps.retrieveCorpusCandidates
      ? abortable(deps.retrieveCorpusCandidates(searchFrame, signal, [group]), signal)
        .then(items => eligibleCorpusCandidates(items, deps.sourceAvailability).filter(p => p.source.kind === group))
        .catch(() => {
          signal.throwIfAborted(); searchProblems.add(group);
          deps.onDiagnostic?.("retrieval", `patient_${group}_corpus_failed`, 0); return [] as PassageForSelection[];
        }) : Promise.resolve([] as PassageForSelection[]);
    // The ordered coordinator observes every group. Observe this parallel branch too if
    // cancellation interrupts a different search before it is awaited.
    void corpusJob.catch(() => {});
    const outcomes = await Promise.allSettled(plans.filter(p => (!requirementId || p.id === requirementId) && (!requirementIds?.length || requirementIds.includes(p.id))).map(async (plan): Promise<PassageForSelection[]> => {
      const retrievedFor = [plan.id];
      if (group === "quran") {
        const keys = await abortable(deps.search(text ? [text] : plan.quran, 8), signal);
        const verses = await Promise.all(keys.slice(0, 8).map(key => abortable(deps.getVerse(key), signal)));
        return verses.flatMap(verse => verse ? [{ id: `Q${verse.key}`, source: { kind: "quran" as const, verse }, context: [], retrievedFor }] : []);
      }
      if (group === "hadith") {
        if (!deps.searchHadith) throw new Error("patient_source_disabled");
        const found = await abortable(deps.searchHadith(text ? { [/\p{Script=Arabic}/u.test(text) ? "ar" : "en"]: [text] } : plan.hadith), signal);
        return found.filter(hadithAllowed).map(hadith => ({ id: hadith.id, source: { kind: "hadith" as const, hadith }, context: [], retrievedFor }));
      }
      const queries = text ? [text] : plan.scholar;
      const scholarly = await Promise.allSettled([
        deps.searchScholars ? abortable(deps.searchScholars(queries), signal) : [],
        deps.searchScholarsLive ? abortable(deps.searchScholarsLive(queries), signal) : [],
      ]);
      const quotes = scholarly.flatMap(r => r.status === "fulfilled" ? r.value : []);
      if (scholarly.some(r => r.status === "rejected")) {
        searchProblems.add(group); deps.onDiagnostic?.("retrieval", "patient_scholar_partial_failure", 0);
        if (!quotes.length) throw new Error("patient_scholar_search_failed");
      }
      return quotes.filter(scholarQuoteAllowed).map(quote => ({ id: quote.id, source: { kind: "scholar" as const, quote }, context: [], contextAvailability: "stored_excerpt_only" as const, retrievedFor }));
    }));
    signal.throwIfAborted();
    const batches = outcomes.flatMap(r => r.status === "fulfilled" ? [r.value] : []);
    if (outcomes.some(r => r.status === "rejected")) {
      searchProblems.add(group); deps.onDiagnostic?.("retrieval", `patient_${group}_partial_failure`, 0);
    }
    const corpus = await corpusJob;
    if (searchProblems.has(group) && !batches.some(batch => batch.length) && !corpus.length) throw new Error("patient_source_search_failed");
    const pool = researchCandidatePool(frame, [...batches.flat(), ...corpus], text ? 20 : group === "quran" ? 16 : 60);
    deps.onDiagnostic?.("candidates", `patient_${group}_candidate_pool`, 0,
      { before: pool.before, after: pool.after, missing_requirement_ids: pool.unrepresentedRequirementIds });
    const prepared = await prepare(pool.candidates);
    const allowed = await Promise.all(prepared.map(async p => await abortable(deps.revalidate([{ ...p, requirementIds: [], facets: [] }], signal), signal) ? p : null));
    const usable = allowed.filter((p): p is PassageForSelection => p !== null);
    if (searchProblems.has(group) && !usable.length) throw new Error("patient_source_search_failed");
    return usable;
  };
  return runPatientResearch(input, {
    engineRevision: deps.engineRevision, stableCommits: stable, signal, append: deps.append, revalidate: deps.revalidate,
    research: async (group, _signal, requirementIds, save): Promise<PatientResearchResult> => {
      if (group !== "quran" && deps.sourceAvailability?.[group] === false) return { status: "failed", reason: "source_unavailable" };
      const cached = await currentDiscovery(group, save), batch = discovery?.batches[group];
      const scope = requirementIds?.length ? requirementIds : frame.requirements.map(r => r.id);
      const useCache = batch?.attempt === attempt && JSON.stringify(batch.requirementIds) === JSON.stringify(scope) && batch.candidateIds.every(id => cached.some(p => p.id === id));
      const found = useCache ? batch.candidateIds.map(id => cached.find(p => p.id === id)!) : await search(group, undefined, undefined, requirementIds);
      if (useCache && batch.searchFailed) searchProblems.add(group);
      const previous = input.checkpoint?.research[group];
      const retained = previous?.status === "ready" && await abortable(deps.revalidate(previous.passages, signal), signal) ? previous.passages : [];
      const candidates = researchCandidatePool(frame, [...retained, ...found], 60).candidates; pools.set(group, candidates);
      if (!useCache) await mergeDiscovery(candidates, { working: null, batches: { ...discovery?.batches, [group]: { attempt, requirementIds: [...scope], candidateIds: candidates.map(p => p.id), searchFailed: searchProblems.has(group) } } }, save);
      if (!candidates.length) return { status: "ready", passages: [] };
      const discoveryIdentity = (p: PassageForSelection) => JSON.stringify({ id: p.id, source: p.source, context: p.context, contextAvailability: p.contextAvailability });
      if (retained.length && candidates.length === retained.length && candidates.every(p => retained.some(old => discoveryIdentity(old) === discoveryIdentity(p)))) {
        // A new query tag is not new evidence. Reuse this group's validated
        // contribution map; combined selection still checks every concern.
        return { status: "ready", passages: retained, ...(searchProblems.has(group) ? { searchOutcome: "search_failed" as const } : {}) };
      }
      let rejection: string | undefined;
      const selected = await selectPatientEvidence(frame, candidates, deps, signal, true, code => { rejection = code; });
      if (!selected) {
        if (["no_direct_evidence_with_requirements", "no_direct_evidence_unsafe_context"].includes(rejection ?? "")) {
          return searchProblems.has(group) ? { status: "failed", reason: "source_failed" } : { status: "ready", passages: [] };
        }
        return { status: "failed", reason: "explanation_failed" };
      }
      if (selected.scholarDifference) return { status: "failed", reason: "insufficient_evidence" };
      return { status: "ready", passages: selected.passages, ...(searchProblems.has(group) ? { searchOutcome: "search_failed" as const } : {}) };
    },
    checkSection: async (group, snapshot) => {
      // Checked educational explanations can appear while scholarly research is
      // pending. The writer/checker must not decide the visitor's personal case;
      // required scholarly support still gates the combined final answer below.
      const selected = snapshot.passages.filter(p => p.source.kind === group);
      const sourcePack = { partial: true as const, question: frame, passages: snapshot.passages,
        cards: selected.filter(p => p.source.kind === "quran").map(p => ({ id: `patient-${p.id}`, sourceIds: [p.id], named: false })) };
      const section = stable ? await originalSection(group, sourcePack, input.language, deps, signal)
        : await checkPatientSource(group, sourcePack, input.question, input.language, deps, signal);
      const outcome = snapshot.outcomes?.[group];
      return section.outcome === "ready" && (outcome === "unavailable" || outcome === "search_failed") ? { ...section, searchOutcome: outcome } : section;
    },
    finalReview: async (snapshot, shown, _signal, save) => {
      if (stable && shown.length) {
        // Coverage can accept or refuse the frozen originals. It cannot reselect,
        // recover or redraft a group that readers have already received.
        const originals = snapshot.passages.filter(p => shown.some(s => s.sources.some(source => source.id === p.id)));
        if (needsScholar(originals)) return { status: "needs_attention", reason: "insufficient_evidence",
          requiredGroups: groups.filter(g => !shown.some(s => s.group === g)), withdrawGroups: [] };
        const invalid = new Set<PatientSourceGroup>(), integrityNotices: import("./publication").IntegrityNotice[] = [];
        const frozen = { question: frame, passages: originals, cards: originals.filter(p => p.source.kind === "quran").map(p => ({ id: `patient-${p.id}`, sourceIds: [p.id], named: false })) };
        const conclusion = discovery?.conclusion ?? { drafts: 0, meaningUsed: false, editorialUsed: false };
        const progressiveCheckpoint = { lanes: {}, meaningApprovals: new Set<string>(), retry: 0, conclusion };
        const result = await runRichAnswer(frozen, input.language, { ...deps, progressiveCheckpoint,
          saveConclusion: () => updateDiscovery({ conclusion: structuredClone(conclusion) }, save),
          rich: { onIntegrity: notice => { if (notice.group !== "summary") { invalid.add(notice.group); integrityNotices.push(notice); } } } }, signal, input.question,
          snapshot.outcomes ?? {}, Infinity, { checkedSections: shown, committedSources: true });
        if (result.status !== "rich_answer") return { status: "needs_attention", reason: invalid.size ? "evidence_changed" : "explanation_failed", requiredGroups: [], withdrawGroups: [...invalid], integrityNotices };
        return { status: "complete", summary: result.answer.sections.find(s => s.group === "summary")!, sections: result.answer.sections, guide: result.answer.guide as import("./rich-answer").RichGuidance };
      }
      await Promise.all(groups.map(group => currentDiscovery(group, save)));
      const working = discovery?.working;
      let candidates = working ?? researchCandidatePool(frame, [...snapshot.passages, ...discovery?.candidates ?? [], ...[...pools.values()].flat()]).candidates;
      const assess = async (found: PassageForSelection[]) => {
        await mergeDiscovery(found, { working: found }, save);
        return assessPatientEvidence(frame, found, deps, signal, false, true);
      };
      let selection = await assess(candidates), pack = selection.pack;
      const recordQuery = async (query: RecoveryQuery, status: ResearchQueryRecord["status"], found: PassageForSelection[] = [], queryAttempt = attempt) => {
        const records = (discovery?.queries ?? []).filter(r => !(r.attempt === queryAttempt && recoveryQueryKey(r.query) === recoveryQueryKey(query)));
        records.push({ query, attempt: queryAttempt, status });
        await mergeDiscovery(found, { queries: records, ...(found.length ? { working: null } : {}) }, save);
      };
      const pending = (discovery?.queries ?? []).filter(r => r.status === "planned");
      for (const pendingQuery of pending) {
        const query = pendingQuery.query;
        if (pack || !selection.missingRequirementIds?.includes(query.requirementId) || query.family !== "quran" && deps.sourceAvailability?.[query.family] === false) {
          await recordQuery(query, "superseded", [], pendingQuery.attempt); continue;
        }
        let found: PassageForSelection[];
        try { found = await search(query.family, query.text, query.requirementId); }
        catch { signal.throwIfAborted(); await recordQuery(query, "failed", [], pendingQuery.attempt); continue; }
        await recordQuery(query, "finished", found, pendingQuery.attempt);
        candidates = researchCandidatePool(frame, [...candidates, ...found]).candidates;
        selection = await assess(candidates); pack = selection.pack;
      }
      if (!pack && !patientSelectionNeedsEvidence(selection.rejection)) return { status: "needs_attention", reason: "explanation_failed", requiredGroups: [], withdrawGroups: [] };
      if (!pack && deps.planEvidenceRecovery) {
        const gapState = (state: typeof selection): EvidenceGap[] => !state.pack && !patientSelectionNeedsEvidence(state.rejection) ? [] : frame.requirements.filter(r => state.missingRequirementIds?.includes(r.id))
          .map(r => ({ requirementId: r.id, concern: r.text, reason: "missing_direct_support", families: groups.filter(g => g === "quran" || deps.sourceAvailability?.[g] !== false) }));
        const previousQueries: RecoveryQuery[] = [...(discovery?.queries ?? []).map(r => r.query), ...plans.flatMap(p => [
          ...p.quran.map(text => ({ requirementId: p.id, family: "quran" as const, language: /\p{Script=Arabic}/u.test(text) ? "ar" as const : "en" as const, text })),
          ...p.scholar.map(text => ({ requirementId: p.id, family: "scholar" as const, language: "ar" as const, text })),
          ...(["ar", "en", "de"] as const).flatMap(language => (p.hadith[language] ?? []).map(text => ({ requirementId: p.id, family: "hadith" as const, language, text }))),
        ])];
        const recovered = await recoverEvidence({ frame, initial: selection, candidates, previousQueries, gaps: gapState, plan: deps.planEvidenceRecovery, signal,
          startingRound: Math.max(0, ...(discovery?.recoveryRounds ?? []).map(r => r.round)),
          onRoundStart: round => updateDiscovery({ recoveryRounds: [...(discovery?.recoveryRounds ?? []).filter(r => r.attempt !== attempt), { attempt, round }] }, save),
          search: query => search(query.family, query.text, query.requirementId),
          onPlanned: queries => updateDiscovery({ queries: [...(discovery?.queries ?? []), ...queries.map(query => ({ query, attempt, status: "planned" as const }))] }, save),
          onSearchResult: (query, found, status) => recordQuery(query, status, found),
          assess,
        });
        pack = recovered.value.pack; candidates = recovered.candidates; selection = recovered.value;
      }
      if (!pack && !patientSelectionNeedsEvidence(selection.rejection)) return { status: "needs_attention", reason: "explanation_failed", requiredGroups: [], withdrawGroups: [] };
      if (!pack || pack.scholarDifference) return { status: "needs_attention", reason: "insufficient_evidence", requiredGroups: groups.filter(g => g === "quran" || deps.sourceAvailability?.[g] !== false),
        requiredRequirementIds: selection.missingRequirementIds ?? frame.requirements.map(r => r.id), withdrawGroups: [] };
      if (needsScholar(pack.passages)) return { status: "needs_attention", reason: "insufficient_evidence", requiredGroups: ["scholar"],
        requiredRequirementIds: frame.requirements.filter(r => r.facet === "ruling" && r.scope === "case_specific" && !pack!.passages.some(p => p.source.kind === "scholar" && p.requirementIds.includes(r.id))).map(r => r.id), withdrawGroups: [] };
      const result = await runRichAnswer(pack, input.language, { ...deps, rich: {} }, signal, input.question,
        snapshot.outcomes ?? Object.fromEntries(snapshot.unavailable.map(group => [group, "search_failed"])), Infinity, { checkedSections: shown });
      if (result.status !== "rich_answer") return { status: "needs_attention", reason: "explanation_failed", requiredGroups: [], withdrawGroups: result.withdraw ? shown.map(s => s.group).filter((g): g is PatientSourceGroup => g !== "summary") : [] };
      return { status: "complete", summary: result.answer.sections[3], sections: result.answer.sections, updatedEvidence: pack.passages, guide: result.answer.guide as import("./rich-answer").RichGuidance };
    },
  });
}
