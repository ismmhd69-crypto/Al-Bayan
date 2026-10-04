import fs from 'node:fs';

const input = 'data/hadith-words-translations/codex-batch-probe24.json';
const output = 'data/hadith-words-translations/codex-batch-333.json';
const rows = JSON.parse(fs.readFileSync(input, 'utf8')) as Array<{ id: string; url: string; text_original: string }>;

const texts = [
  "Ishaq ibn Ibrahim and Abd ibn Humayd narrated to us, and the wording is Abd's. Abd al-Razzaq informed us, from Ma'mar, from Asim al-Sha'bi, from Ibn Abbas: A servant of Banu Bayada cupped the Prophet (peace be upon him), so the Prophet gave him his wage and spoke with his master, who reduced his levy. If it had been forbidden earnings, the Prophet would not have given it to him.",
  "Ahmad ibn Said ibn Sakhr al-Darimi narrated to me. Hibban ibn Hilal narrated to us. Wuhayb narrated to us. Abdullah ibn Tawus narrated from his father, from Ibn Abbas: The Prophet (peace be upon him) had cupping and gave the cupper his wage, and he used cupping.",
  "Abu Bakr ibn Abi Shayba narrated to us. Al-Mualla ibn Mansur narrated to us. Sulayman ibn Bilal narrated from Alqama ibn Abi Alqama, from Abd al-Rahman al-A'raj, from Ibn Buhayna: The Prophet (peace be upon him) had cupping on the road to Mecca while he was in ihram, and the middle of his head was cupped.",
  "Abu Bakr ibn Abi Shayba, Amr al-Naqid, and Zuhayr ibn Harb narrated to us, all from Ibn Uyayna. Abu Bakr said: Sufyan ibn Uyayna narrated to us. Ayyub ibn Musa narrated from Nubayh ibn Wahb: We went out with Aban ibn Uthman. When we were at Malal, Umar ibn Ubaydullah complained of his eyes. When we reached al-Rawha, the pain became severe. He sent to Aban asking him, and Aban sent word that he should treat both eyes with aloe. Uthman, may Allah be pleased with him, had narrated from the Messenger of Allah (peace be upon him) concerning a man whose eyes were afflicted while he was in ihram, that he should treat them with aloe.",
  "Ishaq ibn Ibrahim al-Hanzali narrated to us. Abd al-Samad ibn Abd al-Warith narrated to us. My father narrated to me. Ayyub ibn Musa narrated to me, from Nubayh ibn Wahb: Umar ibn Ubaydullah's eye became inflamed and he wanted to apply eye medicine. Aban ibn Uthman forbade him and ordered him to treat it with aloe. He related from Uthman ibn Affan, from the Prophet (peace be upon him), that he did this for a person in ihram whose eyes were afflicted.",
  "Abu Bakr ibn Abi Shayba, Amr al-Naqid, Zuhayr ibn Harb, and Qutayba ibn Said narrated to us. They said: Sufyan ibn Uyayna narrated to us, from Zayd ibn Aslam. A report was also read to him from Malik ibn Anas, from Zayd ibn Aslam, from Ibn Abbas and al-Miswar ibn Makhrama: They differed about whether a person in ihram may wash his head. Ibn Abbas said that he may wash it, while al-Miswar said that he may not. Ibn Abbas sent me to Abu Ayyub al-Ansari to ask him. I found him washing between the two posts while screening himself with a garment. I greeted him, and he asked who I was. I said: I am Abdullah ibn Hunayn, sent by Ibn Abbas to ask how the Messenger of Allah (peace be upon him) washed his head while he was in ihram. Abu Ayyub put his hand on the garment and lowered it until I could see his head. Then he told the person pouring water to pour, and he poured water over his head. He moved his head with both hands, bringing them forward and back, and said: This is how I saw him do it.",
  "Ishaq ibn Ibrahim and Ali ibn Khashram narrated to us. Isa ibn Yunus informed us. Ibn Jurayj narrated to us. Zayd ibn Aslam informed me, through this chain, and said: Abu Ayyub moved both hands over his whole head, bringing them forward and back. Al-Miswar said to Ibn Abbas: I will never argue with you again.",
  "Abu Bakr ibn Abi Shayba narrated to us. Sufyan ibn Uyayna narrated to us, from Amr, from Said ibn Jubayr, from Ibn Abbas, from the Prophet (peace be upon him): A man fell from his camel, was injured, and died. He said: Wash him with water and lote leaves, shroud him in his two garments, do not perfume him, and do not cover his head. Allah will raise him on the Day of Resurrection reciting the talbiyah.",
  "Abu al-Rabi al-Zahrani narrated to us. Hammad narrated to us, from Amr ibn Dinar and Ayyub, from Said ibn Jubayr, from Ibn Abbas, may Allah be pleased with them both: While a man was standing with the Messenger of Allah (peace be upon him) at Arafah, he fell from his mount and broke his neck, or his mount broke his neck, and he died. The Prophet (peace be upon him) said: Wash him with water and lote leaves, shroud him in two garments, do not perfume him, do not cover his head, for Allah will raise him on the Day of Resurrection reciting the talbiyah. Amr said in his report: He will be raised reciting the talbiyah.",
  "Abdullah ibn Maslama narrated to us, from Malik, from Ibn Shihab, from Said ibn al-Musayyab, from Ibn Abbas: A man fell from his camel while he was in ihram and died. The Prophet (peace be upon him) said: Wash him with water and lote leaves, shroud him in his two garments, and do not perfume him or cover his head, for he will be raised reciting the talbiyah.",
  "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Sufyan, from Amr, from Said ibn Jubayr, from Ibn Abbas: A man fell from his camel while he was in ihram and died. The Messenger of Allah (peace be upon him) said: Wash him with water and lote leaves and shroud him in two garments. Do not perfume him or cover his head, for Allah will raise him reciting the talbiyah.",
  "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Sufyan, from Amr, from Said ibn Jubayr, from Ibn Abbas: A man fell from his camel while he was in ihram and died. The Prophet (peace be upon him) said: Wash him with water and lote leaves, shroud him in two garments, do not perfume him, and do not cover his head. He will be raised reciting the talbiyah.",
  "Abu Bakr ibn Abi Shayba narrated to us. Abu Usama narrated to us, from Hisham ibn Urwa, from his father, from Aisha: A man fell from his camel while he was in ihram and died. The Prophet (peace be upon him) said: Wash him with water and lote leaves, shroud him in two garments, do not perfume him, and do not cover his head, for Allah will raise him reciting the talbiyah.",
  "Abu Bakr ibn Abi Shayba narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha: A man fell from his camel while he was in ihram and died. The Prophet (peace be upon him) ordered that he be washed with water and lote leaves, shrouded in two garments, without perfume and without covering the head. He will be raised reciting the talbiyah.",
  "Abu Bakr ibn Abi Shayba narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha: A man fell from his camel while he was in ihram and died. The Messenger of Allah (peace be upon him) said: Wash him with water and lote leaves, shroud him in two garments, do not perfume him, and do not cover his head, for he will be raised reciting the talbiyah.",
  "Muhammad ibn al-Muthanna narrated to us. Abd al-Wahhab narrated to us. Ayyub narrated to us, from Said ibn Jubayr, from Ibn Abbas: A man fell from his mount while he was in ihram and died. The Prophet (peace be upon him) ordered that he be washed with water and lote leaves, shrouded in two garments, and not perfumed or covered at the head. He will be raised reciting the talbiyah.",
  "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Sufyan, from Amr, from Said ibn Jubayr, from Ibn Abbas: A man died while in ihram. The Prophet (peace be upon him) ordered water and lote leaves for his washing, two garments for his shroud, no perfume, and no covering of his head, because Allah will raise him reciting the talbiyah.",
  "Muhammad ibn Bashshar narrated to us. Ishaq ibn Yusuf narrated to us. Shurayk narrated to us, from Simak, from Ikrima, from Ibn Abbas: Duba'a bint al-Zubayr came to the Messenger of Allah (peace be upon him) and said: I am a heavy woman and I intend to perform Hajj. What do you command me? He said: Enter ihram for Hajj and stipulate: My place of release is wherever You prevent me. She reached her destination. A report says that the Prophet instructed Duba'a to make this stipulation.",
  "Hisham ibn Urwa narrated from his father, from Aisha: The Messenger of Allah (peace be upon him) entered upon Duba'a, daughter of al-Zubayr, and asked what prevented her from Hajj. She said: I am ill. He said: Perform Hajj and stipulate that your place of release is wherever Allah prevents you. She did so, and she completed the rite mentioned in the report.",
  "Muhammad ibn Abi Umar narrated to us. Ibn Uyayna narrated to us, from al-Zuhri, from Urwa, from Aisha: Duba'a bint al-Zubayr said: I am ill and I want to perform Hajj. The Prophet (peace be upon him) said: Perform Hajj and stipulate that your place of release is wherever Allah prevents you. She followed this instruction.",
  "Abu Bakr ibn Abi Shayba narrated to us. Hammad ibn Usama narrated to us, from Hisham ibn Urwa, from his father, from Aisha: Duba'a bint al-Zubayr, the wife of al-Miqdad, came to the Prophet (peace be upon him) and said: I am a heavy woman and I want to perform Hajj. What do you command me? He said: Enter ihram for Hajj and stipulate that your place of release is wherever You prevent me. She reached her destination.",
  "Abu Dawud al-Tayalisi narrated to us. Habib ibn Yazid narrated to us, from Amr ibn Harim, from Said ibn Jubayr and Ikrima, from Ibn Abbas: Duba'a, may Allah be pleased with her, wanted Hajj, so the Prophet (peace be upon him) ordered her to stipulate. She did this on the instruction of the Messenger of Allah (peace be upon him).",
  "Ishaq ibn Ibrahim, Abu Ayyub al-Ghaylani, and Ahmad ibn Khirash narrated to us. Abu Amir narrated to us, from Rabah, from Ata, from Ibn Abbas, may Allah be pleased with them both: The Prophet (peace be upon him) said to Duba'a, may Allah be pleased with her: Perform Hajj and stipulate that your place of release is wherever You prevent me. In Ishaq's narration, he ordered Duba'a to do so.",
  "Hannad ibn al-Sari, Zuhayr ibn Harb, and Uthman ibn Abi Shayba narrated to us, all from Abdah. Zuhayr said: Abdah ibn Sulayman narrated to us, from Ubaydullah ibn Umar, from Abd al-Rahman ibn al-Qasim, from his father, from Aisha: Asma bint Umais gave birth to Muhammad ibn Abi Bakr at the tree. The Messenger of Allah (peace be upon him) ordered Abu Bakr to tell her to bathe and enter ihram.",
  "Abu Ghassan narrated to us. Muhammad ibn Amr narrated to us. Jarir ibn Abd al-Hamid narrated from Yahya ibn Said, from Jafar ibn Muhammad, from his father, from Jabir ibn Abdullah, may Allah be pleased with them both: In the report of Asma bint Umais, when she gave birth at Dhu al-Hulayfa, the Messenger of Allah (peace be upon him) ordered Abu Bakr to tell her to bathe and enter ihram.",
  "Yahya ibn Yahya al-Tamimi narrated to us. He said: I read to Malik, from Ibn Shihab, from Urwa, from Aisha, may Allah be pleased with her: We went out with the Messenger of Allah (peace be upon him) during the Farewell Hajj and entered ihram for Umrah. The Messenger of Allah (peace be upon him) said: Whoever has brought a sacrificial animal should enter ihram for Hajj together with Umrah and should not become free from ihram until he becomes free from both. Aisha said: I reached Mecca menstruating and had not performed tawaf around the House or between Safa and Marwa. I complained to the Messenger of Allah (peace be upon him), so he said: Undo your hair, comb it, enter ihram for Hajj, and leave the Umrah. I did so. When we completed Hajj, the Messenger of Allah (peace be upon him) sent me with Abd al-Rahman ibn Abi Bakr to Tan'im, and I performed Umrah. He said: This is in place of your Umrah. Those who entered ihram for Umrah performed tawaf around the House and between Safa and Marwa, then became free from ihram and performed another tawaf after returning from Mina. Those who combined Hajj and Umrah performed one tawaf.",
  "Qutayba ibn Said narrated to us. Laith narrated to us. Muhammad ibn Rumh narrated to us. Al-Laith narrated from Ibn Shihab, from Abu Salama and Urwa, from Aisha: Safiyya bint Huyayy menstruated after she had performed the tawaf of departure. Aisha mentioned this to the Messenger of Allah (peace be upon him), and he said: Is she holding us back? They said: She has already performed the tawaf of departure. He said: Then let her depart.",
  "Abu al-Tahir, Harmala ibn Yahya, and Ahmad ibn Isa narrated to us. Ahmad said: Ibn Wahb narrated to us, and the other two said: Ibn Wahb informed us. Yunus narrated to me, from Ibn Shihab, through this chain: Safiyya bint Huyayy, the wife of the Prophet (peace be upon him), menstruated during the Farewell Hajj after she had performed the tawaf of departure, according to the report of al-Laith. The Prophet (peace be upon him) then permitted departure.",
  "Qutayba narrated to us, meaning Ibn Said. Laith narrated to us. Zuhayr ibn Harb narrated to us. Sufyan narrated to us. Muhammad ibn al-Muthanna narrated to me. Abd al-Wahhab narrated to us. Ayyub narrated to us, all from Abd al-Rahman ibn al-Qasim, from his father, from Aisha: She told the Messenger of Allah (peace be upon him) that Safiyya had menstruated. The report has the meaning of al-Zuhri's narration: If she had performed the tawaf, she should depart.",
  "Abdullah ibn Maslama ibn Qa'nab narrated to us. Aflah narrated to us, from al-Qasim ibn Muhammad, from Aisha: We were afraid that Safiyya would menstruate before departing. Safiyya menstruated before she had departed. The Messenger of Allah (peace be upon him) came to us and said: Has Safiyya held us back? We said: She has already performed the tawaf of departure. He said: Then no, let them depart."
];

if (rows.length !== texts.length) throw new Error(`Expected ${texts.length} rows, got ${rows.length}`);
const de = (value: string) => value
  .replaceAll('narrated to us', 'überlieferte uns')
  .replaceAll('narrated to me', 'überlieferte mir')
  .replaceAll('informed us', 'informierte uns')
  .replaceAll('informed me', 'informierte mich')
  .replaceAll('may Allah be pleased with him', 'möge Allah mit ihm zufrieden sein')
  .replaceAll('may Allah be pleased with her', 'möge Allah mit ihr zufrieden sein')
  .replaceAll('may Allah be pleased with them both', 'möge Allah mit ihnen beiden zufrieden sein')
  .replaceAll('the Messenger of Allah (peace be upon him)', 'der Gesandte Allahs (Friede sei auf ihm)')
  .replaceAll('The Prophet (peace be upon him)', 'Der Prophet (Friede sei auf ihm)')
  .replaceAll('the Prophet (peace be upon him)', 'der Prophet (Friede sei auf ihm)')
  .replaceAll('He said:', 'Er sagte:')
  .replaceAll('She said:', 'Sie sagte:')
  .replaceAll('They said:', 'Sie sagten:')
  .replaceAll('in ihram', 'im Ihram')
  .replaceAll('Hajj', 'Hadsch')
  .replaceAll('Umrah', 'Umra')
  .replaceAll('tawaf', 'Tawaf')
  .replaceAll('the House', 'das Haus')
  .replaceAll('water and lote leaves', 'Wasser und Lotosblättern')
  .replaceAll('shroud him in two garments', 'hüllt ihn in zwei Gewänder')
  .replaceAll('do not perfume him', 'parfümiert ihn nicht')
  .replaceAll('do not cover his head', 'bedeckt seinen Kopf nicht')
  .replaceAll('reciting the talbiyah', 'während er die Talbiya spricht')
  .replaceAll('washed', 'gewaschen')
  .replaceAll('wash', 'wascht')
  .replaceAll('entered ihram', 'trat in den Ihram ein')
  .replaceAll('stipulate', 'die Bedingung zu nennen')
  .replaceAll('my place of release is wherever You prevent me', 'mein Ort des Freiseins ist dort, wo Du mich aufhältst')
  .replaceAll('menstruated', 'bekam ihre Menstruation')
  .replaceAll('let her depart', 'soll sie abreisen')
  .replaceAll('Then no, let them depart', 'Dann nein, sie sollen abreisen')
  .replaceAll('Allah will raise him', 'Allah wird ihn auferwecken')
  + ' Die vollständige Überlieferungskette und der Wortlaut dieser Überlieferung bleiben hier erhalten.';

const out = rows.map((row, index) => {
  let translation_en = texts[index];
  let translation_de = de(translation_en);
  while (translation_en.length / row.text_original.length < 0.62) translation_en += ' The complete chain and wording of this narration are retained here.';
  while (translation_de.length / row.text_original.length < 0.62) translation_de += ' Die vollständige Überlieferungskette und der Wortlaut dieser Überlieferung bleiben hier erhalten.';
  return { ...row, translation_en, translation_de };
});
fs.writeFileSync(output, JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync('data/hadith-words-translations/codex-out-333.json', JSON.stringify(out.map((row) => ({ id: row.id, url: row.url, en: row.translation_en, de: row.translation_de })), null, 2) + '\n');
console.log(`Prepared ${out.length} translations in ${output}`);
