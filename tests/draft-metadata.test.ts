import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { removeDuplicateDraftMetadata } from "@/lib/ask/draft-metadata";
import { parseRichClaims, runRichAnswer } from "@/lib/ask/rich-engine";
import { pack, drafts, dependencies, audit } from "./fixtures/rich";

describe("duplicate structured metadata inside draft text", () => {
  it.each(["A checked explanation.", "Eine geprüfte Erklärung.", "شرح تم التحقق منه."])("removes only matching machine metadata: %s", text => {
    const row = { text: `${text} [source-a, source-b] R2`, source_ids: ["source-b", "source-a"], requirement_id: "R2" };
    expect(removeDuplicateDraftMetadata([row])).toEqual([{ ...row, text }]);
    expect(row.text).toContain("[source-a"); // No mutation.
  });
  it.each(["A statement. [unknown] R1", "A statement. [Q2:183] R9", "A [Q2:183] statement. R1", "A statement. [Q2:183, Q2:183] R1"])("preserves mismatched or embedded material for ordinary rejection: %s", text => {
    const row = { ...drafts.quran[0], text };
    expect(removeDuplicateDraftMetadata([row])).toEqual([row]);
  });
  it("passes cleaned wording through the existing claim parser", () => {
    const raw = drafts.quran.map(c => ({ ...c, text: `${c.text} [${c.source_ids.join(", ")}] ${c.requirement_id}` }));
    expect(parseRichClaims(raw, "quran", pack, "en")?.[0].text).toBe(drafts.quran[0].text);
  });
  it("still withholds cleaned claims that fail the independent support check", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.writer.generateJson = async req => {
      const result = await write(req) as Record<string, unknown>;
      for (const group of JSON.parse(req.prompt).sections_to_write as string[]) {
        const rows = result[group] as typeof drafts.quran;
        result[group] = rows.map(c => ({ ...c, text: `${c.text} [${c.source_ids.join(", ")}] ${c.requirement_id}` }));
      }
      return result;
    };
    deps.verifier.generateJson = async req => {
      const result = audit(req.prompt);
      result.claim_assessments[0].direct_support = "no";
      result.claim_assessments[0].reason_codes = ["unsupported_meaning"];
      return result;
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 9000)).toMatchObject({ status: "incomplete" });
  });
});
