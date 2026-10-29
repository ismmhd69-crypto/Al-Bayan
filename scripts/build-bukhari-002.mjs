import fs from 'fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-002.json'));

const translations = [
  // 0: 607d0d81-0845-490f-b02b-c0bb5829b192 (hadith 4561)
  {
    id: "607d0d81-0845-490f-b02b-c0bb5829b192",
    de: "‘Amr ibn Khalid überlieferte uns: Zuhayr überlieferte uns: Abu Ishaq überlieferte uns und sagte: Ich hörte al-Bara’ ibn ‘Azib (möge Allah mit beiden zufrieden sein) sagen: Am Tag von Uhud setzte der Prophet (Friede sei auf ihm) ‘Abdullah ibn Jubayr über die Fußsoldaten ein. Sie kehrten besiegt um, und das war der Augenblick, als der Gesandte sie von hinten rief. Und es blieben beim Propheten (Friede sei auf ihm) nur noch 12 Männer zurück."
  },
  // 1: 54dc9b19-7e5e-47ea-a2fc-fddf87a2057b (hadith 4562)
  {
    id: "54dc9b19-7e5e-47ea-a2fc-fddf87a2057b",
    de: "Ishaq ibn Ibrahim ibn ‘Abd ar-Rahman Abu Ya‘qub überlieferte uns: Husayn ibn Muhammad überlieferte uns: Shayban überlieferte uns von Qatadah: Anas überlieferte uns, dass Abu Talhah sagte: Schläfrigkeit überkam uns, während wir am Tag von Uhud in unseren Kampfreihen standen. Er sagte: Mein Schwert fiel mir immer wieder aus der Hand, und ich nahm es auf; dann fiel es wieder, und ich nahm es wieder auf."
  },
  // 2: 6762cd35-d5c8-4b5a-a367-59614e2fe67d (hadith 4563)
  {
    id: "6762cd35-d5c8-4b5a-a367-59614e2fe67d",
    de: "Ahmad ibn Yunus überlieferte uns – ich glaube, er sagte: Abu Bakr überlieferte uns – von Abu Hasin, von Abu ad-Duha, von Ibn ‘Abbas bezüglich des Verses: „Allah genügt uns, und Er ist der beste Sachwalter“ (3:173). Er sagte: Ibrahim (Friede sei auf ihm) sprach diese Worte, als er ins Feuer geworfen wurde, und Muhammad (Friede sei auf ihm) sprach sie, als die Leute sagten: „Die Menschen haben sich gegen euch versammelt, so fürchtet sie!“, doch dies mehrte sie nur im Glauben, und sie sagten: „Allah genügt uns, und Er ist der beste Sachwalter“ (3:173)."
  },
  // 3: cd86fc4a-b989-4210-a6ea-86ab8586ab83 (hadith 4564)
  {
    id: "cd86fc4a-b989-4210-a6ea-86ab8586ab83",
    de: "Malik ibn Isma‘il überlieferte uns: Isra’il überlieferte uns von Abu Hasin, von Abu ad-Duha, von Ibn ‘Abbas, der sagte: Die letzten Worte Ibrahims, als er ins Feuer geworfen wurde, waren: „Allah genügt mir, und Er ist der beste Sachwalter.“"
  },
  // 4: a1e410fc-9f0a-429e-b5ab-eb9503afc6bc (hadith 4565)
  {
    id: "a1e410fc-9f0a-429e-b5ab-eb9503afc6bc",
    de: "‘Abdullah ibn Munir berichtete mir; er hörte Abu an-Nadr: ‘Abd ar-Rahman – nämlich der Sohn von ‘Abdullah ibn Dinar – überlieferte uns von seinem Vater, von Abu Salih, von Abu Hurayrah, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Wem Allah Besitz gibt und er entrichtet dessen Zakat nicht, dem wird sein Besitz am Tag der Auferstehung in Gestalt einer giftigen, kahlen Schlange mit zwei schwarzen Punkten über den Augen erscheinen. Sie wird ihn umschlingen und ihn an beiden Mundwinkeln packen – das heißt an seinen Kiefern – und sagen: ‚Ich bin dein Besitz, ich bin dein Schatz.‘“ Dann rezitierte er diesen Vers: „Und diejenigen, die geizen mit dem, was Allah ihnen von Seiner Huld gegeben hat, sollen keineswegs meinen…“ bis zum Ende des Verses (3:180)."
  },
  // 5: 6f6e84bf-ee77-4134-bcf1-31cf67888702 (hadith 4566)
  {
    id: "6f6e84bf-ee77-4134-bcf1-31cf67888702",
    de: "Abu al-Yaman überlieferte uns: Schu‘ayb berichtete uns von az-Zuhri, der sagte: ‘Urwah ibn az-Zubayr berichtete mir, dass Usamah ibn Zayd (möge Allah mit beiden zufrieden sein) ihm berichtete, dass der Gesandte Allahs (Friede sei auf ihm) auf einem Esel ritt, auf dem eine Satteldecke aus Fadak lag, und er ließ Usamah ibn Zayd hinter sich aufsitzen, um Sa‘d ibn ‘Ubadah bei den Banu al-Harith ibn al-Khazraj vor der Schlacht von Badr zu besuchen. Er sagte: Bis er an einer Versammlung vorbeikam, in der ‘Abdullah ibn Ubayy ibn Salul saß – dies war, bevor ‘Abdullah ibn Ubayy den Islam annahm –, und in der Versammlung war eine gemischte Schar aus Muslimen, Götzendienern, Juden und Muslimen. In der Versammlung war auch ‘Abdullah ibn Rawahah. Als der Staub des Reittiers die Versammlung einhüllte, bedeckte ‘Abdullah ibn Ubayy seine Nase mit seinem Obergewand und sagte: „Wirbelt keinen Staub auf uns auf!“ Der Gesandte Allahs (Friede sei auf ihm) grüßte sie mit dem Friedensgruß, hielt an, stieg ab, rief sie zu Allah auf und rezitierte ihnen den Quran vor. Da sagte ‘Abdullah ibn Ubayy ibn Salul: „O Mann, nichts wäre schöner als das, was du sagst, wenn es wahr wäre! So belästige uns damit nicht in unserer Versammlung. Kehre zu deinem Lager zurück; wer zu dir kommt, dem erzähle es!“ Doch ‘Abdullah ibn Rawahah sagte: „Doch, o Gesandter Allahs, bringe es zu uns in unsere Versammlungen, denn wir lieben das!“ Da beschimpften sich die Muslime, die Götzendiener und die Juden gegenseitig, bis sie beinahe aufeinander losgingen. Der Prophet (Friede sei auf ihm) beruhigte sie unablässig, bis sie zur Ruhe kamen. Dann stieg der Prophet (Friede sei auf ihm) auf sein Reittier und ritt weiter, bis er bei Sa‘d ibn ‘Ubadah eintrat. Der Prophet (Friede sei auf ihm) sagte zu ihm: „O Sa‘d, hast du nicht gehört, was Abu Hubab gesagt hat?“ – womit er ‘Abdullah ibn Ubayy meinte – „Er hat dies und jenes gesagt.“ Sa‘d ibn ‘Ubadah sagte: „O Gesandter Allahs, verzeihe ihm und sieh darüber hinweg! Denn bei Dem, Der dir das Buch herabgesandt hat: Gewiss hat Allah die Wahrheit gebracht, die Er dir herabgesandt hat. Die Bewohner dieser Oasenstadt hatten sich bereits geeinigt, ihn zu krönen und ihm den Herrscherbund umzubinden. Als aber Allah dies durch die Wahrheit verwehrte, die Er dir gab, erstickte er vor Groll darüber. Und das veranlasste ihn zu dem, was du gesehen hast.“ Da verzieh ihm der Gesandte Allahs (Friede sei auf ihm). Der Prophet (Friede sei auf ihm) und seine Gefährten pflegten den Götzendienern und den Leuten der Schrift zu verzeihen, wie Allah es ihnen befohlen hatte, und sie ertrugen die Kränkungen geduldig. Allah, der Mächtige und Majestätische, sagte: „Und ihr werdet ganz gewiss von denjenigen, denen vor euch die Schrift gegeben wurde, und von denen, die Götzendiener sind, viele Kränkungen hören…“ (3:186). Und Allah sagte: „Viele von den Leuten der Schrift möchten euch gerne, nachdem ihr den Glauben angenommen habt, wieder zu Ungläubigen machen, aus Neid von sich aus…“ bis zum Ende des Verses (2:109). Und der Prophet (Friede sei auf ihm) pflegte Vergebung zu üben, wie Allah es ihm befohlen hatte, bis Allah über sie entschied. Als der Gesandte Allahs (Friede sei auf ihm) in Badr kämpfte und Allah durch ihn die Anführer der ungläubigen Quraisch vernichtete, sagten Ibn Ubayy ibn Salul und die Götzendiener bei ihm: „Dies ist eine Sache, die sich nun durchgesetzt hat.“ Da leisteten sie dem Gesandten Allahs (Friede sei auf ihm) den Treueeid auf den Islam und nahmen den Islam an."
  },
  // 6: fe5f5c5b-da7f-453f-919a-3d0b56d11b92 (hadith 4627)
  {
    id: "fe5f5c5b-da7f-453f-919a-3d0b56d11b92",
    de: "‘Abd al-‘Aziz ibn ‘Abdullah überlieferte uns: Ibrahim ibn Sa‘d überlieferte uns von Ibn Shihab, von Salim ibn ‘Abdullah, von seinem Vater, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Die Schlüssel des Verborgenen sind fünf: ‚Gewiss, Allah besitzt das Wissen um die Stunde; Er sendet den Regen herab; Er weiß, was in den Mutterleibern ist; keine Seele weiß, was sie morgen erwerben wird; und keine Seele weiß, in welchem Land sie sterben wird. Gewiss, Allah ist Allwissend und Kundig‘“ (31:34)."
  },
  // 7: b1e10bc0-4515-4fee-af44-04f2a3c5e384 (hadith 4628)
  {
    id: "b1e10bc0-4515-4fee-af44-04f2a3c5e384",
    de: "Abu an-Nu‘man überlieferte uns: Hammad ibn Zayd überlieferte uns von ‘Amr ibn Dinar, von Jabir (möge Allah mit ihm zufrieden sein), der sagte: Als dieser Vers herabgesandt wurde: „Sag: Er ist derjenige, der die Macht hat, über euch eine Strafe von oben herab zu senden“ (6:65), sagte der Gesandte Allahs (Friede sei auf ihm): „Ich nehme Zuflucht zu Deinem Angesicht.“ Dann heißt es: „oder von unter euren Füßen“ (6:65), worauf er sagte: „Ich nehme Zuflucht zu Deinem Angesicht.“ Dann heißt es: „oder euch in Parteien zu verwirren und die einen von euch die Gewalt der anderen kosten zu lassen“ (6:65). Da sagte der Gesandte Allahs (Friede sei auf ihm): „Dies ist erträglicher“ – oder: „Dies ist leichter.“"
  },
  // 8: 5520d9c9-5f95-4880-b797-bedb8a896145 (hadith 4629)
  {
    id: "5520d9c9-5f95-4880-b797-bedb8a896145",
    de: "Muhammad ibn Bashshar berichtete mir: Ibn Abi ‘Adi überlieferte uns von Shu‘bah, von Sulayman, von Ibrahim, von ‘Alqamah, von ‘Abdullah (möge Allah mit ihm zufrieden sein), der sagte: Als der Vers herabgesandt wurde: „und ihren Glauben nicht mit Ungerechtigkeit verdecken“ (6:82), sagten seine Gefährten: „Und wer von uns tut kein Unrecht?“ Da wurde herabgesandt: „Gewiss, der Götzendienst ist ein gewaltiges Unrecht“ (31:13)."
  },
  // 9: 70f3b544-5e02-40c8-a544-61387e474a83 (hadith 4630)
  {
    id: "70f3b544-5e02-40c8-a544-61387e474a83",
    de: "Muhammad ibn Bashshar überlieferte uns: Ibn Mahdi überlieferte uns: Shu‘bah überlieferte uns von Qatadah, von Abu al-‘Aliyah, der sagte: Der Vetter eures Propheten – nämlich Ibn ‘Abbas (möge Allah mit beiden zufrieden sein) – überlieferte mir vom Propheten (Friede sei auf ihm), dass er sagte: „Es geziemt sich für keinen Diener zu sagen: ‚Ich bin besser als Yunus ibn Matta.‘“"
  },
  // 10: 2fbe3b3d-da7c-4e89-ad7a-3507472298d8 (hadith 4631)
  {
    id: "2fbe3b3d-da7c-4e89-ad7a-3507472298d8",
    de: "Adam ibn Abi Iyas überlieferte uns: Shu‘bah überlieferte uns: Sa‘d ibn Ibrahim berichtete uns und sagte: Ich hörte Humayd ibn ‘Abd ar-Rahman ibn ‘Awf von Abu Hurayrah (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), dass er sagte: „Es geziemt sich für keinen Diener zu sagen: ‚Ich bin besser als Yunus ibn Matta.‘“"
  },
  // 11: dc790b56-bf90-4a5a-a2f5-3d5d4de9e7d1 (hadith 4632)
  {
    id: "dc790b56-bf90-4a5a-a2f5-3d5d4de9e7d1",
    de: "Ibrahim ibn Musa berichtete mir: Hisham berichtete uns, dass Ibn Jurayj ihnen berichtete. Er sagte: Sulayman al-Ahwal berichtete mir, dass Mujahid ihm berichtete, dass er Ibn ‘Abbas fragte: „Gibt es in der Sure Sad eine Niederwerfung?“ Er sagte: „Ja.“ Dann rezitierte er von „Und Wir schenkten“ bis zu Seinen Worten: „so folge ihrer Rechtleitung“ (6:90) und sagte dann: „Er gehört zu ihnen.“ Yazid ibn Harun, Muhammad ibn ‘Ubayd und Sahl ibn Yusuf fügten von al-‘Awwam, von Mujahid hinzu: Ich fragte Ibn ‘Abbas, und er sagte: „Euer Prophet (Friede sei auf ihm) gehörte zu denen, denen befohlen wurde, ihrem Vorbild zu folgen.“"
  },
  // 12: 352a6e1c-42ea-4279-89eb-965dbdb1d597 (hadith 4633)
  {
    id: "352a6e1c-42ea-4279-89eb-965dbdb1d597",
    de: "‘Amr ibn Khalid überlieferte uns: Al-Layth überlieferte uns von Yazid ibn Abi Habib. ‘Ata’ sagte: Ich hörte Jabir ibn ‘Abdullah (möge Allah mit beiden zufrieden sein) sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: „Möge Allah die Juden bekämpfen! Als Allah ihnen das Fett (dieser Tiere) verbot, schmolzen sie es ein, verkauften es und verzehrten seinen Erlös.“ Und Abu ‘Asim sagte: ‘Abd al-Hamid überlieferte uns: Yazid überlieferte uns: ‘Ata’ schrieb mir: „Ich hörte Jabir“, vom Propheten (Friede sei auf ihm)."
  },
  // 13: 51861dcd-09ff-42c9-ae8c-59c4bda37dc9 (hadith 4634)
  {
    id: "51861dcd-09ff-42c9-ae8c-59c4bda37dc9",
    de: "Hafs ibn ‘Umar überlieferte uns: Shu‘bah überlieferte uns von ‘Amr, von Abu Wa’il, von ‘Abdullah (möge Allah mit ihm zufrieden sein), der sagte: „Niemand besitzt mehr Eifersucht als Allah, und deshalb verbot Er die Schandtaten – was davon offen ist und was verborgen. Und nichts liebt das Lob mehr als Allah, und deshalb lobte Er Sich Selbst.“ Ich fragte: „Hast du dies von ‘Abdullah gehört?“ Er erwiderte: „Ja.“ Ich fragte: „Und führte er es auf den Propheten zurück?“ Er sagte: „Ja.“"
  },
  // 14: c90bc915-0eb9-4409-86db-522d7851ca44 (hadith 4635)
  {
    id: "c90bc915-0eb9-4409-86db-522d7851ca44",
    de: "Musa ibn Isma‘il überlieferte uns: ‘Abd al-Wahid überlieferte uns: ‘Umarah überlieferte uns: Abu Zur‘ah überlieferte uns: Abu Hurayrah (möge Allah mit ihm zufrieden sein) überlieferte uns und sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Die Stunde wird nicht eintreffen, bis die Sonne aus dem Westen aufgeht. Wenn die Menschen sie sehen, wird jeder auf Erden glauben; doch das ist zu jener Zeit, in der einer Seele ihr Glaube nichts nützt, die nicht zuvor geglaubt hatte.“"
  },
  // 15: d9ec209e-8e10-419c-890e-e16479b223f5 (hadith 4636)
  {
    id: "d9ec209e-8e10-419c-890e-e16479b223f5",
    de: "Ishaq berichtete mir: ‘Abd ar-Razzaq berichtete uns: Ma‘mar berichtete uns von Hammam, von Abu Hurayrah (möge Allah mit ihm zufrieden sein), der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Die Stunde wird nicht eintreffen, bis die Sonne aus dem Westen aufgeht. Wenn sie aufgeht und die Menschen sie sehen, werden sie allesamt glauben; und das ist zu jener Zeit, in der einer Seele ihr Glaube nichts nützt.“ Dann rezitierte er den Vers."
  },
  // 16: e3ce031c-bea1-4654-a813-0d5f9ce562a3 (hadith 4637)
  {
    id: "e3ce031c-bea1-4654-a813-0d5f9ce562a3",
    de: "Sulayman ibn Harb überlieferte uns: Shu‘bah überlieferte uns von ‘Amr ibn Murrah, von Abu Wa’il, von ‘Abdullah (möge Allah mit ihm zufrieden sein), der sagte: Ich fragte: „Hast du dies von ‘Abdullah gehört?“ Er erwiderte: „Ja, und er führte es auf den Propheten zurück.“ Er sagte: „Niemand besitzt mehr Eifersucht als Allah, und deshalb verbot Er die Schandtaten – was davon offen ist und was verborgen. Und niemand liebt das Lob mehr als Allah, und deshalb lobte Er Sich Selbst.“"
  },
  // 17: c6bbe079-5517-4eeb-ab1d-22e673a62610 (hadith 4638)
  {
    id: "c6bbe079-5517-4eeb-ab1d-22e673a62610",
    de: "Muhammad ibn Yusuf überlieferte uns: Sufyan überlieferte uns von ‘Amr ibn Yahya al-Mazini, von seinem Vater, von Abu Sa‘id al-Khudri (möge Allah mit ihm zufrieden sein), der sagte: Ein jüdischer Mann kam zum Propheten (Friede sei auf ihm), nachdem man ihn ins Gesicht geschlagen hatte, und sagte: „O Muhammad, ein Mann von deinen Gefährten unter den Ansar hat mich ins Gesicht geschlagen.“ Er sagte: „Ruft ihn herbei!“ Da riefen sie ihn, und er fragte: „Warum hast du ihn ins Gesicht geschlagen?“ Er erwiderte: „O Gesandter Allahs, ich ging an den Juden vorbei und hörte ihn sagen: ‚Bei Dem, Der Musa über alle Menschen auserwählt hat!‘ Da sagte ich: ‚Auch über Muhammad?‘ Da packte mich der Zorn, und ich schlug ihn.“ Da sagte der Prophet (Friede sei auf ihm): „Zieht mich den Propheten nicht vor! Denn die Menschen werden am Tag der Auferstehung ohnmächtig niederstürzen, und ich werde der Erste sein, der wieder zu sich kommt. Doch da sehe ich Musa, wie er sich an einer der Säulen des Thrones festhält. Ich weiß nicht, ob er vor mir zu sich kam oder ob ihm der Blitzschlag am Berg vergolten wurde.“"
  },
  // 18: f250d26d-54e7-45a8-8cb6-46b72550d78a (hadith 4639)
  {
    id: "f250d26d-54e7-45a8-8cb6-46b72550d78a",
    de: "Muslim überlieferte uns: Shu‘bah überlieferte uns von ‘Abd al-Malik, von ‘Amr ibn Hurayth, von Sa‘id ibn Zayd, vom Propheten (Friede sei auf ihm), dass er sagte: „Die Trüffel gehört zum Manna, und ihr Saft ist ein Heilmittel für das Auge.“"
  },
  // 19: b79392ef-0855-401d-a029-50c502f9fd47 (hadith 4640)
  {
    id: "b79392ef-0855-401d-a029-50c502f9fd47",
    de: "‘Abdullah überlieferte uns: Sulayman ibn ‘Abd ar-Rahman und Musa ibn Harun überlieferten uns; beide sagten: Al-Walid ibn Muslim überlieferte uns: ‘Abdullah ibn al-‘Ala’ ibn Zabr überlieferte uns und sagte: Busr ibn ‘Ubaydillah überlieferte mir: Abu Idris al-Khawlani überlieferte mir und sagte: Ich hörte Abu ad-Darda’ sagen: Es gab einen Wortwechsel zwischen Abu Bakr und ‘Umar, und Abu Bakr erzürnte ‘Umar. Da ging ‘Umar voller Zorn von ihm weg, und Abu Bakr folgte ihm und bat ihn, für ihn um Vergebung zu bitten; doch er tat es nicht, bis er seine Tür vor ihm zuschlug. Da ging Abu Bakr zum Gesandten Allahs (Friede sei auf ihm). Abu ad-Darda’ sagte: Wir waren bei ihm, als der Gesandte Allahs (Friede sei auf ihm) sagte: „Was diesen euren Gefährten betrifft, so hat er sich im Guten vorausgetan.“ Er sagte: Und ‘Umar bereute, was er getan hatte, sodass er herbeikam, mit dem Friedensgruß grüßte, sich zum Propheten (Friede sei auf ihm) setzte und dem Gesandten Allahs (Friede sei auf ihm) die Nachricht berichtete. Abu ad-Darda’ sagte: Da wurde der Gesandte Allahs (Friede sei auf ihm) zornig, während Abu Bakr unablässig sagte: „Bei Allah, o Gesandter Allahs, ich war mehr im Unrecht!“ Da sagte der Gesandte Allahs (Friede sei auf ihm): „Lasst ihr wohl meinen Gefährten in Ruhe? Lasst ihr wohl meinen Gefährten in Ruhe? Gewiss, ich sagte: ‚O ihr Menschen, ich bin der Gesandte Allahs an euch alle‘, und ihr sagtet: ‚Du lügst‘, während Abu Bakr sagte: ‚Du hast die Wahrheit gesprochen.‘“ Abu ‘Abdullah (al-Bukhari) sagte: „Ghamara“ bedeutet: Er hat im Guten den Vorrang erlangt."
  },
  // 20: fde1546a-f45e-4f3d-b118-019340a2cf17 (hadith 4641)
  {
    id: "fde1546a-f45e-4f3d-b118-019340a2cf17",
    de: "Ishaq überlieferte uns: ‘Abd ar-Razzaq berichtete uns: Ma‘mar berichtete uns von Hammam ibn Munabbih, dass er Abu Hurayrah (möge Allah mit ihm zufrieden sein) sagen hörte, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Den Kindern Israels wurde gesagt: ‚Tretet durch das Tor ein, indem ihr euch niederwerft, und sprecht: Vergebung (Hittah), so vergeben Wir euch eure Verfehlungen‘ (2:58). Doch sie änderten es ab: Sie traten ein, indem sie auf ihrem Gesäß rutschten, und sagten: ‚Ein Weizenkorn in einer Gerste.‘“"
  },
  // 21: 56feb273-7341-4ea7-ad2f-13457abbb0cc (hadith 4642)
  {
    id: "56feb273-7341-4ea7-ad2f-13457abbb0cc",
    de: "Abu al-Yaman überlieferte uns: Schu‘ayb berichtete uns von az-Zuhri, der sagte: ‘Ubaydullah ibn ‘Abdullah ibn ‘Utbah berichtete mir, dass Ibn ‘Abbas (möge Allah mit beiden zufrieden sein) sagte: ‘Uyaynah ibn Hisn ibn Hudhayfah traf ein und stieg bei seinem Neffen al-Hurr ibn Qays ab, der zu jenen gehörte, die ‘Umar in seine Nähe zog. Die Qurangelehrten (Qurra’) waren die Gefährten bei ‘Umars Versammlungen und seinen Beratungen, seien sie ältere oder jüngere Männer gewesen. Da sagte ‘Uyaynah zu seinem Neffen: „O Sohn meines Bruders, du hast Ansehen bei diesem Herrscher, so bitte für mich um Erlaubnis, bei ihm einzutreten.“ Er sagte: „Ich werde für dich um Erlaubnis bitten.“ Ibn ‘Abbas sagte: So bat al-Hurr um Erlaubnis für ‘Uyaynah, und ‘Umar gestattete es ihm. Als er bei ihm eintrat, sagte er: „Wohlan, Sohn von al-Khattab! Bei Allah, du gibst uns nicht reichlich und richtest unter uns nicht mit Gerechtigkeit!“ Da wurde ‘Umar so zornig, dass er gegen ihn vorgehen wollte. Da sagte al-Hurr zu ihm: „O Befehlshaber der Gläubigen, Allah der Erhabene sagte zu Seinem Propheten (Friede sei auf ihm): ‚Übe Nachsicht, gebiete das Rechte und wende dich von den Unwissenden ab‘ (7:199), und dieser gehört gewiss zu den Unwissenden.“ Bei Allah, ‘Umar ging nicht über diesen Vers hinaus, als er ihn vor ihm rezitierte; und er pflegte vor dem Buch Allahs stets innezuhalten."
  },
  // 22: 7b1a3953-b9e8-4f43-a25a-3bad99fc176d (hadith 4643)
  {
    id: "7b1a3953-b9e8-4f43-a25a-3bad99fc176d",
    de: "Yunus ibn Bukayr überlieferte uns: ‘Ali ibn Badhimah überlieferte uns: Abu al-Jahm überlieferte uns: Zayd ibn Aslam überlieferte uns von seinem Vater, der sagte: Ibn ‘Umar sprach zu mir ein Wort, das mir gefiel, als er sah, wie oft die Leute unterschiedlicher Meinung zu ‘Umar waren. Er sagte: „Glaubst du etwa, dein Vater sei töricht? Wenn er etwas sähe, das zu missbilligen wäre, würde er es gewiss ändern. Allah sagte zu Seinem Propheten (Friede sei auf ihm): ‚Übe Nachsicht, gebiete das Rechte und wende dich von den Unwissenden ab‘ (7:199) – und dies gehört dazu.“"
  },
  // 23: 16d40428-2a4a-41c1-a064-89912005b5d6 (hadith 4644)
  {
    id: "16d40428-2a4a-41c1-a064-89912005b5d6",
    de: "Abu al-Walid überlieferte uns: Shu‘bah überlieferte uns von Mansur, von Abu Wa’il, von ‘Abdullah (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), dass er sagte: „Niemand besitzt mehr Eifersucht als Allah, aus diesem Grund verbot Er die Schandtaten. Und niemand liebt das Lob mehr als Allah, aus diesem Grund lobte Er Sich Selbst.“"
  },
  // 24: 46fc6ea5-ffa8-45f9-aa0c-8fecba57eeb4 (hadith 4645)
  {
    id: "46fc6ea5-ffa8-45f9-aa0c-8fecba57eeb4",
    de: "Muhammad ibn ‘Abd ar-Rahim berichtete mir: Sa‘id ibn Sulayman überlieferte uns: Hushaym berichtete uns: Abu Bishr berichtete uns von Sa‘id ibn Jubayr, der sagte: Ich befragte Ibn ‘Abbas (möge Allah mit beiden zufrieden sein) über die Sure al-Anfal. Er sagte: „Sie wurde bezüglich Badr herabgesandt.“ „Asch-Schawkah“: die Schärfe/Macht. „Murdafin“: eine Schar nach der anderen. „Radafani“ und „ardafani“: er kam nach mir. „Kostet“: erfahrt und erlebt es am eigenen Leib, dies ist kein Schmecken mit dem Mund. „Fayarkumahu“: Er häuft es zusammen. „Scharrid“: versprenge. „Und wenn sie sich neigen“ (8:61): sie verlangen danach. „Yuthkhina“: er überwältigt. Mujahid sagte: „Muka’an“ bedeutet, die Finger in ihre Münder zu stecken, und „tasdiyatan“ bedeutet Pfeifen. „Li-yuthbituka“: um dich festzusetzen (einzusperren)."
  },
  // 25: 34c3f0ba-a481-488e-bb85-b49cd0ecabb0 (hadith 4646)
  {
    id: "34c3f0ba-a481-488e-bb85-b49cd0ecabb0",
    de: "Muhammad ibn Yusuf überlieferte uns: Warqa’ überlieferte uns von Ibn Abi Najih, von Mujahid, von Ibn ‘Abbas bezüglich des Verses: „Gewiss, die schlimmsten Tiere bei Allah sind die Tauben und Stummen, die nicht begreifen“ (8:22). Er sagte: Sie waren eine Gruppe von den Banu ‘Abd ad-Dar."
  },
  // 26: b2573b01-d6ad-4975-a830-0763044aed93 (hadith 4647)
  {
    id: "b2573b01-d6ad-4975-a830-0763044aed93",
    de: "Ishaq berichtete mir: Rawh berichtete uns: Shu‘bah überlieferte uns von Khubayb ibn ‘Abd ar-Rahman, der sagte: Ich hörte Hafs ibn ‘Asim von Abu Sa‘id ibn al-Mu‘alla (möge Allah mit ihm zufrieden sein) überliefern, der sagte: Ich betete gerade, als der Gesandte Allahs (Friede sei auf ihm) an mir vorbeiging und mich rief. Ich ging nicht zu ihm, bis ich zu Ende gebetet hatte. Dann kam ich zu ihm, und er sagte: „Was hinderte dich daran zu kommen? Sagte Allah nicht: ‚O die ihr glaubt, antwortet Allah und dem Gesandten, wenn er euch ruft‘ (8:24)?“ Dann sagte er: „Gewiss werde ich dich die großartigste Sure im Quran lehren, bevor ich hinausgehe.“ Als der Gesandte Allahs (Friede sei auf ihm) im Begriff war hinauszugehen, erinnerte ich ihn daran. Und Mu‘adh sagte: Shu‘bah überlieferte uns von Khubayb, der Hafs hörte, der Abu Sa‘id hörte, einen Mann unter den Gefährten des Propheten (Friede sei auf ihm), mit dieser Überlieferung; und er sagte: Es ist „Alles Lob gebührt Allah, dem Herrn der Welten“ – die sieben oft wiederholten Verse."
  },
  // 27: 5fcbace7-7b93-4b96-8275-e31a4281bc0e (hadith 4648)
  {
    id: "5fcbace7-7b93-4b96-8275-e31a4281bc0e",
    de: "Ahmad berichtete mir: ‘Ubaydullah ibn Mu‘adh überlieferte uns: Mein Vater überlieferte uns: Shu‘bah überlieferte uns von ‘Abd al-Hamid – nämlich dem Sohn von Kurdayd, dem Gefährten von az-Ziyadi –, der Anas ibn Malik (möge Allah mit ihm zufrieden sein) sagen hörte: Abu Jahl sagte: „O Allah, wenn dies wahrhaftig die Wahrheit von Dir ist, so lass Steine vom Himmel auf uns regnen oder bringe über uns eine schmerzhafte Strafe!“ (8:32). Da wurden herabgesandt: „Doch Allah würde sie nicht strafen, solange du unter ihnen bist, noch würde Allah sie strafen, während sie um Vergebung bitten. Und warum sollte Allah sie nicht strafen, wo sie doch den Zutritt zur geschützten Gebetsstätte verwehren…“ (8:33-34) bis zum Ende des Verses."
  },
  // 28: c2dcc951-8bbe-4932-956c-b35200ee307f (hadith 4649)
  {
    id: "c2dcc951-8bbe-4932-956c-b35200ee307f",
    de: "Muhammad ibn an-Nadr überlieferte uns: ‘Ubaydullah ibn Mu‘adh überlieferte uns: Mein Vater überlieferte uns: Shu‘bah überlieferte uns von ‘Abd al-Hamid, dem Gefährten von az-Ziyadi, der Anas ibn Malik sagen hörte: Abu Jahl sagte: „O Allah, wenn dies wahrhaftig die Wahrheit von Dir ist, so lass Steine vom Himmel auf uns regnen oder bringe über uns eine schmerzhafte Strafe!“ (8:32). Da wurden herabgesandt: „Doch Allah würde sie nicht strafen, solange du unter ihnen bist, noch würde Allah sie strafen, während sie um Vergebung bitten. Und warum sollte Allah sie nicht strafen, wo sie doch den Zutritt zur geschützten Gebetsstätte verwehren…“ (8:33-34) bis zum Ende des Verses."
  },
  // 29: d68b7161-259f-4fbd-b85d-4aa87fb175ea (hadith 4650)
  {
    id: "d68b7161-259f-4fbd-b85d-4aa87fb175ea",
    de: "Al-Hasan ibn ‘Abd al-‘Aziz überlieferte uns: ‘Abdullah ibn Yahya überlieferte uns: Haywah überlieferte uns von Bakr ibn ‘Amr, von Bukayr, von Nafi‘, von Ibn ‘Umar (möge Allah mit beiden zufrieden sein), dass ein Mann zu ihm kam und sagte: „O Abu ‘Abd ar-Rahman, hörst du nicht, was Allah in Seinem Buch erwähnt hat: ‚Und wenn zwei Parteien von den Gläubigen miteinander kämpfen…‘ (49:9) bis zum Ende des Verses? Was hält dich davon ab zu kämpfen, wie Allah es in Seinem Buch erwähnt hat?“ Da erwiderte er: „O Sohn meines Bruders, bezüglich dieses Verses getäuscht zu werden und nicht zu kämpfen, ist mir lieber, als bezüglich dieses Verses getäuscht zu werden, in dem Allah der Erhabene sagt: ‚Und wer einen Gläubigen vorsätzlich tötet…‘ (4:93) bis zu seinem Ende.“ Der Mann sagte: „Gewiss sagt Allah doch: ‚Und kämpft gegen sie, bis es keine Verführung mehr gibt‘ (8:39)!“ Ibn ‘Umar erwiderte: „Das haben wir zur Zeit des Gesandten Allahs (Friede sei auf ihm) getan, als der Islam gering an Zahl war und ein Mann wegen seiner Religion verfolgt wurde: Entweder töteten sie ihn, oder sie legten ihn in Fesseln. Bis der Islam zahlreich wurde und es keine Verführung mehr gab.“ Als jener sah, dass er ihm in seinem Vorhaben nicht zustimmte, sagte er: „Was ist deine Ansicht über ‘Ali und ‘Uthman?“ Ibn ‘Umar sagte: „Was meine Ansicht über ‘Ali und ‘Uthman ist? Was ‘Uthman betrifft, so hatte Allah ihm verziehen, doch ihr verabscheutet es, dass Er ihm verzieh. Und was ‘Ali betrifft, so ist er der Vetter des Gesandten Allahs (Friede sei auf ihm) und sein Schwiegersohn.“ Und er deutete mit seiner Hand und sagte: „Und dies ist seine Tochter – oder: seine Tochter ist dort, wie ihr seht.“"
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
  const outPath = 'data/german-batches/hadith-outputs/bukhari-batch-002.json';
  fs.writeFileSync(outPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log(`Successfully wrote ${translations.length} items to ${outPath}`);
} else {
  console.error('Validation failed, did not write output file.');
  process.exit(1);
}
