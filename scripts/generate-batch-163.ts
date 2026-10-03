import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-163.json","utf8"));
const kinds:Kind[]=["prophet_words","companion_words","prophet_words","dialogue","prophet_words","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","prophet_words","prophet_words","prophet_words","dialogue","narration","dialogue","dialogue","prophet_words","prophet_words","dialogue","prophet_words","narration","prophet_words","prophet_words","prophet_words","prophet_words","narration","dialogue","narration","dialogue","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","companion_words","narration","dialogue","dialogue","companion_words","dialogue","dialogue","narration","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","prophet_words","prophet_words","prophet_words","companion_words","companion_words"];
const starts=[
"أن رسول الله صلى الله عليه وسلم كان إذا أتى مريضا",
"دخلت عليهما",
"الشفاء في ثلاثة شربة عسل",
"أن امرأة توفي زوجها فاشتكت عينها",
"دخلت بابن لي على رسول الله",
"لما ثقل رسول الله صلى الله عليه وسلم",
"أن أم قيس بنت محصن",
"أنها سألت رسول الله صلى الله عليه وسلم",
"أن ناسا من أصحاب النبي صلى الله عليه وسلم أتوا",
"أن النبي صلى الله عليه وسلم رأى في بيتها",
"على أنس بن مالك",
"أن رسول الله صلى الله عليه وسلم كان يرقي يقول",
"أن النبي صلى الله عليه وسلم كان يقول للمريض",
"كان النبي صلى الله عليه وسلم يقول في الرقية",
"انطلقوا في سفرة سافروها",
"خسفت الشمس ونحن عند النبي صلى الله عليه وسلم",
"جاء ابنه إلى رسول الله صلى الله عليه وسلم",
"قسم رسول الله صلى الله عليه وسلم أقبية",
"أهدي لرسول الله صلى الله عليه وسلم فروج حرير",
"قام رجل فقال يا رسول الله",
"جاءت امرأة ببردة",
"قالا لما نزل برسول الله",
"صلى رسول الله صلى الله عليه وسلم في خميصة",
 "قال سمعت أنس بن مالك",
 "من لبس الحرير في الدنيا",
"استيقظ النبي صلى الله عليه وسلم",
"نهى رسول الله صلى الله عليه وسلم أن يلبس المحرم",
"أن النبي صلى الله عليه وسلم كان يحتجر حصيرا",
 "مخرمة قال له",
"أن رسول الله صلى الله عليه وسلم اتخذ خاتما",
"كان رسول الله صلى الله عليه وسلم يلبس خاتما",
"سئل أنس هل اتخذ النبي صلى الله عليه وسلم خاتما",
"صنع النبي صلى الله عليه وسلم خاتما",
"أن النبي صلى الله عليه وسلم اصطنع خاتما",
"أن رسول الله صلى الله عليه وسلم اتخذ خاتما من فضة",
"لعن النبي صلى الله عليه وسلم المخنثين",
"الفطرة خمس",
 "فذكروا الدجال",
"سمعت رسول الله صلى الله عليه وسلم يهل",
"قلت يا رسول الله ما شأن الناس",
 "اطلع من جحر",
 "سمع معاوية بن أبي سفيان",
 "من الأنصار تزوجت",
"سألت امرأة النبي صلى الله عليه وسلم فقالت",
 "قدم رسول الله صلى الله عليه وسلم من سفر",
"وعد النبي صلى الله عليه وسلم جبريل",
"كنت عند ابن عباس وهم يسألونه",
"أتتني أمي راغبة في عهد النبي",
 "قدمت أمي",
"كنت شاهدا لابن عمر وسأله رجل",
 "عائشة زوج النبي",
"قبل رسول الله صلى الله عليه وسلم الحسن بن علي",
"حدثه أبو عثمان عن أسامة بن زيد",
"أتينا النبي صلى الله عليه وسلم ونحن شببة",
"قام رسول الله صلى الله عليه وسلم في صلاة",
"قلت يا رسول الله إن لي جارين",
"ذكر النبي صلى الله عليه وسلم النار",
 "عن النبي صلى الله عليه وسلم",
"لم يكن النبي صلى الله عليه وسلم سبابا",
"لم يكن رسول الله صلى الله عليه وسلم فاحشا"
];
const marks:any[]=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function st(i:number,n:string){marks[i].start=loc(batch[i].text_original,n)}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)marks[i].start=loc(batch[i].text_original,starts[i]);
tail(0,"وقال جرير عن منصور");
tail(2,"ورواه القمي");
tail(6,"لغة");
tail(7,"تابعه النضر");
tail(9,"وقال عقيل");
tail(18,"تابعه عبد الله");
tail(42,"تابعه ابن إسحاق");
tail(47,"قال ابن عيينة");
tail(54,"يريد رحمة الله");
fs.writeFileSync("data/hadith-split/marks-163.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-163.json");
