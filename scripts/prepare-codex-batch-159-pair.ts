import fs from "node:fs";

const all = JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-batch-159.json", "utf8"));
const rows = all.filter((r: any) => r.url.endsWith(":33b") || r.url.endsWith(":33c"));
const longOut = JSON.parse(fs.readFileSync("data/hadith-words-translations/codex-out-159-long.json", "utf8"))[0];
const short = rows.find((r: any) => r.url.endsWith(":33b"));
if (!short || !longOut) throw new Error("missing pair row");
const out = [
  { id: short.id, n: "33b", en: "Abu Bakr ibn Nafi al-Abdi narrated to me. Bahz narrated to us. Hammad narrated to us. Thabit narrated to us, from Anas, who said: Itban ibn Malik narrated to me that he became blind, so he sent to the Messenger of Allah, peace be upon him, and said: Come and mark out a mosque for me. The Messenger of Allah, peace be upon him, came, and his people came with him. One of them was described as a man called Malik ibn al-Dukhshum. Then he mentioned something like the hadith of Sulayman ibn al-Mughira.", de: "Abu Bakr ibn Nafi al-Abdi überlieferte mir. Bahz überlieferte uns. Hammad überlieferte uns. Thabit überlieferte uns, von Anas, der sagte: Itban ibn Malik überlieferte mir, dass er erblindete. Da sandte er zum Gesandten Allahs, Friede sei auf ihm, und sagte: Komm und markiere mir eine Moschee. Der Gesandte Allahs, Friede sei auf ihm, kam, und sein Volk kam mit ihm. Einer von ihnen wurde als ein Mann namens Malik ibn ad-Dukhshum beschrieben. Dann erwähnte er etwas Ähnliches wie den Hadith von Sulayman ibn al-Mughira." },
  longOut,
];
fs.writeFileSync("data/hadith-words-translations/codex-batch-159-pair.json", JSON.stringify(rows, null, 2) + "\n");
fs.writeFileSync("data/hadith-words-translations/codex-out-159-pair.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote 2 translations");
