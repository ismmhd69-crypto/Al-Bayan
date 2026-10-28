// Fixed public-passage control invoked only inside the existing capped operator runner.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getVerifier } from "../lib/ai";
import { withModelTransport } from "../lib/ai/transport";
import { createContinuationSession, claimContinuationSession, continuationTransport, finishContinuationSession } from "../lib/ask/continuation-session";
import { withAskRequest } from "../lib/ask/trace-context";
import { meaningReviewRequest, parseMeaningReview } from "../lib/ask/meaning-review";
import { searchScholarQuotes } from "../lib/sources/scholars";

export async function reviewConditionLogic(attempt: number, guardInstalled: () => boolean) {
  if (!guardInstalled()) throw Error("evaluation_guard_not_installed");
  const path = resolve(`work/ask-latency-review-20261025/condition-controls-${attempt}.json`);
  if (existsSync(path)) throw Error("condition_control_already_recorded");
  const saved = JSON.parse(readFileSync("work/ask-latency-review-20261025/ar-parents-attempt6.continuation1.json", "utf8"));
  const section = saved.displayedSections.find((s: any) => s.section.group === "scholar").section;
  const bad = section.claims.find((c: any) => c.text.includes("أو يرفضا"));
  if (!bad || bad.refs.length !== 1) throw Error("fixed_condition_control_missing");
  const original = section.sources.find((s: any) => s.id === bad.refs[0]).evidence;
  const signal = AbortSignal.timeout(50_000);
  const fresh = await searchScholarQuotes([original.title], 8, { allVariants: true, meaningCandidates: true, signal });
  if (!fresh.some(q => q.id === original.key && q.arabic === original.arabic && q.url === original.url)) throw Error("condition_source_not_currently_approved");
  const faithful = bad.text.replace("أو يرفضا", "ويرفضا").replace("حين يأمر الوالدان بما فيه انحراف", "حين يكون الوالدان منحرفين ويأمران بالانحراف");
  const controls = [{ id: "recorded_alternative", claim: bad, expected: "withheld" },
    { id: "preserved_conditions", claim: { ...bad, text: faithful }, expected: "supported" },
    { id: "isolated_alternative", claim: { ...bad, text: faithful.replace("ويرفضا", "أو يرفضا") }, expected: "withheld" }];
  const results: unknown[] = [];
  for (const control of controls) {
    if (!guardInstalled()) throw Error("evaluation_guard_not_installed");
    const owned = createContinuationSession("Public Arabic parents condition comparison", "ar", []);
    const session = claimContinuationSession(owned.token, "ar");
    const serialized = { passages: [{ id: original.key, arabic: original.arabic, type: "scholar" }] };
    const request = meaningReviewRequest([control.claim], serialized, signal, true);
    try {
      const response = await withAskRequest(`condition-control-${attempt}-${results.length}`, () => withModelTransport(continuationTransport(session), () => getVerifier().generateJson(request)));
      const verdict = parseMeaningReview(response, [control.claim], serialized, true);
      results.push({ id: control.id, expected: control.expected, observed: verdict?.safeIds.includes("C1") ? "supported" : "withheld", valid: !!verdict, response });
    } finally { finishContinuationSession(session, true); }
    writeFileSync(path, JSON.stringify({ source: original, controls, results }, null, 2), { mode: 0o600 });
  }
  return results.map((r: any) => ({ id: r.id, expected: r.expected, observed: r.observed, valid: r.valid }));
}
