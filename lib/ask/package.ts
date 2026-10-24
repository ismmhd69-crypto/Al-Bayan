// The capped sealed package (design section 4.1, phase 2). Code, not AI, decides which direct,
// context-safe passages the writer may use, BEFORE drafting, so no cited source can later be cut
// by a cap. Pure and deterministic: the same selector verdicts always give the same package.
//
// 1. Cover every requested point first with the smallest set that fits the caps.
// 2. Fill the remaining places by: more points covered, checked topic map or visitor-named passage,
//    retrieval rank, then numeric Quran order (otherwise the id).
// Caps: 3 Quran passage cards (consecutive verses form one card), 2 hadith, 2 scholar quotes, and
// the existing bound of 8 passages (a complete passage the visitor named counts as one).

import { compareSourceIds, consecutiveRuns, quranCardId } from "./ids";
import type { SelectedPassage } from "./retrieval";
import type { ContributionUnit } from "./contribution-plan";

export const PACKAGE_CAPS = { quranCards: 3, hadith: 2, scholar: 2, passages: 8 } as const;

// quranVerses is optional: tiered mode (lib/ask/tiered.ts) also limits the number of verses.
export type PackageCaps = { quranCards: number; quranVerses?: number; hadith: number; scholar: number; passages: number };

export type QuranCard = { id: string; sourceIds: string[]; named: boolean };

export type ChooserOptions = {
  preferredIds?: ReadonlySet<string>; // checked topic map or passages the visitor named by reference
  namedPassages?: readonly (readonly string[])[]; // complete passages named by the visitor (al-Fatiha)
  caps?: PackageCaps; // default PACKAGE_CAPS
  tierOrder?: boolean; // writer order Quran, hadith, scholar before the first point (tiered mode)
  contributionPlan?: readonly ContributionUnit[]; // Preview: preserve necessary meaning; no quota filling.
  preservePlannedExcerpts?: boolean; // Internal: separate eligible excerpts on one page may both be needed.
  diverseQuranFillers?: boolean; // Order optional high-overlap Quran fillers after other eligible contributions.
};

export type ChosenPackage = { passages: SelectedPassage[]; cards: QuranCard[] };

type Unit = {
  passages: SelectedPassage[];
  kind: SelectedPassage["source"]["kind"];
  named: boolean;
  requirementIds: Set<string>;
  preferred: boolean;
  rank: number; // retrieval order
};

const KIND_ORDER = { quran: 0, hadith: 1, scholar: 2 } as const;

// Keys 2 to 5 of the design's ranking. Key 1 (needed for the smallest cover) is applied by
// choosing the cover before anything else.
function preference(a: Unit, b: Unit): number {
  return b.requirementIds.size - a.requirementIds.size
    || Number(b.preferred) - Number(a.preferred)
    || a.rank - b.rank
    || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    || compareSourceIds(a.passages[0].id, b.passages[0].id);
}

function fits(units: Unit[], caps: PackageCaps): boolean {
  const named = units.filter((unit) => unit.kind === "quran" && unit.named).length;
  const verses = units.filter((unit) => unit.kind === "quran" && !unit.named).flatMap((unit) => unit.passages.map((p) => p.id));
  // A complete passage the visitor named counts as one item, so tiered mode can still show it.
  const allVerses = named + verses.length;
  return named + consecutiveRuns(verses).length <= caps.quranCards
    && (caps.quranVerses === undefined || allVerses <= caps.quranVerses)
    && units.filter((unit) => unit.kind === "hadith").length <= caps.hadith
    && units.filter((unit) => unit.kind === "scholar").length <= caps.scholar
    && units.reduce((sum, unit) => sum + (unit.named ? 1 : unit.passages.length), 0) <= caps.passages;
}

const covers = (units: Unit[], required: readonly string[]) => {
  const covered = new Set(units.flatMap((unit) => [...unit.requirementIds]));
  return required.every((id) => covered.has(id));
};

// Ranking signal only, never a judgment that two teachings are interchangeable.
// Originals remain untouched. Named/required/condition-bearing units are not demoted.
function overlapsQuranFiller(a: Unit, chosen: Unit[]) {
  if (a.kind !== "quran" || a.named || a.passages.some(p => p.contribution?.conditions.length)) return false;
  const words = (s: string) => s.normalize("NFKC").replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/gu, "")
    .replace(/[أإآٱ]/gu, "ا").replace(/ى/gu, "ي").match(/[\p{L}\p{N}]+/gu) ?? [];
  return a.passages.some(p => p.source.kind === "quran" && chosen.some(unit => unit.kind === "quran" && unit.passages.some(q => {
    if (q.source.kind !== "quran" || !p.requirementIds.length || p.requirementIds.length !== q.requirementIds.length
      || !p.requirementIds.every(id => q.requirementIds.includes(id))) return false;
    const x = words(p.source.kind === "quran" ? p.source.verse.arabic : ""), y = words(q.source.verse.arabic);
    const n = Math.max(7, Math.ceil(Math.min(x.length, y.length) * .6));
    if (Math.min(x.length, y.length) < n) return false;
    const spans = new Set(Array.from({ length: x.length - n + 1 }, (_, i) => x.slice(i, i + n).join(" ")));
    return Array.from({ length: y.length - n + 1 }, (_, i) => y.slice(i, i + n).join(" ")).some(s => spans.has(s));
  })));
}

/**
 * Builds the capped package from direct, context-safe passages given in retrieval order.
 * Returns null when no set within the caps covers every requested point (the answer refuses).
 */
export function chooseSealedPackage(
  direct: readonly SelectedPassage[],
  requiredIds: readonly string[],
  options: ChooserOptions = {},
): ChosenPackage | null {
  const caps = options.caps ?? PACKAGE_CAPS;
  // Exact duplicate ids and repeated fatwa pages are dropped, keeping the better placed copy.
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const ordered = direct
    .map((passage, rank) => ({ passage, rank }))
    .filter(({ passage }) => {
      if (seenIds.has(passage.id)) return false;
      seenIds.add(passage.id);
      if (passage.source.kind !== "scholar" || options.contributionPlan || options.preservePlannedExcerpts) return true;
      const url = passage.source.quote.url;
      if (seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    });

  if (options.contributionPlan) {
    // All citations jointly needed for a contribution are atomic. If the required evidence
    // exceeds the limits, refuse instead of silently dropping a necessary step/condition.
    const allIds = new Set(ordered.map(x => x.passage.id));
    if (!options.contributionPlan.length || options.contributionPlan.some(u => !u.sourceIds.length || u.sourceIds.some(id => !allIds.has(id)))) return null;
    const selectedIds = new Set(options.contributionPlan.filter(u => u.necessary).flatMap(u => u.sourceIds));
    const preserveNamed = (ids: Set<string>) => {
      for (const group of options.namedPassages ?? []) if (group.every(id => allIds.has(id)) && group.some(id => ids.has(id))) group.forEach(id => ids.add(id));
      return ids;
    };
    preserveNamed(selectedIds);
    const packageFor = (ids: Set<string>) => chooseSealedPackage(ordered.filter(x => ids.has(x.passage.id)).map(x => x.passage), requiredIds,
      { ...options, contributionPlan: undefined, preservePlannedExcerpts: true });
    // The legacy chooser may order and group this explicit set, but may not truncate it.
    const intact = (ids: Set<string>) => {
      const result = packageFor(ids);
      return result && result.passages.length === ids.size ? result : null;
    };
    if (selectedIds.size && !intact(selectedIds)) return null;
    for (const unit of options.contributionPlan.filter(u => !u.necessary)) {
      const proposed = preserveNamed(new Set([...selectedIds, ...unit.sourceIds]));
      if (intact(proposed)) proposed.forEach(id => selectedIds.add(id));
    }
    if (!selectedIds.size) return null;
    return intact(selectedIds);
  }

  // A complete passage the visitor named (for example al-Fatiha) is one unit, but only when every
  // one of its verses was judged direct and context-safe. Otherwise its verses stand alone.
  const byId = new Map(ordered.map((item) => [item.passage.id, item]));
  const inNamed = new Set<string>();
  const units: Unit[] = [];
  for (const passage of options.namedPassages ?? []) {
    if (passage.length < 2 || !passage.every((id) => byId.has(id) && !inNamed.has(id))) continue;
    const items = [...passage].sort(compareSourceIds).map((id) => byId.get(id)!);
    if (consecutiveRuns(passage).length !== 1) continue;
    items.forEach((item) => inNamed.add(item.passage.id));
    units.push({
      passages: items.map((item) => item.passage),
      kind: "quran",
      named: true,
      requirementIds: new Set(items.flatMap((item) => item.passage.requirementIds)),
      preferred: true,
      rank: Math.min(...items.map((item) => item.rank)),
    });
  }
  for (const { passage, rank } of ordered) {
    if (inNamed.has(passage.id)) continue;
    units.push({
      passages: [passage],
      kind: passage.source.kind,
      named: false,
      requirementIds: new Set(passage.requirementIds),
      preferred: options.preferredIds?.has(passage.id) ?? false,
      rank,
    });
  }
  units.sort(preference);

  // 1. The smallest cover within the caps; among equal sizes, the first in preference order.
  let cover: Unit[] | null = requiredIds.length ? null : [];
  const search = (start: number, size: number, picked: Unit[]): boolean => {
    if (picked.length === size) {
      if (covers(picked, requiredIds) && fits(picked, caps)) {
        cover = [...picked];
        return true;
      }
      return false;
    }
    for (let index = start; index <= units.length - (size - picked.length); index += 1) {
      if (!units[index].requirementIds.size) continue;
      picked.push(units[index]);
      const found = fits(picked, caps) && search(index + 1, size, picked);
      picked.pop();
      if (found) return true;
    }
    return false;
  };
  for (let size = 1; size <= Math.min(caps.passages, units.length) && !cover; size += 1) search(0, size, []);
  if (!cover) return null;
  const coverUnits: Unit[] = cover;

  // 2. Fill the remaining places in preference order while every cap still holds.
  const chosen = [...coverUnits];
  // First preserve useful explanations from otherwise absent source groups, then other
  // contributions. None can replace a member of the direct coverage set above.
  const fillers = direct.some(p => p.explanationRequirementIds !== undefined) ? [...units].sort((a, b) => Number(coverUnits.some(u => u.kind === a.kind))
    - Number(coverUnits.some(u => u.kind === b.kind)) || preference(a, b)) : units;
  const pendingFillers = fillers.filter(unit => !chosen.includes(unit));
  while (pendingFillers.length) {
    if (options.diverseQuranFillers) pendingFillers.sort((a, b) => Number(overlapsQuranFiller(a, chosen)) - Number(overlapsQuranFiller(b, chosen))
      || fillers.indexOf(a) - fillers.indexOf(b));
    const unit = pendingFillers.shift()!;
    if (fits([...chosen, unit], caps)) chosen.push(unit);
  }

  // Cards: the named passage as one card, the other verses grouped into consecutive runs.
  const cards: QuranCard[] = [
    ...chosen.filter((unit) => unit.kind === "quran" && unit.named).map((unit) => {
      const ids = unit.passages.map((p) => p.id);
      return { id: quranCardId(ids), sourceIds: ids, named: true };
    }),
    ...consecutiveRuns(chosen.filter((unit) => unit.kind === "quran" && !unit.named).flatMap((unit) => unit.passages.map((p) => p.id)))
      .map((ids) => ({ id: quranCardId(ids), sourceIds: ids, named: false })),
  ].sort((a, b) => compareSourceIds(a.sourceIds[0], b.sourceIds[0]));

  // Writer order: by the first point a passage answers, then Quran, hadith, scholar, then cover
  // members before fillers, then preference. Verses of one named passage stay in order.
  // Tiered mode puts the source kind first: all Quran, then hadith, then scholars.
  const position = new Map(chosen.map((unit, index) => [unit, index]));
  const firstPoint = (unit: Unit) => Math.min(...[...unit.requirementIds].map((id) => Number(id.slice(1))));
  const tier = (unit: Unit) => (options.tierOrder ? KIND_ORDER[unit.kind] : 0);
  const passages = [...chosen]
    .sort((a, b) => tier(a) - tier(b) || firstPoint(a) - firstPoint(b) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
      || Number(coverUnits.includes(b)) - Number(coverUnits.includes(a)) || position.get(a)! - position.get(b)!)
    .flatMap((unit) => unit.passages);
  return { passages, cards };
}
