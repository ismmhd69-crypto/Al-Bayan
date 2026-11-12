import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { QuotaDeps, QuotaKey } from "@/lib/ask/quota";

// The setup file stands in for admitQuestion in route tests; here the real module is tested.
const { admitQuestion, quotaKeys } = await vi.importActual<typeof import("@/lib/ask/quota")>("@/lib/ask/quota");

beforeEach(() => { vi.stubEnv("ASK_QUOTA_SECRET", "synthetic-quota-secret"); });
afterEach(() => { vi.unstubAllEnvs(); });
const token = "a".repeat(40);
const deps = (take: (keys: QuotaKey[]) => unknown, userId: string | null = null): QuotaDeps & { seen: QuotaKey[][] } => {
  const seen: QuotaKey[][] = [];
  return { seen, take: async keys => { seen.push(keys); return take(keys); }, verifyUser: async t => t === token ? userId : null };
};

it("counts a signed-in visitor by account only, at 25 a day and 100 a week", async () => {
  const d = deps(() => ({ status: "ok" }), "user-1");
  expect(await admitQuestion({ authorization: `Bearer ${token}`, browserOwner: "owner-1", forwardedFor: "1.2.3.4" }, d)).toEqual({ status: "ok" });
  expect(d.seen[0]).toEqual([expect.objectContaining({ scope: "account", daily: 25, weekly: 100 })]);
});

it("counts a signed-out visitor by browser and by network, with the network capped at 75 a day", async () => {
  const d = deps(() => ({ status: "ok" }));
  await admitQuestion({ authorization: null, browserOwner: "owner-1", forwardedFor: "1.2.3.4, 10.0.0.1" }, d);
  expect(d.seen[0].map(k => [k.scope, k.daily, k.weekly])).toEqual([["browser", 25, 100], ["network", 75, 525]]);
  // An unverifiable token is treated as signed out, never as a refusal.
  const bad = deps(() => ({ status: "ok" }));
  expect((await admitQuestion({ authorization: `Bearer ${"b".repeat(40)}`, browserOwner: "owner-1", forwardedFor: null }, bad)).status).toBe("ok");
  expect(bad.seen[0].map(k => k.scope)).toEqual(["browser", "network"]);
});

it("sends only unreadable codes: no raw address, cookie or account id", async () => {
  const keys = quotaKeys({ browserOwner: "owner-secret-value", forwardedFor: "203.0.113.9" })!;
  for (const k of keys) { expect(k.key).toMatch(/^[a-f0-9]{64}$/); expect(JSON.stringify(k)).not.toMatch(/owner-secret-value|203\.0\.113\.9/); }
  // The same browser always maps to the same code; a different secret gives a different code.
  expect(quotaKeys({ browserOwner: "owner-secret-value", forwardedFor: "203.0.113.9" })![0].key).toBe(keys[0].key);
  vi.stubEnv("ASK_QUOTA_SECRET", "another-secret");
  expect(quotaKeys({ browserOwner: "owner-secret-value", forwardedFor: "203.0.113.9" })![0].key).not.toBe(keys[0].key);
});

it("passes on the limit that applied and the day it resets", async () => {
  expect(await admitQuestion({ authorization: null, browserOwner: "o", forwardedFor: null }, deps(() => ({ status: "daily", scope: "browser", limit: 25, retry_on: "2026-11-13" }))))
    .toEqual({ status: "quota_daily", scope: "browser", limit: 25, retry_on: "2026-11-13" });
  expect(await admitQuestion({ authorization: null, browserOwner: "o", forwardedFor: null }, deps(() => ({ status: "weekly", scope: "browser", limit: 100, retry_on: "2026-11-15" }))))
    .toEqual({ status: "quota_weekly", scope: "browser", limit: 100, retry_on: "2026-11-15" });
  expect((await admitQuestion({ authorization: null, browserOwner: "o", forwardedFor: null }, deps(() => ({ status: "daily", scope: "network", limit: 75, retry_on: "2026-11-13" })))).status).toBe("quota_daily");
});

it("refuses new paid work whenever the limits cannot be checked", async () => {
  const input = { authorization: null, browserOwner: "o", forwardedFor: null };
  expect((await admitQuestion(input, deps(() => { throw new Error("database down"); }))).status).toBe("quota_unavailable");
  expect((await admitQuestion(input, deps(() => null))).status).toBe("quota_unavailable");
  expect((await admitQuestion(input, deps(() => ({ status: "daily", scope: "browser", limit: 25, retry_on: "tomorrow" })))).status).toBe("quota_unavailable");
  expect((await admitQuestion({ ...input, browserOwner: null }, deps(() => ({ status: "ok" })))).status).toBe("quota_unavailable");
  vi.stubEnv("ASK_QUOTA_SECRET", ""); vi.stubEnv("ASK_FOLLOW_UP_SECRET", "");
  expect((await admitQuestion(input, deps(() => ({ status: "ok" })))).status).toBe("quota_unavailable");
});
