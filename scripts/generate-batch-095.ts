import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=[
  "companion_words","companion_words","companion_words","companion_words","companion_words","companion_words","companion_words","companion_words","companion_words","prophet_words",
  "prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","reference_only","dialogue","dialogue","reference_only",
  "dialogue","dialogue","prophet_words","prophet_words","dialogue","reference_only","companion_words","reference_only","reference_only","dialogue",
  "reference_only","reference_only","companion_words","reference_only","companion_words","dialogue","prophet_words","reference_only","prophet_words","prophet_words",
  "reference_only","prophet_words","reference_only","reference_only","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","dialogue",
  "prophet_words","reference_only","companion_words","reference_only","prophet_words","reference_only","reference_only","dialogue","dialogue","prophet_words"
];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-095.json","utf8"));
if(batch.length!==60)throw new Error("Expected 60");
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function cleanMap(t:string){const chars=[...t],clean:string[]=[],map:number[]=[];for(let i=0;i<chars.length;i++){if(/[\u064b-\u065f\u0670]/.test(chars[i]))continue;clean.push(chars[i]);map.push(i);}return {clean:clean.join(""),map};}
const markers=["قال","أن","كان","سمع","يقول"].map(strip);
function chooseStart(t:string):string|null{const {clean,map}=cleanMap(t),candidates:number[]=[];for(const marker of markers){let p=clean.indexOf(marker,50);while(p>=0){candidates.push(p);p=clean.indexOf(marker,p+1);}}candidates.sort((a,b)=>a-b);for(const p of candidates){if(p>0&&/[\u0621-\u064a]/.test(clean[p-1]))continue;const window=clean.slice(p,p+110);if(/حدث|أخبر/.test(window))continue;return t.slice(map[p],map[p]+Math.min(90,t.length-map[p]));}return null;}
for(let i=0;i<60;i++)marks[i].start=chooseStart(batch[i].text_original);
function setByText(i:number, text:string){const {clean,map}=cleanMap(batch[i].text_original);const p=clean.indexOf(strip(text),50);if(p>=0){const orig=map[p];marks[i].start=batch[i].text_original.slice(orig,orig+Math.min(90,batch[i].text_original.length-orig));}}
for(const [i,text] of [
  [0,"قال فرض رسول الله"],[1,"قال فرض النبي"],[2,"قال إن رسول الله"],[3,"أن رسول الله"],
  [4,"يقول كنا"],[5,"قال كنا"],[6,"يقول كنا"],[7,"قال كنا"],[8,"أن معاوية"],
  [9,"أن رسول الله"],[10,"أن رسول الله"],[11,"قال رسول الله"],[12,"ما من صاحب إبل"],
  [13,"قال رسول الله"],[14,"سمعت رسول الله"],[15,"عن النبي صلى الله عليه وسلم قال"],
  [17,"قال انتهيت"],[18,"قال انتهيت"],[20,"قال قدمت"],[21,"قال كنت"],
  [22,"يبلغ به النبي"],[23,"قال رسول الله"],[24,"قال أعتق"],[29,"قالت قال رسول الله"],
  [36,"إن رسول الله"],[38,"قال رسول الله"],[39,"عن النبي صلى الله عليه وسلم قال"],
  [41,"عن النبي صلى الله عليه وسلم قال"],[44,"قال رسول الله"],[45,"قال رسول الله"],
  [46,"قال ذكر رسول الله"],[48,"قال كنا"],[49,"قال جاء ناس"],[50,"قال خطب رسول الله"],
  [52,"قال أمرنا"],[54,"قال رسول الله"],[57,"قال أمرني"],[58,"أن رسول الله"]
] as [number,string][])setByText(i,text);
const refs=[16,19,25,27,28,30,31,33,34,37,40,42,43,51,53,55,56];
for(const i of refs)marks[i].start=null;
for(let i=0;i<60;i++)if(marks[i].start===null)marks[i].kind="reference_only";
const tails:[[number,string],...Array<[number,string]>]=[
  [5,"انتهى حديث"],[6,"ولم يذكرا"],[11,"فذكر بمعنى"],[18,"فذكر نحو"],[30,"وساق الحديث"],[36,"قال أبو توبة"],[38,"وقال"],[41,"وفي رواية"],[45,"زاد ابن حجر"],[48,"حدثني عمرو"],[49,"فذكر بمعنى"],[50,"بمعنى حديث"],[58,"حدثني عمرو"]
];
for(const [i,needle] of tails){const {clean,map}=cleanMap(batch[i].text_original);const p=clean.indexOf(strip(needle));if(p>=0)marks[i].tail_start=batch[i].text_original.slice(map[p]);}
fs.writeFileSync("data/hadith-split/marks-095.json",JSON.stringify(marks,null,2)+"\n","utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-095.json");
