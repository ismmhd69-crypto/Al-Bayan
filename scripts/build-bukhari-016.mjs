import fs from 'fs';
import path from 'path';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = path.resolve('data/german-batches/hadith-inputs/bukhari-batch-016.json');
const outputPath = path.resolve('data/german-batches/hadith-outputs/bukhari-batch-016.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const items = JSON.parse(raw);

const translations = [
  // 0: 5576
  "Abu l-Yaman berichtete uns: Schu'aib berichtete uns, von az-Zuhri: Sa'id ibn al-Musayyab berichtete mir, dass er Abu Huraira (möge Allah mit ihm zufrieden sein) sagen hörte, dass dem Gesandten Allahs (Friede sei auf ihm) in der Nacht, in der er nach Iliya' (Jerusalem) geführt wurde, zwei Becher gereicht wurden, einer mit Wein und einer mit Milch. Er blickte auf beide und nahm dann die Milch. Da sagte Gabriel: »Alles Lob gebührt Allah, Der dich zur Fitra (der natürlichen Veranlagung) geleitet hat; hättest du den Wein genommen, wäre deine Gemeinschaft irregegangen.« Dies wurde auch von Ma'mar, Ibn al-Had, 'Uthman ibn 'Umar und az-Zubaidi von az-Zuhri überliefert.",

  // 1: 5577
  "Muslim ibn Ibrahim überlieferte uns: Hischam überlieferte uns: Qatada überlieferte uns, von Anas (möge Allah mit ihm zufrieden sein), der sagte: Ich hörte vom Gesandten Allahs (Friede sei auf ihm) einen Hadith, den euch außer mir niemand berichten wird; er sagte: »Zu den Vorzeichen der Stunde gehört, dass die Unwissenheit überhandnimmt und das Wissen abnimmt, dass die Unzucht (Zina) offenbar wird, Wein getrunken wird, die Männer weniger werden und die Frauen zahlreich werden, bis dass für fünfzig Frauen ein einziger Mann als Fürsorger da ist.«",

  // 2: 5578
  "Ahmad ibn Salih überlieferte uns: Ibn Wahb überlieferte uns, er sagte: Yunus berichtete mir, von Ibn Schihab, der sagte: Ich hörte Abu Salama ibn 'Abd ar-Rahman und Ibn al-Musayyab sagen: Abu Huraira (möge Allah mit ihm zufrieden sein) sagte, dass der Prophet (Friede sei auf ihm) sagte: »Der Unzüchtige begeht keine Unzucht, während er ein Gläubiger ist, und der Weintrinker trinkt keinen Wein, während er ein Gläubiger ist, und der Dieb stiehlt nicht, während er ein Gläubiger ist.« Ibn Schihab sagte: Und mir berichtete 'Abd al-Malik ibn Abi Bakr ibn 'Abd ar-Rahman ibn al-Harith ibn Hischam, dass Abu Bakr ihm von Abu Huraira zu berichten pflegte und dann sagte: Abu Bakr fügte ihnen noch hinzu: »Und niemand reißt eine Beute von hohem Wert an sich, zu der die Menschen ihre Blicke emporheben, wenn er sie an sich reißt, während er ein Gläubiger ist.«",

  // 3: 5579
  "Al-Hasan ibn Sabbah überlieferte uns: Muhammad ibn Sabiq überlieferte uns: Malik – nämlich Ibn Mighwal – überlieferte uns, von Nafi', von Ibn 'Umar (möge Allah mit beiden zufrieden sein), der sagte: »Wahrlich, der Wein wurde verboten, als es in Medina überhaupt nichts davon gab.«",

  // 4: 5580
  "Ahmad ibn Yunus überlieferte uns: Abu Schihab 'Abd Rabbih ibn Nafi' überlieferte uns, von Yunus, von Thabit al-Bunani, von Anas, der sagte: »Der Wein wurde uns verboten, als er verboten wurde, und wir fanden – das heißt in Medina – kaum Traubenwein vor, außer sehr wenig; der größte Teil unseres Weines bestand aus unreifen und reifen Datteln.«",

  // 5: 5581
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Abu Hayyan: 'Amir überlieferte uns, von Ibn 'Umar (möge Allah mit beiden zufrieden sein): 'Umar trat auf die Kanzel (Minbar) und sagte: »Und nun: Das Verbot des Weines wurde herabgesandt, und er wird aus fünf Dingen hergestellt: Trauben, Datteln, Honig, Weizen und Gerste; und Wein (Chamar) ist alles, was den Verstand umnebelt.«",

  // 6: 5582
  "Isma'il ibn 'Abdullah überlieferte uns, er sagte: Malik ibn Anas berichtete mir, von Ishaq ibn 'Abdullah ibn Abi Talha, von Anas ibn Malik (möge Allah mit ihm zufrieden sein), der sagte: Ich schenkte Abu 'Ubaida, Abu Talha und Ubayy ibn Ka'b Fadikh (ein Getränk) aus halbreifen und getrockneten Datteln ein, als jemand zu ihnen kam und sagte: »Wahrlich, der Wein ist verboten worden!« Da sagte Abu Talha: »Steh auf, o Anas, und gieße ihn aus!« Da goss ich ihn aus.",

  // 7: 5583
  "Musaddad überlieferte uns: Mu'tamir überlieferte uns, von seinem Vater, der sagte: Ich hörte Anas sagen: Ich stand da und schenkte den Leuten – meinen Onkeln, während ich der Jüngste von ihnen war – den Fadikh ein. Da wurde gesagt: »Der Wein wurde verboten!« Da sagten sie: »Kippe ihn um!« So schüttete ich ihn weg. Ich fragte Anas: »Was war ihr Getränk?« Er antwortete: »Frische und unvollreif geerntete Datteln.« Da sagte Abu Bakr ibn Anas: »Und das war damals ihr Wein.« Und Anas widersprach dem nicht. Und einer meiner Gefährten berichtete mir, dass er Anas sagen hörte: »Das war damals ihr Wein.«",

  // 8: 5584
  "Muhammad ibn Abi Bakr al-Muqaddami überlieferte uns: Yusuf Abu Ma'schar al-Barra' überlieferte uns, er sagte: Ich hörte Sa'id ibn 'Ubaidillah sagen: Bakr ibn 'Abdullah berichtete mir, dass Anas ibn Malik ihnen berichtete, dass der Wein verboten wurde, und der Wein bestand zu jener Zeit aus unreifen und reifen Datteln.",

  // 9: 5585
  "'Abdullah ibn Yusuf überlieferte uns: Malik berichtete uns, von Ibn Schihab, von Abu Salama ibn 'Abd ar-Rahman, dass 'A'ischa sagte: Der Gesandte Allahs (Friede sei auf ihm) wurde über den Bit' (einen Honigwein) befragt, worauf er sagte: »Jedes Getränk, das berauscht, ist verboten (haram).«",

  // 10: 5586
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri, der sagte: Abu Salama ibn 'Abd ar-Rahman berichtete mir, dass 'A'ischa (möge Allah mit ihr zufrieden sein) sagte: Der Gesandte Allahs (Friede sei auf ihm) wurde über den Bit' befragt – und dies ist Honig-Nabidh, den die Leute im Jemen zu trinken pflegten –, worauf der Gesandte Allahs (Friede sei auf ihm) sagte: »Jedes Getränk, das berauscht, ist verboten (haram).«",

  // 11: 5587
  "Und von az-Zuhri, der sagte: Anas ibn Malik berichtete mir, dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Setzt kein gegorenes Getränk (Nabidh) in Kürbisflaschen (ad-Dubba') an und nicht in pechbestrichenen Gefäßen (al-Muzaffat).« Und Abu Huraira pflegte dem noch Tonkrüge (al-Hantam) und ausgehöhlte Holzstämme (an-Naqir) hinzuzufügen.",

  // 12: 5588
  "Ahmad ibn Abi Raja' überlieferte uns: Yahya überlieferte uns, von Abu Hayyan at-Taimi, von asch-Scha'bi, von Ibn 'Umar (möge Allah mit beiden zufrieden sein), der sagte: 'Umar hielt eine Ansprache auf der Kanzel des Gesandten Allahs (Friede sei auf ihm) und sagte: »Wahrlich, das Verbot des Weines wurde herabgesandt, und er wird aus fünf Dingen hergestellt: Trauben, Datteln, Weizen, Gerste und Honig; und Wein (Chamar) ist alles, was den Verstand umnebelt. Und drei Dinge hätte ich mir gewünscht, dass der Gesandte Allahs (Friede sei auf ihm) uns nicht verlassen hätte, ehe er uns darüber eine verbindliche Weisung hinterlassen hätte: das Erbe des Großvaters, die Kalala (Erblasser ohne Eltern oder Nachkommen) und manche Arten des Zinses (Riba).« Er sagte: Ich fragte: »O Abu 'Amr, was ist mit dem, was im Sindh aus Reis hergestellt wird?« Er antwortete: »Das gab es zur Zeit des Propheten (Friede sei auf ihm) noch nicht« – oder er sagte: »zur Zeit von 'Umar.« Und Haddschadsch berichtete von Hammad, von Abu Hayyan, anstelle von Weintrauben Rosinen.",

  // 13: 5589
  "Hafs ibn 'Umar überlieferte uns: Schu'ba überlieferte uns, von 'Abdullah ibn Abi s-Safar, von asch-Scha'bi, von Ibn 'Umar, von 'Umar, der sagte: »Der Wein wird aus fünf Dingen hergestellt: aus Rosinen, Datteln, Weizen, Gerste und Honig.«",

  // 14: 5590
  "Und Hischam ibn 'Ammar sagte: Sadaqa ibn Chalid überlieferte uns: 'Abd ar-Rahman ibn Yazid ibn Dschabir überlieferte uns: 'Atiyya ibn Qais al-Kilabi überlieferte uns: 'Abd ar-Rahman ibn Ghanm al-Asch'ari überlieferte uns, er sagte: Abu 'Amir – oder Abu Malik – al-Asch'ari berichtete mir, und bei Allah, er hat mich nicht belogen, dass er den Propheten (Friede sei auf ihm) sagen hörte: »Wahrlich, es wird unter meiner Gemeinschaft Leute geben, die unerlaubten Geschlechtsverkehr (Zina), Seide, Wein und Musikinstrumente für erlaubt erklären. Und Leute werden sich am Fuße eines Berges niederlassen; am Abend wird ihr Hirte mit ihren Herden zu ihnen zurückkehren, und ein Bedürftiger wird zu ihnen wegen einer Notlage kommen, worauf sie sagen: ›Komm morgen zu uns zurück.‹ Doch Allah wird sie in der Nacht überraschen, den Berg über ihnen einstürzen lassen und die anderen bis zum Tag der Auferstehung in Affen und Schweine verwandeln.«",

  // 15: 5591
  "Qutaiba ibn Sa'id überlieferte uns: Ya'qub ibn 'Abd ar-Rahman überlieferte uns, von Abu Hazim, der sagte: Ich hörte Sahl sagen: Abu Usaid as-Sa'idi kam und lud den Gesandten Allahs (Friede sei auf ihm) zu seiner Hochzeit ein. Dabei bediente seine Frau sie, obwohl sie die Braut war. Sie sagte: »Wisst ihr, was ich dem Gesandten Allahs (Friede sei auf ihm) zu trinken gab? Ich weichte in der Nacht für ihn Datteln in einem Steingutgefäß (Taur) ein.«",

  // 16: 5592
  "Yusuf ibn Musa überlieferte uns: Muhammad ibn 'Abdillah Abu Ahmad az-Zubairi überlieferte uns: Sufyan überlieferte uns, von Mansur, von Salim, von Dschabir (möge Allah mit ihm zufrieden sein), der sagte: Der Gesandte Allahs (Friede sei auf ihm) verbot bestimmte Gefäße. Da sagten die Ansar: »Wir kommen aber ohne sie nicht aus.« Er sagte: »Dann eben nicht (dann gebraucht sie).« Und Chalifa sagte: Yahya ibn Sa'id überlieferte uns: Sufyan überlieferte uns, von Mansur, von Salim ibn Abi l-Dscha'd, von Dschabir diesbezüglich. 'Abdullah ibn Muhammad überlieferte uns: Sufyan überlieferte uns diesbezüglich und sagte darin: Als der Prophet (Friede sei auf ihm) die Gefäße verbot...",

  // 17: 5593
  "'Ali ibn 'Abdillah überlieferte uns: Sufyan überlieferte uns, von Sulaiman ibn Abi Muslim al-Ahwal, von Mudschahid, von Abu 'Iyad, von 'Abdullah ibn 'Amr (möge Allah mit beiden zufrieden sein), der sagte: Als der Prophet (Friede sei auf ihm) bestimmte Schläuche und Gefäße verbot, wurde zum Propheten (Friede sei auf ihm) gesagt: »Nicht jedermann findet einen Wasserschlauch.« Da erlaubte er ihnen unversiegelte Tonkrüge (al-Dscharra), die nicht mit Pech bestrichen sind.",

  // 18: 5594
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Sufyan: Sulaiman berichtete mir, von Ibrahim at-Taimi, von al-Harith ibn Suwaid, von 'Ali (möge Allah mit ihm zufrieden sein): Der Prophet (Friede sei auf ihm) verbot Kürbisflaschen (ad-Dubba') und pechbestrichene Gefäße (al-Muzaffat). 'Uthman überlieferte uns: Dscharir überlieferte uns, von al-A'masch diesbezüglich.",

  // 19: 5595
  "'Uthman berichtete mir: Dscharir überlieferte uns, von Mansur, von Ibrahim: Ich fragte al-Aswad: »Hast du 'A'ischa, die Mutter der Gläubigen, danach gefragt, worin es verpönt ist, Nabidh anzusetzen?« Er antwortete: »Ja.« Ich sagte: »O Mutter der Gläubigen, wovon hat der Prophet (Friede sei auf ihm) verboten, darin Nabidh anzusetzen?« Sie sagte: »Er verbot uns, den Leuten seines Hauses, Nabidh in Kürbisflaschen (ad-Dubba') und in pechbestrichenen Gefäßen (al-Muzaffat) anzusetzen.« Ich fragte: »Erwähnte sie denn nicht Krüge (al-Dscharra) und Hantam-Gefäße?« Er sagte: »Ich berichte dir nur, was ich gehört habe; soll ich etwa berichten, was ich nicht gehört habe?«",

  // 20: 5596
  "Musa ibn Isma'il überlieferte uns: 'Abd al-Wahid überlieferte uns: asch-Schaibani überlieferte uns, er sagte: Ich hörte 'Abdullah ibn Abi Aufa (möge Allah mit beiden zufrieden sein) sagen: »Der Prophet (Friede sei auf ihm) verbot den grünen Tonkrug.« Ich fragte: »Dürfen wir aus dem weißen trinken?« Er antwortete: »Nein.«",

  // 21: 5597
  "Yahya ibn Bukair überlieferte uns: Ya'qub ibn 'Abd ar-Rahman al-Qari überlieferte uns, von Abu Hazim, der sagte: Ich hörte Sahl ibn Sa'd: Abu Usaid as-Sa'idi lud den Propheten (Friede sei auf ihm) zu seiner Hochzeit ein. Da bediente seine Frau sie an jenem Tag, obwohl sie die Braut war. Sie sagte: »Wisst ihr, was ich für den Gesandten Allahs (Friede sei auf ihm) eingeweicht habe? Ich habe für ihn nachts einige Datteln in einem Taur (Steingutgefäß) eingeweicht.«",

  // 22: 5598
  "Muhammad ibn Kathir überlieferte uns: Sufyan berichtete uns, von Abu l-Dschuwairiya, der sagte: Ich befragte Ibn 'Abbas über den Badhaq (eingekochten Traubensaft). Da sagte er: »Muhammad (Friede sei auf ihm) ging dem Badhaq voraus: Was berauscht, ist verboten (haram).« Er sagte: »Es ist ein erlaubtes, gutes Getränk.« Da erwiderte er: »Nach dem erlaubten Guten gibt es nichts außer dem verbotenen Schlechten.«",

  // 23: 5599
  "'Abdullah ibn Abi Schaiba überlieferte uns: Abu Usama überlieferte uns: Hischam ibn 'Urwa überlieferte uns, von seinem Vater, von 'A'ischa (möge Allah mit ihr zufrieden sein), die sagte: »Der Prophet (Friede sei auf ihm) liebte Süßigkeiten und Honig.«",

  // 24: 5600
  "Muslim überlieferte uns: Hischam überlieferte uns: Qatada überlieferte uns, von Anas (möge Allah mit ihm zufrieden sein), der sagte: Ich schenkte gerade Abu Talha, Abu Dudschana und Suhail ibn al-Baida' eine Mischung aus unreifen und getrockneten Datteln ein, als der Wein verboten wurde. Da schüttete ich ihn weg, während ich ihr Einschenker und der Jüngste von ihnen war; und wir betrachteten dies zu jener Zeit als Wein. Und 'Amr ibn al-Harith sagte: Qatada überlieferte uns, dass er Anas hörte.",

  // 25: 5601
  "Abu 'Asim überlieferte uns, von Ibn Dschuraij: 'Ata' berichtete mir, dass er Dschabir (möge Allah mit ihm zufrieden sein) sagen hörte: Der Prophet (Friede sei auf ihm) verbot (das Zusammenmischen von) Rosinen und getrockneten Datteln sowie von unreifen Datteln und frischen reifen Datteln.",

  // 26: 5602
  "Muslim überlieferte uns: Hischam überlieferte uns: Yahya ibn Abi Kathir berichtete uns, von 'Abdullah ibn Abi Qatada, von seinem Vater, der sagte: Der Prophet (Friede sei auf ihm) verbot, getrocknete Datteln mit halbreifen Datteln (Zahw) zusammenzugeben oder getrocknete Datteln mit Rosinen; und jedes von beiden soll für sich allein angesetzt werden.",

  // 27: 5603
  "'Abdan überlieferte uns: 'Abdullah berichtete uns: Yunus berichtete uns, von az-Zuhri, von Sa'id ibn al-Musayyab, von Abu Huraira (möge Allah mit ihm zufrieden sein), der sagte: Dem Gesandten Allahs (Friede sei auf ihm) wurden in der Nacht, in der er auf die Nachtreise (al-Isra') mitgenommen wurde, ein Becher Milch und ein Becher Wein gereicht.",

  // 28: 5604
  "Al-Humaidi überlieferte uns: Er hörte Sufyan: Salim Abu n-Nadr berichtete uns, dass er 'Umair, den befreiten Sklaven von Umm al-Fadl, hörte, wie er von Umm al-Fadl berichtete, die sagte: Die Leute zweifelten am Fasten des Gesandten Allahs (Friede sei auf ihm) am Tage von 'Arafa; da schickte ich ihm ein Gefäß mit Milch, und er trank davon. Und Sufyan sagte bisweilen: Die Leute zweifelten am Fasten des Gesandten Allahs (Friede sei auf ihm) am Tage von 'Arafa, so schickte ihm Umm al-Fadl (etwas). Und wenn er genauer befragt wurde, sagte er: Es ist von Umm al-Fadl.",

  // 29: 5605
  "Qutaiba überlieferte uns: Dscharir überlieferte uns, von al-A'masch, von Abu Salih und Abu Sufyan, von Dschabir ibn 'Abdillah, der sagte: Abu Humaid brachte dem Gesandten Allahs (Friede sei auf ihm) einen Becher Milch aus an-Naqi'. Da sagte der Gesandte Allahs (Friede sei auf ihm) zu ihm: »Hättest du ihn doch nur zugedeckt, und sei es nur, indem du ein Hölzchen quer darüber legst!«"
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
