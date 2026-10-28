import { readFileSync } from "node:fs";
import { privateFile, privateTrace } from "./helpers/private-fixtures";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { prepareSemanticRegressions } from "../scripts/prepare-ask-semantic-regressions";

const inputs = [privateFile("work/private-ask-evaluation/parents-attribution-full-retest-20261024.json", "parents retest record"),
  privateFile("work/private-ask-evaluation/source-scope-matched-20261024.json", "source scope record"),
  privateFile("work/local-ask-traces/d9e9b89d-1e12-44d2-bb08-2749ea930946.jsonl", "trace d9e9b89d-1e12-44d2-bb08-2749ea930946")];
if (inputs[0].available) inputs.push(privateFile(`work/local-ask-traces/${JSON.parse(readFileSync(inputs[0].path, "utf8")).requestId}.jsonl`, "parents retest trace"));
const available = inputs.every(i => i.available), missing = inputs.map(i => i.note).join("");
it.skipIf(!available)(`keeps fixed source-support labels outside every one-claim request and supplies only its own originals${missing}`, () => {
  const c = prepareSemanticRegressions();
  expect(c.cases).toHaveLength(12);
  expect(c.cases.filter(r => r.expected === "supported")).toHaveLength(6);
  expect(c.cases.filter(r => r.expected === "not_fully_supported")).toHaveLength(6);
  expect(c.unchanged()).toBe(true);
  for (const row of c.cases) {
    const p = JSON.parse(row.request.prompt);
    expect(p.claims).toHaveLength(1);
    expect(p.claims[0].text).toBe(row.item.text);
    expect(p.claims[0].originals.map((o: any) => o.source_id)).toEqual(row.item.refs);
    expect(Object.keys(p).sort()).toEqual(["claims", "stage"]);
    expect(p).not.toHaveProperty("expected"); expect(p).not.toHaveProperty("provenance");
    expect(row.request.maxOutputTokens).toBe(2100);
  }
});
it.skipIf(!available)(`records repeated same-model approvals of one exact error without calling them independent examples${missing}`, () => {
  const c = prepareSemanticRegressions();
  expect(c.approvals).toHaveLength(8);
  expect(new Set(c.approvals.map(a => a.actualModel)).size).toBe(1);
  expect(c.approvals.filter(a => a.task === "primary_review")).toHaveLength(4);
  expect(c.approvals.filter(a => a.task === "narrow_meaning")).toHaveLength(4);
  expect(c.unscoredApplication.excludedFromScoredComparison).toBe(true);
  expect(c.unscoredApplication.status).toBe("qualified_source_context_review_required");
  expect(c.cases.find(r => r.id === "S12")?.item.text).toContain("الوالدين اللذين يأمران بالمعصية");
});
