import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { visitorKey } from "@/lib/ask/limits";

// Deletes the signed-in person's account and, through the database cascade, everything saved under it.
// The person proves who they are with their own session token; only then is the secret key used, and
// only to delete that same person.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const noStore = { "Cache-Control": "no-store" };

export type DeleteDeps = {
  userIdFor: (token: string) => Promise<string | null>;
  deleteUser: (id: string) => Promise<boolean>;
};

const reply = (status: string, code = 200) => NextResponse.json({ status }, { status: code, headers: noStore });

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

const seen = new Map<string, number[]>();
export function deleteAllowed(key: string, now = Date.now()): boolean {
  const times = (seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_REQUESTS) return false;
  times.push(now);
  seen.set(key, times);
  return true;
}

export async function handleDelete(request: Request, deps: DeleteDeps): Promise<Response> {
  if (!sameOrigin(request)) return reply("forbidden", 403);
  const token = request.headers.get("authorization")?.match(/^Bearer (\S{20,4000})$/)?.[1];
  if (!token) return reply("unauthorized", 401);
  if (!deleteAllowed(visitorKey(request.headers.get("x-forwarded-for")))) return reply("rate_limited", 429);
  const id = await deps.userIdFor(token);
  if (!id) return reply("unauthorized", 401);
  return (await deps.deleteUser(id)) ? reply("deleted") : reply("error", 502);
}

function serverDeps(): DeleteDeps {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publicKey || !secretKey) throw new Error("Supabase is not configured");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const asVisitor = createClient(url, publicKey, options);
  const asAdmin = createClient(url, secretKey, options);
  return {
    async userIdFor(token) {
      const { data, error } = await asVisitor.auth.getUser(token);
      return error || !data.user ? null : data.user.id;
    },
    async deleteUser(id) {
      const { error } = await asAdmin.auth.admin.deleteUser(id);
      return !error;
    },
  };
}

export async function POST(request: Request) {
  try { return await handleDelete(request, serverDeps()); } catch { return reply("error", 502); }
}
