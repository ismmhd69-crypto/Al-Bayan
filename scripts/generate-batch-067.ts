import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=["dialogue","dialogue","prophet_words","prophet_words","companion_words","prophet_words","companion_words","dialogue","dialogue","prophet_words","dialogue","companion_words","companion_words","narration","prophet_words","narration","prophet_words","prophet_words","dialogue","narration","companion_words","dialogue","prophet_words","narration","narration","prophet_words","narration","narration","companion_words","narration","dialogue","narration","dialogue","narration","dialogue","companion_words","narration","prophet_words","dialogue","prophet_words","narration","narration","prophet_words","prophet_words","companion_words","companion_words","narration","prophet_words","dialogue","dialogue","narration","prophet_words","prophet_words","prophet_words","narration","narration","companion_words","dialogue","companion_words","companion_words"];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-067.json","utf8"));if(batch.length!==60)throw new Error("Expected 60");
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
const markers=["\u200f\"\u200f","\u0642\u064e\u0627\u0644","\u0623\u064e\u0646","\u0630\u064f\u0643\u0650\u0631","\u062c\u064e\u0627\u0621","\u0643\u064e\u0627\u0646","\u0633\u064e\u0645\u0650\u0639","\u064a\u064e\u0642\u064f\u0648\u0644"];
function chooseStart(t:string):string|null{
  const candidates:number[]=[];
  for(const marker of markers){let p=t.indexOf(marker,50);while(p>=0){candidates.push(p);p=t.indexOf(marker,p+1);}}
  candidates.sort((a,b)=>a-b);
  for(const p of candidates){if(p>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[p-1]))continue;const window=t.slice(p,p+110);if(/\u062d\u064e\u062f\u0651\u064e\u062b|\u062d\u064e\u062f\u064e\u0651\u062b|\u0623\u064e\u062e\u0652\u0628\u064e\u0631/.test(window))continue;let q=t.lastIndexOf("\u0642\u064e\u0627\u0644",p);if(q>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[q-1]))q=-1;const start=q>=50&&p-q<80?q:p;return t.slice(start,start+Math.min(90,t.length-start));}
  return null;
}
for(let i=0;i<60;i++){if(marks[i].kind!=="reference_only")marks[i].start=chooseStart(batch[i].text_original);}
const cp=(s:string)=>s.trim().split(/\s+/).map(x=>String.fromCodePoint(parseInt(x,16))).join("");
const setStart=(i:number,hex:string)=>{const anchor=cp(hex);const p=batch[i].text_original.indexOf(anchor);if(p<0)throw new Error(`Anchor not found for ${batch[i].url}`);marks[i].start=batch[i].text_original.slice(p,p+Math.min(90,batch[i].text_original.length-p));};
setStart(0,"0642 064e 0627 0644 064e 0020 0642 064e 0627 0644 064e 0020 0631 064e 0633 064f 0648 0644");
setStart(2,"0642 064e 0627 0644 064e 0020 0642 064e 0627 0644 064e 0020 0631 064e 0633 064f 0648 0644");
setStart(3,"0623 064e 0646 0651 064e 0020 0631 064e 0633 064f 0648 0644");
setStart(5,"0623 064e 0646 0651 064e 0020 0631 064e 0633 064f 0648 0644");
setStart(7,"0642 064e 0627 0644 064e 0020 200f 0022 200f");
setStart(9,"0642 064e 0627 0644 064e 0020 0642 064e 0627 0644 064e 0020 0631 064e 0633 064f 0648 0644");
setStart(12,"0642 064e 0627 0644 064e 0020 0625 0650 0646 0651 064e 0645 064e 0627");
setStart(13,"0642 064e 0627 0644 064e 0020 0627 0633 0652 062a 064e 0639 0652 0645 064e 0644");
setStart(14,"0642 064e 0627 0644 064e 0020 0642 064e 0627 0644 064e 0020 0627 0644 0646 0651 064e 0628 0650 064a 0651");
setStart(16,"0642 064e 0627 0644 064e 0020 200f 0022 200f");
setStart(18,"0623 064e 0646 0651 064e 0020 0631 064e 062c 064f 0644 0627 064b");
setStart(22,"0623 064e 0646 0651 064e 0020 0627 0628 0652 0646 064e 0020 0639 064f 0645 064e 0631");
setStart(25,"0642 064e 0627 0644 064e 0020 200f 0022 200f");
setStart(39,"0642 064e 0627 0644 064e 0020 200f 0022 200f");
setStart(42,"0623 064e 0646 0651 064e 0020 0631 064e 0633 064f 0648 0644");
setStart(43,"0642 064e 0627 0644 064e 0020 0642 064e 0627 0644 064e 0020 0644 0650 064a");
setStart(47,"0642 064e 0627 0644 064e 0020 062d 064e 062f 0651 064e 062b 064e 0646 064e 0627 0020 0631 064e 0633 064f 0648 0644");
setStart(52,"0623 064e 0646 0651 064e 0647 064f 0020 0642 064e 0627 0645 064e");
setStart(53,"0642 064e 0627 0644 064e 0020 0630 064e 0643 064e 0631");
setStart(55,"0642 064e 0627 0644 064e 0020 062e 064e 0631 064e 062c 064e 0020 0627 0644 0646 0651 064e 0628 0650 064a");
setStart(51,"0642 064e 0627 0644 064e 0020 0639 064e 0627 0626");
setStart(57,"0642 064e 0627 0645 064e 0020 0639 064e 0645 0651 064e 0627 0631");
for(const [i,x] of batch.entries()){const p=x.text_original.indexOf("\u062a\u0627\u0628\u064e\0639\u064e\0647\u064f");if(p>=0)marks[i].tail_start=x.text_original.slice(p);}
fs.writeFileSync("data/hadith-split/marks-067.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-067.json");
