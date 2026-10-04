import fs from 'node:fs';

type Row = { id: string; url: string; text_original: string };

const input = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-current.json', 'utf8')) as Row[];
const translations: Record<string, [string, string]> = {
  'https://sunnah.com/muslim:572b': [
    "Abu Kurayb narrated to us. Ibn Bishr narrated to us. H He said: Muhammad ibn Hatim narrated to me. Waki' narrated to us, both of them from Mis'ar, from Mansur, with this chain. In Ibn Bishr's narration: 'Let him seek what is more likely to be correct.' In Waki's narration: 'Let him seek the correct answer.'",
    "Abu Kurayb überlieferte uns. Ibn Bishr überlieferte uns. H Er sagte: Muhammad ibn Hatim überlieferte mir. Waki' überlieferte uns, beide von Mis'ar, von Mansur, mit dieser Überliefererkette. In der Überlieferung von Ibn Bishr heißt es: „Er soll das suchen, was eher richtig ist.“ In der Überlieferung von Waki' heißt es: „Er soll die richtige Antwort suchen.“"
  ],
  'https://sunnah.com/muslim:572c': [
    "Abdullah ibn Abd al-Rahman al-Darimi narrated to us. Yahya ibn Hassan informed us. Wuhaib ibn Khalid narrated to us. Mansur narrated to us with this chain, and Mansur said: 'Let him seek what is more likely to be correct.'",
    "Abdullah ibn Abd al-Rahman al-Darimi überlieferte uns. Yahya ibn Hassan berichtete uns. Wuhaib ibn Khalid überlieferte uns. Mansur überlieferte uns mit dieser Überliefererkette, und Mansur sagte: „Er soll das suchen, was eher richtig ist.“"
  ],
  'https://sunnah.com/muslim:572d': [
    "Ishaq ibn Ibrahim narrated to us. Ubayd ibn Sa'id al-Umawi informed us. Sufyan narrated to us, from Mansur, with this chain, and he said: 'Let him seek the correct answer.'",
    "Ishaq ibn Ibrahim überlieferte uns. Ubayd ibn Sa'id al-Umawi berichtete uns. Sufyan überlieferte uns, von Mansur, mit dieser Überliefererkette, und er sagte: „Er soll die richtige Antwort suchen.“"
  ],
  'https://sunnah.com/muslim:572e': [
    "Muhammad ibn al-Muthanna narrated to us. Muhammad ibn Ja'far narrated to us. Shu'ba narrated to us, from Mansur, with this chain, and he said: 'Let him seek the answer closest to what is correct.'",
    "Muhammad ibn al-Muthanna überlieferte uns. Muhammad ibn Ja'far überlieferte uns. Shu'ba überlieferte uns, von Mansur, mit dieser Überliefererkette, und er sagte: „Er soll die Antwort suchen, die dem Richtigen am nächsten ist.“"
  ],
  'https://sunnah.com/muslim:572f': [
    "Yahya ibn Yahya narrated to us. Fudayl ibn Iyad informed us, from Mansur, with this chain, and he said: 'Let him seek what appears to him to be correct.'",
    "Yahya ibn Yahya überlieferte uns. Fudayl ibn Iyad berichtete uns, von Mansur, mit dieser Überliefererkette, und er sagte: „Er soll das suchen, was ihm richtig erscheint.“"
  ],
  'https://sunnah.com/muslim:572g': [
    "Ibn Abi Umar narrated to us. Abd al-Aziz ibn Abd al-Samad narrated to us, from Mansur, with the chain of these narrators, and he said: 'Let him seek the correct answer.'",
    "Ibn Abi Umar überlieferte uns. Abd al-Aziz ibn Abd al-Samad überlieferte uns, von Mansur, mit der Überliefererkette dieser Überlieferer, und er sagte: „Er soll die richtige Antwort suchen.“"
  ],
  'https://sunnah.com/muslim:572h': [
    "Ubaydullah ibn Mu'adh al-Anbari narrated to us. My father narrated to us. Shu'ba narrated to us, from al-Hakam, from Ibrahim, from Alqama, from Abdullah: The Prophet (peace be upon him) prayed the noon prayer as five units. When he said the taslim, he was told: 'Has something been added to the prayer?' He said: 'What is that?' They said: 'You prayed five.' So he performed two prostrations.",
    "Ubaydullah ibn Mu'adh al-Anbari überlieferte uns. Mein Vater überlieferte uns. Shu'ba überlieferte uns, von al-Hakam, von Ibrahim, von Alqama, von Abdullah: Der Prophet (Friede sei auf ihm) verrichtete das Mittagsgebet mit fünf Gebetseinheiten. Als er den Taslim sprach, wurde ihm gesagt: „Wurde dem Gebet etwas hinzugefügt?“ Er sagte: „Was ist das?“ Sie sagten: „Du hast fünf Gebetseinheiten verrichtet.“ Darauf führte er zwei Niederwerfungen aus."
  ],
  'https://sunnah.com/muslim:572i': [
    "Ibn Numayr narrated to us. Ibn Idris narrated to us, from al-Hasan ibn Ubaydullah, from Ibrahim, from Alqama, that he prayed with them five units.",
    "Ibn Numayr überlieferte uns. Ibn Idris überlieferte uns, von al-Hasan ibn Ubaydullah, von Ibrahim, von Alqama, dass er mit ihnen fünf Gebetseinheiten verrichtete."
  ],
  'https://sunnah.com/muslim:572j': [
    "Uthman ibn Abi Shayba narrated to us, and this is his wording. Jarir narrated to us, from al-Hasan ibn Ubaydullah, from Ibrahim ibn Suwayd. He said: Alqama led us in the noon prayer for five units. When he said the taslim, the people said: 'Abu Shibl, you prayed five.' He said: 'No, I did not.' They said: 'Indeed, you did.' He said: 'I was at the side of the people, and I was a boy, so I said: "Indeed, you prayed five." He said to me: "You too, O one-eyed man, say that?" I said: "Yes." He then turned away and performed two prostrations, then said the taslim. Then Abdullah said: The Messenger of Allah (peace be upon him) led us in five units. When he turned away, the people became confused among themselves, so he said: "What is the matter with you?" They said: "Messenger of Allah, has something been added to the prayer?" He said: "No." They said: "You prayed five." So he turned away, then performed two prostrations, then said the taslim, then said: "I am only a human being like you. I forget just as you forget. When one of you forgets, let him perform two prostrations." Ibn Numayr added in his narration: "If one of you forgets, let him perform two prostrations."",
    "Uthman ibn Abi Shayba überlieferte uns, und dies ist seine Fassung. Jarir überlieferte uns, von al-Hasan ibn Ubaydullah, von Ibrahim ibn Suwayd. Er sagte: Alqama leitete uns im Mittagsgebet mit fünf Gebetseinheiten. Als er den Taslim sprach, sagten die Leute: „Abu Shibl, du hast fünf Gebetseinheiten verrichtet.“ Er sagte: „Nein, das habe ich nicht.“ Sie sagten: „Doch, das hast du.“ Er sagte: „Ich war an der Seite der Leute und war noch ein Junge, da sagte ich: ‚Doch, du hast fünf Gebetseinheiten verrichtet.‘ Er sagte zu mir: ‚Auch du, du Einäugiger, sagst das?‘ Ich sagte: ‚Ja.‘“ Darauf wandte er sich ab, führte zwei Niederwerfungen aus und sprach dann den Taslim. Danach sagte Abdullah: Der Gesandte Allahs (Friede sei auf ihm) leitete uns mit fünf Gebetseinheiten. Als er sich abwandte, gerieten die Leute untereinander in Verwirrung, da sagte er: „Was ist mit euch?“ Sie sagten: „Gesandter Allahs, wurde dem Gebet etwas hinzugefügt?“ Er sagte: „Nein.“ Sie sagten: „Du hast fünf Gebetseinheiten verrichtet.“ Darauf wandte er sich ab, führte zwei Niederwerfungen aus, sprach dann den Taslim und sagte: „Ich bin nur ein Mensch wie ihr. Ich vergesse, wie ihr vergesst. Wenn einer von euch vergisst, soll er zwei Niederwerfungen ausführen.“ Ibn Numayr fügte in seiner Überlieferung hinzu: „Wenn einer von euch vergisst, soll er zwei Niederwerfungen ausführen.“"
  ],
  'https://sunnah.com/muslim:572k': [
    "Awn ibn Sallam al-Kufi narrated to us. Abu Bakr al-Nahshali informed us, from Abd al-Rahman ibn al-Aswad, from his father, from Abdullah. He said: The Messenger of Allah (peace be upon him) led us in five units. We said: 'Messenger of Allah, has something been added to the prayer?' He said: 'What is that?' They said: 'You prayed five.' He said: 'I am only a human being like you. I remember as you remember and I forget as you forget.' Then he performed the two prostrations of forgetfulness.",
    "Awn ibn Sallam al-Kufi überlieferte uns. Abu Bakr al-Nahshali berichtete uns, von Abd al-Rahman ibn al-Aswad, von seinem Vater, von Abdullah. Er sagte: Der Gesandte Allahs (Friede sei auf ihm) leitete uns mit fünf Gebetseinheiten. Wir sagten: „Gesandter Allahs, wurde dem Gebet etwas hinzugefügt?“ Er sagte: „Was ist das?“ Sie sagten: „Du hast fünf Gebetseinheiten verrichtet.“ Er sagte: „Ich bin nur ein Mensch wie ihr. Ich erinnere mich, wie ihr euch erinnert, und ich vergesse, wie ihr vergesst.“ Dann führte er die beiden Niederwerfungen wegen des Vergessens aus."
  ]
};

if (input.length < 10) throw new Error(`Expected at least 10 rows, got ${input.length}`);
const output = input.slice(0, 10).map((row) => {
  const t = translations[row.url];
  if (!t) throw new Error(`Missing translation for ${row.url}`);
  return { id: row.id, url: row.url, en: t[0], de: t[1] };
});
fs.writeFileSync('data/hadith-words-translations/codex-out-268-part.json', JSON.stringify(output, null, 2) + '\n');
console.log(`translated=${output.length}`);
