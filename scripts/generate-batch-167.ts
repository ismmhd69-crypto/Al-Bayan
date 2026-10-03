import fs from "fs";
type Kind="prophet_words"|"companion_words"|"narration"|"dialogue"|"reference_only"|"unclear";
const batch:any[]=JSON.parse(fs.readFileSync("data/hadith-split/batch-167.json","utf8"));
const kinds:Kind[]=["dialogue","prophet_words","dialogue","prophet_words","dialogue","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","dialogue","prophet_words","prophet_words","dialogue","dialogue","dialogue","prophet_words","companion_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","companion_words","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","dialogue","dialogue","prophet_words","prophet_words","dialogue","dialogue","prophet_words","prophet_words","dialogue","prophet_words","prophet_words","prophet_words","prophet_words","dialogue","prophet_words","dialogue","prophet_words"];
const starts:(string|null)[]=[
 "دخلت على النبي صلى الله عليه وسلم",
 "أتيْنا معقل بن يسار",
 "جاء رجل إلى رسول الله صلى الله عليه وسلم",
 "طلق امرأته",
 "جاءت هند بنت عتبة",
 "حين أذن لهم المسلمون",
 "قالت للنبي صلى الله عليه وسلم",
 "سمع خصومة",
 "سمع النبي صلى الله عليه وسلم جلبة خصام",
 "بعث رسول الله صلى الله عليه وسلم بعثا",
 "بعث النبي صلى الله عليه وسلم خالد بن الوليد",
 "خرج النبي صلى الله عليه وسلم في غداة",
 "كنا إذا بايعنا رسول الله صلى الله عليه وسلم",
 "قال لنا رسول الله صلى الله عليه وسلم",
 "جاء أعرابي إلى النبي صلى الله عليه وسلم",
 "أتت النبي صلى الله عليه وسلم امرأة",
 "كان النبي صلى الله عليه وسلم ينقل معنا التراب",
 "واصل النبي صلى الله عليه وسلم آخر الشهر",
 "أتينا النبي صلى الله عليه وسلم ونحن شببة",
 "صلى بنا النبي صلى الله عليه وسلم الظهر",
 "أن رسول الله صلى الله عليه وسلم انصرف",
 "أن النبي صلى الله عليه وسلم قال لأهل نجران",
 "ندب النبي صلى الله عليه وسلم يوم الخندق",
 "أن رسول الله صلى الله عليه وسلم قال لرجل",
 "حدثنا رسول الله صلى الله عليه وسلم",
 "خسفت الشمس",
 "أن النبي صلى الله عليه وسلم اتخذ حجرة",
 "كتب معاوية إلى المغيرة",
 "قال رجل يا نبي الله من أبي",
 "صنع النبي صلى الله عليه وسلم شيئا",
 "طلع له أحد",
 "حدثني النبي صلى الله عليه وسلم",
 "رسول الله صلى الله عليه وسلم طرقه",
 "إنكم تزعمون أن أبا هريرة",
 "أن امرأة أتت رسول الله صلى الله عليه وسلم",
 "أن رسول الله صلى الله عليه وسلم خطب الناس",
 "لما بعث النبي صلى الله عليه وسلم معاذا",
 "أن النبي صلى الله عليه وسلم كان يقول",
 "كان النبي صلى الله عليه وسلم يدعو من الليل",
 "قال للنبي صلى الله عليه وسلم",
 "كان رسول الله صلى الله عليه وسلم يعلم أصحابه الاستخارة",
 "أكثر ما كان النبي صلى الله عليه وسلم يحلف",
 "كان النبي صلى الله عليه وسلم إذا أخذ مضجعه",
 "سألت النبي صلى الله عليه وسلم قلت أرسل كلابي",
 "قالوا يا رسول الله إن هنا أقواما",
 "شهد النبي صلى الله عليه وسلم يوم النحر",
 "ذكر الدجال عند النبي صلى الله عليه وسلم",
 "قال النبي صلى الله عليه وسلم لرجل",
 "جاء زيد بن حارثة يشكو",
 "كان النبي صلى الله عليه وسلم يقول عند الكرب",
 "أن نبي الله صلى الله عليه وسلم كان يدعو",
 "سألت النبي صلى الله عليه وسلم عن قوله",
 "كنا جلوسا عند النبي صلى الله عليه وسلم",
 "خرج علينا رسول الله صلى الله عليه وسلم ليلة البدر",
 "أرسل إلى الأنصار",
 "كان النبي صلى الله عليه وسلم إذا تهجد من الليل",
 "جاء حبر إلى رسول الله صلى الله عليه وسلم",
 "حدثنا رسول الله صلى الله عليه وسلم",
 "جاء رجل إلى النبي صلى الله عليه وسلم",
 "وقف النبي صلى الله عليه وسلم على مسيلمة"
];
const marks:any[]=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)marks[i].start=loc(batch[i].text_original,starts[i] as string);
tail(17,"تابعه سليمان");
tail(22,"قال سفيان");
tail(30,"تابعه سهل");
tail(31,"وقال هارون");
tail(34,"زاد الحميدي");
tail(44,"تابعه محمد");
fs.writeFileSync("data/hadith-split/marks-167.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-167.json");
