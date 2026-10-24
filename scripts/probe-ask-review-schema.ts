import { readFileSync } from 'node:fs';
import { ArabicCampaignGuard, persistCampaign, campaignLock, digest } from './ask-arabic-campaign-guard';
import { structuredOutputContract } from '../lib/ai/structured-output';
for(const p of ['.env.local','.env']) { try { process.loadEnvFile(p); } catch {} }
async function main(){
 const path='docs/ask-repair-runs/arabic-quality-20261022-spend.json', original='docs/ask-repair-runs/spend.json';
 const ledger=JSON.parse(readFileSync(path,'utf8')); const guard=new ArabicCampaignGuard(ledger,()=>persistCampaign(path,ledger));
 const rows=readFileSync('work/local-ask-traces/d70ded97-05e0-4503-a91c-adc604c68a9c.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l));
 const request=rows.find(r=>r.event==='model_request' && r.data.phase==='screening').data;
 const schema=structuredOutputContract(request.schema).schema;
 const variant=process.argv.find(a=>a.startsWith('--variant='))?.slice(10)??'original';
 if(variant==='citation-no-bounds'){const trim=(v:any)=>{if(!v||typeof v!=='object')return;delete v.maxItems;delete v.maxLength;Object.values(v).forEach(trim)};trim((schema as any).properties.citation_checks);}
 if(variant==='without-citation'){delete (schema as any).properties.citation_checks;(schema as any).required=(schema as any).required.filter((k:string)=>k!=='citation_checks');}

 const release=campaignLock(original,ledger.originalLedgerHash);
 try {const res=await guard.dispatch(fetch,()=>digest(readFileSync(original,'utf8'))===ledger.originalLedgerHash)('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'google/gemini-3.1-flash-lite',messages:[{role:'user',content:'Synthetic transport compatibility test. Return an empty object.'}],stream:false,max_tokens:200,response_format:{type:'json_schema',json_schema:{name:'bayan_response',strict:true,schema}},provider:{zdr:true,data_collection:'deny',require_parameters:true}})});
 const data:any=await res.json();
 persistCampaign('work/private-ask-evaluation/arabic-quality-20261022-retest-2/schema-probe-'+variant+'.json',{at:new Date().toISOString(),httpStatus:res.status,error:data.error??null,cost:data.usage?.cost??0,questionAttempt:false});
 console.log(JSON.stringify({status:res.status,error:data.error??null,cost:data.usage?.cost??0}));
 }finally{release();}
}main().catch(e=>{console.error(e.message);process.exitCode=1});
