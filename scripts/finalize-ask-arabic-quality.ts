// Records the agent's direct source review. No model calls or website changes.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ARABIC_CASES, orderedArabicCases, PILOT_ORDER } from "./ask-arabic-quality-cases";
import { matchingTopicHints } from "../data/topic-source-hints";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

const root = resolve("work/private-ask-evaluation/arabic-quality-20261022");
const reportPath = resolve(root, "report.json"), ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261022-spend.json");
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (ledger.calls.some(c => c.cost === undefined)) throw new Error("cannot_finalize_with_unsettled_new_charge");
if (report.rows.length !== 5 || report.rows.some((r: any) => !PILOT_ORDER.includes(r.id))) throw new Error("unexpected_sample");
if (digest(readFileSync("docs/ask-repair-runs/spend.json", "utf8")) !== ledger.originalLedgerHash) throw new Error("original_ledger_changed");
const pilotHintEquivalence = PILOT_ORDER.map(id => ({ id, matches: matchingTopicHints(ARABIC_CASES.find(c => c.id === id)!.question).map(h => h.id) }));
if (pilotHintEquivalence.some(c => c.matches.length)) throw new Error("pilot_search_hint_equivalence_not_established");

const reviews: Record<string, any> = {
 R01: { classification: "supported_but_incomplete", faithfulness: "supported", completeness: "incomplete", qualifications: "no material dropped condition identified in the two delivered claims", relevance: "relevant", clarity: "readable but shallow", behaviour: "partial research rather than an appropriate final refusal", presentation: "partial section honestly labelled incomplete; source links valid; browser interaction not tested", displayedClaims: 2, fullyCleanClaims: 2,
  finding: "Quran section supports God's independence and human benefit. No final summary; hadith/correction and whole-audit failures prevented completion.", sources: ["https://quran.com/31/12", "https://quran.com/35/15", "https://quran.com/17/7"] },
 R03: { classification: "unnecessary_withholding", faithfulness: "not_applicable_no_displayed_claims", completeness: "no_answer", qualifications: "not_applicable", relevance: "direct Quran and scholar evidence was found", clarity: "no Arabic explanation delivered", behaviour: "unnecessary withholding due to technical writing failures", presentation: "empty resolved groups should be hidden by current component; no browser run", displayedClaims: 0, fullyCleanClaims: 0,
  finding: "The actual writer system explicitly requested Arabic. Initial Quran draft and combined correction were English. Initial scholar draft omitted a selected background source; learning next_step incorrectly included citations. All explanations withheld. This was not proof of missing religious evidence.", sources: ["https://quran.com/31/15", "https://binbaz.org.sa/fatwas/2846/طاعة-الوالدين-تكون-في-المعروف"] },
 F01: { classification: "unsupported_material_implication", faithfulness: "material_qualification_missing", completeness: "incomplete", qualifications: "legal validity confused with reward and ethical completeness", relevance: "relevant authentic hadith, mishandled conclusion", clarity: "readable but legally misleading", behaviour: "checker approved unsupported implication in a displayed partial section", presentation: "incomplete terminal status does not make earlier displayed claims safe", displayedClaims: 2, fullyCleanClaims: 1,
  offendingText: "بين النبي صلى الله عليه وسلم أن ترك الكذب والفعل الباطل أثناء الصيام يعد أمرا أساسيا لمن أراد صحة صيامه.",
  finding: "The phrase صحة صيامه frames abandoning lies as necessary for legal validity. The cited hadith does not establish that consequence. HadeethEnc's explanation explicitly distinguishes reduced reward from invalidation. The checker gave direct_support/conditions_preserved/scope_preserved yes to this claim. Stop further paid evaluation.", sources: ["https://hadeethenc.com/ar/browse/hadith/66270", "https://hadeethenc.com/en/browse/hadith/3546"] },
 F08: { classification: "supported_complete_with_minor_wording_correction", faithfulness: "main_teaching_supported_minor_word_error", completeness: "adequate_basic_answer", qualifications: "no material unsafe religious instruction identified", relevance: "relevant", clarity: "needs Arabic copy editing; السر should not replace السراء and ومالكها is awkward", behaviour: "appropriate general answer", presentation: "source-family gaps do not prevent complete status; current view hides empty scholar group; browser not exercised", displayedClaims: 4, fullyCleanClaims: 3,
  finding: "One completed answer with supported self-control, forgiveness and prophetic advice. Quran explanation contains a word error (السر versus السراء); the overall moral teaching is preserved but the answer is not correction-free. Practical depth remains modest. Study next-step adds no new ruling.", sources: ["https://quran.com/3/134", "https://hadeethenc.com/ar/browse/hadith/5351", "https://hadeethenc.com/ar/browse/hadith/4709"] },
 B01: { classification: "appropriate_referral", faithfulness: "not_applicable_no_substantive_answer", completeness: "appropriate_personal_case_boundary", qualifications: "did_not_decide_marriage_status", relevance: "appropriate", clarity: "terminal referral response", behaviour: "correctly referred", presentation: "pipeline status only; actual referral screen copy not exercised", displayedClaims: 0, fullyCleanClaims: 0,
  finding: "Recognised an individual triple-divorce/anger case and returned ask_scholar without issuing a marriage-status verdict.", sources: [] },
};
const phaseRows: any[] = [];
for (const row of report.rows) {
 row.review = reviews[row.id];
 const events = readFileSync(resolve("work/local-ask-traces", `${row.requestId}.jsonl`), "utf8").trim().split(/\r?\n/).map(line => JSON.parse(line));
 const usages = events.filter((e: any) => e.event === "model_transport" && e.data.code === "model_usage");
 row.measurement = { calls: row.calls.length, inputTokens: row.calls.reduce((n: number, c: any) => n + (c.promptTokens ?? 0), 0), outputTokens: row.calls.reduce((n: number, c: any) => n + (c.completionTokens ?? 0), 0),
  correctionCalls: events.filter((e: any) => e.event === "model_request" && e.data.phase === "draft" && e.data.prompt?.correction).length,
  fallbackSelections: events.filter((e: any) => e.event === "model_transport" && e.data.code === "fallback_selected").length,
  failures: [...new Set(events.filter((e: any) => e.event === "stage" && /invalid|failed|overlap|copied|wrong_language/.test(e.data.code)).map((e: any) => e.data.code))],
  thirtyPercentEarlier: row.firstCheckedMs !== null ? row.firstCheckedMs <= .7 * row.totalMs : null };
 row.phaseCosts = {};
 for (const e of usages) { const phase = e.data.phase; row.phaseCosts[phase] = (row.phaseCosts[phase] ?? 0) + (e.data.details.cost_usd ?? 0); phaseRows.push({ phase, cost: e.data.details.cost_usd ?? 0 }); }
}
ledger.stopped = "source_faithfulness_failure_review_required";
persistCampaign(ledgerPath, ledger);
report.status = "stopped_after_first_batch_material_source_faithfulness_issue";
report.reviewedAt = new Date().toISOString();
report.newCost = ledger.calls.reduce((n, c) => n + (c.cost ?? 0), 0);
report.combinedExposure = ledger.priorExposure + report.newCost;
report.qualityReview = { method: "Agent compared every displayed claim against original Arabic passages and independent first-party source pages; not a second paid model verdict or scholarly certification", pilotHintEquivalence,
  setupNote: "Runner initially disabled internal reference hints. Inspection proved all five pilot questions have zero matching hints; paid pilot behaviour is equivalent. Runner corrected for any future eligible batch. No calls or completed questions were repeated.",
  planned: 50, attempted: 5, reviewedAttempts: 5, notTested: 45, substantiveOutputs: 3, automaticComplete: 1, incomplete: 3, appropriateReferrals: 1,
  answerableAttempts: 4, usefulCompleteWithMinorCopyEdit: 1, usefulCompleteFraction: "1/4 (25%)", strictCorrectionFreeComplete: "0/4 (0%)",
  fullyCleanSubstantiveOutputs: "1/3 (33.3%)", mostlySupportedWithMinorWordingIssue: 1, materiallyUnsupportedOutputs: 1,
  displayedClaims: 8, cleanlySupportedClaims: 6, minorWordingErrors: 1, materiallyMisleadingClaims: 1,
  generalAccuracy: "not_estimated_small_early_stopped_sample", unsupportedPersonalRulings: 0, newUncertainCharges: 0,
  providerErrors: ledger.calls.filter(c => c.httpStatus !== 200).length,
  calls: ledger.calls.length, inputTokens: ledger.calls.reduce((n,c) => n + (c.promptTokens ?? 0),0), outputTokens: ledger.calls.reduce((n,c) => n + (c.completionTokens ?? 0),0),
  phaseCost: Object.fromEntries([...new Set(phaseRows.map(r => r.phase))].map(phase => [phase, phaseRows.filter(r => r.phase === phase).reduce((n,r) => n + r.cost,0)])),
  reviewLimitations: ["Arabic-only five-question non-random pilot, stopped for a material error", "No browser/device interaction or production deployment tested", "No held-out, paraphrase or follow-up outcomes established", "No claim that the remaining 45 questions would behave the same"] };
persistCampaign(reportPath, report);
writeFileSync("docs/ask-arabic-quality-question-bank-2026-10-22.md", "# Arabic quality question bank — 22 October 2026\n\n50 fixed questions. The first five were tested; the remaining 45 were not tested because source-faithfulness review triggered the agreed stop. No reference hints were inserted into visitor wording.\n\n" + orderedArabicCases().map(c => `## ${c.id} — ${c.group} — ${PILOT_ORDER.includes(c.id) ? "TESTED" : "NOT TESTED"}\n\n${c.question}\n\nExpected: ${c.expected}. Concerns: ${c.concerns.join("; ")}. Qualification: ${c.qualification}.${c.history ? `\n\nPrior visitor message: ${c.history.join(" / ")}` : ""}\n`).join("\n"));
console.log(JSON.stringify({ status: report.status, newCost: report.newCost, combinedExposure: report.combinedExposure, summary: report.qualityReview }));
