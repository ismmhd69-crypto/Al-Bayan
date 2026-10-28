import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { reviewConditionLogic } from "../scripts/review-ask-condition-logic-20261025";

it("refuses a control run before any source or model request when the shared guard is not installed", async () => {
  const send = vi.fn(() => { throw Error("No network is allowed in this test"); });
  vi.stubGlobal("fetch", send);
  try {
    await expect(reviewConditionLogic(8, () => false)).rejects.toThrow("evaluation_guard_not_installed");
    expect(send).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); }
});
