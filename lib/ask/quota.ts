import "server-only";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { quotaSecret } from "./owner-secret";

// Fair-use question limits (Mo, 2026-11-12): 25 a day and 100 a week per person, counted by account when
// signed in and by browser otherwise, plus about 75 a day per network for signed-out visitors. Counts live in
// the database (supabase/migrations/20261112120000_ask_quota.sql), so every server instance shares them.
// Only keyed hashes are sent there: never a raw cookie, address or account id.

const positiveInt = (value: string | undefined, fallback: number) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : fallback; };
export const quotaLimits = () => ({
  daily: positiveInt(process.env.ASK_USER_DAILY_LIMIT, 25),
  weekly: positiveInt(process.env.ASK_USER_WEEKLY_LIMIT, 100),
  network: positiveInt(process.env.ASK_NETWORK_DAILY_LIMIT, 75),
});

export type QuotaScope = "account" | "browser" | "network";
export type QuotaKey = { key: string; scope: QuotaScope; daily: number; weekly: number };
export type QuotaRefusal = { status: "quota_daily" | "quota_weekly"; scope: QuotaScope; limit: number; retry_on: string };
export type QuotaResult = { status: "ok" } | QuotaRefusal | { status: "quota_unavailable" };
export type QuotaDeps = { take: (keys: QuotaKey[]) => Promise<unknown>; verifyUser: (token: string) => Promise<string | null> };

const code = (secret: string, purpose: string, value: string) => createHmac("sha256", secret).update(JSON.stringify(["ask-quota-v1", purpose, value])).digest("hex");

export function quotaKeys(identity: { userId?: string | null; browserOwner?: string | null; forwardedFor: string | null }): QuotaKey[] | null {
  const secret = quotaSecret(), limits = quotaLimits();
  if (!secret) return null;
  if (identity.userId) return [{ key: code(secret, "account", identity.userId), scope: "account", daily: limits.daily, weekly: limits.weekly }];
  if (!identity.browserOwner) return null;
  const ip = identity.forwardedFor?.split(",")[0]?.trim() || "local";
  return [{ key: code(secret, "browser", identity.browserOwner), scope: "browser", daily: limits.daily, weekly: limits.weekly },
    // The network cap has no separate weekly limit: seven full days is its natural ceiling.
    { key: code(secret, "network", ip), scope: "network", daily: limits.network, weekly: limits.network * 7 }];
}

const RETRY_ON = /^\d{4}-\d{2}-\d{2}$/;
/** Counts one new question. Anything unexpected refuses: a quota that cannot be checked is not a free pass. */
export async function admitQuestion(input: { authorization: string | null; browserOwner: string | null; forwardedFor: string | null }, deps: QuotaDeps = serverQuotaDeps()): Promise<QuotaResult> {
  try {
    const bearer = input.authorization?.match(/^Bearer\s+([A-Za-z0-9._-]{20,4096})$/)?.[1];
    // A token that fails to verify is treated as signed out, never as a refusal.
    const userId = bearer ? await deps.verifyUser(bearer).catch(() => null) : null;
    const keys = quotaKeys({ userId, browserOwner: input.browserOwner, forwardedFor: input.forwardedFor });
    if (!keys) return { status: "quota_unavailable" };
    const result = await Promise.race([deps.take(keys), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("quota_timeout")), 4000))]) as Record<string, unknown> | null;
    if (result?.status === "ok") return { status: "ok" };
    if ((result?.status === "daily" || result?.status === "weekly") && ["account", "browser", "network"].includes(String(result.scope))
      && Number.isInteger(result.limit) && typeof result.retry_on === "string" && RETRY_ON.test(result.retry_on))
      return { status: result.status === "daily" ? "quota_daily" : "quota_weekly", scope: result.scope as QuotaScope, limit: result.limit as number, retry_on: result.retry_on };
    return { status: "quota_unavailable" };
  } catch { return { status: "quota_unavailable" }; }
}

function serverQuotaDeps(): QuotaDeps {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, secret = process.env.SUPABASE_SECRET_KEY, publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    take: async keys => {
      if (!url || !secret) throw new Error("quota_store_not_configured");
      const { data, error } = await createClient(url, secret, options).rpc("take_ask_quota", { keys });
      if (error) throw error;
      return data;
    },
    verifyUser: async token => {
      if (!url || !publishable) return null;
      const { data, error } = await createClient(url, publishable, options).auth.getUser(token);
      return !error && data.user ? data.user.id : null;
    },
  };
}
