import fs from 'node:fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/muslim-batch-001.json', 'utf8'));

const translations = [
  // 0: 76a726ea-367c-4792-81d1-d3151e3b704b (1446 b)
  {
    id: "76a726ea-367c-4792-81d1-d3151e3b704b",
    de: "Und ‘Uthman ibn Abi Schaybah und Ishaq ibn Ibrahim berichteten uns von Jarir. (Zweite Kette:) Und Ibn Numayr berichtete uns: Mein Vater berichtete uns. (Dritte Kette:) Und Muhammad ibn Abi Bakr al-Muqaddami berichtete uns: ‘Abd ar-Rahman ibn Mahdi berichtete uns von Sufyan; sie alle überlieferten vom al-A‘masch mit dieser Überlieferungskette ein Gleiches."
  },

  // 1: b080230b-be91-4555-afdb-8b2f8890b1a7 (1447 a)
  {
    id: "b080230b-be91-4555-afdb-8b2f8890b1a7",
    de: "Und Haddab ibn Khalid berichtete uns: Hammam berichtete uns: Qatadah berichtete uns von Jabir ibn Zayd, von Ibn ‘Abbas (möge Allah mit beiden zufrieden sein), dass dem Propheten (Friede sei auf ihm) vorgeschlagen wurde, die Tochter von Hamzah zu heiraten. Da sprach er: „Sie ist mir nicht erlaubt; denn sie ist die Tochter meines Milchbruders, und durch das Stillen wird all das verwehrt, was durch die Blutsverwandtschaft verwehrt wird.“"
  },

  // 2: 1334618c-1b50-4a81-9727-7fe8532c8e65 (1447 b)
  {
    id: "1334618c-1b50-4a81-9727-7fe8532c8e65",
    de: "Und Zuhayr ibn Harb berichtete es uns: Yahya – und er ist al-Qattan – berichtete uns. (Zweite Kette:) Und Muhammad ibn Yahya ibn Mihran al-Quta‘i berichtete uns: Bischr ibn ‘Umar berichtete uns; beide von Schu‘bah. (Dritte Kette:) Und Abu Bakr ibn Abi Schaybah berichtete es uns: ‘Ali ibn Mushir berichtete uns von Sa‘id ibn Abi ‘Arubah; beide von Qatadah mit der Kette von Hammam genau gleich, außer dass der Hadith von Schu‘bah bei seinen Worten endete: „...die Tochter meines Milchbruders.“ Und im Hadith von Sa‘id heißt es: „Und durch das Stillen wird all das verwehrt, was durch die Abstammung verwehrt wird.“ Und in der Überlieferung von Bischr ibn ‘Umar heißt es: „Ich hörte Jabir ibn Zayd.“"
  },

  // 3: dcd365b2-8a4e-4aad-aec4-bbe42f3ef553 (1448)
  {
    id: "dcd365b2-8a4e-4aad-aec4-bbe42f3ef553",
    de: "Und Harun ibn Sa‘id al-Ayli und Ahmad ibn ‘Isa berichteten uns; beide sagten: Ibn Wahb berichtete uns: Makhramah ibn Bukayr teilte mir mit, von seinem Vater, der sagte: Ich hörte ‘Abdullah ibn Muslim sagen: Ich hörte Muhammad ibn Muslim sagen: Ich hörte Humayd ibn ‘Abd ar-Rahman sagen: Ich hörte Umm Salamah (möge Allah mit ihr zufrieden sein), die Gemahlin des Propheten (Friede sei auf ihm), sagen: Es wurde zum Gesandten Allahs (Friede sei auf ihm) gesagt: „Wie wäre es, o Gesandter Allahs, mit der Tochter von Hamzah?“ – oder es wurde gesagt: „Willst du nicht um die Tochter von Hamzah ibn ‘Abd al-Muttalib anhalten?“ Da sprach er: „Hamzah ist fürwahr mein Milchbruder.“"
  },

  // 4: 644b4107-8ab5-45a1-b620-79e40b823a4f (1449 a)
  {
    id: "644b4107-8ab5-45a1-b620-79e40b823a4f",
    de: "Abu Kurayb Muhammad ibn al-‘Ala’ berichtete uns: Abu Usamah berichtete uns: Hischam teilte uns mit: Mein Vater teilte uns mit, von Zainab bint Umm Salamah, von Umm Habibah bint Abi Sufyan (möge Allah mit beiden zufrieden sein), die sagte: Der Gesandte Allahs (Friede sei auf ihm) trat bei mir ein, und ich sagte zu ihm: „Hast du ein Verlangen nach meiner Schwester, der Tochter von Abu Sufyan?“ Er fragte: „Was sollte ich tun?“ Ich antwortete: „Sie heiraten!“ Er sprach: „Würde dir das denn gefallen?“ Ich erwiderte: „Ich bin ja nicht deine einzige Gemahlin, und diejenige, mit der ich das Gute am liebsten teilen möchte, ist meine Schwester.“ Da sprach er: „Sie ist mir fürwahr nicht erlaubt.“ Ich sagte: „Mir wurde aber berichtet, dass du um Durrah bint Abi Salamah anhalten willst.“ Er fragte: „Die Tochter von Umm Salamah?“ Ich antwortete: „Ja.“ Da sprach er: „Selbst wenn sie nicht meine Stieftochter unter meiner Obhut wäre, wäre sie mir nicht erlaubt! Denn sie ist die Tochter meines Milchbruders: Thuwaybah stillte mich und ihren Vater Abu Salamah. Schlagt mir daher weder eure Töchter noch eure Schwestern zur Heirat vor!“"
  },

  // 5: d3a44e77-50a7-47b8-8097-d8c7c94541cb (1449 b)
  {
    id: "d3a44e77-7900-47b3-8895-9ceefcb221ba",
    de: "Und Suwayd ibn Sa‘id berichtete es mir: Yahya ibn Zakariyya’ ibn Abi Za’idah berichtete uns. (Zweite Kette:) Und ‘Amr an-Naqid berichtete uns: al-Aswad ibn ‘Amir berichtete uns: Zuhayr teilte uns mit; beide von Hischam ibn ‘Urwah mit genau dieser Überlieferungskette."
  },

  // 6: 5b286577-c917-4f65-8b2b-42fa171a0628 (1449 c)
  {
    id: "5b286577-b724-4f85-afc1-da42379a9577",
    de: "Und ‘Amr an-Naqid berichtete uns: Sufyan ibn ‘Uyaynah berichtete uns von az-Zuhri, von ‘Urwah, von Zainab bint Abi Salamah, von ihrer Mutter, von Umm Habibah (möge Allah mit ihnen zufrieden sein), die sagte: Ich sprach: „O Gesandter Allahs, willst du nicht die Tochter von Abu Sufyan heiraten?“ Er fragte: „Und was sollte ich tun?“ Sie sagte: „Sie heiraten!“ Er fragte: „Liebst du das denn?“ Sie erwiderte: „Ich bin ja nicht deine einzige Frau, und diejenige, mit der ich das Gute am liebsten teilen möchte, ist meine Schwester.“ Er sprach: „Sie ist mir fürwahr nicht erlaubt.“ Sie sagte: „Bei Allah, man redet davon, dass du um Durrah bint Abi Salamah anhalten willst!“ Er fragte: „Die Tochter von Abu Salamah?“ Sie antwortete: „Ja.“ Da sprach er: „Bei Allah, selbst wenn sie nicht meine Stieftochter unter meiner Obhut wäre, wäre sie mir nicht erlaubt; denn sie ist die Tochter meines Milchbruders: Thuwaybah hat mich und Abu Salamah gestillt. Schlagt mir daher eure Töchter und eure Schwestern nicht vor!“ Az-Zuhri sagte: ‘Urwah sagte: Und Abu Lahab hatte Thuwaybah freigelassen."
  },

  // 7: 56c92c50-cf48-4384-9d58-9be56bc8447d (1449 d)
  {
    id: "56c92c50-6b2b-41ae-86e0-a1cc52acd43d",
    de: "Und ‘Abd al-Malik ibn Schu‘ayb ibn al-Layth berichtete es mir: Mein Vater berichtete mir von meinem Großvater, der mir berichtete: ‘Uqayl ibn Khalid berichtete mir. (Zweite Kette:) Und ‘Abd ibn Humayd berichtete uns: Ya‘qub ibn Ibrahim az-Zuhri teilte mir mit: Muhammad ibn ‘Abdullah ibn Muslim berichtete uns; beide von az-Zuhri mit der Kette von Ibn Abi Habib von ihm, ähnlich seinem Hadith. Und keiner von ihnen nannte ‘Azzah namentlich in seinem Hadith außer Yazid ibn Abi Habib."
  },

  // 8: a872c0ee-3058-48b4-8e10-ee8c799dc3e6 (1450 a)
  {
    id: "a872c0ee-ee39-46b7-9e07-01fefc63133f",
    de: "Zuhayr ibn Harb berichtete mir: Isma‘il ibn Ibrahim berichtete uns. (Zweite Kette:) Und Muhammad ibn ‘Abdullah ibn Numayr berichtete uns: Isma‘il berichtete uns. (Dritte Kette:) Und Suwayd ibn Sa‘id berichtete uns: Mu‘tamir ibn Sulayman berichtete uns; beide von Ayyub, von Ibn Abi Mulaykah, von ‘Abdullah ibn az-Zubayr, von ‘A’ischah (möge Allah mit ihr zufrieden sein), die sagte: Der Gesandte Allahs (Friede sei auf ihm) sagte – und Suwayd und Zuhayr sagten: Der Prophet (Friede sei auf ihm) sagte –: „Weder ein einmaliges noch ein zweimaliges Saugen begründet das Eheverbot.“"
  },

  // 9: d0891858-5484-4632-a58f-22f2b343a85b (1451 a)
  {
    id: "d0891858-8728-4e4a-a2c9-0648ea8c4d66",
    de: "Yahya ibn Yahya, ‘Amr an-Naqid und Ishaq ibn Ibrahim berichteten uns, alle von al-Mu‘tamir – und der Wortlaut stammt von Yahya –: Al-Mu‘tamir ibn Sulayman teilte uns mit, von Ayyub, der von Abu l-Khalil berichtete, von ‘Abdullah ibn al-Harith, von Umm al-Fadl (möge Allah mit ihr zufrieden sein), die sagte: Ein Beduine trat beim Propheten Allahs (Friede sei auf ihm) ein, während er sich in meinem Hause befand, und sagte: „O Prophet Allahs, ich hatte eine Frau und heiratete eine weitere hinzu. Nun behauptet meine erste Frau, dass sie meine neu hinzugeheiratete Frau ein- oder zweimal gestillt habe!“ Da sprach der Prophet Allahs (Friede sei auf ihm): „Weder ein einmaliges noch ein zweimaliges Saugen begründet das Eheverbot.“ ‘Amr sagte in seiner Überlieferung: von ‘Abdullah ibn al-Harith ibn Nawfal."
  },

  // 10: 542ea41c-ff2b-4b2a-bf32-e01d36d4df99 (1451 b)
  {
    id: "542ea41c-7356-4a08-b192-bd6a42758345",
    de: "Und Abu Ghassan al-Misma‘i berichtete mir: Mu‘adh berichtete uns. (Zweite Kette:) Und Ibn al-Muthanna und Ibn Baschchar berichteten uns; beide sagten: Mu‘adh ibn Hischam berichtete uns: Mein Vater berichtete mir von Qatadah, von Salih ibn Abi Maryam Abu l-Khalil, von ‘Abdullah ibn al-Harith, von Umm al-Fadl (möge Allah mit ihr zufrieden sein), dass ein Mann von den Banu ‘Amir ibn Sa‘sa‘ah fragte: „O Prophet Allahs, begründet ein einmaliges Stillen das Verbot?“ Er sprach: „Nein.“"
  },

  // 11: 35601d19-dff0-48e0-a7d5-83e9b11dfab4 (1451 c)
  {
    id: "35601d19-18f3-4c2e-b569-fec5d4d9646c",
    de: "Abu Bakr ibn Abi Schaybah berichtete uns: Muhammad ibn Bischr berichtete uns: Sa‘id ibn Abi ‘Arubah berichtete uns von Qatadah, von Abu l-Khalil, von ‘Abdullah ibn al-Harith, dass Umm al-Fadl (möge Allah mit ihr zufrieden sein) berichtete, dass der Prophet Allahs (Friede sei auf ihm) sagte: „Weder ein einmaliges noch ein zweimaliges Stillen, noch ein einmaliges oder zweimaliges Saugen begründet das Eheverbot.“"
  },

  // 12: 4644ab9a-2453-4328-8686-ef1b1516e9d6 (1451 d)
  {
    id: "4644ab9a-79c3-40a2-babc-245e7867d368",
    de: "Und Abu Bakr ibn Abi Schaybah und Ishaq ibn Ibrahim berichteten es uns, beide von ‘Abdah ibn Sulayman, von Ibn Abi ‘Arubah mit dieser Kette. Was Ishaq betrifft, so sagte er wie in der Überlieferung von Ibn Bischr: „...oder zweimaliges Stillen, oder zweimaliges Saugen.“ Was Ibn Abi Schaybah betrifft, so sagte er: „...und zweimaliges Stillen und zweimaliges Saugen.“"
  },

  // 13: 470f4a6f-f236-4c4f-96a9-ceba571fe4e7 (1451 e)
  {
    id: "470f4a6f-530d-4f92-97a5-52a6d37347cc",
    de: "Und Ibn Abi ‘Umar berichtete uns: Bischr ibn as-Sari berichtete uns: Hammad ibn Salamah berichtete uns von Qatadah, von Abu l-Khalil, von ‘Abdullah ibn al-Harith ibn Nawfal, von Umm al-Fadl (möge Allah mit ihr zufrieden sein), vom Propheten (Friede sei auf ihm), der sagte: „Weder ein einmaliges noch ein zweimaliges Saugen begründet das Eheverbot.“"
  },

  // 14: cf65759c-64f1-4fd5-8c01-7bb40ef8efb8 (1451 f)
  {
    id: "cf65759c-5a40-4dd6-baac-b7a90897a4e5",
    de: "Ahmad ibn Sa‘id ad-Darimi berichtete mir: Habban berichtete uns: Hammam berichtete uns: Qatadah berichtete uns von Abu l-Khalil, von ‘Abdullah ibn al-Harith, von Umm al-Fadl (möge Allah mit ihr zufrieden sein): Ein Mann fragte den Propheten (Friede sei auf ihm): „Begründet ein einmaliges Saugen das Eheverbot?“ Er antwortete: „Nein.“"
  },

  // 15: a58d07af-e630-474d-8ae5-1150c7634f59 (1452 a)
  {
    id: "a58d07af-b2a1-4324-81dd-b0f73ac9dd83",
    de: "Yahya ibn Yahya berichtete uns, der sagte: Ich las Malik vor, von ‘Abdullah ibn Abi Bakr, von ‘Amrah, von ‘A’ischah (möge Allah mit ihr zufrieden sein), dass sie sagte: Unter dem, was vom Koran herabgesandt wurde, waren zehn wohlbekannte Stillungen, die das Verbot begründeten. Dann wurden sie durch fünf wohlbekannte Stillungen abrogiert. Und der Gesandte Allahs (Friede sei auf ihm) starb, während sie noch zu dem gehörten, was vom Koran rezitiert wurde."
  },

  // 16: 1ed7f381-80a9-4a00-bf70-a3597b2d5f84 (1452 b)
  {
    id: "1ed7f381-6db6-4f51-9889-2d427301a685",
    de: "‘Abdullah ibn Maslamah al-Qa‘nabi berichtete uns: Sulayman ibn Bilal berichtete uns von Yahya – und er ist Ibn Sa‘id –, von ‘Amrah, dass sie ‘A’ischah (möge Allah mit ihr zufrieden sein) sagen hörte – während sie erwähnte, was durch das Stillen das Verbot begründet –; ‘Amrah sagte: Da sprach ‘A’ischah: „Es wurde im Koran herabgesandt: zehn wohlbekannte Stillungen; dann wurden auch fünf wohlbekannte Stillungen herabgesandt.“"
  },

  // 17: 6879792d-5b32-4e44-b2b9-e15eb5fe5b6a (1452 c)
  {
    id: "6879792d-8f6c-4ec9-a50c-1e358423084f",
    de: "Und Muhammad ibn al-Muthanna berichtete es uns: ‘Abd al-Wahhab berichtete uns, der sagte: Ich hörte Yahya ibn Sa‘id sagen: ‘Amrah teilte mir mit, dass sie ‘A’ischah (möge Allah mit ihr zufrieden sein) ein Gleiches sagen hörte."
  },

  // 18: 624210ef-5a21-4f18-bc1c-ce2e737c385a (1453 a)
  {
    id: "624210ef-24ad-4443-9b40-15841acb2f11",
    de: "‘Amr an-Naqid und Ibn Abi ‘Umar berichteten uns; beide sagten: Sufyan ibn ‘Uyaynah berichtete uns von ‘Abd ar-Rahman ibn al-Qasim, von seinem Vater, von ‘A’ischah (möge Allah mit ihr zufrieden sein), die sagte: Sahlah bint Suhayl kam zum Propheten (Friede sei auf ihm) und sagte: „O Gesandter Allahs, ich sehe das Missfallen im Gesichte von Abu Hudhayfah wegen des Eintretens von Salim – und er ist sein Verbündeter.“ Da sprach der Prophet (Friede sei auf ihm): „Stille ihn!“ Sie fragte: „Und wie sollte ich ihn stillen, wo er doch ein erwachsener Mann ist?“ Da lächelte der Gesandte Allahs (Friede sei auf ihm) und sprach: „Ich weiß wohl, dass er ein erwachsener Mann ist.“ ‘Amr fügte in seinem Hadith hinzu: Und er hatte an Badr teilgenommen. Und in der Überlieferung von Ibn Abi ‘Umar heißt es: Da lachte der Gesandte Allahs (Friede sei auf ihm)."
  },

  // 19: 1de77461-1250-4d43-85e7-285b7364b73b (1453 b)
  {
    id: "1de77461-b3a1-46b3-b96e-79eb4062215d",
    de: "Und Ishaq ibn Ibrahim al-Hanzali und Muhammad ibn Abi ‘Umar berichteten uns, beide von ath-Thaqafi. Ibn Abi ‘Umar sagte: ‘Abd al-Wahhab ath-Thaqafi berichtete uns von Ayyub, von Ibn Abi Mulaykah, von al-Qasim, von ‘A’ischah (möge Allah mit ihr zufrieden sein), dass Salim, der Freigelassene von Abu Hudhayfah, mit Abu Hudhayfah und seiner Familie in deren Hause lebte. Da kam sie – gemeint ist die Tochter von Suhayl – zum Propheten (Friede sei auf ihm) und sagte: „Salim hat nunmehr das Alter erreicht, das Männer erreichen, und versteht, was sie verstehen; und er tritt bei uns ein, und ich glaube, dass Abu Hudhayfah innerlich Unbehagen darüber empfindet.“ Da sprach der Prophet (Friede sei auf ihm) zu ihr: „Stille ihn, so wirst du ihm verwehrt sein, und das, was in Abu Hudhayfahs Herzen ist, wird schwinden!“ Da kehrte sie zurück und sagte später: „Ich habe ihn gestillt, und das, was in Abu Hudhayfahs Herzen war, ist gewichen.“"
  },

  // 20: ecec8fe7-f90b-4eb4-b901-3ddcb719a71d (1453 c)
  {
    id: "ecec8fe7-c5ec-4b39-897e-4c47d150030b",
    de: "Und Ishaq ibn Ibrahim und Muhammad ibn Rafi‘ berichteten uns – und der Wortlaut stammt von Ibn Rafi‘ –, der sagte: ‘Abd ar-Razzaq berichtete uns: Ibn Jurayj teilte uns mit: Ibn Abi Mulaykah teilte uns mit, dass al-Qasim ibn Muhammad ibn Abi Bakr ihm mitteilte, dass ‘A’ischah (möge Allah mit ihr zufrieden sein) ihm mitteilte, dass Sahlah bint Suhayl ibn ‘Amr zum Propheten (Friede sei auf ihm) kam und sagte: „O Gesandter Allahs, Salim – gemeint ist Salim, der Freigelassene von Abu Hudhayfah – ist bei uns in unserem Haus, und er hat das Alter erreicht, das Männer erreichen, und weiß, was Männer wissen.“ Er sprach: „Stille ihn, so wirst du ihm verwehrt sein!“ Er sagte: Da verharrte ich ein Jahr oder annähernd ein Jahr lang, ohne diesen Hadith weiterzuerzählen, da ich Ehrfurcht und Scheu davor empfand. Dann traf ich al-Qasim und sagte zu ihm: „Du hast mir damals einen Hadith berichtet, den ich seither niemandem erzählt habe.“ Er fragte: „Welcher ist es denn?“ Da teilte ich es ihm mit. Er sagte: „So überliefere ihn fortan auf meine Autorität, dass ‘A’ischah ihn mir berichtet hat!“"
  },

  // 21: c1c53dbf-76ea-45a7-9f79-c799a74421b8 (1453 d)
  {
    id: "c1c53dbf-d037-4e33-9396-8e3941815578",
    de: "Und Muhammad ibn al-Muthanna berichtete uns: Muhammad ibn Ja‘far berichtete uns: Schu‘bah berichtete uns von Humayd ibn Nafi‘, von Zainab bint Umm Salamah, die sagte: Umm Salamah sprach zu ‘A’ischah: „Wahrlich, zu dir tritt der heranwachsende Knabe ein, bei dem ich es keineswegs schätzen würde, dass er bei mir eintritt!“ Da sagte ‘A’ischah: „Hast du denn im Gesandten Allahs (Friede sei auf ihm) kein Vorbild? Wahrlich, die Ehefrau von Abu Hudhayfah sagte: ‚O Gesandter Allahs, Salim tritt bei mir ein, während er ein erwachsener Mann ist, und in Abu Hudhayfahs Herzen ist Unbehagen deswegen.‘ Da sprach der Gesandte Allahs (Friede sei auf ihm): ‚Stille ihn, damit er bei dir eintreten darf!‘“"
  },

  // 22: ceb35991-e408-4d51-a90f-96a84d4ae839 (1453 e)
  {
    id: "ceb35991-2ae9-4a32-a608-8c4a66eed053",
    de: "Und Abu t-Tahir und Harun ibn Sa‘id al-Ayli berichteten es mir – und der Wortlaut stammt von Harun –; beide sagten: Ibn Wahb berichtete uns: Makhramah ibn Bukayr teilte mir mit, von seinem Vater, der sagte: Ich hörte Humayd ibn Nafi‘ sagen: Ich hörte Zainab bint Abi Salamah sagen: Ich hörte Umm Salamah (möge Allah mit ihr zufrieden sein), die Gemahlin des Propheten (Friede sei auf ihm), zu ‘A’ischah sagen: „Bei Allah, meine Seele empfindet keinerlei Wohlbehagen dabei, dass mich ein Knabe erblickt, der des Stillens längst entwöhnt ist!“ Da erwiderte ‘A’ischah: „Warum denn? Sahlah bint Suhayl kam doch zum Gesandten Allahs (Friede sei auf ihm) und sagte: ‚O Gesandter Allahs, bei Allah, ich sehe das Missfallen im Gesichte von Abu Hudhayfah wegen des Eintretens von Salim!‘ Da sprach der Gesandte Allahs (Friede sei auf ihm): ‚Stille ihn!‘ Sie sagte: ‚Er trägt doch bereits einen Bart!‘ Er sprach: ‚Stille ihn, so weicht das, was auf dem Gesichte von Abu Hudhayfah ist!‘ Da sagte sie: ‚Bei Allah, danach habe ich nichts davon mehr auf dem Gesichte von Abu Hudhayfah wahrgenommen.‘“"
  },

  // 23: 66b6429a-2e38-42f2-8c10-ce4c54e0c463 (1454)
  {
    id: "66b6429a-fd4e-4d8a-8452-5cf77eee8b0b",
    de: "‘Abd al-Malik ibn Schu‘ayb ibn al-Layth berichtete mir: Mein Vater berichtete mir von meinem Großvater, der mir berichtete: ‘Uqayl ibn Khalid berichtete mir von Ibn Schihab, der sagte: Abu ‘Ubaydah ibn ‘Abdullah ibn Zam‘ah teilte mir mit, dass seine Mutter Zainab bint Abi Salamah ihm mitteilte, dass ihre Mutter Umm Salamah (möge Allah mit ihr zufrieden sein), die Gemahlin des Propheten (Friede sei auf ihm), zu sagen pflegte: Die übrigen Frauen des Propheten (Friede sei auf ihm) weigerten sich strikt, irgendjemanden aufgrund einer solchen Stillung bei sich eintreten zu lassen. Und sie sagten zu ‘A’ischah: „Bei Allah, wir sehen hierin nichts anderes als eine Sondererlaubnis, die der Gesandte Allahs (Friede sei auf ihm) eigens für Salim erteilt hat! Daher wird bei uns niemand durch eine solche Stillung eintreten und uns zu Gesicht bekommen!“"
  },

  // 24: a2fa33ed-01e4-4d81-817f-1d4cb3a70ba1 (1455 a)
  {
    id: "a2fa33ed-1289-4735-acd0-d79af7cd98a6",
    de: "Hannad ibn as-Sari berichtete uns: Abu l-Ahwas berichtete uns von Asch‘ath ibn Abi sch-Scha‘tha’, von seinem Vater, von Masruq, der sagte: ‘A’ischah (möge Allah mit ihr zufrieden sein) sagte: Der Gesandte Allahs (Friede sei auf ihm) trat bei mir ein, während ein sitzender Mann bei mir war. Dies missfiel ihm zutiefst, und ich sah den Zorn auf seinem Gesichte. Da sagte ich: „O Gesandter Allahs, er ist doch mein Milchbruder!“ Da sprach er: „Achtet genau darauf, wer eure Milchbrüder sind; denn das Stillen, das die Verwandtschaft begründet, ist allein jenes, das den Hunger stillt!“"
  },

  // 25: 35ba9744-8da8-4443-85ee-f3325c8a32d6 (1455 b)
  {
    id: "35ba9744-fa32-42e1-b02f-7dd7003b407f",
    de: "Und Muhammad ibn al-Muthanna und Ibn Baschchar berichteten es uns; beide sagten: Muhammad ibn Ja‘far berichtete uns. (Zweite Kette:) Und ‘Ubaydullah ibn Mu‘adh berichtete uns: Mein Vater berichtete uns; beide sagten: Schu‘bah berichtete uns. (Dritte Kette:) Und Abu Bakr ibn Abi Schaybah berichtete uns: Waki‘ berichtete uns. (Vierte Kette:) Und Zuhayr ibn Harb berichtete mir: ‘Abd ar-Rahman ibn Mahdi berichtete uns; alle von Sufyan. (Fünfte Kette:) Und ‘Abd ibn Humayd berichtete uns: Husayn al-Ju‘fi berichtete uns von Za’idah; sie alle von Asch‘ath ibn Abi sch-Scha‘tha’ mit der Überlieferungskette von Abu l-Ahwas mit der Bedeutung seines Hadith, außer dass sie sagten: „...aus dem Hunger heraus.“"
  },

  // 26: 95a52fc4-fa20-4318-ae96-bfae068c783c (1456 a)
  {
    id: "95a52fc4-7193-4978-a075-c4cb8ead1448",
    de: "‘Ubaydullah ibn ‘Umar ibn Maysarah al-Qawariri berichtete uns: Yazid ibn Zuray‘ berichtete uns: Sa‘id ibn Abi ‘Arubah berichtete uns von Qatadah, von Salih Abu l-Khalil, von Abu ‘Alqamah al-Haschimi, von Abu Sa‘id al-Khudri (möge Allah mit ihm zufrieden sein), dass der Gesandte Allahs (Friede sei auf ihm) am Tage der Schlacht von Hunayn ein Heer nach Autas entsandte. Sie trafen auf den Feind, bekämpften ihn, besiegten ihn und machten weibliche Gefangene. Da scheuten sich etliche Gefährten des Gesandten Allahs (Friede sei auf ihm) davor, ihnen beizuwohnen, da jene Frauen Götzendiener zu Ehemännern hatten. Da sandte Allah, der Mächtige und Erhabene, diesbezüglich herab: „Und auch verheiratete Frauen sind euch verwehrt, außer jenen, die eure rechte Hand besitzt...“ (Sure 4, Vers 24), das heißt: Sie sind euch nach Ablauf ihrer Wartezeit erlaubt."
  },

  // 27: ae70ad92-2615-4148-beea-290dd7079b69 (1456 b)
  {
    id: "ae70ad92-4fc2-4d76-83c4-e473b4322fe8",
    de: "Und Abu Bakr ibn Abi Schaybah, Muhammad ibn al-Muthanna und Ibn Baschchar berichteten uns; sie sagten: ‘Abd al-A‘la berichtete uns von Sa‘id, von Qatadah, von Abu l-Khalil, dass Abu ‘Alqamah al-Haschimi berichtete, dass Abu Sa‘id al-Khudri (möge Allah mit ihm zufrieden sein) ihnen berichtete, dass der Prophet Allahs (Friede sei auf ihm) am Tage von Hunayn eine Truppenabteilung aussandte – mit dem gleichen Sinngehalt wie der Hadith von Yazid ibn Zuray‘, außer dass er sprach: „...außer jenen unter ihnen, die eure rechte Hand besitzt, denn sie sind euch erlaubt“, und er erwähnte nicht den Satz: „nach Ablauf ihrer Wartezeit“."
  },

  // 28: 899c46c6-f7c8-4a5f-af65-da2ca1cc7ce0 (1456 c)
  {
    id: "899c46c6-7b88-4522-ac47-19a8b6953530",
    de: "Und Yahya ibn Habib al-Harithi berichtete es mir: Khalid – gemeint ist Ibn al-Harith – berichtete uns: Schu‘bah berichtete uns von Qatadah mit dieser Überlieferungskette auf ähnliche Weise."
  },

  // 29: fbaefec4-fe81-42cb-b1fe-46b539c36284 (1456 d)
  {
    id: "fbaefec4-e2ba-4a0b-88ac-bc5086826784",
    de: "Und Yahya ibn Habib al-Harithi berichtete es mir: Khalid ibn al-Harith berichtete uns: Schu‘bah berichtete uns von Qatadah, von Abu l-Khalil, von Abu Sa‘id (möge Allah mit ihm zufrieden sein), der sagte: Sie machten am Tage von Autas Gefangene, die bereits Ehemänner hatten, und hegten daher Bedenken. Daraufhin wurde dieser Vers herabgesandt: „Und verheiratete Frauen sind euch verwehrt, außer jenen, die eure rechte Hand besitzt...“ (Sure 4, Vers 24)."
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
  fs.writeFileSync('data/german-batches/hadith-outputs/muslim-batch-001.json', JSON.stringify(translations, null, 2), 'utf8');
  console.log("Successfully written to data/german-batches/hadith-outputs/muslim-batch-001.json");
}
