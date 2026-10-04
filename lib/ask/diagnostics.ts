export type DiagnosticStage = "selection" | "selection_retry" | "screening" | "screening_retry";
export type DiagnosticContext = {
  requestId: string;
  revision?: string;
  writerChain: string;
  verifierChain: string;
  claimAudit: boolean;
  tiered: boolean;
  lean: boolean;
};

// Fixed fields only. Neither raw AI output nor visitor content belongs in function logs.
export function diagnosticLogger(enabled: boolean, context: DiagnosticContext, sink: (line: string) => void) {
  const model = (value: string) => /^[a-zA-Z0-9._:/|+-]{1,320}$/.test(value) ? value : "unknown";
  const safe = {
    request_id: /^[a-zA-Z0-9-]{1,64}$/.test(context.requestId) ? context.requestId : "unknown",
    revision: /^[a-fA-F0-9]{7,64}$/.test(context.revision ?? "") ? context.revision : "unknown",
    writer_chain: model(context.writerChain), verifier_chain: model(context.verifierChain),
    claim_audit: context.claimAudit, tiered: context.tiered, lean: context.lean,
  };
  return (stage: DiagnosticStage, code: string, elapsedMs: number) => {
    if (!enabled || !["selection", "selection_retry", "screening", "screening_retry"].includes(stage)
      || !/^[a-z][a-z0-9_]{1,80}$/.test(code) || !Number.isFinite(elapsedMs) || elapsedMs < 0) return;
    sink(`ask diagnostic: ${JSON.stringify({ ...safe, stage, code, elapsed_ms: Math.round(elapsedMs) })}`);
  };
}
