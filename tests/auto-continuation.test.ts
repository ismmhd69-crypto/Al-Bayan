import { describe, expect, it } from "vitest";
import { automaticContinuation, isConnectionInterruption, isRecoverableInterruption } from "@/lib/ask/auto-continuation";

describe("automatic continuation",()=>{
  const ready={token:"a".repeat(64),remaining:1,expires:Date.now()+60_000,available:true};
  it("only continues the same session after an explicit available status",()=>{
    expect(automaticContinuation(ready,ready.token)).toEqual(ready);
    expect(automaticContinuation({...ready,token:"b".repeat(64)},ready.token)).toBeNull();
    for(const reason of ["busy","billing_uncertain","cancelled","expired","limit"]) expect(automaticContinuation({...ready,available:false,reason},ready.token)).toBeNull();
    expect(automaticContinuation({...ready,remaining:0},ready.token)).toBeNull();
    expect(automaticContinuation({...ready,expires:Date.now()-1},ready.token)).toBeNull();
    expect(automaticContinuation(null,ready.token)).toBeNull();
  });
  it("never treats an invalid stream or stopped request as a retryable network error",()=>{
    expect(isConnectionInterruption(new Error("interrupted_stream"))).toBe(true);
    expect(isConnectionInterruption(new TypeError("Failed to fetch"))).toBe(true);
    expect(isConnectionInterruption(new Error("invalid_stable_stream_identity"))).toBe(false);
    expect(isConnectionInterruption(new Error("answer_stopped"))).toBe(false);
    expect(isRecoverableInterruption("transport_failure")).toBe(true);
    expect(isRecoverableInterruption("connection_interrupted")).toBe(true);
    for(const reason of ["cancelled","billing_uncertain","spending_limit","source_support","missing_qualification"]) expect(isRecoverableInterruption(reason)).toBe(false);
  });
});
