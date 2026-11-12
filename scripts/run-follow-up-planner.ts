// Single owner-approved local run. Never imported by the website.
import { mkdir, writeFile } from "node:fs/promises";
import { createGemini } from "../lib/ai/gemini";
import { withModelTransport } from "../lib/ai/transport";
import { comparePlanners, comparisonReport } from "./ask-follow-up-planner";
import { PLANNER_CASES } from "./ask-follow-up-fixtures";
import { plannerRunBudget, PlannerRunStop, type RunLedger } from "./follow-up-run-budget";

async function main() {
  if (!process.argv.includes("--approved-v42-16")) throw new PlannerRunStop("approval_required");
  process.loadEnvFile(".env");
  try { process.loadEnvFile(".env.local"); } catch { /* Optional local overrides, as in existing evaluation scripts. */ }
  if (!process.env.VERTEX_API_KEY) throw new PlannerRunStop("vertex_key_missing");
  process.env.ASK_LOCAL_UNHURRIED = "true";
  const dir = "work/ask-follow-up-planner/approved-v42-16";
  await mkdir(dir, { recursive: true });
  // An existing run is never silently restarted with a fresh allowance.
  await writeFile(`${dir}/started.json`, JSON.stringify({ maximumUsd: 0.15, maximumCalls: 64 }), { flag: "wx" });
  const ledger: RunLedger = { calls: 0, spentUsd: 0, reservedUsd: 0, held: false, receipts: [] };
  const rows: Awaited<ReturnType<typeof comparePlanners>>[] = [], started = Date.now();
  const save = () => writeFile(`${dir}/ledger.json`, JSON.stringify(ledger, null, 2));
  const provider = createGemini(process.env.VERTEX_API_KEY, "gemini-3.1-flash-lite", "vertex");
  let stopCode: string | null = null;
  try {
    await withModelTransport(plannerRunBudget(ledger, save, fetch, { calls: 64, usd: 0.15 }), async () => {
      for (const test of PLANNER_CASES) {
        // Give model calls their own provider deadline, not the already-captured pipeline signal.
        const localProvider = { id: provider.id, generateJson: (request: Parameters<typeof provider.generateJson>[0]) => provider.generateJson({ ...request, signal: undefined }) };
        rows.push(await comparePlanners(test, localProvider));
        await writeFile(`${dir}/comparison.json`, JSON.stringify({ cases: PLANNER_CASES, rows }, null, 2));
        console.info(JSON.stringify({ code: "planner_case_finished", completed: rows.length, calls: ledger.calls, cost_usd: ledger.spentUsd }));
      }
    });
  } catch (error) { stopCode = error instanceof PlannerRunStop ? error.message : "planner_run_failed"; }
  await save();
  const result = { completed: rows.length, calls: ledger.calls, costUsd: ledger.spentUsd, reservedUsd: ledger.reservedUsd, milliseconds: Date.now() - started, stopCode };
  await writeFile(`${dir}/result.json`, JSON.stringify(result, null, 2));
  await writeFile(`${dir}/comparison.md`, comparisonReport(rows));
  console.info(JSON.stringify({ code: "planner_run_finished", ...result }));
}
main().catch(() => { console.error("planner_run_not_started"); process.exitCode = 1; });
