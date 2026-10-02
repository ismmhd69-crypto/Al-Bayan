import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=[
  "dialogue","companion_words","narration","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","reference_only",
  "dialogue","reference_only","reference_only","reference_only","dialogue","prophet_words","companion_words","companion_words","reference_only","reference_only",
  "prophet_words","prophet_words","reference_only","prophet_words","reference_only","reference_only","companion_words","reference_only","reference_only","dialogue",
  "dialogue","prophet_words","dialogue","dialogue","reference_only","reference_only","dialogue","prophet_words","prophet_words","reference_only",
  "dialogue","narration","narration","narration","narration","narration","dialogue","reference_only","narration","reference_only",
  "narration","narration","narration","narration","reference_only","dialogue","dialogue","companion_words","companion_words","companion_words"
];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-097.json","utf8"));
if(batch.length!==60)throw new Error("Expected 60");
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
marks[49].kind="narration";
marks[54].kind="narration";
marks[47].kind="narration";
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
for(const [i,text] of [
  [0,"قال رسول الله"],[1,"قال رسول الله"],[2,"قال رسول الله"],[4,"ورجل معلق"],[5,"قال أي الصدقة أفضل"],
  [6,"يقول إياكم"],[8,"أن رسول الله"],[9,"قال رسول الله"],[11,"قال النبي"],[12,"قال كنا"],
  [13,"قال تحملت"],[20,"يقول قام رسول الله"],[21,"أن رسول الله"],[22,"قال جلس رسول الله"],
  [24,"قال رسول الله"],[26,"قال كنت أمشي"],[28,"أنه قال قسم رسول الله"],[29,"أن أناسا"],
  [30,"أنه قال لما أفاء"],[32,"قال جمع رسول الله"],[33,"قال لما فتحت مكة"],[34,"قال لما كان يوم حنين"],
  [35,"قال افتتحنا مكة"],[36,"قال أعطى رسول الله"],[37,"أن النبي"],[39,"أن رسول الله"],
  [40,"قال لما كان يوم حنين"],[41,"قال أتى رجل"],[43,"قال بعث علي"],[44,"يقول بعث علي"],
  [45,"زاد فقام إليه"],[46,"قال بينا نحن"],[47,"أن النبي"],[51,"قال ذكر الخوارج"],
  [54,"أنا لا"],[55,"أنا لا"],[56,"قال اجتمع"],[57,"قالا لعبد المطلب"],[58,"قال إن جويرية"]
] as [number,string][])setByText(i,text);
for(const [i,text] of [
  [0,"قال رسول الله"],[1,"قالت بعث"],[2,"أن النبي كان"],[3,"قال كان رسول الله"],[4,"قال صل عليهم"],
  [5,"قال رسول الله"],[6,"وقال فإن غم عليكم"],[7,"وقال ذكر رسول الله"],[8,"قال رسول الله"],[10,"قال له ما يدريك"],
  [14,"قال فقدمت الشام"],[15,"أن نبي الله"],[16,"قال لما نزلت"],[17,"قال لما نزلت"],[20,"قال قال رسول الله"],
  [21,"قال إن الفجر"],[23,"يقول سمعت محمدا"],[26,"قال تسحرنا"],[29,"قال دخلت أنا"],[30,"قال دخلت أنا"],
  [31,"قال رسول الله"],[32,"قال كنا"],[33,"قال كنا"],[36,"قال نهى رسول الله"],[37,"قال رسول الله"],
  [38,"قال فاكلفوا"],[40,"قال كان رسول الله"],[41,"قالت كان رسول الله"],[42,"أن النبي كان"],
  [43,"قالت كان رسول الله"],[44,"قالت كان رسول الله"],[45,"أن رسول الله"],[46,"أن رسول الله"],
  [47,"قال انطلقت أنا"],[49,"أن رسول الله"],[51,"قالت كان رسول الله"],[52,"قالت كان رسول الله"],
  [53,"أن النبي"],[54,"قالت كان رسول الله"],[56,"أنه سأل رسول الله"],[57,"قال سمعت أبا هريرة"],
  [58,"قالت قد كان رسول الله"],[59,"قالت كان رسول الله"]
] as [number,string][])setByText(i,text);
for(let i=0;i<60;i++)delete marks[i].tail_start;
const refs=[9,11,12,13,18,19,22,24,25,27,28,34,35,39,48,50,55];
for(const i of refs)marks[i].start=null;
for(let i=0;i<60;i++)if(marks[i].start===null)marks[i].kind="reference_only";
const tails:[[number,string],...Array<[number,string]>]=[
  [5,"انتهى حديث"],[6,"ولم يذكرا"],[11,"فذكر بمعنى"],[18,"فذكر نحو"],[30,"وساق الحديث"],[36,"قال أبو توبة"],[38,"وقال"],[41,"وفي رواية"],[45,"زاد ابن حجر"],[48,"حدثني عمرو"],[49,"فذكر بمعنى"],[50,"بمعنى حديث"],[58,"حدثني عمرو"]
];
for(const [i,needle] of tails){const {clean,map}=cleanMap(batch[i].text_original);const p=clean.indexOf(strip(needle));if(p>=0)marks[i].tail_start=batch[i].text_original.slice(map[p]);}
for(let i=0;i<60;i++)delete marks[i].tail_start;
const newTails:[[number,string],...Array<[number,string]>]=[
  [7,"فذكر مثله"],[31,"وساق الحديث"],[42,"وساق الحديث"]
];
for(const [i,needle] of newTails){const {clean,map}=cleanMap(batch[i].text_original);const p=clean.indexOf(strip(needle));if(p>=0)marks[i].tail_start=batch[i].text_original.slice(map[p]);}
const finalTails:[[number,string],...Array<[number,string]>]=[
  [6,"نحو حديث"],[11,"نحوه"],[13,"بمعنى"],[19,"نحو حديث"],[22,"وانتهى حديث"],
  [24,"فذكر هذا"],[34,"بمعنى حديث"],[39,"بمثل حديث"],[48,"فذكر نحوه"],[50,"مثله"]
];
for(const [i,needle] of finalTails){const {clean,map}=cleanMap(batch[i].text_original);const p=clean.indexOf(strip(needle));if(p>=0)marks[i].tail_start=batch[i].text_original.slice(map[p]);}
fs.writeFileSync("data/hadith-split/marks-097.json",JSON.stringify(marks,null,2)+"\n","utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-097.json");
