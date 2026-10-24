import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer, replaysSourceSections } from "@/lib/ask/rich-engine";
import { dependencies, pack, audit, drafts } from "./fixtures/rich";

it("repairs a wholesale source replay instead of displaying it as synthesis", async () => {
  const deps = dependencies(), write = deps.writer.generateJson;
  let repairs = 0;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = await write(req) as any;
    if (input.sections_to_write.includes("summary")) {
      if (!input.correction) result.summary = [drafts.quran[0], drafts.hadith[0], drafts.scholar[0]];
      else {
        repairs++;
        expect(input.sections_to_write).toEqual(["summary"]);
        expect(input.correction.reason_codes).toContain("summary_replays_source_sections");
        expect(input.correction.checker_findings.format_repair_rules.summary_replays_source_sections).toContain("direct answer");
      }
    }
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(repairs).toBe(1); expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(result.answer.sections[3].claims).toHaveLength(1);
});

it("preserves short direct recaps and distinct multi-point synthesis without demanding new facts", () => {
  const sources = ["First supported point.", "Second supported point.", "Third supported point."]
    .map(text => ({ text, refs: ["Q2:183"] }));
  expect(replaysSourceSections(sources, sources)).toBe(true);
  expect(replaysSourceSections(sources.slice(0, 2), sources)).toBe(false);
  expect(replaysSourceSections([...sources.slice(0, 2), { text: "A distinct direct connection to the question.", refs: ["Q2:183"] }], sources)).toBe(false);
});

it("starts synthesis only after combined source checking and readable checked source sections", async () => {
  const deps = dependencies(), write = deps.writer.generateJson;
  const shown: string[] = [], writes: string[][] = [];
  let checking = false, release!: () => void;
  const gate = new Promise<void>(resolve => release = resolve);
  deps.rich = { onSection: s => { if (s.claims.length) shown.push(s.group); } };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (input.review_stage === "source_explanations") {
      expect(input.full_answer).toBe(false);
      expect(input.summary_claim_ids).toEqual([]);
      expect(input.earlier_claim_ids).toEqual(["C1"]);
      expect(req.maxOutputTokens).toBe(9000);
      checking = true; await gate;
    }
    return audit(req.prompt);
  };
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt); writes.push(input.sections_to_write);
    if (input.sections_to_write.includes("summary")) {
      expect(input.sections_to_write).toEqual(["summary"]);
      expect(shown).toEqual(["quran", "hadith", "scholar"]);
      expect(input.source_explanations_status).toBe("checked");
      expect(input.source_explanations_already_drafted.hadith[0].text).toBe(drafts.hadith[0].text);
    }
    return write(req);
  };
  const job = runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  await vi.waitFor(() => expect(checking).toBe(true));
  expect(shown).toEqual(["quran"]);
  expect(writes).toEqual([["quran"], ["hadith", "scholar"]]);
  release();
  expect((await job).status).toBe("rich_answer");
  expect(writes).toEqual([["quran"], ["hadith", "scholar"], ["summary"]]);
});

it("excludes rejected source explanations and citations from the synthesis request", async () => {
  const deps = dependencies(), write = deps.writer.generateJson;
  let sawSummary = false, corrections = 0;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = audit(req.prompt);
    input.claims.forEach((c: { source_ids: string[] }, i: number) => {
      if (c.source_ids.includes("HE9001")) Object.assign(result.claim_assessments[i], {
        direct_support: "no", reason_codes: ["unsupported_meaning"], explanation: "Scripted unsupported hadith explanation.",
      });
    });
    return result;
  };
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = await write(req) as any;
    if (input.correction) corrections++;
    if (input.sections_to_write.includes("summary")) {
      sawSummary = true;
      expect(input.source_explanations_already_drafted.hadith).toEqual([]);
      expect(input.citable_source_ids_by_section.summary).not.toContain("HE9001");
      result.summary = [{ ...drafts.summary[0], source_ids: ["Q2:183"] }];
    }
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(sawSummary).toBe(true); expect(corrections).toBe(1);
  // Scripted full coverage establishes the required point from the Quran. An
  // optional failed family cannot force a quota or enter the synthesis.
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(result.answer.sections[1]).toMatchObject({ outcome: "failed_check", claims: [] });
});

it.each(["transport", "malformed"])("never starts synthesis after a %s source-stage checker failure", async failure => {
  const deps = dependencies(), write = deps.writer.generateJson;
  let summaries = 0;
  deps.writer.generateJson = async req => {
    if (JSON.parse(req.prompt).sections_to_write.includes("summary")) summaries++;
    return write(req);
  };
  deps.verifier.generateJson = async req => {
    if (JSON.parse(req.prompt).review_stage === "source_explanations") {
      if (failure === "transport") throw Error("scripted connection failure");
      return { not_a_checker_envelope: true };
    }
    return audit(req.prompt);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(summaries).toBe(0);
  expect(result).toMatchObject({ status: "incomplete", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.[0]).toMatchObject({ outcome: "ready", claims: expect.any(Array) });
});

it("keeps checked source sections when synthesis transport fails, without an automatic transport retry", async () => {
  const deps = dependencies(), write = deps.writer.generateJson;
  let summaries = 0;
  deps.writer.generateJson = async req => {
    if (JSON.parse(req.prompt).sections_to_write.includes("summary")) { summaries++; throw Error("scripted writer unavailable"); }
    return write(req);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(summaries).toBe(1);
  expect(result).toMatchObject({ status: "incomplete", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.map(s => s.outcome)).toEqual(["ready", "ready", "ready"]);
});

it("still rejects a new unsupported synthesis and uses at most one summary correction", async () => {
  const deps = dependencies(), write = deps.writer.generateJson;
  let corrections = 0;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt); if (input.correction) { corrections++; expect(input.sections_to_write).toEqual(["summary"]); }
    return write(req);
  };
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = audit(req.prompt);
    for (const id of input.summary_claim_ids) Object.assign(result.claim_assessments[Number(id.slice(1)) - 1], {
      causal_meaning_preserved: "no", reason_codes: ["cause_inferred"], explanation: "Scripted unsupported causal synthesis.",
    });
    return result;
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(corrections).toBe(1);
  expect(result).toMatchObject({ status: "incomplete", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.map(s => s.outcome)).toEqual(["ready", "ready", "ready"]);
});

it("withdraws earlier sections when source-stage evidence finds a lost qualification", async () => {
  const deps = dependencies(), write = deps.writer.generateJson, withdraw = vi.fn();
  let summaries = 0;
  deps.rich = { onWithdraw: withdraw };
  deps.writer.generateJson = async req => {
    if (JSON.parse(req.prompt).sections_to_write.includes("summary")) summaries++;
    return write(req);
  };
  deps.verifier.generateJson = async req => {
    const result = audit(req.prompt);
    if (JSON.parse(req.prompt).review_stage === "source_explanations") {
      Object.assign(result.claim_assessments[0], { conditions_preserved: "no", reason_codes: ["condition_lost"], explanation: "Scripted late source restriction." });
      result.earlier_section_safe = "no";
    }
    return result;
  };
  expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true, sections: [] });
  expect(withdraw).toHaveBeenCalledOnce(); expect(summaries).toBe(0);
});

it("keeps progress and stops promptly when cancelled during synthesis", async () => {
  const deps = dependencies(), write = deps.writer.generateJson, stop = new AbortController();
  let writingSummary = false;
  deps.writer.generateJson = async req => {
    if (JSON.parse(req.prompt).sections_to_write.includes("summary")) { writingSummary = true; return new Promise(() => {}); }
    return write(req);
  };
  const job = runRichAnswer(pack, "en", deps, stop.signal, "Explain care", {});
  await vi.waitFor(() => expect(writingSummary).toBe(true)); stop.abort();
  const result = await job;
  expect(result).toMatchObject({ status: "incomplete", withdraw: false });
  if (result.status === "incomplete") expect(result.sections?.map(s => s.outcome)).toEqual(["ready", "ready", "ready"]);
});
