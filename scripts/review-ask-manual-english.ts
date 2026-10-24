// Read-only review of an existing completed website request. No network/model
// calls, visitor-history writes or evaluation spending changes.
import { existsSync, readFileSync } from "node:fs";
import { digest, persistCampaign } from "./ask-arabic-campaign-guard";

const id = "e218d30c-525a-41be-afc7-7d4c06927245";
const path = `work/local-ask-traces/${id}.jsonl`, bytes = readFileSync(path, "utf8");
const events = bytes.trim().split(/\r?\n/u).map(line => JSON.parse(line));
const terminal = events.find(e => e.event === "terminal_result")?.data;
if (terminal?.status !== "rich_answer" || terminal.answer.language !== "en") throw Error("reviewed_request_changed");
const sections = terminal.answer.sections;
const quran = sections.find((s: any) => s.group === "quran"), scholar = sections.find((s: any) => s.group === "scholar"), summary = sections.find((s: any) => s.group === "summary");
if (quran.claims.length !== 3 || scholar.claims.length !== 3 || summary.claims.length !== 3
  || !scholar.claims[2].text.endsWith("beneficial actions, and ongoing support.")
  || !summary.claims[2].text.endsWith("beneficial actions, and ongoing support.")) throw Error("exact_reviewed_wording_changed");
const source = scholar.sources.find((s: any) => s.id === "S22356870-5771-4e57-95ed-0a8beab56ddd")?.evidence;
if (!source?.arabic.includes("ما لم يطرداه، ويأبيا قبول صلته")) throw Error("original_qualification_changed");
const usage = events.filter(e => e.event === "model_transport" && e.data.code === "model_usage").map(e => e.data.details);
if (usage.length !== 18 || usage.some(u => !Number.isFinite(u.cost_usd))) throw Error("historical_usage_incomplete");
const findings = [
  { claim: "quran:1", status: "supported_core_with_extra_application_caution", note: "Kindness to parents is explicit. The additional phrase even during life's struggles is not a distinct statement in the own excerpts; their explicit hardship concerns pregnancy and birth. It may be a permissible application of a general command, but is not independently accepted as an exact source assertion. No new religious ruling is inferred from this caution." },
  { claim: "quran:2", status: "supported", note: "Its own 29:8 and 31:15 preserve the refusal of pressure toward association without adding the separate no-knowledge alternative found in the later Arabic failure." },
  { claim: "quran:3", status: "supported", note: "31:15 explicitly retains worldly companionship in a right manner despite the pressure toward association." },
  { claim: "scholar:1", status: "supported", note: "The own Ibn Baz excerpt describes dutifulness as a great obligation and associates the parents' right with God's right." },
  { claim: "scholar:2", status: "supported", note: "Its own excerpts expressly restrict obedience to what is right and exclude obedience in disobedience to the Creator; Ibn Baz is named." },
  { claim: "scholar:3", status: "necessary_qualification_not_preserved", note: "The own original qualifies continuing ties/assistance when the parents expel the child and reject those ties. The English draft says the individual must maintain companionship with ongoing support, without that limitation. This is the same omission family observed in Arabic. Its if-parents-deviate-or-issue-commands wording also merits clause-scope review; no wider ruling is accepted." },
  { claim: "summary:1", status: "supported", note: "The own Quran kindness commands and named Ibn Baz obligation statement support these combined cores." },
  { claim: "summary:2", status: "supported", note: "The Quran supplies the association exception; its own cited scholar excerpt supplies the broader disobedience limit, so the broader wording is not attributed to the Quran alone." },
  { claim: "summary:3", status: "necessary_qualification_not_preserved", note: "Its own Ibn Baz excerpt's explicit rejection/expulsion qualification is again absent while ongoing support is framed as required. The summary repeats and carries the source-section omission into the completed answer." },
];
const target = "work/private-ask-evaluation/manual-english-source-review-20261024.json";
if (existsSync(target)) throw Error("completed_review_not_overwritten");
if (readFileSync(path, "utf8") !== bytes) throw Error("request_trace_changed_during_review");
const report = { status: "reviewed_existing_complete_answer_with_condition_omissions", requestId: id, traceHash: digest(bytes),
  requestAt: events[0].at, language: "en", technicalStatus: "rich_answer", independentlyAcceptedUsefulComplete: false,
  classification: "containing_missing_qualifications", reviewedClaimOccurrences: 9, supportedOccurrences: 6, qualificationFailures: 2, applicationCautions: 1,
  findings, originalArabicReviewed: true, originalHash: digest(source.arabic), fullPagesRefetched: false, scholarlyCertification: false,
  displayTranslations: "Quran translations supplied; scholar display translations unavailable. English generated explanations still require faithfulness to the own Arabic originals. Translation availability alone neither proves nor refutes those explanations.",
  timing: { firstQuranMs: events.find(e => e.event === "stage" && e.data.code === "checked_quran_ready")?.elapsed_ms, totalMs: events.at(-1).elapsed_ms,
    beforeCurrentQuranStallRepair: true, causalComparisonOrOriginalTimingTargetProved: false },
  existingManualRequestUsage: { calls: usage.length, observedCost: usage.reduce((s,u) => s + u.cost_usd, 0),
    promptTokens: usage.reduce((s,u) => s + (u.prompt_tokens ?? 0), 0), completionTokens: usage.reduce((s,u) => s + (u.completion_tokens ?? 0), 0),
    scope: "Historical visitor-initiated website request, not a new agent evaluation call. Do not insert these charges into frozen evaluation journals or call their remainder an account balance." },
  thisReview: { networkCalls: 0, modelCalls: 0, cost: 0, traceChanged: false, spendingJournalsChanged: false, websiteOrHistoryChanged: false },
  conclusion: "A technically complete English answer can still omit source conditions, matching a known Arabic failure family. No overall accuracy score, new live test, acceptance of the completed answer or proof about the post-restart request follows. Preserve the transport fix without claiming semantic reliability." };
persistCampaign(target, report);
console.log(JSON.stringify({ status: report.status, claimsReviewed: 9, supported: 6, qualificationFailures: 2, applicationCautions: 1, newCalls: 0, newCost: 0 }));
