// Owner-authorized component controls within the same $1 ledger. Never a full Ask score.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getVerifier } from "../lib/ai";
import { meaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { ArabicCampaignGuard, persistCampaign, campaignLock, digest, type CampaignLedger } from "./ask-arabic-campaign-guard";
import { withModelTransport } from "../lib/ai/transport";
async function main() {
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  const path = resolve("docs/ask-repair-runs/arabic-quality-20261022-loop-spend.json"), ledger: CampaignLedger = JSON.parse(readFileSync(path, "utf8"));
  const original = resolve("docs/ask-repair-runs/spend.json"), bytes = readFileSync(original, "utf8");
  const unchanged = () => {
    if (digest(readFileSync(original, "utf8")) !== ledger.originalLedgerHash) return false;
    let current = ledger; const visited = new Set<string>();
    while (current.priorCampaign) {
      const link = current.priorCampaign; if (visited.has(link.path)) return false; visited.add(link.path);
      const text = readFileSync(link.path, "utf8"); if (digest(text) !== link.hash) return false; current = JSON.parse(text);
    }
    return true;
  };
  if (!unchanged() || ledger.cap - ledger.priorExposure < .99999 || ledger.cap - ledger.priorExposure > 1.00001) throw Error("campaign_not_authorized_or_changed");
  const verifier = getVerifier();
  if (verifier.id !== "openrouter/google/gemini-3.1-flash-lite|fallback:openrouter/mistralai/mistral-small-3.2-24b-instruct" || (process.env.OPENROUTER_PRIVACY ?? "zdr") !== "zdr") throw Error("configuration_changed");
  const source = (round: number, id: string, sourceId: string) => {
    const r = JSON.parse(readFileSync(resolve(`work/private-ask-evaluation/arabic-quality-20261022-loop-${round}/report.json`), "utf8"));
    const row = r.rows.find((r: any) => r.id === id);
    for (const line of readFileSync(resolve(`work/local-ask-traces/${row.requestId}.jsonl`), "utf8").trim().split("\n")) {
      const e = JSON.parse(line), d = e.data;
      if (e.event !== "model_request" || d.phase !== "screening") continue;
      const request = typeof d.prompt === "string" ? JSON.parse(d.prompt) : d.prompt;
      for (const bundle of request.claim_evidence ?? []) { const found = bundle.cited_originals.find((p: any) => p.id === sourceId); if (found) return found; }
    }
    throw Error("recorded_original_missing");
  };
  const quran = source(4, "F08", "Q3:134"), limited = source(6, "R03", "S349e598b-9840-48d4-ba3c-c211e93aae1d");
  const replay = process.argv.includes("--replay-settled-truncated-check");
  const cases = [
    { id: "transferred_universal_qualifier", expected: "reject", text: "يوضح النص القرآني أن من صفات عباد الله كظم الغيظ والسيطرة عليه والعفو عن الناس في جميع الأحوال.", passage: quran },
    { id: "narrow_fatwa_broadened_to_all_lawful_requests", expected: "reject", text: "قرر الشيخ محمد ناصر الدين الألباني أنه لا تجوز طاعة المخلوق في معصية الخالق، بينما تجب طاعة الوالدين في الأمور الجائزة والمباحة.", passage: limited },
    { id: "supported_restraint_without_added_universal_scope", expected: "support", text: "يمدح القرآن كظم الغيظ والعفو عن الناس.", passage: quran },
  ];
  if (replay) {
    const report = JSON.parse(readFileSync(resolve("work/private-ask-evaluation/arabic-quality-20261022-loop-7/report.json"), "utf8"));
    const row = report.rows.find((r: any) => r.id === "F02");
    for (const line of readFileSync(resolve(`work/local-ask-traces/${row.requestId}.jsonl`), "utf8").trim().split("\n")) {
      const e = JSON.parse(line), d = e.data;
      if (e.event !== "model_request" || d.call_id !== "A14") continue;
      const request = typeof d.prompt === "string" ? JSON.parse(d.prompt) : d.prompt;
      if (request.stage !== "narrow_meaning_review_v1") throw Error("not_expected_settled_request");
      cases.splice(0, cases.length, ...request.claims.map((c: any, i: number) => ({
        id: `settled_truncated_claim_${i + 1}`, expected: "not_scored", text: c.text,
        passage: { id: "__multiple_originals__", originals: c.originals, restrictive_context: c.restrictive_context },
      })));
    }
    if (cases.length !== 7) throw Error("settled_replay_shape_changed");
  }
  const reportPath = resolve(`work/private-ask-evaluation/arabic-quality-20261022-loop-${replay ? "settled-check-replay" : "meaning-controls"}.json`);
  if (existsSync(reportPath)) throw Error("control_probe_already_recorded_no_automatic_repeat");
  const guard = new ArabicCampaignGuard(ledger, () => persistCampaign(path, ledger), { cap: ledger.cap, priorExposure: ledger.priorExposure });
  const report: any = { stage: "recorded_original_component_controls_not_full_answers", model: verifier.id, cases: cases.map(({ passage: _original, ...c }) => c), results: [] };
  if (!process.argv.includes("--paid-owner-approved-within-loop")) { console.log(JSON.stringify({ status: "no_calls", planned: report.cases })); return; }
  persistCampaign(reportPath, report);
  const release = campaignLock(original, digest(bytes));
  try { await withModelTransport(guard.dispatch(fetch, unchanged), async () => {
    if (replay) {
      const before = guard.actual, start = ledger.calls.length;
      const items = cases.map(c => ({ text: c.text, refs: c.passage.originals.map((o: any) => o.source_id) }));
      const passages = cases.flatMap(c => c.passage.originals.map((o: any) => ({ id: o.source_id, arabic: o.arabic, attribution: o.attribution,
        surrounding_context: c.passage.restrictive_context?.passages ?? [] })));
      const raw = await verifier.generateJson(meaningReviewRequest(items, { passages }, new AbortController().signal));
      report.results.push({ stage: "same_seven_claims_fixed_output_allowance", result: parseMeaningReview(raw, items),
        cost: guard.actual - before, calls: ledger.calls.slice(start) });
      persistCampaign(reportPath, report); console.log(JSON.stringify(report.results[0])); return;
    }
    for (const c of cases) {
      const before = guard.actual, start = ledger.calls.length, items = [{ text: c.text, refs: [c.passage.id] }];
      const row: any = { id: c.id, expected: c.expected, status: "running" }; report.results.push(row); persistCampaign(reportPath, report);
      const raw = await verifier.generateJson(meaningReviewRequest(items, { passages: [c.passage] }, new AbortController().signal));
      row.result = parseMeaningReview(raw, items); row.status = "settled"; row.cost = guard.actual - before;
      row.matched = c.expected === "support" ? row.result?.safeIds.length === 1 : row.result?.failures.length === 1;
      row.calls = ledger.calls.slice(start); persistCampaign(reportPath, report); console.log(JSON.stringify(row));
      if (ledger.stopped || ledger.calls.some(c => c.cost === undefined)) break;
    }
  }); } finally { report.cumulativeLoopCost = guard.actual; report.combinedExposure = guard.exposure; persistCampaign(reportPath, report); release(); }
}
main().catch(e => { console.error(e instanceof Error ? e.message : "probe_stopped"); process.exitCode = 1; });
