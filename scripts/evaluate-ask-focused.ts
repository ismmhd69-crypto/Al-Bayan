// Offline preparation or explicitly reviewed, spending-guarded component comparison.
// Reuses the actual rich and focused request builders; never submits visitor questions.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { frozenAuditCases, evaluationInput } from "./evaluate-claim-audit";
import recorded from "../tests/fixtures/ask-recorded-support-pairs.json";
import type { PassageForSelection } from "../lib/ask/retrieval";
import { sourceSupportRequest, parseSourceSupport } from "../lib/ask/focused-checks";
import { richReviewRequest } from "../lib/ask/rich-review-request";
import { sealedPackageJson } from "../lib/ask/core";
import { parseClaimAudit, CLAIM_AUDIT_FIELDS } from "../lib/ask/checks";
import { withModelTransport } from "../lib/ai/transport";
import { installSpendGuard, reserveUsd, AskSpendStop, type SpendGuard } from "./ask-spend-guard";
import { sharedAskLedgerPath } from "./ask-test-profile";

const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export type FocusedCase = ReturnType<typeof frozenAuditCases>[number] & { additionalCandidates?: PassageForSelection[] };
export type CheckerMode = "legacy_rich_support" | "focused_support";
export type CheckerOutcome = "supported" | "unsupported" | "uncertain" | "invalid" | "error";
export type FocusedRow = { id: string; mode: CheckerMode; expected: string; outcome: CheckerOutcome; cost: number; ms: number; modelsCalled?: string[] };

export function focusedCases(): FocusedCase[] {
  const additions = recorded.pairs.flatMap(pair => [false, true].flatMap(context => (["en", "de", "ar"] as const).flatMap(language =>
    (["faithful", "incorrect"] as const).map(variant => {
      const candidates = pair.candidateIds.map(id => {
        const p = structuredClone(recorded.candidates.find(c => c.id === id)) as PassageForSelection;
        if (!p) throw Error("recorded_candidate_missing");
        if (!context) p.context = [];
        return p;
      });
      return { id: `${pair.id}/${context ? "with-context" : "without-context"}/${language}/${variant}`, language, variant, category: pair.category,
        candidate: candidates[0], additionalCandidates: candidates.slice(1), summary: pair.claims[language][variant], expected: variant === "faithful" ? "accept" : "reject" };
    }))));
  return [...frozenAuditCases(), ...additions];
}
function focusedInput(c: FocusedCase) {
  const input = evaluationInput(c);
  for (const p of c.additionalCandidates ?? []) input.evidence.passages.push({ ...p, requirementIds: ["R1"], facets: ["general"] });
  input.answer.claims[0].refs = input.evidence.passages.map(p => p.id);
  return input;
}

export function focusedCaseFingerprint(c: FocusedCase) {
  return sha({ id: c.id, language: c.language, candidate: c.candidate, additionalCandidates: c.additionalCandidates ?? [], claim: c.summary, expected: c.expected });
}
export function focusedEvaluationRequest(c: FocusedCase, mode: CheckerMode, signal?: AbortSignal) {
  const { evidence, answer } = focusedInput(c);
  return mode === "focused_support" ? sourceSupportRequest(answer.claims, evidence, c.language, signal)
    : richReviewRequest({ items: answer.claims, serialized: sealedPackageJson(evidence, c.language, false, true), language: c.language,
      full: false, question: "Explain only what the cited passage establishes in its own context.", guidance: null,
      translationCandidates: [], summaryCount: 0, earlierCount: 0, signal });
}
export function focusedEvaluationOutcome(raw: unknown, c: FocusedCase, mode: CheckerMode): CheckerOutcome {
  const { evidence, answer } = focusedInput(c);
  if (mode === "focused_support") {
    const result = parseSourceSupport(raw, answer.claims, evidence);
    return !result.valid ? "invalid" : result.supported ? "supported" : result.failures.some(f => f.reason_codes.includes("uncertain"))
      || !!(raw && typeof raw === "object" && Array.isArray((raw as { claims?: unknown }).claims)
        && (raw as { claims: { verdict?: unknown }[] }).claims.some(r => r.verdict === "uncertain")) ? "uncertain" : "unsupported";
  }
  const audit = parseClaimAudit(raw, answer.claims);
  if (!audit) return "invalid";
  const rows = (raw as { claim_assessments: Record<string, unknown>[] }).claim_assessments;
  return audit.supported ? "supported" : rows.some(r => CLAIM_AUDIT_FIELDS.some(field => r[field] === "unsure")) ? "uncertain" : "unsupported";
}

/** Full reviewed correspondence is required before paid calls, not inferred from a fixture label. */
export function validFocusedReviews(raw: unknown, inputs: FocusedCase[]): boolean {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as { version?: unknown; approvals?: unknown };
  if (r.version !== 1 || !Array.isArray(r.approvals) || r.approvals.length !== inputs.length) return false;
  const seen = new Set<string>();
  return r.approvals.every(row => {
    const item = inputs.find(c => c.id === row?.id);
    if (!item || seen.has(item.id) || row.inputHash !== focusedCaseFingerprint(item) || row.expected !== item.expected
      || row.sourceFaithfulness !== "reviewed" || row.languageReview !== "reviewed"
      || typeof row.reviewer !== "string" || !row.reviewer.trim() || row.reviewer.length > 120
      || typeof row.reviewedAt !== "string" || !Number.isFinite(Date.parse(row.reviewedAt)) || Date.parse(row.reviewedAt) > Date.now()) return false;
    seen.add(item.id); return true;
  });
}

export function focusedEvaluationSummary(rows: FocusedRow[], expectedIds: string[], reviewed: boolean) {
  return (["legacy_rich_support", "focused_support"] as const).map(mode => {
    const group = rows.filter(r => r.mode === mode), complete = group.length === expectedIds.length && new Set(group.map(r => r.id)).size === expectedIds.length
      && group.every(r => expectedIds.includes(r.id));
    const faithful = group.filter(r => r.expected === "accept"), incorrect = group.filter(r => r.expected === "reject");
    return { mode, cases: group.length, complete, faithfulAccepted: faithful.filter(r => r.outcome === "supported").length,
      unsafeAccepted: incorrect.filter(r => r.outcome === "supported").length,
      explicitIncorrectRejections: incorrect.filter(r => r.outcome === "unsupported").length,
      unnecessaryRefusals: faithful.filter(r => r.outcome === "unsupported").length,
      uncertainty: group.filter(r => r.outcome === "uncertain").length,
      invalidResponses: group.filter(r => r.outcome === "invalid").length, errors: group.filter(r => r.outcome === "error").length,
      matchedResponseModels: group.length > 0 && group.every(r => {
        const other = rows.find(p => p.id === r.id && p.mode !== mode);
        return !!r.modelsCalled?.length && !!other?.modelsCalled?.length && r.modelsCalled.at(-1) === other.modelsCalled.at(-1);
      }),
      cost: group.reduce((n, r) => n + r.cost, 0),
      designatedSamplePassed: reviewed && complete && faithful.length > 0 && incorrect.length > 0
        && faithful.every(r => r.outcome === "supported") && incorrect.every(r => r.outcome === "unsupported"),
      sourceFaithfulnessAcceptance: "requires_separate_review_not_established_by_model_verdict" };
  });
}

/** A run ceiling covers conservative reservations, including configured provider fallbacks. */
export function focusedBatchTransport(guard: SpendGuard, costBefore: number, maxUsd: number, send: typeof fetch = fetch) {
  if (!Number.isFinite(maxUsd) || maxUsd <= 0 || maxUsd > .25 || !Number.isFinite(costBefore) || costBefore < 0 || costBefore > guard.actual) throw new AskSpendStop("invalid focused batch ceiling");
  return async (url: string, init: RequestInit) => {
    if (url !== "https://openrouter.ai/api/v1/chat/completions" || init.method !== "POST" || typeof init.body !== "string") throw new AskSpendStop("unexpected comparison transport");
    if (guard.ledger.stopped || guard.ledger.entries.some(e => e.cost === undefined)) throw new AskSpendStop("billing unresolved; comparison stopped");
    const body = JSON.parse(init.body);
    if (guard.actual - costBefore + reserveUsd(body) > maxUsd) throw new AskSpendStop("focused batch ceiling cannot cover next call");
    return send(url, init); // The shared guard still reserves and settles every actual call.
  };
}

async function main() {
  const args = process.argv.slice(2), all = focusedCases();
  if (args.some(a => !["--dry-run", "--all"].includes(a) && !a.startsWith("--out=") && !a.startsWith("--review=") && !a.startsWith("--max-usd="))) throw Error("unknown_focused_evaluation_option");
  // Initial guarded comparison: one faithful/incorrect pair per language, not 144 automatic calls.
  const inputs = args.includes("--all") ? all : all.filter(c => c.id.startsWith("recorded-creation/with-context/"));
  const out = args.find(a => a.startsWith("--out="))?.slice(6), root = resolve("work/private-ask-evaluation");
  if (!out || !resolve(out).startsWith(root + sep) || existsSync(out)) throw Error("use_new_private_evaluation_path");
  const reviewPath = args.find(a => a.startsWith("--review="))?.slice(9);
  if (reviewPath && !resolve(reviewPath).startsWith(root + sep)) throw Error("use_private_review_path");
  const reviewed = !!reviewPath && validFocusedReviews(JSON.parse(readFileSync(reviewPath, "utf8")), inputs);
  const rows: (FocusedRow & Record<string, unknown>)[] = [];
  const report = { version: 1, at: new Date().toISOString(), mode: "actual_rich_and_focused_support_component_comparison", status: "not_run", blocked: "", reviewed,
    codeFingerprints: Object.fromEntries(["lib/ask/rich-review-request.ts", "lib/ask/focused-checks.ts", "lib/ask/checks.ts", "lib/ai/index.ts", "lib/ai/openrouter.ts"]
      .map(path => [path, sha(readFileSync(path, "utf8"))])),
    fixtureHash: sha(all.map(focusedCaseFingerprint)), cases: inputs.map(c => ({ id: c.id, inputHash: focusedCaseFingerprint(c), expected: c.expected,
      review: reviewed ? "exact input source and language signoff recorded" : "pending", requestHashes: Object.fromEntries((["legacy_rich_support", "focused_support"] as const).map(mode => [mode, sha(focusedEvaluationRequest(c, mode))])) })),
    modelProfile: "not_loaded", rows, summary: focusedEvaluationSummary(rows, inputs.map(c => c.id), reviewed),
    limits: { claimsOnly: true, retrievalOrWholeAnswerAccuracy: "not_measured", originalUserHistoryIncluded: false }, confirmedCost: 0 };
  mkdirSync(dirname(out), { recursive: true });
  const save = () => { report.summary = focusedEvaluationSummary(rows, inputs.map(c => c.id), reviewed); writeFileSync(out, JSON.stringify(report, null, 2), { mode: 0o600 }); };
  if (args.includes("--dry-run")) { report.status = "inputs_verified_no_calls"; save(); return; }
  let budget: ReturnType<typeof installSpendGuard> | undefined, before = 0;
  const calls: string[] = [];
  try {
    if (!reviewed) throw Error("exact_input_source_and_language_review_required_before_paid_calls");
    const maxUsd = Number(args.find(a => a.startsWith("--max-usd="))?.slice(10));
    if (!Number.isFinite(maxUsd) || maxUsd <= 0 || maxUsd > .25) throw Error("explicit_batch_ceiling_required_maximum_025_usd");
    budget = installSpendGuard(sharedAskLedgerPath(), body => calls.push(String(body.model))); // BEFORE environment/provider construction.
    before = budget.guard.actual;
    for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
    const { getVerifier } = await import("../lib/ai/index");
    const model = getVerifier();
    if (!model.id.split("|fallback:").every(id => id.startsWith("openrouter/"))) throw Error("checker_route_outside_shared_spend_guard");
    report.modelProfile = model.id; report.status = "running"; save();
    await withModelTransport(focusedBatchTransport(budget.guard, before, maxUsd), async () => {
      for (const item of inputs) for (const mode of ["legacy_rich_support", "focused_support"] as const) {
        const started = Date.now(), costBefore = budget!.guard.actual, callStart = calls.length;
        const row: FocusedRow & Record<string, unknown> = { id: item.id, mode, expected: item.expected, outcome: "error", cost: 0, ms: 0 };
        rows.push(row); save();
        try {
          const raw = await model.generateJson(focusedEvaluationRequest(item, mode, AbortSignal.timeout(50_000)));
          row.outcome = focusedEvaluationOutcome(raw, item, mode); row.response = raw;
        } finally { row.modelsCalled = calls.slice(callStart); row.ms = Date.now() - started; row.cost = budget!.guard.actual - costBefore; report.confirmedCost = budget!.guard.actual - before; save(); }
        if (budget!.guard.ledger.stopped || budget!.guard.ledger.entries.some(e => e.cost === undefined)) throw Error("unsettled_call_comparison_stopped");
      }
    });
    report.status = "completed_requires_review";
  } catch (e) { report.status = "blocked_or_incomplete"; report.blocked = e instanceof Error ? e.message : "comparison_failed"; }
  finally { save(); budget?.close(); }
  if (report.status === "blocked_or_incomplete") process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { console.error("focused comparison could not start; no reservation released"); process.exitCode = 1; });
