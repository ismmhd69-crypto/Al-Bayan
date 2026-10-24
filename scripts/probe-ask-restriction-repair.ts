// Reviewed component controls on the same worship/parents failures. Not a full Ask score.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { getVerifier } from "../lib/ai";
import { withModelTransport } from "../lib/ai/transport";
import { meaningReviewRequest, parseMeaningReview } from "./ask-restriction-review-experiment";
import { conditionInventoryRequest, parseConditionInventory, conditionMatchRequest, parseConditionMatch, type ConditionInventory } from "./ask-independent-conditions-experiment";
import { meaningReviewRequest as simpleRequest, parseMeaningReview as simpleParse } from "../lib/ask/meaning-review";
import { ArabicCampaignGuard, campaignLock, CURRENT_MODELS, digest, persistCampaign, type CampaignLedger } from "./ask-arabic-campaign-guard";

async function main() {
  for (const p of [".env.local", ".env"]) if (existsSync(p)) process.loadEnvFile(p);
  Object.assign(process.env, { NODE_ENV: "development" });
  const ledgerPath = resolve("docs/ask-repair-runs/arabic-quality-20261022-coordination-spend.json");
  const ledger: CampaignLedger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const INDEPENDENT = process.argv.includes("--independent-source-revision");
  const SIMPLE = process.argv.includes("--simple-high-revision");
  const HIGH = SIMPLE || process.argv.includes("--high-reasoning-control");
  if (HIGH) process.env.OPENROUTER_REASONING = "high";
  const ATOMIC = INDEPENDENT || HIGH || process.argv.includes("--atomic-restriction-revision");
  const reportPath = resolve(`work/private-ask-evaluation/arabic-quality-20261022-restriction-controls${INDEPENDENT ? "-independent" : SIMPLE ? "-simple-high" : HIGH ? "-high" : ATOMIC ? "-atomic" : ""}.json`);
  const originalPath = resolve("docs/ask-repair-runs/spend.json");
  const originalHash = ledger.originalLedgerHash;
  const unchanged = () => {
    if (digest(readFileSync(originalPath, "utf8")) !== originalHash) return false;
    let ancestor = ledger; const seen = new Set<string>();
    while (ancestor.priorCampaign) {
      const link = ancestor.priorCampaign;
      if (seen.has(link.path)) return false;
      seen.add(link.path);
      const bytes = readFileSync(link.path, "utf8");
      if (digest(bytes) !== link.hash) return false;
      ancestor = JSON.parse(bytes);
    }
    return true;
  };
  if (!unchanged() || Math.abs(ledger.cap - ledger.priorExposure - .25) > 1e-9 || ledger.calls.some(c => c.cost === undefined)) throw Error("campaign_not_reviewable");
  const verifier = getVerifier();
  if (verifier.id !== "openrouter/google/gemini-3.1-flash-lite|fallback:openrouter/mistralai/mistral-small-3.2-24b-instruct" || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw Error("configuration_changed");
  const fullReport = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-coordination-1/report.json"), "utf8"));
  const source = (caseId: string, wanted: (p: any) => boolean) => {
    const row = fullReport.rows.find((r: any) => r.id === caseId);
    if (!row?.review || typeof row.review !== "object") throw Error("full_attempt_not_reviewed");
    for (const line of readFileSync(resolve(`work/local-ask-traces/${row.requestId}.jsonl`), "utf8").trim().split("\n")) {
      const event = JSON.parse(line), data = event.data;
      if (event.event !== "model_request" || data.phase !== "draft") continue;
      const prompt = typeof data.prompt === "string" ? JSON.parse(data.prompt) : data.prompt;
      const found = prompt.evidence_package?.passages?.find(wanted);
      if (found) return found;
    }
    throw Error("recorded_original_missing");
  };
  const parents = source("R03", p => p.fatwa_title === "وجوب بر الوالدين");
  const fasting = source("R03", p => p.fatwa_title === "حكم طاعة الوالدين في ترك أعمال مستحبة");
  const creation = source("R01", p => p.id === "Q31:11");
  const cases = [
    { id: "recorded_missing_parental_need", expected: "reject", passage: parents, text: "يبين الشيخ ابن باز أن طاعة الوالدين واجبة في الأمور التي ليست معصية لله تعالى." },
    { id: "preserved_parental_need_and_non_sin", expected: "support", passage: parents, text: "يوضح ابن باز أن الأبناء مأمورون ببر والديهم، ومن ذلك الاستجابة لطلباتهما التي يحتاجان إليها ولا تتضمن معصية." },
    { id: "different_wording_same_missing_prerequisite", expected: "reject", passage: parents, text: "كل طلب مباح يطلبه الوالدان يلزم الابن تنفيذه لمجرد كونه مباحا." },
    { id: "limited_fasting_example_broadened", expected: "reject", passage: fasting, text: "يجب ترك صيام التطوع متى طلب الوالدان ذلك مهما كان سبب طلبهما." },
    { id: "limited_fasting_example_preserved", expected: "support", passage: fasting, text: "يبين ابن باز تقديم بر الوالدين على صيام النافلة إذا كان طلبهما بقصد الخير، كخوفهما على الابن من الحر أو حاجتهما إلى مساعدته." },
    { id: "recorded_uncited_self_sufficiency", expected: "reject", passage: creation, text: "يوضح القرآن أن الله سبحانه وتعالى خلق الخليقة، وأن عبادة العباد وطاعتهم لا تزيد في ملكه شيئًا، وهو الغني عن العالمين." },
  ];
  if (!process.argv.includes("--reviewed-repair-controls-within-25c")) {
    console.log(JSON.stringify({ status: "no_calls", controls: cases.map(({ passage: _, ...c }) => c), remaining: ledger.cap - ledger.priorExposure - ledger.calls.reduce((a, c) => a + c.cost!, 0) })); return;
  }
  if (existsSync(reportPath)) throw Error("controls_already_recorded_no_automatic_repeat");
  if (ledger.stopped !== (ATOMIC ? "restriction_controls_finished_review_before_any_more_paid_work" : "source_qualification_failure_review_required_no_more_calls")) throw Error("unexpected_campaign_stop_no_resume");
  // Refresh metadata without increasing any ceiling or changing model/privacy rules.
  for (const model of CURRENT_MODELS) {
    const response = await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`);
    if (!response.ok) throw Error("price_metadata_unavailable");
    const data: any = await response.json(), endpoints = data.data?.endpoints;
    if (!Array.isArray(endpoints) || !endpoints.length) throw Error("price_endpoints_missing");
    const max = (keys: string[]) => Math.max(...endpoints.flatMap((e: any) => keys.map(k => Number(e.pricing?.[k] ?? 0))));
    const live = { prompt: max(["prompt", "input_cache_read", "input_cache_write"]) * 1e6, completion: max(["completion", "internal_reasoning"]) * 1e6, request: max(["request"]) };
    if (Object.entries(live).some(([k, v]) => !Number.isFinite(v) || v > ledger.prices[model][k as keyof typeof live] + 1e-10)) throw Error("price_exceeds_unchanged_ceiling");
  }
  const release = campaignLock(originalPath, originalHash);
  const report: any = { stage: "source_limit_component_controls_not_full_answers", model: verifier.id, reasoning: process.env.OPENROUTER_REASONING ?? "low",
    trackedDiffHash: digest(execFileSync("git", ["-c", "core.safecrlf=false", "diff", "--no-ext-diff"], { encoding: "utf8", maxBuffer: 20e6 })),
    cases: cases.map(({ passage, ...c }) => ({ ...c, sourceId: passage.id, originalHash: digest(passage.arabic) })), results: [], at: new Date().toISOString() };
  const before = ledger.calls.reduce((sum, c) => sum + c.cost!, 0);
  try {
    ledger.reviewStops = [...(ledger.reviewStops ?? []), { at: new Date().toISOString(), reason: ledger.stopped,
      authorization: "Standing owner repair loop and the existing additional 25-cent worship/parents retest allowance; source-reviewed failure reproduced; text-only patches and restriction receipts pass 1,455 offline tests. Bounded component controls after reviewed atomic-restriction prompt revision, no completed full attempt repeated, no cap increase." }];
    delete ledger.stopped; persistCampaign(ledgerPath, ledger); persistCampaign(reportPath, report);
    const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(ledgerPath, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
    const inventories = new Map<string, ConditionInventory>();
    await withModelTransport(guard.dispatch(fetch, unchanged), async () => {
      for (const c of cases) {
        const row: any = { id: c.id, expected: c.expected, status: "running" }, start = ledger.calls.length, cost = guard.actual;
        report.results.push(row); persistCampaign(reportPath, report);
        const items = [{ text: c.text, refs: [c.passage.id] }], serialized = { passages: [c.passage] };
        let raw: unknown;
        if (INDEPENDENT) {
          const key = digest(c.passage.arabic);
          if (!inventories.has(key)) {
            const originals = [{ id: c.passage.id, arabic: c.passage.arabic }];
            row.inventoryRaw = await verifier.generateJson(conditionInventoryRequest(originals, new AbortController().signal));
            const parsed = parseConditionInventory(row.inventoryRaw, originals);
            if (parsed) inventories.set(key, parsed);
          }
          const inventory = inventories.get(key);
          row.inventory = inventory;
          if (inventory) raw = await verifier.generateJson(conditionMatchRequest(items, inventory, new AbortController().signal));
          row.result = inventory ? parseConditionMatch(raw, items, inventory) : null;
        } else {
          raw = await verifier.generateJson((SIMPLE ? simpleRequest : meaningReviewRequest)(items, serialized, new AbortController().signal));
          row.result = SIMPLE ? simpleParse(raw, items) : parseMeaningReview(raw, items, serialized);
        }
        row.raw = raw ?? null; row.status = "settled";
        row.cost = guard.actual - cost; row.calls = ledger.calls.slice(start);
        row.matched = c.expected === "support" ? row.result?.safeIds.length === 1 : row.result?.failures.length === 1;
        persistCampaign(reportPath, report); console.log(JSON.stringify({ id: c.id, matched: row.matched, cost: row.cost, result: row.result }));
        if (!row.matched || ledger.stopped || ledger.calls.some(c => c.cost === undefined)) break;
      }
    });
  } finally {
    if (!ledger.stopped) ledger.stopped = "restriction_controls_finished_review_before_any_more_paid_work";
    persistCampaign(ledgerPath, ledger);
    report.newCost = ledger.calls.reduce((sum, c) => sum + (c.cost ?? 0), 0) - before;
    report.remaining = ledger.cap - ledger.priorExposure - ledger.calls.reduce((sum, c) => sum + (c.cost ?? c.reserved), 0);
    persistCampaign(reportPath, report); release();
  }
}
main().catch(e => { console.error(e instanceof Error ? e.message : "controls_stopped"); process.exitCode = 1; });
