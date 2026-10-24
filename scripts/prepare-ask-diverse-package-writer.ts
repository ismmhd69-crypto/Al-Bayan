import { recordedQuranDiversity } from "./inspect-ask-package-diversity";
import { richWritingClaimsSchema } from "../lib/ask/rich-writing-schema";
import type { JsonRequest } from "../lib/ai/types";
import type { Verse } from "../lib/sources/quran-meta";

export async function prepareDiversePackageWriter(getVerse: (key: string) => Promise<Verse | undefined>) {
  const replay = recordedQuranDiversity(), events = replay.traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const base = events.find(e => e.event === "model_request" && e.data.call_id === "A8").data;
  if (base.max_output_tokens !== 2200 || JSON.stringify(base.prompt.sections_to_write) !== '["quran"]') throw Error("recorded_initial_writer_changed");
  const prompt = structuredClone(base.prompt), oldPassages = prompt.evidence_package.passages;
  const added = replay.after.passages.filter(p => !oldPassages.some((s: any) => s.id === p.id));
  const fresh = new Map<string, Verse>();
  for (const p of added) {
    if (p.source.kind !== "quran") throw Error("unexpected_non_quran_addition");
    const [chapter, number] = p.source.verse.key.split(":").map(Number);
    for (const key of [`${chapter}:${number - 1}`, `${chapter}:${number}`, `${chapter}:${number + 1}`]) {
      if (fresh.has(key)) continue;
      const v = await getVerse(key); if (!v || v.key !== key || v.url !== `https://quran.com/${key.replace(":", "/")}`) throw Error("fresh_source_identity_missing");
      fresh.set(key, v);
    }
    if (fresh.get(p.source.verse.key)!.arabic !== p.source.verse.arabic) throw Error("fresh_original_changed");
    const recorded = replay.contextFromSelection.find((s: any) => s.source.id === p.id);
    const expectedContext = recorded.surrounding_context.map((s: any) => s.arabic);
    const observedContext = [`${chapter}:${number - 1}`, `${chapter}:${number + 1}`].map(key => fresh.get(key)!.arabic);
    if (JSON.stringify(expectedContext) !== JSON.stringify(observedContext)) throw Error("fresh_restrictive_context_changed");
  }
  const selected = replay.after.passages.map(p => {
    const old = oldPassages.find((s: any) => s.id === p.id); if (old) return old;
    if (p.source.kind !== "quran") throw Error("source");
    const recorded = replay.contextFromSelection.find((s: any) => s.source.id === p.id);
    return { ...recorded.source, supported_requirement_ids: p.requirementIds, contribution: p.contribution, surrounding_context: recorded.surrounding_context };
  });
  prompt.evidence_package.passages = [...selected, ...oldPassages.filter((p: any) => p.type !== "quran")];
  const allowed = selected.map(p => p.id); prompt.citable_source_ids_by_section.quran = allowed;
  const schema = structuredClone(base.schema);
  schema.properties.quran = richWritingClaimsSchema(allowed, prompt.evidence_package.question.requirements.map((r: any) => r.id));
  const request: JsonRequest = { system: base.system, prompt: JSON.stringify(prompt), schema, maxOutputTokens: base.max_output_tokens, thinking: base.thinking, structuredOutput: true };
  const validationPack = { question: prompt.evidence_package.question, cards: [], passages: selected.map(p => ({ id: p.id, requirementIds: p.supported_requirement_ids, context: [],
    source: { kind: "quran", verse: { arabic: p.arabic, translations: { en: p.translation_en, de: null } } } })) };
  return { request, validationPack, freshOriginals: [...fresh.values()], before: replay.before.passages.map(p => p.id), after: allowed, cardsBefore: replay.before.cards, cardsAfter: replay.after.cards };
}
