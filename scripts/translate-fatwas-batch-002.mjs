import fs from 'node:fs';
import { validateGerman } from './validate-german-text.mjs';

const allItems = JSON.parse(fs.readFileSync('data/german-batches/fatwas-batch-002-uthaymeen.json', 'utf8'));

// Exclude the 3 damaged / truncated ones for Needs Mo
const excludedIds = new Set([
  'e942fb99-5c68-4433-a192-d89779835490', // reversed statements
  '68de1710-d5e9-4cdc-8884-e874eefb55d8', // truncated conditional
  '24d18252-900f-4fca-9e83-40bc9fe2073e', // truncated question at end
]);

const items = allItems.filter(item => !excludedIds.has(item.id));

const translations = {
  // [1] 1152f5de-cffd-402f-b6e4-99c94624d789: خصائص شهر رمضان
  "1152f5de-cffd-402f-b6e4-99c94624d789": `Sie fällt darunter; denn Handelswaren (Urud at-Tidscharah) sind nicht auf eine bestimmte Vermögensart beschränkt. Es können Grundstücke sein, es können Elektrogeräte sein, es können Maschinen sein, es können Autos sein, es können Stoffe sein, es können Gefäße sein oder es können Duftstoffe sein. Wichtig ist: Sie sind nicht auf eine Vermögensart beschränkt. Sie haben ein Kriterium und keine zahlenmäßige Grenze, und das Kriterium lautet: dass man sie für den Handel bestimmt hat. Ein Beispielfall: Ein Mann besitzt viele Gebäude, die er vermietet und deren Mieteinnahmen er jedes Jahr einstreicht, eine oder zwei Millionen – fällt darauf Zakat an? Die Antwort: Darauf fällt keine Zakat an; denn der Mann beabsichtigt, dass die Gebäude in seinem Besitz bleiben. Aber ein anderer Mann, ein Immobilienhändler, kauft das Gebäude heute und verkauft es morgen – fällt darauf Zakat an? Die Antwort: Ja, darauf fällt Zakat an. Deshalb sind Handelswaren für manche Wissenssucher unklar, doch wenn man das Kriterium kennt, wird die Angelegenheit leicht verständlich.`,

  // [2] 12835175-3df3-40fe-8b71-0bde6524803e: تفسير أواخر سورة الأحزاب
  "12835175-3df3-40fe-8b71-0bde6524803e": `Ja, sie ist gültig, und der Beleg ist die Aussage Allahs – Mächtig und Erhaben ist Er –: ﴿Und wenn du sie fragst, werden sie ganz gewiss sagen: „Wir haben nur geplaudert und gescherzt.“﴾ [At-Tawbah 9:65], das heißt: wenn du die Spötter fragst; denn sie spotteten und sagten: „Wir haben nicht wie diese unsere Quran-Rezitoren gesehen – sie meinten den Propheten – Friede und Segen seien auf ihm und seiner Familie – und seine Gefährten –, niemanden, der gieriger nach Essen, verlogener mit den Zungen oder feiger beim Aufeinandertreffen im Kampf wäre.“`,

  // [3] 1a3e9d2c-548a-4fc4-9cb6-b79b149ed1be: شهر رجب .. ما ثبت فيه من الفضل ومالم يثبت
  "1a3e9d2c-548a-4fc4-9cb6-b79b149ed1be": `Ja, er hat einen Vorzug gegenüber anderen Monaten allein beim Fasten; denn der Prophet – Friede und Segen seien auf ihm und seiner Familie – fastete viel in ihm, sodass er fast den gesamten Monat fastete, bis auf einen kleinen Teil davon. Vieles Fasten im Scha'ban gehört also zur Sunnah; im Radschab hingegen nicht. Und das Feiern der Nacht der Himmelsreise (al-Isra wal-Mi'radsch) ist eine Neuerung im Glauben (Bid'ah).`,

  // [4] 1af650e9-e52a-41c9-b9e7-b6e307f0c0ac: في ظلال سورة الفرقان
  "1af650e9-e52a-41c9-b9e7-b6e307f0c0ac": `Ja, es erfordert Anstrengung, insbesondere bei dem, was im Gehorsam schwerfällt; denn der Mensch verspürt darin Mühsal. Daher sagte der Prophet (Friede sei auf ihm) über den Dienst an der Wache (Ribat) unter den Eigenschaften der Wachenden: „und das gründliche Verrichten des Wudu trotz widriger Umstände“. Und in einer Überlieferung: „in den kalten Tagen“; denn an kalten Tagen fällt es dem Menschen wegen der Kälte des Wassers schwer, den Wudu zu vollziehen.`,

  // [5] 255a5d36-f6e3-431b-a4ca-4683e46f4046: بيان حال الأمة الإسلامية مع تسلط الأعداء عليها
  "255a5d36-f6e3-431b-a4ca-4683e46f4046": `Die erste Möglichkeit ist vorzuziehen; denn wenn du beim Imam verweilst, bis er das Gebet beendet, erlangst du das gesamte Nachtgebet (Qiyam al-Layl) mit der Gemeinschaft und gönnst dir zugleich mehr Ruhe. Und wenn die zweite Form – nämlich den Imam zu verlassen, am Ende der Nacht das Tahaddschud-Gebet zu verrichten und das Witr-Gebet zu beten – erwünschter gewesen wäre, hätte der Prophet (Friede sei auf ihm) zu den Gefährten gesagt: „Betet am Ende der Nacht das Tahaddschud“. Doch er sagte dies nicht, sondern er sagte: „Wer mit dem Imam betet, bis dieser geht, dem wird das Gebet einer ganzen Nacht aufgeschrieben.“ Zu den Besonderheiten des Ramadan gehört, dass sich darin die Nacht der Bestimmung (Laylat al-Qadr) befindet.`,

  // [6] 2cfe4bac-a7e9-4491-816f-35c0be59ed24: شروط النكاح
  "2cfe4bac-a7e9-4491-816f-35c0be59ed24": `Sie hält die Wartezeit ('Iddah) ein; dies unterscheidet sich von der Scheidung. Schau, gepriesen sei Allah! Beim Todesfall hält sie die Wartezeit ein, selbst wenn er die Ehe noch nicht vollzogen hatte. Wenn für ihn also der Ehevertrag mit einer Frau geschlossen wurde, während er sich in Mekka befindet und die Frau in Medina ist, und er dann auf dem Weg stirbt, ist seine Ehefrau in Medina verpflichtet, die Wartezeit einzuhalten, gemäß der Aussage Allahs des Erhabenen: ﴿Und diejenigen von euch, die abberufen werden und Gattinnen hinterlassen, diese sollen für sich selbst vier Monate und zehn Tage abwarten﴾ [Al-Baqarah 2:234]. Wenn sie jedoch schwanger ist und ihr Ehemann stirbt, so endet ihre Wartezeit mit der Niederkunft. Wenn ein Mann stirbt, während seine Frau in den Geburtswehen liegt, und sie entbindet, noch bevor er begraben wird: Ist ihre Wartezeit damit beendet oder nicht? Ja, sie ist beendet.`,

  // [7] 311777f4-ef27-4f54-8bca-69a37a48b2b9: دعاء وتأمين
  "311777f4-ef27-4f54-8bca-69a37a48b2b9": `Dies ist keine Bedingung. Es gehört nicht zu den Bedingungen der Reue (Tawbah), dass man niemals rückfällig wird. Denn es kann vorkommen, dass der Mensch fest entschlossen ist, nicht rückfällig zu werden, ihn dann jedoch seine zum Bösen treibende Seele überwältigt und er die Sünde erneut begeht. Wenn er rückfällig wird, wird die vorangegangene Reue nicht ungültig, aber er muss für die neu begangene Sünde eine erneute Reue vollziehen. Bedingung ist, dass die Reue zu einer Zeit erfolgt, in der Reue noch angenommen wird.`,

  // [8] 6289d70c-ded8-4810-9d06-7fe00e5ee2bb: شروط التوبة
  "6289d70c-ded8-4810-9d06-7fe00e5ee2bb": `Sie gehören zum Kopf; und wenn beide Ohren zum Kopf gehören, fallen sie unter die Allgemeingültigkeit Seiner Aussage: ﴿und streicht über eure Köpfe﴾ [Al-Ma'idah 5:6]. Alles Lob gebührt Allah für Seine klare Darlegung. Wie sehr der Mensch auch versuchen mag, das Überstreichen der Ohren entfallen zu lassen, so vermag er dies weder aus dem Quran noch aus der Sunnah zu begründen. Was die Sunnah betrifft, so ist vom Propheten – Friede und Segen seien auf ihm – mehrfach und weitverbreitet überliefert, dass er seine Ohren zusammen mit seinem Kopf überstrich. Aber wie wird der Kopf überstrichen?`,

  // [9] 821df365-f16d-4877-9f24-4ccecc184c03: الحث على الأعمال الصالحة في عشر ذي الحجة
  "821df365-f16d-4877-9f24-4ccecc184c03": `Ja, er opfert; denn es gibt keinen Zusammenhang zwischen dem Opfertier (Udhivah) und dem Schneiden von Haaren oder Nägeln. Bedingungen für die Verpflichtung zu Haddsch und Umrah: Der Haddsch und die Umrah sind einmal im Leben für jeden dazu Fähigen verpflichtend (wajib), unter fünf Bedingungen: das Erreichen der Geschlechtsreife (Bulugh), geistige Zurechnungsfähigkeit ('Aql), der Islam, persönliche Freiheit und finanzielle sowie körperliche Fähigkeit (Istita'ah). Dies sind fünf Bedingungen; wenn sie erfüllt sind, ist der Mensch verpflichtet, den Haddsch zu vollziehen.`,

  // [10] adf1ec4a-7ad9-4605-831c-0e2c5fc36f5c: فضل العشر الأول من ذي الحجة
  "adf1ec4a-7ad9-4605-831c-0e2c5fc36f5c": `Es wird nicht angenommen; denn er ist kein Muslim, und es ist nicht erlaubt, jemanden, der das Gebet nicht verrichtet, in das geschützte Gebiet des Haram eintreten zu lassen; gemäß der Aussage Allahs des Erhabenen: ﴿O die ihr glaubt, die Götzendiener sind fürwahr unrein, so sollen sie sich der geschützten Gebetsstätte nach diesem ihrem Jahr nicht mehr nähern﴾ [At-Tawbah 9:28]. Und wer jemanden bei sich in seiner Reisegesellschaft hat, der nicht betet, ist verpflichtet, zu ihm zu sagen: „Nimm den Islam an, andernfalls verwehren wir dir den Zutritt zu den Grenzen des Haram.“ Die zweite Bedingung: das Erreichen der Reife im Gegensatz zum Kindesalter; dem Kind obliegt der Haddsch nicht verpflichtend, doch wenn es ihn vollzieht, ist er gültig, erfüllt aber nicht die Pflicht des Islam. Der Beleg für die Gültigkeit ist, dass eine Frau dem Propheten (Friede sei auf ihm) ein Kind emporhob und fragte: „Gilt für dieses Kind ein Haddsch?“ Er antwortete: „Ja, und du erhältst dafür Lohn.“`,

  // [11] 0deeff46-f33b-40ec-ace6-f30fb9de646c: تارك الصلاة تهاونا هل يخلد في النار؟
  "0deeff46-f33b-40ec-ace6-f30fb9de646c": `Die Bedeutung dieses Hadith ist: Wer aufrichtig aus ganzem Herzen „La ilaha illa Allah“ spricht, geht in das Paradies ein. Denn wenn er dies aufrichtig aus seinem Herzen spricht, muss er zwingend den Gottesdienst für Allah verrichten; denn die Bedeutung von „La ilaha illa Allah“ lautet: Es gibt keinen zu Recht angebeteten Gott außer Allah. Und wenn seine Bedeutung lautet, dass es keinen zu Recht angebeteten Gott außer Allah gibt, und jemand spricht es nur mit seiner Zunge aus, dient aber Allah nicht, so sind dies nutzlose Worte. Wie kannst du sagen: „Es gibt keinen zu Recht angebeteten Gott außer Allah“, und Ihm dann nicht dienen?! Dies ist unvereinbar. Daher verlangt das aufrichtige Sprechen von „La ilaha illa Allah“ aus dem Herzen zwingend, dass man den Gottesdienst für Allah verrichtet; andernfalls ist man unaufrichtig.`,

  // [13] 2576dfb1-6117-4319-a347-c9b9f18136f2: نوع الشرك الذي وقع فيه كفار قريش
  "2576dfb1-6117-4319-a347-c9b9f18136f2": `Die Antwort darauf lautet: Erstens ist die Formulierung des Schreibers „In Seinem erhabenen Namen“ ein Verstoß gegen die Sunnah; denn die Sunnah verlangt, dass der Mensch sagt: „Im Namen Allahs“ (Bismillah), mit dem ausdrücklichen Namen und nicht mit einem Pronomen. Dies war die Sunnah des Propheten (Friede sei auf ihm) und der Propheten vor ihm. Allah – Segensreich und Erhaben ist Er – sagte über das Schreiben Sulaymans an die Königin von Saba: ﴿Es ist von Sulayman, und es lautet: Im Namen Allahs, des Allerbarmers, des Barmherzigen﴾. Und der Prophet (Friede sei auf ihm) pflegte, wenn er an Herrscher schrieb, um sie zu Allah einzuladen, mit den Worten zu beginnen: „Im Namen Allahs, des Allerbarmers, des Barmherzigen“. Was das Pronomen betrifft, so weist es nicht auf den Namen Allahs hin, außer für jemanden, der bereits weiß, dass Angelegenheiten im Namen Allahs begonnen werden, sodass er erkennt, dass sich dieses Pronomen auf Allah bezieht.`,

  // [14] 53761d06-629a-4516-aaa9-cc0a8514e489: صلى الظهر ثلاث ركعات ثم تذكر بعد الفراغ من الصلاة فماذا يلزمه ؟
  "53761d06-629a-4516-aaa9-cc0a8514e489": `Diese Frage ist sehr wichtig; denn sie kommt häufig vor, und ihr Urteil ist vielen Menschen verborgen. Bei dieser Gelegenheit möchte ich insbesondere meine Brüder, die Imame der Moscheen, dazu aufrufen, sich fundiertes Wissen über die Bestimmungen der Vergesslichkeitsniederwerfung (Sudschud as-Sahw) anzueignen; denn solche Fälle ereignen sich oft und bereiten vielen Menschen Schwierigkeiten. Wenn der Imam in den Bestimmungen der Vergesslichkeitsniederwerfung bewandert ist, nützt er sich selbst und hilft anderen Menschen durch seine Taten und Worte, damit sich die Gebote Allahs des Allmächtigen und Erhabenen in der Gemeinschaft verbreiten und sie Allah mit klarem Einblick anbeten.`,

  // [15] 577228f8-e922-4c44-b178-9f2d5ae5f6d8: حكم القصائد التي فيها مدح النبي صلى الله عليه وسلم
  "577228f8-e922-4c44-b178-9f2d5ae5f6d8": `Diese Formulierung – nämlich: „Was ist die Ansicht der Religion?“ oder „Was ist die Ansicht des Islam?“ oder Ähnliches – höre ich in einer Fragestellung nicht gern.`,

  // [16] 667f729b-320b-4b64-be02-b65710ad0bf6: حلفت عدت مرات أن لا تغسل يديها أكثر من ثلاث مرات ثم حنثت فماذا يلزمها
  "667f729b-320b-4b64-be02-b65710ad0bf6": `Die Antwort darauf erfolgt aus zwei Gesichtspunkten: Der erste Gesichtspunkt ist, dass es sich für den Menschen nicht gehört, einen Schwur darauf abzulegen, eine Sünde zu unterlassen oder eine Pflicht zu erfüllen; denn dies gehört zu dem, was Allah verboten hat. Allah der Erhabene sagte: ﴿Und sie schwuren bei Allah ihren eifrigsten Eid: Wenn du ihnen befiehlst, werden sie ganz gewiss ausziehen. Sprich: Schwört nicht! Gehorsam ist geboten. Gewiss, Allah ist wohl unterrichtet über das, was ihr tut﴾. Was sich für den Menschen geziemt, ist vielmehr, die Hilfe Allahs des Allmächtigen und Erhabenen beim Verrichten von Gehorsamstaten und beim Unterlassen des Verbotenen zu erbitten, ohne zu schwören. Er soll seine Seele darin schulen, den Befehl Allahs und Seines Gesandten anzunehmen, indem er das Gebotene tut und das Verbotene meidet, ohne sich durch einen Eid zu verpflichten.`,

  // [17] 8b50baf5-4e83-4bd1-98d4-ca0dda92fcd2: خدمة المرأة لزوجها
  "8b50baf5-4e83-4bd1-98d4-ca0dda92fcd2": `Im Namen Allahs, des Allerbarmers, des Barmherzigen. Alles Lob gebührt Allah, dem Herrn der Welten, und ich bete um Segen und Frieden für unseren Propheten Muhammad, seine Familie und all seine Gefährten. Vor der Beantwortung dieser Frage möchte ich betonen, dass ein Buch, das irgendein Mensch verfasst hat – unabhängig von seinem religiösen oder wissenschaftlichen Wissensstand –, nicht einfach als „der Islam“ bezeichnet werden darf; und es ist nicht zulässig, eine von einem Gelehrten erlassene Fatwa so darzustellen, als sei exakt dies der Islam. Denn es ist durchaus möglich, dass diese Ansicht, von der behauptet wird, sie sei der Islam, oder dieses Urteil, von dem behauptet wird, es sei das Urteil Allahs und Seines Gesandten, nicht mit dem Urteil Allahs und Seines Gesandten übereinstimmt und nicht zu den gesicherten islamischen Geboten gehört. Vielmehr sagt man: juristische Urteile (al-Ahkam al-Fiqhiyyah).`,

  // [18] 8cb8d0b4-3421-4b07-9944-f19aab14684a: قال لزوجته إن ذهبت إلى المكان الفلاني فأنت محرمة علي ثم ذهبت فماذا يلزمه ؟
  "8cb8d0b4-3421-4b07-9944-f19aab14684a": `Vor der Beantwortung dieser Frage möchte ich dir und jedem, der dies hört, raten: Es geziemt sich für den Menschen nicht, wenn er von seiner Familie etwas verlangt, ihnen gegenüber Worte des Verweigerungsverbots (Tahrim), der Scheidung (Talaq), der Dhihar-Formel oder Ähnliches auszusprechen. Man soll vielmehr über eine solche innere Charakterstärke verfügen, dass man es nicht nötig hat, Anweisungen mit solchen Worten zu bekräftigen. Allah der Erhabene sagte zu Seinem Propheten (Friede sei auf ihm): ﴿O Prophet, warum erklärst du für verboten, was Allah dir erlaubt hat, im Streben nach dem Wohlgefallen deiner Gattinnen? Und Allah ist Allvergebend, Barmherzig﴾. Halte also deine Zunge von solchen Worten zurück und zeige eine starke Persönlichkeit, sodass deine Worte Einfluss auf deine Ehefrau haben, ohne dass du dies mit solchen Schwüren bekräftigen musst.`,

  // [19] f4f2f06c-004b-4242-9ff2-1ec85e92ec87: الوسوسة في ذات الله
  "f4f2f06c-004b-4242-9ff2-1ec85e92ec87": `Was ihre Umrah betrifft, so lässt der offenkundige Sinn ihrer Worte darauf schließen, dass sie die Umrah gültig verrichtet hat; denn sie berichtet, dass sie den Tawaf um die Ka'bah und das Schreiten zwischen As-Safa und Al-Marwah vollzogen hat. Ihr bleibt lediglich das Kürzen der Haare übrig, falls sie die Haare noch nicht gekürzt hat.`,

  // [20] 3a8fed54-5e61-4818-91ae-4f0c17c1418a: تفسير آيات من سورة الواقعة
  "3a8fed54-5e61-4818-91ae-4f0c17c1418a": `Es steht uns nicht zu, diese Frage zu stellen; denn bei den Dingen des Verborgenen (Ghayb) ist es unsere Pflicht, an sie zu glauben, ohne nach dem zu fragen, worüber uns keine Nachricht erreicht hat. Wir sagen: Wenn diese Vögel Nahrung benötigen, so gibt es im Paradies überreichlich viel, wovon sie sich nähren können; und wenn sie keine Nahrung benötigen, so hat Allah über alle Dinge vollkommene Macht. Bis hierher reichen die Worte über das, was Allah an Erklärung dieser edlen Verse gewährt hat. Ich bitte Allah den Erhabenen, mich und euch zu den Voranschreitenden im Guten gehören zu lassen; denn Er hat über alle Dinge vollkommene Macht.`,

  // [21] 6cd8d85c-059e-4b6b-bd07-11d127f2beee: أعمال أيام الحج
  "6cd8d85c-059e-4b6b-bd07-11d127f2beee": `Es ist nicht erlaubt. Wenn du befürchtest, dass die Gebetszeit des Ischa abläuft, während du von Arafat nach Muzdalifah unterwegs bist, dann bete! Steige aus dem Auto aus und bete abseits der Fahrspuren, und lass das Gebet nicht verstreichen, bis seine Zeit abgelaufen ist; denn das Hinausschieben des Gebets über seine Zeit ohne gültigen Grund gehört zu den schweren Sünden (Kaba'ir), und eine solche Tat wird abgewiesen, gemäß den Worten des Propheten (Friede sei auf ihm): „Wer eine Tat vollbringt, die nicht auf unserer Sache beruht, so ist sie abzuweisen.“ Bestimmung über den Aufbruch von Muzdalifah vor der Morgendämmerung oder vor Sonnenaufgang: Rechtsfrage: Wenn jemand vor dem Morgengrauen oder vor dem Aufgang der Sonne von Muzdalifah aufbricht, ist dies erlaubt?`,

  // [22] 88ea69dd-6d6e-4bb9-8be0-45fed23cd6c6: أنواع أنساك الحج وصفتها
  "88ea69dd-6d6e-4bb9-8be0-45fed23cd6c6": `Er setzt seine Reise fort; denn der Mann hat sich beeilt und war abreisebereit, doch ein unvorhergesehenes Hindernis hielt ihn vor Sonnenuntergang auf, so setzt er seine Reise fort. Das Urteil über den Abschiedstawaf vor dem Steinigen der Dschamarat: Dazu gehört: Wenn jemand am Morgen des zwölften Tages den Abschiedstawaf vollzieht, dann nach Mina hinausgeht und die Dschamarat nach dem Höchststand der Sonne steinigt und danach in seine Heimat reist, so ist dies nicht erlaubt; denn der Abschiedstawaf muss zwingend die allerletzte Handlung sein, doch hier hat er das Steinigen zur letzten Handlung gemacht, und dies ist nicht erlaubt.`,

  // [23] 8eb30740-d602-4843-ad35-ef559a4dce43: هل تجوز دعوة غير المسلمين بغير اللغة العربية؟
  "8eb30740-d602-4843-ad35-ef559a4dce43": `Wir sagen: Sein Heranziehen der Aussage von asch-Schafi'i ist verfehlt; denn die Aussage von asch-Schafi'i gilt nicht selbst als eigenständiger Beweis, sondern bedarf selbst eines Beweises. Dies gilt unter der Annahme, dass asch-Schafi'i dies tatsächlich gesagt hat – was ich nicht mit Gewissheit weiß; doch selbst wenn wir annehmen, dass dieser Mann sich dessen sicher ist, sagen wir: Die Aussage von asch-Schafi'i ist kein eigenständiger Beweisgrund, sondern bedarf eines Beweises. Und asch-Schafi'i (möge Allah ihm barmherzig sein) und andere Gelehrte pflegten zu sagen: Wenn ihr findet, dass unsere Worte dem Wort Allahs und dem Wort Seines Gesandten widersprechen, so werft sie gegen die Wand.`,

  // [24] 98b18624-79fa-4812-b9d6-c23176766f96: تفسير آيات من سورة البلد
  "98b18624-79fa-4812-b9d6-c23176766f96": `Doch, und so geziemt es sich: Wenn du im edlen Buch einen Vers findest, der zwei Bedeutungen zulässt und zwischen beiden kein Widerspruch besteht, so lege ihn nach beiden Bedeutungen aus; denn der Quran ist umfassender und weitreichender. Wenn jedoch zwischen beiden Bedeutungen ein Widerspruch besteht, dann suche nach der vorzuziehenden Ansicht (ar-Radschih). Ein Beispiel dafür ist die Aussage des Erhabenen: ﴿Und die geschiedenen Frauen sollen für sich selbst drei Quru' abwarten﴾ [Al-Baqarah 2:228]. Der Begriff ﴿Quru'﴾ ist der Plural von Qar', mit Fathah auf dem Qaf. Was ist ein Qar'? Es wurde gesagt: Es bedeutet die Menstruation. Und es wurde gesagt: Es bedeutet die Reinheitsphase. Hier ist es unmöglich, den Vers nach beiden Bedeutungen zugleich auszulegen; warum? Wegen des Widerspruchs. Suche jedoch nach dem ausschlaggebenden Beleg für eine der beiden Ansichten und nimm sie an.`,

  // [25] bb95226a-6e69-412d-ad3b-0d3046f85eaa: تفسير آيات من سورة التكوير
  "bb95226a-6e69-412d-ad3b-0d3046f85eaa": `Ja, es geschieht durch unsere eigene Wahl und unseren eigenen Willen. Wäre dem nicht so, gäbe es durch das Entsenden der Gesandten keinen Beweis gegen uns, da wir sagen könnten: „Wir haben keine Wahlmöglichkeit.“ Der Mensch handelt zweifellos aus freier Wahl. Jeder Mensch weiß: Wenn er nach Mekka reisen will, so geschieht dies aus seiner Wahl; wenn er nach Medina reisen will, geschieht dies aus seiner Wahl; wenn er nach Jerusalem (Bayt al-Maqdis) reisen will, geschieht dies aus seiner Wahl; wenn er nach Riad reisen will, geschieht dies aus seiner Wahl; oder an jeden beliebigen Ort, den er anstrebt, geschieht dies aus seiner Wahl. Er sieht nicht, dass ihn irgendjemand dazu gezwungen hätte, und er spürt keinerlei Zwang dazu.`
};

const output = [];
const errors = [];

for (const item of items) {
  const de = translations[item.id];
  if (!de) {
    errors.push(`Missing translation for ${item.id} (${item.title})`);
    continue;
  }
  const errs = validateGerman(item, de);
  if (errs.length > 0) {
    errors.push(`Validation failed for ${item.id}: ${errs.join(', ')}`);
  }
  output.push({
    id: item.id,
    title: item.title,
    reference: item.reference,
    de: de.trim()
  });
}

if (errors.length > 0) {
  console.error('ERRORS FOUND:');
  errors.forEach(e => console.error(e));
  process.exit(1);
}

fs.writeFileSync('data/german-batches/fatwas-batch-002-translated.json', JSON.stringify(output, null, 2));
console.log(`Successfully translated and validated all ${output.length} fatwas in Batch 2!`);
