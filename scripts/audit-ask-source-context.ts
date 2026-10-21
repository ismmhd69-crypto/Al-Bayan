// Read-only current-state audit of the existing bounded pilot. No provider keys,
// embeddings, model calls, imports, approvals or database writes.
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { PrivateSearchIndexStore } from "../lib/ask/search-engine/index-store";
import { revalidateBayanIndexSources } from "./bayan-source-index-reader";
import { assessHadithContext } from "../lib/sources/hadith-rules";
import { textHash } from "../lib/ask/search-engine/contract";

export async function main() {
  const token=process.env.SUPABASE_ACCESS_TOKEN ?? "";
  if(!token) throw new Error("management_read_token_missing");
  const signal=AbortSignal.timeout(30000);
  const index=await new PrivateSearchIndexStore(resolve("work/private-ask-evaluation/source-index-pilot")).load(ids=>revalidateBayanIndexSources(token,ids,signal));
  const parents=new Map(index.passages.filter(p=>p.family==="hadith").map(p=>[p.sourceId,p]));
  const rows=[...parents.values()].map(p=> {
    const original=p.context.before+p.original+p.context.after;
    if(textHash(original)!==p.parentOriginalHash) throw new Error("context_audit_parent_mismatch");
    const assessed=assessHadithContext(original);
    return {sourceId:p.sourceId,reference:p.reference,url:p.canonicalUrl,parentHash:p.parentOriginalHash,
      savedCompleteFlag:p.context.complete,needsAntecedent:assessed.needsAntecedent,reason:assessed.reason,
      staleCompleteFlag:p.context.complete&&assessed.needsAntecedent};
  });
  const report={at:new Date().toISOString(),generation:index.generation,mode:"current_rights_revalidated_structural_context_audit",
    hadithParents:rows.length,needsAntecedent:rows.filter(r=>r.needsAntecedent).length,staleCompleteFlags:rows.filter(r=>r.staleCompleteFlag).length,
    rows,paidCalls:0,remoteWrites:0,sourceReview:"Structural screening only. No independent authenticity, source-faithfulness or native-language acceptance.",
    caveat:"No detected reference does not prove complete context. No missing antecedent was guessed or merged. The old generation was not rewritten."};
  await writeFile(resolve("work/private-ask-evaluation/source-context-audit.json"),JSON.stringify(report,null,2),{mode:0o600});
  console.info(JSON.stringify({...report,rows:undefined},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(error=>{
  console.error(error instanceof Error&&/^[a-z0-9_]+$/.test(error.message)?error.message:"source_context_audit_failed"); process.exitCode=1;
});
