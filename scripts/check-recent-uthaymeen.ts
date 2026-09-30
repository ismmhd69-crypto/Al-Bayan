import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");

async function check() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: rows } = await db.from("sources").select("id, scholar_id, title, created_at").eq("scholar_id", "ibn-uthaymeen").order("created_at", { ascending: false }).limit(5);
  console.log("Recent Ibn Uthaymeen sources:");
  for (const r of rows ?? []) {
    console.log(r.id, "|", r.created_at, "|", r.title);
  }
}
check();
