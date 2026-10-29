import fs from 'node:fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/bukhari-batch-037.json', 'utf8'));

const translations = [
  // 0: 189a5251-d016-4bbd-97df-3a3f65b2cc44 (7493)
  {
    id: "189a5251-d016-4bbd-97df-3a3f65b2cc44",
    de: "‘Abdullah ibn Muhammad berichtete uns: ‘Abd ar-Razzaq berichtete uns: Ma‘mar teilte uns mit, von Hammam, von Abu Hurairah, vom Propheten (Friede sei auf ihm), der sagte: „Während Ayyub nackt badete, fiel ein Schwarm goldener Heuschrecken auf ihn herab, und er begann, sie mit seinen Händen in sein Gewand zu raffen. Da rief ihn sein Herr an: ‚O Ayyub, habe Ich dich denn nicht reich genug gemacht, sodass du all das, was du siehst, nicht nötig hättest?‘ Er erwiderte: ‚Doch, bei Deiner Erhabenheit, mein Herr! Aber ich kann Deines Segens niemals entbehren.‘“"
  },

  // 1: b2642e0c-c71b-4d23-826b-ba28d566692f (7494)
  {
    id: "b2642e0c-c71b-4d23-826b-ba28d566692f",
    de: "Isma‘il berichtete uns: Malik berichtete mir von Ibn Schihab, von Abu ‘Abdullah al-Agharr, von Abu Hurairah, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Unser segensreicher und erhabener Herr steigt in jeder Nacht in das unterste Himmelsgewölbe herab, wenn das letzte Drittel der Nacht anbricht, und spricht: ‚Wer ruft Mich an, auf dass Ich ihn erhöre? Wer bittet Mich, auf dass Ich ihm gebe? Wer bittet Mich um Vergebung, auf dass Ich ihm vergebe?‘“"
  },

  // 2: 582439c0-b2ab-41a0-9655-8b8e25429a1f (7495, 7496)
  {
    id: "582439c0-b2ab-41a0-9655-8b8e25429a1f",
    de: "Abu l-Yaman berichtete uns: Schu‘ayb teilte uns mit: Abu z-Zinad berichtete uns, dass al-A‘raj ihm berichtete, dass er Abu Hurairah sagen hörte, dass er den Gesandten Allahs (Friede sei auf ihm) sagen hörte: „Wir sind die Letzten, die am Tag der Auferstehung die Ersten sein werden.“ Und mit derselben Überlieferungskette: „Allah sprach: ‚Spende, so spende Ich für dich!‘“"
  },

  // 3: bc6ee30b-f993-42cb-a613-436295e036cc (7497)
  {
    id: "bc6ee30b-f993-42cb-a613-436295e036cc",
    de: "Zuhayr ibn Harb berichtete uns: Ibn Fudayl berichtete uns von ‘Umarah, von Abu Zur‘ah, von Abu Hurairah, der sagte: Gabriel sprach: „Dies ist Chadidschah, sie kommt zu dir mit einem Gefäß voll Speise oder voll Trank. Wenn sie zu dir kommt, so überbringe ihr den Friedensgruß von ihrem Herrn und von mir, und verkünde ihr die frohe Botschaft von einem Haus im Paradies aus Perlen und Schilfrohr, in dem es weder Lärm noch Mühsal gibt.“"
  },

  // 4: 2aa464c7-6687-4bcf-bc75-49b74006c1a8 (7498)
  {
    id: "2aa464c7-6687-4bcf-bc75-49b74006c1a8",
    de: "Mu‘adh ibn Asad berichtete uns: ‘Abdullah teilte uns mit: Ma‘mar teilte uns mit, von Hammam ibn Munabbih, von Abu Hurairah (möge Allah mit ihm zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: „Allah sprach: ‚Ich habe für Meine rechtschaffenen Diener vorbereitet, was kein Auge je gesehen, kein Ohr je gehört und was keinem Menschen je in den Sinn gekommen ist.‘“"
  },

  // 5: 05a029df-bbab-4054-a224-e2fac2a6ccf2 (7499)
  {
    id: "05a029df-bbab-4054-a224-e2fac2a6ccf2",
    de: "Mahmud berichtete uns: ‘Abd ar-Razzaq berichtete uns: Ibn Jurayj teilte uns mit: Sulayman al-Ahwal teilte mir mit, dass Tawus ihm mitteilte, dass er Ibn ‘Abbas sagen hörte: Wenn der Prophet (Friede sei auf ihm) nachts zum Tahajjud-Gebet aufstand, pflegte er zu sprechen: „O Allah, Dir gebührt alles Lob! Du bist das Licht der Himmel und der Erde. Dir gebührt alles Lob! Du bist der Erhalter der Himmel und der Erde. Dir gebührt alles Lob! Du bist der Herr der Himmel und der Erde und dessen, was in ihnen ist. Du bist die Wahrheit, Dein Versprechen ist wahr, Dein Wort ist wahr, und die Begegnung mit Dir ist wahr. Das Paradies ist wahr, das Höllenfeuer ist wahr, die Propheten sind wahr, und die Stunde ist wahr. O Allah, Dir ergebe ich mich, an Dich glaube ich, auf Dich vertraue ich, zu Dir kehre ich reuevoll um, um Deinetwillen streite ich und Dein Urteil erbitte ich. Vergib mir, was ich vorausgeschickt und was ich aufgeschoben habe, was ich im Verborgenen getan und was ich offenkundig getan habe! Du bist mein Gott; es gibt keinen Gott außer Dir.“"
  },

  // 6: d1515a5b-1c38-4fb3-a286-f10b4d40a9f4 (7500)
  {
    id: "d1515a5b-1c38-4fb3-a286-f10b4d40a9f4",
    de: "Hajjaj ibn Minhal berichtete uns: ‘Abdullah ibn ‘Umar an-Numayri berichtete uns: Yunus ibn Yazid al-Ayli berichtete uns, der sagte: Ich hörte az-Zuhri sagen: Ich hörte ‘Urwah ibn az-Zubayr, Sa‘id ibn al-Musayyib, ‘Alqamah ibn Waqqas und ‘Ubaydullah ibn ‘Abdullah vom Bericht über ‘A’ischah, die Gemahlin des Propheten (Friede sei auf ihm), berichten, als die Urheber der Verleumdung über sie sagten, was sie sagten, und Allah sie von dem freisprach, was sie vorbrachten – und jeder von ihnen überlieferte mir einen Teil des Berichts von ‘A’ischah, die sagte: „Aber bei Allah, ich hätte niemals gedacht, dass Allah meinetwegen eine Offenbarung herabsenden würde, die rezitiert wird; denn ich hielt mich selbst in meinem eigenen Ermessen für viel zu gering, als dass Allah meinetwegen eine Angelegenheit sprechen würde, die man rezitiert. Doch ich hegte die Hoffnung, dass der Gesandte Allahs (Friede sei auf ihm) im Schlaf einen Traum sehen würde, in dem Allah mich freispricht.“ Da sandte Allah, der Erhabene, herab: „Diejenigen, die die Verleumdung vorgebracht haben...“ die zehn Verse (Sure 24, Vers 11)."
  },

  // 7: 8ca1c589-eae9-4c43-9d65-18fa8083d408 (7501)
  {
    id: "8ca1c589-eae9-4c43-9d65-18fa8083d408",
    de: "Qutaybah ibn Sa‘id berichtete uns: al-Mughirah ibn ‘Abd ar-Rahman berichtete uns von Abu z-Zinad, von al-A‘raj, von Abu Hurairah, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Allah spricht: ‚Wenn Mein Diener beabsichtigt, eine schlechte Tat zu begehen, so schreibt sie ihm nicht an, bis er sie ausführt. Wenn er sie ausführt, so schreibt sie ihm als eine einzige schlechte Tat an. Und wenn er sie um Meinetwillen unterlässt, so schreibt sie ihm als eine gute Tat an. Und wenn er beabsichtigt, eine gute Tat zu verrichten, sie aber nicht ausführt, so schreibt sie ihm als eine gute Tat an. Führt er sie aber aus, so schreibt sie ihm als das Zehnfache bis zum Siebenhundertfachen an!‘“"
  },

  // 8: b6923672-d2a2-4d72-b08b-c9c48da012df (7502)
  {
    id: "b6923672-d2a2-4d72-b08b-c9c48da012df",
    de: "Isma‘il ibn ‘Abdullah berichtete uns: Sulayman ibn Bilal berichtete mir von Mu‘awiyah ibn Abi Muzarrid, von Sa‘id ibn Yasar, von Abu Hurairah (möge Allah mit ihm zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Allah erschuf die Schöpfung. Als Er damit vollendet war, erhob sich die Verwandtschaftsbande und sprach: ‚Halt! Dies ist der Ort dessen, der bei Dir Zuflucht vor dem Abreißen der Bande sucht.‘ Da sprach Er: ‚Bist du denn nicht zufrieden damit, dass Ich Mich demjenigen zuwende, der dich pflegt, und Mich von demjenigen abwende, der dich abreißt?‘ Sie erwiderte: ‚Doch, gewiss, o mein Herr!‘ Er sprach: ‚So sei es dir gewährt.‘“ Dann sprach Abu Hurairah: „Würdet ihr vielleicht, wenn ihr euch abwendet, auf der Erde Unheil stiften und eure Verwandtschaftsbande zerreißen?“ (Sure 47, Vers 22)."
  },

  // 9: a4f80e73-b8b3-4101-a6fe-aafb92d4401c (7503)
  {
    id: "a4f80e73-b8b3-4101-a6fe-aafb92d4401c",
    de: "Musaddad berichtete uns: Sufyan berichtete uns von Salih, von ‘Ubaydullah, von Zayd ibn Khalid, der sagte: Regen fiel auf den Propheten (Friede sei auf ihm) herab, worauf er sprach: „Allah sprach: ‚Manche Meiner Diener sind an diesem Morgen zu Gläubigen an Mich geworden, und manche zu Ungläubigen an Mich.‘“"
  },

  // 10: 699da686-9acf-4842-bab7-08ebf22b0646 (7504)
  {
    id: "699da686-9acf-4842-bab7-08ebf22b0646",
    de: "Isma‘il berichtete uns: Malik berichtete mir von Abu z-Zinad, von al-A‘raj, von Abu Hurairah (möge Allah mit ihm zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Allah sprach: ‚Wenn Mein Diener die Begegnung mit Mir liebt, so liebe Ich die Begegnung mit ihm; und wenn er die Begegnung mit Mir verabscheut, so verabscheue Ich die Begegnung mit ihm.‘“"
  },

  // 11: e9ab4ebf-f1c8-451e-a2f6-c22bd45015bf (7505)
  {
    id: "e9ab4ebf-f1c8-451e-a2f6-c22bd45015bf",
    de: "Abu l-Yaman berichtete uns: Schu‘ayb teilte uns mit: Abu z-Zinad berichtete uns von al-A‘raj, von Abu Hurairah, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Allah sprach: ‚Ich bin so, wie Mein Diener von Mir denkt.‘“"
  },

  // 12: adced570-8e64-45c3-9cbd-80b236bf7b88 (7506)
  {
    id: "adced570-8e64-45c3-9cbd-80b236bf7b88",
    de: "Isma‘il berichtete uns: Malik berichtete mir von Abu z-Zinad, von al-A‘raj, von Abu Hurairah, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Ein Mann, der niemals etwas Gutes getan hatte, sprach: ‚Wenn ich sterbe, so verbrennt mich und verstreut die eine Hälfte von mir auf dem Festland und die andere Hälfte im Meer! Denn bei Allah, wenn Allah Macht über mich erlangt, wird Er mich mit einer Strafe peinigen, mit der Er niemanden unter den Weltenbewohnern je gepeinigt hat.‘ Da befahl Allah dem Meer, zusammenzutragen, was in ihm war, und Er befahl dem Festland, zusammenzutragen, was auf ihm war. Dann sprach Er zu ihm: ‚Warum hast du das getan?‘ Er antwortete: ‚Aus Furcht vor Dir, und Du weißt es am besten.‘ Da vergab Er ihm.“"
  },

  // 13: e6d2f726-cb3f-4d63-a886-46fd14c92d25 (7507)
  {
    id: "e6d2f726-cb3f-4d63-a886-46fd14c92d25",
    de: "Ahmad ibn Ishaq berichtete uns: ‘Amr ibn ‘Asim berichtete uns: Hammam berichtete uns: Ishaq ibn ‘Abdullah berichtete uns: Ich hörte ‘Abd ar-Rahman ibn Abi ‘Amrah sagen: Ich hörte Abu Hurairah sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: „Ein Diener beging eine Sünde – oder er sagte: tat Unrecht – und sprach: ‚Mein Herr, ich habe gesündigt – oder er sagte: ich habe gefehlt –, so vergib mir!‘ Da sprach sein Herr: ‚Weiß Mein Diener etwa, dass er einen Herrn hat, Der die Sünde vergibt und für sie zur Rechenschaft zieht? Ich habe Meinem Diener vergeben.‘ Dann verharrte er so lange, wie Allah es wollte, und beging erneut eine Sünde – oder tat Unrecht – und sprach: ‚Mein Herr, ich habe eine weitere Sünde begangen – oder habe erneut gefehlt –, so vergib sie mir!‘ Da sprach Er: ‚Weiß Mein Diener etwa, dass er einen Herrn hat, Der die Sünde vergibt und für sie zur Rechenschaft zieht? Ich habe Meinem Diener vergeben.‘ Dann verharrte er so lange, wie Allah es wollte, und beging abermals eine Sünde – oder beging eine Verfehlung – und sprach: ‚Mein Herr, ich habe eine weitere Verfehlung begangen – oder eine weitere Sünde begangen –, so vergib sie mir!‘ Da sprach Er: ‚Weiß Mein Diener etwa, dass er einen Herrn hat, Der die Sünde vergibt und für sie zur Rechenschaft zieht? Ich habe Meinem Diener vergeben‘ – dreimal –, ‚so mag er tun, was er will!‘“"
  },

  // 14: 5926fa00-7a19-4d2c-bb66-9502d5f45f29 (7508)
  {
    id: "5926fa00-7a19-4d2c-bb66-9502d5f45f29",
    de: "‘Abdullah ibn Abi l-Aswad berichtete uns: Mu‘tamir berichtete uns: Ich hörte meinen Vater sagen: Qatadah berichtete uns von ‘Uqbah ibn ‘Abd al-Ghafir, von Abu Sa‘id, vom Propheten (Friede sei auf ihm), dass er von einem Mann unter denjenigen vor euch berichtete. Er erwähnte, dass Allah ihm Vermögen und Kinder geschenkt hatte. Als nun der Tod an ihn herantrat, sprach er zu seinen Söhnen: „Was für ein Vater bin ich euch gewesen?“ Sie erwiderten: „Ein guter Vater.“ Er sprach: „Doch wahrhaftig, euer Vater hat bei Allah keinerlei Gutes vorausgeschickt. Wenn Allah über ihn Macht erlangt, wird Er ihn gewiss peinigen. Wenn ich also sterbe, verbrennt mich, bis ich zu Kohle werde, dann zerreibt mich – oder er sagte: mahlt mich zu Pulver – und wenn ein stürmischer, windiger Tag anbricht, so verstreut mich darin!“ Der Prophet Allahs (Friede sei auf ihm) sagte: „Er nahm ihnen feierliche Eide bei meinem Herrn ab, dies zu tun. Und so taten sie es und verstreuten ihn an einem stürmischen Tag. Da sprach Allah, der Mächtige und Erhabene: ‚Sei!‘, und augenblicklich stand er als aufrechter Mann da. Allah sprach: ‚Mein Diener, was hat dich dazu veranlasst, das zu tun, was du getan hast?‘ Er antwortete: ‚Die Furcht vor Dir – oder: die Ehrfurcht vor Dir.‘ Da ereilte ihn nichts anderes als Seine Barmherzigkeit“ – oder er sagte bei einer anderen Gelegenheit: „Da ereilte ihn nichts anderes als das.“ Ich erzählte dies Abu ‘Uthman, und er sagte: „Ich hörte dies von Salman, außer dass er hinzufügte: ‚Verstreut mich im Meer‘ oder so ähnlich.“ Musa berichtete uns: Mu‘tamir berichtete uns und sagte: „lam yabta’ir“. Khalifah berichtete uns: Mu‘tamir berichtete uns und sagte: „lam yabta’iz“. Qatadah erklärte es mit: „Er hat nichts angespart und vorausgeschickt.“"
  },

  // 15: 1abb3da9-df34-47ba-a679-121f4fde9fd2 (7509)
  {
    id: "1abb3da9-df34-47ba-a679-121f4fde9fd2",
    de: "Yusuf ibn Raschid berichtete uns: Ahmad ibn ‘Abdullah berichtete uns: Abu Bakr ibn ‘Ayyasch berichtete uns von Humayd, der sagte: Ich hörte Anas (möge Allah mit ihm zufrieden sein) sagen: Ich hörte den Propheten (Friede sei auf ihm) sagen: „Wenn der Tag der Auferstehung anbricht, wird mir die Fürsprache gewährt werden. Dann werde ich sagen: ‚O mein Herr, lasse jeden ins Paradies eintreten, in dessen Herzen auch nur das Gewicht eines Senfkorns an Glauben war!‘ Und sie werden eintreten. Danach werde ich sagen: ‚Lasse jeden ins Paradies eintreten, in dessen Herzen auch nur das Allermindeste war!‘“ Da sagte Anas: „Als ob ich jetzt noch auf die Finger des Gesandten Allahs (Friede sei auf ihm) blicken würde.“"
  },

  // 16: 828c02c7-13c4-4f90-8fd7-3bcd0c2ea408 (7510)
  {
    id: "828c02c7-13c4-4f90-8fd7-3bcd0c2ea408",
    de: "Sulayman ibn Harb berichtete uns: Hammad ibn Zayd berichtete uns: Ma‘bad ibn Hilal al-‘Anazi sagte: Einige Leute aus Basra versammelten sich, und wir machten uns auf den Weg zu Anas ibn Malik, wobei wir Thabit mit uns nahmen, damit er ihn für uns nach dem Hadith über die Fürsprache frage. Wir trafen ihn in seinem Schloss an, als er gerade das Vormittagsgebet verrichtet hatte. Wir baten um Erlaubnis, einzutreten, und er gewährte sie uns, während er auf seinem Bett saß. Da sprachen wir zu Thabit: „Frage ihn nach nichts anderem, bevor du ihn nach dem Hadith über die Fürsprache gefragt hast!“ Thabit sagte: „O Abu Hamzah, dies sind deine Brüder aus Basra. Sie sind zu dir gekommen, um dich nach dem Hadith über die Fürsprache zu fragen.“ Da sagte Anas: Muhammad (Friede sei auf ihm) berichtete uns: „Wenn der Tag der Auferstehung anbricht, werden die Menschen in Wogen durcheinanderwogen. Sie werden zu Adam kommen und sagen: ‚Lege bei deinem Herrn Fürsprache für uns ein!‘ Er wird antworten: ‚Dazu bin ich nicht berufen; geht vielmehr zu Ibrahim, denn er ist der innige Freund des Allerbarmers!‘ Sie werden zu Ibrahim gehen, doch er wird erwidern: ‚Dazu bin ich nicht berufen; geht vielmehr zu Musa, denn mit ihm hat Allah unmittelbar gesprochen!‘ Sie werden zu Musa gehen, doch er wird erwidern: ‚Dazu bin ich nicht berufen; geht vielmehr zu ‘Isa, denn er ist ein Geist von Allah und Sein Wort!‘ Sie werden zu ‘Isa gehen, doch er wird erwidern: ‚Dazu bin ich nicht berufen; geht vielmehr zu Muhammad (Friede sei auf ihm)!‘ Dann werden sie zu mir kommen, und ich werde sagen: ‚Ich bin dazu berufen!‘ Ich werde um Erlaubnis bei meinem Herrn bitten, und sie wird mir gewährt werden. Er wird mir Lobpreisungen eingeben, mit denen ich Ihn preisen werde, die mir jetzt noch nicht einfallen. Ich werde Ihn mit jenen Lobpreisungen preisen und mich vor Ihm in Niederwerfung niederwerfen. Da wird gesprochen werden: ‚O Muhammad, erhebe dein Haupt! Sprich, und dir wird Gehör geschenkt; bitte, und dir wird gegeben; lege Fürsprache ein, und deine Fürsprache wird angenommen!‘ Ich werde sagen: ‚O mein Herr, meine Gemeinschaft, meine Gemeinschaft!‘ Es wird gesprochen werden: ‚Geh hin und führe jeden heraus, in dessen Herzen sich auch nur das Gewicht eines Gerstenkorns an Glauben befindet!‘ Ich werde hingehen und dies tun. Dann werde ich zurückkehren, Ihn mit jenen Lobpreisungen preisen und mich vor Ihm in Niederwerfung niederwerfen. Da wird gesprochen werden: ‚O Muhammad, erhebe dein Haupt! Sprich, und dir wird Gehör geschenkt; bitte, und dir wird gegeben; lege Fürsprache ein, und deine Fürsprache wird angenommen!‘ Ich werde sagen: ‚O mein Herr, meine Gemeinschaft, meine Gemeinschaft!‘ Es wird gesprochen werden: ‚Geh hin und führe jeden heraus, in dessen Herzen sich auch nur das Gewicht eines Stäubchens oder eines Senfkorns an Glauben befindet!‘ Ich werde hingehen und dies tun. Dann werde ich zurückkehren, Ihn mit jenen Lobpreisungen preisen und mich vor Ihm in Niederwerfung niederwerfen. Da wird gesprochen werden: ‚O Muhammad, erhebe dein Haupt! Sprich, und dir wird Gehör geschenkt; bitte, und dir wird gegeben; lege Fürsprache ein, und deine Fürsprache wird angenommen!‘ Ich werde sagen: ‚O mein Herr, meine Gemeinschaft, meine Gemeinschaft!‘ Da wird Er sprechen: ‚Geh hin und führe jeden heraus, in dessen Herzen sich auch nur das Allermindeste, das Allermindeste, das Allermindeste an Glauben befindet, das Gewicht eines Senfkorns, und hole ihn aus dem Höllenfeuer heraus!‘ Und so werde ich hingehen und es tun.“ Als wir von Anas weggingen, sagte ich zu einigen unserer Gefährten: „Wenn wir doch nur zu al-Hasan gingen, der sich im Haus von Abu Khalifah aufhält, damit er uns erzählt, was Anas ibn Malik uns berichtet hat!“ Wir begaben uns zu ihm, entboten ihm den Friedensgruß, und er ließ uns eintreten. Da sagten wir: „O Abu Sa‘id, wir kommen von deinem Bruder Anas ibn Malik, und wir haben bezüglich der Fürsprache noch nie einen solchen Bericht gehört, wie er ihn uns erzählte!“ Er sagte: „Erzählt es mir!“ Da trugen wir ihm den Hadith vor. Als wir an jene Stelle gelangten, sprach er: „Weiter!“ Wir sagten: „Er hat uns nicht mehr darüber hinaus berichtet.“ Da sprach er: „Wahrlich, er hat mir diesen Hadith bereits vor zwanzig Jahren in voller Länge überliefert! Doch ich weiß nicht, ob er den Rest vergaß oder ob er es ungern sah, dass ihr euch allzu sorglos darauf verlasst.“ Wir baten: „O Abu Sa‘id, so überliefe ihn uns doch!“ Da lachte er und sprach: „Der Mensch wurde voreilig erschaffen! Ich habe dies nur deshalb erwähnt, weil ich vorhatte, es euch zu berichten.“ Und so überlieferte er ihn uns ganz genau so, wie Anas ihn überliefert hatte, und fuhr dann fort: „Dann werde ich ein viertes Mal zurückkehren, Ihn mit jenen Lobpreisungen preisen und mich vor Ihm in Niederwerfung niederwerfen. Da wird gesprochen werden: ‚O Muhammad, erhebe dein Haupt! Sprich, und dir wird Gehör geschenkt; bitte, und dir wird gegeben; lege Fürsprache ein, und deine Fürsprache wird angenommen!‘ Da werde ich sprechen: ‚O mein Herr, gewähre mir die Erlaubnis für jeden, der gesprochen hat: Es gibt keinen Gott außer Allah!‘ Da wird Er sprechen: ‚Bei Meiner Macht, Meiner Erhabenheit, Meiner Majestät und Meiner Größe! Ich werde gewiss jeden daraus befreien, der gesprochen hat: Es gibt keinen Gott außer Allah!‘“"
  },

  // 17: c1b79c5a-7b95-4c1c-ae86-8bf62d4ddea1 (7511)
  {
    id: "c1b79c5a-7b95-4c1c-ae86-8bf62d4ddea1",
    de: "Muhammad ibn Khalid berichtete uns: ‘Ubaydullah ibn Musa berichtete uns von Isra’il, von Mansur, von Ibrahim, von ‘Abidah, von ‘Abdullah, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Der letzte der Paradiesbewohner, der ins Paradies eintritt, und der letzte der Höllenbewohner, der aus dem Höllenfeuer herauskommt, ist ein Mann, der auf allen vieren kriechend hervorkommt. Sein Herr wird zu ihm sprechen: ‚Tritt ins Paradies ein!‘ Da wird er sagen: ‚O mein Herr, das Paradies ist doch bereits voll!‘ Er wird dies dreimal zu ihm sagen, und jedes Mal wird der Mann wiederholen: ‚Es ist voll!‘ Da wird Er zu ihm sprechen: ‚Dir gebührt das Zehnfache der gesamten Welt!‘“"
  },

  // 18: 9f37d37c-9e5d-4100-b705-03b019d8be76 (7512)
  {
    id: "9f37d37c-9e5d-4100-b705-03b019d8be76",
    de: "‘Ali ibn Hujr teilte uns mit: ‘Isa ibn Yunus teilte uns mit, vom al-A‘masch, von Khaythamah, von ‘Adi ibn Hatim, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Es gibt keinen einzigen unter euch, mit dem sein Herr nicht sprechen wird, ohne dass zwischen Ihm und ihm ein Dolmetscher steht. Er wird nach rechts blicken und nichts erblicken außer dem, was er an Taten vorausgeschickt hat; er wird nach links blicken und nichts erblicken außer dem, was er vorausgeschickt hat; und er wird vor sich blicken und nichts erblicken außer dem Feuer direkt vor seinem Angesicht. So hütet euch vor dem Feuer, und sei es nur mit einer halben Dattel!“ Al-A‘masch sagte: Und ‘Amr ibn Murrah berichtete mir von Khaythamah ein Ähnliches und fügte hinzu: „und sei es mit einem guten Wort!“"
  },

  // 19: 4723c029-6049-4f42-97b3-313dcdbcaf2a (7513)
  {
    id: "4723c029-6049-4f42-97b3-313dcdbcaf2a",
    de: "‘Uthman ibn Abi Schaybah berichtete uns: Jarir berichtete uns von Mansur, von Ibrahim, von ‘Abidah, von ‘Abdullah (möge Allah mit ihm zufrieden sein), der sagte: Ein jüdischer Schriftgelehrter kam und sagte: „Wenn der Tag der Auferstehung anbricht, legt Allah die Himmel auf einen Finger, die Erden auf einen Finger, das Wasser und die feuchte Erde auf einen Finger und alle Geschöpfe auf einen Finger. Dann schüttelt Er sie und spricht: ‚Ich bin der König! Ich bin der König!‘“ Da sah ich den Propheten (Friede sei auf ihm) lachen, bis seine Backenzähne sichtbar wurden, aus Verwunderung über seine Rede und zur Bestätigung dessen. Dann rezitierte der Prophet (Friede sei auf ihm): „Und sie schätzen Allah nicht nach Seinem wahren Wert...“ bis zu Seinen Worten: „...erhaben ist Er über das, was sie Ihm beigesellen!“ (Sure 6, Vers 91)."
  },

  // 20: dbd8312b-867d-4e84-9b58-a0faeb6ce7a9 (7514)
  {
    id: "dbd8312b-867d-4e84-9b58-a0faeb6ce7a9",
    de: "Musaddad berichtete uns: Abu ‘Awanah berichtete uns von Qatadah, von Safwan ibn Muhriz, dass ein Mann Ibn ‘Umar fragte: „Wie hast du den Gesandten Allahs (Friede sei auf ihm) über das vertrauliche Zwiegespräch sprechen hören?“ Er sagte: „Einer von euch wird seinem Herrn so nahe treten, bis Er Seinen Schutzschirm über ihn breitet. Dann spricht Er: ‚Hast du dies und jenes getan?‘ Er antwortet: ‚Ja.‘ Und Er spricht: ‚Hast du dies und jenes getan?‘ Er antwortet: ‚Ja.‘ So lässt Er ihn alles bekennen und spricht dann: ‚Wahrlich, Ich habe es für dich im irdischen Leben verborgen gehalten, und am heutigen Tag vergebe Ich es dir!‘“ Und Adam sagte: Schayban berichtete uns: Qatadah berichtete uns: Safwan berichtete uns von Ibn ‘Umar: Ich hörte den Propheten (Friede sei auf ihm)."
  },

  // 21: 8adbd8d4-5a2f-4f48-8699-d18ce43fbd25 (7515)
  {
    id: "8adbd8d4-5a2f-4f48-8699-d18ce43fbd25",
    de: "Yahya ibn Bukayr berichtete uns: al-Layth berichtete uns: ‘Uqayl berichtete uns von Ibn Schihab: Humayd ibn ‘Abd ar-Rahman berichtete uns von Abu Hurairah, dass der Prophet (Friede sei auf ihm) sagte: „Adam und Musa stritten miteinander. Da sprach Musa: ‚Du bist Adam, der du deine Nachkommen aus dem Paradies vertrieben hast!‘ Adam erwiderte: ‚Du bist Musa, den Allah durch Seine Botschaften und durch Sein unmittelbares Wort auserwählt hat; machst du mir denn Vorwürfe wegen einer Sache, die mir bereits vorbestimmt war, ehe ich überhaupt erschaffen wurde?‘ So behielt Adam im Streitgespräch mit Musa die Oberhand.“"
  },

  // 22: 75e5ebf3-ac57-4dd8-804c-5fde59a9afc4 (7516)
  {
    id: "75e5ebf3-ac57-4dd8-804c-5fde59a9afc4",
    de: "Muslim ibn Ibrahim berichtete uns: Hischam berichtete uns: Qatadah berichtete uns von Anas (möge Allah mit ihm zufrieden sein), der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Die Gläubigen werden am Tag der Auferstehung versammelt werden und sprechen: ‚Würden wir doch nur bei unserem Herrn Fürsprache suchen, damit Er uns von diesem unserem Ort hier erlöst!‘ Da werden sie zu Adam kommen und zu ihm sagen: ‚Du bist Adam, der Vater der Menschheit! Allah erschuf dich mit Seiner eigenen Hand, ließ die Engel sich vor dir niederwerfen und lehrte dich die Namen aller Dinge. So lege bei unserem Herrn Fürsprache für uns ein, damit Er uns erlöst!‘ Er wird ihnen jedoch antworten: ‚Dazu bin ich nicht berufen!‘ Und er wird ihnen seine Verfehlung erwähnen, die er beging.“"
  },

  // 23: 3a20ae42-edfc-4765-9b3c-772efd091185 (7517)
  {
    id: "3a20ae42-edfc-4765-9b3c-772efd091185",
    de: "‘Abd al-‘Aziz ibn ‘Abdullah berichtete uns: Sulayman berichtete mir von Scharik ibn ‘Abdullah, der sagte: Ich hörte Ibn Malik sagen: In der Nacht, als der Gesandte Allahs (Friede sei auf ihm) von der Moschee an der Kaaba auf die Nachtreise mitgenommen wurde – bevor ihm die Offenbarung zuteilwurde, während er in der Heiligen Moschee schlief –, kamen drei Gestalten zu ihm. Der erste sprach: „Welcher von ihnen ist es?“ Der mittlere erwiderte: „Er ist der Beste von ihnen.“ Der letzte sprach: „Nehmt den Besten von ihnen!“ Dies trug sich in jener Nacht zu. Danach sah er sie nicht mehr, bis sie in einer anderen Nacht zu ihm kamen, während sein Herz sie wahrnahm; seine Augen schliefen, doch sein Herz schlief nicht. So verhält es sich mit den Propheten: Ihre Augen schlafen, doch ihre Herzen schlafen nicht. Sie sprachen kein Wort mit ihm, bis sie ihn emportrugen und neben der Quelle Zamzam niederlegten. Dort übernahm Gabriel ihn. Gabriel öffnete seinen Körper vom Beginn des Halses bis zur Brust, bis er seine Brust und seinen Leib freilegte. Er wusch sie eigenhändig mit Zamzam-Wasser, bis er sein Inneres völlig gereinigt hatte. Hierauf wurde ein goldenes Becken herbeigebracht, in dem sich ein goldenes Gefäß befand, angefüllt mit Glauben und Weisheit. Damit füllte er seine Brust und die Halsschlagadern – womit die Halsschlagadern gemeint sind – und verschloss ihn wieder. Dann stieg er mit ihm zum untersten Himmel empor und klopfte an eines seiner Tore. Die Bewohner des Himmels riefen ihm zu: „Wer ist da?“ Er erwiderte: „Gabriel.“ Sie fragten: „Und wer ist bei dir?“ Er erwiderte: „Muhammad.“ Sie fragten: „Ist er denn schon entsandt worden?“ Er sagte: „Ja.“ Da riefen sie: „Herzlich willkommen sei er!“ Und die Himmelsbewohner freuten sich über ihn. Die Bewohner des Himmels wissen nämlich nicht, was Allah auf Erden beabsichtigt, ehe Er es ihnen kundtut. Im untersten Himmel traf er auf Adam. Da sprach Gabriel zu ihm: „Dies ist dein Vater, entbiete ihm den Friedensgruß!“ Er grüßte ihn, und Adam erwiderte den Gruß und sprach: „Willkommen, mein Sohn! Welch ein vortrefflicher Sohn du bist!“ Im untersten Himmel sah er zwei strömende Flüsse. Er fragte: „Was sind diese beiden Flüsse, o Gabriel?“ Er antwortete: „Dies sind die Ursprünge des Nils und des Euphrats.“ Dann zog er weiter durch den Himmel und erblickte einen weiteren Fluss, über dem sich ein Palast aus Perlen und Smaragden erhob. Er strich mit seiner Hand hinein, und siehe, es war reinster Moschus. Er fragte: „Was ist dies, o Gabriel?“ Er erwiderte: „Dies ist al-Kauthar, den dein Herr für dich aufbewahrt hat.“ Dann stieg er mit ihm zum zweiten Himmel auf. Dessen Engel sprachen zu ihm das Gleiche, was die Engel des ersten Himmels gesagt hatten: „Wer ist da?“ Er erwiderte: „Gabriel.“ Sie fragten: „Und wer ist bei dir?“ Er erwiderte: „Muhammad.“ Sie fragten: „Wurde er denn zu ihm gesandt?“ Er sagte: „Ja.“ Da riefen sie: „Herzlich willkommen sei er!“ Dann stieg er mit ihm zum dritten Himmel auf, und sie sprachen dasselbe wie die des ersten und zweiten Himmels. Dann stieg er mit ihm zum vierten Himmel auf, und sie sprachen dasselbe. Dann stieg er mit ihm zum fünften Himmel auf, und sie sprachen dasselbe. Dann stieg er mit ihm zum sechsten Himmel auf, und sie sprachen dasselbe. Dann stieg er mit ihm zum siebten Himmel auf, und sie sprachen dasselbe. In jedem Himmel befanden sich Propheten, deren Namen er nannte. Ich behielt Idris im zweiten Himmel, Harun im vierten, einen weiteren im fünften, dessen Namen ich nicht behielt, Ibrahim im sechsten und Musa im siebten, wegen des Vorzugs, dass Allah unmittelbar zu ihm gesprochen hatte. Musa sprach: „Mein Herr, ich hätte nicht gedacht, dass jemand über mich erhoben werden würde!“ Dann stieg er mit ihm darüber hinaus empor zu einem Ort, den nur Allah kennt, bis er den Lotbaum des äußersten Endes erreichte. Da näherte sich der Allgewaltige, der Herr der Macht, und kam immer näher herab, bis Er auf die Weite von zwei Bogenlängen heran war oder noch näher. Da offenbarte Allah ihm unter dem, was Er offenbarte: fünfzig Gebete für deine Gemeinschaft an jedem Tag und jeder Nacht! Dann stieg er hinab, bis er zu Musa gelangte. Musa hielt ihn an und fragte: „O Muhammad, was hat dein Herr dir auferlegt?“ Er antwortete: „Er hat mir fünfzig Gebete an jedem Tag und jeder Nacht auferlegt.“ Da sagte Musa: „Deine Gemeinschaft wird dies gewiss nicht ertragen können! Kehre zurück und bitte deinen Herrn um Erleichterung für dich und für sie!“ Da wandte sich der Prophet (Friede sei auf ihm) zu Gabriel um, als hole er dessen Rat ein, und Gabriel deutete an: „Ja, wenn du wünschst.“ So führte er ihn erneut hinauf zum Allgewaltigen, und während er an Seinem Ort verweilte, sprach er: „Mein Herr, erleichtere es uns, denn meine Gemeinschaft vermag dies nicht zu tragen!“ Da erließ Er ihm zehn Gebete. Dann kehrte er zu Musa zurück, und Musa hielt ihn erneut an. Musa schickte ihn immer wieder zu seinem Herrn zurück, bis es schließlich fünf Gebete waren. Da hielt Musa ihn bei den fünf Gebeten an und sagte: „O Muhammad, bei Allah, ich habe meine Leute, die Kinder Israels, zu noch weniger als diesem aufgerufen, doch sie waren zu schwach und gaben es auf! Deine Gemeinschaft ist noch schwächer an Leibern, Herzen, Kräften, Sehkraft und Gehör; so kehre zurück zu deinem Herrn und bitte Ihn um Erleichterung für dich!“ Jedes Mal wandte sich der Prophet (Friede sei auf ihm) ratsuchend zu Gabriel um, und Gabriel widersprach nicht. Beim fünften Mal erhob er ihn, und er sprach: „Mein Herr, meine Gemeinschaft ist schwach an ihren Körpern, ihren Herzen, ihrem Gehör und ihren Kräften, so erleichtere es uns!“ Da sprach der Allgewaltige: „O Muhammad!“ Er erwiderte: „Zu Diensten und zu Deinem Wohlgefallen!“ Er sprach: „Mein Urteilsspruch wird nicht abgeändert. So wie Ich es dir in der Urschrift des Buches bestimmt habe: Jede gute Tat wird verzehnfacht. So sind es in der Urschrift des Buches fünfzig, für dich aber fünf!“ Er kehrte zu Musa zurück, der fragte: „Was hast du getan?“ Er antwortete: „Er hat es uns erleichtert und gewährt uns den zehnfachen Lohn für jede gute Tat.“ Musa sagte: „Bei Allah, ich habe die Kinder Israels zu weniger als dem aufgerufen, doch sie gaben es auf. Kehre zu deinem Herrn zurück und bitte Ihn um weitere Erleichterung!“ Der Gesandte Allahs (Friede sei auf ihm) erwiderte: „O Musa, bei Allah, ich schäme mich nunmehr vor meinem Herrn, nachdem ich so oft zu Ihm zurückgekehrt bin.“ Da sprach Musa: „Dann steige im Namen Allahs hinab!“ Er sagte: Und er erwachte, während er sich in der Heiligen Moschee befand."
  },

  // 24: 95bcfac5-1999-4ad1-9e04-e4c8f927fec1 (7518)
  {
    id: "95bcfac5-1999-4ad1-9e04-e4c8f927fec1",
    de: "Yahya ibn Sulayman berichtete uns: Ibn Wahb berichtete mir: Malik berichtete mir von Zayd ibn Aslam, von ‘Ata’ ibn Yasar, von Abu Sa‘id al-Khudri, der sagte: Der Prophet (Friede sei auf ihm) sagte: „Wahrlich, Allah wird zu den Bewohnern des Paradieses sprechen: ‚O Bewohner des Paradieses!‘ Sie werden erwidern: ‚Zu Deinen Diensten, unser Herr, und zu Deinem Wohlgefallen; alles Gute liegt in Deinen Händen!‘ Er wird sprechen: ‚Seid ihr zufrieden?‘ Sie werden antworten: ‚Warum sollten wir nicht zufrieden sein, unser Herr, wo Du uns doch gegeben hast, was Du keinem anderen aus Deiner Schöpfung gegeben hast?‘ Er wird sprechen: ‚Soll Ich euch nicht etwas noch Besseres als dies geben?‘ Sie werden sagen: ‚O unser Herr, und was könnte besser sein als dies?‘ Er wird sprechen: ‚Ich lasse Mein Wohlgefallen auf euch herab, sodass Ich danach niemals mehr mit euch unzufrieden sein werde!‘“"
  },

  // 25: 17595389-771f-4ba1-8d23-b1005929cc62 (7519)
  {
    id: "17595389-771f-4ba1-8d23-b1005929cc62",
    de: "Muhammad ibn Sinan berichtete uns: Fulayh berichtete uns: Hilal berichtete uns von ‘Ata’ ibn Yasar, von Abu Hurairah, dass der Prophet (Friede sei auf ihm) eines Tages sprach, während ein Beduine bei ihm saß: „Ein Mann unter den Bewohnern des Paradieses bat seinen Herrn um Erlaubnis, säen und anbauen zu dürfen. Da sprach Er zu ihm: ‚Bist du denn nicht in all dem, was du dir wünschst?‘ Er antwortete: ‚Doch, gewiss, aber ich liebe es nun einmal, zu säen und anzubauen.‘ So eilte er hin und säte aus; und im Nu, im Bruchteil eines Wimpernschlags, wuchs die Saat empor, stand in voller Reife, wurde geerntet und türmte sich zu Bergen auf! Da sprach Allah, der Erhabene: ‚Hier hast du es, o Sohn Adams! Nichts vermag dich je satt zu machen.‘“ Da sagte der Beduine: „Bei Allah, o Gesandter Allahs, so einen findest du gewiss nur unter den Quraisch oder den Ansar, denn sie sind Leute des Ackerbaus; wir aber sind keine Ackerbauern!“ Da lachte der Gesandte Allahs (Friede sei auf ihm)."
  },

  // 26: 35065c77-d9f8-432c-9f7e-215e14a3881a (7520)
  {
    id: "35065c77-d9f8-432c-9f7e-215e14a3881a",
    de: "Qutaybah ibn Sa‘id berichtete uns: Jarir berichtete uns von Mansur, von Abu Wa’il, von ‘Amr ibn Schurahbil, von ‘Abdullah, der sagte: Ich befragte den Propheten (Friede sei auf ihm): „Welche Sünde ist bei Allah die schwerste?“ Er erwiderte: „Dass du Allah einen ebenbürtigen Partner beigesellst, wo Er dich doch erschaffen hat.“ Ich sagte: „Das ist wahrlich gewaltig!“ Ich fragte weiter: „Welche danach?“ Er antwortete: „Dass du dein Kind aus Furcht davor tötest, dass es mit dir mitessen könnte.“ Ich fragte weiter: „Welche danach?“ Er antwortete: „Dass du mit der Ehefrau deines Nachbarn Ehebruch treibst.“"
  },

  // 27: 15f6848a-2742-4145-a28a-f9c4e3bd9a23 (7521)
  {
    id: "15f6848a-2742-4145-a28a-f9c4e3bd9a23",
    de: "Al-Humaydi berichtete uns: Sufyan berichtete uns: Mansur berichtete uns von Mujahid, von Abu Ma‘mar, von ‘Abdullah (möge Allah mit ihm zufrieden sein), der sagte: Zwei Männer vom Stamm Thaqif und ein Quraischit – oder zwei Quraischiten und ein Mann von Thaqif –, deren Bäuche viel Fett und deren Herzen wenig Verstand besaßen, kamen bei der Kaaba zusammen. Da sagte einer von ihnen: „Meint ihr wohl, dass Allah hört, was wir sprechen?“ Ein anderer erwiderte: „Er hört uns, wenn wir laut sprechen, doch Er hört uns nicht, wenn wir leise sprechen.“ Und der andere sagte: „Wenn Er hört, sobald wir laut sprechen, dann hört Er auch, sobald wir leise sprechen!“ Da sandte Allah, der Erhabene, herab: „Und ihr pflegtet euch nicht so zu verbergen, dass nicht euer Gehör, euer Augenlicht und eure Häute gegen euch Zeugnis ablegen könnten...“ (Sure 41, Vers 22)."
  },

  // 28: 83841693-5175-47da-a227-b793393b05f7 (7522)
  {
    id: "83841693-5175-47da-a227-b793393b05f7",
    de: "‘Ali ibn ‘Abdullah berichtete uns: Hatim ibn Wardan berichtete uns: Ayyub berichtete uns von ‘Ikrimah, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein), der sagte: „Wie könnt ihr die Leute der Schrift über ihre Schriften befragen, wo ihr doch das Buch Allahs bei euch habt, welches das jüngste aller Bücher von Allah ist? Ihr lest es in unverfälschter Reinheit, ohne jede Beimischung!“"
  },

  // 29: 916017d7-3cdb-4924-b43d-fc61d734a8aa (7523)
  {
    id: "916017d7-3cdb-4924-b43d-fc61d734a8aa",
    de: "Abu l-Yaman berichtete uns: Schu‘ayb teilte uns mit, von az-Zuhri: ‘Ubaydullah ibn ‘Abdullah teilte mir mit, dass ‘Abdullah ibn ‘Abbas sagte: „O Schar der Muslime! Wie könnt ihr die Leute der Schrift über irgendetwas befragen, wo doch euer Buch, das Allah auf euren Propheten (Friede sei auf ihm) herabsandte, die allerneueste Botschaft von Allah ist, unverfälscht und rein, ohne jede Beimischung? Und Allah hat euch bereits mitgeteilt, dass die Leute der Schrift die Bücher Allahs abgeändert und verfälscht haben, indem sie sie mit ihren eigenen Händen schrieben und sagten: ‚Dies ist von Allah!‘, um damit einen geringen Preis zu erzielen. Hält euch denn nicht das Wissen, das zu euch gekommen ist, davon ab, sie zu befragen? Nein, bei Allah! Wir haben niemals einen einzigen Mann unter ihnen gesehen, der euch nach dem befragt hätte, was auf euch herabgesandt wurde!“"
  }
];

// Validate all
let hasErrors = false;
inputs.forEach((input, index) => {
  const trans = translations[index];
  if (!trans || trans.id !== input.id) {
    console.error(`ID mismatch at index ${index}: expected ${input.id}, got ${trans?.id}`);
    hasErrors = true;
    return;
  }
  const errs = validateGerman(input, trans.de);
  if (errs.length > 0) {
    console.error(`Validation error in item ${index} (${input.id}):`, errs);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error("Validation failed!");
  process.exit(1);
} else {
  console.log("All 30 translations successfully validated!");
  fs.writeFileSync('data/german-batches/hadith-outputs/bukhari-batch-037.json', JSON.stringify(translations, null, 2), 'utf8');
  console.log("Successfully written to data/german-batches/hadith-outputs/bukhari-batch-037.json");
}
