import fs from 'fs';
import path from 'path';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = path.resolve('data/german-batches/hadith-inputs/bukhari-batch-023.json');
const outputPath = path.resolve('data/german-batches/hadith-outputs/bukhari-batch-023.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const items = JSON.parse(raw);

const translations = [
  // 0: 6437
  "Muhammad berichtete mir: Machlad berichtete uns: Ibn Dschuraij berichtete uns, er sagte: Ich hörte 'Ata' sagen: Ich hörte Ibn 'Abbas sagen: Ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: »Hätte der Sohn Adams ein Tal voller Reichtum, so würde er sich wünschen, noch ein gleiches dazu zu haben; und nichts füllt das Auge des Sohnes Adams außer dem Staub, und Allah nimmt die Reue dessen an, der bereut.« Ibn 'Abbas sagte: Ich weiß nicht, ob dies aus dem Koran stammt oder nicht. Er sagte: Und ich hörte Ibn az-Zubair dies von der Kanzel herab sagen.",

  // 1: 6572
  "Musaddad überlieferte uns: Abu 'Awana überlieferte uns, von 'Abd al-Malik, von 'Abdullah ibn al-Harith ibn Naufal, von al-'Abbas (möge Allah mit ihm zufrieden sein), dass er zum Propheten (Friede sei auf ihm) sagte: »Hast du Abu Talib in irgendeiner Weise genützt?«",

  // 2: 6895b
  "Muhammad ibn Baschschar überlieferte uns: Ibn Abi 'Adi überlieferte uns, von Schu'ba, von Qatada, von 'Ikrima, von Ibn 'Abbas, der sagte: Ich hörte den Propheten (Friede sei auf ihm) etwas Ähnliches sagen.",

  // 3: 6908b
  "Muhammad ibn 'Abdillah berichtete mir: Muhammad ibn Sabiq überlieferte uns: Za'ida überlieferte uns: Hischam ibn 'Urwa überlieferte uns, von seinem Vater, dass er al-Mughira ibn Schu'ba über 'Umar berichten hörte, dass er sie bezüglich der Fehlgeburt einer Frau (infolge einer Gewalttat) um Rat fragte, ähnlich dem Vorhergehenden.",

  // 4: 7044
  "Sa'id ibn ar-Rabi' überlieferte uns: Schu'ba überlieferte uns, von 'Abd Rabbih ibn Sa'id, der sagte: Ich hörte Abu Salama sagen: Ich pflegte Träume zu sehen, die mich krank machten, bis ich Abu Qatada sagen hörte: Auch ich pflegte Träume zu sehen, die mich krank machten, bis ich den Propheten (Friede sei auf ihm) sagen hörte: »Der gute Traum ist von Allah. Wenn einer von euch sieht, was er liebt, so soll er es nur dem erzählen, den er liebt. Und wenn er sieht, was er verabscheut, so soll er bei Allah Zuflucht vor seinem Übel und vor dem Übel des Satans suchen, dreimal leicht ausspucken und niemandem davon erzählen, denn er wird ihm keinen Schaden zufügen.«",

  // 5: 7045
  "Ibrahim ibn Hamza überlieferte uns: Ibn Abi Hazim und ad-Darawardi berichteten mir, von Yazid, von 'Abdullah ibn Chabbab, von Abu Sa'id al-Chudri, dass er den Gesandten Allahs (Friede sei auf ihm) sagen hörte: »Wenn einer von euch einen Traum sieht, den er liebt, so ist er von Allah; er soll Allah dafür preisen und davon erzählen. Und wenn er etwas anderes sieht, was er verabscheut, so ist dies vom Satan; er soll vor dessen Übel Zuflucht suchen und ihn niemandem erwähnen, denn er wird ihm nicht schaden.«",

  // 6: 7046
  "Yahya ibn Bukair berichtete mir: al-Laith überlieferte uns, von Yunus, von Ibn Schihab, von 'Ubaidullah ibn 'Abdillah ibn 'Utba, dass Ibn 'Abbas (möge Allah mit beiden zufrieden sein) zu berichten pflegte, dass ein Mann zum Gesandten Allahs (Friede sei auf ihm) kam und sagte: »Ich sah heute Nacht im Traum ein Schattendach, von dem Butter und Honig herabtropften, und ich sah die Menschen es mit den Händen auffangen, die einen viel und die anderen wenig. Und siehe, da reichte ein Seil von der Erde bis zum Himmel. Ich sah dich danach greifen und daran emporsteigen; dann ergriff es ein anderer Mann nach dir und stieg daran empor; dann ergriff es ein anderer Mann und stieg daran empor; dann ergriff es ein dritter Mann, da riss es ab, wurde dann aber wieder zusammengeknüpft.« Da sagte Abu Bakr: »O Gesandter Allahs, mögen mein Vater und meine Mutter für dich geopfert sein, bei Allah, lass mich ihn deuten!« Da sagte der Prophet (Friede sei auf ihm): »Deute ihn!« Er sagte: »Was das Schattendach betrifft, so ist es der Islam. Was aber an Honig und Butter herabtropft, so ist es der Koran – seine Süße tropft herab –, und die Menschen nehmen viel oder wenig vom Koran. Was das Seil betrifft, das vom Himmel zur Erde reicht, so ist es die Wahrheit, auf der du bist: Du ergreifst sie, und Allah erhöht dich dadurch; dann ergreift sie ein Mann nach dir und steigt dadurch empor; dann ergreift sie ein anderer Mann und steigt dadurch empor; dann ergreift sie ein anderer Mann, da reißt sie für ihn ab, wird ihm dann aber wieder zusammengefügt, und er steigt dadurch empor. So berichte mir, o Gesandter Allahs, möge mein Vater für dich geopfert sein: Habe ich recht oder habe ich mich geirrt?« Der Prophet (Friede sei auf ihm) sagte: »Du hattest in manchem recht und hast dich in manchem geirrt.« Er sagte: »Bei Allah, du musst mir sagen, worin ich mich geirrt habe!« Er sagte: »Schwöre nicht!«",

  // 7: 7047
  "Mu'ammal ibn Hischam Abu Hischam berichtete mir: Isma'il ibn Ibrahim überlieferte uns: 'Auf überlieferte uns: Abu Radscha' überlieferte uns: Samura ibn Dschundub (möge Allah mit ihm zufrieden sein) überlieferte uns, der sagte: Der Gesandte Allahs (Friede sei auf ihm) pflegte oft zu seinen Gefährten zu sagen: »Hat jemand von euch einen Traum gesehen?« Da erzählte ihm, wer auch immer Allah wollte, seinen Traum. Eines Morgens sagte er: »Wahrlich, zwei Gestalten kamen in dieser Nacht zu mir, weckten mich auf und sagten zu mir: ›Komm mit!‹ So ging ich mit ihnen, und wir kamen zu einem liegenden Mann, über dem ein anderer stand, der einen Felsbrocken hielt. Er schleuderte den Stein auf seinen Kopf und zerschmetterte ihn. Der Stein rollte weg, und er folgte ihm und holte ihn zurück. Er kehrte nicht zu ihm zurück, ehe dessen Kopf wieder heil geworden war, wie er zuvor gewesen war. Dann kehrte er zu ihm zurück und tat ihm dasselbe an wie beim ersten Mal.« Ich sagte zu beiden: »Gepriesen sei Allah! Wer sind diese beiden?« Sie sagten zu mir: »Geh weiter, geh weiter!« So zogen wir weiter und kamen zu einem Mann, der auf dem Rücken lag, während ein anderer mit einer eisernen Fleischgabel über ihm stand. Er trat an eine Seite seines Gesichts und zerriss seinen Mundwinkel bis zum Nacken, sein Nasenloch bis zum Nacken und sein Auge bis zum Nacken. – Abu Radscha' sagte bisweilen: Er spaltete es. – Dann wandte er sich der anderen Seite zu und tat ihr dasselbe an wie der ersten Seite. Kaum war er mit jener Seite fertig, war die erste Seite wieder geheilt, und er kehrte zu ihr zurück und tat dasselbe wie beim ersten Mal. Ich sagte: »Gepriesen sei Allah! Wer sind diese beiden?« Sie sagten: »Geh weiter, geh weiter!« So zogen wir weiter und kamen zu etwas, das einem Backofen glich. – Ich glaube, er sagte: Darin gab es Lärm und Stimmen. – Wir blickten hinein und sahen nackte Männer und Frauen; unter ihnen schoss eine Flamme von unten empor, und wenn die Flamme sie erreichte, schrien sie laut auf. Ich fragte: »Wer sind diese?« Sie sagten: »Geh weiter, geh weiter!« So zogen wir weiter und kamen zu einem Fluss – ich glaube, er sagte: rot wie Blut –, in dem ein Mann schwamm, und am Ufer stand ein Mann, der viele Steine bei sich gesammelt hatte. Wenn der Schwimmer eine Weile geschwommen war, kam er zu demjenigen, der die Steine gesammelt hatte; dieser riss seinen Mund auf und stieß ihm einen Stein hinein. Darauf schwamm er wieder davon und kehrte zurück; und jedes Mal, wenn er zurückkehrte, sperrte er seinen Mund auf und stieß ihm einen Stein hinein. Ich fragte: »Wer sind diese beiden?« Sie sagten: »Geh weiter, geh weiter!« So zogen wir weiter und kamen zu einem Mann von abscheulichem Aussehen – so hässlich, wie man nur einen Mann sehen kann –, bei dem ein Feuer brannte, das er anstachelte und um das er herumlief. Ich fragte: »Wer ist dieser?« Sie sagten zu mir: »Geh weiter, geh weiter!« So zogen wir weiter und kamen zu einem üppigen Garten voll aller Frühlingsblumen. Inmitten des Gartens stand ein riesiger Mann, dessen Kopf im Himmel ich kaum sehen konnte, und um ihn herum waren so viele Kinder, wie ich sie noch nie gesehen hatte. Ich fragte: »Wer ist dieser und wer sind diese?« Sie sagten zu mir: »Geh weiter, geh weiter!« So zogen wir weiter, bis wir zu einem gewaltigen Garten kamen, größer und schöner als alles, was ich je gesehen hatte. Sie sagten zu mir: »Steige empor!« Wir stiegen empor, bis wir zu einer Stadt gelangten, die aus Gold- und Silberziegeln erbaut war. Wir kamen an ihr Tor und baten um Einlass; es wurde uns geöffnet, und wir traten ein. Da empfingen uns Männer, deren eine Körperhälfte von schönster Gestalt war und deren andere Hälfte von hässlichster Gestalt war. Sie sagten zu ihnen: ›Geht und springt in jenen Fluss!‹ Da war ein fließender Fluss quer durch den Garten, dessen Wasser strahlend weiß war. Sie gingen und sprangen hinein, und kehrten dann zu uns zurück, während jene Hässlichkeit von ihnen gewichen war und sie in schönster Gestalt erstrahlten. Sie sagten zu mir: ›Dies ist der Garten Eden ('Adn), und jenes ist deine Wohnstätte.‹ Ich erhob meinen Blick, und da war ein Palast wie eine weiße Wolke! Sie sagten zu mir: ›Jenes ist deine Wohnstätte.‹ Ich sagte zu ihnen: ›Möge Allah euch beide segnen, lasst mich hineingehen!‹ Sie sagten: ›Jetzt noch nicht, doch du wirst ihn betreten.‹ Ich sagte zu ihnen: ›Ich habe in dieser Nacht Wundersames gesehen; was ist das alles, was ich sah?‹ Sie sagten zu mir: ›Wir werden es dir kundtun: Was den ersten Mann betrifft, an den du herantratst und dessen Kopf mit dem Stein zerschmettert wurde, so ist es der Mann, der den Koran lernt und ihn dann verwirft und die vorgeschriebenen Gebete verschläft. Was den Mann betrifft, an den du tratst und dessen Mundwinkel, Nasenloch und Auge bis zum Nacken zerrissen wurden, so ist es der Mann, der morgens aus seinem Haus geht und eine Lüge erzählt, die sich bis an die Horizonte verbreitet. Was die nackten Männer und Frauen in dem ofenähnlichen Bau betrifft, so sind es die Unzüchtigen. Was den Mann betrifft, an den du tratst und der im Fluss schwamm, während man ihm Steine in den Mund stopfte, so ist es der Zinsnehmer (Riba-Verzehrer). Was den hässlichen Mann beim Feuer betrifft, der es anstachelt und darum herumläuft, so ist es Malik, der Wächter der Hölle. Was den riesigen Mann im Garten betrifft, so ist es Abraham (Friede sei auf ihm). Und die Kinder um ihn herum sind jedes Kind, das im Zustand der Fitra gestorben ist.‹ Da sagten einige Muslime: »O Gesandter Allahs, und die Kinder der Götzendiener?« Der Gesandte Allahs (Friede sei auf ihm) sagte: »Auch die Kinder der Götzendiener! Und was die Leute betrifft, die zur Hälfte schön und zur Hälfte hässlich waren, so waren es Leute, die eine rechtschaffene Tat mit einer schlechten vermischt hatten; Allah hat ihnen vergeben.«",

  // 8: 7048
  "'Ali ibn 'Abdillah überlieferte uns: Bischr ibn as-Sari überlieferte uns: Nafi' ibn 'Umar überlieferte uns, von Ibn Abi Mulaika, der sagte: Asma' berichtete vom Propheten (Friede sei auf ihm), der sagte: »Ich werde an meinem Wasserbecken (Haud) sein und darauf warten, wer zu mir kommt. Da werden Leute vor mir weggeführt werden, und ich werde rufen: ›Meine Gemeinschaft!‹ Doch es wird gesagt werden: ›Du weißt nicht; sie wandten sich auf ihren Fersen um.‹« Ibn Abi Mulaika sagte: »O Allah, wir suchen Zuflucht bei Dir davor, auf unseren Fersen umzukehren oder der Versuchung (Fitna) anheimzufallen.«",

  // 9: 7049
  "Musa ibn Isma'il überlieferte uns: Abu 'Awana überlieferte uns, von Mughira, von Abu Wa'il, der sagte: 'Abdullah sagte: Der Prophet (Friede sei auf ihm) sagte: »Ich werde euer Vorreiter am Wasserbecken sein. Es werden gewiss Männer von euch zu mir herangeführt werden, doch wenn ich mich hinunterbeuge, um ihnen Wasser zu reichen, werden sie vor mir weggerissen. Da werde ich sagen: ›O mein Herr, meine Gefährten!‹ Doch Er wird sagen: ›Du weißt nicht, was sie nach dir neu eingeführt haben.‹«",

  // 10: 7050
  "Yahya ibn Bukair überlieferte uns: Ya'qub ibn 'Abd ar-Rahman überlieferte uns, von Abu Hazim, der sagte: Ich hörte Sahl ibn Sa'd sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Ich bin euer Vorreiter am Wasserbecken. Wer daran herantritt, trinkt daraus; und wer daraus trinkt, wird danach niemals mehr durstig sein. Gewiss werden Gruppen von Menschen zu mir herantreten, die ich kenne und die mich kennen, doch dann wird eine Trennung zwischen mir und ihnen errichtet.«",

  // 11: 7051
  "Abu Hazim sagte: An-Nu'man ibn Abi 'Ayyasch hörte mich, als ich ihnen dies berichtete, und fragte: »Hast du Sahl dies so sagen hören?« Ich antwortete: »Ja.« Da sagte er: »Und ich bezeuge von Abu Sa'id al-Chudri, dass ich ihn hörte, wie er dem noch hinzufügte: Er sagte: ›Sie gehören doch zu mir! Da wird gesagt: Du weißt nicht, was sie nach dir abgeändert haben! Da werde ich sagen: Hinweg, hinweg mit jedem, der nach mir etwas abgeändert hat!‹«",

  // 12: 7052
  "Musaddad überlieferte uns: Yahya ibn Sa'id überlieferte uns: al-A'masch überlieferte uns: Zaid ibn Wahb überlieferte uns: Ich hörte 'Abdullah sagen: Der Gesandte Allahs (Friede sei auf ihm) sagte zu uns: »Gewiss werdet ihr nach mir Selbstsucht (Bevorzugung anderer auf eure Kosten) und Dinge sehen, die ihr missbilligt.« Sie fragten: »Was befiehlst du uns, o Gesandter Allahs?« Er sagte: »Gebt ihnen ihr Recht, und bittet Allah um euer Recht.«",

  // 13: 7053
  "Musaddad überlieferte uns, von 'Abd al-Warith, von al-Dschad, von Abu Radscha', von Ibn 'Abbas, vom Propheten (Friede sei auf ihm), der sagte: »Wer an seinem Herrscher etwas sieht, das er verabscheut, der soll geduldig sein; denn wer sich auch nur um eine Spanne von der Autorität entfernt und stirbt, der stirbt einen Tod der Dschahiliyya (vorislamischen Unwissenheit).«",

  // 14: 7054
  "Abu n-Nu'man überlieferte uns: Hammad ibn Zaid überlieferte uns, von al-Dschad Abu 'Uthman: Abu Radscha' al-'Utaridi berichtete mir, er sagte: Ich hörte Ibn 'Abbas (möge Allah mit beiden zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: »Wer an seinem Herrscher etwas sieht, das er verabscheut, der soll geduldig mit ihm sein; denn wer sich auch nur um eine Spanne von der Gemeinschaft trennt und dann stirbt, der stirbt gewiss einen Tod der Dschahiliyya.«",

  // 15: 7055, 7056
  "Isma'il überlieferte uns: Ibn Wahb berichtete mir, von 'Amr, von Bukair, von Busr ibn Sa'id, von Dschunada ibn Abi Umayya, der sagte: Wir traten bei 'Ubada ibn as-Samit ein, als er krank war, und sagten: »Möge Allah dein Wohlergehen mehren! Berichte uns einen Hadith, durch den Allah dir Nutzen bringt und den du vom Propheten (Friede sei auf ihm) gehört hast.« Er sagte: Der Prophet (Friede sei auf ihm) rief uns, und wir leisteten ihm den Treueid. Und zu dem, was er uns zur Pflicht machte, gehörte, dass wir ihm den Treueid leisteten auf das Hören und Gehorchen, sei es in dem, was uns lieb ist, oder in dem, was uns zuwider ist, in Not und in Erleichterung, und selbst wenn andere uns vorgezogen werden, und dass wir die Herrschaft denjenigen nicht streitig machen, die sie innehaben, »es sei denn, ihr seht einen offenkundigen Unglauben (Kufr), für den ihr von Allah einen klaren Beweis habt«.",

  // 16: 7057
  "Muhammad ibn 'Ar'ara überlieferte uns: Schu'ba überlieferte uns, von Qatada, von Anas ibn Malik, von Usaid ibn Hudair, dass ein Mann zum Propheten (Friede sei auf ihm) kam und sagte: »O Gesandter Allahs, du hast jenen eingesetzt, mich aber nicht eingesetzt!« Er sagte: »Gewiss werdet ihr nach mir Selbstsucht erleben, so seid geduldig, bis ihr mir begegnet.«",

  // 17: 7058
  "Musa ibn Isma'il überlieferte uns: 'Amr ibn Yahya ibn Sa'id ibn 'Amr ibn Sa'id überlieferte uns, er sagte: Mein Großvater berichtete mir: Ich saß mit Abu Huraira in der Moschee des Propheten (Friede sei auf ihm) in Medina, und Marwan war bei uns. Da sagte Abu Huraira: Ich hörte den Wahrhaftigen, dem Glauben geschenkt wird, sagen: »Der Untergang meiner Gemeinschaft liegt in den Händen von Jünglingen aus den Quraisch.« Da sagte Marwan: »Der Fluch Allahs sei auf ihnen, diesen Jünglingen!« Abu Huraira sagte: »Wenn ich wollte, die Söhne von Soundso und die Söhne von Soundso namentlich zu nennen, so könnte ich es tun.« Mein Großvater und ich zogen später zu den Banu Marwan aus, als sie die Herrschaft in Scham innehatten. Als er sie als junge Burschen sah, sagte er zu uns: »Vielleicht gehören diese zu ihnen?« Wir sagten: »Du weißt es am besten.«",

  // 18: 7059
  "Malik ibn Isma'il überlieferte uns: Ibn 'Uyaina überlieferte uns, dass er az-Zuhri hörte, von 'Urwa, von Zainab bint Abi Salama, von Umm Habiba, von Zainab bint Dschahsch (möge Allah mit ihnen zufrieden sein), die sagte: Der Prophet (Friede sei auf ihm) erwachte aus dem Schlaf mit gerötetem Gesicht und rief: »Es gibt keinen Gott außer Allah! Wehe den Arabern vor einem Unheil, das herannaht! Heute wurde von der Mauer von Gog und Magog eine Öffnung wie diese aufgerissen!« – und Sufyan bildete mit seinen Fingern einen Kreis von neunzig oder hundert. Es wurde gefragt: »Werden wir zugrunde gehen, während unter uns Rechtschaffene weilen?« Er antwortete: »Ja, wenn das Schlechte überhandnimmt.«",

  // 19: 7060
  "Abu Nu'aim überlieferte uns: Ibn 'Uyaina überlieferte uns, von az-Zuhri. Und Mahmud berichtete mir: 'Abd ar-Razzaq berichtete uns: Ma'mar berichtete uns, von az-Zuhri, von 'Urwa, von Usama ibn Zaid (möge Allah mit beiden zufrieden sein), der sagte: Der Prophet (Friede sei auf ihm) blickte von einer der Festungen Medinas herab und fragte: »Seht ihr, was ich sehe?« Sie sagten: »Nein.« Er sagte: »Wahrlich, ich sehe die Heimsuchungen und Wirren (Fitna) zwischen euren Häusern niedergehen wie herabfallende Regentropfen.«",

  // 20: 7061
  "'Ayyasch ibn al-Walid überlieferte uns: 'Abd al-A'la berichtete uns: Ma'mar überlieferte uns, von az-Zuhri, von Sa'id, von Abu Huraira, vom Propheten (Friede sei auf ihm), der sagte: »Die Zeit wird sich verkürzen, das gute Handeln wird abnehmen, Geiz und Habsucht werden in die Herzen geworfen werden, Unruhen (Fitna) werden offenbar werden, und der Hardsch wird zunehmen.« Sie fragten: »O Gesandter Allahs, was ist das?« Er sagte: »Das Töten, das Töten!« Und Schu'aib, Yunus, al-Laith und der Neffe von az-Zuhri überlieferten dies von az-Zuhri, von Humaid, von Abu Huraira, vom Propheten (Friede sei auf ihm).",

  // 21: 7062, 7063
  "'Ubaidullah ibn Musa überlieferte uns, von al-A'masch, von Schaqiq, der sagte: Ich war bei 'Abdullah und Abu Musa, und beide sagten: Der Prophet (Friede sei auf ihm) sagte: »Wahrlich, vor dem Eintreffen der Stunde wird es Tage geben, an denen die Unwissenheit herabkommt, das Wissen emporgehoben wird und der Hardsch zunimmt; und der Hardsch ist das Töten.«",

  // 22: 7064
  "'Umar ibn Hafs überlieferte uns: Mein Vater überlieferte uns: al-A'masch überlieferte uns: Schaqiq überlieferte uns, der sagte: 'Abdullah und Abu Musa saßen beisammen und unterhielten sich. Da sagte Abu Musa: Der Prophet (Friede sei auf ihm) sagte: »Wahrlich, vor dem Eintreffen der Stunde wird es Tage geben, an denen das Wissen weggenommen wird, die Unwissenheit herabkommt und der Hardsch zunimmt; und der Hardsch ist das Töten.«",

  // 23: 7065
  "Qutaiba überlieferte uns: Dscharir überlieferte uns, von al-A'masch, von Abu Wa'il, der sagte: Ich saß mit 'Abdullah und Abu Musa (möge Allah mit beiden zufrieden sein) zusammen, da sagte Abu Musa: Ich hörte den Propheten (Friede sei auf ihm) etwas Ähnliches sagen; und der Hardsch bedeutet in der Sprache der Abessinier das Töten.",

  // 24: 7066
  "Muhammad überlieferte uns: Ghundar überlieferte uns: Schu'ba überlieferte uns, von Wasil, von Abu Wa'il, von 'Abdullah – und ich nehme an, er führte es auf den Propheten zurück –, der sagte: »Vor dem Eintreffen der Stunde wird es Tage des Hardsch geben, an denen das Wissen schwindet und die Unwissenheit offenbar wird.« Abu Musa sagte: Und der Hardsch ist das Töten in der Sprache der Abessinier.",

  // 25: 7067
  "Und Abu 'Awana überlieferte von 'Asim, von Abu Wa'il, von al-Asch'ari, dass er zu 'Abdullah sagte: »Kennst du die Tage, die der Prophet (Friede sei auf ihm) als Tage des Hardsch erwähnte?« und er erwähnte Ähnliches. Ibn Mas'ud sagte: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Zu den schlimmsten Menschen gehören jene, die von der Stunde ereilt werden, während sie noch am Leben sind.«",

  // 26: 7068
  "Muhammad ibn Yusuf überlieferte uns: Sufyan überlieferte uns, von az-Zubair ibn 'Adi, der sagte: Wir kamen zu Anas ibn Malik und klagten ihm über das, was wir unter al-Haddschadsch erleiden mussten. Da sagte er: »Seid geduldig, denn es kommt über euch keine Zeit, ohne dass die darauffolgende noch schlimmer ist als sie, bis ihr eurem Herrn begegnet.« Dies hörte ich von eurem Propheten (Friede sei auf ihm).",

  // 27: 7069
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri. Und Isma'il überlieferte uns: Mein Bruder berichtete mir, von Sulaiman, von Muhammad ibn Abi 'Atiq, von Ibn Schihab, von Hind bint al-Harith al-Firasiyya, dass Umm Salama, die Frau des Propheten (Friede sei auf ihm), sagte: Der Gesandte Allahs (Friede sei auf ihm) erwachte eines Nachts erschrocken und rief: »Gepriesen sei Allah! Was hat Allah an Schätzen herabgesandt, und was ist an Heimsuchungen herabgesandt worden! Wer weckt die Bewohnerinnen der Gemächer – womit er seine Frauen meinte –, damit sie beten? Wie manche Bekleidete im Diesseits wird im Jenseits nackt sein!«",

  // 28: 7070
  "'Abdullah ibn Yusuf überlieferte uns: Malik berichtete uns, von Nafi', von 'Abdullah ibn 'Umar (möge Allah mit beiden zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Wer gegen uns die Waffen erhebt, der gehört nicht zu uns.«",

  // 29: 7071
  "Muhammad ibn al-'Ala' überlieferte uns: Abu Usama überlieferte uns, von Buraid, von Abu Burda, von Abu Musa, vom Propheten (Friede sei auf ihm), der sagte: »Wer gegen uns die Waffen erhebt, der gehört nicht zu uns.«"
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
