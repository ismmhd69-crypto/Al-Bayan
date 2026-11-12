// Offline evaluation only. All safety guards are the production implementations.
import type { AIProvider, JsonRequest } from "../lib/ai/types";
import { runPipeline } from "../lib/ask/core";
import { expandedPlannerRequest, describePlannerOutput, followUpFailure, type FollowUpContext, type FollowUp } from "../lib/ask/follow-up";
export { premiseCheck, bareDependentReference, visitorConditions, parseFollowUp, expandedPlannerRequest, describePlannerOutput, FOLLOW_UP_RULES } from "../lib/ask/follow-up";
export type { FollowUp } from "../lib/ask/follow-up";
export type PlannerCase = FollowUpContext & { id: string; provenance?: { trace: string; note: string }; expected: { relation: FollowUp["relation"]; intent: FollowUp["intent"]; kind: string; preserve: string } };
export async function currentPlannerRequest(test: PlannerCase, model: string, correction?: { rejected: unknown }): Promise<JsonRequest> {
  let captured: JsonRequest | undefined;
  const halt = new Error("offline_request_captured");
  const forbidden = async (): Promise<never> => { throw new Error("offline_retrieval_forbidden"); };
  let first = true;
  try {
    await runPipeline(test.message, test.language, {
      writer: { id: model, generateJson: async request => {
        if (correction && first) { first = false; return structuredClone(correction.rejected); }
        captured = request; throw halt;
      } },
      verifier: { id: "offline/disabled", generateJson: forbidden }, rich: {}, simpleResearch: true,
      tiered: { videoBudgetMs: 0, maxVideos: 0 }, previousUserMessages: [],
      search: forbidden, getVerse: forbidden, neighbours: forbidden,
    });
  } catch (error) { if (error !== halt) throw error; }
  if (!captured) throw new Error("offline_request_missing");
  return { ...captured, prompt: JSON.stringify({ ...JSON.parse(captured.prompt), ...(test.history.length ? { previous_user_messages: test.history } : {}) }) };
}

export async function comparePlanners(test: PlannerCase, provider: AIProvider) {
  const baseline = await currentPlannerRequest(test, provider.id);
  const old = await evaluatePlanner(baseline, test, provider, false);
  const candidate = await evaluatePlanner(expandedPlannerRequest(baseline, test), test, provider, true);
  return { id: test.id, expected: test.expected, old, candidate,
    changed: { kind: old.output.kind !== candidate.output.kind,
      requirements: JSON.stringify(old.output.requirements) !== JSON.stringify(candidate.output.requirements),
      queries: JSON.stringify([old.output.queries, old.output.backupQueries]) !== JSON.stringify([candidate.output.queries, candidate.output.backupQueries]) },
    expectedFieldsMatch: candidate.output.kind === test.expected.kind && candidate.output.followUp?.relation === test.expected.relation && candidate.output.followUp?.intent === test.expected.intent,
    meaningReview: "pending_owner_review" };
}

export function comparisonReport(rows: Awaited<ReturnType<typeof comparePlanners>>[]): string {
  return ["# Offline planner comparison", "", "Local planner outputs only. No searches or answers were produced. Changed does not mean worse or better. Mo must review meaning, conditions and queries.", "",
    ...rows.flatMap(row => [`## ${row.id}`, "", `Expected meaning: ${row.expected.preserve}`, "",
      `Expected fields match: ${row.expectedFieldsMatch}. Meaning review: pending.`, "",
      "Old output:", "", "```json", JSON.stringify(row.old, null, 2), "```", "", "Candidate output:", "", "```json", JSON.stringify(row.candidate, null, 2), "```", "",
      `Changed: ${JSON.stringify(row.changed)}`, ""]),
  ].join("\n");
}

// Caller supplies a provider only for a specifically approved local evaluation.
// No keys, network provider, source loader or production prompt is created here.
export async function evaluatePlanner(request: JsonRequest, test: PlannerCase, provider: AIProvider, expanded: boolean) {
  const attempts: unknown[] = [];
  for (let i = 0; i < 2; i++) {
    const input = !i ? request : !expanded ? await currentPlannerRequest(test, provider.id, { rejected: attempts[0] })
      : { ...request, prompt: JSON.stringify({ ...JSON.parse(request.prompt), correction: `Correct the question checklist. Problem: ${describePlannerOutput(attempts[0], true, test).failureReason}. Requirement text must be plain English, at most 16 words; subjects must be short English labels. Keep at least one main Arabic query of at most six words for answerable questions. Rewrites name topics, never state parent claims or add premise connectors absent from user text. Each follow-up essential condition needs an exact user quote in essential_condition_quotes. Preserve visitor negation and personal details. Never supply an answer.` }) };
    const raw = await provider.generateJson(input); attempts.push(raw);
    const output = describePlannerOutput(raw, expanded, test);
    if (output.valid) return { attempts, output, fallback: null };
  }
  const output = describePlannerOutput(attempts.at(-1), expanded, test);
  const fallback = expanded ? followUpFailure(output, test) : "frame_invalid";
  return { attempts, output, fallback };
}
