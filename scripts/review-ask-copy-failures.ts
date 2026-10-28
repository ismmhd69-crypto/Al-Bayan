// Exact editorial overlap replay. Never a semantic approval or new model call.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { sourceCopyMatch, hasQuotation, type SourceText } from "../lib/ask/checks";

const reports = [];
for (const id of ["1347add9-4c58-4c45-a7d5-89ed01ac1dca", "d5bc6e78-59c8-4128-aba7-c26e92690bb9", "b1da762b-41dd-4d79-8b88-b7728ea18681"]) {
  const rows = readFileSync(resolve("work/local-ask-traces", `${id}.jsonl`), "utf8").trim().split("\n").map(line => JSON.parse(line));
  const requests = new Map(rows.filter(r => r.event === "model_request").map(r => [r.data.call_id, r.data]));
  for (const row of rows.filter(r => r.event === "model_response")) {
    const request = requests.get(row.data.call_id), input = request?.prompt;
    if (!Array.isArray(input?.sections_to_write) || !Array.isArray(input.evidence_package?.passages)) continue;
    const sources: SourceText[] = input.evidence_package.passages.map((p: any) => {
      if (!["quran", "hadith", "scholar"].includes(p.type) || typeof p.arabic !== "string") throw Error("invalid_saved_source");
      return { id: p.id, kind: p.type, arabic: p.arabic, translations: { en: p.translation_en ?? undefined, de: p.translation_de ?? undefined } };
    });
    for (const group of input.sections_to_write) {
      const section = row.data.value?.[group];
      const claims = Array.isArray(section) ? section : section && typeof section === "object" ? Object.values(section) : [];
      for (const [index, claim] of claims.entries()) {
        if (!claim || typeof (claim as any).text !== "string") continue;
        const text = (claim as any).text;
        const overlap = sourceCopyMatch(text, sources), quotation = hasQuotation(text);
        if (overlap || quotation) reports.push({ requestId: id, callId: row.data.call_id, group, index, correction: !!input.correction, text, overlap, quotation });
      }
    }
  }
}
const root = resolve("work/private-ask-evaluation/reliability-20261026"); mkdirSync(root, { recursive: true });
writeFileSync(resolve(root, "copy-failures.json"), JSON.stringify({ modelCalls: 0, scope: "Exact overlap only; support and false-positive judgments remain separate.", reports }, null, 2), { mode: 0o600 });
console.log(JSON.stringify(reports, null, 2));
