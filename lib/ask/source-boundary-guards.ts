import { normalizeArabic, type Claim } from "./checks";

type Original = { id: string; arabic: string };
type BoundaryFailure = { claim_id: string; source_ids: string[]; code: "explicit_condition_unaccounted" | "uncited_alternative";
  explanation: string; source_id: string; original_excerpt: string };
const norm = (s: string) => normalizeArabic(s.normalize("NFKC"));
const words = (s: string) => (norm(s).match(/\p{L}+/gu) ?? []).map(w => {
  // Only written clitics plus a definite article, never stemming or a synonym
  // dictionary. Preserve the original strings separately for repair feedback.
  const m = /^(?:و|ف)?(?:ب|ك|ل)?ال(.{3,})$/u.exec(w);
  return m ? m[1] : /^[وبفك]ا(?!ل)/u.test(w) ? w.slice(1) : w;
});
const contains = (whole: string[], part: string[]) => part.length > 0 && whole.some((_, i) => part.every((w, j) => whole[i + j] === w));
// Do not treat normalised أن/إن as an unambiguous condition marker: أن is
// routinely a complementiser in a faithful attributed explanation.
const conditional = /(?:^|[^\p{L}])(?:اذا|عند|عندما|حين|متي|بشرط|بحسب)(?=$|[^\p{L}])|في\s+حال|ما\s+لم/u;
const negatedAction = /(?:لا\s+(?:يجب|يلزم)|ليس(?:ت)?\s+(?:واجبا|واجب|لازما)|ليس\s+بالضروره)/u;
const limitLanguage = /(?:^|[^\p{L}])(?:مشروط|مقيد|مرتبط|يرتبط|مرهون|متوقف|شروط|قيود|مراعاه|يراعي|بحسب)(?=$|[^\p{L}])|في\s+حدود|علي\s+قدر/u;
const generalScope = /(?:^|[^\p{L}])(?:كل|جميع|اي|فيما)(?=$|[^\p{L}])/u;
const normative = /لا\s+(?:طاعه|يجوز|يحل)|(?:^|[^\p{L}])(?:يجب|يحرم|واجب)(?=$|[^\p{L}])/u;
const conditionalRefusal = (s: string) => /(?:^|[^\p{L}])و?إن\s+[\s\S]{1,260}?فلا(?=$|[^\p{L}])/u
  .test(s.normalize("NFKC").replace(/[\p{M}ـ]/gu, ""));

/** Narrow negative-only review gates, not an entailment engine. Empty results
 * never approve a claim. Ambiguous wording abstains and keeps normal checking.
 * No source IDs, religious topics, rulings or approved answers are encoded. */
export function checkSourceBoundaries(items: Claim[], originals: Original[]) {
  const failures: BoundaryFailure[] = [];
  items.forEach((c, index) => {
    const own = c.refs.map(id => originals.find(p => p.id === id));
    if (!own.length || own.some(p => !p)) return; // Existing identity checks decide this.
    const cited = own as Original[], text = norm(c.text), claimWords = words(c.text);
    const add = (code: BoundaryFailure["code"], source: Original, excerpt: string, explanation: string) => {
      if (!failures.some(f => f.claim_id === `C${index + 1}` && f.code === code)) failures.push({ claim_id: `C${index + 1}`,
        source_ids: [...c.refs], code, source_id: source.id, original_excerpt: excerpt, explanation });
    };
    // Recognise only short, explicitly delimited "act IF condition" source
    // clauses, when that very act is repeated without any condition in the
    // claim. Other teachings, conditional paraphrases and negative statements
    // are left to normal semantic review; no unrelated condition is imposed.
    if (!conditional.test(text) && !negatedAction.test(text) && !limitLanguage.test(text)) for (const source of cited) {
      for (const raw of source.arabic.split(/[،؛;.!؟\n]/u)) {
        const chunk = norm(raw).trim(), m = /^(.{3,140}?)\s+(?:اذا|عند|حين|بشرط)\s+(.{2,100})$/u.exec(chunk);
        if (!m) continue;
        const action = words(m[1]), condition = words(m[2]);
        if (action.length < 2 || action.length > 5 || !condition.length || condition.length > 8 || !contains(claimWords, action)
          || contains(claimWords, condition)) continue;
        // A complementary citation that explicitly supplies the same act
        // without this recognised conditional form makes lexical inference
        // ambiguous. Abstain rather than treating this source as exclusive.
        if (cited.some(p => p.id !== source.id && contains(words(p.arabic), action))) continue;
        add("explicit_condition_unaccounted", source, raw.trim(),
          "This sentence repeats an act from an explicit conditional source clause but does not account for that condition. Preserve the relevant limit in the same sentence, or omit that act. Do not apply the condition to unrelated teachings. This gate identifies an unaccounted source limit, not a new religious ruling.");
      }
    }
    // Recognise an expanded either/or instruction whose terminology occurs
    // only in another sealed original, not this sentence's cited originals.
    // This is a request to narrow/review citation scope, never proof that the
    // additional rule is false. Explicitly general originals abstain.
    // Limit this lexical alert to an explicit IF ... DO NOT structure in
    // every own original. General permissions and ordinary synonymous lists
    // are not inferred to be wrong because a word appears in another source.
    if (!normative.test(text) || !cited.every(p => conditionalRefusal(p.arabic)) || cited.some(p => generalScope.test(norm(p.arabic)))) return;
    const ownWords = new Set(cited.flatMap(p => words(p.arabic)));
    for (const m of text.matchAll(/(\p{L}{4,})\s+او\s+(\p{L}{4,})/gu)) for (const branch of [m[1], m[2]]) {
      const token = words(branch)[0];
      if (!token || token.length < 4 || ownWords.has(token)) continue;
      const foreign = originals.find(p => !c.refs.includes(p.id) && words(p.arabic).includes(token));
      if (!foreign) continue;
      const originalWord = [...foreign.arabic.matchAll(/[\p{L}\p{M}]+/gu)].find(m => words(m[0])[0] === token)?.[0];
      if (!originalWord) continue;
      add("uncited_alternative", foreign, originalWord,
        "An alternative in this instruction uses terminology found only in another sealed source, not these citations. Do not borrow that source's authority. Narrow this source explanation to its own originals; place a wider supported teaching in its proper cited explanation. This lexical gate does not declare the wider teaching false and cannot prove synonym equivalence.");
    }
  });
  return { blocked: [...new Set(failures.map(f => f.claim_id))], reasons: [...new Set(failures.map(f => f.code))], failures };
}
