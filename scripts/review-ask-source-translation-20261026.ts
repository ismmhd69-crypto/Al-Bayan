// One fixed meaning-check control, available only through the capped runner.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getVerifier } from "../lib/ai";
import { meaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { withResearchRuntime } from "../lib/ask/research-runtime";

export async function reviewSourceTranslation(attempt: number, guardInstalled: () => boolean) {
  if (!guardInstalled()) throw Error("evaluation_guard_not_installed");
  const path = resolve(`work/ask-latency-review-20261025/source-translation-controls-${attempt}.json`);
  if (existsSync(path)) throw Error("source_translation_control_already_recorded");
  const rows = readFileSync("work/local-ask-traces/b74e44e3-21d4-44b3-bd8f-34440f0b703b.jsonl", "utf8").split("\n").filter(Boolean).map(v => JSON.parse(v));
  const recorded = rows.find(r => r.event === "model_request" && r.data.call_id === "A21")?.data.prompt;
  const verse = rows.find(r => r.event === "source_finished" && r.data.result?.key === "17:34")?.data.result;
  const original = recorded?.claims?.find((c: any) => c.originals?.length === 1 && c.originals[0].source_id === "Q17:34");
  if (!original || !verse?.translations?.en || original.originals[0].arabic !== verse.arabic) throw Error("source_translation_control_missing");
  const claims = [
    { text: original.text, refs: ["Q17:34"] },
    { text: "This passage guarantees that everyone who keeps a promise will never experience hardship.", refs: ["Q17:34"] },
    { text: "This passage says only women will be questioned about their pledges.", refs: ["Q17:34"] },
  ];
  const serialized = { question: { language: "en" }, passages: [{ id: "Q17:34", type: "quran", arabic: verse.arabic, translation_en: verse.translations.en }] };
  const request = meaningReviewRequest(claims, serialized, new AbortController().signal, true);
  if (!guardInstalled()) throw Error("evaluation_guard_not_installed");
  const raw = await withResearchRuntime(Infinity, () => getVerifier().generateJson(request));
  const checked = parseMeaningReview(raw, claims, serialized, true);
  const passed = !!checked && JSON.stringify(checked.safeIds) === '["C1"]' && checked.failures.length === 2;
  const result = { mode: "saved_source_translation_control", passed, safeIds: checked?.safeIds ?? [], rejectedIds: checked?.failures.map(f => f.claim_id) ?? [],
    limitation: "One saved source and three fixed claims; not whole-answer or Arabic acceptance." };
  writeFileSync(path, JSON.stringify({ result, raw }, null, 2), { mode: 0o600 });
  return result;
}
