import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
async function main() {
  const { data, error } = await db.from("source_translations").select("source_id,lang,text").eq("translator", "claude").eq("lang", "en").range(0, 2000);
  if (error) throw error;
  const pick = data!.filter((r) => r.text.length < 900).sort(() => Math.random() - 0.5).slice(0, 10);
  for (const p of pick) {
    const { data: s } = await db.from("sources").select("url,text_original").eq("id", p.source_id).single();
    const { data: de } = await db.from("source_translations").select("text").eq("source_id", p.source_id).eq("lang", "de").eq("translator", "claude").single();
    console.log("##", s!.url.split(":")[2], "\nAR:", s!.text_original.replace(/[ً-ْٰ]/g, ""), "\nEN:", p.text, "\nDE:", de?.text);
  }
}
main();
