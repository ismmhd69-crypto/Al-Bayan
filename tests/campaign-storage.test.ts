import { expect, it, vi } from "vitest";
import { ArabicCampaignGuard, replaceCampaignFile, type CampaignLedger, CURRENT_MODELS } from "../scripts/ask-arabic-campaign-guard";

it("retries only the same atomic replacement for bounded transient Windows contention", () => {
  const wait = vi.fn(), rename = vi.fn().mockImplementationOnce(() => { throw Object.assign(Error("locked"), { code: "EPERM" }); }).mockReturnValue(undefined);
  replaceCampaignFile("same-fsynced-file", "original-ledger", rename, wait);
  expect(rename.mock.calls).toEqual([["same-fsynced-file", "original-ledger"], ["same-fsynced-file", "original-ledger"]]);
  expect(wait).toHaveBeenCalledExactlyOnceWith(20);
});
it.each(["EPERM", "ENOSPC"])("refuses permanent storage failure without deleting or replacing the ledger via another route: %s", code => {
  const wait = vi.fn(), rename = vi.fn(() => { throw Object.assign(Error("failed"), { code }); });
  expect(() => replaceCampaignFile("durable-reservation", "original-ledger", rename, wait)).toThrow("failed");
  expect(rename).toHaveBeenCalledTimes(code === "EPERM" ? 6 : 1);
  expect(wait).toHaveBeenCalledTimes(code === "EPERM" ? 5 : 0);
});
it("never sends a model request if its reservation cannot be persisted", async () => {
  const model = CURRENT_MODELS[0], network = vi.fn(), ledger: CampaignLedger = { version: 1, cap: .5, priorExposure: .113472,
    originalLedgerHash: "test", prices: { [model]: { prompt: .5, completion: 3, request: 0 } }, calls: [] };
  const guard = new ArabicCampaignGuard(ledger, () => { throw Error("storage failure"); });
  await expect(guard.dispatch(network)("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({ model,
    max_tokens: 1000, messages: [{ role: "user", content: "Invented test" }], stream: false, provider: { zdr: true, data_collection: "deny" } }) })).rejects.toThrow("storage failure");
  expect(network).not.toHaveBeenCalled(); expect(ledger.calls[0]).toMatchObject({ cost: 0, rejection: "not_dispatched_reservation_storage_failed" });
  expect(ledger.stopped).toBe("campaign_reservation_storage_failed_before_dispatch");
  await expect(guard.dispatch(network)("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: "{}" })).rejects.toThrow("storage_failed_before_dispatch");
  expect(network).not.toHaveBeenCalled();
});
