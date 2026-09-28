import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function run() {
  for (const s of ["ibn-baz", "ibn-uthaymeen", "al-albani"]) {
    const { count } = await db.from("sources").select("*", { count: "exact", head: true }).eq("scholar_id", s);
    console.log(`${s}: ${count}`);
  }
}
run();
