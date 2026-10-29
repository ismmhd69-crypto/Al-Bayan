import fs from 'fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-013.json'));

const translations = [
  // 0: dd004c43-47d0-4249-8938-224b57c781cc (hadith 5484)
  {
    id: "dd004c43-47d0-4249-8938-224b57c781cc",
    de: "Musa ibn Isma‘il überlieferte uns: Thabit ibn Yazid überlieferte uns: ‘Asim überlieferte uns von ash-Sha‘bi, von ‘Adi ibn Hatim (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), dass er sagte: „Wenn du deinen Hund aussendest und dabei den Namen Allahs sprichst und er das Wildtier packt und tötet, so iss davon. Wenn er jedoch davon frisst, so iss nicht davon; denn er hat es nur für sich selbst gepackt. Und wenn sich andere Hunde dazu gesellen, über die der Name Allahs nicht genannt wurde, und sie es packen und töten, so iss nicht davon; denn du weißt nicht, welcher von ihnen es getötet hat. Und wenn du nach dem Wild schießt und es nach einem oder zwei Tagen findest, ohne dass es eine andere Spur als die deines Pfeils aufweist, so iss davon; wenn es jedoch ins Wasser gefallen ist, so iss nicht davon.“"
  },
  // 1: 5f9c3ee1-d216-4d78-8ba0-4e2f4b123edd (hadith 5485)
  {
    id: "5f9c3ee1-d216-4d78-8ba0-4e2f4b123edd",
    de: "Und ‘Abd al-A‘la sagte von Dawud, von ‘Amir, von ‘Adi, dass er zum Propheten (Friede sei auf ihm) sagte: Man schießt nach dem Wild und folgt zwei oder drei Tage seiner Spur, woraufhin man es verendet auffindet, während der eigene Pfeil darin steckt. Da sprach er: „Er darf davon essen, wenn er will.“"
  },
  // 2: 2c217bd1-4278-4626-a5c6-dde9d432b382 (hadith 5486)
  {
    id: "2c217bd1-4278-4626-a5c6-dde9d432b382",
    de: "Adam überlieferte uns: Shu‘bah überlieferte uns von ‘Abdullah ibn Abi as-Safar, von ash-Sha‘bi, von ‘Adi ibn Hatim, der sagte: Ich sagte: „O Gesandter Allahs, ich sende meinen Hund aus und nenne den Namen Allahs.“ Da sprach der Prophet (Friede sei auf ihm): „Wenn du deinen Hund aussendest und dabei den Namen Allahs sprichst, und er das Wild packt und tötet und davon frisst, so iss nicht; denn er hat es nur für sich selbst gepackt.“ Ich sagte: „Ich sende meinen Hund aus und finde einen anderen Hund bei ihm, und ich weiß nicht, welcher von beiden es gepackt hat.“ Da sprach er: „Iss nicht davon; denn du hast den Namen Allahs nur über deinen Hund gesprochen und nicht über den anderen.“ Und ich fragte ihn nach der Jagd mit dem stumpfen Wurfholz (Mi‘rad). Da sprach er: „Wenn du es mit seiner scharfen Spitze triffst, so iss; wenn du es aber mit seiner breiten Seite triffst und es dadurch stirbt, so ist es durch Schlag getötet (Waqidh), also iss nicht davon!“"
  },
  // 3: b8b8147f-40df-45bc-8d46-3985806baeaf (hadith 5487)
  {
    id: "b8b8147f-40df-45bc-8d46-3985806baeaf",
    de: "Muhammad berichtete mir: Ibn Fudayl berichtete mir von Bayan, von ‘Amir, von ‘Adi ibn Hatim (möge Allah mit ihm zufrieden sein), der sagte: Ich befragte den Gesandten Allahs (Friede sei auf ihm) und sagte: „Wir sind ein Volk, das mit diesen Hunden jagt.“ Da sprach er: „Wenn du deine abgerichteten Hunde aussendest und dabei den Namen Allahs nennst, so iss von dem, was sie für dich gepackt haben; es sei denn, der Hund frisst davon, dann iss nicht, da ich fürchte, er hat es nur für sich selbst gepackt. Und wenn sich ein fremder Hund unter sie mischt, so iss nicht davon!“"
  },
  // 4: 8e774827-7ba5-4f86-b316-7240eec72471 (hadith 5488)
  {
    id: "8e774827-7ba5-4f86-b316-7240eec72471",
    de: "Abu ‘Asim überlieferte uns von Haywah; und Ahmad ibn Abi Raja’ berichtete mir: Salamah ibn Sulayman überlieferte uns von Ibn al-Mubarak, von Haywah ibn Shurayh, der sagte: Ich hörte Rabi‘ah ibn Yazid ad-Dimashqi sagen: Abu Idris ‘A’idhullah berichtete mir und sagte: Ich hörte Abu Tha‘labah al-Khushani (möge Allah mit ihm zufrieden sein) sagen: Ich kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: „O Gesandter Allahs, wir befinden uns im Land eines Volkes von den Leuten der Schrift: Dürfen wir in ihren Gefäßen essen? Und wir sind in einem Jagdgebiet, wo ich mit meinem Bogen jage und mit meinem abgerichteten Hund sowie mit meinem Hund, der nicht abgerichtet ist. So unterrichte mich darüber, was uns davon erlaubt ist!“ Da sprach er: „Was du darüber erwähnt hast, dass ihr im Land eines Volkes von den Leuten der Schrift seid und in ihren Gefäßen esst: Wenn ihr andere Gefäße als die ihren findet, so esst nicht in ihnen; findet ihr jedoch keine anderen, so wascht sie und esst darin! Und was du darüber erwähnt hast, dass ihr in einem Jagdgebiet seid: Was du mit deinem Bogen erlegst, so nenne den Namen Allahs und iss! Und was du mit deinem abgerichteten Hund erlegst, so nenne den Namen Allahs und iss! Und was du mit deinem Hund erlegst, der nicht abgerichtet ist, du es aber noch lebend erreichst und schächtetest, so iss davon!“"
  },
  // 5: 30da02df-7184-4812-bff5-6cef9aa6959a (hadith 5489)
  {
    id: "30da02df-7184-4812-bff5-6cef9aa6959a",
    de: "Musaddad überlieferte uns: Yahya überlieferte uns von Shu‘bah, der sagte: Hisham ibn Zayd berichtete mir von Anas ibn Malik (möge Allah mit ihm zufrieden sein), der sagte: Wir scheuchten einen Hasen bei Marr az-Zahran auf. Die Leute jagten hinter ihm her, bis sie ermüdeten; da setzte ich ihm nach, bis ich ihn fing. Ich brachte ihn zu Abu Talhah, und er schickte seine Keule und seine Schenkel zum Propheten (Friede sei auf ihm), und er nahm sie an."
  },
  // 6: a9001ce1-510e-436b-b995-452816d10311 (hadith 5490)
  {
    id: "a9001ce1-510e-436b-b995-452816d10311",
    de: "Isma‘il überlieferte uns und sagte: Malik überlieferte mir von Abu an-Nadr, dem Freigelassenen von ‘Umar ibn ‘Ubaydullah, von Nafi‘, dem Freigelassenen von Abu Qatadah, von Abu Qatadah, dass er mit dem Gesandten Allahs (Friede sei auf ihm) unterwegs war. Als er sich an einem Teil des Weges nach Mekka befand, blieb er mit einigen seiner Gefährten zurück, die sich im Weihezustand (Ihram) befanden, während er selbst nicht im Weihezustand war. Da erblickte er einen Wildesel, schwang sich auf sein Pferd und bat seine Gefährten, ihm seine Peitsche zu reichen; doch sie weigerten sich. Da bat er sie um seine Lanze; doch sie weigerten sich. Da nahm er sie selbst, griff den Wildesel an und erlegte ihn. Einige der Gefährten des Gesandten Allahs (Friede sei auf ihm) aßen davon, während andere sich weigerten. Als sie den Gesandten Allahs (Friede sei auf ihm) einholten, befragten sie ihn darüber, und er sagte: „Es ist doch nur eine Speise, mit der Allah euch gespeist hat!“"
  },
  // 7: c941a9d8-5c9e-4ce5-8bd0-38ae242f2d88 (hadith 5491)
  {
    id: "c941a9d8-5c9e-4ce5-8bd0-38ae242f2d88",
    de: "Isma‘il überlieferte uns und sagte: Malik überlieferte mir von Zayd ibn Aslam, von ‘Ata’ ibn Yasar, von Abu Qatadah das Gleiche, außer dass der Prophet fragte: „Habt ihr noch etwas von seinem Fleisch bei euch?“"
  },
  // 8: 4bce0cb4-ea80-4030-8d5f-f02867fbb1d5 (hadith 5492)
  {
    id: "4bce0cb4-ea80-4030-8d5f-f02867fbb1d5",
    de: "Yahya ibn Sulayman überlieferte uns und sagte: Ibn Wahb berichtete mir: ‘Amr berichtete uns, dass Abu an-Nadr ihm von Nafi‘, dem Freigelassenen von Abu Qatadah, und Abu Salih, dem Freigelassenen von at-Taw’amah, berichtete: Ich hörte Abu Qatadah sagen: Ich war mit dem Propheten (Friede sei auf ihm) zwischen Mekka und Medina; die Gefährten waren im Weihezustand (Ihram), während ich nicht im Weihezustand auf einem Pferd ritt und geübt darin war, auf Berge zu steigen. Während ich so ritt, sah ich die Leute nach etwas Ausschau halten. Ich ging hin, um nachzusehen, und siehe da, es war ein Wildesel. Ich fragte sie: „Was ist das?“ Sie sagten: „Wir wissen es nicht.“ Ich sagte: „Das ist ein Wildesel!“ Sie sagten: „Es ist das, was du siehst.“ Da hatte ich meine Peitsche vergessen und sagte zu ihnen: „Reicht mir meine Peitsche!“ Sie erwiderten: „Wir helfen dir nicht dabei.“ Da stieg ich ab, nahm sie selbst und ritt hinter ihm her, bis ich ihn mit der Lanze traf und erlegte. Dann kam ich zu ihnen und sagte: „Steht auf und ladet ihn auf!“ Sie sagten: „Wir rühren ihn nicht an.“ Da trug ich ihn selbst, bis ich ihn zu ihnen brachte; einige von ihnen weigerten sich, davon zu essen, während andere aßen. Ich sagte: „Ich werde den Propheten (Friede sei auf ihm) für euch anhalten.“ Ich holte ihn ein und erzählte ihm die Begebenheit. Da sprach er zu mir: „Ist noch etwas von ihm bei euch übrig?“ Ich sagte: „Ja.“ Er sprach: „Esst davon; denn es ist eine Speise, mit der Allah euch gespeist hat.“"
  },
  // 9: bfdc49b8-7619-4fcb-a902-b97451e7d5b7 (hadith 5493)
  {
    id: "bfdc49b8-7619-4fcb-a902-b97451e7d5b7",
    de: "Musaddad überlieferte uns: Yahya überlieferte uns von Ibn Jurayj, der sagte: ‘Amr berichtete mir, dass er Jabir (möge Allah mit ihm zufrieden sein) sagen hörte: Wir zogen im Feldzug des Baumblätter-Heeres (Jaysh al-Khabt) aus, und Abu ‘Ubaydah wurde als Anführer eingesetzt. Wir litten unter großem Hunger; da warf das Meer einen toten Fisch an Land, dessen Gleichen man nie zuvor gesehen hatte, genannt al-‘Anbar. Wir aßen einen halben Monat lang davon. Und Abu ‘Ubaydah nahm eine seiner Rippen und stellte sie aufrecht hin, sodass ein berittener Reiter darunter hindurchreiten konnte."
  },
  // 10: 0a4c0d07-d7c4-4ecd-9f27-cadcbfd31d05 (hadith 5494)
  {
    id: "0a4c0d07-d7c4-4ecd-9f27-cadcbfd31d05",
    de: "‘Abdullah ibn Muhammad überlieferte uns: Sufyan berichtete uns von ‘Amr, der sagte: Ich hörte Jabir sagen: Der Prophet (Friede sei auf ihm) entsandte uns als dreihundert Reiter unter der Führung von Abu ‘Ubaydah, um eine Karawane der Quraisch abzufangen. Da befiel uns ein so heftiger Hunger, dass wir Blätter von den Bäumen aßen, sodass der Heerzug „Jaysh al-Khabt“ (das Laub-Heer) genannt wurde. Da warf das Meer einen Walfisch an, der al-‘Anbar genannt wird. Wir aßen einen halben Monat davon und rieben uns mit seinem Fett ein, bis unsere Körper wieder erstarkten. Er sagte: Da nahm Abu ‘Ubaydah eine seiner Rippen und stellte sie aufrecht, sodass ein Reiter darunter hindurchritt. Unter uns war ein Mann, der, als der Hunger unerträglich wurde, drei Kamele schlachtete, dann nochmals drei Kamele schlachtete, bis Abu ‘Ubaydah es ihm untersagte."
  },
  // 11: aa49d178-797f-4dc2-93a2-5c8e959b8410 (hadith 5495)
  {
    id: "aa49d178-797f-4dc2-93a2-5c8e959b8410",
    de: "Abu al-Walid überlieferte uns: Shu‘bah überlieferte uns von Abu Ya‘fur, der sagte: Ich hörte Ibn Abi Awfa (möge Allah mit beiden zufrieden sein) sagen: Wir nahmen mit dem Propheten (Friede sei auf ihm) an sieben – oder sechs – Feldzügen teil, bei denen wir Heuschrecken mit ihm aßen. Sufyan, Abu ‘Awanah und Isra’il überlieferten von Abu Ya‘fur, von Ibn Abi Awfa: sieben Feldzüge."
  },
  // 12: b6997dde-ed54-4815-804b-bc994bdeefa8 (hadith 5496)
  {
    id: "b6997dde-ed54-4815-804b-bc994bdeefa8",
    de: "Abu ‘Asim überlieferte uns von Haywah ibn Shurayh, der sagte: Rabi‘ah ibn Yazid ad-Dimashqi berichtete mir und sagte: Abu Idris al-Khawlani berichtete mir und sagte: Abu Tha‘labah al-Khushani berichtete mir und sagte: Ich kam zum Propheten (Friede sei auf ihm) und sagte: „O Gesandter Allahs, wir sind im Land der Leute der Schrift und essen in ihren Gefäßen; und wir sind in einem Jagdgebiet, wo ich mit meinem Bogen jage und mit meinem abgerichteten Hund sowie mit meinem Hund, der nicht abgerichtet ist.“ Da sprach der Prophet (Friede sei auf ihm): „Was du darüber erwähnt hast, dass ihr im Land der Leute der Schrift seid: Esst nicht in ihren Gefäßen, es sei denn, ihr findet keinen anderen Ausweg; wenn ihr keinen anderen Ausweg findet, so wascht sie und esst darin! Und was du darüber erwähnt hast, dass ihr in einem Jagdgebiet seid: Was du mit deinem Bogen erlegst, so sprich den Namen Allahs und iss! Und was du mit deinem abgerichteten Hund erlegst, so sprich den Namen Allahs und iss! Und was du mit deinem nicht abgerichteten Hund erlegst, du es aber noch lebend erreichst und schächtetest, so iss es!“"
  },
  // 13: 25411950-3977-4104-8cff-0962ef831d70 (hadith 5497)
  {
    id: "25411950-3977-4104-8cff-0962ef831d70",
    de: "Al-Makki ibn Ibrahim überlieferte uns und sagte: Yazid ibn Abi ‘Ubayd überlieferte mir von Salamah ibn al-Akwa‘, der sagte: Als der Abend am Tag der Eroberung von Khaybar hereinbrach, entzündeten die Leute Feuer. Da fragte der Prophet (Friede sei auf ihm): „Worüber habt ihr diese Feuer entzündet?“ Sie antworteten: „Über dem Fleisch von zahmen Eseln.“ Da sprach er: „Schüttet aus, was darin ist, und zerschlagt die Töpfe!“ Da stand ein Mann aus den Leuten auf und fragte: „Dürfen wir das Fleisch ausschütten und die Töpfe waschen?“ Da sprach der Prophet (Friede sei auf ihm): „Oder tut das.“"
  },
  // 14: 07b25a3c-781a-440d-a6a4-8db64739b4c4 (hadith 5498)
  {
    id: "07b25a3c-781a-440d-a6a4-8db64739b4c4",
    de: "Musa ibn Isma‘il berichtete mir: Abu ‘Awanah überlieferte uns von Sa‘id ibn Masruq, von ‘Abayah ibn Rifa‘ah ibn Rafi‘, von seinem Großvater Rafi‘ ibn Khadij, der sagte: Wir waren mit dem Propheten (Friede sei auf ihm) in Dhu al-Hulayfah, als die Menschen von Hunger heimgesucht wurden. Da erbeuteten wir Kamele und Schafe. Der Prophet (Friede sei auf ihm) befand sich im hinteren Teil des Zuges. Die Leute eilten sich und setzten sogleich die Kochtöpfe auf. Als der Prophet (Friede sei auf ihm) zu ihnen herantrat, befahl er, die Töpfe umzustürzen. Dann verteilte er die Beute und setzte zehn Schafe einem Kamel gleich. Da riss ein Kamel von ihnen aus; und unter den Leuten gab es nur wenige Pferde, sodass sie es vergeblich jagten und ermüdeten. Da zielte ein Mann mit einem Pfeil darauf, und Allah hielt es auf. Da sprach der Prophet (Friede sei auf ihm): „Wahrlich, dieses Vieh hat Ausbrüche wie wildes Getier; wenn euch also eines davon entweicht, so verfahrt damit auf diese Weise!“ Er sagte: Und mein Großvater sagte: „Wir hoffen – oder fürchten –, dass wir morgen dem Feind begegnen, und wir haben keine Schlachtmesser bei uns: Dürfen wir mit scharfem Schilfrohr schlachten?“ Da sprach er: „Was das Blut zum Fließen bringt und worüber der Name Allahs genannt wurde, davon esst – außer mit Zahn und Kralle! Und ich werde es euch erklären: Was den Zahn betrifft, so ist er ein Knochen; und was die Kralle betrifft, so ist sie das Messer der Abessinier.“"
  },
  // 15: a8e9edfb-e1f8-4df7-8e6b-613e90ac9739 (hadith 5499)
  {
    id: "a8e9edfb-e1f8-4df7-8e6b-613e90ac9739",
    de: "Mu‘alla ibn Asad überlieferte uns: ‘Abd al-‘Aziz – nämlich Ibn al-Mukhtar – überlieferte uns: Musa ibn ‘Uqbah berichtete uns und sagte: Salim berichtete mir, dass er ‘Abdullah vom Gesandten Allahs (Friede sei auf ihm) berichten hörte, dass er Zayd ibn ‘Amr ibn Nufayl im unteren Teil von Baldah traf, und dies war, bevor die Offenbarung auf den Gesandten Allahs (Friede sei auf ihm) herabgesandt wurde. Da setzte der Gesandte Allahs (Friede sei auf ihm) ihm eine Speiseplatte mit Fleisch vor; doch Zayd weigerte sich, davon zu essen, und sagte dann: „Ich esse von nichts, was ihr auf euren Opfersteinen schlachtet; und ich esse nur von dem, worüber der Name Allahs genannt worden ist.“"
  },
  // 16: a1f8a260-cd5d-46da-8540-12eb255e32ac (hadith 5500)
  {
    id: "a1f8a260-cd5d-46da-8540-12eb255e32ac",
    de: "Qutaybah überlieferte uns: Abu ‘Awanah überlieferte uns von al-Aswad ibn Qays, von Jundab ibn Sufyan al-Bajali, der sagte: Wir schlachteten an einem Tag mit dem Gesandten Allahs (Friede sei auf ihm) Opfertiere. Da hatten einige Leute ihre Opfertiere noch vor dem Festgebet geschlachtet. Als der Prophet (Friede sei auf ihm) das Gebet beendet hatte und sah, dass sie vor dem Gebet geschlachtet hatten, sprach er: „Wer vor dem Gebet geschlachtet hat, der soll an deren Stelle ein anderes Tier schlachten; und wer noch nicht geschlachtet hatte, bis wir beteten, der soll im Namen Allahs schlachten!“"
  },
  // 17: b8304bb7-2fdf-41ea-aa47-8c2504634bdd (hadith 5501)
  {
    id: "b8304bb7-2fdf-41ea-aa47-8c2504634bdd",
    de: "Muhammad ibn Abi Bakr überlieferte uns: Mu‘tamir überlieferte uns von ‘Ubaydullah, von Nafi‘, der den Sohn von Ka‘b ibn Malik hörte, wie er Ibn ‘Umar berichtete, dass sein Vater ihm berichtete, dass eine Sklavin von ihnen Schafe am Berg Sal‘ weidete. Sie bemerkte an einem Schaf den nahenden Tod; da schlug sie einen Stein entzwei und schächtete es damit. Da sagte er zu seiner Familie: „Esst nicht davon, bis ich zum Propheten (Friede sei auf ihm) gehe und ihn frage – oder bis ich jemanden zu ihm schicke, der ihn fragt!“ Er ging zum Propheten (Friede sei auf ihm) oder schickte zu ihm, und der Prophet (Friede sei auf ihm) befahl, dass sie es essen sollten."
  },
  // 18: 909e79c2-081d-46b3-a93c-36a6904883d9 (hadith 5502)
  {
    id: "909e79c2-081d-46b3-a93c-36a6904883d9",
    de: "Musa überlieferte uns: Juwayriyah überlieferte uns von Nafi‘, von einem Mann aus den Banu Salimiah, der ‘Abdullah berichtete, dass eine Sklavin von Ka‘b ibn Malik Schafe von ihm auf dem kleinen Hügel am Markt bei Sal‘ weidete. Da wurde ein Schaf verletzt; sie zerschlug einen Stein und schächtete es damit. Sie erwähnten dies dem Propheten (Friede sei auf ihm), und er befahl ihnen, es zu essen."
  },
  // 19: 6eac0005-8b5b-491d-995d-8b4ded7ca7cd (hadith 5503)
  {
    id: "6eac0005-8b5b-491d-995d-8b4ded7ca7cd",
    de: "‘Abdan überlieferte uns und sagte: Mein Vater berichtete mir von Shu‘bah, von Sa‘id ibn Masruq, von ‘Abayah ibn Rafi‘, von seinem Großvater, dass er sagte: „O Gesandter Allahs, wir haben keine Schlachtmesser.“ Da sprach er: „Was das Blut zum Fließen bringt und worüber der Name Allahs genannt wurde, davon esst – außer Kralle und Zahn! Was die Kralle betrifft, so ist sie das Messer der Abessinier; und was den Zahn betrifft, so ist er ein Knochen.“ Und ein Kamel riss aus, woraufhin ein Mann es mit einem Pfeil aufhielt. Da sprach er: „Wahrlich, diese Kamele haben Ausbrüche wie wildes Getier; wenn euch also eines von ihnen überwindet, so verfahrt damit auf diese Weise!“"
  },
  // 20: ce2a184f-98c3-4a87-831a-3654837e9a57 (hadith 5504)
  {
    id: "ce2a184f-98c3-4a87-831a-3654837e9a57",
    de: "Sadaqah überlieferte uns: ‘Abdah berichtete uns von ‘Ubaydullah, von Nafi‘, von einem Sohn von Ka‘b ibn Malik, von seinem Vater, dass eine Frau ein Schaf mit einem scharfen Stein schächtete. Da wurde der Prophet (Friede sei auf ihm) danach gefragt, und er befahl, es zu essen. Und al-Layth sagte: Nafi‘ überlieferte uns, dass er einen Mann von den Ansar hörte, der ‘Abdullah vom Propheten (Friede sei auf ihm) berichtete, dass eine Sklavin von Ka‘b dies tat."
  },
  // 21: 750b3970-2ea1-4aac-8e38-25d34642a07b (hadith 5505)
  {
    id: "750b3970-2ea1-4aac-8e38-25d34642a07b",
    de: "Isma‘il überlieferte uns und sagte: Malik überlieferte mir von Nafi‘, von einem Mann aus den Ansar, von Mu‘adh ibn Sa‘d – oder Sa‘d ibn Mu‘adh –, der ihm berichtete, dass eine Sklavin von Ka‘b ibn Malik Schafe am Berg Sal‘ weidete. Da verletzte sich ein Schaf davon; sie eilte herbei und schächtete es mit einem Stein. Da wurde der Prophet (Friede sei auf ihm) danach gefragt, und er sagte: „Esst es!“"
  },
  // 22: 12502e41-49a9-4419-9b81-a40c8a1c310f (hadith 5506)
  {
    id: "12502e41-49a9-4419-9b81-a40c8a1c310f",
    de: "Qabisah überlieferte uns: Sufyan überlieferte uns von seinem Vater, von ‘Abayah ibn Rifa‘ah, von Rafi‘ ibn Khadij, der sagte: Der Prophet (Friede sei auf ihm) sagte: „Iss alles, was das Blut zum Fließen bringt, außer mit Zahn und Kralle.“"
  },
  // 23: 5f9fce66-2686-4432-854d-53f96ba0afe5 (hadith 5507)
  {
    id: "5f9fce66-2686-4432-854d-53f96ba0afe5",
    de: "Muhammad ibn ‘Ubaydillah überlieferte uns: Usamah ibn Hafs al-Madani überlieferte uns von Hisham ibn ‘Urwah, von seinem Vater, von ‘A’ishah (möge Allah mit ihr zufrieden sein), dass Leute zum Propheten (Friede sei auf ihm) sagten: „Manche Leute bringen uns Fleisch, und wir wissen nicht, ob der Name Allahs darüber genannt wurde oder nicht.“ Da sprach er: „Nennt ihr selbst den Namen Allahs (Bismillah) darüber und esst es!“ Sie fügte hinzu: Und sie waren damals erst vor kurzem vom Unglauben zum Islam übergetreten. Dies überlieferte auch ‘Ali von ad-Darawardi sowie Abu Khalid und at-Tufawi."
  },
  // 24: 77287035-1b67-4962-a2ac-634ec220d048 (hadith 5508)
  {
    id: "77287035-1b67-4962-a2ac-634ec220d048",
    de: "Abu al-Walid überlieferte uns: Shu‘bah überlieferte uns von Humayd ibn Hilal, von ‘Abdullah ibn Mughaffal (möge Allah mit ihm zufrieden sein), der sagte: Wir belagerten die Festung von Khaybar, als jemand einen Ledersack mit Fett herabwarf. Da sprang ich herbei, um ihn an mich zu nehmen; als ich mich umwandte, erblickte ich plötzlich den Propheten (Friede sei auf ihm), und ich schämte mich vor ihm."
  },
  // 25: a311f773-3a45-4307-b15a-dbb820726b46 (hadith 5509)
  {
    id: "a311f773-3a45-4307-b15a-dbb820726b46",
    de: "‘Amr ibn ‘Ali überlieferte uns: Yahya überlieferte uns: Sufyan überlieferte uns: Mein Vater überlieferte uns von ‘Abayah ibn Rifa‘ah ibn Rafi‘ ibn Khadij, von Rafi‘ ibn Khadij, der sagte: Ich sagte: „O Gesandter Allahs, wir werden morgen auf den Feind treffen und haben keine Schlachtmesser bei uns.“ Da sprach er: „Beeilt euch – oder lasst das Blut strömen – mit allem, was das Blut zum Fließen bringt und worüber der Name Allahs genannt wurde, und esst davon, außer mit Zahn und Kralle! Und ich werde es euch darlegen: Was den Zahn betrifft, so ist er ein Knochen; und was die Kralle betrifft, so ist sie das Messer der Abessinier.“ Und wir machten Beute an Kamelen und Schafen, und ein Kamel riss aus. Da schoss ein Mann einen Pfeil darauf und hielt es auf. Da sprach der Gesandte Allahs (Friede sei auf ihm): „Wahrlich, diese Kamele haben Ausbrüche wie wildes Getier; wenn euch also eines von ihnen entweicht, so verfahrt damit auf diese Weise!“"
  },
  // 26: 486e8ba3-fd7a-4e27-b709-1d0abab6477c (hadith 5510)
  {
    id: "486e8ba3-fd7a-4e27-b709-1d0abab6477c",
    de: "Khallad ibn Yahya überlieferte uns: Sufyan überlieferte uns von Hisham ibn ‘Urwah, der sagte: Fatimah bint al-Mundhir, meine Ehefrau, berichtete mir von Asma’ bint Abi Bakr (möge Allah mit beiden zufrieden sein), die sagte: Wir schlachteten zur Zeit des Propheten (Friede sei auf ihm) ein Pferd und aßen davon."
  },
  // 27: 4aec6603-c96e-46b0-8309-5590e75b6ce4 (hadith 5511)
  {
    id: "4aec6603-c96e-46b0-8309-5590e75b6ce4",
    de: "Ishaq überlieferte uns: Er hörte ‘Abdah von Hisham, von Fatimah, von Asma’, die sagte: Wir schlachteten zur Zeit des Gesandten Allahs (Friede sei auf ihm) ein Pferd, während wir in Medina waren, und aßen davon."
  },
  // 28: 0689da37-4713-42ee-adf7-99f448ed17d3 (hadith 5512)
  {
    id: "0689da37-4713-42ee-adf7-99f448ed17d3",
    de: "Qutaybah überlieferte uns: Jarir überlieferte uns von Hisham, von Fatimah bint al-Mundhir, dass Asma’ bint Abi Bakr sagte: Wir schlachteten zur Zeit des Gesandten Allahs (Friede sei auf ihm) ein Pferd und aßen davon. Dies überlieferten auch Waki‘ und Ibn ‘Uyaynah von Hisham bezüglich des Schächtens (Nahr)."
  },
  // 29: ae96b8f6-2d1f-4a7a-b78c-c06dd6a8d7ab (hadith 5513)
  {
    id: "ae96b8f6-2d1f-4a7a-b78c-c06dd6a8d7ab",
    de: "Abu al-Walid überlieferte uns: Shu‘bah überlieferte uns von Hisham ibn Zayd, der sagte: Ich trat mit Anas bei al-Hakam ibn Ayyub ein. Da sah er Knaben – oder junge Männer –, die ein Huhn festgebunden hatten und als Zielscheibe beschossen. Da sagte Anas: „Der Prophet (Friede sei auf ihm) hat verboten, lebende Tiere als Zielscheibe festzubinden.“"
  }
];

let allValid = true;
for (let i = 0; i < inputs.length; i++) {
  const input = inputs[i];
  const tr = translations[i];
  if (!tr || tr.id !== input.id) {
    console.error(`ID MISMATCH at index ${i}: expected ${input.id}, got ${tr?.id}`);
    allValid = false;
    continue;
  }
  const errs = validateGerman(input, tr.de);
  if (errs.length > 0) {
    console.error(`Validation errors for index ${i} (${input.id}):`, errs);
    allValid = false;
  }
}

if (allValid) {
  console.log(`ALL ${translations.length} TRANSLATIONS PASSED VALIDATION!`);
  const outPath = 'data/german-batches/hadith-outputs/bukhari-batch-013.json';
  fs.writeFileSync(outPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log(`Successfully wrote ${translations.length} items to ${outPath}`);
} else {
  console.error('Validation failed, did not write output file.');
  process.exit(1);
}
