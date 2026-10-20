import { describe, expect, it } from "vitest";
import { parseCurrentIndexStates } from "@/lib/ask/search-engine/source-state";
import { textHash } from "@/lib/ask/search-engine/contract";

const source = "00000000-0000-0000-0000-000000000001", hash = textHash("fixture");
const row = { source_id: source, rights_id: "rights", expires_at: null, parent_hash: hash, source_fingerprint: hash };
describe("server metadata-state receipt", () => {
  it("retains exact fingerprints without inventing an embedding permission", () => {
    expect(parseCurrentIndexStates([row], [source]).get(source)).toMatchObject({ parentOriginalHash: hash, sourceFingerprint: hash, permissions: { embeddings: false } });
  });
  it("accepts an empty response as withdrawn/unavailable rather than keeping an old source", () => {
    expect(parseCurrentIndexStates([], [source]).size).toBe(0);
  });
  it.each(["unknown_source", "duplicate", "missing_fingerprint"])("rejects %s metadata", kind => {
    const rows = kind === "unknown_source" ? [{ ...row, source_id: "another" }] : kind === "duplicate" ? [row, row] : [{ ...row, source_fingerprint: "bad" }];
    expect(() => parseCurrentIndexStates(rows, [source])).toThrow("invalid_index_source_states");
  });
});
