import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, audit } from "./fixtures/rich";

it("names the exact unavailable verse in correction feedback without accepting that rejected sentence", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let repaired = false;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (input.correction) {
      expect(input.correction.checker_findings.reference_failures).toContainEqual(expect.objectContaining({
        group: "quran", unknown_source_ids: ["Q2:184"], allowed_source_ids: ["Q2:183"],
        rejected_claims: [expect.objectContaining({ source_ids: ["Q2:184"] })],
      }));
      expect(input.correction.checker_findings.format_repair_rules.unknown_ref).toContain("Never merely relabel");
      repaired = true;
    } else if (input.sections_to_write.includes("quran")) result.quran[0].source_ids = ["Q2:184"];
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(repaired).toBe(true);
});

it("gives the later source writer actual first-section citations while first-section checking runs", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let restStarted = false;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.sections_to_write.includes("hadith")) {
      expect(input.source_explanations_already_drafted.quran).toEqual([expect.objectContaining({ source_ids: ["Q2:183"] })]);
      restStarted = true;
    }
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    if (!JSON.parse(req.prompt).full_answer) expect(restStarted).toBe(true);
    return audit(req.prompt);
  };
  expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
});

it("rechecks earlier claims without exposing previous approvals and withdraws newly identified unsafe claims", async () => {
  const deps = dependencies(); let finalSeen = false;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), r = audit(req.prompt);
    if (input.full_answer) {
      finalSeen = true;
      expect(input).not.toHaveProperty("prior_claim_reviews");
      expect(input.earlier_claim_ids).toEqual(["C1", "C2", "C3"]);
      expect(input.claim_evidence[0].cited_originals[0].id).toBe("Q2:183");
      expect(req.system).toContain("No previous checker verdicts are supplied");
      r.claim_assessments[0].conditions_preserved = "no";
      r.claim_assessments[0].reason_codes = ["condition_lost"];
      r.claim_assessments[0].explanation = "A newly noticed condition affects this earlier claim.";
      r.earlier_section_safe = "no";
    }
    return r;
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
  expect(finalSeen).toBe(true);
});

it("retains useful supported source sections when only their summary is a repetition", async () => {
  const deps = dependencies(); let corrections = 0; const writer = deps.writer.generateJson;
  deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).correction) corrections++; return writer(req); };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), r = audit(req.prompt);
    if (input.full_answer) {
      const summaryId = input.summary_claim_ids[0];
      r.no_repetition = "no";
      for (const c of r.contribution_map) {
        if (c.claim_id === summaryId) { c.kind = "restatement"; c.adds_value = "no"; c.duplicates = ["C1", "C2", "C3"]; }
        else c.duplicates = [summaryId];
      }
    }
    return r;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result).toMatchObject({ status: "incomplete", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.filter(s => s.outcome === "ready").map(s => s.group)).toEqual(["quran", "hadith", "scholar"]);
  expect(corrections).toBe(1);
});

it("gives the correction the exact uncited evidence failure instead of a generic instruction", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let corrected = false;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.correction) {
      expect(input.correction.checker_findings.citation_failures).toContainEqual(expect.objectContaining({
        claim_id: "C1", code: "proof_source_not_cited", source_id: "HE9001", allowed_source_ids: ["Q2:183"],
      }));
      corrected = true;
    }
    return writer(req);
  };
  deps.verifier.generateJson = async req => {
    const r = audit(req.prompt);
    if (!corrected && !JSON.parse(req.prompt).full_answer) r.citation_checks[0].clauses[0].evidence[0].source_id = "HE9001";
    return r;
  };
  expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
  expect(corrected).toBe(true);
});

it("keeps an independently checked first section when the later checker response is invalid", async () => {
  const deps = dependencies();
  deps.verifier.generateJson = async req => JSON.parse(req.prompt).full_answer ? null : audit(req.prompt);
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result).toMatchObject({ status: "incomplete", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.[0]).toMatchObject({ group: "quran", outcome: "ready" });
});
