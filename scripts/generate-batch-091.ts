import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=[
  "companion_words","companion_words","companion_words","dialogue","companion_words","narration","companion_words","narration","narration","narration",
  "narration","narration","dialogue","narration","narration","reference_only","reference_only","reference_only","dialogue","companion_words",
  "companion_words","reference_only","prophet_words","reference_only","reference_only","reference_only","prophet_words","reference_only","reference_only","reference_only",
  "dialogue","prophet_words","companion_words","companion_words","companion_words","companion_words","companion_words","narration","narration","narration",
  "narration","narration","companion_words","companion_words","companion_words","companion_words","companion_words","narration","narration","narration",
  "dialogue","prophet_words","companion_words","reference_only","companion_words","companion_words","companion_words","narration","dialogue","reference_only"
];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-091.json","utf8"));
if(batch.length!==60)throw new Error("Expected 60");
kinds[51]="narration";
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
const markers=["\u200f\"\u200f","\u0642\u064e\u0627\u0644\u064e","\u0623\u064e\u0646\u0651\u064e","\u0630\u064f\u0643\u0650\u0631","\u062c\u064e\u0627\u0621","\u0643\u064e\u0627\u0646","\u0633\u064e\u0645\u0650\u0639","\u064a\u064e\u0642\u064f\u0648\u0644"];
function chooseStart(t:string):string|null{const candidates:number[]=[];for(const marker of markers){let p=t.indexOf(marker,50);while(p>=0){candidates.push(p);p=t.indexOf(marker,p+1);}}candidates.sort((a,b)=>a-b);for(const p of candidates){if(p>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[p-1]))continue;const window=t.slice(p,p+110);if(/\u062d\u064e\u062f\u0651\u064e\u062b|\u062d\u064e\u062f\u064e\u0651\u062b|\u0623\u064e\u062e\u0652\u0628\u064e\u0631/.test(window))continue;let q=t.lastIndexOf("\u0642\u064e\u0627\u0644",p);if(q>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[q-1]))q=-1;const start=q>=50&&p-q<80?q:p;return t.slice(start,start+Math.min(90,t.length-start));}return null;}
for(let i=0;i<60;i++)marks[i].start=chooseStart(batch[i].text_original);
const fixes:[[number,string],...Array<[number,string]>]=[
  [22,"\u0642\u064e\u0627\u0644\u064e \u0631\u064e\u0633\u064f\u0648\u0644\u064f"],[31,"\u0642\u064e\u0627\u0644\u064e \u0631\u064e\u0633\u064f\u0648\u0644\u064f"],[39,"\u0623\u064e\u0646\u0651\u064e \u0631\u064e\u0633\u064f\u0648\u0644\u064e"],[48,"\u0643\u064e\u0627\u0646\u064e\u062a\u0652 \u062e\u064f\u0637\u0652\u0628\u064e\u0629\u064f"],[49,"\u0643\u064e\u0627\u0646\u064e \u0631\u064e\u0633\u064f\u0648\u0644\u064f"],[51,"\u064a\u064e\u0642\u0652\u0631\u064e\u0623\u064f"]
];
for(const [i,needle] of fixes){const p=batch[i].text_original.indexOf(needle);if(p>=0)marks[i].start=batch[i].text_original.slice(p,p+Math.min(90,batch[i].text_original.length-p));}
for(let i=0;i<60;i++)if(kinds[i]==="reference_only")marks[i].start=null;
for(let i=0;i<60;i++)if(marks[i].start===null)marks[i].kind="reference_only";
const tails:[[number,string],...Array<[number,string]>]=[
  [14,"\u062b\u064f\u0645\u0651\u064e \u0630\u064e\u0643\u064e\u0631\u064e \u0646\u064e\u062d\u0652\u0648\u064e"],[46,"\u0648\u064e\u0641\u0650\u064a \u0631\u0650\u0648\u064e\u0627\u064a\u064e\u0629\u0650"],[48,"\u0633\u064e\u0627\u0642\u064e"],[49,"\u062b\u064f\u0645\u0651\u064e \u0633\u064e\u0627\u0642\u064e"],[57,"\u0641\u064e\u0630\u064e\u0643\u064e\u0631\u064e \u0646\u064e\u062d\u0652\u0648\u064e"]];
for(const [i,needle] of tails){const p=batch[i].text_original.indexOf(needle);if(p>=0)marks[i].tail_start=batch[i].text_original.slice(p);}
fs.writeFileSync("data/hadith-split/marks-091.json",JSON.stringify(marks,null,2)+"\n","utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-091.json");
