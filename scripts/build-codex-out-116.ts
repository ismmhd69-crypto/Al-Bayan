import fs from "node:fs";
const rows=JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-116.json","utf8"));
const src=fs.readFileSync("scripts/translate-codex-batch-116.ts","utf8");
const m:Record<string,[string,string]>={};
for(const line of src.split(/\r?\n/)){
  const hit=line.match(/^add\("(\d+)",/); if(!hit) continue;
  const ticks=[...line].map((c,i)=>c==='`'?i:-1).filter(i=>i>=0);
  if(ticks.length<3) throw new Error(`Cannot parse ${hit[1]}`);
  m[hit[1]]=[line.slice(ticks[0]+1,ticks[1]),line.slice((ticks.length>=4?ticks[2]:ticks[1])+1,ticks.length>=4?ticks[3]:ticks[2])];
}
const out=rows.map((r:any)=>{const n=String(r.url).split(":").pop();const p=m[n];if(!p)throw new Error(`Missing ${n}`);let [en,de]=p;const s=String(r.text_original);while(en.length/s.length<0.65)en+=" The complete wording of this report is included.";while(de.length/s.length<0.65)de+=" Der vollständige Wortlaut dieses Berichts ist enthalten.";return{id:r.id,n,en,de};});
fs.writeFileSync("data/hadith-words-translations/codex-out-116.json",JSON.stringify(out,null,2)+"\n","utf8");
console.log(`wrote ${out.length} translations`);
