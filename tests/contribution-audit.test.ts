import { describe, expect, it } from "vitest";
import { contributionAudit } from "@/lib/ask/contribution-audit";

const findings = () => [
  { claim_id: "C1", contribution: "Explains the governing principle", kind: "explanation", adds_value: "yes", duplicates: [] as string[] },
  { claim_id: "C2", contribution: "Connects that principle to the requested concern", kind: "synthesis", adds_value: "yes", duplicates: [] as string[] },
];
describe("structured contribution findings", () => {
  it("accepts a short useful explanation and direct synthesis without demanding new religious claims", () => {
    expect(contributionAudit(findings(), ["C1", "C2"], ["C2"])).toEqual([]);
  });
  it("rejects missing or repeated findings", () => {
    expect(contributionAudit(undefined, ["C1"], [])).toContain("contribution_map_invalid");
    expect(contributionAudit([findings()[0], findings()[0]], ["C1", "C2"], ["C2"])).toContain("contribution_map_invalid");
  });
  it("rejects semantic repetition despite a broad yes verdict elsewhere", () => {
    const rows = findings(); rows[1].kind = "restatement"; rows[1].duplicates = ["C1"];
    expect(contributionAudit(rows, ["C1", "C2"], ["C2"])).toContain("semantic_repetition");
  });
  it("does not treat paraphrase alone as summary synthesis", () => {
    const rows = findings(); rows[1].kind = "explanation";
    expect(contributionAudit(rows, ["C1", "C2"], ["C2"])).toContain("summary_not_synthesis");
  });
  it("rejects uncertain value, fabricated duplicate references and empty justifications", () => {
    const rows = findings(); rows[0].adds_value = "unsure";
    expect(contributionAudit(rows, ["C1", "C2"], ["C2"])).toContain("contribution_not_useful");
    rows[0].duplicates = ["C9"];
    expect(contributionAudit(rows, ["C1", "C2"], ["C2"])).toContain("contribution_map_invalid");
    rows[0].duplicates = []; rows[0].contribution = " ";
    expect(contributionAudit(rows, ["C1", "C2"], ["C2"])).toContain("contribution_map_invalid");
  });
});
