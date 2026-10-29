import fs from 'fs';
import path from 'path';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = path.resolve('data/german-batches/hadith-inputs/bukhari-batch-031.json');
const outputPath = path.resolve('data/german-batches/hadith-outputs/bukhari-batch-031.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const items = JSON.parse(raw);

const translations = [
  // 0: 7301
  "'Umar ibn Hafs überlieferte uns: Mein Vater überlieferte uns: al-A'masch überlieferte uns: Muslim überlieferte uns, von Masruq, der sagte: 'A'ischa (möge Allah mit ihr zufrieden sein) sagte: Der Prophet (Friede sei auf ihm) tat etwas, das er als Erleichterung zuließ, doch hielten sich einige Leute aus übertriebener Frömmigkeit davon fern. Als dies den Propheten (Friede sei auf ihm) erreichte, lobpreiste er Allah und sagte dann: »Was ist mit Leuten, die sich von einer Sache fernhalten, die ich selbst tue? Denn bei Allah, ich kenne Allah besser als sie, und ich fürchte Ihn mehr als sie.«",

  // 1: 7302 (requires digits 49, 2)
  "Muhammad ibn Muqatil überlieferte uns: Waki' berichtete uns, von Nafi' ibn 'Umar, von Ibn Abi Mulaika, der sagte: Beinahe wären die beiden Besten zugrunde gegangen: Abu Bakr und 'Umar! Als die Abordnung der Banu Tamim zum Propheten (Friede sei auf ihm) kam, schlug einer der beiden al-Aqra' ibn Habis al-Hanzali vor, den Bruder der Banu Mudschaschi', während der andere jemand anderen vorschlug. Da sagte Abu Bakr zu 'Umar: »Du wolltest mir doch nur widersprechen!« 'Umar entgegnete: »Ich wollte dir nicht widersprechen!« Da wurden ihre Stimmen vor dem Propheten (Friede sei auf ihm) laut, woraufhin herabgesandt wurde (Sure 49, Vers 2 bis 2): »O die ihr glaubt, erhebt nicht eure Stimmen...« bis zu Seinen Worten: »...ein gewaltiger Lohn.« Ibn Abi Mulaika sagte: Ibn az-Zubair sagte: Danach sprach 'Umar – und er erwähnte dies nicht über seinen Vater, gemeint ist Abu Bakr –, wenn er mit dem Propheten (Friede sei auf ihm) sprach, nur noch wie ein Flüsternder, sodass der Prophet ihn kaum verstehen konnte, bis er nachfragte.",

  // 2: 7303
  "Isma'il überlieferte uns: Malik berichtete mir, von Hischam ibn 'Urwa, von seinem Vater, von 'A'ischa, der Mutter der Gläubigen, dass der Gesandte Allahs (Friede sei auf ihm) während seiner Krankheit sagte: »Befehlt Abu Bakr, dass er mit den Menschen betet!« 'A'ischa sagte: Ich sagte: »Wenn Abu Bakr an deiner Stelle steht, werden die Menschen ihn wegen seines Weinens nicht hören; befiehl daher 'Umar, das Gebet zu leiten.« Da sagte er: »Befehlt Abu Bakr, dass er mit den Menschen betet!« 'A'ischa sagte: Da sagte ich zu Hafsa: »Sag: Wenn Abu Bakr an deiner Stelle steht, werden die Menschen ihn wegen seines Weinens nicht hören, so befiehl 'Umar, mit den Menschen zu beten!« Und Hafsa tat es. Da sagte der Gesandte Allahs (Friede sei auf ihm): »Wahrlich, ihr seid wie die Gefährtinnen Josephs! Befehlt Abu Bakr, dass er für die Menschen betet!« Da sagte Hafsa zu 'A'ischa: »Niemals habe ich durch dich etwas Gutes erlangt!«",

  // 3: 7304
  "Adam überlieferte uns: Ibn Abi Dhi'b überlieferte uns: az-Zuhri überlieferte uns, von Sahl ibn Sa'd as-Sa'idi, der sagte: 'Uwaimir kam zu 'Asim ibn 'Adi und sagte: »Was meinst du: Wenn ein Mann bei seiner Frau einen anderen Mann vorfindet und ihn tötet, werdet ihr ihn dann dafür töten? Frage für mich, o 'Asim, den Gesandten Allahs (Friede sei auf ihm)!« Da fragte ihn 'Asim, doch der Prophet (Friede sei auf ihm) missbilligte und tadelte solche Fragen. Als 'Asim zurückkehrte und ihm berichtete, dass der Prophet (Friede sei auf ihm) solche Fragen missbilligt hatte, sagte 'Uwaimir: »Bei Allah, ich werde selbst zum Propheten (Friede sei auf ihm) gehen!« So kam er, während Allah der Erhabene nach 'Asims Weggang den Koran herabgesandt hatte. Da sagte er zu ihm: »Wahrlich, Allah hat über euch Koranverse herabgesandt.« Er ließ beide rufen; sie traten vor und leisteten den gegenseitigen Verfluchungseid (Li'an). Dann sagte 'Uwaimir: »Ich hätte über sie gelogen, o Gesandter Allahs, wenn ich sie behielte!« So trennte er sich von ihr, ohne dass der Prophet (Friede sei auf ihm) ihm die Trennung befohlen hatte; und so wurde dies zur festen Sunna bei Eheleuten, die den Verfluchungseid leisten. Und der Prophet (Friede sei auf ihm) sagte: »Beobachtet sie: Bringt sie ein rötliches, kurzes Kind zur Welt, das wie eine Echse aussieht, so halte ich ihn gewiss für einen Lügner; bringt sie jedoch ein dunkelhäutiges, großäugiges Kind mit kräftigen Pobacken zur Welt, so glaube ich, dass er die Wahrheit über sie gesagt hat.« Da brachte sie ein Kind mit den missliebigen Merkmalen zur Welt.",

  // 4: 7305 (requires digits 59, 6)
  "'Abdullah ibn Yusuf überlieferte uns: al-Laith überlieferte uns: 'Uqail berichtete mir, von Ibn Schihab, der sagte: Malik ibn Aws an-Nasri berichtete mir. Und Muhammad ibn Dschubair ibn Mut'im hatte mir einiges davon erwähnt, so ging ich zu Malik und befragte ihn. Er sagte: Ich ging hin, um bei 'Umar einzutreten. Da kam sein Türhüter Yarfa' zu ihm und fragte: »Möchtest du 'Uthman, 'Abd ar-Rahman, az-Zubair und Sa'd einlassen? Sie bitten um Einlass.« Er sagte: »Ja.« Da traten sie ein, grüßten und setzten sich. Dann fragte er: »Möchtest du 'Ali und 'Abbas einlassen?« Da erlaubte er beiden den Einlass. Da sagte al-'Abbas: »O Befehlshaber der Gläubigen, urteile zwischen mir und diesem Ungerechten!« – sie stritten miteinander. Da sagte die Gruppe – 'Uthman und seine Gefährten –: »O Befehlshaber der Gläubigen, urteile zwischen ihnen und erlöse den einen vom anderen!« Da sagte 'Umar: »Haltet ein! Ich beschwöre euch bei Allah, mit Dessen Erlaubnis Himmel und Erde bestehen: Wisst ihr, dass der Gesandte Allahs (Friede sei auf ihm) sagte: ›Wir hinterlassen kein Erbe; was wir hinterlassen, ist Almosen‹?« – womit er meinte, dass der Gesandte Allahs von sich selbst sprach. Die Gruppe sagte: »Er hat dies wahrlich gesagt.« Dann wandte sich 'Umar an 'Ali und 'Abbas und sagte: »Ich beschwöre euch beide bei Allah: Wisst ihr, dass der Gesandte Allahs (Friede sei auf ihm) dies gesagt hat?« Sie sagten: »Ja.« 'Umar sagte: »Ich will euch über diese Angelegenheit berichten: Wahrlich, Allah hat Seinem Gesandten (Friede sei auf ihm) von diesem Beutegut (Fai') eine Sonderstellung eingeräumt, die Er sonst niemandem gab; denn Allah sagt (Sure 59, Vers 6 bis 6): ›Was Allah Seinem Gesandten von ihnen als Beute gegeben hat, dazu habt ihr weder Pferde noch Kamele angetrieben...‹ bis zum Ende des Verses. Dies stand ausschließlich dem Gesandten Allahs (Friede sei auf ihm) zu. Doch bei Allah, er behielt es nicht vor euch zurück und bevorzugte sich nicht vor euch damit; er gab es euch vielmehr und verteilte es unter euch, bis nur noch dieses Vermögen übrig blieb. Von diesem Vermögen pflegte der Gesandte Allahs (Friede sei auf ihm) den Jahresunterhalt seiner Familie zu bestreiten, und was übrig blieb, gab er in die Schatzkammer für das Wohl der Muslime. So verfuhr der Gesandte Allahs (Friede sei auf ihm) sein ganzes Leben lang. Ich beschwöre euch bei Allah: Wisst ihr dies?« Sie sagten: »Ja.« Dann sagte er zu 'Ali und 'Abbas: »Ich beschwöre euch beide bei Allah: Wisst ihr dies?« Beide sagten: »Ja.« Er fuhr fort: »Dann nahm Allah Seinen Propheten zu Sich. Da sagte Abu Bakr: ›Ich bin der Nachfolger des Gesandten Allahs‹, nahm es in Besitz und verwaltete es so, wie der Gesandte Allahs (Friede sei auf ihm) es verwaltet hatte – während ihr beide damals meintet, Abu Bakr habe dies und jenes getan, während Allah weiß, dass er wahrhaftig, rechtschaffen, rechtgeleitet und dem Wahren folgend war. Dann nahm Allah Abu Bakr zu Sich, und ich sagte: ›Ich bin der Nachfolger des Gesandten Allahs und Abu Bakrs.‹ So übernahm ich es zwei Jahre lang und verwaltete es so, wie der Gesandte Allahs (Friede sei auf ihm) und Abu Bakr es verwaltet hatten. Dann kamt ihr beide zu mir, einig in eurem Anliegen: Du kamst zu mir und verlangtest dein Erbteil von deinem Neffen, und jener kam und verlangte das Erbteil seiner Frau von ihrem Vater. Da sagte ich: ›Wenn ihr wollt, übergebe ich es euch unter der Bedingung, dass ihr euch vor Allah verpflichtet und gelobt, es so zu verwalten, wie der Gesandte Allahs (Friede sei auf ihm) es verwaltete, wie Abu Bakr es verwaltete und wie ich es verwaltet habe, seit ich es übernahm; andernfalls sprecht mich nicht mehr darauf an!‹ Da sagtet ihr: ›Übergib es uns unter dieser Bedingung!‹ So übergab ich es euch darunter. Ich beschwöre euch bei Allah: Habe ich es ihnen unter dieser Bedingung übergeben?« Die Gruppe sagte: »Ja.« Dann wandte er sich an 'Ali und 'Abbas und sagte: »Ich beschwöre euch beide bei Allah: Habe ich es euch darunter übergeben?« Beide sagten: »Ja.« Da sagte 'Umar: »Verlangt ihr nun etwa von mir ein anderes Urteil als dieses? Bei Dem, mit Dessen Erlaubnis Himmel und Erde bestehen, ich werde darin kein anderes Urteil fällen, bis die Stunde eintrifft! Wenn ihr beide außerstande seid, es zu verwalten, so gebt es mir zurück, und ich werde es für euch übernehmen!«",

  // 5: 7306
  "Muhammad ibn Sinan überlieferte uns: Fulaih überlieferte uns: Hilal ibn 'Ali überlieferte uns, von 'Ata' ibn Yasar, von Abu Huraira, dass der Gesandte Allahs (Friede sei auf ihm) sagte: »Jeder aus meiner Gemeinschaft wird ins Paradies eingehen, außer wer sich weigert.« Man fragte: »O Gesandter Allahs, wer weigert sich denn?« Er sagte: »Wer mir gehorcht, geht ins Paradies ein; und wer mir ungehorsam ist, der hat sich gewiss geweigert.«",

  // 6: 7307
  "Sa'id ibn Talid überlieferte uns: Ibn Wahb berichtete mir: 'Abd ar-Rahman ibn Schuraih und ein anderer berichteten mir, von Abu l-Aswad, von 'Urwa, der sagte: 'Abdullah ibn 'Amr kam als Pilger zu uns, und ich hörte ihn sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Wahrlich, Allah entzieht das Wissen nicht, nachdem Er es ihnen gegeben hat, indem Er es plötzlich entreißt; vielmehr entzieht Er es ihnen, indem Er die Gelehrten mitsamt ihrem Wissen abberuft, sodass nur noch unwissende Menschen übrig bleiben. Diese werden um Rechtsgutachten befragt, und sie erteilen Auskünfte nach ihrer eigenen Meinung; so gehen sie selbst in die Irre und führen andere in die Irre.« Da erzählte ich dies 'A'ischa, der Frau des Propheten (Friede sei auf ihm). Später kam 'Abdullah ibn 'Amr erneut zur Pilgerfahrt, da sagte sie: »O Sohn meiner Schwester, gehe zu 'Abdullah und vergewissere dich bei ihm über das, was du mir von ihm berichtet hast.« Da ging ich zu ihm, befragte ihn, und er berichtete es mir genau so, wie er es mir zuvor berichtet hatte. Da ging ich zu 'A'ischa und berichtete es ihr; sie staunte und sagte: »Bei Allah, 'Abdullah ibn 'Amr hat es wahrlich genau behalten!«",

  // 7: 7308
  "'Abdan überlieferte uns: Abu Hamza berichtete uns: Ich hörte al-A'masch sagen: Ich fragte Abu Wa'il: »Hast du Siffin miterlebt?« Er antwortete: »Ja.« Da hörte ich Sahl ibn Hunaif sagen: Und Musa ibn Isma'il überlieferte uns: Abu 'Awana überlieferte uns, von al-A'masch, von Abu Wa'il, der sagte: Sahl ibn Hunaif sagte: »O ihr Menschen, hegt Misstrauen gegen eure eigene Meinung in Bezug auf eure Religion! Ich sah mich am Tage von Abu Dschandal: Hätte ich den Befehl des Gesandten Allahs (Friede sei auf ihm) zurückweisen können, so hätte ich ihn zurückgewiesen. Und niemals legten wir unsere Schwerter auf unsere Schultern für eine Angelegenheit, die uns furchterregend erschien, ohne dass sie uns zu einer Sache führten, die wir als leichter erkannten als diese Angelegenheit.« Abu Wa'il sagte: Ich erlebte Siffin mit, und was für eine schlimme Schlacht war Siffin!",

  // 8: 7309
  "'Ali ibn 'Abdillah überlieferte uns: Sufyan überlieferte uns, er sagte: Ich hörte Ibn al-Munkadir sagen: Ich hörte Dschabir ibn 'Abdillah sagen: Ich erkrankte, und der Gesandte Allahs (Friede sei auf ihm) kam zusammen mit Abu Bakr zu Fuß, um mich zu besuchen. Sie trafen bei mir ein, als ich das Bewusstsein verloren hatte. Da vollzog der Gesandte Allahs (Friede sei auf ihm) die Gebetswaschung (Wudu') und goss etwas von seinem Waschwasser über mich, woraufhin ich wieder zu Bewusstsein kam. Da fragte ich: »O Gesandter Allahs« – und bisweilen sagte Sufyan: Da sagte ich: »O Gesandter Allahs – wie soll ich über mein Vermögen verfügen? Was soll ich mit meinem Vermögen tun?« Er antwortete mir nichts, bis der Erbschaftsvers herabgesandt wurde.",

  // 9: 7310
  "Musaddad überlieferte uns: Abu 'Awana überlieferte uns, von 'Abd ar-Rahman ibn al-Asbahani, von Abu Salih Dhakwan, von Abu Sa'id: Eine Frau kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: »O Gesandter Allahs, die Männer haben deine Worte ganz für sich eingenommen; so bestimme für uns einen eigenen Tag, an dem wir zu dir kommen können, damit du uns von dem lehrst, was Allah dich gelehrt hat.« Da sagte er: »Versammelt euch an dem und dem Tag an dem und dem Ort!« Da versammelten sie sich, und der Gesandte Allahs (Friede sei auf ihm) kam zu ihnen und lehrte sie von dem, was Allah ihn gelehrt hatte. Dann sagte er: »Keine Frau unter euch sendet drei ihrer Kinder vor sich her, ohne dass sie ihr als Schutz vor dem Höllenfeuer dienen.« Da fragte eine Frau von ihnen: »O Gesandter Allahs, und bei zweien?« Sie wiederholte es zweimal; da sagte er: »Auch bei zweien, auch bei zweien, auch bei zweien!«",

  // 10: 7311
  "'Ubaidullah ibn Musa überlieferte uns, von Isma'il, von Qais, von al-Mughira ibn Schu'ba, vom Propheten (Friede sei auf ihm), der sagte: »Eine Schar aus meiner Gemeinschaft wird nicht aufhören, siegreich zu sein, bis der Befehl Allahs zu ihnen kommt, während sie siegreich sind.«",

  // 11: 7312
  "Isma'il überlieferte uns: Ibn Wahb überlieferte uns, von Yunus, von Ibn Schihab: Humaid berichtete mir: Ich hörte Mu'awiya ibn Abi Sufyan eine Ansprache halten, in der er sagte: Ich hörte den Propheten (Friede sei auf ihm) sagen: »Wem Allah Gutes will, dem schenkt Er tiefes Verständnis der Religion. Und ich bin nur ein Verteilender, während Allah gibt. Und die Angelegenheit dieser Gemeinschaft wird fortwährend aufrecht bleiben, bis die Stunde eintrifft oder bis der Befehl Allahs kommt.«",

  // 12: 7313 (requires digits 6, 65)
  "'Ali ibn 'Abdillah überlieferte uns: Sufyan überlieferte uns: 'Amr sagte: Ich hörte Dschabir ibn 'Abdillah (möge Allah mit beiden zufrieden sein) sagen: Als auf den Gesandten Allahs (Friede sei auf ihm) herabgesandt wurde (Sure 6, Vers 65): »Sprich: Er ist der Mächtige, über euch eine Strafe von oben herabzusenden...«, sagte er: »Ich suche Zuflucht bei Deinem Angesicht.« »...oder von unter euren Füßen...«, sagte er: »Ich suche Zuflucht bei Deinem Angesicht.« Als dann herabgesandt wurde: »...oder euch in Parteien zu verwirren und die einen von euch die Gewalt der anderen kosten zu lassen...«, sagte er: »Diese beiden sind leichter – oder erträglicher.«",

  // 13: 7314
  "Asbagh ibn al-Faradsch überlieferte uns: Ibn Wahb berichtete mir, von Yunus, von Ibn Schihab, von Abu Salama ibn 'Abd ar-Rahman, von Abu Huraira: Ein Beduine kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: »Meine Frau hat einen dunkelhäutigen Knaben geboren, und ich leugne seine Vaterschaft.« Da sagte der Gesandte Allahs (Friede sei auf ihm) zu ihm: »Hast du Kamele?« Er sagte: »Ja.« Er fragte: »Welche Farbe haben sie?« Er antwortete: »Rot.« Er fragte: »Gibt es unter ihnen graue?« Er sagte: »Wahrlich, es gibt graue unter ihnen.« Er fragte: »Woher meinst du, dass dies kam?« Er antwortete: »O Gesandter Allahs, eine Erbanlage hat durchgeschlagen.« Da sagte der Prophet: »Und vielleicht hat bei diesem Knaben ebenfalls eine Erbanlage durchgeschlagen!« Und er erlaubte ihm nicht, die Vaterschaft zu leugnen.",

  // 14: 7315
  "Musaddad überlieferte uns: Abu 'Awana überlieferte uns, von Abu Bischr, von Sa'id ibn Dschubair, von Ibn 'Abbas: Eine Frau kam zum Propheten (Friede sei auf ihm) und sagte: »Meine Mutter legte das Gelübde ab, die Pilgerfahrt zu vollziehen, doch sie starb, ehe sie pilgerte; soll ich für sie pilgern?« Er sagte: »Ja, vollziehe die Pilgerfahrt für sie! Was meinst du: Wenn deine Mutter eine Schuld hätte, würdest du sie begleichen?« Sie sagte: »Ja.« Da sagte er: »So begleicht die Schuld, die Allah zusteht, denn Allah hat das meiste Recht auf Erfüllung!«",

  // 15: 7316
  "Schihab ibn 'Abbad überlieferte uns: Ibrahim ibn Humaid überlieferte uns, von Isma'il, von Qais, von 'Abdullah, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: »Kein Neid (im edlen Sinne) ist erlaubt außer in zwei Fällen: einem Mann, dem Allah Vermögen gegeben und ihn dazu ermächtigt hat, es für die Wahrheit auszugeben; und einem anderen, dem Allah Weisheit verliehen hat, sodass er nach ihr urteilt und sie lehrt.«",

  // 16: 7319
  "Ahmad ibn Yunus überlieferte uns: Ibn Abi Dhi'b überlieferte uns, von al-Maqburi, von Abu Huraira (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: »Die Stunde wird nicht eintreffen, bis meine Gemeinschaft die Bräuche der früheren Generationen vor ihr Schritt für Schritt übernimmt, Spanne um Spanne und Elle um Elle.« Da wurde gefragt: »O Gesandter Allahs, wie die Perser und Römer?« Er antwortete: »Wer sonst unter den Menschen als jene?«",

  // 17: 7320
  "Muhammad ibn 'Abd al-'Aziz überlieferte uns: Abu 'Umar as-San'ani – aus dem Jemen – überlieferte uns, von Zaid ibn Aslam, von 'Ata' ibn Yasar, von Abu Sa'id al-Chudri, vom Propheten (Friede sei auf ihm), der sagte: »Ihr werdet gewiss den Bräuchen derjenigen vor euch folgen, Spanne um Spanne und Elle um Elle, selbst wenn sie in das Loch einer Dornschwanz-Echse kriechten, würdet ihr ihnen folgen!« Wir fragten: »O Gesandter Allahs, den Juden und Christen?« Er antwortete: »Wem sonst?«",

  // 18: 7321
  "Al-Humaidi überlieferte uns: Sufyan überlieferte uns: al-A'masch überlieferte uns, von 'Abdullah ibn Murra, von Masruq, von 'Abdullah, der sagte: Der Prophet (Friede sei auf ihm) sagte: »Keine Seele wird ungerechterweise getötet, ohne dass auf dem ersten Sohn Adams ein Teil ihrer Schuld lastet« – und bisweilen sagte Sufyan: »von ihrem Blut« –, »weil er der Erste war, der den Mord einführte.«",

  // 19: 7322
  "Isma'il überlieferte uns: Malik berichtete mir, von Muhammad ibn al-Munkadir, von Dschabir ibn 'Abdillah as-Salami: Ein Beduine leistete dem Gesandten Allahs (Friede sei auf ihm) den Treueid auf den Islam. Da befiel den Beduinen in Medina ein Fieber, und er kam zum Gesandten Allahs (Friede sei auf ihm) und sagte: »O Gesandter Allahs, entbinde mich von meinem Treueid!« Doch der Gesandte Allahs (Friede sei auf ihm) weigerte sich. Dann kam er erneut und sagte: »Entbinde mich von meinem Treueid!« Doch er weigerte sich. Dann kam er ein drittes Mal und bat darum, entbunden zu werden, doch er weigerte sich. Da verließ der Beduine die Stadt. Da sagte der Gesandte Allahs (Friede sei auf ihm): »Wahrlich, Medina ist wie ein Schmelzofen: Es scheidet seine Unreinheiten aus, und sein Gutes erstrahlt rein.«",

  // 20: 7323
  "Musa ibn Isma'il überlieferte uns: 'Abd al-Wahid überlieferte uns: Ma'mar überlieferte uns, von az-Zuhri, von 'Ubaidullah ibn 'Abdillah, der sagte: Ibn 'Abbas (möge Allah mit beiden zufrieden sein) berichtete mir, er sagte: Ich pflegte 'Abd ar-Rahman ibn 'Auf den Koran vorzulesen. Als 'Umar seine letzte Pilgerfahrt vollzog, sagte 'Abd ar-Rahman in Mina: »Hättest du den Befehlshaber der Gläubigen gesehen, als ein Mann zu ihm kam und sagte: ›Soundso sagt: Wenn der Befehlshaber der Gläubigen stirbt, werden wir Soundso den Treueid leisten.‹« Da sagte 'Umar: »Wahrlich, ich werde heute Abend aufstehen und vor jenen Männern warnen, die die Herrschaft an sich reißen wollen!« Ich sagte: »Tu das nicht! Denn die Pilgersaison versammelt das gemeine Volk, und sie werden deine Versammlung überwältigen; und ich fürchte, dass sie deine Worte nicht richtig verstehen und jeder Wichtigtuer sie verdreht und verbreitet. Warte lieber, bis du nach Medina kommst, der Stätte der Auswanderung und der Sunna; dort bist du allein mit den Gefährten des Gesandten Allahs (Friede sei auf ihm) unter den Auswanderern (Muhadschirun) und Helfern (Ansar), und sie werden deine Worte bewahren und sie so verstehen, wie sie gemeint sind.« Da sagte er: »Bei Allah, ich werde diese Rede bei der ersten Gelegenheit halten, bei der ich in Medina vor die Menschen trete!« Ibn 'Abbas sagte: Als wir in Medina eintrafen, sagte 'Umar in seiner Ansprache: »Wahrlich, Allah hat Muhammad (Friede sei auf ihm) mit der Wahrheit gesandt und das Buch auf ihn herabgesandt; und zu dem, was herabgesandt wurde, gehörte der Vers über die Steinigung...«",

  // 21: 7324
  "Sulaiman ibn Harb überlieferte uns: Hammad überlieferte uns, von Ayyub, von Muhammad, der sagte: Wir waren bei Abu Huraira, der zwei mit Färberdistel gefärbte Leinenkleider trug. Da schnaubte er sich die Nase aus und rief: »Ei, ei! Abu Huraira schnaubt sich in Leinen die Nase aus! Ich erinnere mich wohl, wie ich einst zwischen der Kanzel des Gesandten Allahs (Friede sei auf ihm) und der Kammer von 'A'ischa ohnmächtig zu Boden stürzte. Da kam jemand des Weges und stellte seinen Fuß auf meinen Nacken, in dem Glauben, ich sei besessen; doch war ich keineswegs besessen – mich quälte nichts anderes als der Hunger!«",

  // 22: 7325
  "Muhammad ibn Kathir überlieferte uns: Sufyan berichtete uns, von 'Abd ar-Rahman ibn 'Abis, der sagte: Ibn 'Abbas wurde gefragt: »Hast du das Festtagsgebet ('Id) mit dem Propheten (Friede sei auf ihm) miterlebt?« Er antwortete: »Ja, und wäre nicht meine nahe Stellung zu ihm gewesen, hätte ich wegen meiner Jugend nicht daran teilnehmen können.« Er begab sich zu dem Merkzeichen beim Hause von Kathir ibn as-Salt, verrichtete das Gebet und hielt dann die Ansprache, ohne Adhan oder Iqama zu erwähnen. Dann forderte er zum Almosengeben auf; da begannen die Frauen auf ihre Ohren und Hälse zu deuten (um ihren Schmuck zu spenden). Da befahl er Bilal, zu ihnen zu gehen, und Bilal kehrte danach zum Propheten (Friede sei auf ihm) zurück.",

  // 23: 7326
  "Abu Nu'aim überlieferte uns: Sufyan überlieferte uns, von 'Abdullah ibn Dinar, von Ibn 'Umar (möge Allah mit beiden zufrieden sein): Der Prophet (Friede sei auf ihm) pflegte zu Fuß und reitend nach Quba' zu kommen.",

  // 24: 7329
  "Ayyub ibn Sulaiman überlieferte uns: Abu Bakr ibn Abi Uwais überlieferte uns, von Sulaiman ibn Bilal, von Salih ibn Kaisan: Ibn Schihab sagte: Anas ibn Malik berichtete mir, dass der Gesandte Allahs (Friede sei auf ihm) das Nachmittagsgebet ('Asr) zu verrichten pflegte und sich dann zu den Hochland-Siedlungen (al-'Awali) begab, während die Sonne noch hoch am Himmel stand. Und al-Laith fügte von Yunus hinzu: Die Entfernung zu den Hochland-Siedlungen betrug vier oder drei Meilen.",

  // 25: 7330
  "'Amr ibn Zurara überlieferte uns: al-Qasim ibn Malik überlieferte uns, von al-Dschu'aid: Ich hörte as-Sa'ib ibn Yazid sagen: Zu Zeiten des Propheten (Friede sei auf ihm) entsprach der Sa' einem Mudd und einem Drittel nach eurem heutigen Mudd; später wurde er vergrößert. Al-Qasim ibn Malik hörte dies von al-Dschu'aid.",

  // 26: 7331
  "'Abdullah ibn Maslama überlieferte uns, von Malik, von Ishaq ibn 'Abdillah ibn Abi Talha, von Anas ibn Malik: Der Gesandte Allahs (Friede sei auf ihm) sagte: »O Allah, segne ihnen ihr Hohlmaß, und segne ihnen ihren Sa' und ihren Mudd!« – womit er die Bewohner Medinas meinte.",

  // 27: 7332
  "Ibrahim ibn al-Mundhir überlieferte uns: Abu Damra überlieferte uns: Musa ibn 'Uqba überlieferte uns, von Nafi', von Ibn 'Umar: Die Juden brachten einen Mann und eine Frau zum Propheten (Friede sei auf ihm), die Unzucht begangen hatten. Da befahl er ihre Steinigung, und sie wurden nahe dem Ort gesteinigt, an dem die Totenbahren bei der Moschee abgestellt wurden.",

  // 28: 7333
  "Isma'il überlieferte uns: Malik berichtete mir, von 'Amr, dem befreiten Sklaven von al-Muttalib, von Anas ibn Malik (möge Allah mit ihm zufrieden sein): Der Berg Uhud zeigte sich dem Gesandten Allahs (Friede sei auf ihm), da sagte er: »Dies ist ein Berg, der uns liebt und den wir lieben. O Allah, Abraham erklärte Mekka für heilig, und ich erkläre das Gebiet zwischen seinen beiden Lavafeldern für heilig.« Sahl überlieferte dies ebenfalls vom Propheten (Friede sei auf ihm) bezüglich Uhud.",

  // 29: 7334
  "Ibn Abi Maryam überlieferte uns: Abu Ghassan überlieferte uns: Abu Hazim berichtete mir, von Sahl, dass zwischen der Mauer der Moschee auf der Qibla-Seite und der Kanzel der Raum für den Durchgang eines Schafes lag."
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
