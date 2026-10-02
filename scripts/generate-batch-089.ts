import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=[
  "reference_only","narration","narration","narration","narration","companion_words","narration","narration","narration","narration",
  "reference_only","dialogue","reference_only","companion_words","companion_words","companion_words","prophet_words","reference_only","prophet_words","prophet_words",
  "reference_only","prophet_words","prophet_words","narration","reference_only","prophet_words","prophet_words","narration","dialogue","narration",
  "companion_words","dialogue","dialogue","reference_only","narration","companion_words","companion_words","prophet_words","reference_only","narration",
  "prophet_words","narration","reference_only","companion_words","reference_only","dialogue","narration","narration","reference_only","dialogue",
  "narration","reference_only","narration","narration","narration","reference_only","narration","companion_words","companion_words","reference_only"
];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-089.json","utf8"));if(batch.length!==60)throw new Error("Expected 60");
// These alternate transmissions still include a complete or substantial matn.
kinds[33]="companion_words";
kinds[42]="narration";
kinds[48]="narration";
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
const markers=["\u200f\"\u200f","\u0642\u064e\u0627\u0644\u064e","\u0623\u064e\u0646\u0651\u064e","\u0630\u064f\u0643\u0650\u0631","\u062c\u064e\u0627\u0621","\u0643\u064e\u0627\u0646","\u0633\u064e\u0645\u0650\u0639","\u064a\u064e\u0642\u064f\u0648\u0644"];
function chooseStart(t:string):string|null{const candidates:number[]=[];for(const marker of markers){let p=t.indexOf(marker,50);while(p>=0){candidates.push(p);p=t.indexOf(marker,p+1);}}candidates.sort((a,b)=>a-b);for(const p of candidates){if(p>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[p-1]))continue;const window=t.slice(p,p+110);if(/\u062d\u064e\u062f\u0651\u064e\u062b|\u062d\u064e\u062f\u064e\u0651\u062b|\u0623\u064e\u062e\u0652\u0628\u064e\u0631/.test(window))continue;let q=t.lastIndexOf("\u0642\u064e\u0627\u0644",p);if(q>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[q-1]))q=-1;const start=q>=50&&p-q<80?q:p;return t.slice(start,start+Math.min(90,t.length-start));}return null;}
for(let i=0;i<60;i++)marks[i].start=chooseStart(batch[i].text_original);
const fixes:[[number,string],...Array<[number,string]>]=[[33,"\u0642\u064e\u0627\u0644\u064e \u0628\u0650\u062a\u0651\u064f"],[42,"\u0642\u064e\u0627\u0644\u064e \u0635\u064e\u0644\u0651\u064e\u064a\u0652\u062a\u064f"],[48,"\u0642\u064e\u0627\u0644\u064e\u062a\u0652 \u0644\u064e\u0645\u0652 \u064a\u064e\u0643\u064f\u0646\u0652"]];
for(const [i,needle] of fixes){const p=batch[i].text_original.indexOf(needle);if(p>=0)marks[i].start=batch[i].text_original.slice(p,p+Math.min(90,batch[i].text_original.length-p));}
for(let i=0;i<60;i++)if(kinds[i]==="reference_only")marks[i].start=null;
for(let i=0;i<60;i++)if(marks[i].start===null)marks[i].kind="reference_only";
for(const [i,x] of batch.entries()){const p=x.text_original.indexOf("\u0631\u064e\u0648\u064e\u0627\u0647\u064f");if(p>=0)marks[i].tail_start=x.text_original.slice(p);}
fs.writeFileSync("data/hadith-split/marks-089.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-089.json");
