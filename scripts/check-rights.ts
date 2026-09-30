import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  const db = createClient(url, key, { db: { schema: "editorial" } });

  const { data: rows } = await db
    .from("source_rights")
    .select("*");

  console.log("Source rights records:");
  for (const r of rows ?? []) {
    console.log(`Owner: ${r.owner_name} | Scope: ${r.scope} | Status: ${r.status} | Contact: ${r.contact_email ?? r.notes}`);
  }
}
check();
