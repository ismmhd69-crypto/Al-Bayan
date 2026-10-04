import { createClient } from "@supabase/supabase-js";
import { hadithSearchQueries } from "../lib/sources/hadith-rules";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
async function kinds(q: string) {
  const { data, error } = await db.rpc("search_approved_source_candidates", { query_text: q, answer_language: "ar", question_type: "general", required_facets: [], match_count: 50 });
  if (error) return error.message;
  const ids = [...new Set((data as { source_id: string }[]).map((d) => d.source_id))];
  const { data: rows } = await db.from("sources").select("id, kind").in("id", ids);
  const c: Record<string, number> = {};
  for (const r of rows ?? []) c[r.kind] = (c[r.kind] ?? 0) + 1;
  return `${ids.length} hits ${JSON.stringify(c)}`;
}
async function main() {
  for (const ph of [["فضل صوم رمضان", "الصيام وثوابه"], ["فضل الصدق", "تحريم الكذب"], ["علاج الغضب", "كظم الغيظ"], ["حكم الطلاق", "الطلاق في الحيض"]]) {
    console.log(ph.join(" | "));
    for (const q of hadithSearchQueries(ph)) console.log("   ", q, "->", await kinds(q));
  }
}
main();
