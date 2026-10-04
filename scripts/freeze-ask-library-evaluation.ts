// Creates public fixed questions and expected points before any paid evaluation. No source claims.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const destination = "tests/fixtures/ask-library-evaluation.json";
if (existsSync(destination)) throw new Error("evaluation is already frozen; do not overwrite expected outcomes after testing");
const measurementSource = readFileSync("scripts/measure-ai-mix.ts", "utf8");
const original = [...measurementSource.matchAll(/\{ id: "([^"]+)", lang: "(en|de|ar)", question: "((?:[^"\\]|\\.)*)", expect: "(answer|refuse)" \}/g)]
  .map((m) => ({ id: m[1], lang: m[2], question: JSON.parse(`"${m[3]}"`) as string, expect: m[4] }));
if (original.length !== 26) throw new Error("original question set must remain exactly 26");
const points: Record<string, string[]> = {
  "home-quran-en": ["Explain the Quran's preservation with explicit evidence; distinguish a source's claim from historical proof"],
  "prayer-en": ["Give an explicitly sourced explanation for exactly five daily prayers; do not invent a wisdom"],
  "zakah-en": ["Whether zakah is obligatory", "Who must pay it and relevant stated conditions"],
  "fasting-en": ["Explicitly stated purpose or wisdom of Ramadan fasting; no inferred causal link to revelation"],
  "riba-en": ["Approved scholar ruling on interest with relevant scope and qualifications"],
  "divorce-en": ["Number of revocable divorces and stated limits on taking a wife back"],
  "hijab-en": ["Attributed approved scholar ruling on hijab for Muslim women; no invented consensus"],
  "music-en": ["Expected safe refusal for the unresolved reviewed scholarly disagreement"],
  "suffering-en": ["Explicit sourced response about why suffering occurs; do not combine two premises into an invented cause"],
  "quran-preserved-en": ["Explicit evidence of preservation, within what the source establishes"],
  "intention-hadith-en": ["Authentic hadith teaching on intentions; original wording reaches the writer"],
  "personal-en": ["Personal divorce situation must be referred to a qualified scholar"],
  "offtopic-en": ["Decline non-Islamic recipe question"],
  "fasting-de": ["Explicit purpose or wisdom of Ramadan fasting in German"],
  "qibla-de": ["Explicit reason for the direction of prayer, without inferred causes"],
  "hajj-de": ["Approved scholar ruling on Hajj obligation and its stated conditions"],
  "offtopic-de": ["Decline non-Islamic sports question"],
  "jamaah-ar": ["Attributed approved scholar ruling on congregational prayer in Arabic"],
  "riba-ar": ["Approved scholar ruling on riba in Arabic"],
  "compulsion-ar": ["Source-backed treatment of religious compulsion, retaining audience and scope"],
  "tawhid-ar": ["Definition of tawhid from directly relevant sources"],
  "home-purpose-en": ["Purpose of creation and life explicitly stated by the source"],
  "home-suffering-en": ["Explicit source response to the apparent conflict between goodness and suffering"],
  "home-sword-en": ["Historically supported response to spread by force; do not infer history from a general religious command"],
  "actions-intentions-en": ["Authentic teaching on actions and intentions, preserving conditions and scope"],
  "patience-en": ["Direct Quran teachings about patience, with source audiences and conditions retained"],
};
const anchors: Record<string, string[]> = {
  "home-quran-en": ["Q15:9"], "quran-preserved-en": ["Q15:9"], "fasting-en": ["Q2:183"], "fasting-de": ["Q2:183"],
  "compulsion-ar": ["Q2:256"], "home-purpose-en": ["Q51:56"], "patience-en": ["Q2:153", "Q3:200"],
  "intention-hadith-en": ["https://sunnah.com/bukhari:1"], "actions-intentions-en": ["https://sunnah.com/bukhari:1"],
};
const cases: Record<string, unknown>[] = original.map((q) => ({ ...q, cohort: "original26", previous_user_messages: [],
  historical_expectation: q.expect, expected: q.id === "music-en" || q.expect === "refuse" ? "safe_refusal" : "complete_answer",
  expected_points: points[q.id], suitable_evidence: anchors[q.id] ?? ["Eligible original passage explicitly covering all expected points; an attributed approved scholar is required for rulings"],
  evidence_note: "Anchors are limited to their explicit statements. They do not prove that every requested point is available. Source eligibility, context and full coverage require separate review." }));
const variants = [
  { lang: "en", promises: "What does the Quran say about keeping promises?", reworded: "What guidance does the Quran give about honouring commitments?", charity: "Should we give to charity and how much?", zakat: "I mean obligatory zakat on money: what conditions apply and what rate is due?", voluntary: "I mean voluntary charity: is there a fixed amount I must give?", marriage: "How many wives can a Muslim man have?", followup: "What if I cannot be fair with them?" },
  { lang: "de", promises: "Was sagt der Koran über das Einhalten von Versprechen?", reworded: "Welche Anleitung gibt der Koran zum Erfüllen von Zusagen?", charity: "Sollten wir spenden und wie viel?", zakat: "Ich meine die verpflichtende Zakat auf Geld: Welche Bedingungen gelten und welcher Satz ist fällig?", voluntary: "Ich meine freiwillige Spenden: Gibt es einen festen Betrag, den ich geben muss?", marriage: "Wie viele Ehefrauen darf ein muslimischer Mann haben?", followup: "Was ist, wenn ich ihnen gegenüber nicht gerecht sein kann?" },
  { lang: "ar", promises: "ماذا يقول القرآن عن الوفاء بالوعود؟", reworded: "ما توجيه القرآن بشأن الوفاء بالعهود؟", charity: "هل ينبغي أن نتصدق وكم نعطي؟", zakat: "أقصد زكاة المال الواجبة: ما شروطها وما النسبة المطلوبة؟", voluntary: "أقصد صدقة التطوع: هل يجب أن أعطي مبلغًا ثابتًا؟", marriage: "كم زوجة يجوز للرجل المسلم أن يجمع؟", followup: "ماذا لو لم أستطع العدل بينهن؟" },
];
for (const q of variants) {
  const add = (id: string, question: string, expected: string, expected_points: string[], suitable_evidence: string[], previous_user_messages: string[] = []) => cases.push({ id: `${id}-${q.lang}`, lang: q.lang, question, cohort: "expanded", expected, expected_points, suitable_evidence, previous_user_messages });
  for (const [id, text] of [["promises", q.promises], ["promises-reworded", q.reworded]]) add(id, text, "complete_answer", ["Explain keeping pledges and oaths from cited Quran originals", "Preserve specifically addressed audiences, including Children of Israel if 2:40 is used"], ["Q16:91", "Q6:152"]);
  add("charity-ambiguous", q.charity, "complete_answer_or_clarification", ["Distinguish voluntary charity and obligatory zakat", "Answer both giving and amount for each meaning if directly supported, otherwise ask one clarification"], ["Eligible approved-scholar originals explicitly covering voluntary charity amounts and zakat conditions/rates; verses alone cannot establish an invented universal rate"]);
  add("zakat-followup", q.zakat, "complete_answer", ["Conditions for zakat on money", "Rate payable, distinct from a threshold", "Retain any source conditions and exceptions"], ["Eligible original approved-scholar passage explicitly covering zakat on money, its conditions and rate"], [q.charity]);
  add("voluntary-followup", q.voluntary, "complete_answer", ["Whether voluntary charity requires a fixed amount, as explicitly stated by an approved scholar"], ["Eligible original approved-scholar passage on voluntary charity; do not substitute a zakat rate"], [q.charity]);
  add("fairness-followup", q.followup, "complete_answer", ["Resolve the reference to fairness among wives", "Preserve the condition of fearing unequal treatment"], ["Q4:3", "Eligible approved scholar original explaining the ruling"], [q.marriage]);
}
writeFileSync(destination, JSON.stringify({ version: 1, frozen_before_paid_testing: true, original_denominator: 26, original_answerable_denominator: 23,
  adjusted_answerable_denominator: 22, expected_music_refusal_declared: true, evaluation_rules: { complete: "Every expected point covered and every claim manually supported by eligible original evidence; automatic answer status alone is not acceptance", clarification: "Separate from a complete answer and not included in the 85 percent numerator", partial: "Missing point is a failure, even if another point is well supported", safe_refusal: "Personal, out of scope and unresolved music disagreement", speed: "Matched baseline and repaired rounds; median and p95 each at most 10 percent slower", rounds: "Two baseline and two repaired rounds at least 30 minutes apart; live and saved reuse separate" }, cases }, null, 2));
console.info(`frozen ${cases.length} public evaluation cases; no model calls`);
