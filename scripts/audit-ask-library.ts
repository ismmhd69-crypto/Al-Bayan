// Read-only source-path audit. No models, visitor traffic or database writes.
import { existsSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import type { SearchAudit } from "../lib/sources/search-audit";

export const LIBRARY_PROBES = [
  { id: "intentions", ar: ["إنما الأعمال بالنيات", "نية العمل"], en: ["actions intentions"] },
  { id: "promises", ar: ["الوفاء بالعهد", "نقض الأيمان"], en: ["fulfil pledge sworn oaths"] },
  { id: "voluntary-charity", ar: ["فضل الصدقة للفقراء", "مقدار صدقة التطوع"], en: ["voluntary charity amount"] },
  { id: "zakat-amount", ar: ["زكاة المال ربع العشر", "شروط وجوب زكاة المال"], en: ["zakat wealth conditions rate"] },
];
async function main() {
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
  if (!out) throw new Error("audit output path required");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("library not configured");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const published: Record<string, number | null> = {};
  const translations: Record<string, { total: number | null; published: number | null; forPublishedSources: number | null }> = {};
  for (const kind of ["hadith", "fatwa"]) {
    const result = await db.from("sources").select("id", { count: "exact", head: true }).eq("published", true).eq("kind", kind);
    if (result.error) throw new Error("published count unavailable");
    published[kind] = result.count;
    for (const lang of ["en", "de"]) {
      const total = await db.from("source_translations").select("source_id,sources!inner(kind)", { count: "exact", head: true }).eq("sources.kind", kind).eq("lang", lang);
      const visible = await db.from("source_translations").select("source_id,sources!inner(kind)", { count: "exact", head: true }).eq("sources.kind", kind).eq("lang", lang).eq("published", true);
      const forPublished = await db.from("source_translations").select("source_id,sources!inner(kind,published)", { count: "exact", head: true }).eq("sources.kind", kind).eq("sources.published", true).eq("lang", lang);
      if (total.error || visible.error || forPublished.error) {
        const code = (total.error ?? visible.error ?? forPublished.error)?.code ?? "unknown";
        throw new Error(`translation_count_${/^[A-Z0-9_]{1,20}$/.test(code) ? code : "unknown"}`);
      }
      translations[`${kind}/${lang}`] = { total: total.count, published: visible.count, forPublishedSources: forPublished.count };
    }
  }
  const { searchLibraryHadith } = await import("../lib/sources/hadith-library");
  const { searchScholarQuotes } = await import("../lib/sources/scholars");
  const probes = [];
  for (const probe of LIBRARY_PROBES) {
    const captures: Record<string, SearchAudit> = {};
    const [hadith, before, after] = await Promise.all([
      searchLibraryHadith({ ar: probe.ar, en: probe.en }, { onAudit: (audit) => { captures.hadith = audit; } }),
      searchScholarQuotes(probe.ar, 6, { onAudit: (audit) => { captures.scholarBefore = audit; } }),
      searchScholarQuotes(probe.ar, 6, { allVariants: true, onAudit: (audit) => { captures.scholarAfter = audit; } }),
    ]);
    probes.push({ id: probe.id, audits: captures, hadith: hadith.map((h) => h.id), scholarBefore: before.map((q) => q.id), scholarAfter: after.map((q) => q.id) });
  }
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), kind: "read_only_retrieval_audit_no_models", published, translations,
    warning: "Eligible retrieval candidates are not proof of direct support. Wrong-kind/unavailable counts combine competing groups and later publication changes; rights-blocked rows are hidden by RPC and cannot be counted from these hits. Text and questions are omitted.", probes }, null, 2));
  console.info("read-only library audit saved; no model calls or database writes");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(error instanceof Error && /^translation_count_[A-Z0-9_]{1,20}$/.test(error.message) ? error.message : "read-only library audit failed; no secrets printed"); process.exitCode = 1;
});
