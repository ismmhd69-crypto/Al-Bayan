import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import cases from "./fixtures/ask-library-evaluation.json";
import { FROZEN_LIBRARY_HASH, libraryAcceptance, libraryEvaluationSummary, type Measurement } from "../scripts/evaluate-ask-library";
import { replayRecordedWording } from "../scripts/replay-ask-wording";
import { sharedAskLedgerPath } from "../scripts/ask-test-profile";
import { parseUserHistory, safeClarificationChoices } from "@/lib/ask/conversation";
import { ClarificationView } from "@/components/AskChat";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getDictionary } from "@/lib/i18n";
const row = (id: string): Measurement => ({ id, expected: "complete_answer", outcome: "answer", seconds: 10, cost: 0.01, reasons: [], sources: { quran: 1, hadith: 0, scholar: 0 } });
describe("offline evidence and acceptance boundaries", () => {
  it("replays every recorded stored-hadith writer appearance with no wording loss", () => {
    for (const [run, appearances] of [["baseline-1", 4], ["pilot-1", 28]] as const) {
      expect(replayRecordedWording(`docs/ask-repair-runs/${run}.json`)).toMatchObject({ appearances, missingBefore: appearances, missingAfter: 0, unavailableForReplay: 0 });
    }
  });
  it("freezes the original 26 and multilingual rewording/ambiguity/follow-up cases before model calls", () => {
    expect(createHash("sha256").update(readFileSync("tests/fixtures/ask-library-evaluation.json")).digest("hex")).toBe(FROZEN_LIBRARY_HASH);
    expect(cases.cases).toHaveLength(44);
    expect(cases.cases.filter((c) => c.cohort === "original26")).toHaveLength(26);
    expect(cases.cases.find((c) => c.id === "music-en")?.expected).toBe("safe_refusal");
    expect(cases.original_answerable_denominator).toBe(23); expect(cases.adjusted_answerable_denominator).toBe(22);
    for (const c of cases.cases) { expect(parseUserHistory(c.previous_user_messages)).not.toBeNull(); expect(c.question.length).toBeLessThanOrEqual(500); expect(c.expected_points.length).toBeGreaterThan(0); }
    for (const lang of ["en", "de", "ar"]) expect(cases.cases.filter((c) => c.lang === lang && c.previous_user_messages.length).length).toBeGreaterThanOrEqual(3);
  });
  it("does not count an automatic answer, clarification or partial response as complete source-reviewed success", () => {
    const summary = libraryEvaluationSummary([row("unreviewed"), { ...row("clarification"), outcome: "clarify" }, { ...row("partial"), review: { complete: false, supported: true, reason: "missing amount" } }]);
    expect(summary).toMatchObject({ manuallyAcceptedComplete: 0, unreviewedAnswers: 1, clarifications: 1, partial: 1, acceptedRate: 0 });
    expect(libraryAcceptance([], [], true, true).accepted).toBe(false);
  });
  it("requires matching full rounds, source review, both speed gates and claim-audit gates", () => {
    const all = cases.cases.map((c) => ({ ...row(c.id), expected: c.expected, outcome: c.expected === "safe_refusal" ? "no_source" : "answer", review: { complete: true, supported: true, reason: "controlled reviewer outcome" } }));
    expect(libraryAcceptance(all, all, true, true).accepted).toBe(true);
    expect(libraryAcceptance(all, all, false, true).accepted).toBe(false);
    expect(libraryAcceptance(all, all, true, false).accepted).toBe(false);
    expect(libraryAcceptance(all, all.slice(1), true, true).accepted).toBe(false);
    expect(libraryAcceptance(all, [{ ...all[0], expected: "safe_refusal" }, ...all.slice(1)], true, true).accepted).toBe(false);
    expect(libraryAcceptance(all, all.map((r) => ({ ...r, seconds: 11.1 })), true, true).accepted).toBe(false);
    expect(libraryAcceptance(all, [{ ...all[0], review: { complete: true, supported: false, reason: "audience changed" } }, ...all.slice(1)], true, true).accepted).toBe(false);
    const original = cases.cases.filter((c) => c.cohort === "original26" && c.expected === "complete_answer").slice(0, 4).map((c) => c.id);
    // Extra multilingual successes cannot hide missing points in the original 22 answerable cases.
    const weakerOriginal = all.map((r) => original.includes(r.id) ? { ...r, outcome: "no_source" } : r);
    expect(libraryEvaluationSummary(weakerOriginal).acceptedRate).toBeGreaterThanOrEqual(0.85);
    expect(libraryAcceptance(all, weakerOriginal, true, true).accepted).toBe(false);
  });
  it("uses the main checkout's original ledger even in a worktree", () => {
    const ledger = sharedAskLedgerPath();
    expect(ledger.replaceAll("\\", "/")).not.toContain("bayan-ask-reliability/docs");
    const record = JSON.parse(readFileSync(ledger, "utf8"));
    expect(record.cap).toBe(1.5);
    expect(record.entries.length).toBeGreaterThan(0);
  });
  it.each(["en", "de", "ar"] as const)("renders localized clarification with neutral choices in %s", (lang) => {
    const choices = safeClarificationChoices(["Voluntary charity", "Obligatory zakat"], lang);
    const html = renderToStaticMarkup(createElement(ClarificationView, { choices, prompt: getDictionary(lang).ask.clarify, busy: false, onChoose: () => {} }));
    expect(html).toContain(getDictionary(lang).ask.clarify); expect(html).toContain(choices[0]); expect(html).toContain("<button");
  });
  it("never renders arbitrary model labels as unchecked religious statements", () => {
    expect(safeClarificationChoices(["Everyone must give a fixed amount", "No charity is ever needed"], "en")).toEqual([]);
  });
});
