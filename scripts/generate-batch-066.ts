import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=["dialogue","companion_words","companion_words","companion_words","dialogue","dialogue","dialogue","companion_words","dialogue","prophet_words","prophet_words","narration","companion_words","companion_words","narration","narration","narration","prophet_words","companion_words","reference_only","narration","dialogue","prophet_words","companion_words","companion_words","dialogue","narration","narration","reference_only","companion_words","dialogue","narration","dialogue","narration","dialogue","companion_words","narration","prophet_words","narration","companion_words","prophet_words","narration","dialogue","companion_words","dialogue","dialogue","companion_words","companion_words","prophet_words","narration","dialogue","companion_words","dialogue","dialogue","companion_words","dialogue","narration","dialogue","companion_words","companion_words"];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-066.json","utf8"));if(batch.length!==60)throw new Error("Expected 60");
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
const markers=["\u200f\"\u200f","\u0642\u064e\u0627\u0644","\u0623\u064e\u0646","\u0630\u064f\u0643\u0650\u0631","\u062c\u064e\u0627\u0621","\u0643\u064e\u0627\u0646","قال","أن","ذكر","جاء","كان"];
function chooseStart(t:string):string|null{
  const candidates:number[]=[];
  for(const marker of markers){let p=t.indexOf(marker,50);while(p>=0){candidates.push(p);p=t.indexOf(marker,p+1);}}
  candidates.sort((a,b)=>a-b);
  for(const p of candidates){if(p>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[p-1]))continue;const window=t.slice(p,p+100);if(/\u062d\u064e\u062f\u0651\u064e\u062b|\u062d\u064e\u062f\u064e\u0651\u062b|\u0623\u064e\u062e\u0652\u0628\u064e\u0631|\u0639\u064e\u0646/.test(window))continue;let q=t.lastIndexOf("\u0642\u064e\u0627\u0644",p);if(q>0&&/[\u0621-\u064a\u064b-\u065f]/.test(t[q-1]))q=-1;const start=q>=50&&p-q<80?q:p;return t.slice(start,start+Math.min(90,t.length-start));}
  return null;
}
for(let i=0;i<60;i++){if(marks[i].kind!=="reference_only")marks[i].start=chooseStart(batch[i].text_original);}
const setStart=(i:number,anchor:string)=>{const p=batch[i].text_original.indexOf(anchor);if(p<0)throw new Error(`Anchor not found for ${batch[i].url}`);marks[i].start=batch[i].text_original.slice(p,p+Math.min(90,batch[i].text_original.length-p));};
/*
setStart(0,"\u0642\u064e\u0627\u0644\u064e \u0646\u064e\0647\u064e\0649");
setStart(6,"\u0642\u064e\0627\u0644\u064e \u0631\u064e\062c\u064f\0644\u064c");
setStart(11,"\u0642\u064e\0627\u0644\u064e \u0628\u064e\0639\u064e\062b\u064e\0646\u064e\0627");
setStart(14,"\u0623\u064e\0646\u0651\u064e \u064a\u064e\0647\u064f\0648\u062f\u0650\u064a\u0651\u064b\u0627");
setStart(15,"\u0642\u064e\0627\u0644\u064e \u062e\u064e\0631\u064e\062c\u064e\062a\u0652 \u062c\u064e\0627\u0631\u0650\u064a\u064e\0629\u064c");
setStart(20,"\u0623\u064e\0646\u0651\u064e \u0627\u0644\u0646\u0651\u064e\0628\u0650\064a\u0651\u064e");
setStart(27,"\u0623\u064e\0646\u0651\u064e \u0627\u0628\u0652\0646\u064e\0629\u064e");
setStart(30,"\u0642\u064e\0627\0644\u064e\062a\u0652 \u0639\u064e\0627\u0626\u0650\0634\u064e\0629\u064f");
setStart(33,"\u0623\u064e\0646\u0651\u064e \u0631\u064e\062c\u064f\0644\u0627\u064b");
setStart(35,"\u0642\u064e\0627\0644\u064e \u0633\u064e\0623\u064e\0644\u0652\062a\u064f \u0639\u064e\0644\u064a\u0651\u064b\u0627");
setStart(42,"\u0642\u064e\0627\u0644\u064e \u0644\u064e\0645\u0651\u064e\0627 \u0642\u064e\062f\u0650\0645\u064e");
setStart(43,"\u0642\u064e\0627\u0644\u064e \u0633\u064e\0623\u064e\0644\u0652\062a\u064f \u0639\u064e\0644\u064a\u0651\u064b\u0627");
setStart(47,"\u0642\u064e\0627\u0644\u064e \u0633\u064e\0645\u0650\0639\u0652\062a\u064f \u0623\u064e\0646\u064e\0633\u064e");
setStart(49,"\u0642\u064e\0627\0644\u064e \u0639\u064e\0628\u0652\062f\u064f \u0627\u0644\u0644\u0651\u064e\0647\u0650");
setStart(51,"\u0633\u064e\0645\u0650\0639\u064e\0627 \u0639\u064f\0645\u064e\0631\u064e");
setStart(52,"\u0633\u064e\0645\u0650\0639\u0652\062a\u064f \u0639\u0650\062a\u0652\0628\u064e\0627\u0646\u064e");
setStart(54,"\u064a\u064e\0642\u064f\0648\u0644\u064f \u0644\u064e\0642\u064e\062f\u0652 \u0631\u064e\0623\u064e\064a\u0652\062a\u064f\0646\u0650\064a");
setStart(58,"[quran sura=\"4\" aya_start=\"19\" aya_end=\"19\"]");
*/
const cp=(s:string)=>s.trim().split(/\s+/).map(x=>String.fromCodePoint(parseInt(x,16))).join("");
const setHex=(i:number,s:string)=>setStart(i,cp(s));
setHex(0,"0642 064e 0627 0644 064e 0020 0646 064e 0647 064e 0649");
setHex(6,"0642 064e 0627 0644 064e 0020 0631 064e 062c 064f 0644 064c");
setHex(11,"0642 064e 0627 0644 064e 0020 0628 064e 0639 064e 062b 064e 0646 064e 0627");
setHex(14,"0623 064e 0646 0651 064e 0020 064a 064e 0647 064f 0648 062f 0650 064a 0651 064b 0627");
setHex(15,"0642 064e 0627 0644 064e 0020 062e 064e 0631 064e 062c 064e 062a 0652 0020 062c 064e 0627 0631 0650 064a 064e 0629 064c");
setHex(20,"0623 064e 0646 0651 064e 0020 0627 0644 0646 0651 064e 0628 0650 064a 0651 064e");
setHex(27,"0623 064e 0646 0651 064e 0020 0627 0628 0652 0646 064e 0629 064e");
setHex(30,"0642 064e 0627 0644 064e 062a 0652 0020 0639 064e 0627 0626 0650 0634 064e 0629 064f");
setHex(33,"0623 064e 0646 0651 064e 0020 0631 064e 062c 064f 0644 0627 064b");
setHex(35,"0642 064e 0627 0644 064e 0020 0633 064e 0623");
setHex(42,"0642 064e 0627 0644 064e 0020 0644 064e 0645 0651 064e 0627 0020 0642 064e 062f 0650 0645 064e");
setHex(43,"0642 064e 0627 0644 064e 0020 0633 064e 0623");
setHex(47,"0642 064e 0627 0644 064e 0020 0633 064e 0645 0650 0639 0652 062a 064f 0020 0623 064e 0646 064e 0633 064e");
setHex(49,"0642 064e 0627 0644 064e 0020 0639 064e 0628 0652 062f 064f 0020 0627 0644 0644 0651 064e 0647 0650");
setHex(51,"0633 064e 0645 0650 0639 064e 0627 0020 0639 064f 0645 064e 0631 064e");
setHex(52,"0633 064e 0645 0650 0639 0652 062a 064f 0020 0639 0650 062a 0652 0628 064e 0627 0646 064e");
setHex(54,"064a 064e 0642 064f 0648 0644 064f 0020 0644 064e 0642 064e 062f 0652 0020 0631 064e 0623 064e 064a 0652 062a 064f 0646 0650 064a");
setStart(58,"[quran sura=\"4\" aya_start=\"19\" aya_end=\"19\"]");
for(const [i,x] of batch.entries()){const p=x.text_original.indexOf("\u062a\u0627\u0628\u064e\u0639\u064e\u0647\u064f");if(p>=0)marks[i].tail_start=x.text_original.slice(p);}
fs.writeFileSync("data/hadith-split/marks-066.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-066.json");
