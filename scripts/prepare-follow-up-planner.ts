// Prepare local requests only. This command never loads credentials or calls a model.
// npx tsx --conditions=react-server scripts/prepare-follow-up-planner.ts
import { mkdir, writeFile } from "node:fs/promises";
import { currentPlannerRequest, expandedPlannerRequest } from "./ask-follow-up-planner";
import { PLANNER_CASES } from "./ask-follow-up-fixtures";
import { modelReservation } from "../lib/ai/price-ceiling";

async function main() {
  const model = "vertex/gemini-3.1-flash-lite";
  const rows = [];
  let reservation = 0;
  for (const test of PLANNER_CASES) {
    const old = await currentPlannerRequest(test, model), candidate = expandedPlannerRequest(old, test);
    for (const request of [old, candidate]) reservation += 2 * modelReservation({ model,
      messages: [request.system, request.prompt, request.schema, "Correction allowance: preserve all circumstances and return valid fields."], max_tokens: request.maxOutputTokens! });
    rows.push({ test, old: { ...old, signal: undefined }, candidate: { ...candidate, signal: undefined } });
  }
  const directory = "work/ask-follow-up-planner";
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/requests.json`, JSON.stringify({ synthetic: true, model, questions: rows.length, initialCalls: rows.length * 2,
    maximumCalls: rows.length * 4, reservationUsd: reservation, rows }, null, 2));
  console.info(JSON.stringify({ code: "offline_planner_requests_prepared", questions: rows.length, initial_calls: rows.length * 2,
    maximum_calls: rows.length * 4, conservative_reservation_usd: reservation, model_calls_made: 0 }));
}
main().catch(() => { console.error("offline_planner_prepare_failed"); process.exitCode = 1; });
