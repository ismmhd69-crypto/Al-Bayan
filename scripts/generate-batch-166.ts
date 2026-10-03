import fs from "fs";
type Kind="prophet_words"|"companion_words"|"narration"|"dialogue"|"reference_only"|"unclear";
const batch:any[]=JSON.parse(fs.readFileSync("data/hadith-split/batch-166.json","utf8"));
const kinds:Kind[]=["prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","dialogue","prophet_words","dialogue","prophet_words","dialogue","dialogue","dialogue","dialogue","dialogue","prophet_words","narration","prophet_words","dialogue","dialogue","prophet_words","dialogue","prophet_words","prophet_words","dialogue","prophet_words","dialogue","prophet_words","dialogue","companion_words","prophet_words","dialogue","dialogue","prophet_words","dialogue","prophet_words","companion_words","prophet_words","prophet_words","dialogue","companion_words","prophet_words","reference_only","dialogue","companion_words","prophet_words","companion_words","prophet_words","prophet_words","dialogue","companion_words","prophet_words","prophet_words","prophet_words","prophet_words","dialogue"];
const starts:(string|null)[]=[
 "أن رسول الله صلى الله عليه وسلم أدرك عمر",
 "سئل النبي صلى الله عليه وسلم",
 "إن الله تجاوز لأمتي",
 "لا تؤاخذني بما نسيت",
 "شهدت النبي صلى الله عليه وسلم صلى يوم عيد",
 "كنا عند أبي موسى",
 "لما حضرت أبا طالب الوفاة",
 "قال رسول الله صلى الله عليه وسلم كلمة",
 "نهى النبي صلى الله عليه وسلم عن النذر",
 "يا رسول الله إني نذرت",
 "من الأنصار دبر مملوكا",
 "أرادت أن تشتري",
 "سئل أبو موسى عن ابنة",
 "قضى رسول الله صلى الله عليه وسلم في جنين",
 "أرادت أن تشتري جارية",
 "اشتريت بريرة",
 "اختصم سعد بن أبي وقاص",
 "إن رسول الله صلى الله عليه وسلم دخل",
 "دخل على رسول الله صلى الله عليه وسلم",
 "كلم النبي صلى الله عليه وسلم",
 "قطع النبي صلى الله عليه وسلم يد سارق",
 "بايعت رسول الله صلى الله عليه وسلم",
 "قدم رهط من عكل",
 "أتي رسول الله صلى الله عليه وسلم بيهودي",
 "لعن النبي صلى الله عليه وسلم المخنثين",
 "جاء إلى النبي صلى الله عليه وسلم",
 "أن رسول الله صلى الله عليه وسلم سئل",
 "قال سعد بن عبادة",
 "شهدت المتلاعنين",
 "قال النبي صلى الله عليه وسلم في حجة الوداع",
 "قتل جارية",
 "عض يد رجل",
 "قال رجل يا رسول الله",
 "بزنادقة",
 "قلت لسهل بن حنيف",
 "شكونا إلى رسول الله",
 "من الأنصار دبر مملوكا",
 "أن أبا بكر كتب له فريضة الصدقة",
 "ذكر للنبي صلى الله عليه وسلم",
 "أن رسول الله صلى الله عليه وسلم ذكر الوجع",
 "قال رأيت كأني في روضة",
 "رأيت الناس اجتمعوا",
 "نحن جلوس عند رسول الله",
 "نحن جلوس عند رسول الله",
 "كنت غلاما شابا",
 "رأيت امرأة سوداء",
 null,
 "أتى النبي صلى الله عليه وسلم",
 "سمعت الصادق المصدوق يقول",
 "بين يدى الساعة أيام الهرج",
 "أتينا أنس بن مالك",
 "استيقظ رسول الله صلى الله عليه وسلم ليلة",
 "سمع رسول الله صلى الله عليه وسلم",
 "نحن جلوس عند عمر",
 "قيل لأسامة",
 "بلغ النبي صلى الله عليه وسلم",
 "قام رسول الله صلى الله عليه وسلم في الناس",
 "عن النبي صلى الله عليه وسلم قال في الدجال",
 "حدثنا رسول الله صلى الله عليه وسلم يوما حديثا طويلا",
 "بعث النبي صلى الله عليه وسلم سرية"
];
kinds[46]="reference_only";
const marks:any[]=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)if(starts[i]!==null)marks[i].start=loc(batch[i].text_original,starts[i] as string);
tail(20,"تابعه محمد بن إسحاق");
tail(26,"قال ابن شهاب لا أدري");
tail(29,"رواه أبو بكر");
tail(50,"سمعته من نبيكم");
fs.writeFileSync("data/hadith-split/marks-166.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-166.json");
