import fs from "node:fs";
type Kind = "prophet_words" | "narration" | "companion_words" | "dialogue" | "reference_only" | "unclear";
const batch = JSON.parse(fs.readFileSync("data/hadith-split/batch-162.json", "utf8"));
const kinds: Kind[] = [
  "narration","prophet_words","dialogue","dialogue","dialogue","prophet_words","dialogue","prophet_words","dialogue","dialogue",
  "dialogue","dialogue","dialogue","prophet_words","dialogue","narration","prophet_words","dialogue","narration","prophet_words",
  "prophet_words","prophet_words","dialogue","dialogue","dialogue","prophet_words","dialogue","dialogue","narration","dialogue",
  "dialogue","dialogue","prophet_words","prophet_words","dialogue","prophet_words","dialogue","dialogue","narration","prophet_words",
  "companion_words","prophet_words","prophet_words","dialogue","narration","narration","dialogue","prophet_words","companion_words","prophet_words",
  "narration","narration","dialogue","companion_words","dialogue","narration","narration","narration","dialogue","prophet_words"
];
const starts = [
  "آلى رسول الله صلى الله عليه وسلم من نسائه",
  "أشار النبي صلى الله عليه وسلم بيده نحو اليمن",
  "قذف امرأته",
  "تزوج امرأة",
  "أخبرته عن أمها",
  "دخلت على زينب ابنة جحش حين توفي أخوها",
  "توفي زوجها",
  "نهى النبي صلى الله عليه وسلم",
  "جاءت هند بنت عتبة فقالت",
  "أتت النبي صلى الله عليه وسلم",
  "قالت يا رسول الله إن أبا سفيان",
  "قلت يا رسول الله هل لي من أجر",
  "هند يا رسول الله إن أبا سفيان",
  "أتي رسول الله صلى الله عليه وسلم بطعام",
  "أن خالد بن الوليد الذي يقال له سيف الله",
  "كان يأكل أكلا كثيرا",
  "كنت عند النبي صلى الله عليه وسلم فقال لرجل عنده",
  "أتي النبي صلى الله عليه وسلم بضب مشوي",
  "كنت يوما جالسا مع رجال من أصحاب النبي",
  "قيل لأنس ما سمعت النبي صلى الله عليه وسلم في الثوم",
  "أن النبي صلى الله عليه وسلم كان إذا رفع مائدته",
  "أن النبي صلى الله عليه وسلم كان إذا فرغ من طعامه",
  "قلت يا نبي الله إنا بأرض قوم أهل الكتاب",
  "أنه رأى رجلا يخذف",
  "سألت رسول الله",
  "يرمي الصيد فيقتفر",
  "فقلت إنا قوم نتصيد",
  "سمعت ربيعة بن يزيد الدمشقي",
  "أنه كان مع رسول الله صلى الله عليه وسلم حتى إذا كان ببعض طريق مكة",
  "ضحينا مع رسول الله صلى الله عليه وسلم أضحية ذات يوم",
  "أن جارية لكعب بن مالك كانت ترعى غنما",
  "قالوا للنبي صلى الله عليه وسلم",
  "مر النبي صلى الله عليه وسلم بعنز ميتة",
  "أنه دخل مع رسول الله صلى الله عليه وسلم بيت ميمونة",
  "يحدثه عن ميمونة",
  "سئل النبي صلى الله عليه وسلم عن فأرة",
  "قسم النبي صلى الله عليه وسلم بين أصحابه ضحايا",
  "قال النبي صلى الله عليه وسلم يوم النحر",
  "أن النبي صلى الله عليه وسلم أعطاه غنما",
  "شهدت النبي صلى الله عليه وسلم يوم النحر",
  "قالت الضحية كنا نملح منه",
  "رسول الله صلى الله عليه وسلم حديثا",
  "سئل رسول الله صلى الله عليه وسلم عن البتع",
  "نهى رسول الله صلى الله عليه وسلم عن الظروف",
  "أن رسول الله صلى الله عليه وسلم شرب لبنا",
  "أنه رأى رسول الله صلى الله عليه وسلم شرب لبنا",
  "أن رسول الله صلى الله عليه وسلم أتي بلبن",
  "أن رسول الله صلى الله عليه وسلم أتي بشراب فشرب منه",
  "فاستسقى",
  "خرجنا مع حذيفة وذكر النبي صلى الله عليه وسلم",
  "هذا الحديث قال قد رأيتني مع النبي صلى الله عليه وسلم",
  "أتيت النبي صلى الله عليه وسلم في مرضه",
  "قال لي ابن عباس ألا أريك امرأة من أهل الجنة",
  "لما قدم رسول الله صلى الله عليه وسلم المدينة",
  "كان يخدم النبي صلى الله عليه وسلم",
  "أن النبي صلى الله عليه وسلم دخل عليه ناس يعودونه",
  "قال أتيت النبي صلى الله عليه وسلم في مرضه",
  "أخبره أن النبي صلى الله عليه وسلم ركب",
  "مر بي النبي صلى الله عليه وسلم وأنا أوقد تحت القدر",
  "سمعت النبي صلى الله عليه وسلم وهو مستند"
];
const marks:any[] = batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:null as string|null,kind:kinds[i]}));
function cm(t:string){const c:string[]=[],m:number[]=[];for(let i=0;i<t.length;i++){if(/[\u064b-\u065f\u0670\u200e\u200f]/.test(t[i]))continue;c.push(t[i]);m.push(i)}return{c:c.join(""),m}}
const strip=(s:string)=>s.replace(/[\u064b-\u065f\u0670]/g,"");
function loc(t:string,n:string){const {c,m}=cm(t),p=c.indexOf(strip(n));if(p<0)throw new Error(`Could not locate: ${n}`);return t.slice(m[p],m[p]+Math.min(100,t.length-m[p]))}
function st(i:number,n:string){marks[i].start=loc(batch[i].text_original,n)}
function tail(i:number,n:string){marks[i].tail_start=loc(batch[i].text_original,n)}
for(let i=0;i<starts.length;i++)st(i,starts[i]);
tail(7,"قال أبو عبد الله");
tail(40,"وليست بعزيمة");
tail(50,"تابعه عمرو");
tail(50,"وقال حصين");
fs.writeFileSync("data/hadith-split/marks-162.json",JSON.stringify(marks,null,2)+"\n","utf8");
console.log("Wrote 60 marks to data/hadith-split/marks-162.json");
