import fs from 'node:fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-039.json', 'utf8'));

const translations = [
  // 0: df381229-75f4-46f1-9eed-bb277580a5f8 (7554)
  {
    id: "df381229-75f4-46f1-9eed-bb277580a5f8",
    de: "Muhammad ibn Abi Ghalib berichtete mir: Muhammad ibn Isma‘il berichtete uns: Mu‘tamir berichtete uns: Ich hörte meinen Vater sagen: Qatadah berichtete uns, dass Abu Rafi‘ ihm berichtete, dass er Abu Hurairah (möge Allah mit ihm zufrieden sein) sagen hörte: Ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: „Wahrlich, Allah verfasste eine Schrift, noch ehe Er die Schöpfung erschuf: ‚Meine Barmherzigkeit eilt Meinem Zorn voraus.‘ Und dies steht bei Ihm oberhalb des Thrones geschrieben.“"
  },

  // 1: 79a10c79-3323-4f3e-9d49-9c02c486ecde (7555)
  {
    id: "79a10c79-3323-4f3e-9d49-9c02c486ecde",
    de: "‘Abdullah ibn ‘Abd al-Wahhab berichtete uns: ‘Abd al-Wahhab berichtete uns: Ayyub berichtete uns von Abu Qilabah und al-Qasim at-Tamimi, von Zahdam, der sagte: Es bestanden Zuneigung und Brüderlichkeit zwischen dieser Sippe von Jurm und den Asch‘ariten. Wir befanden uns bei Abu Musa al-Asch‘ari, als ihm Speise vorgesetzt wurde, in der Hühnerfleisch enthalten war. Bei ihm saß ein Mann von den Banu Taym-Allah, der wie ein Freigelassener wirkte. Abu Musa lud ihn zum Essen ein, doch jener sagte: „Ich sah es etwas fressen, vor dem es mich ekelte, und so schwor ich, es niemals zu essen.“ Abu Musa erwiderte: „Komm her, so will ich dir davon erzählen! Ich kam einst mit einer Schar von Asch‘ariten zum Propheten (Friede sei auf ihm), um ihn um Reittiere zu bitten. Er sprach: ‚Bei Allah, ich werde euch keine Reittiere geben, und ich besitze nichts, worauf ich euch tragen könnte!‘ Dann aber wurden dem Propheten (Friede sei auf ihm) Beutekamele gebracht, und er erkundigte sich nach uns und sprach: ‚Wo ist die Schar der Asch‘ariten?‘ Da ordnete er an, uns fünf kräftige, wohlgenährte Kamele mit weißen Höckern zu geben. Als wir aufbrachen, sprachen wir untereinander: ‚Was haben wir nur getan! Der Gesandte Allahs (Friede sei auf ihm) hatte geschworen, uns nicht aufsitzen zu lassen und dass er nichts habe, worauf er uns tragen könne, und dann gab er uns doch Reittiere! Wir haben den Gesandten Allahs (Friede sei auf ihm) seinen Eid unbedacht vergessen lassen; bei Allah, wir werden niemals Erfolg haben!‘ So kehrten wir zu ihm zurück und erzählten es ihm. Da sprach er: ‚Nicht ich habe euch Reittiere gegeben, sondern Allah hat euch getragen! Wahrlich, bei Allah, ich schwöre keinen Eid und sehe dann etwas anderes als besser an, ohne dass ich das tue, was besser ist, und für meinen Eid Sühne leiste!‘“"
  },

  // 2: 5cea6c91-a3a7-48ae-a678-a3ae8133d8ac (7556)
  {
    id: "5cea6c91-a3a7-48ae-a678-a3ae8133d8ac",
    de: "‘Amr ibn ‘Ali berichtete uns: Abu ‘Asim berichtete uns: Qurrah ibn Khalid berichtete uns: Abu Jamrah ad-Duba‘i berichtete uns: Ich sprach zu Ibn ‘Abbas, und er sagte: Die Gesandtschaft von ‘Abd al-Qays kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: „Zwischen uns und dir stehen die Götzendiener von Mudar, und wir können zu dir nur in den heiligen Monaten gelangen. So gib uns klare Anweisungen, durch deren Befolgung wir ins Paradies eingehen und zu denen wir diejenigen aufrufen können, die hinter uns geblieben sind!“ Er sprach: „Ich gebiete euch vier Dinge und verbiete euch vier Dinge: Ich gebiete euch den Glauben an Allah. Wisst ihr, was der Glaube an Allah ist? Das Bezeugen, dass es keinen Gott außer Allah gibt, das Verrichten des Gebets, das Entrichten der Zakat und dass ihr das Fünftel der Kriegsbeute abgebt. Und ich verbiete euch vier Gefäße: Trinkt nicht aus Flaschenkürbissen, ausgehöhlten Baumstämmen, pechbestrichenen Gefäßen und grünen Tonkrügen!“"
  },

  // 3: d3ca4182-eb55-44cb-b496-64ff2fb3b536 (7557)
  {
    id: "d3ca4182-eb55-44cb-b496-64ff2fb3b536",
    de: "Qutaybah ibn Sa‘id berichtete uns: al-Layth berichtete uns von Nafi‘, von al-Qasim ibn Muhammad, von ‘A’ischah (möge Allah mit ihr zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Die Bildner dieser Bildnisse werden am Tag der Auferstehung gepeinigt werden, und man wird zu ihnen sprechen: ‚Macht lebendig, was ihr erschaffen habt!‘“"
  },

  // 4: 0c9177b1-21de-4a2c-86ba-81f07de2d72b (7558)
  {
    id: "0c9177b1-21de-4a2c-86ba-81f07de2d72b",
    de: "Abu n-Nu‘man berichtete uns: Hammad ibn Zayd berichtete uns von Ayyub, von Nafi‘, von Ibn ‘Umar (möge Allah mit beiden zufrieden sein), der sagte: Der Prophet (Friede sei auf ihm) sagte: „Die Bildner dieser Bildnisse werden am Tag der Auferstehung gepeinigt werden, und man wird zu ihnen sprechen: ‚Macht lebendig, was ihr erschaffen habt!‘“"
  },

  // 5: 2cd88d95-a341-4271-aa96-9cc1c5629943 (7559)
  {
    id: "2cd88d95-a341-4271-aa96-9cc1c5629943",
    de: "Muhammad ibn al-‘Ala’ berichtete uns: Ibn Fudayl berichtete uns von ‘Umarah, von Abu Zur‘ah, der Abu Hurairah (möge Allah mit ihm zufrieden sein) sagen hörte: Ich hörte den Propheten (Friede sei auf ihm) sagen: „Allah, der Mächtige und Erhabene, spricht: ‚Wer ist ungerechter als jener, der hingeht, um zu erschaffen, wie Ich erschaffe? So sollen sie doch ein einziges Stäubchen erschaffen, oder sie sollen ein Korn oder ein Gerstenkorn erschaffen!‘“"
  },

  // 6: 627b4f76-75b2-424e-8ebe-c04547b7347a (7560)
  {
    id: "627b4f76-75b2-424e-8ebe-c04547b7347a",
    de: "Hudbah ibn Khalid berichtete uns: Hammam berichtete uns: Qatadah berichtete uns: Anas berichtete uns von Abu Musa (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: „Das Gleichnis des Gläubigen, der den Koran rezitiert, ist das einer Zitrone: Ihr Geschmack ist köstlich und ihr Duft ist herrlich. Das Gleichnis des Gläubigen, der den Koran nicht rezitiert, ist das einer Dattel: Ihr Geschmack ist köstlich, doch sie hat keinen Duft. Das Gleichnis des Frevlers, der den Koran rezitiert, ist das von Basilikum: Sein Duft ist wohlriechend, doch sein Geschmack ist bitter. Und das Gleichnis des Frevlers, der den Koran nicht rezitiert, ist das der Koloquinte: Ihr Geschmack ist bitter und sie hat keinen Duft.“"
  },

  // 7: 061d8581-2414-49b8-8bde-d97f82acfc1e (7561)
  {
    id: "061d8581-2414-49b8-8bde-d97f82acfc1e",
    de: "‘Ali berichtete uns: Hischam berichtete uns: Ma‘mar teilte uns mit, von az-Zuhri. (Zweite Kette:) Und Ahmad ibn Salih berichtete mir: ‘Anbasah berichtete uns: Yunus berichtete uns von Ibn Schihab: Yahya ibn ‘Urwah ibn az-Zubayr teilte mir mit, dass er ‘Urwah ibn az-Zubayr sagen hörte: ‘A’ischah (möge Allah mit ihr zufrieden sein) sagte: Einige Leute befragten den Propheten (Friede sei auf ihm) über die Wahrsager, worauf er sprach: „Sie sind gar nichts!“ Da sagten sie: „O Gesandter Allahs, manchmal berichten sie doch über eine Sache, die wahr ist!“ Da sprach der Prophet (Friede sei auf ihm): „Dies ist ein wahres Wort, das ein Dschinn aufschnappt und es in das Ohr seines Vertrauten gackert wie das Gegacker einer Henne; und sie mischen dann mehr als hundert Lügen darunter!“"
  },

  // 8: ef93af97-f659-4e97-b862-4282d7905933 (7562)
  {
    id: "ef93af97-f659-4e97-b862-4282d7905933",
    de: "Abu n-Nu‘man berichtete uns: Mahdi ibn Maymun berichtete uns: Ich hörte Muhammad ibn Sirin von Ma‘bad ibn Sirin berichten, von Abu Sa‘id al-Khudri (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: „Es werden Leute aus Richtung des Ostens hervortreten, die den Koran rezitieren, doch er geht nicht über ihre Schlüsselbeine hinaus. Sie treten aus der Religion aus, so wie der Pfeil das Wild durchdringt, und kehren nicht zu ihr zurück, bis der Pfeil zu seiner Sehne zurückkehrt.“ Man fragte: „Was ist ihr Erkennungszeichen?“ Er antwortete: „Ihr Kennzeichen ist das Kahlscheren der Köpfe“ – oder er sagte: „das Kurzschneiden der Haare.“"
  },

  // 9: e739dfc5-9d02-4f1a-9145-b3520080d68f (7563)
  {
    id: "e739dfc5-9d02-4f1a-9145-b3520080d68f",
    de: "Ahmad ibn Ischkab berichtete mir: Muhammad ibn Fudayl berichtete uns von ‘Umarah ibn al-Qa‘qa‘, von Abu Zur‘ah, von Abu Hurairah (möge Allah mit ihm zufrieden sein), der sagte: Der Prophet (Friede sei auf ihm) sagte: „Zwei Worte sind dem Allerbarmer lieb, leicht auf der Zunge und schwer auf der Waage: Preis sei Allah und Sein ist das Lob; Preis sei Allah, dem Allgewaltigen!“"
  }
];

// Validate all
let hasErrors = false;
inputs.forEach((input, index) => {
  const trans = translations[index];
  if (!trans || trans.id !== input.id) {
    console.error(`ID mismatch at index ${index}: expected ${input.id}, got ${trans?.id}`);
    hasErrors = true;
    return;
  }
  const errs = validateGerman(input, trans.de);
  if (errs.length > 0) {
    console.error(`Validation error in item ${index} (${input.id}):`, errs);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error("Validation failed!");
  process.exit(1);
} else {
  console.log("All 10 translations successfully validated!");
  fs.writeFileSync('data/german-batches/hadith-outputs/bukhari-batch-039.json', JSON.stringify(translations, null, 2), 'utf8');
  console.log("Successfully written to data/german-batches/hadith-outputs/bukhari-batch-039.json");
}
