import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { dependencies, pack, audit } from "./fixtures/rich";

function rejectMarked(prompt: string) {
  const input = JSON.parse(prompt), result = audit(prompt);
  input.claims.forEach((claim: { claim: string }, i: number) => {
    if (claim.claim.includes("unestablished")) {
      result.claim_assessments[i].direct_support = "no";
      result.claim_assessments[i].reason_codes = ["unsupported_meaning"];
      result.claim_assessments[i].explanation = "This marked test scope is not established by the cited original.";
    }
  });
  return result;
}
it("uses the one correction for both the first failed explanation and a later semantic failure", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; const corrections: string[][] = [];
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.correction) {
      if (result.quran) result.quran[0].text = result.quran[0].text.replace(/\.$/, "") + " with an unestablished first scope.";
      if (result.hadith) result.hadith[0].text = result.hadith[0].text.replace(/\.$/, "") + " with an unestablished later scope.";
    } else corrections.push(input.sections_to_write);
    return result;
  };
  deps.verifier.generateJson = async req => rejectMarked(req.prompt);
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer");
  expect(corrections).toEqual([["quran", "hadith"]]);
});
it("collects later semantic findings before spending a correction on a sibling format error", async () => {
  const local = structuredClone(pack), deps = dependencies(), writer = deps.writer.generateJson;
  if (local.passages[1].source.kind !== "hadith") throw Error("fixture");
  local.passages[1].source.hadith.translations.en = "A patient person can face difficult circumstances with steady care.";
  const corrections: string[][] = [];
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.correction) {
      if (result.hadith) result.hadith[0].text = "The Prophet taught that a patient person can face difficult circumstances.";
      if (result.scholar) result.scholar[0].text = result.scholar[0].text.replace(/\.$/, "") + " with an unestablished later scope.";
    } else corrections.push(input.sections_to_write);
    return result;
  };
  deps.verifier.generateJson = async req => rejectMarked(req.prompt);
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("rich_answer");
  expect(corrections).toEqual([["hadith", "scholar"]]);
});

it("does not treat a failed preflight as approval or earn another writer correction", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let combined = 0, repairs = 0, writes = 0;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any; writes++;
    if (!input.correction) {
      if (result.quran) result.quran[0].text = result.quran[0].text.replace(/\.$/, "") + " with an unestablished first scope.";
      if (result.hadith) result.hadith[0].text = result.hadith[0].text.replace(/\.$/, "") + " with an unestablished later scope.";
    } else repairs++;
    return result;
  };
  deps.verifier.generateJson = async req => {
    if (JSON.parse(req.prompt).review_stage === "source_explanations" && ++combined === 1) throw Error("definitive preflight failure");
    return rejectMarked(req.prompt);
  };
  const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  expect(result.status).toBe("incomplete"); expect(repairs).toBe(1); expect(writes).toBe(4); expect(combined).toBe(2);
});
it("still withholds a new unsupported claim introduced by the correction", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson; let repairs = 0;
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.correction && result.quran) result.quran[0].text = result.quran[0].text.replace(/\.$/, "") + " with an unestablished first scope.";
    if (input.correction) {
      repairs++;
      // A newly introduced unsupported source assertion must also fail.
      result.quran[0].text = result.quran[0].text.replace(/\.$/, "") + " with an unestablished new scope.";
    }
    return result;
  };
  deps.verifier.generateJson = async req => rejectMarked(req.prompt);
  expect((await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).status).toBe("incomplete");
  expect(repairs).toBe(1);
});

it("does not publish a corrected first draft before combined checking, and separately checks the later synthesis", async () => {
  const deps = dependencies(), writer = deps.writer.generateJson;
  const audits: boolean[] = [], shown: string[] = [];
  let finalWaiting = false, release!: () => void;
  const gate = new Promise<void>(resolve => release = resolve);
  deps.rich = { onSection: section => { if (section.outcome === "ready") shown.push(section.group); } };
  deps.writer.generateJson = async req => {
    const input = JSON.parse(req.prompt), result = structuredClone(await writer(req)) as any;
    if (!input.correction && result.quran) result.quran[0].text = result.quran[0].text.replace(/\.$/, "") + " with an unestablished first scope.";
    return result;
  };
  deps.verifier.generateJson = async req => {
    const full = JSON.parse(req.prompt).full_answer; audits.push(full);
    if (audits.length === 3) { finalWaiting = true; await gate; }
    return rejectMarked(req.prompt);
  };
  const job = runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
  await vi.waitFor(() => expect(finalWaiting).toBe(true));
  expect(shown).toEqual([]); // Neither the rejected nor corrected draft is approved yet.
  release();
  expect((await job).status).toBe("rich_answer");
  expect(audits).toEqual([false, false, false, true]);
  expect(shown).toEqual(["quran", "hadith", "scholar", "summary"]);
});
