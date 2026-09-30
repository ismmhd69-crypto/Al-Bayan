"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The visitor's own Supabase session (optional sign-in). Uses only the public key: what a signed-in
// person can read or write is limited by row-level security in the database, never by this code.
// The session stays in this browser; there is no server-side session.
let client: SupabaseClient | null = null;

export function browserSupabase(): SupabaseClient {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
  );
  return client;
}
