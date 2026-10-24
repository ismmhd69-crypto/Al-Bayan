import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { checkScholarAttributions, scholarAttributionNames } from "../lib/ask/scholar-attribution-check";
import { dependencies, pack, strictAudit, scholarId } from "./fixtures/rich";
import { runRichAnswer } from "../lib/ask/rich-engine";
const sources = [{ id: "S1", scholarId: "ibn-baz", name: "عبد العزيز بن باز" }, { id: "S2", scholarId: "ibn-baz", name: "عبد العزيز بن باز" },
  { id: "S3", scholarId: "ibn-uthaymeen", name: "محمد بن صالح العثيمين" }];
it("does not accept plural authorities as naming the one author behind two excerpts", () => {
  const check = checkScholarAttributions([{ text: "بين أهل العلم حدود طاعة الوالدين.", refs: ["S1", "S2"] }], sources, "ar");
  expect(check.blocked).toEqual(["C1"]); expect(check.failures[0].explanation).toContain("ابن باز");
});
it.each(["أوضح ابن باز هذا المعنى.", "بيّن عبد العزيز بن باز هذا المعنى.", "أوضح اِبْن بَاز هذا المعنى."])("accepts an existing localized short or full identity: %s", text => {
  expect(checkScholarAttributions([{ text, refs: ["S1", "S2"] }], sources, "ar").blocked).toEqual([]);
});
it("requires each distinct cited author but does not require repeated names for two quotes by one author", () => {
  expect(checkScholarAttributions([{ text: "أوضح ابن باز هذا المعنى.", refs: ["S1", "S3"] }], sources, "ar").blocked).toEqual(["C1"]);
  expect(checkScholarAttributions([{ text: "أوضح ابن باز وابن عثيمين هذا المعنى.", refs: ["S1", "S3"] }], sources, "ar").blocked).toEqual([]);
});
it("does not mistake part of a larger name for the author or borrow an uncited author", () => {
  expect(checkScholarAttributions([{ text: "Ibn Bazaar explains this point.", refs: ["S1"] }], [{ ...sources[0], name: "Ibn Baz" }], "en").blocked).toEqual(["C1"]);
  expect(checkScholarAttributions([{ text: "أوضح ابن عثيمين هذا المعنى.", refs: ["S1"] }], sources, "ar").blocked).toEqual(["C1"]);
});
it("retains a real institution's own attribution and falls back to supplied names for unlisted identities", () => {
  const own = [{ id: "S4", scholarId: "permanent-committee", name: "اللجنة الدائمة للبحوث العلمية والإفتاء" }, { id: "S5", scholarId: "test-author", name: "اسم تجريبي" }];
  expect(checkScholarAttributions([{ text: "أوضحت اللجنة الدائمة هذا المعنى.", refs: ["S4"] }, { text: "أوضح اسم تجريبي هذا المعنى.", refs: ["S5"] }], own, "ar").blocked).toEqual([]);
});
it("does not decide mixed-source synthesis, unknown identities or religious support", () => {
  expect(checkScholarAttributions([{ text: "A general synthesis.", refs: ["S1", "Q1"] }, { text: "Unknown source.", refs: ["missing"] },
    { text: "Ibn Baz guarantees an invented reward.", refs: ["S1"] }], sources, "en").blocked).toEqual([]);
  expect(scholarAttributionNames(sources, "de")[0].short_name).toBe("Ibn Baz");
});

it("overrides scripted positive checks and corrects the exact source sentence through the real engine", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson;
  let correction = 0, corrected = false, requiredArabicName = false;
  deps.writer.generateJson = async request => {
    const p = JSON.parse(request.prompt);
    if (p.scholar_attribution_names?.length) requiredArabicName = p.scholar_attribution_names[0].short_name === "Ibn Baz";
    if (p.correction) {
      correction++;
      expect(p.correction.checker_findings.support_failures).toContainEqual(expect.objectContaining({ code: "scholar_not_named" }));
      expect(p.correction.checker_findings.sentence_patches).toContainEqual(expect.objectContaining({ group: "scholar", replace_indices: [0] }));
      corrected = true;
      return { status: "answer", no_answer_feedback: [], scholar: { P0: { text: "Ibn Baz explains this teaching with its relevant conditions." } } };
    }
    const raw = await writer(request) as any;
    if (p.sections_to_write.includes("scholar")) raw.scholar[0].text = "Scholars explain this teaching with its relevant conditions.";
    return raw;
  };
  deps.verifier.generateJson = async request => strictAudit(request.prompt);
  const shown: any[] = []; deps.rich = { onSection: s => shown.push(s) };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer"); expect(correction).toBe(1); expect(corrected).toBe(true); expect(requiredArabicName).toBe(true);
  expect(shown.flatMap(s => s.claims).some(c => c.text.startsWith("Scholars explain"))).toBe(false);
  expect(shown.flatMap(s => s.claims).some(c => c.refs.includes(scholarId) && c.text.startsWith("Ibn Baz"))).toBe(true);
});
