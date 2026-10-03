import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-160.json", "utf8"));
const kinds: Kind[] = [
  "dialogue","dialogue","dialogue","dialogue","dialogue","prophet_words","dialogue","narration","dialogue","prophet_words",
  "prophet_words","narration","companion_words","prophet_words","prophet_words","narration","prophet_words","prophet_words","narration","prophet_words",
  "narration","dialogue","dialogue","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","companion_words",
  "prophet_words","dialogue","prophet_words","prophet_words","companion_words","prophet_words","prophet_words","dialogue","dialogue","prophet_words",
  "prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words",
  "dialogue","dialogue","companion_words","dialogue","dialogue","prophet_words","dialogue","companion_words","companion_words","prophet_words"
];
const starts = [
  "قدم وفد عبد القيس",
  "أن ابن عباس وعبد الرحمن بن أزهر والمسور بن مخرمة أرسلوا",
  "جاء أهل نجران إلى النبي",
  "لما قدم أبو موسى أكرم هذا الحى",
  "جاء الطفيل بن عمرو إلى النبي",
  "أن النبي صلى الله عليه وسلم أمر أزواجه",
  "استفتت رسول الله",
  "أقبل النبي صلى الله عليه وسلم عام الفتح",
  "خرج إلى تبوك",
  "مر النبي صلى الله عليه وسلم بالحجر",
  "لأصحاب الحجر",
  "أقبلنا مع النبي",
  "لقد نفعني الله بكلمة",
  "يقول في مرضه",
  "قالت لما مرض النبي",
  "دخل عبد الرحمن بن أبي بكر",
  "سمعت النبي صلى الله عليه وسلم",
  "لعن الله اليهود",
  "لما ثقل رسول الله",
  "قالا لما نزل برسول الله",
  "كان يسأل في مرضه",
  "توفي النبي صلى الله عليه وسلم في بيتي",
  "لما ثقل النبي",
  "أن رسول الله صلى الله عليه وسلم بعث بعثا",
  "كان عاشوراء يصومه أهل الجاهلية",
  "كان عاشوراء يصام قبل رمضان",
  "أخذ عدي عقالا أبيض",
  "أبغض الرجال",
  "أن النبي صلى الله عليه وسلم قال يوم الخندق",
  "انطلقت في المدة التي كانت بيني وبين رسول الله",
  "رجع ناس من أصحاب النبي صلى الله عليه وسلم من أحد",
  "أنه كان جالسا خلف عمر بن عبد العزيز",
  "خطب رسول الله صلى الله عليه وسلم خطبة",
  "خطب رسول الله صلى الله عليه وسلم فقال",
  "سأل ابن عباس",
  "لا أحد أغير من الله",
  "لا أحد أغير من الله",
  "كنت أصلي فمر بي رسول الله",
  "كنت مع النبي صلى الله عليه وسلم في الغار",
  "جاء ابنه عبد الله بن عبد الله",
  "قال رسول الله صلى الله عليه وسلم لنا",
  "قدم النبي صلى الله عليه وسلم المدينة",
  "أصاب من امرأة قبلة",
  "أبطئوا عن النبي صلى الله عليه وسلم بالإسلام",
  "أن رسول الله صلى الله عليه وسلم قال لأصحاب الحجر",
  "أن رسول الله صلى الله عليه وسلم كان يدعو",
  "أتي رسول الله صلى الله عليه وسلم بلحم",
  "أن رسول الله صلى الله عليه وسلم طرقه وفاطمة",
  "قال رسول الله صلى الله عليه وسلم لجبريل",
  "خطب النبي صلى الله عليه وسلم فقال",
  "يحشر الكافر",
  "قام رسول الله صلى الله عليه وسلم حين أنزل الله",
  "بينما رجل يحدث في كندة",
  "بني على النبي صلى الله عليه وسلم بزينب ابنة جحش",
  "خرجت سودة بعد ما ضرب الحجاب",
  "أما السلام عليك",
  "سألت النبي صلى الله عليه وسلم عن قوله تعالى",
  "دخلنا على عبد الله بن مسعود",
  "قال عبد الله إنما كان هذا",
  "دخلت على عبد الله ثم قال إن رسول الله"
];
const marks:any[] = batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function st(i:number,n:string){marks[i].start=loc(batch[i].text_original,n)}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)st(i,starts[i]);
tail(8,"وقال أبو داود");
tail(32,"رواه النضر");
tail(34,"زاد يزيد بن هارون");
tail(37,"وقال معاذ");
tail(47,"رجما بالغيب");
fs.writeFileSync("data/hadith-split/marks-160.json",JSON.stringify(marks,null,2)+"\n","utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-160.json");
