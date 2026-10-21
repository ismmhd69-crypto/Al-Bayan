// Fixed visitor questions, not words reverse-engineered from source bodies.
// A component diagnostic only; accepted human labels are required for recall.
import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { PrivateSearchIndexStore } from "../lib/ask/search-engine/index-store";
import { revalidateBayanIndexSources } from "./bayan-source-index-reader";
import { validateBenchmark, retrievalBenchmark, type BenchmarkIntent, type RetrievalMeasurement } from "../lib/ask/search-engine/benchmark";
import { SOURCE_LOOKUP_REVISION, hybridSearch } from "../lib/ask/search-engine/hybrid";
import { discoveredCorpusCandidates } from "../lib/ask/search-engine/corpus-candidates";

/** Keep every word within the existing per-phrase request bounds. This is not
 * Arabic reformulation or a substitute for the question-understanding model. */
export function literalBenchmarkPhrases(question: string) {
  if (!question.trim() || question.length>500) throw new Error("benchmark_question_out_of_bounds");
  const parts:string[]=[];
  for(const word of question.trim().split(/\s+/u)) {
    if(word.length>120) throw new Error("benchmark_word_out_of_bounds");
    if(!parts.length || `${parts.at(-1)} ${word}`.length>120) parts.push(word);
    else parts[parts.length-1]+=` ${word}`;
  }
  if(parts.length>12) throw new Error("benchmark_query_fanout_exceeded");
  return parts;
}

export async function main() {
  const token=process.env.SUPABASE_ACCESS_TOKEN??"";
  if(!token) throw new Error("management_read_token_missing");
  const raw=await readFile(resolve("work/private-ask-evaluation/search-benchmark-draft.json"),"utf8");
  const document=JSON.parse(raw) as {version:unknown;cases:BenchmarkIntent[]};
  if(document.version!==1) throw new Error("unsupported_benchmark_version");
  validateBenchmark(document.cases);
  const args=process.argv.slice(2);
  if(args.some(a=>a!=="--include-held-out")) throw new Error("unsupported_benchmark_probe_option");
  const includeHeldOut=args.includes("--include-held-out");
  const selected=document.cases.filter(c=>includeHeldOut||c.split==="tuning");
  const signal=AbortSignal.timeout(60000);
  const index=await new PrivateSearchIndexStore(resolve("work/private-ask-evaluation/source-index-pilot")).load(ids=>revalidateBayanIndexSources(token,ids,signal));
  if(index.passages.some(p=>!!p.vector)) throw new Error("lexical_probe_requires_unembedded_snapshot");
  const rows:Record<string,unknown>[]=[],measurements:RetrievalMeasurement[]=[];
  for(const intent of selected) for(const language of ["ar","en","de"] as const) {
    signal.throwIfAborted();
    const started=performance.now();
    const found=hybridSearch(index,{id:intent.id,text:intent.questions[language],phrases:literalBenchmarkPhrases(intent.questions[language]),exactReferences:[]},{families:["hadith","scholar"],perMethod:20,limit:30});
    const candidates=await discoveredCorpusCandidates({generation:index.generation,hits:found.hits,audits:[],semantic:"no_indexed_vectors",truncated:found.audit.truncated,unrepresentedConcernIds:[]},{signal});
    measurements.push({intentId:intent.id,language,indexGeneration:index.generation,rankedPassageIds:found.hits.map(h=>h.passage.id)});
    rows.push({intentId:intent.id,language,split:intent.split,category:intent.category,
      discoveryPassages:found.hits.length,parentCandidates:candidates.length,
      discoveredSources:found.hits.map(h=>({passageId:h.passage.id,family:h.passage.family,methods:h.methods})),
      candidateSources:candidates.map(c=>({id:c.id,family:c.source.kind,context:c.contextAvailability})),
      durationMs:Math.round((performance.now()-started)*100)/100,sourceLabelStatus:intent.sourceReview.status});
  }
  const summary=(["ar","en","de"] as const).map(language=>{
    const group=rows.filter(r=>r.language===language);
    return {language,questions:group.length,withDiscovery:group.filter(r=>(r.discoveryPassages as number)>0).length,
      withParentCandidates:group.filter(r=>(r.parentCandidates as number)>0).length};
  });
  const assessment=retrievalBenchmark(document.cases,measurements);
  const report={at:new Date().toISOString(),mode:"literal_multilingual_lexical_component_probe_not_website_accuracy",generation:index.generation,
    benchmarkHash:createHash("sha256").update(raw).digest("hex"),lookupRevision:SOURCE_LOOKUP_REVISION,
    targetIntents:document.cases.length,intentsRun:selected.length,languageVersions:rows.length,heldOutExplicitlyIncluded:includeHeldOut,
    heldOutDeferred:document.cases.filter(c=>c.split==="held_out"&&!includeHeldOut).length,
    sourcePassages:index.passages.length,scope:["stored_hadith","stored_fatwa"],referenceHints:false,semantic:false,queryReformulation:false,
    reviewedIntents:assessment.reviewedIntents,measuredVersions:assessment.measuredVersions,recall:assessment.recall,incompleteEvaluation:assessment.incompleteEvaluation,
    summary,rows,paidCalls:0,remoteWrites:0,
    caveat:"The bounded pilot is not the complete library. Candidates are not supported answers. No candidates does not distinguish a corpus gap from a retrieval miss. This direct-query component does not run the website's question understanding, Arabic reformulation, live searches, selector, writer or checker. Pending labels do not establish accuracy. Held-out queries here cannot support later held-out claims after tuning against these results."};
  await writeFile(resolve("work/private-ask-evaluation/search-benchmark-component-probe.json"),JSON.stringify(report,null,2),{mode:0o600});
  console.info(JSON.stringify({...report,rows:undefined},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(error=>{
  console.error(error instanceof Error&&/^[a-z0-9_]+$/.test(error.message)?error.message:"search_benchmark_probe_failed");process.exitCode=1;
});
