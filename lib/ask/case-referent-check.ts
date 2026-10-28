import type { Claim } from "./checks";

const normal = (s: string) => s.normalize("NFKC").replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/gu, "");
const word = (body: string) => new RegExp(`(?:^|[^\\p{L}])(?:و|ف)?(?:${body})(?=$|[^\\p{L}])`, "u");
const genericActor = /(?:^|[^\p{L}])(?:و|ف)?((?:الإنسان|الانسان|المرء|الناس|البشر|المسلم|المؤمن|المريض|المسافر))(?![\p{L}])/gu;
const humanRole = word("رجلا?|الرجل|امرأة|المرأة|شيخا?|الشيخ|طفلا?|الطفل|مريضا?|المريض|مسافرا?|المسافر|سائلا?|السائل");
const pointedHuman = /(?:هذا|هذه|ذلك|تلك)\s+(?:الرجل|المرأة|الإنسان|الانسان|الطفل|الفتى|المريض|المسافر|السائل)(?=$|[^\p{L}])/u;
const pointedSelf = /(?:هذا\s+نفسه|هذه\s+نفسها)(?=$|[^\p{L}])/u;
// English summary sentences: unrestricted human audiences (reliability plan; the Arabic
// sentence check alone left English answers to the model reviewer).
const genericActorEn = /\b((?:a |every |any )?muslims?|(?:a |every |all )?believers?|everyone|everybody|anyone|anybody|whoever|people|a person|any person|every person|mankind|humans?|all (?:men|women))\b/giu;
// When a cited text also states a broader proposition, this deliberately narrow
// lexical check abstains. Independent semantic checking still decides support.
const broaderAudience = word("من|كل|أحد|احد|أحدا|احدا|العباد|الناس|البشر|الإنسان|الانسان");

/** Negative-only safety net (Arabic and English sentences) for a recognised referent substitution.
 * It detects neither every generalisation nor truth. No source IDs/topics/rulings
 * are hardcoded. No positive conclusion follows from an empty failure list. */
export function checkCaseReferents(items: Claim[], originals: { id: string; arabic: string }[]) {
  const failures: { claim_id: string; source_ids: string[]; code: "case_referent_generalized"; explanation: string }[] = [];
  for (const [index, c] of items.entries()) {
    const text = normal(c.text), arabic = /\p{Script=Arabic}/u.test(text);
    const generic = arabic ? [...text.matchAll(genericActor)].filter(m => {
      const start = m.index! + m[0].indexOf(m[1]), before = text.slice(0, start), after = text.slice(start + m[1].length);
      // These directly bind the actor to the described person/condition; a generic
      // sentence with an appended example is not enough to bind its subject.
      return !/(?:هذا|هذه|ذلك|تلك)\s+$/u.test(before) && !/^\s+(?:الذي|التي|إذا|اذا|عندما|حين)(?=$|[^\p{L}])/u.test(after);
    }) : [...text.matchAll(genericActorEn)].filter(m => {
      const before = text.slice(0, m.index!), after = text.slice(m.index! + m[0].length);
      return !/\b(?:this|that|the same)\s+$/iu.test(before) && !/^\s+(?:who|whom|in (?:this|that|such a) (?:case|situation))\b/iu.test(after);
    });
    if (arabic && /(?:في|ضمن)\s+(?:هذه|تلك)\s+(?:الحالة|الواقعة|الحادثة)(?=$|[^\p{L}])/u.test(text)) continue;
    if (!arabic && /\bin (?:this|that|such a|a specific|one) (?:case|situation|incident)\b/iu.test(text)) continue;
    if (!generic.length || !c.refs.length) continue;
    const sources = c.refs.map(id => originals.find(p => p.id === id));
    if (sources.some(p => !p)) continue; // Identity failures belong to existing checks.
    const caseOnly = sources.every(p => {
      const original = normal(p!.arabic);
      return (pointedHuman.test(original) || pointedSelf.test(original) && humanRole.test(original))
        && !broaderAudience.test(original);
    });
    if (!caseOnly) continue;
    failures.push({ claim_id: `C${index + 1}`, source_ids: [...c.refs], code: "case_referent_generalized",
      explanation: "The cited wording points to a particular person, while this sentence substitutes an unrestricted human audience. Preserve that actual person/case and its conditions; do not derive a general rule from the incident. All normal source and coverage checks still apply to any correction." });
  }
  return { blocked: failures.map(f => f.claim_id), reasons: failures.length ? ["case_referent_generalized"] : [], failures };
}
