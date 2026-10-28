import { runSimplePipeline } from "./simple-pipeline";
import { createHash } from "node:crypto";
import { toEvidence, type PipelineDeps, type AskResult } from "./core";
import type { EvidencePackage, PassageForSelection, QuestionFrame } from "./retrieval";
import { pointSearchPlans } from "./library-flow";
import { eligibleCorpusCandidates } from "./search-engine/pipeline-corpus";
import { hadithAllowed } from "@/lib/sources/hadith-rules";
import { scholarQuoteAllowed } from "@/lib/sources/scholar-rules";
import { selectPatientEvidence, checkPatientSource, patientSelectionNeedsEvidence } from "./patient-models";
import { novelRecoveryQueries, type EvidenceGap, type RecoveryQuery } from "./search-engine/recovery";
import { runRichAnswer } from "./rich-engine";
import { researchCandidatePool } from "./search-engine/research-candidate-pool";
import { uniqueResearchCandidates } from "./search-engine/candidate-identity";
import { discoverAdjacentQuranCandidates } from "./search-engine/adjacent-quran-discovery";
import { abortable, isTimeoutFailure } from "./abort";
import { withAskTimeout } from "./timing";
import { recordLocalAskEvent } from "./local-trace";
import { currentModelPriority, withModelPriority } from "@/lib/ai/transport";
import { localAskUnhurried } from "./settings";
import { CONTINUATION_LIMITS } from "./continuation-session";
import { runStableLanes } from "./stable-lanes";
import { resolveHadithHints } from "./hadith-hints";
import { validVerifiedQuranCard, type VerifiedQuranCard, type RichGroup, type RichSection, type SourceFailureStage } from "./rich-answer";

type Group = Exclude<RichGroup, "summary">;
type Lane = { group: Group; candidates: PassageForSelection[]; pack?: EvidencePackage; section: RichSection };
type Hints = { quran: string[]; hadith: string[]; scholars: string[] };
const groups: Group[] = ["quran", "hadith", "scholar"];
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const dependency = (p: EvidencePackage["passages"][number]) => ({ id: p.id, source: p.source, context: p.context,
  role: p.contribution, requirementIds: p.requirementIds, explanationRequirementIds: p.explanationRequirementIds });

/** One request, three independently checked educational contributions. Partial lane
 * selection never substitutes for combined evidence or full-answer approval. */
export async function runProgressiveLanes(question: string, frame: QuestionFrame, deps: PipelineDeps, signal: AbortSignal,
  remainingMs: number, hints: Hints): Promise<AskResult> {
  if (deps.simpleResearch) return runSimplePipeline(question, frame, deps, signal, hints);
  if (deps.rich?.stable) return runStableLanes(question, frame, deps, signal, hints);
  const began = Date.now(), plans = pointSearchPlans(frame), shown = new Map<Group, RichSection>();
  const checkpoint = deps.progressiveCheckpoint;
  if (checkpoint) checkpoint.frame = structuredClone(frame);
  const diagnostic = (stage: "retrieval" | "candidates" | "draft", code: string) => deps.onDiagnostic?.(stage, code, Date.now() - began);
  const checked = new Map<Group, EvidencePackage>();
  const publishedCards = new Map<string, { card: VerifiedQuranCard; pack: EvidencePackage }>();
  const correctedGroups = new Set<RichGroup>();
  let modelCalls = 0, reservedTokens = 0;
  const boundedProvider = (provider: PipelineDeps["writer"]) => ({ id: provider.id, generateJson: async (request: Parameters<typeof provider.generateJson>[0]) => {
    signal.throwIfAborted();
    let correctionGroups: RichGroup[] = [];
    try {
      const input = JSON.parse(request.prompt);
      if (input.correction) {
        if (!Array.isArray(input.sections_to_write) || !input.sections_to_write.length || input.sections_to_write.some((g: RichGroup) => ![...groups, "summary"].includes(g))) throw new Error("invalid_correction_groups");
        correctionGroups = input.sections_to_write;
      }
    } catch (error) { if (error instanceof Error && error.message === "invalid_correction_groups") throw error; /* Non-JSON checking prompts. */ }
    const tokens = request.maxOutputTokens ?? 2048;
    const unhurried = localAskUnhurried();
    if (modelCalls >= (unhurried ? CONTINUATION_LIMITS.calls : CONTINUATION_LIMITS.runCalls)
      || reservedTokens + tokens > (unhurried ? CONTINUATION_LIMITS.outputTokens : CONTINUATION_LIMITS.runOutputTokens)
      || correctionGroups.some(g => correctedGroups.has(g))) throw new Error("progressive_model_budget_exhausted");
    modelCalls++; reservedTokens += tokens; for (const group of correctionGroups) correctedGroups.add(group);
    const planning = request.system.startsWith("You select evidence") || request.system.startsWith("Rank candidate passages");
    return withModelPriority(currentModelPriority() + (planning ? 1 : 0), () => provider.generateJson({ ...request, signal: request.signal ? AbortSignal.any([signal, request.signal]) : signal }));
  } });
  deps = { ...deps, writer: boundedProvider(deps.writer), verifier: boundedProvider(deps.verifier), deriveAuditReasons: true, meaningReview: true, meaningApprovals: deps.meaningApprovals ?? checkpoint?.meaningApprovals ?? new Set() };
  let recoveryQueries: RecoveryQuery[] = [];
  if (checkpoint?.retry && checkpoint.needsEvidence && deps.planEvidenceRecovery) {
    modelCalls++; reservedTokens += 1100;
    const gaps: EvidenceGap[] = frame.requirements.map(r => ({ requirementId: r.id, concern: r.text, reason: "missing_direct_support", families: groups.filter(g => g === "quran" || deps.sourceAvailability?.[g] !== false) }));
    const previousQueries: RecoveryQuery[] = [...checkpoint.recoveryQueries ?? [], ...plans.flatMap(p => [
      ...p.quran.map(text => ({ requirementId: p.id, family: "quran" as const, language: /\p{Script=Arabic}/u.test(text) ? "ar" as const : "en" as const, text })),
      ...p.scholar.map(text => ({ requirementId: p.id, family: "scholar" as const, language: "ar" as const, text })),
      ...(["ar", "en", "de"] as const).flatMap(language => (p.hadith[language] ?? []).map(text => ({ requirementId: p.id, family: "hadith" as const, language, text }))),
    ])];
    recoveryQueries = novelRecoveryQueries(await deps.planEvidenceRecovery({ frame, gaps, previousQueries, visitedSources: Object.values(checkpoint.lanes).flatMap(l => l.candidates.map(p => p.id)), round: checkpoint.retry }, signal), gaps, previousQueries);
    checkpoint.recoveryQueries = [...checkpoint.recoveryQueries ?? [], ...recoveryQueries];
  }
  const publish = (section: RichSection, snapshot?: string) => {
    signal.throwIfAborted();
    if (section.group !== "summary") shown.set(section.group, section);
    if (section.group === "quran" && section.outcome === "ready") publishedCards.clear();
    deps.rich?.onSection?.(section, snapshot ?? hash({ frame, question, section, rules: "lane-1" }));
  };
  const lane = async (group: Group): Promise<Lane> => {
    let stage: SourceFailureStage = "source_search", problem: "timeout" | "search_failed" | undefined;
    let problemStage: SourceFailureStage | undefined;
    let retained: PassageForSelection[] = [];
    let early: { pack: EvidencePackage; section: RichSection } | undefined;
    let laneOpen = true;
    const pendingPreviews = new Set<Promise<void>>();
    let previous = checkpoint?.lanes[group];
    if (group !== "quran" && deps.sourceAvailability?.[group] === false) {
      const section: RichSection = { group, outcome: "unavailable", claims: [], sources: [] };
      publish(section, hash({ frame, group, outcome: "unavailable" })); return { group, candidates: [], section };
    }
    try {
      // Leave a real final-review reserve; unhurried diagnostics do not make a lane infinite.
      return await withModelPriority(group === "quran" ? 0 : group === "hadith" ? 2 : 4, () => withAskTimeout(signal, Number.isFinite(remainingMs) ? Math.max(1, remainingMs - 15_000) : 35_000, `lane_${group}`, async laneSignal => {
        diagnostic("retrieval", `lane_${group}_started`);
        if (checkpoint && checkpoint.retry > 0 && previous?.candidates.length) {
          // Completed selection needs only its cited originals refreshed. Unused
          // candidates cannot hold a checked contribution behind unrelated reads.
          const used = new Set(previous.pack?.passages.filter(p => p.source.kind === group).map(p => p.id));
          if (used.size) {
            previous = { ...previous, candidates: previous.candidates.filter(p => used.has(p.id)) };
            checkpoint.lanes[group] = previous;
          }
          stage = "source_revalidation";
          // Source readers have their own ten-second connection deadline. Allow
          // their optional bodies to settle before the enclosing freshness bound.
          const valid = deps.revalidateProgressive && await withAskTimeout(laneSignal, 12_000, "resume_source_validation", scoped => deps.revalidateProgressive!(previous!.candidates, scoped));
          if (!valid) {
            if (previous.section?.outcome === "ready") deps.rich?.onWithdraw?.(group);
            delete checkpoint.lanes[group]; delete checkpoint.combined; previous = undefined;
          }
        }
        if (previous?.early) { early = previous.early; publish(early.section, hash({ frame, question, evidence: early.pack.passages.map(dependency) })); }
        const recovering = recoveryQueries.some(q => q.family === group);
        // Freshness succeeded above. Keep the existing checked contribution
        // visible while looking for additional evidence. A timeout in that new
        // work is not a negative finding against the already checked text.
        if (recovering && previous?.section?.outcome === "ready" && previous.pack) {
          early = { pack: previous.pack, section: previous.section };
          publish(early.section, hash({ frame, question, evidence: early.pack.passages.map(dependency) }));
        }
        if (!recovering && previous?.section?.outcome === "ready" && previous.pack) {
          checked.set(group, previous.pack); publish(previous.section, hash({ frame, question, evidence: previous.pack.passages.map(dependency) }));
          return { group, candidates: previous.candidates, pack: previous.pack, section: previous.section };
        }
        const contexts = new Map<string, Promise<PassageForSelection | null>>();
        const withContext = (p: PassageForSelection): Promise<PassageForSelection | null> => {
          if (p.source.kind !== "quran" || p.context.length) return Promise.resolve(p);
          if (!contexts.has(p.id)) contexts.set(p.id, (async () => {
            stage = "context_lookup";
            try {
              const near = await withAskTimeout(laneSignal, 12_000, "context_lookup", scoped => abortable(deps.neighbours(p.source.kind === "quran" ? p.source.verse.key : ""), scoped));
              return { ...p, context: near.filter(v => v.key !== (p.source.kind === "quran" ? p.source.verse.key : "")) };
            } catch (error) { laneSignal.throwIfAborted(); problem = isTimeoutFailure(error) ? "timeout" : "search_failed"; problemStage ??= "context_lookup"; diagnostic("candidates", problem === "timeout" ? "context_lookup_timeout" : "context_lookup_failed"); return null; }
          })());
          return contexts.get(p.id)!;
        };
        const previewJobs = new Map<string, Promise<void>>(), previewPacks = new Map<string, EvidencePackage>();
        const cards = new Map<string, VerifiedQuranCard>();
        let previewCount = 0;
        let earlyStarted = !!early;
        const preview = (unit: PassageForSelection[]) => {
          const key = hash(unit.map(p => p.id).sort());
          if (early || !deps.rich?.onCard || !unit.length || previewJobs.has(key) || previewCount >= 3) return;
          previewCount++;
          const job = (async () => {
            const prepared = (await Promise.all(unit.map(withContext))).filter((p): p is PassageForSelection => p !== null);
            if (prepared.length !== unit.length) return;
            const pack = await selectPatientEvidence(frame, prepared, { ...deps, meaningRankCandidates: undefined }, laneSignal, true);
            laneSignal.throwIfAborted(); signal.throwIfAborted();
            if (!laneOpen) return;
            if (early || !pack || pack.scholarDifference || !unit.every(p => pack.passages.some(s => s.id === p.id))) return;
            previewPacks.set(key, pack);
            const card: VerifiedQuranCard = { id: key, group: "quran", evidenceSnapshot: hash({ frame, question, rules: "lane-card-1", evidence: pack.passages.map(dependency) }),
              sources: pack.passages.map(p => ({ id: p.id, evidence: toEvidence(p.source, frame.language), role: p.contribution?.role ?? "direct", requirementIds: p.requirementIds, explanationRequirementIds: p.explanationRequirementIds ?? [] })) };
            if (!validVerifiedQuranCard(card)) return;
            cards.set(key, card); publishedCards.set(key, { card, pack }); deps.rich?.onCard?.(card);
            // An independently selected unit need not wait for unrelated Quran
            // discovery. Its explanation still receives both mandatory checks.
            if (!earlyStarted && pack.passages.some(p => p.contribution?.role === "direct" && p.requirementIds.length > 0)) {
              earlyStarted = true;
              const section = await checkPatientSource("quran", pack, question, frame.language, deps, laneSignal);
              laneSignal.throwIfAborted(); signal.throwIfAborted();
              if (!laneOpen || section.outcome !== "ready") return;
              early = { pack, section }; publish(section, card.evidenceSnapshot);
              if (checkpoint) {
                const saved = checkpoint.lanes[group] ?? { candidates: structuredClone(prepared), retrievalComplete: false };
                checkpoint.lanes[group] = { ...saved, early: structuredClone(early) };
              }
            }
          })().catch(() => { /* Unassessed/failed previews never reach the visitor. Full selection still runs. */ });
          previewJobs.set(key, job);
          pendingPreviews.add(job);
        };
        const reuseCandidates = !recovering && previous?.retrievalComplete && previous.candidates.length ? previous.candidates : undefined;
        const activePlans = recovering ? plans.filter(p => recoveryQueries.some(q => q.family === group && q.requirementId === p.id)).map(p => {
          const queries = recoveryQueries.filter(q => q.family === group && q.requirementId === p.id);
          return { ...p, quran: queries.map(q => q.text), scholar: queries.map(q => q.text), hadith: Object.fromEntries((["ar", "en", "de"] as const).map(language => [language, queries.filter(q => q.language === language).map(q => q.text)])) };
        }) : plans;
        const results = reuseCandidates ? [] : await Promise.allSettled(activePlans.map(async (plan): Promise<PassageForSelection[]> => {
          if (group === "quran") {
            const found = await withAskTimeout(laneSignal, 12_000, "quran_search", scoped => abortable(deps.search(plan.quran, 16), scoped));
            stage = "verse_lookup";
            const keys = [...new Set([...hints.quran, ...found])].slice(0, 16);
            const verseJobs = new Map(keys.map(key => [key, withAskTimeout(laneSignal, 12_000, "verse_lookup", scoped => abortable(deps.getVerse(key), scoped)).then(verse => {
              if (verse && !deps.namedEvidencePassages?.some(unit => unit.includes(`Q${verse.key}`))) preview([{ id: `Q${verse.key}`, source: { kind: "quran", verse }, context: [], retrievedFor: [plan.id] }]);
              return verse;
            })]));
            for (const unit of deps.namedEvidencePassages ?? []) {
              const whole = Promise.all(unit.map(id => verseJobs.get(id.slice(1)) ?? Promise.resolve(undefined))).then(verses => {
                if (verses.every(v => !!v)) preview(verses.map(verse => ({ id: `Q${verse!.key}`, source: { kind: "quran", verse: verse! }, context: [], retrievedFor: [plan.id] })));
              }).catch(() => {});
              void whole;
            }
            const verses = await Promise.allSettled([...verseJobs.values()]);
            if (verses.some(r => r.status === "rejected")) { problem = verses.some(r => r.status === "rejected" && isTimeoutFailure(r.reason)) ? "timeout" : "search_failed"; problemStage ??= "verse_lookup"; }
            return verses.flatMap(r => r.status === "fulfilled" && r.value ? [{ id: `Q${r.value.key}`, source: { kind: "quran" as const, verse: r.value }, context: [], retrievedFor: [plan.id] }] : []);
          }
          if (group === "hadith") {
            if (!deps.searchHadith) return [];
            const found = await withAskTimeout(laneSignal, 12_000, "hadith_search", scoped => abortable(deps.searchHadith!(plan.hadith), scoped));
            return found.filter(hadithAllowed).slice(0, 8).map(hadith => ({ id: hadith.id, source: { kind: "hadith" as const, hadith }, context: [], retrievedFor: [plan.id] }));
          }
          if (!deps.searchScholars && !(recovering && deps.searchScholarsLive)) return [];
          const found = await withAskTimeout(laneSignal, 8_000, "scholar_search", async scoped => {
            const searches = await Promise.allSettled([
              ...(deps.searchScholars ? [abortable(deps.searchScholars(plan.scholar, hints.scholars), scoped)] : []),
              ...(recovering && deps.searchScholarsLive ? [abortable(deps.searchScholarsLive(plan.scholar), scoped)] : []),
            ]);
            if (searches.some(r => r.status === "rejected")) problem = searches.some(r => r.status === "rejected" && isTimeoutFailure(r.reason)) ? "timeout" : "search_failed";
            return searches.flatMap(r => r.status === "fulfilled" ? r.value : []);
          });
          return found.filter(scholarQuoteAllowed).slice(0, 8).map(quote => ({ id: quote.id, source: { kind: "scholar" as const, quote }, context: [], contextAvailability: "stored_excerpt_only" as const, retrievedFor: [plan.id] }));
        }));
        laneSignal.throwIfAborted();
        if (results.some(r => r.status === "rejected")) { problem = results.some(r => r.status === "rejected" && isTimeoutFailure(r.reason)) ? "timeout" : "search_failed"; problemStage ??= "source_search"; }
        problem ??= deps.sourceProblems?.[group];
        let candidates = reuseCandidates ?? uniqueResearchCandidates([...recovering && previous ? previous.candidates : [], ...results.flatMap(r => r.status === "fulfilled" ? r.value : [])]);
        if (!reuseCandidates && group === "hadith") {
          const mapped = await resolveHadithHints(deps, hints.hadith, laneSignal);
          candidates = uniqueResearchCandidates([...mapped.map(h => ({ id: h.id, source: { kind: "hadith" as const, hadith: h }, context: [] })), ...candidates]);
        }
        if (!reuseCandidates && group !== "quran" && deps.retrieveCorpusCandidates) {
          const corpus = await withAskTimeout(laneSignal, 8_000, `${group}_corpus`, scoped => abortable(deps.retrieveCorpusCandidates!(frame, scoped, [group]), scoped)).catch(error => { laneSignal.throwIfAborted(); problem = isTimeoutFailure(error) ? "timeout" : "search_failed"; return []; });
          candidates = uniqueResearchCandidates([...candidates, ...eligibleCorpusCandidates(corpus, deps.sourceAvailability).filter(p => p.source.kind === group)]);
        }
        candidates = researchCandidatePool(frame, candidates, group === "quran" ? 16 : 8).candidates;
        const context = async (items: PassageForSelection[]) => (await Promise.all(items.map(withContext))).filter((p): p is PassageForSelection => p !== null);
        candidates = await context(candidates);
        retained = candidates;
        if (checkpoint && !reuseCandidates) checkpoint.lanes[group] = { candidates: structuredClone(candidates), retrievalComplete: true, discoveryComplete: false, ...(early ? { early: structuredClone(early) } : {}) };
        // Settle independent early checks before dispatching the next paid Quran
        // ranking stage. Their pessimistic reservations must not starve that lane.
        await Promise.all(previewJobs.values());
        if ((!reuseCandidates || !previous?.discoveryComplete) && group === "quran" && candidates.length) {
          stage = "evidence_selection";
          const priority = deps.meaningRankCandidates ? await deps.meaningRankCandidates(frame, candidates, laneSignal) : candidates;
          stage = "verse_lookup";
          const additions = await discoverAdjacentQuranCandidates(candidates, key => withAskTimeout(laneSignal, 12_000, "quran_discovery", scoped => abortable(deps.getVerse(key), scoped)), laneSignal, undefined, priority.map(p => p.id));
          candidates = await context(uniqueResearchCandidates([...candidates, ...additions]));
          if (deps.meaningRankCandidates && additions.length) { stage = "evidence_selection"; candidates = await deps.meaningRankCandidates(frame, candidates, laneSignal); }
        }
        retained = candidates;
        if (checkpoint) checkpoint.lanes[group] = { candidates: structuredClone(candidates), retrievalComplete: true, discoveryComplete: true, ...(previous?.pack ? { pack: previous.pack } : {}), ...(early ? { early: structuredClone(early) } : {}) };
        if (group === "quran" && deps.namedEvidencePassages?.some(unit => !unit.every(id => candidates.some(p => p.id === id)))) throw new Error("named_evidence_incomplete");
        if (!candidates.length) {
          const section: RichSection = { group, outcome: problem ?? "no_direct_evidence", claims: [], sources: [], ...(problem ? { searchFailureStage: problemStage ?? stage } : {}) };
          publish(section, hash({ frame, group, outcome: section.outcome })); return { group, candidates, section };
        }
        // Quran candidates already went through discovery-priority and final ranking.
        // The selector still assesses every retained original independently.
        await Promise.all(previewJobs.values());
        laneSignal.throwIfAborted();
        const unchangedPreview = previewPacks.get(hash(candidates.map(p => p.id).sort()));
        const oldCandidatesMatch = previous && hash(previous.candidates) === hash(candidates);
        let selectionFailure: string | undefined;
        stage = "evidence_selection";
        const pack = oldCandidatesMatch && previous?.pack || unchangedPreview || await selectPatientEvidence(frame, candidates, group === "quran" ? { ...deps, meaningRankCandidates: undefined } : deps, laneSignal, true, code => { selectionFailure = code; });
        if (!pack || pack.scholarDifference) {
          for (const id of cards.keys()) { deps.rich?.onCardWithdraw?.(id); publishedCards.delete(id); }
          if (!pack && patientSelectionNeedsEvidence(selectionFailure)) {
            if (early) { deps.rich?.onWithdraw?.(group); early = undefined; if (checkpoint?.lanes[group]) delete checkpoint.lanes[group]!.early; }
            const section: RichSection = { group, outcome: problem ?? "no_direct_evidence", claims: [], sources: [], ...(problem ? { searchFailureStage: problemStage ?? stage } : {}) };
            publish(section, hash({ frame, group, outcome: section.outcome })); return { group, candidates, section };
          }
          throw new Error("lane_evidence_not_safe");
        }
        for (const [id, card] of cards) {
          const previewPack = previewPacks.get(id)!;
          const ids = new Set(card.sources.map(s => s.id));
          if (hash(previewPack.passages.map(dependency)) !== hash(pack.passages.filter(p => ids.has(p.id)).map(dependency))) { deps.rich?.onCardWithdraw?.(id); publishedCards.delete(id); }
        }
        checked.set(group, pack);
        if (early && hash(early.pack.passages.map(dependency)) !== hash(pack.passages.filter(p => early!.pack.passages.some(e => e.id === p.id)).map(dependency))) {
          deps.rich?.onWithdraw?.(group); early = undefined;
        }
        if (checkpoint) checkpoint.lanes[group] = { candidates: structuredClone(candidates), pack: structuredClone(pack), retrievalComplete: true, discoveryComplete: true };
        stage = "explanation_check";
        const section = oldCandidatesMatch && previous?.section?.outcome === "ready" ? previous.section : await checkPatientSource(group, pack, question, frame.language, deps, laneSignal);
        const display: RichSection = { ...section, ...(problem && section.outcome === "ready" ? { searchOutcome: problem, searchFailureStage: problemStage ?? stage } : {}) };
        publish(display, hash({ frame, question, language: frame.language, rules: "lane-1", evidence: pack.passages.map(dependency) }));
        if (checkpoint) checkpoint.lanes[group]!.section = structuredClone(display);
        return { group, candidates, pack, section: display };
      }));
    } catch (error) {
      laneOpen = false;
      await Promise.allSettled(pendingPreviews);
      recordLocalAskEvent("lane_failed", { group, stage, category: error instanceof Error ? error.name : "unknown",
        code: error instanceof Error && /^[a-z_]{1,100}$/.test(error.message) ? error.message : "operation_failed" });
      signal.throwIfAborted();
      if (early && isTimeoutFailure(error)) {
        if (checkpoint?.lanes[group]) checkpoint.lanes[group]!.early = structuredClone(early);
        const section: RichSection = { ...early.section, searchOutcome: "timeout", searchFailureStage: stage };
        publish(section, hash({ frame, question, evidence: early.pack.passages.map(dependency) }));
        return { group, candidates: retained.length ? retained : previous?.candidates ?? [], pack: early.pack, section };
      }
      const section: RichSection = { group, outcome: isTimeoutFailure(error) ? "timeout" : "failed_check", claims: [], sources: [], ...(isTimeoutFailure(error) ? { searchFailureStage: stage } : {}) };
      diagnostic("draft", `lane_${group}_${section.outcome}`);
      publish(section, hash({ frame, group, outcome: section.outcome })); return { group, candidates: retained, pack: checked.get(group), section };
    } finally { laneOpen = false; }
  };
  const lanes = await Promise.all(groups.map(lane));
  signal.throwIfAborted();
  const candidates = researchCandidatePool(frame, lanes.flatMap(l => l.candidates), 30).candidates;
  const candidatesHash = hash({ frame, candidates });
  const namedIncomplete = deps.namedEvidencePassages?.some(unit => !unit.every(id => candidates.some(p => p.id === id)));
  let selectionFailure: string | undefined;
  const combined = checkpoint?.combined;
  // Discarding unused candidates or changing their order cannot change an already
  // complete selection. Reuse requires every selected original/context to have
  // been refreshed, no new/changed candidates, and no evidence-recovery round.
  const refreshedSelection = combined && !recoveryQueries.length && !checkpoint?.needsEvidence && combined.candidateSnapshots
    && candidates.every(c => combined.candidateSnapshots!.includes(hash(c)))
    && combined.pack.passages.every(p => candidates.some(c => c.id === p.id && hash({ source: c.source, context: c.context }) === hash({ source: p.source, context: p.context })));
  const pack = combined && (combined.candidatesHash === candidatesHash || refreshedSelection) ? combined.pack
    : candidates.length && !namedIncomplete ? await selectPatientEvidence(frame, candidates, { ...deps, meaningRankCandidates: undefined }, signal, false, code => { selectionFailure = code; }) : null;
  if (checkpoint) checkpoint.needsEvidence = !pack && (!candidates.length || !!namedIncomplete || patientSelectionNeedsEvidence(selectionFailure));
  if (!pack || pack.scholarDifference) return { status: "incomplete", language: frame.language, withdraw: false, sections: groups.flatMap(g => shown.get(g) ? [shown.get(g)!] : []), failureKind: "question_coverage" };
  if (checkpoint) checkpoint.combined = { candidatesHash, candidateSnapshots: candidates.map(c => hash(c)), pack: structuredClone(pack) };
  // Before final synthesis, remove preview-only material. A complete answer must
  // contain only sources whose explanations survived the full checking path.
  for (const id of publishedCards.keys()) deps.rich?.onCardWithdraw?.(id);
  publishedCards.clear();
  const reusable: RichSection[] = [];
  for (const lane of lanes) {
    if (lane.section.outcome !== "ready" || !lane.pack) continue;
    const ids = new Set(lane.section.sources.map(s => s.id));
    const before = lane.pack.passages.filter(p => ids.has(p.id)).map(dependency);
    const after = pack.passages.filter(p => ids.has(p.id)).map(dependency);
    if (hash(before) === hash(after)) reusable.push(lane.section);
    else { deps.rich?.onWithdraw?.(lane.group); shown.delete(lane.group); }
  }
  const result = await runRichAnswer(pack, frame.language, { ...deps, rich: { ...deps.rich, progressive: true, onSection: (section, snapshot) => {
      // Commit each completed check before delivering it. A later route deadline
      // must not lose the stage merely because final synthesis did not return.
      if (checkpoint && section.group !== "summary" && checkpoint.lanes[section.group]) {
        const saved = checkpoint.lanes[section.group]!;
        if (section.outcome === "ready") { saved.section = structuredClone(section); saved.pack = structuredClone(pack); }
        else { delete saved.section; delete saved.early; }
      }
      publish(section, snapshot);
    },
    onWithdraw: group => { if (checkpoint) { if (group && group !== "summary" && checkpoint.lanes[group]) { delete checkpoint.lanes[group]!.section; delete checkpoint.lanes[group]!.early; } else if (!group) for (const lane of Object.values(checkpoint.lanes)) { delete lane.section; delete lane.early; } } deps.rich?.onWithdraw?.(group); },
  } }, signal, question,
    Object.fromEntries(lanes.map(l => [l.group, l.section.searchOutcome ?? l.section.outcome])),
    remainingMs - (Date.now() - began), { checkedSections: reusable });
  const finalSections = result.status === "rich_answer" ? result.answer.sections : result.sections ?? [];
  if (checkpoint) for (const section of finalSections) if (section.group !== "summary" && section.outcome === "ready" && checkpoint.lanes[section.group]) {
    checkpoint.lanes[section.group]!.section = structuredClone(section); checkpoint.lanes[section.group]!.pack = structuredClone(pack);
  }
  return result;
}
