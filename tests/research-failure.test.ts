import { expect, it } from "vitest";
import { researchFailure } from "@/lib/ask/research-failure";
import { researchFailureText } from "@/lib/ask/research-failure-text";
import { safeDetails } from "@/lib/ask/diagnostics";
it("distinguishes disconnects, Stop, a known allowance refusal and uncertain receipts", () => {
  expect(researchFailure({ name: "ResponseAborted" })).toBe("connection_interrupted");
  expect(researchFailure(Error("interrupted_stream"))).toBe("connection_interrupted");
  expect(researchFailure(Error("anything"), true)).toBe("cancelled");
  expect(researchFailure({ name: "ResearchSessionStop", code: "limit" })).toBe("spending_limit");
  expect(researchFailure({ name: "ResearchSessionStop", code: "billing_uncertain" })).toBe("billing_uncertain");
  expect(researchFailure(Error("private failure"))).toBe("transport_failure");
});
it("reports fixed localized reasons while keeping visitor content out of diagnostics", () => {
  expect(researchFailureText("en", "connection_interrupted")).toContain("connection");
  expect(researchFailureText("ar", "wording_rejected")).toContain("صياغة");
  expect(safeDetails({ group: "hadith", round: 2, failure_kind: "wording_rejected", question: "private", text: "private" }))
    .toEqual({ group: "hadith", round: 2, failure_kind: "wording_rejected" });
});
