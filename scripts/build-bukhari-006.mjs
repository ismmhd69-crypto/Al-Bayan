import fs from 'fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-006.json'));

const translations = [
  // 0: 973850d7-9441-4b0e-9472-c9fc95255d2e (hadith 5269)
  {
    id: "973850d7-9441-4b0e-9472-c9fc95255d2e",
    de: "Muslim ibn Ibrahim überlieferte uns: Hisham überlieferte uns: Qatadah überlieferte uns von Zurarah ibn Awfa, von Abu Hurayrah (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), dass er sagte: „Wahrlich, Allah sieht meiner Gemeinschaft das nach, was ihre Seelen ihnen einflüstern, solange sie es nicht in die Tat umsetzen oder aussprechen.“ Qatadah sagte: „Wenn er sich in Gedanken scheidet, so hat dies keine Gültigkeit.“"
  },
  // 1: a47c5f38-ab45-4a08-8197-87c7c26a1080 (hadith 5270)
  {
    id: "a47c5f38-ab45-4a08-8197-87c7c26a1080",
    de: "Asbagh überlieferte uns: Ibn Wahb berichtete uns von Yunus, von Ibn Shihab, der sagte: Abu Salamah berichtete mir von Jabir, dass ein Mann von den Aslam zum Propheten (Friede sei auf ihm) kam, während er in der Moschee war, und gestand, dass er Unzucht getrieben habe. Der Prophet wandte sich von ihm ab. Da begab er sich auf jene Seite, zu der er sich abgewandt hatte, und bezeugte es viermal gegen sich selbst. Da rief ihn der Prophet (Friede sei auf ihm) zu sich und fragte: „Bist du wahnsinnig? Hast du je die Ehe vollzogen?“ Er antwortete: „Ja.“ Da befahl er, dass er auf dem Gebetsplatz gesteinigt werde. Als ihn die Steine schmerzten, floh er im Laufschritt, bis man ihn bei al-Harrah einholte und tötete."
  },
  // 2: 8486642b-0c55-4f9a-8887-6ed908f2e289 (hadith 5271, 5272)
  {
    id: "8486642b-0c55-4f9a-8887-6ed908f2e289",
    de: "Abu al-Yaman überlieferte uns: Schu‘ayb berichtete uns von az-Zuhri, der sagte: Abu Salamah ibn ‘Abd ar-Rahman und Sa‘id ibn al-Musayyib berichteten mir, dass Abu Hurayrah sagte: Ein Mann von den Aslam kam zum Gesandten Allahs (Friede sei auf ihm), während er in der Moschee war, und rief ihm zu: „O Gesandter Allahs, der Letzte hat Unzucht begangen!“ – womit er sich selbst meinte. Der Prophet wandte sich von ihm ab. Da begab er sich auf die Seite, zu der er sein Gesicht abgewandt hatte, und sagte: „O Gesandter Allahs, der Letzte hat Unzucht begangen!“ Der Prophet wandte sich ab, da begab er sich wieder auf jene Seite und wiederholte es. Der Prophet wandte sich ab, da begab er sich zum vierten Mal auf jene Seite. Als er viermal gegen sich selbst bezeugt hatte, rief ihn der Prophet zu sich und fragte: „Bist du wahnsinnig?“ Er antwortete: „Nein.“ Da sprach der Prophet (Friede sei auf ihm): „Bringt ihn fort und steinigt ihn!“ Er war verheiratet gewesen. Und von az-Zuhri, der sagte: Mich unterrichtete jemand, der Jabir ibn ‘Abdullah al-Ansari sagen hörte: Ich gehörte zu jenen, die ihn steinigten; wir steinigten ihn auf dem Gebetsplatz in Medina. Als ihn die Steine schmerzten, floh er, bis wir ihn bei al-Harrah einholten, und wir steinigten ihn, bis er starb."
  },
  // 3: 10f26028-dd55-4f48-b5c6-5c8f3d5952a2 (hadith 5273)
  {
    id: "10f26028-dd55-4f48-b5c6-5c8f3d5952a2",
    de: "Azhar ibn Jamil überlieferte uns: ‘Abd al-Wahhab ath-Thaqafi überlieferte uns: Khalid überlieferte uns von ‘Ikrimah, von Ibn ‘Abbas, dass die Ehefrau von Thabit ibn Qays zum Propheten (Friede sei auf ihm) kam und sagte: „O Gesandter Allahs, an Thabit ibn Qays habe ich weder an seinem Charakter noch an seiner Frömmigkeit etwas auszusetzen, doch verabscheue ich den Unglauben im Islam.“ Da sprach der Gesandte Allahs (Friede sei auf ihm): „Gibst du ihm seinen Garten zurück?“ Sie sagte: „Ja.“ Da sprach der Gesandte Allahs (Friede sei auf ihm): „Nimm den Garten an und scheide sie mit einer Scheidung!“ Abu ‘Abdullah sagte: Diesbezüglich wird ihm von Ibn ‘Abbas nicht gefolgt."
  },
  // 4: 3a9d5ad3-0e8c-4949-a4f6-58737bf6ec8d (hadith 5274)
  {
    id: "3a9d5ad3-0e8c-4949-a4f6-58737bf6ec8d",
    de: "Ishaq al-Wasiti überlieferte uns: Khalid überlieferte uns von Khalid al-Hadhdha’, von ‘Ikrimah, dass die Schwester von ‘Abdullah ibn Ubayy denselben Bericht überlieferte; und er sagte: „Gibst du ihm seinen Garten zurück?“ Sie sagte: „Ja.“ Da gab sie ihn ihm zurück, und er befahl ihm, sie zu scheiden. Und Ibrahim ibn Tahman überlieferte von Khalid, von ‘Ikrimah, vom Propheten (Friede sei auf ihm): „Und scheide sie.“"
  },
  // 5: 042f37cd-7b51-4f96-8e09-3b4452014e45 (hadith 5275)
  {
    id: "042f37cd-7b51-4f96-8e09-3b4452014e45",
    de: "Und von Ibn Abi Tamimah, von ‘Ikrimah, von Ibn ‘Abbas, dass er sagte: Die Ehefrau von Thabit ibn Qays kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: „O Gesandter Allahs, ich werfe Thabit weder etwas in seiner Religion noch in seinem Charakter vor, aber ich ertrage ihn einfach nicht.“ Da sprach der Gesandte Allahs (Friede sei auf ihm): „Gibst du ihm also seinen Garten zurück?“ Sie sagte: „Ja.“"
  },
  // 6: e4807bbe-f7f1-4401-8415-b1059ce2280f (hadith 5276)
  {
    id: "e4807bbe-f7f1-4401-8415-b1059ce2280f",
    de: "Muhammad ibn ‘Abdullah ibn al-Mubarak al-Mukharrimi überlieferte uns: Qirad Abu Nuh überlieferte uns: Jarir ibn Hazim überlieferte uns von Ayyub, von ‘Ikrimah, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein), der sagte: Die Ehefrau von Thabit ibn Qays ibn Schammas kam zum Propheten (Friede sei auf ihm) und sagte: „O Gesandter Allahs, ich grolle Thabit weder wegen seiner Religion noch wegen seines Charakters, außer dass ich den Unglauben fürchte.“ Da sprach der Gesandte Allahs (Friede sei auf ihm): „Gibst du ihm seinen Garten zurück?“ Sie antwortete: „Ja.“ Da gab sie ihn ihm zurück, und er befahl ihm, worauf er sich von ihr trennte."
  },
  // 7: 881af53f-2196-41a4-8893-56e1935120ab (hadith 5277)
  {
    id: "881af53f-2196-41a4-8893-56e1935120ab",
    de: "Sulayman überlieferte uns: Hammad überlieferte uns von Ayyub, von ‘Ikrimah, dass es Jamilah war; und dann erwähnte er den Hadith."
  },
  // 8: 420afb6e-c16f-44d9-8cd8-9655574956ba (hadith 5278)
  {
    id: "420afb6e-c16f-44d9-8cd8-9655574956ba",
    de: "Abu al-Walid überlieferte uns: Al-Layth überlieferte uns von Ibn Abi Mulaykah, von al-Miswar ibn Makhramah, der sagte: Ich hörte den Propheten (Friede sei auf ihm) sagen: „Die Banu al-Mughirah haben um Erlaubnis gebeten, dass ‘Ali ihre Tochter heiratet. Ich gebe keine Erlaubnis dazu!“"
  },
  // 9: caff8559-725f-46ab-9fb9-3557cf1e8af7 (hadith 5279)
  {
    id: "caff8559-725f-46ab-9fb9-3557cf1e8af7",
    de: "Isma‘il ibn ‘Abdullah überlieferte uns und sagte: Malik überlieferte mir von Rabi‘ah ibn Abi ‘Abd ar-Rahman, von al-Qasim ibn Muhammad, von ‘A’ishah (möge Allah mit ihr zufrieden sein), der Gattin des Propheten (Friede sei auf ihm), die sagte: In Bezug auf Barirah gab es drei Sunnah-Präzedenzfälle: Einer davon war, dass sie freigelassen wurde und ihr die Wahl hinsichtlich ihres Ehemannes freigestellt wurde. Und der Gesandte Allahs (Friede sei auf ihm) sagte: „Das Patronatsrecht (Wala’) steht nur demjenigen zu, der freigelassen hat.“ Und der Gesandte Allahs (Friede sei auf ihm) trat ein, während ein Fleischtopf brodelte; da wurde ihm Brot und ein Küchengericht gereicht. Er fragte: „Habe ich nicht den Topf mit Fleisch gesehen?“ Sie sagten: „Doch, gewiss, aber dieses Fleisch wurde Barirah als Almosen gegeben, und du isst kein Almosen.“ Da sprach er: „Für sie ist es ein Almosen, und für uns ist es ein Geschenk.“"
  },
  // 10: 585bdc2e-c4ea-4e95-9e1a-b6254c90ff61 (hadith 5280)
  {
    id: "585bdc2e-c4ea-4e95-9e1a-b6254c90ff61",
    de: "Abu al-Walid überlieferte uns: Shu‘bah und Hammam überlieferten uns von Qatadah, von ‘Ikrimah, von Ibn ‘Abbas, der sagte: „Ich sah ihn als Sklaven“ – womit er den Ehemann von Barirah meinte."
  },
  // 11: 331ec996-4005-4b1e-9361-bc325d82e95d (hadith 5281)
  {
    id: "331ec996-4005-4b1e-9361-bc325d82e95d",
    de: "‘Abd al-A‘la ibn Hammad überlieferte uns: Wuhayb überlieferte uns: Ayyub überlieferte uns von ‘Ikrimah, von Ibn ‘Abbas, der sagte: „Jener war Mughith, ein Sklave der Banu Soundso“ – womit er den Ehemann von Barirah meinte –; „als sähe ich ihn noch vor mir, wie er ihr durch die Gassen von Medina weinend hinterherlief.“"
  },
  // 12: 5e52d430-14d1-4eed-8350-7aa853a375c2 (hadith 5282)
  {
    id: "5e52d430-14d1-4eed-8350-7aa853a375c2",
    de: "Qutaybah ibn Sa‘id überlieferte uns: ‘Abd al-Wahhab überlieferte uns von Ayyub, von ‘Ikrimah, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein), der sagte: Der Ehemann von Barirah war ein schwarzer Sklave namens Mughith, ein Sklave der Banu Soundso; als sähe ich ihn noch vor mir, wie er hinter ihr her durch die Gassen von Medina zog."
  },
  // 13: 679637d7-0801-4633-b791-e38634b60a87 (hadith 5283)
  {
    id: "679637d7-0801-4633-b791-e38634b60a87",
    de: "Muhammad überlieferte uns: ‘Abd al-Wahhab berichtete uns: Khalid überlieferte uns von ‘Ikrimah, von Ibn ‘Abbas, dass der Ehemann von Barirah ein Sklave namens Mughith war; als sähe ich ihn noch vor mir, wie er weinend hinter ihr herging, während ihm die Tränen über den Bart flossen. Da sagte der Prophet (Friede sei auf ihm) zu ‘Abbas: „O ‘Abbas, wundert dich nicht Mughiths Liebe zu Barirah und Barirahs Abneigung gegen Mughith?“ Da sprach der Prophet (Friede sei auf ihm) zu ihr: „Würdest du doch nur zu ihm zurückkehren!“ Sie fragte: „O Gesandter Allahs, befiehlst du es mir?“ Er antwortete: „Ich lege nur Fürsprache ein.“ Da sagte sie: „Ich habe kein Verlangen nach ihm.“"
  },
  // 14: d1f2b16a-d37d-4dec-8878-f20d23566f98 (hadith 5284)
  {
    id: "d1f2b16a-d37d-4dec-8878-f20d23566f98",
    de: "‘Abdullah ibn Raja’ überlieferte uns: Shu‘bah berichtete uns von al-Hakam, von Ibrahim, von al-Aswad, dass ‘A’ishah Barirah kaufen wollte, deren Dienstherren sich jedoch weigerten, außer unter der Bedingung, dass das Patronatsrecht (Wala’) ihnen verbleibe. Sie erwähnte dies dem Propheten (Friede sei auf ihm), worauf er sprach: „Kaufe sie und lasse sie frei; denn das Patronatsrecht gebührt nur demjenigen, der freigelassen hat.“ Und dem Propheten (Friede sei auf ihm) wurde Fleisch gebracht, und man sagte: „Dies wurde Barirah als Almosen gegeben.“ Da sagte er: „Für sie ist es ein Almosen, und für uns ist es ein Geschenk.“ Adam überlieferte uns: Shu‘bah überlieferte uns und fügte hinzu: „Und ihr wurde die Wahl bezüglich ihres Ehemannes freigestellt.“"
  },
  // 15: 0f71056e-9b2f-4f9b-add4-27bb6059e5ee (hadith 5285)
  {
    id: "0f71056e-9b2f-4f9b-add4-27bb6059e5ee",
    de: "Qutaybah überlieferte uns: Layth überlieferte uns von Nafi‘, dass Ibn ‘Umar, wenn er über die Heirat mit einer Christin oder Jödin befragt wurde, sagte: „Wahrlich, Allah hat den Gläubigen die götzendienenden Frauen verboten; und ich kenne keine größere Beigesellung (Schirk), als dass eine Frau behauptet, ihr Herr sei ‘Isa, wo er doch nur ein Diener unter den Dienern Allahs ist.“"
  },
  // 16: 6f9ab00d-5b54-42c4-b241-47d0b2285fa8 (hadith 5286)
  {
    id: "6f9ab00d-5b54-42c4-b241-47d0b2285fa8",
    de: "Ibrahim ibn Musa überlieferte uns: Hisham berichtete uns von Ibn Jurayj; und ‘Ata’ überlieferte von Ibn ‘Abbas: Die Götzendiener standen in zweierlei Stellung zum Propheten (Friede sei auf ihm) und den Gläubigen: Es gab kriegsführende Götzendiener, die er bekämpfte und die ihn bekämpften; und verbündete Götzendiener mit einem Friedensvertrag, die er nicht bekämpfte und die ihn nicht bekämpften. Wenn eine Frau aus dem Kriegsgebiet auswanderte, durfte um sie nicht geworben werden, bis sie ihre Monatsblutung hatte und rein wurde. Sobald sie rein war, war die Heirat mit ihr erlaubt. Wenn ihr Ehemann auswanderte, bevor sie heiratete, wurde sie zu ihm zurückgeführt. Wenn aber ein männlicher oder weiblicher Sklave von ihnen auswanderte, so wurden beide frei und hatten dieselben Rechte wie die Auswanderer. Dann erwähnte er über die Vertragsleute Ähnliches wie im Hadith von Mujahid: Wenn ein männlicher oder weiblicher Sklave von den verbündeten Götzendienern auswanderte, wurden sie nicht zurückgegeben, sondern deren Kaufpreis wurde den Besitzern erstattet."
  },
  // 17: 4bba0bbe-b381-4f92-8e85-7ed5e8316811 (hadith 5287)
  {
    id: "4bba0bbe-b381-4f92-8e85-7ed5e8316811",
    de: "Und ‘Ata’ überlieferte von Ibn ‘Abbas: Qaribah bint Abi Umayyah war mit ‘Umar ibn al-Khattab verheiratet, und er schied sich von ihr, woraufhin Mu‘awiyah ibn Abi Sufyan sie heiratete. Und Umm al-Hakam bint Abi Sufyan war mit ‘Iyad ibn Ghanm al-Fihri verheiratet, und er schied sich von ihr, woraufhin ‘Abdullah ibn ‘Uthman ath-Thaqafi sie heiratete."
  },
  // 18: 160b9a51-0385-4049-92e9-91f2785f932e (hadith 5288)
  {
    id: "160b9a51-0385-4049-92e9-91f2785f932e",
    de: "Ibn Bukayr überlieferte uns: Al-Layth überlieferte uns von ‘Uqayl, von Ibn Shihab. Und Ibrahim ibn al-Mundhir sagte: Ibn Wahb überlieferte mir: Yunus überlieferte mir. Ibn Shihab sagte: ‘Urwah ibn az-Zubayr berichtete mir, dass ‘A’ishah (möge Allah mit ihr zufrieden sein), die Gattin des Propheten (Friede sei auf ihm), sagte: Wenn gläubige Frauen zum Propheten (Friede sei auf ihm) auswanderten, pflegte er sie anhand des Wortes Allahs des Erhabenen zu prüfen: „O die ihr glaubt, wenn gläubige Frauen als Auswanderer zu euch kommen, so prüft sie…“ bis zum Ende des Verses (60:10). ‘A’ishah sagte: Welche der gläubigen Frauen diese Bedingung anerkannte, die hatte die Prüfung bestanden. Wenn sie dies mit ihren Worten bestätigten, sprach der Gesandte Allahs (Friede sei auf ihm) zu ihnen: „Geht, ich habe euren Treueeid angenommen.“ Nein, bei Allah, niemals berührte die Hand des Gesandten Allahs (Friede sei auf ihm) die Hand einer fremden Frau; vielmehr nahm er ihren Treueeid allein mit Worten entgegen. Bei Allah, der Gesandte Allahs (Friede sei auf ihm) verpflichtete die Frauen zu nichts anderem, als wozu Allah ihn angewiesen hatte, indem er zu ihnen sprach, wenn er ihren Eid entgegennahm: „Ich habe euren Treueeid angenommen“, nur mit Worten."
  },
  // 19: f2f0c895-a091-43f4-991e-a73d5c55017a (hadith 5289)
  {
    id: "f2f0c895-a091-43f4-991e-a73d5c55017a",
    de: "Isma‘il ibn Abi Uways überlieferte uns von seinem Bruder, von Sulayman, von Humayd at-Tawil, dass er Anas ibn Malik sagen hörte: Der Gesandte Allahs (Friede sei auf ihm) schwor, sich einen Monat lang von seinen Frauen fernzuhalten. Sein Bein war ausgerenkt gewesen, und so verweilte er in einem Obergemach von ihm für 29 Tage. Dann stieg er herab, worauf sie sagten: „O Gesandter Allahs, du hast doch geschworen, einen Monat lang fernzubleiben?“ Da sprach er: „Der Monat hat 29 Tage.“"
  },
  // 20: 6afbe047-8a42-4963-8874-cbb9e2d2b7b2 (hadith 5290)
  {
    id: "6afbe047-8a42-4963-8874-cbb9e2d2b7b2",
    de: "Qutaybah überlieferte uns: Al-Layth überlieferte uns von Nafi‘, dass Ibn ‘Umar (möge Allah mit beiden zufrieden sein) bezüglich des von Allah genannten Enthaltsamkeitseides (Ila’) zu sagen pflegte: Nach Ablauf der Frist ist es niemandem mehr erlaubt, außer sie auf gütige Weise zu behalten oder sich zur Scheidung zu entschließen, so wie Allah, der Mächtige und Majestätische, geboten hat."
  },
  // 21: 367a1ede-c6b1-4a9c-81a2-51aa347cf5a6 (hadith 5291)
  {
    id: "367a1ede-c6b1-4a9c-81a2-51aa347cf5a6",
    de: "Und Isma‘il sprach zu mir: Malik überlieferte mir von Nafi‘, von Ibn ‘Umar: Wenn vier Monate verstrichen sind, wird der Mann angehalten, bis er die Scheidung ausspricht; und die Scheidung tritt nicht eher ein, bis er sie selbst vollzieht. Dies wird auch von ‘Uthman, ‘Ali, Abu ad-Darda’, ‘A’ishah und 12 Männern unter den Gefährten des Propheten (Friede sei auf ihm) überliefert."
  },
  // 22: 1134d28c-1496-4e83-964b-0c18a8bbbac9 (hadith 5292)
  {
    id: "1134d28c-1496-4e83-964b-0c18a8bbbac9",
    de: "‘Ali ibn ‘Abdullah überlieferte uns: Sufyan überlieferte uns von Yahya ibn Sa‘id, von Yazid, dem Freigelassenen von al-Munba‘ith, dass der Prophet (Friede sei auf ihm) nach einem verirrten Schaf befragt wurde und sagte: „Nimm es an dich; denn es gehört entweder dir, deinem Bruder oder dem Wolf.“ Und er wurde nach einem verirrten Kamel befragt, woraufhin er zornig wurde und seine Wangen sich röteten, und er sagte: „Was geht es dich an? Es hat seine Hufe und seinen Wasservorrat bei sich; es trinkt Wasser und frisst von den Bäumen, bis sein Besitzer es findet.“ Und er wurde nach Fundsachen gefragt, woraufhin er sagte: „Merke dir ihren Beutel und ihr Band, rufe sie ein Jahr lang aus; wenn dann jemand kommt, der sie genau beschreibt, gib sie ihm, andernfalls mische sie unter dein Vermögen.“ Sufyan sagte: Dann traf ich Rabi‘ah ibn Abi ‘Abd ar-Rahman – und Sufyan sagte: Ich habe außer diesem Bericht nichts von ihm behalten – und fragte: „Meinst du jenen Hadith von Yazid, dem Freigelassenen von al-Munba‘ith, über Fundsachen, dass er von Zayd ibn Khalid stammt?“ Er sagte: „Ja.“ Yahya sagte: Und Rabi‘ah überliefert von Yazid, dem Freigelassenen von al-Munba‘ith, von Zayd ibn Khalid. Sufyan sagte: So traf ich Rabi‘ah und sprach dies zu ihm."
  },
  // 23: f4f0a9f6-1a24-4b1b-adf9-31989e6eb8ad (hadith 5293)
  {
    id: "f4f0a9f6-1a24-4b1b-adf9-31989e6eb8ad",
    de: "‘Abdullah ibn Muhammad überlieferte uns: Abu ‘Amir ‘Abd al-Malik ibn ‘Amr überlieferte uns: Ibrahim überlieferte uns von Khalid, von ‘Ikrimah, von Ibn ‘Abbas, der sagte: Der Gesandte Allahs (Friede sei auf ihm) umschritt das Haus auf seinem Kamel; und sooft er an die Ecke (mit dem Schwarzen Stein) kam, deutete er darauf und sprach den Takbir. Und Zaynab sagte: Der Prophet (Friede sei auf ihm) sagte: „Von der Mauer von Gog und Magog ist heute eine Öffnung wie diese durchbrochen worden“, und er formte mit den Fingern eine 90."
  },
  // 24: 785b8ddd-7e8c-4607-8f87-dc111d647c84 (hadith 5294)
  {
    id: "785b8ddd-7e8c-4607-8f87-dc111d647c84",
    de: "Musaddad überlieferte uns: Bishr ibn al-Mufaddal überlieferte uns: Salamah ibn ‘Alqamah überlieferte uns von Muhammad ibn Sirin, von Abu Hurayrah, der sagte: Abu al-Qasim (Friede sei auf ihm) sagte: „Am Freitag gibt es eine Stunde: Wenn ein muslimischer Diener währenddessen im Gebet steht und Allah um etwas Gutes bittet, so gibt Er es ihm gewiss.“ Und er deutete mit seiner Hand und legte seine Fingerkuppe auf das Mittelglied seines kleinen Fingers; wir verstanden daraus, dass er andeutete, wie kurz diese Weile ist."
  },
  // 25: 6fee32e0-ba4b-4da9-9ac5-f98626969d13 (hadith 5295)
  {
    id: "6fee32e0-ba4b-4da9-9ac5-f98626969d13",
    de: "Und al-Uwaysi sagte: Ibrahim ibn Sa‘d überlieferte uns von Shu‘bah ibn al-Hajjaj, von Hisham ibn Zayd, von Anas ibn Malik, der sagte: Zur Zeit des Gesandten Allahs (Friede sei auf ihm) überfiel ein jüdischer Mann ein junges Mädchen, raubte ihren Silberschmuck und zerschlug ihren Kopf mit Steinen. Ihre Familie brachte sie zum Gesandten Allahs (Friede sei auf ihm), während sie in den letzten Zügen lag und nicht mehr sprechen konnte. Da fragte der Gesandte Allahs (Friede sei auf ihm): „Hat dich Soundso getötet?“ – wobei er jemand anderen als den Mörder nannte. Sie schüttelte den Kopf zum Zeichen des Nein. Er nannte einen weiteren Mann außer dem Mörder, und sie schüttelte den Kopf zum Nein. Dann fragte er: „War es Soundso?“ – und nannte ihren Mörder. Da nickte sie mit dem Kopf zum Zeichen des Ja. Da befahl der Gesandte Allahs (Friede sei auf ihm), seinen Kopf zwischen zwei Steinen zu zermalmen."
  },
  // 26: 50f234f0-527c-4204-94e1-ba498f0b3df3 (hadith 5296)
  {
    id: "50f234f0-527c-4204-94e1-ba498f0b3df3",
    de: "Qabisah überlieferte uns: Sufyan überlieferte uns von ‘Abdullah ibn Dinar, von Ibn ‘Umar (möge Allah mit beiden zufrieden sein), der sagte: Ich hörte den Propheten (Friede sei auf ihm) sagen: „Die Fitnah geht von dort drüben aus“, und er zeigte mit der Hand nach Osten."
  },
  // 27: 839bedf0-a802-4ab7-9895-979f86b1f811 (hadith 5297)
  {
    id: "839bedf0-a802-4ab7-9895-979f86b1f811",
    de: "‘Ali ibn ‘Abdullah überlieferte uns: Jarir ibn ‘Abd al-Hamid überlieferte uns von Abu Ishaq ash-Shaybani, von ‘Abdullah ibn Abi Awfa, der sagte: Wir befanden uns auf einer Reise mit dem Gesandten Allahs (Friede sei auf ihm). Als die Sonne untergegangen war, sprach er zu einem Mann: „Steig ab und rühre mir ein Getränk (Sawiq) an!“ Der Mann sagte: „O Gesandter Allahs, wenn du doch wartetest, bis es Abend wird!“ Er sagte erneut: „Steig ab und rühre mir an!“ Der Mann entgegnete: „O Gesandter Allahs, es ist noch Tageslicht über dir!“ Da sprach er zum dritten Mal: „Steig ab und rühre mir an!“ Da stieg er ab und rührte es ihm beim dritten Mal an. Der Gesandte Allahs (Friede sei auf ihm) trank davon, deutete dann mit seiner Hand nach Osten und sprach: „Wenn ihr seht, dass die Nacht von dort heraufzieht, so hat der Fastende sein Fasten gebrochen.“"
  },
  // 28: 41e86862-9db2-4042-98e1-583f53a77976 (hadith 5298)
  {
    id: "41e86862-9db2-4042-98e1-583f53a77976",
    de: "‘Abdullah ibn Maslamah überlieferte uns: Yazid ibn Zuray‘ überlieferte uns von Sulayman at-Taymi, von Abu ‘Uthman, von ‘Abdullah ibn Mas‘ud (möge Allah mit ihm zufrieden sein), der sagte: Der Prophet (Friede sei auf ihm) sagte: „Keiner von euch soll sich durch den Ruf Bilals – oder er sagte: seinen Gebetsruf – von seiner Sahur-Mahlzeit vor dem Morgengrauen abhalten lassen; denn er ruft – oder er spricht den Gebetsruf –, damit derjenige unter euch, der im Nachtgebet steht, zurückkehrt und der Schlafende aufwacht.“ Und dies bedeutet keineswegs, dass er meint, der Morgen oder das Frühlicht sei bereits angebrochen. Und Yazid zeigte seine beiden Hände und streckte eine weit von der anderen weg."
  },
  // 29: 9dc57845-4f59-4ba0-b713-85f768bf2d7b (hadith 5299)
  {
    id: "9dc57845-4f59-4ba0-b713-85f768bf2d7b",
    de: "Und al-Layth sagte: Ja‘far ibn Rabi‘ah überlieferte mir von ‘Abd ar-Rahman ibn Hurmuz, der sagte: Ich hörte Abu Hurayrah sagen, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Das Gleichnis des Geizigen und des Spenders ist wie das zweier Männer, die zwei Panzerhemden aus Eisen tragen, von ihren Brüsten bis zu ihren Schlüsselbeinen: Was den Freigebigen betrifft, so spendet er nichts, ohne dass das Panzerhemd sich über seine Haut weitet, bis es seine Fingerspitzen bedeckt und seine Fußspuren verwischt. Was aber den Geizigen betrifft, so will er nichts spenden, ohne dass jeder Ring an seinem Platz festsitzt; er bemüht sich, ihn zu weiten, doch er weitet sich nicht.“ Und er deutete mit seinem Finger auf seine Kehle."
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
  const outPath = 'data/german-batches/hadith-outputs/bukhari-batch-006.json';
  fs.writeFileSync(outPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log(`Successfully wrote ${translations.length} items to ${outPath}`);
} else {
  console.error('Validation failed, did not write output file.');
  process.exit(1);
}
