import fs from "fs";
type Kind = "prophet_words"|"companion_words"|"narration"|"dialogue"|"reference_only"|"unclear";
const batch:any[]=JSON.parse(fs.readFileSync("data/hadith-split/batch-164.json","utf8"));
const kinds:Kind[]=["dialogue","companion_words","dialogue","prophet_words","dialogue","prophet_words","prophet_words","dialogue","dialogue","companion_words","dialogue","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","dialogue","dialogue","prophet_words","dialogue","prophet_words","narration","dialogue","prophet_words","dialogue","prophet_words","prophet_words","dialogue","dialogue","dialogue","prophet_words","prophet_words","dialogue","dialogue","prophet_words","narration","prophet_words","dialogue","prophet_words","prophet_words","narration","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words"];
const starts=[
 "جاءت امرأة إلى النبي",
 "لم يكن رسول الله صلى الله عليه وسلم فاحشا",
 "قسم رسول الله صلى الله عليه وسلم قسمة",
 "سمع النبي صلى الله عليه وسلم رجلا",
 "أن رسول الله صلى الله عليه وسلم حين ذكر",
 "دخل على النبي صلى الله عليه وسلم يوما",
 "يدنو أحدكم من ربه",
 "لم أعقل",
 "رفاعة",
 "ما حجبني النبي صلى الله عليه وسلم",
 "جاء إلى النبي صلى الله عليه وسلم",
 "قسم النبي صلى الله عليه وسلم قسمة",
 "صنع النبي صلى الله عليه وسلم شيئا",
 "فناداهم رسول الله صلى الله عليه وسلم",
 "أتى رجل النبي صلى الله عليه وسلم",
 "بينا النبي صلى الله عليه وسلم يصلي",
 "جاءت أم سليم إلى رسول الله صلى الله عليه وسلم",
 "إن كان النبي صلى الله عليه وسلم ليخالطنا",
 "أن النبي صلى الله عليه وسلم أهديت له أقبية",
 "بينما النبي صلى الله عليه وسلم يمشي",
 "إن أخا لكم",
 "أن النبي صلى الله عليه وسلم قال لحسان",
 "إن أفلح أخا أبي القعيس",
 "أثنى رجل على رجل",
 "قيل للنبي صلى الله عليه وسلم",
 "سمعته يقول",
 "ولد لرجل منا غلام",
 "ولد لرجل منا غلام",
 "ولد لرجل منا غلام",
 "لما رفع النبي صلى الله عليه وسلم رأسه",
 "كان النبي صلى الله عليه وسلم أحسن الناس خلقا",
 "وما سماه أبو تراب",
 "أخنع اسم عند الله",
 "يا رسول الله هل نفعت أبا طالب",
 "كان بالمدينة فزع",
 "نهى النبي صلى الله عليه وسلم عن الخذف",
 "عطس رجلان عند النبي صلى الله عليه وسلم",
 "عطس رجلان عند النبي صلى الله عليه وسلم",
 "أردف رسول الله صلى الله عليه وسلم الفضل",
 "كنا إذا صلينا مع النبي صلى الله عليه وسلم",
 "سأل النبي صلى الله عليه وسلم",
 "اطلع رجل من جحر",
 "دخلت مع رسول الله صلى الله عليه وسلم",
 "أن النبي صلى الله عليه وسلم قال لها",
 "أن النبي صلى الله عليه وسلم ركب حمارا",
 "ثم دعا بكتاب رسول الله صلى الله عليه وسلم",
 "قسم النبي صلى الله عليه وسلم يوما",
 "احترق بيت بالمدينة",
 "أن النبي صلى الله عليه وسلم أوصى رجلا",
 "بت عند ميمونة",
 "كان النبي صلى الله عليه وسلم إذا قام من الليل",
 "كان النبي صلى الله عليه وسلم إذا دخل الخلاء",
 "أنه قال للنبي صلى الله عليه وسلم علمني دعاء",
 "كنا نقول في الصلاة",
 "أن رسول الله صلى الله عليه وسلم كان يقول",
 "قالت أم سليم للنبي صلى الله عليه وسلم",
 "سمع النبي صلى الله عليه وسلم رجلا",
 "قسم النبي صلى الله عليه وسلم قسما",
 "بينا النبي صلى الله عليه وسلم يخطب",
 "قالت أمي يا رسول الله"
];
const marks:any[]=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)marks[i].start=loc(batch[i].text_original,starts[i]);
tail(18,"رواه حماد بن زيد");
tail(20,"تابعه عقيل");
tail(24,"تابعه أبو معاوية");
tail(25,"أظنه يوم أحد");
tail(32,"قال سفيان يقول غيره");
tail(49,"قال كريب");
tail(52,"وقال عمرو عن يزيد");
tail(54,"وقال شعبة عن منصور");
fs.writeFileSync("data/hadith-split/marks-164.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-164.json");
