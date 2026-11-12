import { passageRecord } from "./passage-record";
import type { EvidencePackage } from "./retrieval";
import type { DisplayTranslation } from "./rich-answer";

export function checkedPassages(pack: EvidencePackage, translations: Map<string, DisplayTranslation>, approved: Set<string>) {
  return pack.passages.flatMap(p => {
    const s = p.source, translated = translations.get(p.id);
    const original = s.kind === "quran" ? s.verse.arabic : s.kind === "hadith" ? s.hadith.arabic : s.quote.arabic;
    const record = passageRecord({ id: p.id, kind: s.kind, original,
      ...(approved.has(p.id) && translated?.status === "ready" ? { translation: translated.text } : {}),
      ...(s.kind === "quran" ? { context: [...p.context].sort((a, b) => a.key.localeCompare(b.key)).map(v => ({ key: v.key, arabic: v.arabic })) } : {}) });
    return record ? [record] : [];
  });
}
