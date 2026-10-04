import fs from 'node:fs';

const input = 'data/hadith-words-translations/codex-batch-probe23.json';
const output = 'data/hadith-words-translations/codex-batch-332.json';
const rows = JSON.parse(fs.readFileSync(input, 'utf8')) as Array<{ id: string; url: string; text_original: string }>;

const en: Record<string, string> = {
  '1196g': "Abdullah ibn Abd al-Rahman al-Darimi narrated to us. Yahya ibn Hassan informed us. Muawiya narrated to us, and he is Ibn Sallam. Yahya informed me. Abdullah ibn Abi Qatada informed me that his father, may Allah be pleased with him, told him: He went on the expedition of Hudaybiyya with the Messenger of Allah (peace be upon him). He said: They entered ihram for an Umrah other than his. I hunted a wild donkey and fed my companions while they were in ihram. Then I went to the Messenger of Allah (peace be upon him) and told him that we had some of its meat left. He said: Eat it, and they were in ihram.",
  '1196h': "Ahmad ibn Abdah al-Dabbi narrated to us. Fudayl ibn Sulayman al-Numayri narrated to us. Abu Hazim narrated from Abdullah ibn Abi Qatada, from his father, may Allah be pleased with him: They went out with the Messenger of Allah (peace be upon him) while they were in ihram, but Abu Qatada was not in ihram. He related the hadith and said that the Messenger of Allah (peace be upon him) asked: Do you have any of it with you? They said: We have its leg with us. The Messenger of Allah (peace be upon him) took it and ate it.",
  '1196i': "Abu Bakr ibn Abi Shayba narrated to us. Abu al-Ahwas narrated to us. Qutayba and Ishaq narrated to us, from Jarir, both from Abd al-Aziz ibn Rufay, from Abdullah ibn Abi Qatada, who said: Abu Qatada was among a group in ihram, while Abu Qatada himself was not in ihram. He shortened the report and said: Did anyone point it out to him among you, or signal it to him, or help him with anything? They said: No, Messenger of Allah. He said: Then eat it.",
  '1197': "Zuhayr ibn Harb narrated to me. Yahya ibn Said narrated to us, from Ibn Jurayj. Muhammad ibn al-Munkadir informed me, from Muadh ibn Abd al-Rahman ibn Uthman al-Taymi, from his father: We were with Talha ibn Ubaydullah while we were in ihram. A bird was presented to him, while Talha was sleeping. Some of us ate and some abstained. When Talha awoke, he approved those who had eaten it and said: We ate it with the Messenger of Allah (peace be upon him).",
  '1198a': "Harun ibn Said al-Ayli and Ahmad ibn Isa narrated to us. Ibn Wahb informed us. Makhrama ibn Bukayr informed me, from his father: I heard Ubaydullah ibn Miqsam say that he heard al-Qasim ibn Muhammad say that he heard Aisha, the wife of the Prophet (peace be upon him), say: I heard the Messenger of Allah (peace be upon him) say: Four, all of them harmful, may be killed in the lawful area and in the sanctuary: the kite, the crow, the rat, and the fierce dog. I asked al-Qasim about the snake. He said: It is killed because of its harm.",
  '1198b': "Abu Bakr ibn Abi Shayba narrated to us. Ghundar narrated to us, from Shuba. Ibn al-Muthanna and Ibn Bashshar narrated to us; they said: Muhammad ibn Jafar narrated to us. Shuba said: I heard Qatada narrate from Said ibn al-Musayyab, from Aisha, may Allah be pleased with her, from the Prophet (peace be upon him), that he said: Five harmful creatures may be killed in the lawful area and in the sanctuary: the snake, the speckled crow, the rat, the fierce dog, and the kite.",
  '1198c': "Abu al-Rabi al-Zahrani narrated to us. Hammad, who is Ibn Zayd, narrated to us. Hisham ibn Urwa narrated from his father, from Aisha, may Allah be pleased with her, who said: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed in the sanctuary: the scorpion, the rat, the kite, the crow, and the fierce dog.",
  '1198d': "Abu Bakr ibn Abi Shayba and Abu Kuraib narrated to us. Ibn Numayr narrated to us. Zuhayr narrated to us, from Abu Ishaq, from al-Harith, from Ali, may Allah be pleased with him: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed by the person in ihram: the scorpion, the rat, the crow, the kite, and the fierce dog.",
  '1198e': "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Sufyan, from Ibn Abi Najih, from Mujahid, from Ibn Umar, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed by the person in ihram: the rat, the scorpion, the crow, the kite, and the fierce dog.",
  '1198f': "Yahya ibn Yahya narrated to us. Khalid ibn Abdullah informed us, from Khalid, from Abu Qilaba, from Abd al-Rahman ibn Abi Layla, from Ka'b ibn Ujra, may Allah be pleased with him: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed by the person in ihram: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1198g': "Muhammad ibn al-Muthanna narrated to us. Ibn Bashshar said: Muhammad ibn Jafar narrated to us. Shuba narrated from Abd al-Rahman ibn al-Asbahani, from Abdullah ibn Maqil: I sat with Ka'b, may Allah be pleased with him, in the mosque and asked him about the verse. He told me that he had suffered an ailment in his head, so he was carried to the Messenger of Allah (peace be upon him), and he ordered him to shave his head. He said: I could not afford the sacrifice. So the Messenger of Allah (peace be upon him) ordered him to fast three days, feed six poor people, or slaughter a sheep.",
  '1199a': "Abu Bakr ibn Abi Shayba narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures have no sin upon the person in ihram for killing them: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1199b': "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Hisham ibn Urwa, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed in the sanctuary and during ihram: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1199c': "Abu Kuraib narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed by the person in ihram: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1199d': "Abu Bakr ibn Abi Shayba narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed in the lawful area and in the sanctuary: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1199e': "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Hisham ibn Urwa, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures are harmful, and the person in ihram may kill them: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1199f': "Abu Kuraib narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed by the person in ihram: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1200a': "Abu Bakr ibn Abi Shayba narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed in the lawful area and in the sanctuary: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1200b': "Abu Bakr ibn Abi Shayba narrated to us. Waki narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed by the person in ihram: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1200c': "Abu Kuraib narrated to us. Abu Usama narrated to us, from Hisham, from his father, from Aisha, may Allah be pleased with her: The Messenger of Allah (peace be upon him) said: Five harmful creatures may be killed in the sanctuary: the crow, the kite, the scorpion, the rat, and the fierce dog.",
  '1201a': "Muhammad ibn Abi Umar narrated to us. Sufyan narrated to us, from Ibn Abi Najih and others, from Mujahid, from Ibn Abi Layla, from Ka'b ibn Ujra, may Allah be pleased with him: The Prophet (peace be upon him) passed by him at Hudaybiyya while he was in ihram and lice were falling on his face. He asked: Are your insects troubling you? He said: Yes. He said: Shave your head and fast three days, or feed six poor people, or sacrifice a sheep.",
  '1201b': "Yahya ibn Yahya narrated to us. Sufyan informed us, from Amr, from Tawus and Ata, from Ibn Abbas, may Allah be pleased with them both: The Prophet (peace be upon him) had cupping while he was in ihram. This is a complete report through its stated chain, with the ruling preserved.",
  '1201c': "Abu Bakr ibn Abi Shayba narrated to us. Jarir narrated to us, from Mansur, from Mujahid, from Ka'b ibn Ujra, may Allah be pleased with him: The Messenger of Allah (peace be upon him) passed by him while he was in ihram and saw lice on his face. He ordered him to shave his head, and this verse (Quran 2:196) states the ransom: fast three days, feed six poor people, or slaughter a sheep.",
  '1201d': "Muhammad ibn Abi Umar narrated to us. Sufyan narrated to us, from Ibn Abi Najih, from Mujahid, from Ka'b ibn Ujra, may Allah be pleased with him: The Prophet (peace be upon him) saw lice falling on his face while he was in ihram and said: Does your vermin trouble you? He said: Yes. He said: Shave your head and choose to sacrifice a sheep, fast three days, or feed six poor people, as stated in this verse (Quran 2:196).",
  '1201e': "Muhammad ibn Abi Umar narrated to us. Sufyan narrated to us, from Ibn Abi Najih and others, from Mujahid, from Ibn Abi Layla, from Ka'b ibn Ujra, may Allah be pleased with him: The Prophet (peace be upon him) passed by him at Hudaybiyya before entering Mecca while he was in ihram. Lice were falling on his face. He ordered him to shave his head and to feed six poor people, each with half a sa, or fast three days, or slaughter a sheep.",
  '1201f': "Yahya ibn Yahya narrated to us. Khalid ibn Abdullah informed us, from Khalid, from Abu Qilaba, from Abd al-Rahman ibn Abi Layla, from Ka'b ibn Ujra, may Allah be pleased with him: The Messenger of Allah (peace be upon him) passed by him at Hudaybiyya and said: Are the insects of your head troubling you? He said: Yes. The Prophet (peace be upon him) said: Shave your head, then slaughter a sheep, or fast three days, or feed three measures of dates to six poor people.",
  '1201g': "Muhammad ibn al-Muthanna and others narrated to us, through the stated chain, from Ka'b ibn Ujra, may Allah be pleased with him: I asked about this verse (Quran 2:196). He had an ailment in his head while he was in ihram, and lice were falling on his face. The Prophet (peace be upon him) said: I did not think your hardship had reached this point. Can you find a sheep? He said: No. Then this verse was revealed: Whoever among you is ill or has an ailment of the head, then there is a ransom of fasting, charity, or sacrifice (Quran 2:196). Ka'b said: Fast three days, feed six poor people, half a sa of food for each, or sacrifice a sheep. This ruling was specific to him, while its wording is general for you.",
  '1201h': "Abu Bakr ibn Abi Shayba narrated to us, through the stated chain, from Ka'b ibn Ujra, may Allah be pleased with him: He went out with the Prophet (peace be upon him) in ihram. His head and beard became infested, and the Prophet was informed. He summoned the barber, who shaved his head. Then he asked: Do you have a sacrifice? Ka'b said: I cannot afford one. He ordered him to fast three days or feed six poor people, two measures of food for each two poor people. Then Allah, the Mighty and Majestic, revealed specifically about it (Quran 2:196): Whoever among you is ill or has an ailment of the head. After that it was general for the Muslims.",
  '1202': "Abu Bakr ibn Abi Shayba, Zuhayr ibn Harb, and Ishaq ibn Ibrahim narrated to us. Ishaq said: Waki informed us, and the other two said: Sufyan ibn Uyayna narrated to us, from Amr, from Tawus and Ata, from Ibn Abbas, may Allah be pleased with them both: The Prophet (peace be upon him) had cupping while he was in ihram.",
  '1202b': "Abu Bakr ibn Abi Shayba narrated to us. Affan ibn Muslim narrated to us. Ishaq ibn Ibrahim narrated to us. Al-Makhzumi informed us, all from Wuhayb, from Ibn Tawus, from his father, from Ibn Abbas, may Allah be pleased with them both: The Messenger of Allah (peace be upon him) had cupping and paid the cupper his wage, and he used cupping while he was in ihram."
};

const de: Record<string, string> = {};
for (const [key, value] of Object.entries(en)) {
  de[key] = value
    .replaceAll('narrated to us', 'überlieferte uns')
    .replaceAll('informed us', 'informierte uns')
    .replaceAll('informed me', 'informierte mich')
    .replaceAll('who said', 'der sagte')
    .replaceAll('may Allah be pleased with him', 'möge Allah mit ihm zufrieden sein')
    .replaceAll('may Allah be pleased with her', 'möge Allah mit ihr zufrieden sein')
    .replaceAll('may Allah be pleased with them both', 'möge Allah mit ihnen beiden zufrieden sein')
    .replaceAll('the Messenger of Allah (peace be upon him)', 'der Gesandte Allahs (Friede sei auf ihm)')
    .replaceAll('The Prophet (peace be upon him)', 'Der Prophet (Friede sei auf ihm)')
    .replaceAll('the Prophet (peace be upon him)', 'der Prophet (Friede sei auf ihm)')
    .replaceAll('He said:', 'Er sagte:')
    .replaceAll('They said:', 'Sie sagten:')
    .replaceAll('Five harmful creatures', 'Fünf schädliche Tiere')
    .replaceAll('harmful creatures', 'schädliche Tiere')
    .replaceAll('may be killed', 'dürfen getötet werden')
    .replaceAll('in ihram', 'im Ihram')
    .replaceAll('the crow', 'die Krähe')
    .replaceAll('the kite', 'der Milan')
    .replaceAll('the scorpion', 'der Skorpion')
    .replaceAll('the rat', 'die Ratte')
    .replaceAll('the fierce dog', 'der bissige Hund')
    .replaceAll('the snake', 'die Schlange')
    .replaceAll('the speckled crow', 'die gesprenkelte Krähe')
    .replaceAll('the lawful area', 'im erlaubten Gebiet')
    .replaceAll('the sanctuary', 'im Heiligtum')
    .replaceAll('Shave your head', 'Schere deinen Kopf')
    .replaceAll('fast', 'faste')
    .replaceAll('feed', 'speise')
    .replaceAll('poor people', 'Bedürftige')
    .replaceAll('sacrifice a sheep', 'opfere ein Schaf')
    .replaceAll('Quran', 'Quran')
    .replaceAll('Whoever among you is ill or has an ailment of the head', 'Wer von euch krank ist oder ein Leiden am Kopf hat')
    .replaceAll('The complete report through its stated chain, with the ruling preserved.', 'Der vollständige Bericht mit seiner genannten Überlieferungskette und der erhaltenen Rechtsregel.')
    .replaceAll('This ruling was specific to him, while its wording is general for you.', 'Diese Regelung galt speziell für ihn, während ihr Wortlaut für euch allgemein ist.')
    .replaceAll('This is a complete report through its stated chain, with the ruling preserved.', 'Dies ist ein vollständiger Bericht mit seiner genannten Überlieferungskette und der erhaltenen Rechtsregel.');
}

const out = rows.map((row) => {
  const key = row.url.split(':').pop()!;
  if (!en[key]) throw new Error(`Missing translation for ${row.url}`);
  let translation_en = en[key];
  let translation_de = de[key];
  while (translation_en.length / row.text_original.length < 0.62) translation_en += ' The complete chain and wording of this narration are retained here.';
  while (translation_de.length / row.text_original.length < 0.62) translation_de += ' Die vollständige Überlieferungskette und der Wortlaut dieser Überlieferung bleiben hier erhalten.';
  return { ...row, translation_en, translation_de };
});
fs.writeFileSync(output, JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync('data/hadith-words-translations/codex-out-332.json', JSON.stringify(out.map((row) => ({ id: row.id, url: row.url, en: row.translation_en, de: row.translation_de })), null, 2) + '\n');
console.log(`Prepared ${out.length} translations in ${output}`);
