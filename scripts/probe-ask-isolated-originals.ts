// One reviewed component experiment within the existing allowance. No website import.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getVerifier } from "../lib/ai";
import { isolatedMeaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { relationReviewRequest, parseRelationReview } from "../lib/ask/relation-review";
import { withModelTransport } from "../lib/ai/transport";
import { ArabicCampaignGuard, campaignLock, digest, persistCampaign, CURRENT_MODELS, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  const relationMode = process.argv.includes("--reviewed-relation-controls");
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261023-source-request-spend.json");
  const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const previousPath = resolve("work/private-ask-evaluation/arabic-quality-20261022-source-contract-retest/report.json");
  const previousBytes = readFileSync(previousPath, "utf8"), previous = JSON.parse(previousBytes), previousHash = digest(previousBytes);
  if (ledger.stopped !== (relationMode ? "isolated_controls_finished_review_required" : "source_faithfulness_failure_review_required") || ledger.calls.some(c => c.cost === undefined)
    || previous.status !== "reviewed_completed_but_unsupported" || previous.rows[0].review?.originalArabicReviewed !== true)
    throw Error("independent_source_review_required");
  const isolatedPath = resolve("work/private-ask-evaluation/isolated-originals-controls-20261023.json");
  const isolatedBytes = relationMode ? readFileSync(isolatedPath, "utf8") : undefined;
  if (relationMode) {
    const reviewed = JSON.parse(isolatedBytes!);
    if (reviewed.status !== "control_failure_do_not_activate" || reviewed.results.length !== 4
      || reviewed.results[3].id !== "command_is_not_guaranteed_outcome" || reviewed.results[3].matched !== false)
      throw Error("prior_isolation_failure_not_reviewed");
  }
  const original = resolve("docs/ask-repair-runs/spend.json");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash || digest(readFileSync(previousPath, "utf8")) !== previousHash
      || relationMode && digest(readFileSync(isolatedPath, "utf8")) !== digest(isolatedBytes!)) return false;
    let current = ledger; const visited = new Set<string>();
    while (current.priorCampaign) {
      const p = current.priorCampaign; if (visited.has(p.path)) return false; visited.add(p.path);
      const bytes = readFileSync(p.path, "utf8"); if (digest(bytes) !== p.hash) return false; current = JSON.parse(bytes);
    }
    return true;
  };
  if (!unchanged() || Math.abs(ledger.cap - ledger.priorExposure - .25) > 1e-9) throw Error("spending_history_changed");
  const events = (id: string) => readFileSync(resolve(`work/local-ask-traces/${id}.jsonl`), "utf8").trim().split("\n").map(line => JSON.parse(line));
  const trace = events(previous.rows[0].requestId);
  const primary = trace.find(e => e.event === "model_request" && e.data.call_id === "A10").data.prompt;
  const old = events("6e80b9a7-d088-46fd-b068-f1f71fd8ef67").find(e => e.event === "model_request" && e.data.call_id === "A9").data.prompt;
  const originals = [...primary.claim_evidence.flatMap((b: any) => b.cited_originals), ...old.claim_evidence.flatMap((b: any) => b.cited_originals)];
  const verse56 = originals.find((p: any) => p.id === "Q51:56"), verse57 = verse56.surrounding_context.find((p: any) => p.id === "Q51:57");
  if (!verse57?.arabic) throw Error("paired_original_missing");
  const cases: { id: string; expected: "reject" | "support"; text: string; refs: string[] }[] = [
    { id: "uncited_neighbour_cannot_support_compound_claim", expected: "reject", text: primary.claims[0].claim, refs: ["Q51:56"] },
    { id: "same_compound_with_both_originals", expected: "support", text: primary.claims[0].claim, refs: ["Q51:56", "Q51:57"] },
    { id: "narrow_supported_creation_claim", expected: "support", text: "يذكر القرآن أن الغاية من خلق الجن والإنس هي عبادة الله.", refs: ["Q51:56"] },
    { id: "command_is_not_guaranteed_outcome", expected: "reject", text: previous.rows[0].result.answer.sections.find((s: any) => s.group === "summary").claims[1].text, refs: ["Q29:17", "HE10404"] },
    { id: "recorded_correction_kept_wrong_citations", expected: "reject", text: old.claims[1].claim, refs: old.claims[1].source_ids },
  ];
  if (relationMode) cases.push(
    { id: "instruction_without_promised_outcome", expected: "support", text: "يأمر القرآن بابتغاء الرزق من الله وعبادته وشكره، ويذكر أن المرجع إليه.", refs: ["Q29:17"] },
    { id: "gratitude_benefits_its_author", expected: "support", text: "يبين القرآن أن من يشكر الله فإن نفع شكره يعود إلى نفسه.", refs: ["Q31:12"] },
    { id: "gratitude_does_not_here_promise_wealth", expected: "reject", text: "يبين القرآن أن من يشكر الله يحصل على مال أكثر في الدنيا.", refs: ["Q31:12"] },
    { id: "specific_vow_case_keeps_scope", expected: "support", text: "يروي الحديث أن النبي أمر الرجل الذي نذر المشي بأن يركب بدلاً من تعذيب نفسه.", refs: ["HE65936"] },
    { id: "specific_vow_expanded_to_unbearable_worship", expected: "reject", text: primary.claims[2].claim, refs: ["HE65936"] },
  );
  const path = resolve(`work/private-ask-evaluation/${relationMode ? "relation-and-isolation" : "isolated-originals"}-controls-20261023.json`);
  if (existsSync(path)) throw Error("component_controls_already_recorded_no_repeat");
  if (!process.argv.includes("--reviewed-originals-controls") && !relationMode) { console.log(JSON.stringify({ status: "no_calls", cases })); return; }
  const verifier = getVerifier();
  if (verifier.id !== "openrouter/google/gemini-3.1-flash-lite|fallback:openrouter/mistralai/mistral-small-3.2-24b-instruct"
    || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw Error("model_or_privacy_changed");
  for (const model of CURRENT_MODELS) {
    const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!response.ok) throw Error("price_unavailable");
    const endpoints = (await response.json() as any).data?.endpoints;
    if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_unavailable");
    const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
    const live = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6,
      completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
    if (Object.entries(live).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof live] + 1e-10)) throw Error("price_ceiling_changed");
  }
  const report: any = { stage: relationMode ? "combined_relation_and_isolation_controls_not_full_Ask_accuracy" : "component_controls_not_full_Ask_accuracy",
    priorReviewHash: previousHash, ...(relationMode ? { priorFailedIsolationHash: digest(isolatedBytes!) } : {}), model: verifier.id, cases, results: [], status: "prepared" };
  const release = campaignLock(original, ledger.originalLedgerHash);
  try {
    persistCampaign(path, report);
    ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped!,
      authorization: relationMode ? "Continue the authorized repair/test goal with one fixed combined relation/isolation experiment after the reviewed isolated-checker failure. At most ten fixed cases, including supported and unsupported new controls, at most two guarded checker calls each, stop on first mismatch. Existing allowance only, no model/privacy/cap change or automatic full-question repeat."
        : "Mo resumed the repair/test goal. After independent review of the completed but unsupported answer, run at most five fixed isolated-original checker controls within the unchanged remaining allowance, stopping on the first failed control. No fresh full question or model change." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger);
    const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
    await withModelTransport(guard.dispatch(fetch, unchanged), async () => {
      for (const c of cases) {
        const before = guard.actual, first = ledger.calls.length, items = [{ text: c.text, refs: c.refs }];
        const row: any = { id: c.id, expected: c.expected, status: "running" }; report.results.push(row); persistCampaign(path, report);
        try {
          const passages = c.refs.map(id => id === "Q51:57" ? verse57 : originals.find((p: any) => p.id === id));
          if (passages.some(p => !p)) throw Error("original_missing");
          row.raw = await verifier.generateJson(isolatedMeaningReviewRequest(items[0], { passages }, new AbortController().signal));
          row.result = parseMeaningReview(row.raw, items); row.status = "settled";
          if (relationMode && row.result?.safeIds.length === 1) {
            row.isolatedResult = row.result;
            row.relationRaw = await verifier.generateJson(relationReviewRequest(items[0], passages, new AbortController().signal));
            row.result = parseRelationReview(row.relationRaw, items[0], passages);
          }
          row.matched = c.expected === "support" ? row.result?.safeIds.length === 1 : row.result?.failures.length === 1;
        } catch (error) { row.status = "error"; row.error = error instanceof Error ? error.message : "unknown"; }
        finally { row.cost = guard.actual - before; row.calls = ledger.calls.slice(first); persistCampaign(path, report); }
        console.log(JSON.stringify({ id: row.id, matched: row.matched, result: row.result, cost: row.cost }));
        if (!row.matched || ledger.stopped || ledger.calls.some(c => c.cost === undefined)) break;
      }
    });
    report.status = report.results.length === cases.length && report.results.every((r: any) => r.matched) ? "all_fixed_controls_passed" : "control_failure_do_not_activate";
  } finally {
    ledger.stopped ??= relationMode ? "relation_controls_finished_review_required" : "isolated_controls_finished_review_required"; persistCampaign(ledgerPath, ledger);
    report.campaignCost = ledger.calls.reduce((sum, c) => sum + (c.cost ?? 0), 0); persistCampaign(path, report); release();
  }
}
const keepAlive = setInterval(() => {}, 1000);
main().catch(e => { console.error(e instanceof Error ? e.message : "control_probe_stopped"); process.exitCode = 1; }).finally(() => clearInterval(keepAlive));
