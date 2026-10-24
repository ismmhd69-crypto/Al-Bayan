import { readFileSync } from 'node:fs';
import { ArabicCampaignGuard, persistCampaign, campaignLock, digest } from './ask-arabic-campaign-guard';
import { structuredOutputContract, providerShapeSchema } from '../lib/ai/structured-output';
for(const p of ['.env.local','.env']){try{process.loadEnvFile(p);}catch{}}
async function main(){
 const path='docs/ask-repair-runs/arabic-quality-20261022-retest-3-spend.json', original='docs/ask-repair-runs/spend.json';
 const ledger=JSON.parse(readFileSync(path,'utf8')); const guard=new ArabicCampaignGuard(ledger,()=>persistCampaign(path,ledger),{cap:ledger.priorCampaign.exposure+.5,priorExposure:ledger.priorCampaign.exposure});
 const trace=readFileSync('work/local-ask-traces/47aa680c-fca6-46db-885c-28ff5ef773d0.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l));
 const request=trace.find(r=>r.event==='model_request'&&r.data.phase==='screening'&&r.data.prompt.full_answer===true)?.data;
 if(!request)throw Error('recorded_full_request_missing');
 const schema=structuredOutputContract(request.schema).schema;const rows:any[]=[];const release=campaignLock(original,ledger.originalLedgerHash);
 try{for(const variant of ['recorded_bounds','shape_with_local_bounds']){
 const res=await guard.dispatch(fetch,()=>digest(readFileSync(original,'utf8'))===ledger.originalLedgerHash&&digest(readFileSync(ledger.priorCampaign.path,'utf8'))===ledger.priorCampaign.hash)('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'google/gemini-3.1-flash-lite',messages:[{role:'user',content:'Synthetic schema compatibility check. Return empty arrays and yes decisions.'}],stream:false,max_tokens:200,response_format:{type:'json_schema',json_schema:{name:'bayan_response',strict:true,schema:variant==='recorded_bounds'?schema:providerShapeSchema(schema)}},provider:{zdr:true,data_collection:'deny',require_parameters:true}})});
 const data:any=await res.json();rows.push({variant,status:res.status,cost:data.usage?.cost??0,error:data.error??null});persistCampaign('work/private-ask-evaluation/arabic-quality-20261022-retest-5/schema-preflight.json',{questionAttempts:false,rows});console.log(JSON.stringify(rows.at(-1)));
 }}finally{release();}
}main().catch(e=>{console.error(e.message);process.exitCode=1});
