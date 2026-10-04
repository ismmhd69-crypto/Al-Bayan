// Fixed-source comparison only. Never submits visitor questions or writes to the database.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import cases from "../tests/fixtures/claim-audit-cases.json";
import { screeningRequest } from "../lib/ask/core";
import { allSupported, parseClaimAudit, requirementsCovered, structuredAnswerOk, wholeAnswerOk, type StructuredDraft } from "../lib/ask/checks";
import type { EvidencePackage, PassageForSelection } from "../lib/ask/retrieval";
import type { Locale } from "../lib/i18n";
import { installSpendGuard } from "./ask-spend-guard";

export function frozenAuditCases() {
  return cases.packages.flatMap((item) => (["en", "de", "ar"] as const).flatMap((language) =>
    (["faithful", "incorrect"] as const).map((variant) => ({
      id: `${item.id}/${language}/${variant}`, language, variant, category: item.category,
      candidate: item.candidate as PassageForSelection, summary: item.summaries[language][variant],
      expected: item.expected[variant],
    }))));
}

export function evaluationInput(item: ReturnType<typeof frozenAuditCases>[number]) {
  // This measures semantic screening, not retrieval or whether these snippets answer a broad fatwa.
  const evidence: EvidencePackage = {
    question: { language: item.language, questionType: "general", subjects: ["selected passage"], qualifiers: [],
      requirements: [{ id: "R1", text: "Explain the selected statement in its own context", facet: "general" }],
      requiredFacets: ["general"] },
    passages: [{ ...item.candidate, requirementIds: ["R1"], facets: ["general"] }], cards: [],
  };
  const claims = [{ text: item.summary, refs: [item.candidate.id], requirementId: "R1" }];
  const answer: StructuredDraft = { claims, directAnswer: claims, list: [], explanation: [], notEstablished: [] };
  return { evidence, answer };
}

export function evaluationAccepted(raw: unknown, answer: StructuredDraft, audit: boolean) {
  const support = audit ? parseClaimAudit(raw, answer.claims)?.supported === true : allSupported(raw, answer.claims.length);
  return support && wholeAnswerOk(raw) && requirementsCovered(raw, ["R1"]) && structuredAnswerOk(raw);
}

type EvaluationRow = { id: string; audit: boolean; expected: string; accepted: boolean; seconds: number; language?: Locale };
export function evaluationSummary(rows: EvaluationRow[]) {
  const percentile = (values: number[], p: number) => {
    const sorted = values.toSorted((a, b) => a - b);
    return sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] : null;
  };
  return ([false, true] as const).map((audit) => {
    const group = rows.filter((r) => r.audit === audit);
    const faithful = group.filter((r) => r.expected === "accept");
    const incorrect = group.filter((r) => r.expected === "reject");
    return { audit, cases: group.length,
      faithfulAccepted: faithful.filter((r) => r.accepted).length,
      unnecessaryRefusals: faithful.filter((r) => !r.accepted).length,
      incorrectRejected: incorrect.filter((r) => !r.accepted).length,
      unsafeAccepted: incorrect.filter((r) => r.accepted).length,
      medianSeconds: percentile(group.map((r) => r.seconds), 0.5),
      p95Seconds: percentile(group.map((r) => r.seconds), 0.95),
      detectionGatePassed: faithful.length === 36 && incorrect.length === 36 && new Set(group.map((r) => r.id)).size === 72
        && incorrect.every((r) => !r.accepted) && faithful.filter((r) => r.accepted).length / faithful.length >= 0.95,
    };
  });
}

async function main() {
  const out = process.argv.find((arg) => arg.startsWith("--out="))?.slice(6);
  if (!out) throw new Error("--out is required");
  if (existsSync(out)) throw new Error("refusing to overwrite an existing evaluation");
  const inputs = frozenAuditCases();
  const manifestHash = createHash("sha256").update(readFileSync("tests/fixtures/claim-audit-cases.json")).digest("hex");
  const rows: (EvaluationRow & Record<string, unknown>)[] = [];
  const report = { at: new Date().toISOString(), manifestHash, cases: inputs.length, mode: "paired old/new checker",
    status: "not_run", blocked: "", rows, summary: evaluationSummary(rows), confirmedCost: 0, elapsedMs: 0 };
  const save = () => writeFileSync(out, JSON.stringify(report, null, 2));
  if (process.argv.includes("--dry-run")) { report.status = "offline_inputs_verified_no_model_calls"; save(); return; }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  let budget: ReturnType<typeof installSpendGuard> | undefined;
  const started = Date.now();
  let spendBefore = 0;
  try {
    // Install BEFORE loading models. The original unresolved reservation blocks all paid work.
    const calls: string[] = [];
    budget = installSpendGuard("docs/ask-repair-runs/spend.json", (body) => calls.push(String(body.model)));
    spendBefore = budget.guard.actual;
    for (const name of ["AI_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", "AI_VERIFIER_MODELS", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL", "AI_PROVIDER", "AI_VERIFIER_PROVIDER"]) delete process.env[name];
    process.env.OPENROUTER_REASONING = "low";
    process.env.OPENROUTER_PRIVACY = "zdr";
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter key is not configured");
    const { getVerifier } = await import("../lib/ai/index");
    const model = getVerifier();
    report.status = "running";
    save();
    for (const item of inputs) {
      const { evidence, answer } = evaluationInput(item);
      for (const audit of [false, true]) {
        const before = budget.guard.actual;
        const callStart = calls.length;
        const at = Date.now();
        const raw = await model.generateJson(screeningRequest(answer, evidence, item.language as Locale, audit, AbortSignal.timeout(50_000)));
        rows.push({ id: item.id, language: item.language, audit, expected: item.expected, accepted: evaluationAccepted(raw, answer, audit),
          modelChain: model.id, modelsCalled: calls.slice(callStart), seconds: (Date.now() - at) / 1000, cost: budget.guard.actual - before, raw });
        report.confirmedCost = budget.guard.actual - spendBefore;
        report.summary = evaluationSummary(rows);
        save();
      }
    }
    report.status = "complete_requires_acceptance_review";
  } catch (error) {
    report.status = "blocked_or_incomplete";
    report.blocked = error instanceof Error ? error.message : "evaluation failed";
  } finally {
    if (budget) report.confirmedCost = budget.guard.actual - spendBefore;
    report.summary = evaluationSummary(rows);
    report.elapsedMs = Date.now() - started;
    try { save(); } finally { budget?.close(); }
  }
  if (report.status !== "complete_requires_acceptance_review") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("claim audit evaluation could not start; no billing reservation released"); process.exitCode = 1; });
}
