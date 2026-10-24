import { afterEach, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
vi.mock("server-only", () => ({}));
import { main } from "../scripts/prepare-ask-matched-ranking";
import { pack } from "./fixtures/rich";

const argv = [...process.argv], files: string[] = [], dirs: string[] = [];
afterEach(() => {
  process.argv = [...argv]; vi.unstubAllGlobals(); vi.restoreAllMocks();
  for (const file of files.splice(0)) if (existsSync(file)) unlinkSync(file);
  for (const dir of dirs.splice(0)) rmdirSync(dir);
});

it("prepares exact request fingerprints without environment, providers, network or approvals", async () => {
  const root = resolve("work/private-ask-evaluation"); mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(resolve(root, "matched-preflight-test-")); dirs.push(directory);
  const input = resolve(directory, "input.json"), output = resolve(directory, "report.json"); files.push(input, output);
  writeFileSync(input, JSON.stringify({ version: 1, cases: [{ id: "invented-preflight", frame: { ...pack.question, kind: "question" }, candidates: pack.passages, limit: 2 }] }));
  process.argv = ["node", "script", "--dry-run", `--input=${input}`, `--out=${output}`];
  const network = vi.fn(() => { throw Error("no network in preflight"); }); vi.stubGlobal("fetch", network); vi.spyOn(console, "log").mockImplementation(() => {});
  await main();
  const report = JSON.parse(readFileSync(output, "utf8"));
  expect(network).not.toHaveBeenCalled();
  expect(report).toMatchObject({ status: "preflight_only_no_models_or_selection", modelCalls: 0, costUsd: 0, recall: null, answerAccuracy: null });
  expect(report.cases[0]).toMatchObject({ candidates: 3, limit: 2, review: "pending", freshSourcePermissions: "not_checked_by_offline_preflight" });
  expect(report.cases[0].rankingRequestHashes).toHaveLength(1);
  expect(report.codeFingerprints).toHaveProperty("lib/ask/search-engine/matched-ranking.ts");
  expect(readFileSync(output, "utf8")).not.toContain(pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse.arabic : "unexpected fixture");
  await expect(main()).rejects.toThrow("use_private_input_and_new_report_path");
});

it("has no implicit paid mode even when someone supplies run arguments", async () => {
  const network = vi.fn(); vi.stubGlobal("fetch", network);
  for (const mode of [[], ["--run"], ["--dry-run", "--run"]]) {
    process.argv = ["node", "script", ...mode];
    await expect(main()).rejects.toThrow("matched_ranking_preflight_only");
  }
  expect(network).not.toHaveBeenCalled();
});
