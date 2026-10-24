// Independent review of the saved Arabic originals; no model or network calls.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

const reportPath = resolve("work/private-ask-evaluation/compact-ranking-full-retest-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-compact-ranking-spend.json");
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (report.requestId !== "d9e9b89d-1e12-44d2-bb08-2749ea930946" || report.independentReview !== "pending"
  || ledger.calls.length !== 19 || ledger.calls.some(c => c.cost === undefined)
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash)
  throw Error("attempt_or_review_state_changed");
const q = report.sections.find((s: any) => s.group === "quran");
const summary = report.sections.find((s: any) => s.group === "summary");
if (q.claims.length !== 3 || summary.claims.length !== 3
  || q.claims[1].text !== "يعود نفع العبادة وشكر الله على العباد أنفسهم لأن الله غني عن العالمين."
  || q.claims[2].text !== "يمهد العاملون للصالحات منازلهم في الآخرة وينالون من فضل الله وجزائه.")
  throw Error("reviewed_wording_changed");
report.independentReview = {
  status: "reviewed_source_scope_and_qualification_failures", classification: "containing_unsupported_claim",
  originalArabicExcerptReview: true, fullOfficialPageVerification: false, scholarlyCertification: false,
  renderedClaimOccurrencesReviewed: 6, fullyEstablishedWholeClaims: 0, usefulCompleteAnswers: 0,
  findings: [
    { occurrences: ["quran:1", "summary:1"], classification: "supported_core_with_unresolved_wording", sources: ["Q51:56", "Q51:57"], finding: "Creation for worship and no requested provision/feeding are explicit. وحده is ambiguous between exclusive worship and sole purpose; the own excerpts do not independently establish every added exclusivity nuance. Needs is stronger than requests. Retain these qualifications rather than count the whole sentence as fully proved." },
    { occurrences: ["quran:2", "summary:2"], classification: "unsupported_scope_extension", sources: ["Q31:12"], finding: "The original explicitly says the person who gives thanks benefits himself. The sentence broadens gratitude to worship generally and supplies a causal connection. Familiar theological truth and other uncited sources are not own-citation proof. The checker approved both occurrences." },
    { occurrences: ["quran:3", "summary:3"], classification: "missing_qualification_and_added_specificity", sources: ["Q30:44", "Q30:45"], finding: "The reward recipients in 30:45 are those who believe AND do good. Both sentences omit belief while attaching the reward to people doing good. منازلهم adds specific dwellings/stations beyond these exact originals. The surrounding Day context explains the hereafter setting but does not supply that specific noun. Both occurrences passed the checker." },
  ],
  hadith: { classification: "withheld_after_failed_correction", finding: "Initial explanatory sentence was rejected for source copying. One coordinated correction changed the divine promise into protection by wisdom and pardon. The broad audit approved it, but the independent secondary verdict rejected that change and the group stayed withheld. No relevant hadith absence or transport failure should be inferred." },
  scholar: { classification: "omitted", finding: "A scholar source was available to the writer but no scholar contribution was written. This is not evidence of a scholar-provider outage, and an omitted group alone does not make the answer incomplete." },
  guidance: { classification: "appropriate_learning_suggestion", finding: "Optional reflection on the cited surahs is an ordinary study suggestion, not a fabricated religious obligation." },
  completeness: "Both concerns received direct-looking text, but source scope and missing beneficiary conditions prevent accepting a useful complete answer. Repeated summary wording preserves the same defects.",
  ranking: { calls: 4, exactLengthArrays: 4, lengthFinishes: 0, backups: 0, totalMs: 13110, priorTotalMs: 45728, semanticAccuracyEstablished: false, finding: "All arrays retain request order rather than sorted score order. Mechanical identity/count validation passes. Some indirectly related material still gets high scores; valid shape does not establish relevance accuracy." },
  timings: { firstCheckedMs: report.firstCheckedMs, totalMs: report.totalMs, previousFirstCheckedMs: 105228, firstEarlierPercent: (105228-report.firstCheckedMs)/105228*100, originalBaselineMs: 60145, originalTargetPercent: 30, originalTargetMet: false },
  methodLimitations: "One repeated Arabic R01, current rich pipeline with parent signal, live sources and no prepared reuse. No HTTP/SSE/browser/history test, held-out batch or scholarly acceptance. Retrieval/model variation and the corrected harness prevent isolating all elapsed-time changes to output format.",
  readiness: "Measured ranking transport/speed improvement, not verified general answer reliability. Missing conditions and scope expansion are the highest-value next repair. Do not add money, rerun automatically, deploy or mark the goal complete.",
};
const entry = ledger.evaluationCases?.find(c => c.requestId === report.requestId);
if (!entry || entry.review !== "pending") throw Error("review_entry_missing_or_changed");
entry.review = "failed";
persistCampaign(reportPath, report);
persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ classification: report.independentReview.classification, calls: ledger.calls.length, cost: report.cost, remaining: report.remainingAllowance, firstCheckedMs: report.firstCheckedMs, totalMs: report.totalMs }));
