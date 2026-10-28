import { expect, it, vi } from "vitest";
import { privateFile, privateTrace } from "./helpers/private-fixtures";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "../lib/ask/rich-engine";
import { dependencies, pack, strictAudit } from "./fixtures/rich";
import { validRichAnswer } from "../lib/ask/rich-answer";
import { structuredOutputContract } from "../lib/ai/structured-output";
import { stripAnswer } from "../lib/chat/answer-store";
import { hydrateAnswer } from "../lib/chat/hydrate";
import { optionalGuidanceSizeRequests } from "../scripts/inspect-ask-optional-guidance-size";

function setup() {
  const deps = dependencies(), writer = deps.writer.generateJson;
  deps.writer.generateJson = async req => {
    const raw = await writer(req) as any;
    if (JSON.parse(req.prompt).sections_to_write.includes("summary")) {
      raw.no_answer_feedback = [];
      raw.next_step = [];
      expect(req.system).toContain("Every requested practical step still belongs in the supported answer");
      expect(req.schema.type).toBe("object");
      if (req.schema.type === "object") { expect(req.schema.required).toContain("next_step"); expect(req.schema.properties.next_step).toMatchObject({ type: "array", maxItems: 1 }); }
      const fullyRequired = (node: typeof req.schema) => {
        if (node.type === "object") { expect([...node.required].sort()).toEqual(Object.keys(node.properties).sort()); Object.values(node.properties).forEach(fullyRequired); }
        else if (node.type === "array") fullyRequired(node.items);
      };
      fullyRequired(req.schema);
      expect(structuredOutputContract(req.schema).parse(JSON.stringify(raw))).not.toBeNull();
    }
    return raw;
  };
  deps.verifier.generateJson = async req => strictAudit(req.prompt);
  return deps;
}

it("ordinary synthesis can omit the footer while retaining final citation, source and coverage checking", async () => {
  const deps = setup(), verifier = deps.verifier.generateJson; let finalCalls = 0;
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.full_answer) {
      finalCalls++;
      expect(p).not.toHaveProperty("next_step");
      expect(req.schema.type).toBe("object");
      if (req.schema.type === "object") {
        expect(req.schema.properties).not.toHaveProperty("guidance_safe");
        expect(req.schema.required).toContain("requirement_coverage");
        expect(req.schema.required).toContain("claim_assessments");
        expect(req.schema.required).toContain("direct_summary");
      }
    }
    return verifier(req);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(finalCalls).toBe(1);
  if (result.status !== "rich_answer") return;
  expect(result.answer).not.toHaveProperty("guide"); expect(validRichAnswer(result.answer)).toBe(true);
  const hydrated = await hydrateAnswer(JSON.parse(JSON.stringify(stripAnswer(result.answer))), {
    getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined,
    getHadith: async () => pack.passages[1].source.kind === "hadith" ? pack.passages[1].source.hadith : null,
  });
  expect(hydrated.ok).toBe(true); if (hydrated.ok) expect(hydrated.answer).not.toHaveProperty("guide");
});

it.each([null, {}, { text: "", kind: "learning", refs: [] }, { text: "An invented religious step.", kind: "sourced_instruction", refs: [] }])("does not silently discard a malformed supplied footer %#", async next => {
  const deps = setup(), writer = deps.writer.generateJson; let corrections = 0;
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt), raw = await writer(req) as any;
    if (p.sections_to_write.includes("summary")) { raw.next_step = next; if (p.correction) corrections++; }
    return raw;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete"); expect(corrections).toBe(1);
  if (result.status === "incomplete") expect(result.sections?.some(s => s.group === "summary")).toBe(false);
});

it("permits one writer correction to explicitly omit a rejected optional footer without accepting the old text", async () => {
  const deps = setup(), writer = deps.writer.generateJson; let summaryCalls = 0;
  deps.writer.generateJson = async req => {
    const p = JSON.parse(req.prompt), raw = await writer(req) as any;
    if (p.sections_to_write.includes("summary")) {
      summaryCalls++;
      if (!p.correction) raw.next_step = { text: "", kind: "learning", refs: [] };
      else expect(p.correction.checker_findings.format_repair_rules.guidance_invalid).toContain("[] for no footer");
    }
    return raw;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(summaryCalls).toBe(2);
  if (result.status === "rich_answer") expect(result.answer).not.toHaveProperty("guide");
});

it("absence cannot waive missing requested practical steps or their conditions", async () => {
  const deps = setup(); let finalCalls = 0;
  deps.verifier.generateJson = async req => {
    const r = strictAudit(req.prompt);
    if (JSON.parse(req.prompt).full_answer) { finalCalls++; r.requirement_coverage.R1.fully_answered = "no"; r.requirement_coverage.R1.conditions_preserved = "no"; r.complete_coverage = "no"; }
    return r;
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain the required steps", {})).toMatchObject({ status: "incomplete" });
  expect(finalCalls).toBe(2);
});

it("still checks a supplied footer and refuses unsafe guidance rather than treating it as absent", async () => {
  const deps = dependencies();
  deps.verifier.generateJson = async req => {
    const r = strictAudit(req.prompt), p = JSON.parse(req.prompt);
    if (p.full_answer) { expect(p.next_step).toBeTruthy(); r.guidance_safe = "no"; }
    return r;
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete" });
});

it("an omitted footer does not stop a late independent rejection from withdrawing an earlier claim", async () => {
  const deps = setup(); deps.meaningReview = true;
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.stage !== "narrow_meaning_review_v1") return strictAudit(req.prompt);
    return { claims: Object.fromEntries(p.claims.map((c: any, i: number) => [c.claim_id, {
      finding: { category: "missing_qualification", claim_quote: c.text, source_id: c.originals[0].source_id, source_quote: c.originals[0].arabic.slice(0, 900) },
      verdict: p.claims.length > 3 && i === 0 ? "no" : "yes", explanation: p.claims.length > 3 && i === 0 ? "An original condition was lost." : "",
    }])) };
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
});

it("absence also works in ordinary synthesis with staged focused checks without enabling selected-summary mode", async () => {
  const deps = setup(); deps.focusedChecks = true; let finalSeen = false;
  deps.verifier.generateJson = async req => {
    const p = JSON.parse(req.prompt);
    if (p.stage === "source_support_v1") return { claims: p.claims.map((c: any) => ({ claim_id: c.claim_id, source_ids: c.source_ids, verdict: "supported", reason_codes: [], explanation: "",
      grounds: c.supporting_excerpts.map((s: any) => ({ source_id: s.source_id, original_hash: s.original_hash, quote: s.original })) })) };
    if (p.stage !== "answer_quality_v1") throw Error("unexpected_focused_request");
    const r: any = { claims: p.claims.map((c: any) => ({ claim_id: c.claim_id, value: "useful", duplicate_of: [], explanation: "Distinct invented test meaning" })),
      coverage: p.full_answer ? p.requirements.map((requirement: any) => ({ requirement_id: requirement.id,
        claim_ids: p.claims.filter((c: any) => c.requirement_id === requirement.id && c.presentation_role === "source_explanation").map((c: any) => c.claim_id), fully_answered: "yes", conditions_preserved: "yes" })) : [],
      consistent: "yes", complete: "yes", summary_direct: "yes", scope_appropriate: "yes", earlier_section_safe: "yes" };
    if (p.full_answer) { finalSeen = true; expect(p).not.toHaveProperty("guidance"); }
    else { r.guidance_safe = "yes"; r.guidance_relevant = "yes"; }
    return r;
  };
  expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
  expect(finalSeen).toBe(true); expect(deps.selectedSummary).not.toBe(true);
});

const footerTrace = privateFile("work/local-ask-traces/fadc13d1-9af2-402a-b490-4af97684233f.jsonl", "trace fadc13d1-9af2-402a-b490-4af97684233f");
it.skipIf(!footerTrace.available)(`the actual blocked final request retains the exact same body evidence and output allowance without the optional footer${footerTrace.note}`, () => {
  const r = optionalGuidanceSizeRequests(), before = JSON.parse(r.withGuidance.prompt), after = JSON.parse(r.withoutGuidance.prompt);
  expect(before.next_step).toBeTruthy(); delete before.next_step;
  expect(after).toEqual(before);
  expect(r.withoutGuidance.maxOutputTokens).toBe(9000);
  expect(r.withoutGuidance.maxOutputTokens).toBe(r.withGuidance.maxOutputTokens);
  if (r.withoutGuidance.schema.type === "object") {
    expect(r.withoutGuidance.schema.required).toContain("requirement_coverage");
    expect(r.withoutGuidance.schema.required).toContain("claim_assessments");
    expect(r.withoutGuidance.schema.properties).not.toHaveProperty("guidance_safe");
  }
});
