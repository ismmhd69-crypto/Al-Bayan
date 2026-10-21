// Read-only local accounting inspection. No .env, network, provider call or ledger mutation.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SpendGuard, type Ledger } from "./ask-spend-guard";
import { sharedAskLedgerPath } from "./ask-test-profile";

export function inspectAskSpend(contents: string) {
  const ledger: Ledger = JSON.parse(contents);
  const guard = new SpendGuard(ledger);
  const uncertain = ledger.entries.filter(e => e.cost === undefined);
  return {
    mode: "read_only_no_provider_calls", ledgerSha256: createHash("sha256").update(contents).digest("hex"),
    calls: ledger.entries.length, knownCostUsd: Number(guard.actual.toFixed(8)),
    unresolvedReservedUsd: Number(uncertain.reduce((sum, e) => sum + e.reserved, 0).toFixed(8)),
    conservativeExposureUsd: Number(guard.exposure.toFixed(8)), capUsd: ledger.cap,
    blocked: !!ledger.stopped || uncertain.length > 0,
    unresolved: uncertain.map(e => ({ model: e.model, startedAt: e.at, reservedUsd: e.reserved,
      hasRecordedGenerationId: typeof e.generationId === "string" && /^gen-[A-Za-z0-9_-]{1,196}$/.test(e.generationId),
      hasRecordedRequestFingerprint: typeof e.requestFingerprint === "string" && /^[a-f0-9]{64}$/.test(e.requestFingerprint),
      httpStatus: e.httpStatus ?? null,
      requiredEvidence: e.generationId ? "matching provider generation cost receipt" : "provider activity record identifying this exact attempt and its final charge; timestamp alone is insufficient",
    })),
    mayStartPaidEvaluation: !ledger.stopped && uncertain.length === 0 && guard.exposure < ledger.cap,
  };
}
export function main() {
  const path = sharedAskLedgerPath();
  console.log(JSON.stringify(inspectAskSpend(readFileSync(path, "utf8")), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  try { main(); } catch { console.error("spending_inspection_failed_no_calls_allowed"); process.exitCode = 1; }
