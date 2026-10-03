import fs from "fs";
type Kind = "prophet_words"|"companion_words"|"narration"|"dialogue"|"reference_only"|"unclear";
const batch:any[]=JSON.parse(fs.readFileSync("data/hadith-split/batch-165.json","utf8"));
const kinds:Kind[]=["prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","companion_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","narration","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","dialogue","dialogue","dialogue","dialogue","prophet_words","prophet_words","prophet_words","dialogue","companion_words","prophet_words","prophet_words","dialogue","dialogue","companion_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","dialogue","prophet_words"];
const starts:(string|null)[]=[
 "كان النبي صلى الله عليه وسلم يدعو عند الكرب",
 "لقيني كعب بن عجرة",
 "قلنا يا رسول الله هذا السلام عليك",
 "أنهم قالوا يا رسول الله كيف نصلي عليك",
 "كان سعد يأمر بخمس",
 "دخلت على عجوزان",
 "أن النبي صلى الله عليه وسلم كان يقول",
 "كان رسول الله صلى الله عليه وسلم يتعوذ يقول",
 "تعوذوا بكلمات",
 "أن النبي صلى الله عليه وسلم كان يقول",
 "أن النبي صلى الله عليه وسلم كان يتعوذ",
 "قالت أم سليم",
 "كان النبي صلى الله عليه وسلم يعلمنا الاستخارة",
 "أن رسول الله صلى الله عليه وسلم كان إذا قفل",
 "كان أكثر دعاء النبي صلى الله عليه وسلم",
 "كان النبي صلى الله عليه وسلم يعلمنا هؤلاء الكلمات",
 "دعا رسول الله صلى الله عليه وسلم على الأحزاب",
 "بعث النبي صلى الله عليه وسلم سرية",
 "كنا مع النبي صلى الله عليه وسلم يوم الخندق",
 "قدم الطفيل بن عمرو",
 "عن النبي صلى الله عليه وسلم أنه كان يدعو",
 "لله تسعة وتسعون اسما",
 "أخذ رسول الله صلى الله عليه وسلم بمنكبي",
 "خط النبي صلى الله عليه وسلم خطا مربعا",
 "خط النبي صلى الله عليه وسلم خطوطا",
 "أعذر الله إلى امرئ",
 "غدا على رسول الله صلى الله عليه وسلم",
 "أن رسول الله صلى الله عليه وسلم خرج يوما",
 "يا أيها الناس إن النبي صلى الله عليه وسلم كان يقول",
 "سألت النبي صلى الله عليه وسلم",
 "إن رسول الله صلى الله عليه وسلم صلى لنا",
 "أن أناسا من الأنصار سألوا رسول الله",
 "كان النبي صلى الله عليه وسلم يصلي",
 "أن معاوية كتب إلى المغيرة",
 "إن الله كتب الحسنات والسيئات",
 "جاء أعرابي إلى النبي صلى الله عليه وسلم",
 "كان رجال من الأعراب",
 "قال يا نبي الله",
 "سمعت رسول الله صلى الله عليه وسلم يخطب",
 "قام فينا النبي صلى الله عليه وسلم يخطب",
 "يقوم أحدهم في رشحه",
 "أن نبي الله صلى الله عليه وسلم كان يقول",
 "أصيب حارثة يوم بدر",
 null,
 "أن النبي صلى الله عليه وسلم ذكر النار",
 "أنه سمع رسول الله صلى الله عليه وسلم",
 "أم حارثة",
 "قلت يا رسول الله من أسعد الناس بشفاعتك",
 null,
 "أن النبي صلى الله عليه وسلم خرج يوما",
 "سمعت النبي صلى الله عليه وسلم وذكر الحوض",
 "حدثنا رسول الله صلى الله عليه وسلم وهو الصادق المصدوق",
 "سئل النبي صلى الله عليه وسلم عن أولاد المشركين",
 "كنت عند النبي صلى الله عليه وسلم إذ جاءه رسول",
 "نهى النبي صلى الله عليه وسلم عن النذر",
 "كتب معاوية إلى المغيرة",
 "سألت رسول الله صلى الله عليه وسلم عن الطاعون",
 "رأيت النبي صلى الله عليه وسلم يوم الخندق",
 "بعث رسول الله صلى الله عليه وسلم بعثا",
 "كانت يمين النبي صلى الله عليه وسلم"
];
kinds[43]="reference_only";
kinds[48]="reference_only";
const marks:any[]=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)if(starts[i]!==null)marks[i].start=loc(batch[i].text_original,starts[i] as string);
tail(25,"تابعه أبو حازم");
tail(32,"أو تنتفخ");
tail(33,"وكان ينهى");
tail(35,"تابعه الزبيدي");
tail(46,"غدوة في سبيل الله");
tail(48,"وقال ابن عباس");
tail(51,"قال آدم");
tail(55,"وقال ابن جريج");
fs.writeFileSync("data/hadith-split/marks-165.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-165.json");
