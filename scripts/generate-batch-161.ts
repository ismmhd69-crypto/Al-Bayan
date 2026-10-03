import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-161.json", "utf8"));
const kinds: Kind[] = [
  "companion_words","prophet_words","narration","companion_words","dialogue","prophet_words","prophet_words","dialogue","prophet_words","narration",
  "dialogue","dialogue","dialogue","dialogue","dialogue","narration","prophet_words","prophet_words","narration","prophet_words",
  "dialogue","dialogue","prophet_words","prophet_words","narration","prophet_words","dialogue","narration","dialogue","prophet_words",
  "prophet_words","prophet_words","dialogue","prophet_words","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue",
  "prophet_words","dialogue","dialogue","prophet_words","narration","dialogue","dialogue","companion_words","dialogue","dialogue",
  "prophet_words","companion_words","dialogue","prophet_words","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue"
];
const starts = [
  "قالت ما رأيت رسول الله صلى الله عليه وسلم ضاحكا",
  "قام النبي صلى الله عليه وسلم حتى تورمت قدماه",
  "أن نبي الله صلى الله عليه وسلم كان يقوم من الليل",
  "بينما رجل من أصحاب النبي صلى الله عليه وسلم يقرأ",
  "أن النبي صلى الله عليه وسلم افتقد ثابت بن قيس",
  "يقال لجهنم هل امتلأت",
  "كنا جلوسا ليلة مع النبي",
  "شكوت إلى رسول الله صلى الله عليه وسلم أني أشتكي",
  "انشق القمر ونحن مع النبي",
  "كنا جلوسا عند النبي",
  "كنت في غزاة فسمعت عبد الله",
  "كنت مع عمي فسمعت عبد الله",
  "لما قال عبد الله",
  "كنت مع عمي فسمعت عبد الله",
  "طلق امرأته",
  "كان رسول الله صلى الله عليه وسلم يشرب عسلا",
  "يا أيها المدثر",
  "فبينا أنا أمشي إذ سمعت صوتا",
  "رأيت رسول الله صلى الله عليه وسلم قال بإصبعيه",
  "قال رسول الله صلى الله عليه وسلم وهو يحدث عن فترة الوحى",
  "\u0641\u0631\u062c\u0639 \u0627\u0644\u0646\u0628\u064a \u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645 \u0625\u0644\u0649 \u062e\u062f\u064a\u062c\u0629",
  "قال أبو جهل لئن رأيت محمدا يصلي",
  "سئل النبي صلى الله عليه وسلم عن الحمر",
  "لما عرج بالنبي صلى الله عليه وسلم إلى السماء",
  "ما صلى النبي صلى الله عليه وسلم صلاة بعد أن نزلت عليه",
  "كان رسول الله صلى الله عليه وسلم يكثر أن يقول",
  "أتى النبي صلى الله عليه وسلم",
  "كان رجل يقرأ سورة الكهف",
  "أن رسول الله صلى الله عليه وسلم كان يسير في بعض أسفاره",
  "سمع النبي صلى الله عليه وسلم رجلا يقرأ في المسجد",
  "سمع رسول الله صلى الله عليه وسلم رجلا يقرأ في سورة",
  "سمع النبي صلى الله عليه وسلم قارئا يقرأ من الليل",
  "عن النبي صلى الله عليه وسلم قال له",
  "أن من قرأ بالآيتين",
  "أنه سمع رجلا",
  "جاء ثلاثة رهط إلى بيوت أزواج النبي",
  "قلت يا رسول الله أرأيت لو نزلت واديا",
  "أن النبي صلى الله عليه وسلم خطب عائشة إلى أبي بكر",
  "دخل عليها وعندها رجل",
  "قال تزوجت امرأة",
  "كنا في جيش فأتانا رسول الله",
  "يا رسول الله إن البكر تستحي",
  "جاء النبي صلى الله عليه وسلم فدخل حين بني على",
  "أن النبي صلى الله عليه وسلم قال لرجل",
  "أبصر النبي صلى الله عليه وسلم نساء وصبيانا مقبلين",
  "آلى رسول الله صلى الله عليه وسلم من نسائه",
  "أن عكرمة بن عبد الرحمن",
  "تذاكرنا عند أبي الضحى",
  "زوجت ابنتها",
  "أصبنا سبيا فكنا نعزل",
  "أن رسول الله صلى الله عليه وسلم كان يسأل في مرضه",
  "قالت تزوجني الزبير",
  "كان النبي صلى الله عليه وسلم عند بعض نسائه",
  "سمعت رسول الله صلى الله عليه وسلم يقول وهو على المنبر",
  "جاءت امرأة من الأنصار إلى النبي",
  "خرجت سودة بنت زمعة ليلا",
  "سألت الزهري أى أزواج النبي صلى الله عليه وسلم استعاذت",
  "طلق امرأته ثلاثا",
  "من أسلم أتى النبي صلى الله عليه وسلم",
  "تردين حديقته"
];
const marks:any[] = batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function st(i:number,n:string){marks[i].start=loc(batch[i].text_original,n)}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)st(i,starts[i]);
tail(12,"وقال ابن أبي زائدة");
tail(17,"وهى الأوثان");
tail(20,"فذكر الحديث");
tail(21,"تابعه عمرو بن خالد");
tail(25,"يتأول القرآن");
tail(26,"قال أبي");
tail(36,"تعني أن");
tail(39,"وأشار إسماعيل");
tail(53,"هكذا قال");
tail(56,"قال أبو عبد الله");
tail(59,"وقال إبراهيم");
fs.writeFileSync("data/hadith-split/marks-161.json",JSON.stringify(marks,null,2)+"\n","utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-161.json");
