import fs from 'node:fs';

const rows: any[] = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-current.json', 'utf8'));
const tr: Record<string, { en: string; de: string }> = {
  'https://sunnah.com/muslim:427a': {
    en: 'Khalaf ibn Hisham, Abu al-Rabi al-Zahrani, and Qutayba ibn Said all narrated from Hammad. Khalaf said: Hammad ibn Zayd narrated to us, from Muhammad ibn Ziyad. Abu Hurayra narrated to us that Muhammad (peace be upon him) said: Does the one who raises his head before the imam not fear that Allah will turn his head into the head of a donkey?',
    de: 'Khalaf ibn Hisham, Abu al-Rabi al-Zahrani und Qutayba ibn Said überlieferten alle von Hammad. Khalaf sagte: Hammad ibn Zayd überlieferte uns, von Muhammad ibn Ziyad. Abu Hurayra überlieferte uns, dass Muhammad (Friede sei auf ihm) sagte: Fürchtet derjenige, der seinen Kopf vor dem Imam hebt, nicht, dass Allah seinen Kopf in den Kopf eines Esels verwandelt?'
  },
  'https://sunnah.com/muslim:427b': {
    en: 'Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us. And Ibn Numayr narrated to us, from his father. All narrated from Ismail ibn Abi Khalid, from Qays ibn Abi Hazim, from Abu Hurayra, from the Prophet (peace be upon him), who said: What guarantee does the one who raises his head before the imam have that Allah will not transform his form into the form of a donkey?',
    de: 'Abu Bakr ibn Abi Shayba überlieferte uns. Waki überlieferte uns. Und Ibn Numayr überlieferte uns von seinem Vater. Alle überlieferten von Ismail ibn Abi Khalid, von Qays ibn Abi Hazim, von Abu Hurayra, vom Propheten (Friede sei auf ihm), der sagte: Welche Sicherheit hat derjenige, der seinen Kopf vor dem Imam hebt, dass Allah seine Gestalt nicht in die Gestalt eines Esels verwandelt?'
  },
  'https://sunnah.com/muslim:427c': {
    en: 'Abu Bakr ibn Abi Shayba narrated to us. Abd ibn Humayd narrated to us. Abd al-Razzaq narrated to us. Mamar narrated to us, from al-Zuhri, from Abu Salama, from Abu Hurayra, from the Prophet (peace be upon him), who said: Does the one who raises his head before the imam not fear that Allah will make his face the face of a donkey?',
    de: 'Abu Bakr ibn Abi Shayba überlieferte uns. Abd ibn Humayd überlieferte uns. Abd al-Razzaq überlieferte uns. Mamar überlieferte uns, von al-Zuhri, von Abu Salama, von Abu Hurayra, vom Propheten (Friede sei auf ihm), der sagte: Fürchtet derjenige, der seinen Kopf vor dem Imam hebt, nicht, dass Allah sein Gesicht zum Gesicht eines Esels macht?'
  },
  'https://sunnah.com/muslim:428': {
    en: 'Abu Hurayra narrated that the Messenger of Allah (peace be upon him) said: Let those people who raise their eyes toward the sky in prayer stop doing so, or their eyes will not return to them.',
    de: 'Abu Hurayra überlieferte, dass der Gesandte Allahs (Friede sei auf ihm) sagte: Diese Leute, die im Gebet ihre Augen zum Himmel erheben, sollen damit aufhören, sonst werden ihre Augen nicht zu ihnen zurückkehren.'
  },
  'https://sunnah.com/muslim:429': {
    en: 'Abu Hurayra narrated that the Messenger of Allah (peace be upon him) said: Let people stop raising their eyes toward the sky during supplication in prayer, or their eyes will be snatched away.',
    de: 'Abu Hurayra überlieferte, dass der Gesandte Allahs (Friede sei auf ihm) sagte: Die Menschen sollen aufhören, beim Bittgebet im Gebet ihre Augen zum Himmel zu erheben, sonst werden ihnen die Augen weggenommen.'
  },
  'https://sunnah.com/muslim:430a': {
    en: 'Jabir ibn Samura said: The Messenger of Allah (peace be upon him) came out to us and said: Why do I see you raising your hands like the tails of unruly horses? Be still in prayer. Then he came out to us and saw us in circles, so he said: Why do I see you in scattered groups? Then he came out to us and said: Will you not line up as the angels line up before their Lord? We said: O Messenger of Allah, how do the angels line up before their Lord? He said: They complete the front rows and stand close together in the row.',
    de: 'Jabir ibn Samura sagte: Der Gesandte Allahs (Friede sei auf ihm) kam zu uns heraus und sagte: Warum sehe ich euch eure Hände wie die Schwänze ungebärdiger Pferde erheben? Seid im Gebet ruhig. Dann kam er zu uns heraus und sah uns in Kreisen, worauf er sagte: Warum sehe ich euch in verstreuten Gruppen? Dann kam er zu uns heraus und sagte: Wollt ihr euch nicht aufreihen, wie sich die Engel vor ihrem Herrn aufreihen? Wir sagten: O Gesandter Allahs, wie reihen sich die Engel vor ihrem Herrn auf? Er sagte: Sie vervollständigen die vorderen Reihen und stehen in der Reihe dicht beieinander.'
  },
  'https://sunnah.com/muslim:430b': {
    en: 'Jabir ibn Samura said: The Messenger of Allah (peace be upon him) came out to us and said: Why do I see you raising your hands like the tails of unruly horses? Be still in prayer.',
    de: 'Jabir ibn Samura sagte: Der Gesandte Allahs (Friede sei auf ihm) kam zu uns heraus und sagte: Warum sehe ich euch eure Hände wie die Schwänze ungebärdiger Pferde erheben? Seid im Gebet ruhig.'
  }
};

const out = rows.filter(r => tr[r.url]).map(r => ({ ...r, ...tr[r.url] }));
if (out.length !== 7) throw new Error(`expected 7 got ${out.length}`);
fs.writeFileSync('data/hadith-words-translations/codex-batch-257-part.json', JSON.stringify(out, null, 2));
fs.writeFileSync('data/hadith-words-translations/codex-out-257-part.json', JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} staged translations`);
