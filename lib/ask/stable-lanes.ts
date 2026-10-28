import { createHash } from "node:crypto";
import type { PipelineDeps, AskResult } from "./core";
import type { EvidencePackage, PassageForSelection, QuestionFrame } from "./retrieval";
import type { RichGroup, RichSection } from "./rich-answer";
import { RICH_ORDER } from "./rich-answer";
import { pointSearchPlans } from "./library-flow";
import { selectPatientEvidence, patientSelectionNeedsEvidence } from "./patient-models";
import { uniqueResearchCandidates } from "./search-engine/candidate-identity";
import { researchCandidatePool } from "./search-engine/research-candidate-pool";
import { eligibleCorpusCandidates } from "./search-engine/pipeline-corpus";
import { discoverAdjacentQuranCandidates } from "./search-engine/adjacent-quran-discovery";
import { novelRecoveryQueries, type RecoveryQuery } from "./search-engine/recovery";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { withModelPriority } from "@/lib/ai/transport";
import { abortable, isTimeoutFailure } from "./abort";
import { runRichAnswer } from "./rich-engine";
import { CONTINUATION_LIMITS } from "./continuation-session";
import { resolveHadithHints } from "./hadith-hints";
import { researchFailure } from "./research-failure";
import { originalSection } from "./original-sections";

type Group = "quran" | "hadith" | "scholar";
type Hints = { quran: string[]; hadith: string[]; scholars: string[] };
const groups: Group[] = ["quran", "hadith", "scholar"];
const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
type Settled = { section: RichSection; pack?: EvidencePackage; snapshot: string; invalid?: boolean; rejectedIds?: string[] };

/** Research may overlap. Checked publications are immutable and never used as drafts. */
export async function runStableLanes(question: string, frame: QuestionFrame, original: PipelineDeps, signal: AbortSignal, hints: Hints): Promise<AskResult> {
  const checkpoint = original.progressiveCheckpoint;
  if (checkpoint) { checkpoint.frame = structuredClone(frame); checkpoint.stable ??= {}; }
  const settled = new Map<Group, Settled>(), plans = pointSearchPlans(frame);
  let mappedHadith: Promise<Awaited<ReturnType<typeof resolveHadithHints>>> | undefined;
  const partialSearch = new Map<Group, "timeout" | "search_failed">(), unavailableRechecks = new Set<Group>();
  let calls = 0, tokens = 0;
  const corrected = new Set<RichGroup>();
  const failures = new Map<Group, import("./rich-answer").RichFailureKind>();
  // One allowance for the answer, including Continue, rather than two per lane.
  const rounds = checkpoint ? (checkpoint.recoveryRounds ??= {}) : {};
  const recoveryUsed = () => Object.values(rounds).reduce((total, value) => total + (value ?? 0), 0);
  const rankingJobs = new Map<string, Promise<PassageForSelection[]>>();
  const budget = (provider: PipelineDeps["writer"]) => ({ id: provider.id, generateJson: async (request: Parameters<typeof provider.generateJson>[0]) => {
    signal.throwIfAborted();
    let repair: RichGroup[] = [];
    try { const input = JSON.parse(request.prompt); if (input.correction) repair = input.sections_to_write ?? []; } catch { /* Strict downstream parsers own non-JSON tasks. */ }
    const output = request.maxOutputTokens ?? 2048;
    if (++calls > CONTINUATION_LIMITS.calls || (tokens += output) > CONTINUATION_LIMITS.outputTokens || repair.some(g => g !== "summary" && corrected.has(g))) throw Error("stable_research_budget_exhausted");
    repair.filter(g => g !== "summary").forEach(g => corrected.add(g));
    return provider.generateJson({ ...request, signal: request.signal ? AbortSignal.any([signal, request.signal]) : signal });
  } });
  const deps: PipelineDeps = { ...original, writer: budget(original.writer), verifier: budget(original.verifier), deriveAuditReasons: true, meaningReview: true, fixedSelectionReferences: true,
    meaningRankCandidates: original.meaningRankCandidates ? async (rankingFrame, candidates, rankingSignal) => {
      rankingSignal.throwIfAborted();
      const key = hash({ frame: rankingFrame, candidates });
      let job = rankingJobs.get(key);
      if (!job) {
        job = Promise.resolve().then(() => original.meaningRankCandidates!(rankingFrame, candidates, rankingSignal))
          .then(result => structuredClone(result)).catch(error => { rankingJobs.delete(key); throw error; });
        rankingJobs.set(key, job);
      } else original.onDiagnostic?.("candidates", "stable_identical_ranking_reused", 0, { count: candidates.length });
      return structuredClone(await abortable(job, rankingSignal));
    } : undefined,
    onDiagnostic: (stage, code, elapsed, details) => {
      const d = details as { group?: Group; failure_kind?: import("./rich-answer").RichFailureKind } | undefined;
      if (code === "patient_source_failure" && d?.group && d.failure_kind) failures.set(d.group, d.failure_kind);
      original.onDiagnostic?.(stage, code, elapsed, details);
    },
    meaningApprovals: checkpoint?.meaningApprovals ?? original.meaningApprovals ?? new Set() };
  const publish = (group: Group, value: Settled) => {
    signal.throwIfAborted(); settled.set(group, value);
    if (checkpoint) checkpoint.stable![group] = structuredClone(value);
    deps.rich?.onSection?.(value.section, value.snapshot);
  };
  const candidatesFor = async (group: Group, recovery?: RecoveryQuery[]): Promise<PassageForSelection[]> => {
    const work: { id: string; quran: string[]; scholar: string[]; hadith: Partial<Record<"en" | "ar" | "de", string[]>> }[] = recovery ? plans.filter(p => recovery.some(q => q.requirementId === p.id)).map(p => {
      const qs = recovery.filter(q => q.requirementId === p.id);
      return { ...p, quran: qs.map(q => q.text), scholar: qs.map(q => q.text), hadith: Object.fromEntries((["ar", "en", "de"] as const).map(language => [language, qs.filter(q => q.language === language).map(q => q.text)])) };
    }) : plans;
    const lists = await Promise.allSettled(work.map(async (plan): Promise<PassageForSelection[]> => {
      if (group === "quran") {
        const found = await abortable(deps.search(plan.quran, 16), signal);
        const keys = [...new Set([...hints.quran, ...found])].slice(0, 16);
        const verses = await Promise.allSettled(keys.map(key => abortable(deps.getVerse(key), signal)));
        return verses.flatMap(v => v.status === "fulfilled" && v.value ? [{ id: `Q${v.value.key}`, source: { kind: "quran" as const, verse: v.value }, context: [], retrievedFor: [plan.id] }] : []);
      }
      if (group === "hadith") {
        const hits = deps.searchHadith ? await abortable(deps.searchHadith(plan.hadith), signal) : [];
        const mapped = await (mappedHadith ??= resolveHadithHints(deps, hints.hadith, signal));
        return [...new Map([...mapped, ...hits].filter(hadithAllowed).map(h => [h.id, h])).values()].slice(0, 8)
          .map(hadith => ({ id: hadith.id, source: { kind: "hadith" as const, hadith }, context: [], retrievedFor: [plan.id] }));
      }
      const sources = await Promise.allSettled([
        ...(deps.searchScholars ? [abortable(deps.searchScholars(plan.scholar, hints.scholars), signal)] : []),
        ...(recovery && deps.searchScholarsLive ? [abortable(deps.searchScholarsLive(plan.scholar), signal)] : []),
      ]);
      if (sources.length && sources.every(s => s.status === "rejected")) throw Error("scholar_source_unavailable");
      return sources.flatMap(s => s.status === "fulfilled" ? s.value : []).filter(scholarQuoteAllowed).slice(0, 8)
        .map(quote => ({ id: quote.id, source: { kind: "scholar" as const, quote }, context: [], contextAvailability: "stored_excerpt_only" as const, retrievedFor: [plan.id] }));
    }));
    signal.throwIfAborted();
    if (lists.some(v => v.status === "rejected")) partialSearch.set(group, lists.some(v => v.status === "rejected" && isTimeoutFailure(v.reason)) ? "timeout" : "search_failed");
    if (lists.length && lists.every(v => v.status === "rejected")) throw (lists[0] as PromiseRejectedResult).reason;
    let pool = uniqueResearchCandidates(lists.flatMap(v => v.status === "fulfilled" ? v.value : []));
    if (!recovery && group !== "quran" && deps.retrieveCorpusCandidates) {
      try {
        const corpus = await abortable(deps.retrieveCorpusCandidates(frame, signal, [group]), signal);
        pool = uniqueResearchCandidates([...pool, ...eligibleCorpusCandidates(corpus, deps.sourceAvailability).filter(p => p.source.kind === group)]);
      } catch (error) { signal.throwIfAborted(); partialSearch.set(group, isTimeoutFailure(error) ? "timeout" : "search_failed"); }
    }
    if (group === "quran") {
      const priority = deps.meaningRankCandidates ? await deps.meaningRankCandidates(frame, pool, signal) : pool;
      const adjacent = await discoverAdjacentQuranCandidates(pool, key => abortable(deps.getVerse(key), signal), signal, undefined, priority.map(p => p.id));
      pool = uniqueResearchCandidates([...pool, ...adjacent]);
      const withContext = await Promise.allSettled(pool.map(async p => p.source.kind === "quran"
        ? { ...p, context: (await abortable(deps.neighbours(p.source.verse.key), signal)).filter(v => v.key !== (p.source.kind === "quran" ? p.source.verse.key : "")) } : p));
      if (withContext.length && withContext.every(p => p.status === "rejected")) throw Error("required_context_unavailable");
      pool = withContext.flatMap(p => p.status === "fulfilled" ? [p.value] : []);
      if (deps.namedEvidencePassages?.some(unit => !unit.every(id => pool.some(p => p.id === id)))) throw Error("named_evidence_incomplete");
    }
    return researchCandidatePool(frame, pool, 30).candidates;
  };
  await Promise.all(groups.map(group => withModelPriority(groups.indexOf(group) * 2, async () => {
    const prior = checkpoint?.stable?.[group];
    if (prior?.section.outcome === "ready" && prior.pack) {
      let recheck: { unavailable: boolean; rejectedIds: string[] } = { unavailable: true, rejectedIds: [] };
      const originals = prior.pack.passages.filter(p => prior.section.sources.some(s => s.id === p.id));
      try { recheck = deps.revalidateStable ? await deps.revalidateStable(originals, signal)
        : { unavailable: !deps.revalidateProgressive || !await deps.revalidateProgressive(originals, signal), rejectedIds: [] }; } catch { signal.throwIfAborted(); }
      publish(group, prior);
      if (recheck.unavailable) {
        unavailableRechecks.add(group);
        failures.set(group, "source_revalidation_unavailable");
        deps.onDiagnostic?.("retrieval", "stable_source_recheck_unavailable", 0, { group, failure_kind: "source_revalidation_unavailable" });
      }
      if (recheck.rejectedIds.length || prior.invalid) {
        const rejectedIds = [...new Set([...prior.rejectedIds ?? [], ...recheck.rejectedIds])];
        prior.invalid = true; prior.rejectedIds = rejectedIds;
        if (checkpoint) Object.assign(checkpoint.stable![group]!, { invalid: true, rejectedIds });
        if (checkpoint) checkpoint.integrityBlocked = true;
        failures.set(group, "source_support");
        deps.onDiagnostic?.("retrieval", "stable_source_recheck_changed", 0, { group, source_ids: rejectedIds });
        Object.assign(settled.get(group)!, { invalid: true, rejectedIds });
        deps.rich?.onIntegrity?.({ group, claimIndexes: [], sourceIds: rejectedIds.length ? rejectedIds : prior.section.sources.map(s => s.id), reason: "source_changed" });
      }
      return;
    }
    deps.rich?.onGroupStatus?.(group, "searching");
    try {
      if (group !== "quran" && deps.sourceAvailability?.[group] === false) {
        const section: RichSection = { group, outcome: "unavailable", claims: [], sources: [] }; publish(group, { section, snapshot: hash(section) }); return;
      }
      let pool: PassageForSelection[] = [], rejection: string | undefined;
      try { pool = await candidatesFor(group); } catch (error) { signal.throwIfAborted(); partialSearch.set(group, isTimeoutFailure(error) ? "timeout" : "search_failed"); }
      deps.rich?.onGroupStatus?.(group, "checking");
      let pack = await selectPatientEvidence(frame, pool, deps, signal, true, code => { rejection = code; });
      const visited = checkpoint ? (checkpoint.visitedSources ??= {}) : {};
      visited[group] = [...new Set([...(visited[group] ?? []), ...pool.map(p => p.id)])];
      while (!pack && patientSelectionNeedsEvidence(rejection)
        && deps.planEvidenceRecovery && recoveryUsed() < 2) {
        const gaps = frame.requirements.map(r => ({ requirementId: r.id, concern: r.text, reason: "missing_direct_support" as const, families: [group] }));
        const previous = [...checkpoint?.recoveryQueries ?? [], ...plans.flatMap(p => (group === "quran" ? p.quran : group === "scholar" ? p.scholar : Object.values(p.hadith).flat()).map(text => ({ requirementId: p.id, family: group, language: /\p{Script=Arabic}/u.test(text) ? "ar" as const : "en" as const, text })))];
        // Reserve synchronously before awaiting the planner so parallel lanes
        // cannot each claim the same remaining round.
        const round = recoveryUsed() + 1;
        rounds[group] = (rounds[group] ?? 0) + 1;
        deps.onDiagnostic?.("retrieval", "stable_recovery_started", 0, { round, group });
        const queries = novelRecoveryQueries(await deps.planEvidenceRecovery({ frame, gaps, previousQueries: previous, visitedSources: visited[group]!, round }, signal), gaps, previous)
          .filter(q => frame.language === "de" || q.language !== "de");
        if (queries.length) {
          if (checkpoint) checkpoint.recoveryQueries = [...checkpoint.recoveryQueries ?? [], ...queries];
          const priorPool = hash(pool);
          pool = researchCandidatePool(frame, uniqueResearchCandidates([...pool, ...await candidatesFor(group, queries)]), 30).candidates;
          visited[group] = [...new Set([...(visited[group] ?? []), ...pool.map(p => p.id)])];
          if (hash(pool) === priorPool) {
            deps.onDiagnostic?.("retrieval", "stable_recovery_candidates_unchanged", 0, { group, round });
            continue;
          }
          const priorPack = pack;
          let recoveryRejection: string | undefined;
          const recovered = await selectPatientEvidence(frame, pool, deps, signal, true, code => { recoveryRejection = code; });
          // A valid earlier background contribution remains available after an
          // ordinary evidence gap. Never hide a new unsafe/invalid assessment.
          pack = recovered ?? (priorPack && patientSelectionNeedsEvidence(recoveryRejection) ? priorPack : null);
          rejection = recoveryRejection;
        }
        else break;
      }
      if (!pack || pack.scholarDifference) {
        const invalid = !pack && !!rejection && !patientSelectionNeedsEvidence(rejection);
        if (invalid) failures.set(group, "selection_failure");
        const section: RichSection = { group, outcome: invalid ? "failed_check" : partialSearch.get(group) ?? "no_direct_evidence", claims: [], sources: [],
          ...(invalid ? { searchFailureStage: "evidence_selection" as const } : partialSearch.has(group) ? { searchFailureStage: "source_search" as const } : {}) }; publish(group, { section, snapshot: hash(section) }); return;
      }
      const checked = await originalSection(group, pack, frame.language, deps, signal);
      const section: RichSection = { ...checked, ...(partialSearch.has(group) && checked.outcome === "ready" ? { searchOutcome: partialSearch.get(group), searchFailureStage: "source_search" as const } : {}) };
      publish(group, { section, pack: structuredClone(pack), snapshot: hash({ frame, question, pack, section }) });
    } catch (error) {
      signal.throwIfAborted();
      failures.set(group, researchFailure(error));
      const section: RichSection = { group, outcome: isTimeoutFailure(error) ? "timeout" : "search_failed", claims: [], sources: [], searchFailureStage: "source_search" };
      publish(group, { section, snapshot: hash(section) });
    }
  })));
  signal.throwIfAborted();
  const ordered = () => groups.map(g => settled.get(g)!.section);
  const ready = groups.flatMap(g => { const v = settled.get(g)!; return v.section.outcome === "ready" && v.pack && !v.invalid ? [v] : []; });
  const incomplete = (): AskResult => {
    const failureKind = unavailableRechecks.size ? "source_revalidation_unavailable" : failures.values().next().value ?? "question_coverage";
    deps.onDiagnostic?.("answer", "stable_summary_blocked", 0, { failure_kind: failureKind });
    return { status: "incomplete", language: frame.language, withdraw: false, sections: ordered(), failureKind };
  };
  if (!ready.length || unavailableRechecks.size || [...settled.values()].some(v => v.invalid)) return incomplete();
  // Source lanes have already selected safe contributions. Assess the generated
  // summary's full coverage against their unchanged originals, not a second
  // selector's prediction about an answer that has not yet been written.
  const passages = ready.flatMap(v => v.pack!.passages.filter(p => v.section.sources.some(s => s.id === p.id)));
  const frozen: EvidencePackage = { question: frame, passages, cards: ready.flatMap(v => v.pack!.cards),
    contributionPlan: ready.flatMap(v => v.pack!.contributionPlan ?? []) };
  const result = await runRichAnswer(frozen, frame.language, { ...deps, rich: { ...deps.rich,
    onIntegrity: notice => { if (checkpoint) checkpoint.integrityBlocked = true; deps.rich?.onIntegrity?.(notice); },
    onSection: (section, snapshot) => { if (section.group === "summary" && section.outcome === "ready") deps.rich?.onSection?.(section, snapshot); },
    onWithdraw: () => {},
  } }, signal, question, Object.fromEntries(groups.map(g => [g, settled.get(g)!.section.outcome])), Infinity,
  { checkedSections: ready.map(v => v.section), committedSources: true });
  if (result.status !== "rich_answer") return { ...result, withdraw: false, sections: ordered() };
  const summary = result.answer.sections.find(s => s.group === "summary")!;
  return { ...result, answer: { ...result.answer, sections: [...ordered(), summary].sort((a, b) => RICH_ORDER.indexOf(a.group) - RICH_ORDER.indexOf(b.group)) } };
}
