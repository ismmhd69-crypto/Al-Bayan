import fs from 'fs';
import { validateGerman } from './validate-german-text.mjs';

const inputPath = 'data/german-batches/hadith-inputs/bukhari-batch-036.json';
const outputPath = 'data/german-batches/hadith-outputs/bukhari-batch-036.json';

const inputs = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const translations = [
  // 0: a9d17942-4815-4538-bb71-07d54658c475
  "‘Abdullah ibn Yusuf berichtete uns: Malik teilte uns mit, von Abu z-Zinad, vom al-A‘raj, von Abu Hurayrah, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Allah verbürgt Sich für denjenigen, der auf Seinem Weg kämpft – und nichts lässt ihn sein Haus verlassen außer dem Kampf auf Seinem Weg und dem Glauben an Seine Worte –, dass Er ihn ins Paradies einlässt oder ihn zu seiner Wohnstätte zurückkehren lässt mitsamt dem Lohn oder der Beute, die er erlangt hat.“",

  // 1: 890c782d-ff30-4d5f-a3c5-1603b95a4d68
  "Musaddad berichtete uns: ‘Abd al-Warith berichtete uns, von ‘Abd al-‘Aziz, von Anas, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Wenn ihr zu Allah bittet, so seid entschlossen im Bittgebet, und keiner von euch soll jemals sagen: ‚Wenn Du willst, so gib mir‘; denn wahrlich, niemand kann Allah zu etwas zwingen.“",

  // 2: 40111681-c1c3-4888-9eb7-a3e0c41df8dc
  "Abu l-Yaman berichtete uns: Schu‘ayb teilte uns mit, vom az-Zuhri. Und Isma‘il berichtete uns: Mein Bruder ‘Abd al-Hamid berichtete mir von Sulayman, von Muhammad ibn Abi ‘Atiq, von Ibn Schihab, von ‘Ali ibn Husayn, dass Husayn ibn ‘Ali (Friede sei auf beiden) ihm berichtete, dass ‘Ali ibn Abi Talib ihm berichtete: Der Gesandte Allahs (Friede sei auf ihm) suchte ihn und Fatimah, die Tochter des Gesandten Allahs (Friede sei auf ihm), eines Nachts auf und sprach zu ihnen: „Wollt ihr denn nicht beten?“ ‘Ali sagte: Da entgegnete ich: „O Gesandter Allahs, unsere Seelen sind doch in der Hand Allahs; wenn Er will, dass Er uns erweckt, erweckt Er uns.“ Da wandte sich der Gesandte Allahs (Friede sei auf ihm) ab, als ich dies sagte, und erwiderte mir nichts. Dann hörte ich ihn, während er wegging, auf seinen Schenkel schlagen und sagen: „...doch der Mensch ist von allen Dingen am streitsüchtigsten“ (Sure 18, Vers 54 bis 54).",

  // 3: 8452c16b-dd10-4211-a60e-4d907caabe37
  "Muhammad ibn Sinan berichtete uns: Fulayh berichtete uns: Hilal ibn ‘Ali berichtete uns von ‘Ata’ ibn Yasar, von Abu Hurayrah (möge Allah mit ihm zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Das Gleichnis des Gläubigen ist wie das eines zarten Getreidehalms: Seine Blätter neigen sich dorthin, von woher der Wind weht und ihn beugt; legt sich der Wind, richtet er sich wieder auf. Ebenso wird der Gläubige durch Heimsuchungen gebeugt. Und das Gleichnis des Ungläubigen ist wie das einer festen Zeder, die starr aufrecht steht, bis Allah sie bricht, wann immer Er will.“",

  // 4: 7cb04a13-17aa-4308-bcbf-3fa06a4e91ce
  "Al-Hakam ibn Nafi‘ berichtete uns: Schu‘ayb teilte uns mit, vom az-Zuhri: Salim ibn ‘Abdullah teilte mir mit, dass ‘Abdullah ibn ‘Umar (möge Allah mit beiden zufrieden sein) sagte: Ich hörte den Gesandten Allahs (Friede sei auf ihm), während er auf der Kanzel stand, sagen: „Euer Verweilen im Vergleich zu den Gemeinschaften vor euch ist nur wie die Zeit zwischen dem ‘Asr-Gebet und dem Sonnenuntergang. Den Leuten der Thora wurde die Thora gegeben, und sie handelten danach bis zur Mitte des Tages; dann wurden sie kraftlos, und ihnen wurde jeweils ein Qirat gegeben. Danach wurde den Leuten des Evangeliums das Evangelium gegeben, und sie handelten danach bis zum ‘Asr-Gebet; dann wurden sie kraftlos, und ihnen wurde jeweils ein Qirat gegeben. Daraufhin wurde euch der Koran gegeben, und ihr handeltet danach bis zum Sonnenuntergang, und euch wurden jeweils zwei Qirat gegeben. Da sprachen die Leute der Thora: ‚Unser Herr, diese haben weniger gearbeitet und einen größeren Lohn erhalten!‘ Er sprach: ‚Habe Ich euch denn um irgendetwas von eurem Lohn geschmälert?‘ Sie antworteten: ‚Nein.‘ Da sprach Er: ‚Das ist Meine Huld; Ich gebe sie, wem Ich will.‘“",

  // 5: e85a356b-bbd4-4458-8563-a219a7d328fb
  "‘Abdullah al-Musnadi berichtete uns: Hischam berichtete uns: Ma‘mar teilte uns mit, vom az-Zuhri, von Abu Idris, von ‘Ubadah ibn as-Samit, der sagte: Ich leistete dem Gesandten Allahs (Friede sei auf ihm) inmitten einer Gruppe von Männern den Treueid, da sprach er: „Ich nehme euren Treueid darauf ab, dass ihr Allah nichts beigesellt, nicht stehlt, keine Unzucht treibt, eure Kinder nicht tötet, keine Verleumdung vorbringt, die ihr willkürlich zwischen euren Händen und Füßen erdichtet, und mir nicht im Rechten ungehorsam seid. Wer von euch dies erfüllt, dessen Lohn liegt bei Allah. Und wer immer etwas davon begeht und dafür im Diesseits bestraft wird, so ist dies eine Sühne und Reinigung für ihn. Und wen Allah verdeckt, dessen Angelegenheit liegt bei Allah: Wenn Er will, straft Er ihn, und wenn Er will, vergibt Er ihm.“",

  // 6: b7ea7c83-7839-4b2a-a374-41143160d9c7
  "Mu‘alla ibn Asad berichtete uns: Wuhayb berichtete uns von Ayyub, von Muhammad, von Abu Hurayrah, dass Salomo, der Prophet Allahs (Friede sei auf ihm), sechzig Frauen hatte. Da sagte er: „Wahrlich, ich werde diese Nacht zu meinen Frauen gehen, sodass jede Frau empfängt und einen Reiter gebiert, der auf dem Weg Allahs kämpft.“ So ging er zu seinen Frauen, doch keine von ihnen gebar, außer einer Frau, die einen halben Knaben gebar. Da sprach der Prophet Allahs (Friede sei auf ihm): „Hätte Salomo die Einschränkung gemacht (indem er ‚wenn Allah will‘ sagte), so hätte jede Frau von ihnen empfangen und einen Reiter geboren, der auf dem Weg Allahs kämpft.“",

  // 7: 355fac72-f94f-4442-86ff-67b705926a88
  "Muhammad berichtete uns: ‘Abd al-Wahhab ath-Thaqafi berichtete uns: Khalid al-Hadhdha’ berichtete uns von ‘Ikrimah, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) zu einem Beduinen trat, um ihn bei Krankheit zu besuchen, und sprach: „Keine Sorge, es ist eine Reinigung, so Allah will.“ Der Beduine sagte: „Eine Reinigung? Keineswegs, vielmehr ist es ein Fieber, das in einem Greis wallt und ihn die Gräber besuchen lässt!“ Da sprach der Prophet (Friede sei auf ihm): „Dann sei es so.“",

  // 8: 79ebd48f-0318-46b3-af1b-a6cbccfa8244
  "Ibn Salam berichtete uns: Huschaym teilte uns mit, von Husayn, von ‘Abdullah ibn Abi Qatadah, von seinem Vater, als sie das Gebet verschliefen. Da sprach der Prophet (Friede sei auf ihm): „Wahrlich, Allah nahm eure Seelen, als Er wollte, und Er gab sie zurück, als Er wollte.“ Sie verrichteten ihre Notdurft und vollzogen die Gebetswaschung, bis die Sonne aufging und hell wurde; dann stand er auf und betete.",

  // 9: 5a201012-4c75-4d69-9b8d-35508cb699b4
  "Yahya ibn Qaza‘ah berichtete uns: Ibrahim berichtete uns vom az-Zuhri, von Abu Salamah und al-A‘raj. Und Isma‘il berichtete uns: Mein Bruder berichtete mir von Sulayman, von Muhammad ibn Abi ‘Atiq, vom az-Zuhri, von Abu Salamah ibn ‘Abd ar-Rahman und Sa‘id ibn al-Musayyab, dass Abu Hurayrah sagte: Ein muslimischer Mann und ein jüdischer Mann beschimpften einander. Da sprach der Muslim in einem Eid, den er schwor: „Bei Dem, Der Muhammad über die Weltenbewohner auserwählt hat!“ Da sprach der Jude: „Bei Dem, Der Moses über die Weltenbewohner auserwählt hat!“ Da erhob der Muslim seine Hand und ohrfeigte den Juden. Der Jude ging zum Gesandten Allahs (Friede sei auf ihm) und berichtete ihm, was zwischen ihm und dem Muslim vorgefallen war. Da sprach der Prophet (Friede sei auf ihm): „Stellt mich nicht über Moses! Denn die Menschen werden am Tag der Auferstehung vom Donnerschlag bewusstlos werden, und ich werde der Erste sein, der wieder zu Bewusstsein kommt. Und siehe, da hält sich Moses an der Seite des Thrones fest! Ich weiß nicht, ob er zu jenen gehörte, die bewusstlos wurden und vor mir erwachten, oder ob er zu jenen gehörte, die Allah ausgenommen hat.“",

  // 10: 29cd16c7-72d9-40a0-8e27-de59df140c84
  "Ishaq ibn Abi ‘Isa berichtete uns: Yazid ibn Harun teilte uns mit: Schu‘bah teilte uns mit, von Qatadah, von Anas ibn Malik (möge Allah mit ihm zufrieden sein), der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Der Dajjal wird nach Medina kommen und dort Engel finden, die sie bewachen, sodass sich weder der Dajjal noch die Pest ihr nähern werden, so Allah will.“",

  // 11: 82a0353e-6e5a-4008-bd53-c25a8d4b211f
  "Abu l-Yaman berichtete uns: Schu‘ayb teilte uns mit, vom az-Zuhri: Abu Salamah ibn ‘Abd ar-Rahman berichtete mir, dass Abu Hurayrah sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Jeder Prophet hatte ein Bittgebet, und ich möchte, so Allah will, mein Bittgebet als Fürsprache für meine Gemeinschaft am Tag der Auferstehung aufsparen.“",

  // 12: 60365cde-06dc-49a6-991e-83c3fbefeb93
  "Yasaratu ibn Safwan ibn Jamil al-Lakhmi berichtete uns: Ibrahim ibn Sa‘d berichtete uns vom az-Zuhri, von Sa‘id ibn al-Musayyab, von Abu Hurayrah, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Während ich schlief, sah ich mich an einem Brunnen stehen und zog daraus Wasser, so viel Allah wollte, dass ich ziehe. Dann nahm Ibn Abi Quhafah den Eimer und zog einen oder zwei Eimer, und in seinem Ziehen lag Schwäche – möge Allah ihm vergeben! Dann nahm ihn ‘Umar, und er verwandelte sich in einen riesigen Eimer. Ich sah unter den Menschen keinen herausragenden Meister, der so gewaltig wirkte wie er, bis die Leute rings um ihn ihre Kamele tränkten und an der Tränkstätte lagerten.“",

  // 13: 366b82cb-3114-4795-9221-a7dfeb63579b
  "Muhammad ibn al-‘Ala’ berichtete uns: Abu Usamah berichtete uns von Burayd, von Abu Burdah, von Abu Musa, der sagte: Wenn ein Bittsteller – oder er sagte: wenn ein Hilfesuchender – oder jemand mit einem Anliegen zum Propheten (Friede sei auf ihm) kam, pflegte er zu sagen: „Legt Fürsprache ein, so werdet ihr belohnt werden; und Allah bestimmt durch die Zunge Seines Gesandten, was immer Er will.“",

  // 14: 28539075-779c-4788-93cb-f676eb8eca6c
  "Yahya berichtete uns: ‘Abd ar-Razzaq berichtete uns von Ma‘mar, von Hammam, der Abu Hurayrah vom Propheten (Friede sei auf ihm) sagen hörte: „Keiner von euch soll sagen: ‚O Allah, vergib mir, wenn Du willst; erbarme Dich meiner, wenn Du willst; versorge mich, wenn Du willst!‘ Sondern er soll sein Bitten mit Entschlossenheit vortragen; denn Er tut, was Er will, und niemand kann Ihn zwingen.“",

  // 15: 0e7c6f97-bbf3-4f1c-83d6-fa144bfcfafd
  "‘Abdullah ibn Muhammad berichtete uns: Abu Hafs ‘Amr berichtete uns: al-Awza‘i berichtete uns: Ibn Schihab berichtete mir von ‘Ubaydullah ibn ‘Abdullah ibn ‘Utbah ibn Mas‘ud, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein), dass er und al-Hurr ibn Qays ibn Hisn al-Fazari über den Gefährten von Moses stritten, ob er al-Khadir sei. Da kam Ubayy ibn Ka‘b al-Ansari an ihnen vorbei, woraufhin Ibn ‘Abbas ihn rief und sagte: „Ich und dieser mein Gefährte haben über den Gefährten von Moses gestritten, den er zu treffen suchte. Hast du den Gesandten Allahs (Friede sei auf ihm) dessen Angelegenheit erwähnen hören?“ Er sagte: „Ja, ich hörte den Gesandten Allahs (Friede sei auf ihm) sagen: ‚Während Moses inmitten einer Versammlung der Kinder Israels war, trat ein Mann zu ihm und fragte: Kennst du jemanden, der wissender ist als du? Moses sagte: Nein. Da wurde Moses offenbart: Doch, Unser Diener al-Khadir. Da erbat Moses den Weg, um ihn zu treffen. Allah bestimmte ihm den Fisch als Zeichen und sprach zu ihm: Wenn du den Fisch verlierst, so kehre um, denn gewiss wirst du ihn treffen. So folgte Moses den Spuren des Fisches im Meer. Da sprach der junge Begleiter von Moses zu ihm: Sahst du, als wir beim Felsen Rast einlegten? Gewiss vergaß ich den Fisch, und niemand außer Satan ließ mich vergessen, daran zu denken. Moses sagte: Das ist es, was wir suchten! Da kehrten beide genau ihren Spuren nach zurück und fanden al-Khadir. Und ihre Geschichte trug sich so zu, wie Allah berichtete.‘“",

  // 16: cbda8c08-efe7-49dc-ac83-06af0b0fc887
  "Abu l-Yaman berichtete uns: Schu‘ayb teilte uns mit, vom az-Zuhri. Und Ahmad ibn Salih sagte: Ibn Wahb berichtete uns: Yunus teilte mir mit, von Ibn Schihab, von Abu Salamah ibn ‘Abd ar-Rahman, von Abu Hurayrah, vom Gesandten Allahs (Friede sei auf ihm), der sagte: „Wir werden morgen, so Allah will, im Tal Khayf der Banu Kinanah lagern, wo sie sich einst auf den Unglauben verschworen hatten.“ Er meinte al-Muhassab.",

  // 17: 13465619-aa2a-41ce-b9fc-d24ad15694e1
  "‘Abdullah ibn Muhammad berichtete uns: Ibn ‘Uyaynah berichtete uns von ‘Amr, von Abu l-‘Abbas, von ‘Abdullah ibn ‘Umar, der sagte: Der Prophet (Friede sei auf ihm) belagerte die Leute von at-Ta’if, doch er eroberte sie nicht. Da sprach er: „Wir ziehen ab, so Allah will.“ Da sprachen die Muslime: „Wir ziehen ab, ohne sie erobert zu haben?“ Er sagte: „So zieht morgen zum Kampf aus!“ Sie zogen am nächsten Morgen aus und wurden verwundet. Da sprach der Prophet (Friede sei auf ihm): „Wir ziehen morgen ab, so Allah will.“ Dies gefiel ihnen sehr, und der Gesandte Allahs (Friede sei auf ihm) lächelte.",

  // 18: e435c0ba-d71c-42cf-a1be-92acb0b818dc
  "‘Ali ibn ‘Abdullah berichtete uns: Sufyan berichtete uns von ‘Amr, von ‘Ikrimah, von Abu Hurayrah, der dies auf den Propheten (Friede sei auf ihm) zurückführte; er sagte: „Wenn Allah eine Angelegenheit im Himmel beschließt, schlagen die Engel mit ihren Flügeln in Unterwerfung unter Seine Worte, als wäre es eine Kette auf einem glatten Stein – ‘Ali sagte: Und ein anderer sagte: auf einem Felsen –, und dieser Klang durchdringt sie. Wenn dann der Schrecken aus ihren Herzen gewichen ist, sagen sie: ‚Was hat euer Herr gesagt?‘ Sie antworten: ‚Die Wahrheit; und Er ist der Erhabene, der Große!‘“ ‘Ali sagte: Und Sufyan berichtete uns: ‘Amr berichtete uns von ‘Ikrimah, von Abu Hurayrah, mit dieser Überlieferung. Sufyan sagte: ‘Amr sagte: Ich hörte ‘Ikrimah sagen: Abu Hurayrah berichtete uns. ‘Ali sagte: Ich fragte Sufyan: Sagte er: Ich hörte ‘Ikrimah sagen: Ich hörte Abu Hurayrah? Er antwortete: Ja. Ich sagte zu Sufyan: Ein Mann überlieferte von ‘Amr, von ‘Ikrimah, von Abu Hurayrah, der es auf den Propheten zurückführte, dass er ‚fuzzi‘a‘ rezitierte. Da sagte Sufyan: So hat es ‘Amr rezitiert; ich weiß jedoch nicht, ob er es so gehört hat oder nicht. Sufyan sagte: Und dies ist unsere Lesart.",

  // 19: b695948f-4670-4733-9053-62a1e927e8f6
  "Yahya ibn Bukayr berichtete uns: al-Layth berichtete uns von ‘Uqayl, von Ibn Schihab: Abu Salamah ibn ‘Abd ar-Rahman teilte mir mit, von Abu Hurayrah, dass dieser zu sagen pflegte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Allah hat auf nichts so gelauscht, wie Er auf einen Propheten lauscht, der den Koran mit wohlklingender Stimme laut vorträgt.“ Und ein Gefährte von ihm sagte: Er meinte damit, ihn laut vorzutragen.",

  // 20: 06ac7f3a-aa80-41a9-bfe5-bfd999af24d3
  "‘Umar ibn Hafs ibn Ghiyath berichtete uns: Mein Vater berichtete uns: al-A‘masch berichtete uns: Abu Salih berichtete uns von Abu Sa‘id al-Khudri (möge Allah mit ihm zufrieden sein), der sagte: Der Prophet (Friede sei auf ihm) sagte: „Allah wird sprechen: ‚O Adam!‘ Er antwortet: ‚Hier bin ich zu Deinen Diensten und zu Deinem Wohlgefallen!‘ Da wird mit einer Stimme gerufen: ‚Wahrlich, Allah befiehlt dir, aus deiner Nachkommenschaft eine Schar für das Höllenfeuer herauszusenden!‘“",

  // 21: fdfb3e4e-0683-4b86-81d6-651d518fd809
  "‘Ubayd ibn Isma‘il berichtete uns: Abu Usamah berichtete uns von Hischam, von seinem Vater, von ‘A’ischah (möge Allah mit ihr zufrieden sein), die sagte: „Ich war auf keine Frau so eifersüchtig wie auf Khadijah; und wahrlich, sein Herr befahl ihm, ihr die frohe Botschaft von einem Haus im Paradiese zu verkünden.“",

  // 22: fe9caf21-b905-4527-b74f-0d2cd45a545e
  "Ishaq berichtete mir: ‘Abd as-Samad berichtete uns: ‘Abd ar-Rahman – er ist der Sohn von ‘Abdullah ibn Dinar – berichtete uns von seinem Vater, von Abu Salih, von Abu Hurayrah (möge Allah mit ihm zufrieden sein), der sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte: „Wenn Allah, segensreich und erhaben ist Er, einen Diener liebt, ruft Er Gabriel: ‚Wahrlich, Allah liebt Soundso, so liebe auch du ihn!‘ Da liebt ihn Gabriel. Dann ruft Gabriel im Himmel aus: ‚Wahrlich, Allah liebt Soundso, so liebt ihn auch ihr!‘ Daraufhin lieben ihn die Bewohner des Himmels, und für ihn wird die Annahme und Zuneigung unter den Bewohnern der Erde bereitet.“",

  // 23: e817cbd0-aea5-4243-9ca8-7270e0343025
  "Qutaybah ibn Sa‘id berichtete uns, von Malik, von Abu z-Zinad, vom al-A‘raj, von Abu Hurayrah, dass der Gesandte Allahs (Friede sei auf ihm) sagte: „Es wechseln sich unter euch Engel bei Nacht und Engel bei Tag ab, und sie versammeln sich beim ‘Asr-Gebet und beim Fajr-Gebet. Danach steigen diejenigen empor, die die Nacht bei euch verbracht haben, und Er befragt sie – obwohl Er es am besten weiß –: ‚Wie habt ihr Meine Diener verlassen?‘ Da sagen sie: ‚Wir verließen sie, während sie beteten, und wir kamen zu ihnen, während sie beteten.‘“",

  // 24: 503e8113-4237-4233-b1e1-71b7cb91284a
  "Muhammad ibn Baschchar berichtete uns: Ghundar berichtete uns: Schu‘bah berichtete uns von Wasil, vom al-Ma‘rur, der sagte: Ich hörte Abu Dharr vom Propheten (Friede sei auf ihm) sagen: „Gabriel kam zu mir und verkündete mir die frohe Botschaft: Wer stirbt, ohne Allah irgendetwas beizugesellen, tritt in das Paradies ein.“ Ich fragte: „Selbst wenn er gestohlen und Unzucht getrieben hat?“ Er sprach: „Selbst wenn er gestohlen und Unzucht getrieben hat.“",

  // 25: c57a7a47-7c60-4ffa-8bfd-bd4a87f9ce8d
  "Musaddad berichtete uns: Abu l-Ahwas berichtete uns: Abu Ishaq al-Hamdani berichtete uns vom al-Bara’ ibn ‘Azib, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sprach: „O Soundso, wenn du dich zu deiner Ruhestätte begibst, so sprich: O Allah, ich ergebe mich Dir, wende mein Antlitz Dir zu, überantworte meine Angelegenheit Dir und flüchte mich mit meinem Rücken an Dich, voller Verlangen nach Dir und Ehrfurcht vor Dir. Es gibt weder Zuflucht noch Rettung vor Dir außer bei Dir. Ich glaube an Dein Buch, das Du herabgesandt hast, und an Deinen Propheten, den Du entsandt hast. Denn wenn du in jener deiner Nacht stirbst, stirbst du in der gottgegebenen Natur (Fitrah); und wenn du den Morgen erlebst, erlangst du Lohn.“",

  // 26: 16261b02-1039-4e3d-9495-3ff51393b471
  "Qutaybah ibn Sa‘id berichtete uns: Sufyan berichtete uns von Isma‘il ibn Abi Khalid, von ‘Abdullah ibn Abi Awfa, der sagte: Der Gesandte Allahs (Friede sei auf ihm) sprach am Tag der Verbündeten (Grabenschlacht): „O Allah, Herabsendender des Buches, Schneller im Abrechnen, besiege die Verbündeten und erschüttere sie!“ Al-Humaydi fügte hinzu: Sufyan berichtete uns: Ibn Abi Khalid berichtete uns: Ich hörte ‘Abdullah sagen: Ich hörte den Propheten (Friede sei auf ihm).",

  // 27: f0cc97e7-468a-45d8-85a2-67adfa771b57
  "Musaddad berichtete uns, von Huschaym, von Abu Bischr, von Sa‘id ibn Jubayr, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein) über: „Und sprich dein Gebet weder zu laut noch flüstere es zu leise“ (Sure 17, Vers 110 bis 110). Er sagte: Dies wurde herabgesandt, als der Gesandte Allahs (Friede sei auf ihm) sich in Mekka verbarg. Wenn er seine Stimme erhob, hörten ihn die Götzendiener und schmähten den Koran, Den, Der ihn herabgesandt hat, und den, der ihn gebracht hat. Da sprach Allah der Erhabene: „Und sprich dein Gebet weder zu laut noch flüstere es zu leise“ (Sure 17, Vers 110 bis 110): Trage es nicht zu laut vor, sodass die Götzendiener es hören, und flüstere es nicht so leise vor deinen Gefährten, dass sie es nicht hören können; „sondern suche einen Weg dazwischen“ (Sure 17, Vers 110 bis 110): Lass sie hören, doch trage es nicht so laut vor, dass sie den Koran schmähen.",

  // 28: a4198452-e545-428a-b2d9-f0ccb3a5f9cb
  "Al-Humaydi berichtete uns: Sufyan berichtete uns: az-Zuhri berichtete uns von Sa‘id ibn al-Musayyab, von Abu Hurayrah, der sagte: Der Prophet (Friede sei auf ihm) sagte: „Allah der Erhabene spricht: ‚Der Sohn Adams kränkt Mich: Er schmäht die Zeit, während Ich die Zeit bin; in Meiner Hand liegt der Befehl, Ich lasse die Nacht und den Tag wechseln.‘“",

  // 29: 5e1708d7-9e11-4abc-9ee5-9c3eca7f0bca
  "Abu Nu‘aym berichtete uns: al-A‘masch berichtete uns von Abu Salih, von Abu Hurayrah, vom Propheten (Friede sei auf ihm), der sagte: „Allah, mächtig und majestätisch ist Er, spricht: ‚Das Fasten ist für Mich, und Ich Selbst vergelte es; er lässt seine Begierde, sein Essen und sein Trinken um Meinetwillen. Das Fasten ist ein Schutzschild. Und der Fastende erfährt zwei Freuden: Eine Freude, wenn er das Fasten bricht, und eine Freude, wenn er seinem Herrn begegnet. Und wahrlich, der Mundgeruch des Fastenden ist bei Allah wohlriechender als der Duft von Moschus.‘“"
];

if (inputs.length !== translations.length) {
  console.error(`Count mismatch: ${inputs.length} inputs vs ${translations.length} translations`);
  process.exit(1);
}

const outputs = [];
let hasErrors = false;

for (let i = 0; i < inputs.length; i++) {
  const item = inputs[i];
  const deText = translations[i];
  const errs = validateGerman(item, deText);

  if (errs.length > 0) {
    console.error(`[Error] Item ${i} (${item.id}):`, errs);
    hasErrors = true;
  }

  outputs.push({
    id: item.id,
    de: deText
  });
}

if (hasErrors) {
  console.error('Validation failed. Aborting output writing.');
  process.exit(1);
}

fs.writeFileSync(outputPath, JSON.stringify(outputs, null, 2), 'utf8');
console.log(`Successfully generated and validated ${outputs.length} translations -> ${outputPath}`);
