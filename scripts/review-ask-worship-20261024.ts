// Manual Arabic-excerpt review for this exact settled attempt, not model approval.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { persistCampaign, digest, type CampaignLedger } from "./ask-arabic-campaign-guard";
const path = resolve("work/private-ask-evaluation/worship-full-retest-20261024.json");
const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261024-worship-retest-spend.json");
const report = JSON.parse(readFileSync(path, "utf8")), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
if (report.requestId !== "e863645c-b4de-4b2c-ad2b-0c1a063f74e6" || report.status !== "rich_answer" || report.independentReview !== "pending"
  || ledger.calls.length !== 21 || ledger.calls.some(c => c.cost === undefined) || ledger.stopped !== "worship_full_retest_20261024_finished_review_required"
  || digest(readFileSync(resolve("docs/ask-repair-runs/spend.json"), "utf8")) !== ledger.originalLedgerHash) throw Error("attempt_or_review_state_changed");
const q = report.sections.find((s: any) => s.group === "quran"), scholar = report.sections.find((s: any) => s.group === "scholar"), summary = report.sections.find((s: any) => s.group === "summary");
if (q.claims.length !== 1 || scholar.claims.length !== 1 || summary.claims.length !== 2
  || summary.claims[0].text !== scholar.claims[0].text || summary.claims[1].text !== q.claims[0].text) throw Error("reviewed_wording_changed");
report.independentReview = {
  status: "reviewed_supported_meanings_but_incomplete_indirect_answer", classification: "supported_but_incomplete",
  originalArabicExcerptReview: true, fullOfficialPageVerification: false, scholarlyCertification: false,
  uniqueSourceExplanationsReviewed: 2, sourceExplanationsSupportedInMeaning: 2,
  renderedClaimOccurrences: 4, uniqueMeanings: 2,
  findings: [
    { group: "quran", classification: "supported_meaning_with_clarity_caution", sources: ["Q41:46", "Q30:44"], finding: "Good work is for its actor and the actors prepare for themselves. The self-benefit/preparation core follows the cited Arabic without a specified monetary outcome. The wording ويعد به خيرا لنفسه is awkward and unvocalised يعد may be misread as promising rather than preparing; clearer Arabic is needed." },
    { group: "scholar", classification: "supported_meaning_with_clarity_caution", sources: ["S919939af-988a-4f22-bf27-4e3f0939f028", "S9809e714-6891-4412-b1eb-5fc83214a170"], finding: "Both excerpts explicitly give the general principle of complying with God's wise, beneficial legislation whether its wisdom is known. The statement does not import the specific gold/camel ruling. أتعرفوا is defective Arabic here; عرفوا is the intended form. These are source-supported meanings, not certification of the theological application." },
  ],
  completeness: { completeUsefulAnswer: false, concern1: "Only indirectly addressed: the answer mostly says to comply with wise beneficial legislation, without clearly resolving why worship is commanded despite divine self-sufficiency. The selected creation/purpose source is not explained in the final response.", concern2: "The general benefit of righteous work to its actor is explained.", coverageCaution: "The final checker marked full coverage, but that verdict does not establish that the visitor's difficult concern was actually resolved." },
  summary: { identicalSourceRecap: true, newMeaningAdded: false, finding: "Two source sentences are copied exactly in reverse order. Their supported meanings survive, but the recap supplies no clearer answer to the missing contrast. Do not count these repeated occurrences as independent faithfulness successes." },
  hadith: { outcome: "search_failed", clarification: "Some hadith source requests failed; surviving hadith candidates still reached selection but none were used. This was not proof that no relevant hadith exists. Missing a source group alone is not an incomplete answer when other evidence suffices.", scopeRegressionExercised: false },
  guidance: { review: "benign_study_intent_label_caution", finding: "The recommendation to reflect is a study suggestion. Its factual description of self-benefit matches the excerpts, but sourced_instruction can overstate whether those excerpts themselves instruct this particular study step. It should be presented as an ordinary learning suggestion, not a new religious obligation.", seriousUnsupportedReligiousInstruction: false },
  behaviour: "General explanatory question was handled without an unnecessary personal-ruling referral. No personal religious circumstances were invented.",
  presentation: "Structured response and source URLs are present; actual browser rendering/clicks/history saving were not tested. Empty hadith group should remain hidden under existing presentation rules.",
  timings: { firstCheckedMs: 105228, totalMs: 112687, baselineFirstCheckedMs: 60145, earlierPercent: (60145 - 105228) / 60145 * 100, targetPercent: 30, targetMet: false, recentFirstCheckedMs: 51373, slowerThanRecentPercent: (105228 - 51373) / 51373 * 100 },
  providerAndRetrieval: "Two Gemini ranking outputs hit length with most completion tokens spent reasoning, invoking the configured Mistral backup. Four logical ranking calls consumed about 45.7 seconds; the second combined score set was invalid and the existing bounded discovery fallback retained candidates. Some Quran search/neighbour reads timed out. These are observed facts; their separate causal effects on final answer quality are not isolated.",
  methodLimitations: "Direct call to the active rich pipeline, live sources, same model chains/checks, prepared reuse skipped and local total cutoff disabled. It did not exercise the HTTP/SSE route, UI or persistence. No explicit parent signal was supplied; unlike the stream route this selected pipeline.ts's no-parent-signal Quran search branch, which lacks the optional partial-query failure handler. This limits website-equivalence and retrieval-failure conclusions. Correct that harness boundary before another separately authorized run; do not rerun this completed request automatically.",
  attribution: "The case-referent guard did not fire and the problematic walking-vow explanation was absent. Different source results, outages, truncation and fallback prevent attributing the better-supported smaller answer to that repair or claiming general accuracy improvement.",
  sample: { planned: 50, attempted: 1, technicallyCompleted: 1, independentlyReviewed: 1, usefulCompleteAnswers: 0, untested: 49, historicalRepeatedCase: true, heldOutAccuracyEstablished: false },
  readiness: "More source-faithful displayed meanings in this particular run than the older failed example, but no clear verified full-answer reliability improvement or release acceptance. Main concern indirect, language weak, summary repetitive and latency target failed.",
};
const entry = ledger.evaluationCases?.find(c => c.requestId === report.requestId);
if (!entry || entry.review !== "pending") throw Error("review_entry_missing_or_already_changed");
entry.review = "failed";
persistCampaign(path, report); persistCampaign(ledgerPath, ledger);
console.log(JSON.stringify({ classification: report.independentReview.classification, uniqueSupportedMeanings: "2/2", usefulCompleteAnswers: "0/1", cost: report.cost, remaining: report.remainingAllowance, noAutomaticRepeat: true }));
