import fs from 'fs';
import path from 'path';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = path.resolve('data/german-batches/hadith-inputs/bukhari-batch-028.json');
const outputPath = path.resolve('data/german-batches/hadith-outputs/bukhari-batch-028.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const items = JSON.parse(raw);

const translations = [
  // 0: 7199, 7200
  "Isma'il überlieferte uns: Malik berichtete mir, von Yahya ibn Sa'id, der sagte: 'Ubada ibn al-Walid berichtete mir: Mein Vater berichtete mir, von 'Ubada ibn as-Samit, der sagte: »Wir leisteten dem Gesandten Allahs (Friede sei auf ihm) den Treueid auf das Hören und Gehorchen in dem, was uns lieb ist, und in dem, was uns zuwider ist; und dass wir die Herrschaft ihren rechtmäßigen Inhabern nicht streitig machen; und dass wir für die Wahrheit eintreten – oder die Wahrheit sprechen –, wo immer wir auch sein mögen, und um Allahs willen den Tadel keines Tadelnden fürchten.«",

  // 1: 7201
  "'Amr ibn 'Ali überlieferte uns: Chalid ibn al-Harith überlieferte uns: Humaid überlieferte uns, von Anas (möge Allah mit ihm zufrieden sein): Der Prophet (Friede sei auf ihm) trat an einem kalten Morgen heraus, während die Auswanderer (Muhadschirun) und Helfer (Ansar) den Graben aushoben. Da sagte er: »O Allah, das wahre Gute ist das Gute des Jenseits, so vergib den Ansar und den Muhadschira!« Da antworteten sie: »Wir sind jene, die Muhammad den Treueid leisteten auf den Dschihad, solange wir ewig leben!«",

  // 2: 7202
  "'Abdullah ibn Yusuf überlieferte uns: Malik berichtete uns, von 'Abdullah ibn Dinar, von 'Abdullah ibn 'Umar (möge Allah mit beiden zufrieden sein), der sagte: Wenn wir dem Gesandten Allahs (Friede sei auf ihm) den Treueid auf das Hören und Gehorchen leisteten, pflegte er zu uns zu sagen: »In dem, was du vermagst.«",

  // 3: 7203
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Sufyan: 'Abdullah ibn Dinar überlieferte uns, der sagte: Ich war bei Ibn 'Umar zugegen, als die Menschen sich um 'Abd al-Malik einigten; er sagte: Er schrieb: »Ich bekenne mich zum Hören und Gehorchen gegenüber 'Abd al-Malik, dem Befehlshaber der Gläubigen, gemäß der Sunna Allahs und der Sunna Seines Gesandten, soweit ich es vermag; und meine Söhne haben sich zu demselben bekannt.«",

  // 4: 7204
  "Ya'qub ibn Ibrahim überlieferte uns: Huschaim überlieferte uns: Sayyar berichtete uns, von asch-Scha'bi, von Dscharir ibn 'Abdillah, der sagte: Ich leistete dem Propheten (Friede sei auf ihm) den Treueid auf das Hören und Gehorchen; da schärfte er mir ein: »in dem, was du vermagst, und im aufrichtigen Rat für jeden Muslim.«",

  // 5: 7205
  "'Amr ibn 'Ali überlieferte uns: Yahya überlieferte uns, von Sufyan, der sagte: 'Abdullah ibn Dinar berichtete mir, er sagte: Als die Menschen 'Abd al-Malik den Treueid leisteten, schrieb 'Abdullah ibn 'Umar an ihn: »An den Diener Allahs, 'Abd al-Malik, den Befehlshaber der Gläubigen: Ich bekenne mich zum Hören und Gehorchen gegenüber dem Diener Allahs, 'Abd al-Malik, dem Befehlshaber der Gläubigen, gemäß der Sunna Allahs und der Sunna Seines Gesandten, soweit ich es vermag; und meine Söhne haben sich ebenfalls dazu bekannt.«",

  // 6: 7206
  "'Abdullah ibn Maslama überlieferte uns: Hatim überlieferte uns, von Yazid, der sagte: Ich fragte Salama: »Worauf leistetet ihr dem Propheten (Friede sei auf ihm) am Tage von al-Hudaibiyya den Treueid?« Er antwortete: »Auf den Tod.«",

  // 7: 7207
  "'Abdullah ibn Muhammad ibn Asma' überlieferte uns: Dschuwairiya überlieferte uns, von Malik, von az-Zuhri, dass Humaid ibn 'Abd ar-Rahman ihm berichtete, dass al-Miswar ibn Machrama ihm berichtete: Die Gruppe, die 'Umar eingesetzt hatte, trat zusammen und beriet sich. Da sagte 'Abd ar-Rahman zu ihnen: »Ich konkurriere mit euch nicht um diese Angelegenheit; doch wenn ihr wollt, wähle ich für euch einen von euch aus.« Da übertrugen sie dies 'Abd ar-Rahman. Als sie 'Abd ar-Rahman ihre Angelegenheit anvertrauten, wandten sich die Menschen 'Abd ar-Rahman zu, sodass ich niemanden mehr jenen Männern folgen oder hinter ihnen hergehen sah; die Menschen strömten vielmehr zu 'Abd ar-Rahman und berieten sich in jenen Nächten mit ihm. Als die Nacht anbrach, auf deren Morgen wir 'Uthman den Treueid leisteten, sagte al-Miswar: 'Abd ar-Rahman klopfte in der späten Nacht an meine Tür, bis ich aufwachte. Er sagte: »Ich sehe, dass du schläfst; bei Allah, ich habe in dieser Nacht kaum geschlafen! Geh hin und rufe mir az-Zubair und Sa'd herbei!« Da rief ich beide zu ihm, und er beriet sich mit ihnen. Dann rief er mich und sagte: »Rufe mir 'Ali herbei!« Da rief ich ihn herbei, und 'Abd ar-Rahman sprach im Geheimen mit ihm, bis die Nacht weit vorangeschritten war. Dann erhob sich 'Ali von ihm voller Hoffnung, doch hatte 'Abd ar-Rahman eine gewisse Besorgnis hinsichtlich 'Ali. Dann sagte er: »Rufe mir 'Uthman herbei!« Da rief ich ihn herbei, und er sprach im Geheimen mit ihm, bis der Gebetsrufer zum Morgengebet sie trennte. Nachdem 'Abd ar-Rahman das Morgengebet mit den Menschen verrichtet hatte und jene Männer sich an der Kanzel versammelt hatten, ließ er nach allen rufen, die von den Auswanderern (Muhadschirun) und Helfern (Ansar) anwesend waren, und nach den Heerführern, die jene Pilgerfahrt mit 'Umar mitgemacht hatten. Als sie sich versammelt hatten, sprach 'Abd ar-Rahman das Glaubensbekenntnis und sagte: »Und nun, o 'Ali: Ich habe die Lage der Menschen betrachtet und sehe nicht, dass sie jemanden 'Uthman vorziehen; so mache dir selbst keinen Weg schwer!« Da sagte 'Ali: »Ich leiste dir den Treueid auf der Grundlage der Sunna Allahs und Seines Gesandten sowie der beiden Kalifen nach ihm.« Da leistete ihm 'Abd ar-Rahman den Treueid, und die Menschen – die Muhadschirun, die Ansar, die Heerführer und alle Muslime – leisteten ihm den Treueid.",

  // 8: 7208
  "Abu 'Asim überlieferte uns, von Yazid ibn Abi 'Ubaid, von Salama, der sagte: Wir leisteten dem Propheten (Friede sei auf ihm) den Treueid unter dem Baum. Da sagte er zu mir: »O Salama, leistest du nicht den Treueid?« Ich antwortete: »O Gesandter Allahs, ich habe doch bereits beim ersten Mal den Treueid geleistet!« Er sagte: »Und leiste ihn auch beim zweiten Mal!«",

  // 9: 7209
  "'Abdullah ibn Maslama überlieferte uns, von Malik, von Muhammad ibn al-Munkadir, von Dschabir ibn 'Abdillah (möge Allah mit beiden zufrieden sein): Ein Beduine leistete dem Gesandten Allahs (Friede sei auf ihm) den Treueid auf den Islam. Da befiel ihn ein Fieber, und er sagte: »Entbinde mich von meinem Treueid!« Doch er weigerte sich. Dann kam er erneut und sagte: »Entbinde mich von meinem Treueid!« Doch er weigerte sich. Da zog der Mann davon. Da sagte der Gesandte Allahs (Friede sei auf ihm): »Medina ist wie ein Schmelzofen: Es scheidet seine Unreinheiten aus, und sein Gutes erstrahlt rein.«",

  // 10: 7210
  "'Ali ibn 'Abdillah überlieferte uns: 'Abdullah ibn Yazid überlieferte uns: Sa'id – nämlich Ibn Abi Ayyub – überlieferte uns, er sagte: Abu 'Aqil Zuhra ibn Ma'bad berichtete mir, von seinem Großvater 'Abdullah ibn Hischam, der noch den Propheten (Friede sei auf ihm) erlebt hatte. Seine Mutter Zainab bint Humaid hatte ihn zum Gesandten Allahs (Friede sei auf ihm) gebracht und gesagt: »O Gesandter Allahs, nimm seinen Treueid an!« Da sagte der Prophet (Friede sei auf ihm): »Er ist noch klein.« Und er strich über seinen Kopf und betete für ihn. Und er pflegte ein einziges Schaf als Opfertier für seine gesamte Familie darzubringen.",

  // 11: 7211
  "'Abdullah ibn Yusuf überlieferte uns: Malik berichtete uns, von Muhammad ibn al-Munkadir, von Dschabir ibn 'Abdillah: Ein Beduine leistete dem Gesandten Allahs (Friede sei auf ihm) den Treueid auf den Islam. Da befiel den Beduinen in Medina ein Fieber. Da kam der Beduine zum Gesandten Allahs (Friede sei auf ihm) und sagte: »O Gesandter Allahs, entbinde mich von meinem Treueid!« Doch der Gesandte Allahs (Friede sei auf ihm) weigerte sich. Dann kam er wieder und sagte: »Entbinde mich von meinem Treueid!« Doch er weigerte sich. Dann kam er ein drittes Mal und sagte: »Entbinde mich von meinem Treueid!« Doch er weigerte sich. Da verließ der Beduine die Stadt. Da sagte der Gesandte Allahs (Friede sei auf ihm): »Wahrlich, Medina ist wie ein Schmelzofen: Es stößt seine Unreinheiten aus, und sein Gutes erstrahlt rein.«",

  // 12: 7212
  "'Abdan überlieferte uns, von Abu Hamza, von al-A'masch, von Abu Salih, von Abu Huraira, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Drei sind es, zu denen Allah am Tage der Auferstehung nicht sprechen und die Er nicht läutern wird, und für die es eine schmerzhafte Strafe gibt: ein Mann, der an einem Weg überschüssiges Wasser hat und es dem Reisenden verwehrt; ein Mann, der einem Imam den Treueid leistet und dies nur für weltlichen Gewinn tut – gibt er ihm, was er will, hält er ihm die Treue, und gibt er es ihm nicht, bricht er ihm die Treue; und ein Mann, der mit einem anderen nach dem Nachmittagsgebet ('Asr) um eine Ware feilscht und bei Allah schwört, er habe dafür soundso viel geboten bekommen, woraufhin der Käufer es ihm glaubt und die Ware nimmt, während ihm dies gar nicht dafür geboten worden war.«",

  // 13: 7213
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri. Und al-Laith sagte: Yunus berichtete mir, von Ibn Schihab: Abu Idris al-Chawlani berichtete mir, dass er 'Ubada ibn as-Samit sagen hörte: Der Gesandte Allahs (Friede sei auf ihm) sagte zu uns, während wir in einer Versammlung saßen: »Leistet mir den Treueid darauf, dass ihr Allah nichts beigesellt, nicht stehlt, keine Unzucht treibt, eure Kinder nicht tötet, keine Verleumdung vorbringt, die ihr willkürlich vor euch herschiebt, und im Guten nicht ungehorsam seid! Wer von euch dies erfüllt, dessen Lohn liegt bei Allah. Und wer etwas davon begeht und dafür im Diesseits bestraft wird, für den ist dies eine Sühne. Und wer etwas davon begeht und Allah es verdeckt, dessen Angelegenheit liegt bei Allah: Wenn Er will, straft Er ihn, und wenn Er will, vergibt Er ihm.« Da leisteten wir ihm darauf den Treueid.",

  // 14: 7214 (requires 60, 12, 12)
  "Mahmud überlieferte uns: 'Abd ar-Razzaq überlieferte uns: Ma'mar berichtete uns, von az-Zuhri, von 'Urwa, von 'A'ischa (möge Allah mit ihr zufrieden sein), die sagte: Der Prophet (Friede sei auf ihm) pflegte den Treueid der Frauen mündlich mit diesem Vers abzunehmen (Sure 60, Vers 12 bis 12): »dass sie Allah nichts beigesellen«. Sie sagte: Und niemals berührte die Hand des Gesandten Allahs (Friede sei auf ihm) die Hand einer Frau, außer einer Frau, die ihm rechtmäßig gehörte.",

  // 15: 7215 (requires 60, 12, 12)
  "Musaddad überlieferte uns: 'Abd al-Warith überlieferte uns, von Ayyub, von Hafsa, von Umm 'Atiyya, die sagte: Wir leisteten dem Propheten (Friede sei auf ihm) den Treueid; da verlas er mir (Sure 60, Vers 12 bis 12): »dass sie Allah nichts beigesellen«, und verbot uns die Totenklage. Da zog eine Frau von uns ihre Hand zurück und sagte: »Soundso hat mir einst beigestanden, und ich möchte es ihr vergelten.« Er sagte nichts dazu. Dann kehrte sie zurück. Und keine Frau erfüllte es außer Umm Sulaim, Umm al-'Ala' und die Tochter von Abu Sabra, die Frau von Mu'adh – oder die Tochter von Abu Sabra und die Frau von Mu'adh.",

  // 16: 7216
  "Abu Nu'aim überlieferte uns: Sufyan überlieferte uns, von Muhammad ibn al-Munkadir: Ich hörte Dschabir sagen: Ein Beduine kam zum Propheten (Friede sei auf ihm) und sagte: »Nimm meinen Treueid auf den Islam an!« Da nahm er seinen Treueid auf den Islam an. Am nächsten Tag kam er fiebernd und sagte: »Entbinde mich!« Doch er weigerte sich. Als er sich abwandte, sagte er: »Medina ist wie ein Schmelzofen: Es scheidet seine Unreinheiten aus, und sein Gutes erstrahlt rein.«",

  // 17: 7217
  "Yahya ibn Yahya überlieferte uns: Sulaiman ibn Bilal berichtete uns, von Yahya ibn Sa'id: Ich hörte al-Qasim ibn Muhammad sagen, dass 'A'ischa (möge Allah mit ihr zufrieden sein) stöhnte: »O mein Kopf!« Da sagte der Gesandte Allahs (Friede sei auf ihm): »Das wäre nicht schlimm, wenn es geschieht, während ich lebe, denn dann würde ich für dich um Vergebung bitten und für dich beten.« Da sagte 'A'ischa: »O wehe mir! Bei Allah, ich glaube wahrlich, dass du meinen Tod wünschst! Und wenn dies geschähe, würdest du den Rest deines Tages als Bräutigam mit einer deiner anderen Frauen verbringen!« Da sagte der Prophet (Friede sei auf ihm): »Vielmehr sage ich: O mein Kopf! Ich hatte schon vor – oder ich wollte –, nach Abu Bakr und seinem Sohn schicken zu lassen und eine bindende Erklärung abzugeben, damit nicht Redende etwas behaupten oder Wünschende sich etwas wünschen.« Dann sagte ich: »Allah wehrt es ab und die Gläubigen verhindern es« – oder er sagte: »Allah verhindert es und die Gläubigen wehren es ab.«",

  // 18: 7218
  "Muhammad ibn Yusuf überlieferte uns: Sufyan berichtete uns, von Hischam ibn 'Urwa, von seinem Vater, von 'Abdullah ibn 'Umar (möge Allah mit beiden zufrieden sein), der sagte: Zu 'Umar wurde gesagt: »Setzt du keinen Nachfolger ein?« Er sagte: »Wenn ich einen Nachfolger einsetze, so setzte wahrlich einer einen Nachfolger ein, der besser war als ich: Abu Bakr. Und wenn ich es lasse, so ließ es wahrlich einer, der besser war als ich: der Gesandte Allahs (Friede sei auf ihm).« Da lobten sie ihn, worauf er sagte: »Einerseits hoffend, andererseits bangend; ich wünschte, ich käme davon frei, quitt mit quitt, weder etwas für mich noch etwas gegen mich, und trüge diese Last weder lebendig noch tot.«",

  // 19: 7219
  "Ibrahim ibn Musa überlieferte uns: Hischam berichtete uns, von Ma'mar, von az-Zuhri: Anas ibn Malik (möge Allah mit ihm zufrieden sein) berichtete mir, dass er die letzte Ansprache 'Umars hörte, als dieser auf der Kanzel saß – und dies war am Tag nach dem Ableben des Propheten (Friede sei auf ihm). Da sprach er das Glaubensbekenntnis, während Abu Bakr schwieg und nichts sprach. 'Umar sagte: »Ich hatte gehofft, dass der Gesandte Allahs (Friede sei auf ihm) leben würde, bis er uns überlebt« – womit er meinte, dass er der Letzte von ihnen sein würde. »Wenn Muhammad (Friede sei auf ihm) nun gestorben ist, so hat Allah unter euch ein Licht gesetzt, durch das ihr rechtgeleitet werdet, mit dem, womit Allah Muhammad (Friede sei auf ihm) geleitet hat. Und wahrlich, Abu Bakr ist der Gefährte des Gesandten Allahs (Friede sei auf ihm), der Zweite von zweien; er hat unter den Muslimen das meiste Anrecht auf eure Angelegenheiten. So steht auf und leistet ihm den Treueid!« Eine Gruppe von ihnen hatte ihm zuvor bereits in der Saqifa der Banu Sa'ida den Treueid geleistet, doch die allgemeine Huldigung fand auf der Kanzel statt. Az-Zuhri berichtete von Anas ibn Malik: Ich hörte 'Umar an jenem Tag zu Abu Bakr sagen: »Steige auf die Kanzel!« Und er drängte ihn so lange, bis er auf die Kanzel stieg; da leisteten ihm die Menschen allesamt den Treueid.",

  // 20: 7220
  "'Abd al-'Aziz ibn 'Abdillah überlieferte uns: Ibrahim ibn Sa'd überlieferte uns, von seinem Vater, von Muhammad ibn Dschubair ibn Mut'im, von seinem Vater, der sagte: Eine Frau kam zum Propheten (Friede sei auf ihm) und sprach mit ihm über eine Angelegenheit, worauf er ihr auftrug, wieder zu ihm zu kommen. Sie sagte: »O Gesandter Allahs, was meinst du, wenn ich komme und dich nicht mehr vorfinde?« – als meinte sie damit seinen Tod. Er sagte: »Wenn du mich nicht mehr vorfindest, so gehe zu Abu Bakr.«",

  // 21: 7221
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Sufyan: Qais ibn Muslim berichtete mir, von Tariq ibn Schihab, von Abu Bakr (möge Allah mit ihm zufrieden sein), der zu der Abordnung von Buzacha sagte: »Ihr werdet den Fährten der Kamele folgen, bis Allah dem Nachfolger Seines Propheten (Friede sei auf ihm) und den Auswanderern (Muhadschirun) eine Entscheidung zeigt, für die sie euch verzeihen können.«",

  // 22: 7222, 7223
  "Muhammad ibn al-Muthanna berichtete mir: Ghundar überlieferte uns: Schu'ba überlieferte uns, von 'Abd al-Malik: Ich hörte Dschabir ibn Samura sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Es wird zwölf Anführer geben.« Dann sprach er ein Wort, das ich nicht verstand; da sagte mein Vater: Er sagte: »Alle von ihnen stammen aus den Quraisch.«",

  // 23: 7224
  "Isma'il überlieferte uns: Malik berichtete mir, von Abu z-Zinad, von al-A'radsch, von Abu Huraira (möge Allah mit ihm zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Bei Dem, in Dessen Hand meine Seele liegt! Ich hatte schon vor, befehlen zu lassen, dass Feuerholz gesammelt wird, dann zum Gebet rufen zu lassen, dann einen Mann zu beauftragen, die Menschen im Gebet anzuführen, und mich dann zu Männern zu begeben, um ihre Häuser über ihnen niederzubrennen! Bei Dem, in Dessen Hand meine Seele liegt, wüsste einer von ihnen, dass er einen fetten Fleischknochen oder zwei schöne Schafsklauen fände, er würde gewiss zum Nachtgebet ('Ischa') erscheinen!« Muhammad ibn Yusuf sagte: Yunus sagte: Muhammad ibn Sulaiman sagte: Abu 'Abdillah (al-Bukhari) sagte: Ein Mirmah ist das Fleisch zwischen der Klaue des Schafes, ähnlich wie Minsa'a und Mida'a; das Mim wird mit Kasra gesprochen.",

  // 24: 7225
  "Yahya ibn Bukair berichtete mir: al-Laith überlieferte uns, von 'Uqail, von Ibn Schihab, von 'Abd ar-Rahman ibn 'Abdillah ibn Ka'b ibn Malik, dass 'Abdullah ibn Ka'b ibn Malik – der Ka'bs Führer unter seinen Söhnen war, als er erblindete – sagte: Ich hörte Ka'b ibn Malik sagen, als er beim Feldzug von Tabuk hinter dem Gesandten Allahs (Friede sei auf ihm) zurückgeblieben war – und er erwähnte seinen Bericht –: Der Gesandte Allahs (Friede sei auf ihm) verbot den Muslimen, mit uns zu sprechen. So verharrten wir fünfzig Nächte lang darin, bis der Gesandte Allahs (Friede sei auf ihm) verkündete, dass Allah unsere Reue angenommen hatte.",

  // 25: 7226
  "Sa'id ibn 'Ufair überlieferte uns: al-Laith berichtete mir: 'Abd ar-Rahman ibn Chalid berichtete mir, von Ibn Schihab, von Abu Salama und Sa'id ibn al-Musayyab, dass Abu Huraira sagte: Ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: »Bei Dem, in Dessen Hand meine Seele liegt! Wäre es nicht darum, dass manche Männer es verabscheuen, nach mir zurückzubleiben, während ich keine Reittiere finde, um sie mitzunehmen, so wäre ich hinter keinem Heereszug zurückgeblieben. Wahrlich, ich wünschte, ich würde auf dem Wege Allahs getötet, dann wieder lebendig gemacht, dann getötet, dann wieder lebendig gemacht, dann getötet, dann wieder lebendig gemacht, dann getötet!«",

  // 26: 7227
  "'Abdullah ibn Yusuf überlieferte uns: Malik berichtete uns, von Abu z-Zinad, von al-A'radsch, von Abu Huraira, dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Bei Dem, in Dessen Hand meine Seele liegt! Ich wünschte, ich würde auf dem Wege Allahs kämpfen und getötet werden, dann wieder lebendig gemacht und getötet werden, dann wieder lebendig gemacht und getötet werden, dann wieder lebendig gemacht und getötet werden, dann wieder lebendig gemacht werden!« Und Abu Huraira pflegte diese Worte dreimal zu sprechen und sagte: »Ich bezeuge es bei Allah!«",

  // 27: 7228
  "Ishaq ibn Nasr überlieferte uns: 'Abd ar-Razzaq überlieferte uns, von Ma'mar, von Hammam, der Abu Huraira vom Propheten (Friede sei auf ihm) sagen hörte: »Hätte ich Gold von der Größe des Berges Uhud, so würde ich wünschen, dass nicht drei Nächte vergehen, während ich noch einen einzigen Dinar davon bei mir habe, außer etwas, das ich für eine Schuld bereithalte, die auf mir lastet, sofern ich jemanden finde, der es annimmt.«",

  // 28: 7229
  "Abu l-Yaman überlieferte uns: Schu'aib überlieferte uns. Und 'Ali ibn 'Abdillah überlieferte uns: al-Laith überlieferte uns, von 'Uqail, von Ibn Schihab, der sagte: 'Urwa berichtete mir, dass 'A'ischa sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Hätte ich im Voraus gewusst, was ich erst im Nachhinein erfahren habe, so hätte ich keine Opfertiere mitgeführt und hätte die Weihe (den Ihram) zusammen mit den Menschen beendet, als sie sie beendeten.«",

  // 29: 7230
  "Al-Hasan ibn 'Umar überlieferte uns: Yazid überlieferte uns, von Habib, von 'Ata', von Dschabir ibn 'Abdillah, der sagte: Wir waren mit dem Gesandten Allahs (Friede sei auf ihm) und riefen den Talbiya-Ruf für den Haddsch aus, und wir erreichten Mekka, als vier Tage vom Monat Dhu l-Hiddscha vergangen waren. Da befahl uns der Prophet (Friede sei auf ihm), den Tawaf um das Haus und den Sa'y zwischen as-Safa und al-Marwa zu vollziehen und dies zu einer 'Umra zu machen und die Weihe zu beenden, außer demjenigen, der ein Opfertier bei sich hatte. Er sagte: Und niemand von uns hatte ein Opfertier bei sich außer dem Propheten (Friede sei auf ihm) und Talha; und 'Ali kam aus dem Jemen und hatte Opfertiere bei sich und sagte: »Ich habe die Weihe für das erklärt, wofür der Gesandte Allahs (Friede sei auf ihm) die Weihe erklärt hat.« Da sagten die Leute: »Sollen wir etwa nach Mina aufbrechen, während aus den Gliedern von einem von uns noch die Tropfen fließen?« Da sagte der Gesandte Allahs (Friede sei auf ihm): »Wahrlich, hätte ich im Voraus gewusst, was ich erst im Nachhinein erfahren habe, so hätte ich keine Opfertiere mitgeführt; und hätte ich nicht das Opfertier bei mir, hätte ich die Weihe beendet.« Er sagte: Da traf ihn Suraqa, während er die Steine an der Dschamrat al-'Aqaba warf, und fragte: »O Gesandter Allahs, gilt dies nur für uns ganz besonders?« Er sagte: »Nein, vielmehr für immer.« Er sagte: Und 'A'ischa war menstruierend in Mekka eingetroffen. Da befahl ihr der Prophet (Friede sei auf ihm), alle Riten der Pilgerfahrt zu vollziehen, außer dass sie weder den Tawaf um das Haus vollziehen noch beten sollte, bis sie rein geworden war. Als sie sich in al-Batha' lagerten, sagte 'A'ischa: »O Gesandter Allahs, zieht ihr mit einer Pilgerfahrt und einer 'Umra davon, während ich nur mit einer Pilgerfahrt davonziehe?« Er sagte: Da befahl er 'Abd ar-Rahman ibn Abi Bakr as-Siddiq, mit ihr nach at-Tan'im zu ziehen; da vollzog sie eine 'Umra im Monat Dhu l-Hiddscha nach den Tagen des Haddsch."
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
