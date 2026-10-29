import fs from 'fs';
import path from 'path';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = path.resolve('data/german-batches/hadith-inputs/bukhari-batch-026.json');
const outputPath = path.resolve('data/german-batches/hadith-outputs/bukhari-batch-026.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const items = JSON.parse(raw);

const translations = [
  // 0: 7136
  "Musa ibn Isma'il überlieferte uns: Wuhaib überlieferte uns: Ibn Tawus überlieferte uns, von seinem Vater, von Abu Huraira, vom Propheten (Friede sei auf ihm), der sagte: »Die Mauer von Gog und Magog wird um ein solches Maß geöffnet werden« – und Wuhaib formte eine Neunzig mit seinen Fingern.",

  // 1: 7137
  "'Abdan überlieferte uns: 'Abdullah berichtete uns, von Yunus, von az-Zuhri: Abu Salama ibn 'Abd ar-Rahman berichtete mir, dass er Abu Huraira (möge Allah mit ihm zufrieden sein) sagen hörte, dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Wer mir gehorcht, der hat Allah gehorcht; und wer mir ungehorsam ist, der ist Allah ungehorsam gewesen. Und wer meinem eingesetzten Anführer (Amir) gehorcht, der hat mir gehorcht; und wer meinem eingesetzten Anführer ungehorsam ist, der ist mir ungehorsam gewesen.«",

  // 2: 7138
  "Isma'il überlieferte uns: Malik berichtete mir, von 'Abdullah ibn Dinar, von 'Abdullah ibn 'Umar (möge Allah mit beiden zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Wahrlich, jeder von euch ist ein Hirte, und jeder von euch ist verantwortlich für seine Herde: Der Imam (Herrscher), der über die Menschen gesetzt ist, ist ein Hirte und ist verantwortlich für seine Herde; der Mann ist ein Hirte über die Leute seines Hauses und ist verantwortlich für seine Herde; die Frau ist eine Hirtin über das Haus ihres Mannes und sein Kind und ist verantwortlich für sie; und der Diener eines Mannes ist ein Hirte über das Vermögen seines Herrn und ist verantwortlich dafür. Wahrlich, jeder von euch ist ein Hirte, und jeder von euch ist verantwortlich für seine Herde.«",

  // 3: 7139
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri, der sagte: Muhammad ibn Dschubair ibn Mut'im pflegte zu berichten, dass es Mu'awiya zu Ohren kam, als dieser bei ihm in einer Abordnung der Quraisch war, dass 'Abdullah ibn 'Amr berichtete, dass es einen König aus Qahtan geben werde. Da wurde er zornig, stand auf, lobpreiste Allah, wie Er es verdient, und sagte dann: »Und nun: Wahrlich, mir ist zu Ohren gekommen, dass Männer von euch Hadithe berichten, die weder im Buche Allahs stehen noch vom Gesandten Allahs (Friede sei auf ihm) überliefert sind; jene sind eure Unwissenden. Hütet euch vor Wunschvorstellungen, die ihre Anhänger in die Irre führen! Denn ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: ›Diese Herrschaft liegt bei den Quraisch; niemand wird ihre Feindschaft suchen, ohne dass Allah ihn auf sein Angesicht stürzt, solange sie die Religion aufrechterhalten.‹« Nu'aim überlieferte dies ebenfalls von Ibn al-Mubarak, von Ma'mar, von az-Zuhri, von Muhammad ibn Dschubair.",

  // 4: 7140
  "Ahmad ibn Yunus überlieferte uns: 'Asim ibn Muhammad überlieferte uns: Ich hörte meinen Vater sagen, dass Ibn 'Umar sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Die Herrschaft wird bei den Quraisch bleiben, solange auch nur zwei von ihnen übrig sind.«",

  // 5: 7141
  "Schihab ibn 'Abbad überlieferte uns: Ibrahim ibn Humaid überlieferte uns, von Isma'il, von Qais, von 'Abdullah, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Kein Neid (im edlen Sinne des Wunsches nach Gleichziehen) ist erlaubt außer in zwei Fällen: einem Mann, dem Allah Vermögen gegeben und ihn dazu befähigt hat, es für das Recht auszugeben; und einem anderen, dem Allah Weisheit verliehen hat, nach der er urteilt und die er lehrt.«",

  // 6: 7142
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Schu'ba, von Abu t-Tayyah, von Anas ibn Malik (möge Allah mit ihm zufrieden sein), der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Hört und gehorcht, selbst wenn ein abessinischer Sklave über euch eingesetzt wird, dessen Kopf wie eine Rosine ist.«",

  // 7: 7143
  "Sulaiman ibn Harb überlieferte uns: Hammad überlieferte uns, von al-Dschad, von Abu Radscha', von Ibn 'Abbas, der berichtete, dass der Prophet (Friede sei auf ihm) sagte: »Wer an seinem Herrscher etwas sieht, das er verabscheut, der soll geduldig sein; denn niemand trennt sich auch nur um eine Spanne von der Gemeinschaft und stirbt, ohne dass er einen Tod der Dschahiliyya stirbt.«",

  // 8: 7144
  "Musaddad überlieferte uns: Yahya ibn Sa'id überlieferte uns, von 'Ubaidullah: Nafi' berichtete mir, von 'Abdullah (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: »Das Hören und Gehorchen ist Pflicht für einen muslimischen Menschen in dem, was er liebt und was er verabscheut, solange ihm keine Sünde (Ungehorsam gegen Allah) befohlen wird. Wenn ihm jedoch eine Sünde befohlen wird, so gibt es weder Hören noch Gehorchen.«",

  // 9: 7145
  "'Umar ibn Hafs ibn Ghiyath überlieferte uns: Mein Vater überlieferte uns: al-A'masch überlieferte uns: Sa'd ibn 'Ubaida überlieferte uns, von Abu 'Abd ar-Rahman, von 'Ali (möge Allah mit ihm zufrieden sein), der sagte: Der Prophet (Friede sei auf ihm) entsandte eine Abteilung und setzte einen Mann von den Ansar als ihren Anführer ein und befahl ihnen, ihm zu gehorchen. Da wurde dieser über sie zornig und sagte: »Hat der Prophet (Friede sei auf ihm) euch nicht befohlen, mir zu gehorchen?« Sie sagten: »Doch!« Er sagte: »Ich bestehe darauf, dass ihr Feuerholz sammelt, ein Feuer entfacht und dann hineingeht!« Da sammelten sie Feuerholz und entzündeten es. Als sie im Begriff waren hineinzugehen, blickten sie einander an, und einige von ihnen sagten: »Wir sind dem Propheten (Friede sei auf ihm) doch nur gefolgt, um vor dem Feuer zu fliehen – sollen wir nun hineingehen?« Während sie so dastanden, erlosch das Feuer und sein Zorn legte sich. Dies wurde dem Propheten (Friede sei auf ihm) berichtet, worauf er sagte: »Wären sie hineingegangen, so wären sie niemals mehr herausgekommen. Gehorsam gilt nur im Guten (Rechtmäßigen).«",

  // 10: 7146
  "Haddschadsch ibn Minhal überlieferte uns: Dscharir ibn Hazim überlieferte uns, von al-Hasan, von 'Abd ar-Rahman ibn Samura, der sagte: Der Prophet (Friede sei auf ihm) sagte: »O 'Abd ar-Rahman, strebe nicht nach der Herrschaft (Amtsgewalt); denn wenn sie dir auf dein Bitten hin gegeben wird, wirst du ihr allein überlassen, und wenn sie dir ohne dein Bitten gegeben wird, wirst du darin unterstützt. Und wenn du einen Eid auf etwas schwörst und dann etwas anderes siehst, das besser ist als dies, so leiste Sühne für deinen Eid und tue das, was besser ist.«",

  // 11: 7147
  "Abu Ma'mar überlieferte uns: 'Abd al-Warith überlieferte uns: Yunus überlieferte uns, von al-Hasan, der sagte: 'Abd ar-Rahman ibn Samura berichtete mir, er sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte zu mir: »O 'Abd ar-Rahman ibn Samura, strebe nicht nach der Herrschaft; denn wenn sie dir auf dein Bitten hin gegeben wird, wirst du ihr allein überlassen, und wenn sie dir ohne dein Bitten gegeben wird, wirst du darin unterstützt. Und wenn du einen Eid leistest und dann siehst, dass etwas anderes besser ist als dies, so tue das, was besser ist, und leiste Sühne für deinen Eid.«",

  // 12: 7148
  "Ahmad ibn Yunus überlieferte uns: Ibn Abi Dhi'b überlieferte uns, von Sa'id al-Maqburi, von Abu Huraira, vom Propheten (Friede sei auf ihm), der sagte: »Wahrlich, ihr werdet nach der Herrschaft gieren, und sie wird am Tage der Auferstehung zu Reue führen. Wie vortrefflich ist sie doch als Stillende, und wie elend ist sie als Entwöhnende!« Und Muhammad ibn Baschschar sagte: 'Abdullah ibn Humran überlieferte uns: 'Abd al-Hamid überlieferte uns, von Sa'id al-Maqburi, von 'Umar ibn al-Hakam, von Abu Huraira als dessen Aussage.",

  // 13: 7149
  "Muhammad ibn al-'Ala' überlieferte uns: Abu Usama überlieferte uns, von Buraid, von Abu Burda, von Abu Musa (möge Allah mit ihm zufrieden sein), der sagte: Ich trat beim Propheten (Friede sei auf ihm) ein, begleitet von zwei Männern aus meinem Volk. Da sagte einer der beiden Männer: »Setze uns als Statthalter ein, o Gesandter Allahs!« Und der andere sagte das Gleiche. Da sagte er: »Wahrlich, wir übertragen dieses Amt niemandem, der darum bittet, und auch niemandem, der danach giert.«",

  // 14: 7150
  "Abu Nu'aim überlieferte uns: Abu l-Aschhab überlieferte uns, von al-Hasan, dass 'Ubaidullah ibn Ziyad Ma'qil ibn Yasar während seiner Krankheit besuchte, an der er verstarb. Da sagte Ma'qil zu ihm: »Ich werde dir gewiss einen Hadith berichten, den ich vom Gesandten Allahs (Friede sei auf ihm) hörte; ich hörte den Propheten (Friede sei auf ihm) sagen: ›Es gibt keinen Diener, den Allah mit der Obhut über Untertanen betraut und der sie nicht aufrichtig umsorgt, ohne dass ihm der Duft des Paradieses verwehrt bleibt.‹«",

  // 15: 7151
  "Ishaq ibn Mansur überlieferte uns: Husain al-Dschu'fi berichtete uns, er sagte: Za'ida erwähnte es von Hischam, von al-Hasan, der sagte: Wir kamen zu Ma'qil ibn Yasar, um ihn zu besuchen. Da trat 'Ubaidullah ein, und Ma'qil sagte zu ihm: »Ich berichte dir einen Hadith, den ich vom Gesandten Allahs (Friede sei auf ihm) hörte; er sagte: ›Es gibt keinen Statthalter, der die Aufsicht über Untertanen von den Muslimen führt und dann stirbt, während er sie betrügt, ohne dass Allah ihm das Paradies verwehrt.‹«",

  // 16: 7152
  "Ishaq al-Wasiti überlieferte uns: Chalid überlieferte uns, von al-Dschurairi, von Tarif Abu Tamima, der sagte: Ich war bei Safwan, Dschundab und seinen Gefährten anwesend, während er ihnen Ermahnungen gab. Da fragten sie: »Hast du etwas vom Gesandten Allahs (Friede sei auf ihm) gehört?« Er sagte: Ich hörte ihn sagen: »Wer Ruhmsucht betreibt, dessen Schande wird Allah am Tage der Auferstehung kundtun; und wer es anderen schwer macht, dem wird Allah es am Tage der Auferstehung schwer machen.« Da sagten sie: »Ermahne uns!« Er sagte: »Wahrlich, das Erste, was am Menschen fault, ist sein Bauch; wer also vermag, nichts außer Gutem zu verzehren, der soll es tun. Und wer vermag, dass nichts zwischen ihn und das Paradies tritt außer einer Handvoll Blutes, das er vergossen hat, der soll es tun.« Ich fragte Abu 'Abdillah: Wer sagt: »Ich hörte den Gesandten Allahs (Friede sei auf ihm)« – ist es Dschundab? Er sagte: »Ja, Dschundab.«",

  // 17: 7153
  "'Uthman ibn Abi Schaiba überlieferte uns: Dscharir überlieferte uns, von Mansur, von Salim ibn Abi l-Dscha'd, der sagte: Anas ibn Malik (möge Allah mit ihm zufrieden sein) berichtete uns: Während der Prophet (Friede sei auf ihm) und ich aus der Moschee heraustraten, traf uns ein Mann am Eingangstor der Moschee und fragte: »O Gesandter Allahs, wann ist die Stunde?« Der Prophet (Friede sei auf ihm) fragte: »Was hast du für sie vorbereitet?« Da wirkte der Mann beschämt und sagte dann: »O Gesandter Allahs, ich habe für sie weder viel an Fasten noch an Gebet noch an Almosen vorbereitet, doch liebe ich Allah und Seinen Gesandten.« Da sagte er: »Du wirst mit dem sein, den du liebst.«",

  // 18: 7154
  "Ishaq überlieferte uns: 'Abd as-Samad berichtete uns: Schu'ba überlieferte uns: Thabit al-Bunani überlieferte uns, von Anas ibn Malik, wie er zu einer Frau aus seiner Familie sagte: »Kennst du Soundso?« Sie sagte: »Ja.« Er sagte: Der Prophet (Friede sei auf ihm) kam an ihr vorbei, während sie an einem Grab weinte, und sagte: »Fürchte Allah und sei geduldig!« Da sagte sie: »Geh weg von mir! Dich hat mein Unglück nicht getroffen.« Er ging weiter und zog seines Weges. Da ging ein Mann an ihr vorbei und fragte: »Was hat der Gesandte Allahs (Friede sei auf ihm) zu dir gesagt?« Sie sagte: »Ich habe ihn nicht erkannt.« Er sagte: »Das war wahrhaftig der Gesandte Allahs (Friede sei auf ihm)!« Da ging sie zu seiner Tür und fand keinen Pförtner daran vor. Sie sagte: »O Gesandter Allahs, bei Allah, ich habe dich nicht erkannt!« Da sagte der Prophet (Friede sei auf ihm): »Die wahre Geduld zeigt sich beim ersten Schock.«",

  // 19: 7155
  "Muhammad ibn Chalid adh-Dhuhli überlieferte uns: al-Ansari Muhammad ibn 'Abdillah überlieferte uns, er sagte: Mein Vater berichtete mir, von Thumama, von Anas ibn Malik, der sagte: Qais ibn Sa'd pflegte vor dem Propheten (Friede sei auf ihm) zu stehen wie der Befehlshaber der Wache vor dem Herrscher.",

  // 20: 7156
  "Musaddad überlieferte uns: Yahya überlieferte uns, von Qurra: Humaid ibn Hilal berichtete mir: Abu Burda überlieferte uns, von Abu Musa, dass der Prophet (Friede sei auf ihm) ihn entsandte und ihm Mu'adh nachfolgen ließ.",

  // 21: 7157
  "'Abdullah ibn as-Sabbah berichtete mir: Mahbub ibn al-Hasan überlieferte uns: Chalid überlieferte uns, von Humaid ibn Hilal, von Abu Burda, von Abu Musa: Ein Mann nahm den Islam an und wurde dann Jude. Da kam Mu'adh ibn Dschabal hinzu, während dieser bei Abu Musa war, und fragte: »Was ist mit diesem?« Er antwortete: »Er nahm den Islam an und wurde dann Jude.« Da sagte Mu'adh: »Ich werde mich nicht hinsetzen, ehe ich ihn getötet habe; dies ist das Urteil Allahs und Seines Gesandten (Friede sei auf ihm).«",

  // 22: 7158
  "Adam überlieferte uns: Schu'ba überlieferte uns: 'Abd al-Malik ibn 'Umair überlieferte uns: Ich hörte 'Abd ar-Rahman ibn Abi Bakra sagen: Abu Bakra schrieb an seinen Sohn, der in Sidschistan war: »Urteile nicht zwischen zweien, während du zornig bist; denn ich hörte den Propheten (Friede sei auf ihm) sagen: ›Kein Richter soll zwischen zweien urteilen, während er zornig ist.‹«",

  // 23: 7159
  "Muhammad ibn Muqatil überlieferte uns: 'Abdullah berichtete uns: Isma'il ibn Abi Chalid berichtete uns, von Qais ibn Abi Hazim, von Abu Mas'ud al-Ansari, der sagte: Ein Mann kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: »O Gesandter Allahs, bei Allah, ich bleibe dem Morgengebet nur deshalb fern, weil Soundso es mit uns so sehr in die Länge zieht!« Er sagte: Ich sah den Propheten (Friede sei auf ihm) bei einer Ermahnung niemals heftiger zürnen als an jenem Tag. Dann sagte er: »O ihr Menschen, unter euch gibt es welche, die die Leute vergraulen! Wer von euch die Menschen im Gebet anführt, der soll es kurz fassen; denn unter ihnen sind die Alten, die Schwachen und jene mit dringenden Bedürfnissen.«",

  // 24: 7160
  "Muhammad ibn Abi Ya'qub al-Kirmani überlieferte uns: Hassan ibn Ibrahim überlieferte uns: Yunus überlieferte uns: Muhammad sagte: Salim berichtete mir, dass 'Abdullah ibn 'Umar ihm berichtete, dass er seine Frau verstieß, während sie ihre Monatsblutung hatte. Da erwähnte 'Umar dies dem Propheten (Friede sei auf ihm), worüber der Gesandte Allahs (Friede sei auf ihm) zornig wurde. Dann sagte er: »Er soll sie zurücknehmen und bei sich behalten, bis sie rein wird, dann ihre Monatsblutung bekommt und wieder rein wird. Wenn es ihm danach gefällt, sie zu verstoßen, so mag er sie verstoßen.«",

  // 25: 7161
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri: 'Urwa berichtete mir, dass 'A'ischa (möge Allah mit ihr zufrieden sein) sagte: Hind bint 'Utba ibn Rabi'a kam und sagte: »O Gesandter Allahs, bei Allah, es gab auf der Oberfläche der Erde keine Zeltbewohner, deren Erniedrigung mir lieber gewesen wäre als die deiner Zeltbewohner; und heute gibt es auf der Oberfläche der Erde keine Zeltbewohner, deren Ehrung mir lieber wäre als die deiner Zeltbewohner.« Dann sagte sie: »Abu Sufyan ist ein sparsamer Mann; träfe mich eine Sünde, wenn ich unsere Angehörigen von seinem Besitz speise?« Da sagte er zu ihr: »Es trifft dich keine Sünde, wenn du sie nach billigem Ermessen speist.«",

  // 26: 7162
  "Muhammad ibn Baschschar berichtete mir: Ghundar überlieferte uns: Schu'ba überlieferte uns, er sagte: Ich hörte Qatada, von Anas ibn Malik, der sagte: Als der Prophet (Friede sei auf ihm) den Byzantinern schreiben wollte, sagten sie: »Sie lesen keinen Brief, es sei denn, er ist versiegelt.« Da ließ sich der Prophet (Friede sei auf ihm) einen Siegelring aus Silber anfertigen – es ist mir, als sähe ich seinen Glanz –, und seine Gravur lautete: »Muhammad Rasul Allah« (Muhammad, der Gesandte Allahs).",

  // 27: 7163
  "Abu l-Yaman überlieferte uns: Schu'aib berichtete uns, von az-Zuhri: As-Sa'ib ibn Yazid, der Sohn der Schwester von Namir, berichtete mir, dass Huwaitib ibn 'Abd al-'Uzza ihm berichtete, dass 'Abdullah ibn as-Sa'di ihm berichtete, dass er zu 'Umar während dessen Kalifats kam. Da sagte 'Umar zu ihm: »Wurde mir nicht berichtet, dass du Aufgaben der Menschen übernimmst, doch wenn dir der Lohn gegeben wird, du ihn verschmähst?« Ich antwortete: »Doch!« Da fragte 'Umar: »Was bezweckst du damit?« Ich sagte: »Ich besitze Pferde und Diener, und es geht mir gut, und ich möchte, dass mein Dienst als Almosen für die Muslime gilt.« Da sagte 'Umar: »Tu das nicht! Denn ich beabsichtigte einst genau das, was du beabsichtigst. Da pflegte der Gesandte Allahs (Friede sei auf ihm) mir eine Gabe zu geben, und ich sagte: ›Gib sie jemandem, der bedürftiger danach ist als ich.‹ Als er mir einmal Geld gab und ich sagte: ›Gib es jemandem, der bedürftiger ist als ich‹, sagte der Prophet (Friede sei auf ihm): ›Nimm es, mach es zu deinem Vermögen oder spende es als Almosen! Was dir von diesem Vermögen zukommt, ohne dass du danach verlangst oder darum bittest, das nimm an; und was dir nicht zukommt, dem jage nicht mit deiner Seele nach!‹«",

  // 28: 7164
  "Und von az-Zuhri, der sagte: Salim ibn 'Abdillah berichtete mir, dass 'Abdullah ibn 'Umar sagte: Ich hörte 'Umar sagen: Der Prophet (Friede sei auf ihm) pflegte mir eine Zuwendung zu geben, worauf ich sagte: »Gib sie dem, der bedürftiger danach ist als ich.« Bis er mir einmal Vermögen gab und ich sagte: »Gib es dem, der bedürftiger danach ist als ich.« Da sagte der Prophet (Friede sei auf ihm): »Nimm es, behalte es oder spende es als Almosen! Was dir von diesem Vermögen zukommt, ohne dass du danach verlangst oder darum bittest, das nimm an; und was nicht, dem jage nicht mit deiner Seele nach.«",

  // 29: 7165
  "'Ali ibn 'Abdillah überlieferte uns: Sufyan überlieferte uns: Az-Zuhri sagte, von Sahl ibn Sa'd, der sagte: Ich war Zeuge der beiden Eheleute, die den gegenseitigen Verfluchungseid (Li'an) leisteten, als ich ein Junge von fünfzehn Jahren war, und sie wurden voneinander getrennt."
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
