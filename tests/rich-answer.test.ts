import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer, parseRichClaims } from "@/lib/ask/rich-engine";
import { consumeRichStream, emptyRichState, reduceRichEvent, validRichAnswer, type RichEvent } from "@/lib/ask/rich-answer";
import { abortable } from "@/lib/ask/abort";
import { stripAnswer } from "@/lib/chat/answer-store";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { pack, sections, drafts, richAnswer, audit, dependencies } from "./fixtures/rich";

describe("checked rich explanations", () => {
  it("still requires semantic approval after a short Arabic hadith overlap passes the editorial check", async () => {
    const local = structuredClone(pack), deps = dependencies();
    local.question.language = "ar";
    local.passages = local.passages.filter(p => p.source.kind === "hadith");
    local.cards = [];
    const source = local.passages[0].source;
    if (source.kind !== "hadith") throw Error("fixture");
    // Invented wording tests the boundary, not a real religious proposition.
    source.hadith.arabic = "ينال صاحب حسن الخلق مع الناس الثواب الجزيل ويرتفع قدره عند ربه";
    const claim = { text: "يشير الحديث إلى منزلة حسن الخلق مع الناس وأثر التعامل الحسن", source_ids: [source.hadith.id], requirement_id: "R1" };
    let semanticChecks = 0;
    deps.writer.generateJson = async req => {
      expect(req.system).toContain("six consecutive Arabic words from hadith originals");
      const input = JSON.parse(req.prompt);
      return { status: "answer", no_answer_feedback: [],
        ...Object.fromEntries(input.sections_to_write.map((g: string) => [g, [claim]])),
        next_step: { text: "راجع الشرح المعروض وحدد النقطة التي تحتاج إلى توضيح", kind: "learning", refs: [] } };
    };
    deps.verifier.generateJson = async req => {
      semanticChecks++;
      const result = audit(req.prompt);
      for (const row of result.claim_assessments) Object.assign(row, { direct_support: "no", reason_codes: ["unsupported_meaning"], explanation: "Scripted rejection: editorial acceptance is not meaning approval." });
      return result;
    };
    const result = await runRichAnswer(local, "ar", deps, new AbortController().signal, "سؤال تجريبي", {});
    expect(semanticChecks).toBeGreaterThan(0);
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") expect(result.sections?.flatMap(s => s.claims)).toEqual([]);
  });

  it.each(["quran", "hadith", "scholar"] as const)("completes a fully supported answer using %s alone", async group => {
    const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
    local.passages = local.passages.filter(p => p.source.kind === group);
    local.cards = group === "quran" ? local.cards : [];
    deps.writer.generateJson = async req => ({ ...await write(req) as object, summary: [{ ...drafts.summary[0], source_ids: [local.passages[0].id] }] });
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    if (result.status !== "rich_answer") throw Error("expected complete");
    expect(result.answer.complete).toBe(true);
    expect(result.answer.sections.filter(s => s.group !== "summary" && s.claims.length).map(s => s.group)).toEqual([group]);
  });
  it("accepts an independently supported direct recap even when the contribution map flags cross-summary overlap", async () => {
    const deps = dependencies(), check = deps.verifier.generateJson;
    deps.verifier.generateJson = async req => {
      const value = await check(req) as ReturnType<typeof audit>, input = JSON.parse(req.prompt);
      if (input.full_answer) {
        const last = value.contribution_map.at(-1)!;
        last.adds_value = "no"; last.duplicates = ["C1"];
        value.contribution_map[0].duplicates = [last.claim_id];
      }
      return value;
    };
    expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
  });
  it("does not call an answer complete merely because one source group answered one of two concerns", async () => {
    const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
    local.question.requirements.push({ id: "R2", text: "Explain a separate condition", facet: "conditions" });
    local.passages = local.passages.filter(p => p.source.kind === "quran");
    deps.writer.generateJson = async req => ({ ...await write(req) as object, summary: [{ ...drafts.summary[0], source_ids: ["Q2:183"] }] });
    expect((await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care and its separate condition", {})).status).toBe("incomplete");
  });
  it("patches only sentences with copied clauses and checks the complete corrected section", async () => {
    const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
    if (local.passages[1].source.kind !== "hadith") throw Error("fixture");
    local.passages[1].source.hadith.translations.en = "A patient person can face difficult circumstances with steady care.";
    const copied = { ...drafts.hadith[0], text: "The Prophet taught that a patient person can face difficult circumstances." };
    const kept = { ...drafts.hadith[0], text: "The Prophet explained why care matters in daily life." };
    const repaired = { ...drafts.hadith[0], text: "The Prophet connected patience with a steadier response to hardship." };
    const checked: string[][] = [];
    deps.verifier.generateJson = async req => {
      checked.push(JSON.parse(req.prompt).claims.map((c: { claim: string }) => c.claim)); return audit(req.prompt);
    };
    let repairs = 0;
    deps.writer.generateJson = async req => {
      expect(req.structuredOutput).toBe(true);
      const input = JSON.parse(req.prompt), result = await write(req) as Record<string, unknown>;
      if (!input.sections_to_write.includes("hadith")) return result;
      if (!input.correction) return { ...result, hadith: [copied, kept] };
      repairs++;
      expect(input.sections_to_write).toEqual(["hadith"]);
      expect(input.correction.checker_findings.sentence_patches).toEqual([expect.objectContaining({ group: "hadith", replace_indices: [0], sentence_count: 2,
        findings: [expect.objectContaining({ index: 0, rejected_text: copied.text, source_ids: ["HE9001"], overlap: expect.objectContaining({ sourceId: "HE9001", language: "en", rule: "copied_clause" }) })] })]);
      return { ...result, hadith: { P0: { text: repaired.text } } };
    };
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer"); expect(repairs).toBe(1);
    if (result.status !== "rich_answer") throw Error("fixture result");
    expect(result.answer.sections[1].claims.map(c => c.text)).toEqual([repaired.text, kept.text]);
    expect(checked.some(claims => claims.includes(repaired.text) && claims.includes(kept.text))).toBe(true);
  });
  it("routes an unreadable writer correction to the backup within the existing single allowance", async () => {
    const deps = dependencies(), write = deps.writer.generateJson, requests: (boolean | undefined)[] = [];
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (input.sections_to_write.includes("hadith")) {
        requests.push(req.malformedResponseRetry);
        if (!input.correction) return null;
        expect(input.correction.reason_codes).toContain("writer_response_unreadable");
      }
      return write(req);
    };
    expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
    expect(requests).toEqual([undefined, true]);
  });
  it("rejects a copying correction that changes sentence layout and retains the checked Quran section", async () => {
    const local = structuredClone(pack), deps = dependencies(), write = deps.writer.generateJson;
    if (local.passages[1].source.kind !== "hadith") throw Error("fixture");
    local.passages[1].source.hadith.translations.en = "A patient person can face difficult circumstances with steady care.";
    const copied = { ...drafts.hadith[0], text: "The Prophet taught that a patient person can face difficult circumstances." };
    let repairs = 0, writes = 0;
    deps.writer.generateJson = async req => {
      writes++;
      const input = JSON.parse(req.prompt), value = await write(req) as object;
      if (!input.sections_to_write.includes("hadith")) return value;
      if (!input.correction) return { ...value, hadith: [copied, drafts.hadith[0]] };
      repairs++;
      return { ...value, hadith: [drafts.hadith[0]] };
    };
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
    expect(repairs).toBe(1); expect(writes).toBe(4); expect(result.status).toBe("incomplete");
    if (result.status !== "incomplete") throw Error("fixture result");
    const shown = result.sections ?? [];
    expect(shown[0].outcome).toBe("ready"); expect(shown[1].claims).toEqual([]);
    expect(shown.some(s => s.group === "summary")).toBe(false);
  });
  it("does not rewrite a supported source explanation merely for a synthesis label", async () => {
    const deps = dependencies(), verify = deps.verifier.generateJson, write = deps.writer.generateJson;
    let corrections = 0;
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).correction) corrections++; return write(req); };
    deps.verifier.generateJson = async req => {
      const result = await verify(req) as ReturnType<typeof audit>;
      if (!JSON.parse(req.prompt).full_answer) result.contribution_map[0].kind = "synthesis";
      return result;
    };
    expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
    expect(corrections).toBe(0);
  });
  it("refuses a duplicated final answer while retaining previously checked source sections", async () => {
    const deps = dependencies(), verify = deps.verifier.generateJson;
    deps.verifier.generateJson = async req => {
      const result = await verify(req) as ReturnType<typeof audit>;
      if (JSON.parse(req.prompt).full_answer) {
        const row = result.contribution_map.find((c: { claim_id: string }) => c.claim_id === "C3")!;
        Object.assign(row, { kind: "restatement", adds_value: "no", duplicates: ["C1"] });
      }
      return result;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("incomplete");
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status === "incomplete") expect(result.sections?.filter(s => s.claims.length)).toHaveLength(3);
  });
  it("repairs a failed first explanation and invalid scholar sibling together before synthesis", async () => {
    const deps = dependencies(), write = deps.writer.generateJson, verify = deps.verifier.generateJson;
    let firstCheck = true;
    const correctionGroups: string[][] = [];
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (input.correction) { correctionGroups.push(input.sections_to_write); return write(req); }
      const result = await write(req) as Record<string, unknown>;
      if (input.sections_to_write.includes("scholar")) result.scholar = drafts.quran; // Invalid source attribution, not yet eligible for synthesis.
      return result;
    };
    deps.verifier.generateJson = async req => {
      const result = await verify(req) as Record<string, unknown>;
      if (firstCheck && !JSON.parse(req.prompt).full_answer) { firstCheck = false; result.useful_explanation = "no"; }
      return result;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(correctionGroups).toHaveLength(1);
    expect(correctionGroups[0]).toEqual(["quran", "scholar"]);
    expect(result.status).toBe("rich_answer");
  });
  it("identifies the exact failed group and copy rule in its existing correction", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    let first = true, feedback: unknown;
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (input.correction) feedback = input.correction.checker_findings;
      if (first && input.sections_to_write.includes("quran")) {
        first = false;
        return { status: "answer", no_answer_feedback: [], quran: [{ text: "The Quran states Invented source wording solely for tests.", source_ids: ["Q2:183"], requirement_id: "R1" }] };
      }
      return write(req);
    };
    expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("rich_answer");
    expect(feedback).toMatchObject({ format_failures: expect.arrayContaining([{ group: "quran", reason: "copied_source" }]), format_repair_rules: { copied_source: expect.any(String) } });
  });
  it.each(["summary", "guidance"])("retains checked source drafts after bounded %s correction fails", async broken => {
    const deps = dependencies(), write = deps.writer.generateJson, check = deps.verifier.generateJson;
    const corrections: string[][] = [], audits: boolean[] = [];
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt), value = await write(req) as Record<string, unknown>;
      if (input.correction) corrections.push(input.sections_to_write);
      if (input.sections_to_write.includes("summary")) {
        if (broken === "summary") value.summary = [];
        else value.next_step = { text: "", kind: "learning", refs: [] };
      }
      return value;
    };
    deps.verifier.generateJson = async req => { audits.push(JSON.parse(req.prompt).full_answer); return check(req); };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(corrections).toEqual([["summary"]]);
    expect(audits).toEqual([false, false]); // first section, combined sources; no invalid summary is checked
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status === "incomplete") {
      expect(result.sections?.map(s => [s.group, s.outcome])).toEqual([["quran", "ready"], ["hadith", "ready"], ["scholar", "ready"]]);
      expect(result.sections?.some(s => s.group === "summary")).toBe(false);
    }
  });

  it("does not retain an unsupported source sibling merely because summary writing failed", async () => {
    const deps = dependencies(), write = deps.writer.generateJson, check = deps.verifier.generateJson;
    deps.writer.generateJson = async req => {
      const value = await write(req) as Record<string, unknown>;
      if (JSON.parse(req.prompt).sections_to_write.includes("summary")) value.summary = [];
      return value;
    };
    deps.verifier.generateJson = async req => {
      const value = await check(req) as ReturnType<typeof audit>;
      if (JSON.parse(req.prompt).review_stage === "source_explanations") Object.assign(value.claim_assessments[1], { direct_support: "no", reason_codes: ["unsupported_meaning"], explanation: "Invented unsupported wording." });
      return value;
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status === "incomplete") expect(result.sections?.map(s => s.outcome)).toEqual(["ready", "failed_check", "ready"]);
  });
  it("delivers Quran while an unrelated scholarly display translation is still loading", async () => {
    const deps = dependencies(); let release!: () => void;
    const lookup = new Promise<void>(resolve => { release = resolve; });
    let quranDelivered = false;
    deps.displayTranslationLookup = async () => { await lookup; return new Map(); };
    deps.rich = { onSection: section => {
      if (section.group === "quran") { quranDelivered = true; release(); }
    } };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(quranDelivered).toBe(true);
    expect(result.status).toBe("rich_answer");
  });
  it("sends a checked Quran section before waiting for the remaining writer", async () => {
    const deps = dependencies(), events: string[] = [];
    let release!: () => void;
    const remaining = new Promise<void>(r => release = r);
    const write = deps.writer.generateJson;
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).sections_to_write[0] === "hadith") await remaining; return write(req); };
    deps.rich = { onSection: section => { events.push(section.group); if (section.group === "quran") release(); } };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    expect(events).toEqual(["quran", "hadith", "scholar", "summary"]);
    expect(result.status === "rich_answer" && validRichAnswer(result.answer)).toBe(true);
  });
  it.each(["direct_support", "audience_preserved", "conditions_preserved", "scope_preserved", "causal_meaning_preserved"])("withholds unsupported %s and withdraws an earlier section when the full check finds it unsafe", async field => {
    const deps = dependencies(); const withdraw = vi.fn(); deps.rich = { onWithdraw: withdraw };
    deps.verifier.generateJson = async req => {
      const result = audit(req.prompt);
      if (JSON.parse(req.prompt).full_answer) { result.claim_assessments[0][field] = "no"; result.claim_assessments[0].reason_codes = [field === "direct_support" ? "unsupported_meaning" : field === "audience_preserved" ? "audience_changed" : field === "conditions_preserved" ? "condition_lost" : field === "scope_preserved" ? "scope_broadened" : "cause_inferred"]; result.claim_assessments[0].explanation = "The explanation loses a restriction in its cited source."; result.earlier_section_safe = "no"; }
      return result;
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: true });
    expect(withdraw).toHaveBeenCalledOnce();
  });
  it("rejects invented references while allowing an unapproved empty source draft", () => {
    expect(parseRichClaims([{ ...drafts.quran[0], source_ids: ["Q2:184"] }], "quran", pack, "en")).toBeNull();
    expect(parseRichClaims([], "hadith", pack, "en")).toEqual([]);
    expect(parseRichClaims([], "summary", pack, "en")).toBeNull();
    expect(parseRichClaims(drafts.quran, "hadith", pack, "en")).toBeNull();
  });
  it("resolves absent Quran evidence and proceeds to the hadith instead of writing an empty Quran explanation", async () => {
    const deps = dependencies(), local = structuredClone(pack);
    local.passages = local.passages.filter(p => p.source.kind !== "quran"); local.cards = [];
    const write = deps.writer.generateJson;
    deps.writer.generateJson = async req => ({ ...await write(req) as object, summary: [{ ...drafts.summary[0], source_ids: ["HE9001"] }] });
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", { quran: "timeout" });
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections[0]).toMatchObject({ group: "quran", outcome: "timeout", claims: [], sources: [] });
  });
  it("retains the individually checked section when the remaining writer fails", async () => {
    const deps = dependencies(), received: string[] = []; const write = deps.writer.generateJson;
    deps.rich = { onSection: s => received.push(s.group) };
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).sections_to_write[0] === "hadith") throw new Error("provider down"); return write(req); };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete", withdraw: false });
    expect(received).toEqual(["quran", "hadith", "scholar"]);
  });
  it("keeps checked sections but never completes or saves an answer after a selected Quran explanation fails", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.writer.generateJson = async req => { if (JSON.parse(req.prompt).sections_to_write[0] === "quran") throw new Error("draft failed"); return write(req); };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") {
      expect(result.sections?.map(s => s.outcome)).toEqual(["failed_check", "ready", "ready"]);
      expect(result.sections?.some(s => s.group === "summary")).toBe(false);
    }
  });
  it("stops waiting on cancellation even if a dependency ignores the signal", async () => {
    const stop = new AbortController(), deps = dependencies(), received = vi.fn(); deps.rich = { onSection: received };
    deps.writer.generateJson = async () => new Promise(() => {});
    const work = runRichAnswer(pack, "en", deps, stop.signal, "Explain care", {}); stop.abort();
    expect(await work).toMatchObject({ status: "incomplete" }); expect(received).not.toHaveBeenCalled();
    await expect(abortable(Promise.resolve(1), stop.signal)).rejects.toBeDefined();
  });
});

describe("stream integrity and history", () => {
  const event = (sequence: number, extra: object) => ({ request_id: "request-one", sequence, ...extra }) as RichEvent;
  it("keeps citations and source data together, rejects reordered or mismatched events", () => {
    const state = reduceRichEvent(emptyRichState(), event(1, { type: "section", section: sections[0] }));
    expect(state.sections[0].sources[0].id).toBe(state.sections[0].claims[0].refs[0]);
    expect(() => reduceRichEvent(state, event(1, { type: "section", section: sections[1] }))).toThrow();
    expect(() => reduceRichEvent(state, event(2, { type: "section", section: sections[2] }))).toThrow();
    expect(() => reduceRichEvent(state, { ...event(2, { type: "progress", stage: "searching" }), request_id: "other" })).toThrow();
    expect(() => reduceRichEvent(state, event(2, { type: "terminal", result: { status: "rich_answer", answer: richAnswer } }))).toThrow();
    expect(reduceRichEvent(state, event(2, { type: "withdraw" })).sections).toEqual([]);
  });
  it("decodes Arabic across single-byte chunks and refuses a truncated frame", async () => {
    const bytes = new TextEncoder().encode(`data: ${JSON.stringify(event(1, { type: "terminal", result: { status: "no_source", example: "العربية" } }))}\n\n`);
    const values: RichEvent[] = [];
    await consumeRichStream(new ReadableStream({ start(c) { for (const b of bytes) c.enqueue(Uint8Array.of(b)); c.close(); } }), e => values.push(e));
    expect(JSON.stringify(values)).toContain("العربية");
    await expect(consumeRichStream(new ReadableStream({ start(c) { c.enqueue(bytes.slice(0, -1)); c.close(); } }), () => {})).rejects.toThrow("truncated");
  });
  it("removes all Quran/hadith source text from all repeated section citations, then reloads trusted sources", async () => {
    const saved = stripAnswer(richAnswer);
    expect(JSON.stringify(saved)).not.toContain(pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse.arabic : "unexpected");
    for (const s of saved.sections) for (const source of s.sources) if (source.evidence.kind !== "scholar") expect(source.evidence.arabic).toBe("");
    const reopened = await hydrateAnswer(saved, { getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined, getHadith: async () => pack.passages[1].source.kind === "hadith" ? pack.passages[1].source.hadith : null });
    expect(reopened).toEqual({ ok: true, answer: richAnswer });
    expect(await hydrateAnswer(saved, { getVerse: async () => undefined, getHadith: async () => null })).toMatchObject({ ok: false });
    expect(validRichAnswer({ ...richAnswer, complete: false })).toBe(false);
    expect(validRichAnswer({ ...richAnswer, review: "bayan_reviewed" })).toBe(false);
  });
});
