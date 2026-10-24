import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { checkpointWriter, draftRequestKey, restoreRichCheckpoint, sameApprovedScholar, type SettledDraft } from "../scripts/ask-settled-rich-checkpoint";
import type { AIProvider, JsonRequest } from "@/lib/ai/types";

const request = (): JsonRequest => ({ system: "Test writer contract", prompt: JSON.stringify({ sections_to_write: ["quran"], evidence_package: { original: "Unchanged invented source." } }),
  structuredOutput: true, thinking: "low", maxOutputTokens: 2200,
  schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } });
const saved = (): SettledDraft => ({ model: "fake/writer", request: request(), value: { text: "An unapproved saved draft." }, generationId: "gen-settled", paidFingerprint: "receipt-bound-test" });
const provider = (): AIProvider => ({ id: "fake/writer", generateJson: vi.fn(async () => ({ text: "One new correction." })) });
it("reuses an exact settled output without a provider call and without mutating the saved value", async () => {
  const real = provider(), record = saved(), used = vi.fn(), replay = checkpointWriter(real, [record], false, used);
  const result = await replay.generateJson({ ...request(), signal: new AbortController().signal });
  expect(result).toEqual(record.value); expect(result).not.toBe(record.value);
  expect(real.generateJson).not.toHaveBeenCalled(); expect(used).toHaveBeenCalledExactlyOnceWith(record);
  await expect(replay.generateJson(request())).rejects.toThrow("already_consumed");
});
it.each(["source", "schema", "output allowance", "mode"])("does not spend on changed input: %s", async change => {
  const real = provider(), req = request();
  if (change === "source") req.prompt = JSON.stringify({ sections_to_write: ["quran"], evidence_package: { original: "Changed source." } });
  if (change === "schema") req.schema = { type: "object", properties: { replacement: { type: "string" } }, required: ["replacement"] };
  if (change === "output allowance") req.maxOutputTokens = 2300;
  if (change === "mode") req.structuredOutput = false;
  await expect(checkpointWriter(real, [saved()], false, () => {}).generateJson(req)).rejects.toThrow("not_authorized");
  expect(real.generateJson).not.toHaveBeenCalled();
});
it("allows only the separately eligible single correction, never another initial write", async () => {
  const real = provider(), replay = checkpointWriter(real, [saved()], true, () => {});
  const correction = { ...request(), prompt: JSON.stringify({ correction: { reason_codes: ["copied_source"] } }) };
  await expect(replay.generateJson(correction)).resolves.toEqual({ text: "One new correction." });
  await expect(replay.generateJson(correction)).rejects.toThrow("not_authorized");
  expect(real.generateJson).toHaveBeenCalledTimes(1);
});
it("rejects malformed complete saved outputs and model or identity ambiguity", () => {
  const real = provider(), bad = saved(); bad.value = { text: "A valid-looking child", extra: "invalid envelope" };
  expect(() => checkpointWriter(real, [bad], false, () => {})).toThrow("invalid");
  expect(() => checkpointWriter({ ...real, id: "other/model" }, [saved()], false, () => {})).toThrow("invalid");
  expect(() => checkpointWriter(real, [saved(), saved()], false, () => {})).toThrow("ambiguous");
});
it("refuses an uncertain previous charge before attempting restoration", () => {
  expect(() => restoreRichCheckpoint([], [{ fingerprint: "unknown", reserved: .1, model: "fake", at: "test" }], "Question")).toThrow("uncertain");
});
it("ignores object ordering but preserves original wording in request identities", () => {
  const a = request(), b = { ...a, prompt: JSON.stringify({ evidence_package: { original: "Unchanged invented source." }, sections_to_write: ["quran"] }) };
  expect(draftRequestKey("fake/writer", a)).toBe(draftRequestKey("fake/writer", b));
  b.prompt = b.prompt.replace("Unchanged", "Changed");
  expect(draftRequestKey("fake/writer", a)).not.toBe(draftRequestKey("fake/writer", b));
});

it("requires the same approved scholar identity and complete original metadata", () => {
  const q = { id: "S919939af-988a-4f22-bf27-4e3f0939f028", scholarId: "ibn-baz", scholarName: { ar: "ابن باز", en: "Ibn Baz", de: "Ibn Baz" }, title: "عنوان اختباري", reference: "test", arabic: "نص أصلي اختباري كامل لا يمثل فتوى", url: "https://binbaz.org.sa/fatwas/9/test" };
  expect(sameApprovedScholar(q, [structuredClone(q)])).toBe("valid");
  expect(sameApprovedScholar(q, [])).toBe("unavailable");
  expect(sameApprovedScholar(q, [{ ...q, arabic: q.arabic + " تغيير" }])).toBe("changed");
  expect(sameApprovedScholar(q, [{ ...q, reference: "changed" }])).toBe("changed");
  expect(sameApprovedScholar(q, [{ ...q, id: "S11111111-1111-1111-1111-111111111111" }])).toBe("unavailable");
});
