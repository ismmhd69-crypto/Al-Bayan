// Offline UI acceptance only. No .env, providers, source services, or real accounts.
import {build} from "esbuild";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {createServer} from "node:http";
import {sections} from "../tests/fixtures/rich";
async function main(){
const recorded = process.argv.includes("--recorded");
const root=resolve("work/private-ask-evaluation/simple-ui");
const recordedAnswer = recorded ? JSON.parse((await readFile(resolve("work/local-ask-traces/0f55f7e8-e0c4-4ecd-9a6c-2c808189ce90.jsonl"),"utf8")).trim().split(/\r?\n/).find(line=>JSON.parse(line).event==="terminal_result")!).data.answer : null;
await mkdir(root,{recursive:true});
const entry=join(root,"entry.jsx"),alias=join(root,"adapters.jsx");
await writeFile(alias,`import React from 'react';
export default function Link({href,children,prefetch,...props}){return <a href={href} {...props}>{children}</a>;}
export const browserSupabase=()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}});`);
const path=(v:string)=>JSON.stringify(resolve(v).replace(/\\/g,"/"));
await writeFile(entry,`import React from 'react';import {createRoot} from 'react-dom/client';
import AskChat from ${path("components/AskChat.tsx")};import {getDictionary} from ${path("lib/i18n.ts")};import ${path("app/globals.css")};
const lang=new URLSearchParams(location.search).get('lang')==='ar'?'ar':'en';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
document.documentElement.style.setProperty('--font-body','Arial, sans-serif');document.documentElement.style.setProperty('--font-heading','Georgia, serif');document.documentElement.style.setProperty('--font-arabic','Arial, sans-serif');
createRoot(document.getElementById('root')).render(<div style={{height:'100dvh',display:'flex',flexDirection:'column',maxWidth:900,margin:'auto'}}><p style={{padding:8,margin:0,color:'#111',background:'#fff1c2'}}>${recorded ? 'PRIVATE RECORDED ANSWER. Offline replay. No AI calls.' : 'OFFLINE FIXTURE. Invented wording. No AI calls or real source claims.'}</p><AskChat lang={lang} t={getDictionary(lang).ask} backLabel="Home" suggestions={[]} testMode={false} richEnabled durableEnabled={false}/></div>);`);
await build({entryPoints:[entry],outfile:join(root,"bundle.js"),bundle:true,platform:"browser",format:"esm",jsx:"automatic",tsconfig:resolve("tsconfig.json"),
 define:{"process.env.NODE_ENV":'"development"',"process.env.NEXT_PUBLIC_ASK_STABLE_STREAMING":'"true"'},logLevel:"silent",
 plugins:[{name:"offline-adapters",setup(b){b.onResolve({filter:/^next\/link$|^@\/lib\/supabase-browser$/},()=>({path:alias}));}}]});
let runs=0;
const server=createServer(async(req,res)=>{
  const url=new URL(req.url??"/","http://127.0.0.1");
  if(url.pathname==="/"){res.setHeader("content-type","text/html");res.end('<!doctype html><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline simple Ask</title><link rel="stylesheet" href="/bundle.css"><div id="root"></div><script type="module" src="/bundle.js"></script>');return;}
  if(url.pathname==="/bundle.js"||url.pathname==="/bundle.css"){res.setHeader("content-type",url.pathname.endsWith("css")?"text/css":"text/javascript");res.end(await readFile(join(root,url.pathname.slice(1))));return;}
  if(url.pathname==="/api/ask/stream"){
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks).toString());
    if(body.action){res.setHeader("content-type","application/json");res.end(JSON.stringify({status:"research_cancelled"}));return;}
    const id=`offline-simple-${++runs}`,language=body.lang==="ar" || /\p{Script=Arabic}/u.test(body.question ?? "")?"ar":"en";
    const originals=recordedAnswer ? recordedAnswer.sections.slice(0,3) : sections.slice(0,3).map(s=>({...s,presentation:"originals",claims:[],sources:s.sources.map(source=>({...source,role:"direct",requirementIds:["R1"],explanationRequirementIds:[]}))}));
    const summary=recordedAnswer ? recordedAnswer.sections[3] : {...sections[3],sources:sections[3].sources.map(source=>({...source,role:"direct",requirementIds:["R1"],explanationRequirementIds:[]})),claims:sections[3].claims.map(c=>({...c,text:language==="ar"?"تربط هذه النصوص العناية بالمسؤولية المدروسة.":c.text}))};
    const answer=recordedAnswer ?? {version:4,language,review:"automatic",complete:true,sections:[...originals,summary]};
    res.writeHead(200,{"content-type":"text/event-stream","cache-control":"no-store"});let sequence=0;
    const send=(event:object)=>res.write(`data: ${JSON.stringify({version:3,request_id:id,sequence:++sequence,...event})}\n\n`);
    send({type:"group_status",group:"quran",status:"checking"});
    for(const [i,section] of [...originals,summary].entries())send({type:"section_committed",section,commit_id:String(i+1).repeat(64),evidence_snapshot:"a".repeat(64)});
    send({type:"terminal",result:{status:"rich_answer",answer}});res.end();return;
  }
  res.writeHead(404).end();
});
server.listen(3108,"127.0.0.1",()=>console.log("Offline simple Ask UI: http://127.0.0.1:3108 (no paid calls)"));

}
main().catch(error=>{console.error(error);process.exitCode=1;});
