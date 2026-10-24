// One independently reviewable source-writing component per invocation.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createOpenRouter } from "../lib/ai/openrouter";
import { withModelTransport } from "../lib/ai/transport";
import { groundedWritingRequest, unwrapGroundedWriting } from "../lib/ask/grounded-writing";
import { richWritingClaimsSchema, richWritingOutputAllowance } from "../lib/ask/rich-writing-schema";
import { parseRichClaims } from "../lib/ask/rich-engine";
import { independentSourceWritingInput } from "../lib/ask/source-writing-input";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";
import type { JsonRequest } from "../lib/ai/types";

async function main() {
  const boundContext = process.argv.includes("--bound-context");
  const independentInput = process.argv.includes("--independent-input");
  const id = process.argv.find(a => a.startsWith("--case="))?.slice(7) ?? "W00";
  if (independentInput && (boundContext || id !== "W00")) throw Error("independent_input_single_known_control_only");
  const bankPath = resolve("work/private-ask-evaluation/grounded-writing-bank-20261024.json"), bankBytes = readFileSync(bankPath, "utf8"), bank = JSON.parse(bankBytes);
  const c = bank.cases.find((r: any) => r.id === id); if (!c) throw Error("unknown_source_control");
  const traceBytes = readFileSync(resolve("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl"), "utf8");
  if (digest(traceBytes) !== bank.templateTraceHash) throw Error("source_template_changed");
  const events = traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s)), template = events.find(e => e.event === "model_request" && e.data.call_id === "A9").data;
  const requirementIds = c.serialized.question.requirements.map((r: any) => r.id), sourceIds = c.serialized.passages.filter((p: any) => p.type === c.group).map((p: any) => p.id);
  const payload = { ...template.prompt, sections_to_write: [c.group], citable_source_ids_by_section: { [c.group]: sourceIds }, evidence_package: c.serialized,
    source_explanations_already_drafted: c.knownRegression ? template.prompt.source_explanations_already_drafted : {},
    source_group_scope: { [c.group]: { ...template.prompt.source_group_scope.hadith, concerns_with_selected_direct_evidence: c.serialized.question.requirements.map((r: any) => ({ requirement_id: r.id, concern: r.text })) } } };
  const feedback = structuredClone(template.schema.properties.no_answer_feedback);
  feedback.items.properties.group.enum = [c.group]; feedback.items.properties.missing_requirement_ids.items.enum = requirementIds;
  const base: JsonRequest = { system: template.system, prompt: JSON.stringify(payload), schema: { type: "object", properties: {
    status: template.schema.properties.status, [c.group]: richWritingClaimsSchema(sourceIds, requirementIds), no_answer_feedback: feedback,
  }, required: ["status", "no_answer_feedback", c.group] }, maxOutputTokens: richWritingOutputAllowance([c.group]), thinking: "low", structuredOutput: true };
  const request = independentInput ? independentSourceWritingInput(base) : groundedWritingRequest(base);
  if (!process.argv.includes("--reviewed-source-writer-control")) { console.log(JSON.stringify({ status: "no_model_calls", id, group: c.group, normalSingleGroupAllowance: request.maxOutputTokens })); return; }
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  if (!process.env.OPENROUTER_API_KEY || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr" || (process.env.OPENROUTER_REASONING ?? "low") !== "low") throw Error("privacy_key_or_settings_changed");
  const path = resolve(`work/private-ask-evaluation/grounded-writing${independentInput ? "-independent-input" : boundContext ? "-bound-context" : ""}-controls-20261024.json`);
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const previous = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/shared-originals-single-audit-20261024.json"), "utf8"));
  if (boundContext) {
    const prior = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/grounded-writing-controls-20261024.json"), "utf8"));
    if (prior.results.length !== 1 || prior.results[0].id !== "W00" || prior.results[0].independentReview?.classification !== "unsupported_scope_broadened") throw Error("unbound_context_failure_not_reviewed");
  }
  const revision = digest([independentInput ? "lib/ask/source-writing-input.ts" : "lib/ask/grounded-writing.ts", "lib/ask/rich-writing-schema.ts"].map(p => readFileSync(resolve(p), "utf8")).join("\n"));
  const report: any = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { status: "prepared", bankHash: digest(bankBytes), revision, model: "google/gemini-3.5-flash-lite", results: [],
    scope: "Six fixed single-source-group WRITING components, one call at a time with manual original-Arabic review between cases. Shared source-grounding wrapper and unchanged normal 2200-token single-group allowance. W00 isolates the hadith group from a recorded multi-group writing request; it is not an identical full-request comparison. Fresh cases use live-reader originals/context prepared before any model calls. No framing, selection, full Ask completion or checking accuracy established. Website experiment remains off." };
  if (independentInput) {
    report.scope = "One W00 single-hadith-group writing component with only sibling draft history and selector scope labels removed by the actual engine helper. Same full original/context package, schema, output allowance and current writer. No generated context prefix, final audit or whole-question result; not an identical comparison with original multi-group writing.";
    const prior = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/focused-recorded-source-control-20261024.json"), "utf8"));
    if (prior.independentReview?.status !== "reviewed_false_approvals_do_not_activate") throw Error("focused_failure_not_reviewed");
  }
  const index = bank.cases.findIndex((r: any) => r.id === id);
  if (previous.independentReview?.status !== "reviewed_no_accuracy_improvement_do_not_activate" || ledger.calls.some(r => r.cost === undefined)
    || ledger.stopped !== (independentInput ? "focused_recorded_support_finished_review_required" : index === 0 && !boundContext ? "shared_originals_single_audit_finished_review_required" : "grounded_writer_component_finished_review_required")
    || report.bankHash !== digest(bankBytes) || report.revision !== revision || report.results.length !== index || report.results.some((r: any) => r.independentReview?.classification !== "source_faithful"
      && !(boundContext && r.id === "W00" && r.independentReview?.classification === "source_faithful_case_not_exercised")
      && !(boundContext && r.independentReview?.allowNextFixedControl === true && r.independentReview?.seriousUnsupportedInstruction === false))) throw Error("source_control_not_reviewed_or_no_repeat_gate");
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || readFileSync(bankPath, "utf8") !== bankBytes) return false;
    let parent = ledger; const seen = new Set<string>();
    while (parent.priorCampaign) { const p = parent.priorCampaign; if (seen.has(p.path)) return false; seen.add(p.path); const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; parent = JSON.parse(bytes); }
    return true;
  };
  if (!unchanged()) throw Error("historical_spending_changed");
  const model = report.model, response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
  if (!response.ok) throw Error("price_metadata_unavailable");
  const endpoints = (await response.json() as any).data?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_metadata_unavailable");
  const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
  const prices = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
  if (Object.entries(prices).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof prices] + 1e-10)) throw Error("price_ceiling_changed");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const before = guard.actual, startCall = ledger.calls.length, started = Date.now();
  const row: any = { id, status: "prepared", sourceQuestion: c.question, criteriaNotSentToModel: c.review, requestHash: digest(JSON.stringify(request)), independentReview: "pending" };
  const save = () => { row.cost = guard.actual - before; row.calls = ledger.calls.slice(startCall); report.remainingAllowance = ledger.cap - guard.exposure; report.notTested = bank.cases.filter((r: any) => !report.results.some((x: any) => x.id === r.id)).map((r: any) => r.id); persistCampaign(path, report); };
  const release = campaignLock(original, ledger.originalLedgerHash);
  try {
    report.results.push(row); save(); ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!, authorization: independentInput
      ? "Continue current-model repair goal within unchanged remainder: one W00 source-writing component with unchecked sibling drafts and selector scope labels removed by the actual engine helper. Full originals/context, normal 2200-token output, schema, privacy, prices and conservative guard unchanged. No prefix/grounding generation, retry, backup, final-answer completion or added budget. Independently review; website remains unchanged."
      : "Continue Mo's current-model repair/test goal within the unchanged remainder: one fixed single-group writing component using the current writer and shared experimental context-before-prose contract. Use the existing normal single-group 2200-token allowance, full per-call reservation, price/privacy controls and own originals. No full-question/model comparison, fallback, correction, repeat or added budget. Independently review before any next fixed case; experiment remains off on website." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const dispatch = guard.dispatch(fetch, unchanged); let sent = false;
    row.raw = await withModelTransport(async (url, init) => {
      if (sent || JSON.parse(String(init.body)).model !== model) throw Error("extra_writer_dispatch_forbidden"); sent = true;
      const reply = await dispatch(url, init); const data = await reply.clone().json() as any; row.providerOutput = data.choices?.[0]?.message?.content; save(); return reply;
    }, () => createOpenRouter(process.env.OPENROUTER_API_KEY!, model).generateJson(request));
    row.unwrapped = independentInput ? structuredOutputContract(request.schema).parse(JSON.stringify(row.raw)) : unwrapGroundedWriting(row.raw, request);
    if (!row.unwrapped) { row.status = "invalid_grounding_or_envelope"; }
    else if (row.unwrapped.status === "no_answer") row.status = "withheld";
    else {
      const validationPack = { question: c.serialized.question, cards: [], passages: c.serialized.passages.map((p: any) => ({ id: p.id,
        requirementIds: p.supported_requirement_ids, explanationRequirementIds: p.explanation_requirement_ids,
        source: p.type === "quran" ? { kind: "quran", verse: { arabic: p.arabic, translations: { en: p.translation_en, de: p.translation_de } } }
          : p.type === "hadith" ? { kind: "hadith", hadith: { arabic: p.arabic, translations: { en: p.translation_en, de: p.translation_de } } }
            : { kind: "scholar", quote: { arabic: p.arabic } } })) };
      row.claims = parseRichClaims(row.unwrapped[c.group], c.group, validationPack as any, "ar", reason => { row.validationFailure = reason; });
      row.status = row.claims?.length ? "settled_original_review_required" : "local_check_failed";
    }
  } catch (e) { row.status = "error"; row.error = e instanceof Error ? e.message : "writer_control_failed"; }
  finally { row.ms = Date.now() - started; ledger.stopped ??= "grounded_writer_component_finished_review_required"; persistCampaign(ledgerPath, ledger); report.status = "manual_review_required_before_next_case"; save(); release(); }
  console.log(JSON.stringify({ id, status: row.status, claims: row.claims, cost: row.cost, remainingAllowance: report.remainingAllowance, error: row.error, validationFailure: row.validationFailure }));
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "writer_control_failed"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
