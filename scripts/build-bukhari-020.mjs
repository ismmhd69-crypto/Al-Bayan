import fs from 'fs';
import path from 'path';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = path.resolve('data/german-batches/hadith-inputs/bukhari-batch-020.json');
const outputPath = path.resolve('data/german-batches/hadith-outputs/bukhari-batch-020.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const items = JSON.parse(raw);

const translations = [
  // 0: 5700, 5701
  "Muhammad ibn Baschschar berichtete mir: Ibn Abi 'Adi überlieferte uns, von Hischam, von 'Ikrima, von Ibn 'Abbas: Der Prophet (Friede sei auf ihm) ließ sich am Kopf schröpfen, während er sich im Ihram befand, wegen eines Schmerzes, an dem er litt, an einem Wasserplatz namens Lahyu Dschamal. Und Muhammad ibn Sawa' sagte: Hischam berichtete uns, von 'Ikrima, von Ibn 'Abbas, dass der Gesandte Allahs (Friede sei auf ihm) sich am Kopf schröpfen ließ, während er sich im Ihram befand, wegen einer Migräne, an der er litt.",

  // 1: 5702
  "Isma'il ibn Aban überlieferte uns: Ibn al-Ghasil überlieferte uns, er sagte: 'Asim ibn 'Umar berichtete mir, von Dschabir ibn 'Abdillah, der sagte: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Wenn es in irgendeinem eurer Heilmittel etwas Gutes gibt, so ist es in einem Schluck Honig, im Schnitt des Schröpfens oder im Brennen mit Feuer (Kauterisation); doch liebe ich es nicht, mich brennen zu lassen.«",

  // 2: 5703
  "Musaddad überlieferte uns: Hammad überlieferte uns, von Ayyub, der sagte: Ich hörte Mudschahid, von Ibn Abi Laila, von Ka'b – nämlich Ibn 'Udschra –, der sagte: Der Prophet (Friede sei auf ihm) kam zur Zeit von al-Hudaibiyya zu mir, während ich unter einem Kochtopf Feuer machte und die Läuse von meinem Kopf herabfielen. Da sagte er: »Plagen dich deine Schädlinge?« Ich antwortete: »Ja.« Er sagte: »So rasiere deinen Kopf und faste drei Tage, oder speise sechs Bedürftige, oder schlachte ein Opfertier.« Ayyub sagte: Ich weiß nicht, mit welchem von diesen er begann.",

  // 3: 5704
  "Abu l-Walid Hischam ibn 'Abd al-Malik überlieferte uns: 'Abd ar-Rahman ibn Sulaiman ibn al-Ghasil überlieferte uns: 'Asim ibn 'Umar ibn Qatada überlieferte uns, er sagte: Ich hörte Dschabir, vom Propheten (Friede sei auf ihm), der sagte: »Wenn in einem eurer Heilmittel Heilung liegt, so liegt sie im Schnitt des Schröpfens oder im Brennen mit Feuer; doch liebe ich es nicht, mich brennen zu lassen.«",

  // 4: 5705
  "'Imran ibn Maisara überlieferte uns: Ibn Fudail überlieferte uns: Husain überlieferte uns, von 'Amir, von 'Imran ibn Husain (möge Allah mit beiden zufrieden sein), der sagte: »Es gibt keine Ruqya (Heilbeschwörung) außer gegen den bösen Blick oder einen giftigen Stich.« Ich erwähnte dies Sa'id ibn Dschubair, worauf er sagte: Ibn 'Abbas berichtete uns, dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Mir wurden die Völker vorgeführt, und ein Prophet und zwei Propheten zogen vorbei, begleitet von einer kleinen Schar, und ein Prophet zog vorbei, mit dem niemand war, bis mir eine gewaltige Menschenmenge erschien. Ich fragte: ›Was ist das? Ist das meine Gemeinschaft?‹ Es wurde gesagt: ›Das sind Moses und sein Volk.‹ Man sagte zu mir: ›Blicke zum Horizont!‹ Und da füllte eine Menschenmenge den Horizont. Dann wurde zu mir gesagt: ›Blicke hierhin und dorthin an die Horizonte des Himmels!‹ Und da war eine Menschenmenge, die den Horizont füllte. Es wurde gesagt: ›Das ist deine Gemeinschaft, und von ihnen werden siebzigtausend ohne Abrechnung ins Paradies eingehen.‹« Daraufhin ging er hinein, ohne es ihnen näher zu erklären. Da diskutierten die Leute eifrig und sagten: »Wir sind diejenigen, die an Allah geglaubt und Seinem Gesandten gefolgt sind; also sind wir es, oder unsere Kinder, die im Islam geboren wurden, denn wir wurden ja in der Dschahiliyya geboren.« Dies erreichte den Propheten (Friede sei auf ihm), da trat er heraus und sagte: »Es sind jene, die nicht um Ruqya (Heilbeschwörung) bitten, keine Vorzeichen deuten, sich nicht mit Feuer brennen lassen (kauterisieren) und auf ihren Herrn vertrauen.« Da stand 'Ukkascha ibn Mihsan auf und sagte: »Bin ich einer von ihnen, o Gesandter Allahs?« Er sagte: »Ja.« Da stand ein anderer auf und sagte: »Bin ich einer von ihnen?« Er antwortete: »'Ukkascha ist dir zuvorgekommen.«",

  // 5: 5706
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Schu'ba, der sagte: Humaid ibn Nafi' berichtete mir, von Zainab, von Umm Salama (möge Allah mit ihr zufrieden sein): Der Ehemann einer Frau war gestorben, und ihr Auge erkrankte. Man erwähnte ihren Zustand dem Propheten (Friede sei auf ihm) und erwähnte das Auftragen von Kuhl (Augenschminke), da man um ihr Auge fürchtete. Da sagte er: »Eine von euch verweilte früher in ihrem Haus im schlechtesten ihrer Lumpen – oder in ihren Lumpen im schlechtesten Teil ihres Hauses –, und wenn ein Hund vorbeilief, warf sie ein Stück Kot. Nein, es sind vier Monate und zehn Tage.«",

  // 6: 5707
  "Und 'Affan sagte: Sulaim ibn Hayyan überlieferte uns: Sa'id ibn Mina' überlieferte uns, er sagte: Ich hörte Abu Huraira sagen: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Es gibt keine ansteckende Krankheit (die von sich aus wirkt), kein böses Vorzeichen, keinen Unheils-Kauzvogel (Hama) und kein Unheil im Monat Safar; und fliehe vor dem Aussätzigen, wie du vor dem Löwen fliehst.«",

  // 7: 5708
  "Muhammad ibn al-Muthanna überlieferte uns: Ghundar überlieferte uns: Schu'ba überlieferte uns, von 'Abd al-Malik: Ich hörte 'Amr ibn Huraith sagen: Ich hörte Sa'id ibn Zaid sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Die Trüffel gehört zum Manna (der Himmelsgabe), und ihr Saft ist eine Heilung für das Auge.« Schu'ba sagte: Und al-Hakam ibn 'Utaiba berichtete mir, von al-Hasan al-'Urani, von 'Amr ibn Huraith, von Sa'id ibn Zaid, vom Propheten (Friede sei auf ihm). Schu'ba sagte: Als al-Hakam es mir berichtete, zweifelte ich nicht daran, dass es der Hadith von 'Abd al-Malik war.",

  // 8: 5709-5712
  "'Ali ibn 'Abdillah überlieferte uns: Yahya ibn Sa'id überlieferte uns: Sufyan überlieferte uns, er sagte: Musa ibn Abi 'A'ischa berichtete mir, von 'Ubaidullah ibn 'Abdillah, von Ibn 'Abbas und 'A'ischa, dass Abu Bakr (möge Allah mit ihm zufrieden sein) den Propheten (Friede sei auf ihm) küsste, als er verstorben war. Er sagte: Und 'A'ischa sagte: Wir flößten ihm während seiner Krankheit Medizin in die Wangentasche ein (Ladud), doch er begann uns zu bedeuten: »Flößt mir keine Medizin ein!« Da sagten wir: »Das ist der Widerwille eines Kranken gegen die Medizin.« Als er wieder zu sich kam, sagte er: »Habe ich euch nicht verboten, mir Medizin einzuflößen?« Wir sagten: »Es war der Widerwille eines Kranken gegen die Medizin.« Da sagte er: »Niemand im Haus soll verbleiben, ohne dass ihm Medizin eingeflößt wird – während ich zuschaue –, außer al-'Abbas, denn er war nicht bei euch zugegen.«",

  // 9: 5713
  "'Ali ibn 'Abdillah überlieferte uns: Sufyan überlieferte uns, von az-Zuhri: 'Ubaidullah berichtete mir, von Umm Qais, die sagte: Ich trat mit einem Sohn von mir beim Gesandten Allahs (Friede sei auf ihm) ein, nachdem ich seine Mandeln/Rachenentzündung durch Hinaufdrücken des Gaumenzäpfchens behandelt hatte. Da sagte er: »Warum quält ihr eure Kinder mit diesem Hinaufdrücken? Haltet euch an dieses indische Holz (Kostuswurzel), denn darin sind sieben Heilmittel, darunter gegen das Rippenfellleiden (Brustfellentzündung); es wird als Nasentropfen bei Rachenentzündung verwendet und bei Brustfellentzündung eingeflößt.« Da hörte ich az-Zuhri sagen: Er erklärte uns zwei davon und erklärte uns fünf nicht. Ich sagte zu Sufyan: »Wahrlich, Ma'mar sagt: ›Ich behandelte ihn.‹« Er sagte: »Er hat es nicht behalten; ›ich behandelte ihn‹ habe ich direkt aus dem Munde von az-Zuhri behalten.« Und Sufyan beschrieb den Knaben, dessen Gaumen mit dem Finger angehoben wird, und Sufyan führte den Finger an seinen Gaumen, womit gemeint war, dass sein Gaumen mit dem Finger gehoben wird, und er sagte nicht, dass etwas eingeflößt werden solle.",

  // 10: 5714
  "Bischr ibn Muhammad überlieferte uns: 'Abdullah berichtete uns: Ma'mar und Yunus berichteten uns. Az-Zuhri sagte: 'Ubaidullah ibn 'Abdillah ibn 'Utba berichtete mir, dass 'A'ischa (möge Allah mit ihr zufrieden sein), die Frau des Propheten (Friede sei auf ihm), sagte: Als der Gesandte Allahs (Friede sei auf ihm) schwer erkrankte und seine Schmerzen zunahmen, bat er seine Frauen um Erlaubnis, in meinem Haus gepflegt zu werden. Sie gaben ihm die Erlaubnis. Da kam er gestützt von zwei Männern heraus, während seine Füße über den Boden schleiften, zwischen al-'Abbas und einem anderen Mann. Ich erzählte dies Ibn 'Abbas, der fragte: »Weißt du, wer der andere Mann war, den 'A'ischa nicht nannte?« Ich sagte: »Nein.« Er sagte: »Es war 'Ali.« 'A'ischa sagte: Der Prophet (Friede sei auf ihm) sagte, nachdem er ihr Haus betreten hatte und sein Schmerz heftig geworden war: »Gießt über mich aus sieben Wasserschläuchen, deren Schnüre noch nicht gelöst wurden, damit ich mich an die Menschen wenden kann.« Sie sagte: Da setzten wir ihn in ein Waschbecken von Hafsa, der Frau des Propheten (Friede sei auf ihm), und begannen, aus jenen Wasserschläuchen über ihn zu gießen, bis er uns andeutete, dass wir genug getan hatten. Sie sagte: Dann ging er hinaus zu den Menschen, betete mit ihnen und hielt eine Ansprache an sie.",

  // 11: 5715
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri, der sagte: 'Ubaidullah ibn 'Abdillah berichtete mir, dass Umm Qais bint Mihsan al-Asadiyya – vom Stamm Asad Chuzaima, eine der ersten Auswanderinnen, die dem Propheten (Friede sei auf ihm) den Treueid leisteten, und die Schwester von 'Ukkascha – ihm berichtete, dass sie mit einem Sohn von sich zum Gesandten Allahs (Friede sei auf ihm) kam, dessen Rachen sie wegen einer Mandelentzündung durch Druck behandelt hatte. Da sagte der Prophet (Friede sei auf ihm): »Warum quält ihr eure Kinder mit diesem Hinaufdrücken? Haltet euch an dieses indische Holz, denn darin sind sieben Heilmittel, darunter gegen das Rippenfellleiden.« Er meinte den Kust, und das ist das indische Holz. Und Yunus und Ishaq ibn Raschid berichteten von az-Zuhri: »Sie behandelte ihn.«",

  // 12: 5716
  "Muhammad ibn Baschschar überlieferte uns: Muhammad ibn Dscha'far überlieferte uns: Schu'ba überlieferte uns, von Qatada, von Abu l-Mutawakkil, von Abu Sa'id, der sagte: Ein Mann kam zum Propheten (Friede sei auf ihm) und sagte: »Mein Bruder leidet an heftigem Durchfall.« Er sagte: »Gib ihm Honig zu trinken.« Da gab er ihm davon. Danach kam er wieder und sagte: »Ich habe ihm davon gegeben, doch es hat seinen Durchfall nur noch verstärkt.« Da sagte er: »Allah hat die Wahrheit gesprochen, und der Bauch deines Bruders hat gelogen.« Dies wurde auch von an-Nadr von Schu'ba überliefert.",

  // 13: 5717
  "'Abd al-'Aziz ibn 'Abdillah überlieferte uns: Ibrahim ibn Sa'd überlieferte uns, von Salih, von Ibn Schihab, der sagte: Abu Salama ibn 'Abd ar-Rahman und ein anderer berichteten mir, dass Abu Huraira (möge Allah mit ihm zufrieden sein) sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Es gibt keine ansteckende Krankheit (ohne Allahs Willen), kein böses Vorzeichen im Monat Safar und keinen Unheils-Kauzvogel.« Da sagte ein Beduine: »O Gesandter Allahs, was ist dann mit meinen Kamelen? Sie sind im Sand wie Gazellen, dann kommt ein räudeiges Kamel, tritt unter sie und steckt sie alle mit Räude an!« Da sagte er: »Wer steckte denn das erste an?« Az-Zuhri überlieferte dies von Abu Salama und Sinan ibn Abi Sinan.",

  // 14: 5718
  "Muhammad berichtete mir: 'Attab ibn Baschir berichtete uns, von Ishaq, von az-Zuhri, der sagte: 'Ubaidullah ibn 'Abdillah berichtete mir, dass Umm Qais bint Mihsan – und sie gehörte zu den ersten Auswanderinnen, die dem Gesandten Allahs (Friede sei auf ihm) den Treueid leisteten, und sie war die Schwester von 'Ukkascha ibn Mihsan – ihm berichtete, dass sie mit einem Sohn von sich zum Gesandten Allahs (Friede sei auf ihm) kam, dessen Rachen sie wegen einer Mandelentzündung durch Druck behandelt hatte. Da sagte er: »Fürchtet Allah! Warum quält ihr eure Kinder mit diesen Behandlungen? Haltet euch an dieses indische Holz, denn darin sind sieben Heilmittel, darunter gegen das Rippenfellleiden.« Er meinte den Kust, also al-Qust; und er sagte, dies sei ein Dialektwort.",

  // 15: 5719, 5720, 5721
  "'Arim überlieferte uns: Hammad überlieferte uns, er sagte: Es wurde Ayyub aus den Büchern von Abu Qilaba vorgelesen; einiges davon überlieferte er und einiges wurde ihm vorgelesen. Und dies stand im Buch von Anas: dass Abu Talha und Anas ibn an-Nadr ihn mit Feuer brannten (kauterisierten), und Abu Talha brannte ihn mit eigener Hand. Und 'Abbad ibn Mansur berichtete von Ayyub, von Abu Qilaba, von Anas ibn Malik, der sagte: Der Gesandte Allahs (Friede sei auf ihm) erlaubte einer Familie der Ansar die Ruqya (Heilbeschwörung) gegen giftige Stiche und Ohrenschmerzen. Anas sagte: Ich wurde wegen einer Brustfellentzündung gebrannt, zu Lebzeiten des Gesandten Allahs (Friede sei auf ihm). Abu Talha, Anas ibn an-Nadr und Zaid ibn Thabit waren anwesend, und Abu Talha brannte mich.",

  // 16: 5722
  "Sa'id ibn 'Ufair berichtete mir: Ya'qub ibn 'Abd ar-Rahman al-Qari überlieferte uns, von Abu Hazim, von Sahl ibn Sa'd as-Sa'idi, der sagte: Als der Helm auf dem Kopf des Gesandten Allahs (Friede sei auf ihm) zerschmettert wurde, sein Gesicht blutete und sein rechter Schneidezahn abbrach, trug 'Ali immer wieder Wasser in einem Schild herbei, und Fatima kam, um das Blut von seinem Gesicht abzuwaschen. Als Fatima (Friede sei auf ihr) sah, dass das Blut immer stärker wurde als das Wasser, nahm sie ein Stück einer Schilfmatte, verbrannte es und legte die Asche auf die Wunde des Gesandten Allahs (Friede sei auf ihm), woraufhin das Blut stillstand.",

  // 17: 5723
  "Yahya ibn Sulaiman berichtete mir: Ibn Wahb berichtete mir, er sagte: Malik berichtete mir, von Nafi', von Ibn 'Umar (möge Allah mit beiden zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: »Das Fieber stammt vom Hauch der Hölle, so kühlt es mit Wasser ab.« Nafi' sagte: Und 'Abdullah pflegte zu sagen: »Nimm die Pein von uns hinweg.«",

  // 18: 5724
  "'Abdullah ibn Maslama überlieferte uns, von Malik, von Hischam, von Fatima bint al-Mundhir, dass Asma' bint Abi Bakr (möge Allah mit beiden zufrieden sein), wenn eine Frau mit Fieber zu ihr gebracht wurde, für sie betete, Wasser nahm und es zwischen sie und den Halsausschnitt ihres Gewandes goss. Sie sagte: »Der Gesandte Allahs (Friede sei auf ihm) pflegte uns zu befehlen, es mit Wasser abzukühlen.«",

  // 19: 5974
  "Sa'id ibn Abi Maryam überlieferte uns: Isma'il ibn Ibrahim ibn 'Uqba überlieferte uns, er sagte: Nafi' berichtete mir, von Ibn 'Umar (möge Allah mit beiden zufrieden sein), vom Gesandten Allahs (Friede sei auf ihm), der sagte: »Während drei Männer unterwegs waren, überraschte sie der Regen, sodass sie in einer Höhle in einem Berg Schutz suchten. Da stürzte ein Felsbrocken vom Berg herab und verschloss ihnen den Eingang der Höhle. Da sagten sie zueinander: ›Besinnt euch auf gute Taten, die ihr aufrichtig für Allah getan habt, und bittet Allah um derentwillen; vielleicht öffnet Er sie für euch.‹ Da sagte der erste von ihnen: ›O Allah, ich hatte zwei betagte Eltern und kleine Kinder, für die ich sorgte. Wenn ich am Abend zu ihnen zurückkehrte und die Tiere gemolken hatte, gab ich meinen Eltern zu trinken, bevor ich meinen Kindern gab. Eines Tages trieb mich die Suche nach Bäumen weit weg, sodass ich erst am Abend zurückkehrte und sie bereits schlafend vorfand. Da molk ich wie gewohnt und stellte mich mit der Milch an ihre Köpfe; es widerstrebte mir, sie aufzuwecken, und es widerstrebte mir ebenso, meinen Kindern vor ihnen zu trinken zu geben, während die Kinder zu meinen Füßen weinten. So verharrte ich und verharrten sie bis zum Anbruch der Morgendämmerung. O Allah, wenn Du weißt, dass ich dies im Verlangen nach Deinem Angesicht getan habe, so öffne uns eine Spalte, durch die wir den Himmel sehen können!‹ Da öffnete Allah ihnen eine Spalte, sodass sie den Himmel sahen. Und der zweite sagte: ›O Allah, ich hatte eine Cousine, die ich so sehr liebte, wie Männer Frauen nur lieben können. Ich begehrte sie, doch sie weigerte sich, bis ich ihr hundert Dinar brächte. So mühte ich mich ab, bis ich hundert Dinar beisammenhatte, und brachte sie ihr. Als ich mich zwischen ihre Beine setzte, sagte sie: »O Diener Allahs, fürchte Allah und brich das Siegel nicht unrechtmäßig!« Da stand ich von ihr auf. O Allah, wenn Du weißt, dass ich dies im Verlangen nach Deinem Angesicht getan habe, so öffne uns die Spalte weiter!‹ Da öffnete Er ihnen eine weitere Spalte. Und der andere sagte: ›O Allah, ich hatte einen Arbeiter für ein Maß Reis gedungen. Als er seine Arbeit beendet hatte, sagte er: »Gib mir meinen Lohn!« Ich bot ihm seinen Lohn an, doch er ließ ihn liegen und wandte sich ab. Da baute ich diesen Lohn immer weiter an, bis ich daraus Rinder und deren Hirten erwarb. Später kam er zu mir und sagte: »Fürchte Allah und tu mir kein Unrecht; gib mir meinen Lohn!« Da sagte ich: »Geh zu jenen Rindern und ihrem Hirten!« Er sagte: »Fürchte Allah und spotte nicht über mich!« Ich sagte: »Ich spotte nicht über dich; nimm diese Rinder und ihren Hirten!« Da nahm er sie und zog damit davon. O Allah, wenn Du weißt, dass ich dies im Verlangen nach Deinem Angesicht getan habe, so nimm den Rest des Felsens hinweg!‹ Da beseitigte Allah ihn vollständig für sie.«",

  // 20: 5975
  "Sa'd ibn Hafs überlieferte uns: Schaiban überlieferte uns, von Mansur, von al-Musayyab, von Warrad, von al-Mughira, vom Propheten (Friede sei auf ihm), der sagte: »Wahrlich, Allah hat euch den Ungehorsam gegen die Mütter verboten, das Verweigern von Pflichten und das gierige Fordern, und das lebendige Begraben von Töchtern. Und Er verabscheut für euch das Gerede (man sagte und er sagte), das übermäßige Fragen und das Verschwenden von Vermögen.«",

  // 21: 5984
  "Yahya ibn Bukair überlieferte uns: al-Laith überlieferte uns, von 'Uqail, von Ibn Schihab, dass Muhammad ibn Dschubair ibn Mut'im sagte: Dschubair ibn Mut'im berichtete ihm, dass er den Propheten (Friede sei auf ihm) sagen hörte: »Nicht ins Paradies geht ein Zerschneider (der Verwandtschaftsbande) ein.«",

  // 22: 5985
  "Ibrahim ibn al-Mundhir berichtete mir: Muhammad ibn Ma'n überlieferte uns, er sagte: Mein Vater berichtete mir, von Sa'id ibn Abi Sa'id, von Abu Huraira (möge Allah mit ihm zufrieden sein), der sagte: Ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: »Wen es erfreut, dass seine Versorgung gemehrt und seine Lebenszeit verlängert wird, der soll seine Verwandtschaftsbande pflegen.«",

  // 23: 5986
  "Yahya ibn Bukair überlieferte uns: al-Laith überlieferte uns, von 'Uqail, von Ibn Schihab, der sagte: Anas ibn Malik berichtete mir, dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Wer wünscht, dass seine Versorgung gemehrt und seine Lebenszeit verlängert wird, der soll seine Verwandtschaftsbande pflegen.«",

  // 24: 5988
  "Chalid ibn Machlad überlieferte uns: Sulaiman überlieferte uns: 'Abdullah ibn Dinar überlieferte uns, von Abu Salih, von Abu Huraira (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: »Wahrlich, die Verwandtschaftsbande (ar-Rahim) sind ein Zweig vom Allerbarmer (ar-Rahman). Und Allah sprach: Wer dich pflegt, den pflege Ich, und wer dich abschneidet, den schneide Ich ab.«",

  // 25: 5989
  "Sa'id ibn Abi Maryam überlieferte uns: Sulaiman ibn Bilal überlieferte uns, er sagte: Mu'awiya ibn Abi Muzarrid berichtete mir, von Yazid ibn Ruman, von 'Urwa, von 'A'ischa (möge Allah mit ihr zufrieden sein), der Frau des Propheten (Friede sei auf ihm), vom Propheten (Friede sei auf ihm), der sagte: »Die Verwandtschaftsbande (ar-Rahim) sind ein verschlungener Zweig; wer sie pflegt, den pflege Ich, und wer sie abschneidet, den schneide Ich ab.«",

  // 26: 5991
  "Muhammad ibn Kathir überlieferte uns: Sufyan berichtete uns, von al-A'masch, al-Hasan ibn 'Amr und Fitr, von Mudschahid, von 'Abdullah ibn 'Amr – und Sufyan sagte: al-A'masch führte es nicht auf den Propheten (Friede sei auf ihm) zurück, doch Hasan und Fitr führten es auf ihn zurück –, vom Propheten (Friede sei auf ihm), der sagte: »Der wahre Pfleger der Verwandtschaftsbande ist nicht derjenige, der Gleiches mit Gleichem vergilt; vielmehr ist der Pfleger jener, der, wenn seine Verwandtschaftsbande abgeschnitten werden, sie dennoch pflegt.«",

  // 27: 5992
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri, der sagte: 'Urwa ibn az-Zubair berichtete mir, dass Hakim ibn Hizam ihm berichtete, dass er sagte: »O Gesandter Allahs, was meinst du über Taten, die ich in der Dschahiliyya als Gottesdienst (Tahannuth) zu verrichten pflegte, wie das Pflegen der Verwandtschaftsbande, das Freilassen von Sklaven und das Spenden von Almosen – habe ich dafür einen Lohn?« Hakim sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Du hast den Islam angenommen mit all dem Guten, das du zuvor getan hast.« Und es wird auch von Abu l-Yaman überliefert: »ich suchte das Gute (Atahannathu)«. Ma'mar, Salih und Ibn al-Musafir sagten ebenfalls: »Atahannathu«. Ibn Ishaq sagte: Das Tahannuth bedeutet das Verrichten von Frömmigkeit; und Hischam folgte ihnen von seinem Vater.",

  // 28: 5998
  "Muhammad ibn Yusuf überlieferte uns: Sufyan überlieferte uns, von Hischam, von 'Urwa, von 'A'ischa (möge Allah mit ihr zufrieden sein), die sagte: Ein Beduine kam zum Propheten (Friede sei auf ihm) und sagte: »Küsst ihr denn die Kinder? Wir küssen sie nicht.« Da sagte der Prophet (Friede sei auf ihm): »Vermag ich denn etwas für dich zu tun, wenn Allah die Barmherzigkeit aus deinem Herzen gerissen hat?«",

  // 29: 6000
  "Al-Hakam ibn Nafi' überlieferte uns: Schu'aib berichtete uns, von az-Zuhri: Sa'id ibn al-Musayyab berichtete uns, dass Abu Huraira sagte: Ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: »Allah schuf die Barmherzigkeit in hundert Teilen; neunundneunzig Teile behielt Er bei Sich und sandte einen einzigen Teil auf die Erde herab. Aus diesem einen Teil erweisen sich die Geschöpfe gegenseitig Barmherzigkeit, sodass selbst die Stute ihren Huf von ihrem Fohlen abhebt aus Furcht, es zu verletzen.«"
];

if (translations.length !== items.length) {
  throw new Error(`Length mismatch: ${translations.length} vs ${items.length}`);
}

const outputs = [];
let failed = false;

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const de = translations[i];
  const errors = validateGerman(item, de);
  if (errors.length > 0) {
    console.error(`Validation failed at index ${i} (${item.reference}):`, errors);
    failed = true;
  }
  outputs.push({
    id: item.id,
    de
  });
}

if (failed) {
  process.exit(1);
}

console.log("ALL 30 TRANSLATIONS PASSED VALIDATION!");
fs.writeFileSync(outputPath, JSON.stringify(outputs, null, 2), 'utf8');
console.log(`Successfully wrote ${outputs.length} items to ${outputPath}`);
