import fs from 'node:fs';
import { validateGerman } from './validate-german-text.mjs';

const inputs = JSON.parse(fs.readFileSync('data/german-batches/hadith-inputs/muslim-batch-003.json', 'utf8'));

const translations = [
  // 0: f6deb1bb-24fe-4c17-9948-cf7539a6e182 (1470 b)
  {
    id: "f6deb1bb-24fe-4c17-9948-cf7539a6e182",
    de: "Und Muhammad ibn Rafi‘ berichtete uns: ‘Abd ar-Razzaq berichtete uns: Ma‘mar teilte uns mit, von Hammam ibn Munabbih, der sagte: Dies ist, was uns Abu Hurayrah vom Gesandten Allahs (Friede sei auf ihm) überlieferte – und er erwähnte mehrere Hadithe, darunter: Und der Gesandte Allahs (Friede sei auf ihm) sagte: „Wären die Kinder Israels nicht gewesen, so wäre die Speise niemals verdorben und das Fleisch niemals faulig geworden; und wäre Eva nicht gewesen, so hätte keine Frau jemals ihren Ehemann verraten.“"
  },

  // 1: 3022bf29-e5bc-4358-b2f6-513bd22d606f (1471 a)
  {
    id: "3022bf29-e5bc-4358-b2f6-513bd22d606f",
    de: "Yahya ibn Yahya at-Tamimi berichtete uns; er sagte: Ich las Malik ibn Anas vor, von Nafi‘, von Ibn ‘Umar, dass er seine Frau zur Zeit des Gesandten Allahs (Friede sei auf ihm) verstieß, während sie ihre Monatsblutung hatte. Da befragte ‘Umar ibn al-Khattab den Gesandten Allahs (Friede sei auf ihm) darüber, und der Gesandte Allahs (Friede sei auf ihm) sprach zu ihm: „Befiehl ihm, sie wieder zurückzunehmen und sie dann bei sich zu behalten, bis sie rein wird, danach ihre Monatsblutung bekommt und dann wieder rein wird. Danach mag er sie, wenn er will, behalten, oder wenn er will, verstoßen, bevor er sie berührt; denn dies ist die Wartezeit (‘Iddah), für die Allah, mächtig und majestätisch ist Er, geboten hat, die Frauen zu verstoßen.“"
  },

  // 2: d956e248-3725-4556-86dc-b5669586542e (1471 b)
  {
    id: "d956e248-3725-4556-86dc-b5669586542e",
    de: "Yahya ibn Yahya, Qutaybah und Ibn Rumh berichteten uns – und der Wortlaut stammt von Yahya –: Qutaybah sagte: Layth berichtete uns; und die beiden anderen sagten: al-Layth ibn Sa‘d teilte uns mit, von Nafi‘, von ‘Abdullah, dass er eine Frau von sich mit einer einzigen Scheidung verstieß, während sie ihre Monatsblutung hatte. Da befahl ihm der Gesandte Allahs (Friede sei auf ihm), sie wieder zurückzunehmen und sie bei sich zu behalten, bis sie rein wird, danach bei ihm eine weitere Monatsblutung bekommt und er dann abwartet, bis sie von ihrer Blutung rein wird. Wenn er sie dann verstoßen will, soll er sie verstoßen, sobald sie rein ist, bevor er mit ihr verkehrt; denn dies ist die Wartezeit, für die Allah geboten hat, die Frauen zu verstoßen. Und Ibn Rumh fügte in seiner Überlieferung hinzu: Wenn ‘Abdullah darüber befragt wurde, pflegte er zu einem Mann zu sagen: „Wenn du sie ein- oder zweimal verstoßen hast, so hat der Gesandte Allahs (Friede sei auf ihm) mir dies befohlen; wenn du sie jedoch dreimal verstoßen hast, so ist sie dir verwehrt, bis sie einen anderen Ehemann heiratet, und du hast Allah ungehorsam gehandelt in dem, was Er dir bezüglich der Scheidung deiner Frau geboten hat.“ Muslim sagte: Al-Layth hat mit seiner Formulierung ‚mit einer einzigen Scheidung‘ eine besonders präzise Überlieferung geliefert."
  },

  // 3: d035bb95-5a76-4961-b62f-9c9bef630d03 (1471 c)
  {
    id: "d035bb95-5a76-4961-b62f-9c9bef630d03",
    de: "Muhammad ibn ‘Abdullah ibn Numayr berichtete uns: Mein Vater berichtete uns: ‘Ubaydullah berichtete uns von Nafi‘, von Ibn ‘Umar, der sagte: Ich verstieß meine Frau zur Zeit des Gesandten Allahs (Friede sei auf ihm), während sie ihre Monatsblutung hatte. ‘Umar erwähnte dies dem Gesandten Allahs (Friede sei auf ihm), woraufhin er sprach: „Befiehl ihm, sie wieder zurückzunehmen und sie dann zu lassen, bis sie rein wird, danach eine weitere Monatsblutung bekommt, und wenn sie dann rein geworden ist, soll er sie verstoßen, bevor er mit ihr verkehrt, oder sie behalten; denn dies ist die Wartezeit, für die Allah geboten hat, die Frauen zu verstoßen.“ ‘Ubaydullah sagte: Ich fragte Nafi‘: „Was geschah mit jener Scheidung?“ Er antwortete: „Sie zählte als eine Scheidung gegen ihn.“"
  },

  // 4: 5d4b46f2-0b24-4266-bdeb-a93a0e0fc0f8 (1471 d)
  {
    id: "5d4b46f2-0b24-4266-bdeb-a93a0e0fc0f8",
    de: "Und Abu Bakr ibn Abi Schaybah und Ibn al-Muthanna berichteten es uns; beide sagten: ‘Abdullah ibn Idris berichtete uns von ‘Ubaydullah mit dieser Überlieferungskette auf ähnliche Weise, erwähnte jedoch nicht die Frage von ‘Ubaydullah an Nafi‘. Ibn al-Muthanna sagte in seiner Überlieferung: „so soll er sie zurückholen“, während Abu Bakr sagte: „so soll er sie zurücknehmen“."
  },

  // 5: c7931f30-01c4-4601-9374-25154c8179fa (1471 e)
  {
    id: "c7931f30-01c4-4601-9374-25154c8179fa",
    de: "Und Zuhayr ibn Harb berichtete mir: Isma‘il berichtete uns von Ayyub, von Nafi‘, dass Ibn ‘Umar seine Frau verstieß, während sie ihre Monatsblutung hatte. Da befragte ‘Umar den Propheten (Friede sei auf ihm), und er befahl ihm, sie zurückzunehmen, dann abzuwarten, bis sie eine weitere Monatsblutung bekommt, dann abzuwarten, bis sie rein wird, und sie dann zu verstoßen, bevor er sie berührt; denn dies ist die Wartezeit, für die Allah geboten hat, die Frauen zu verstoßen. Er sagte: Und Ibn ‘Umar pflegte, wenn er über einen Mann befragt wurde, der seine Frau während ihrer Monatsblutung verstieß, zu sagen: „Was dich betrifft: Wenn du sie ein- oder zweimal verstoßen hast, so hat der Gesandte Allahs (Friede sei auf ihm) ihm befohlen, sie zurückzunehmen, dann abzuwarten, bis sie eine weitere Monatsblutung bekommt, dann abzuwarten, bis sie rein wird, und sie dann zu verstoßen, bevor er sie berührt; was dich aber betrifft, wenn du sie dreimal verstoßen hast, so bist du deinem Herrn ungehorsam gewesen in dem, was Er dir bezüglich der Scheidung deiner Frau geboten hat, und sie ist endgültig von dir getrennt.“"
  },

  // 6: 0bb4a432-6f62-4e40-96a9-68c1e30f378d (1471 f)
  {
    id: "0bb4a432-6f62-4e40-96a9-68c1e30f378d",
    de: "‘Abd ibn Humayd berichtete mir: Ya‘qub ibn Ibrahim teilte mir mit: Muhammad – und er ist der Neffe von az-Zuhri – berichtete uns von seinem Onkel: Salim ibn ‘Abdullah teilte uns mit, dass ‘Abdullah ibn ‘Umar sagte: Ich verstieß meine Frau, während sie ihre Monatsblutung hatte. ‘Umar erwähnte dies dem Propheten (Friede sei auf ihm), woraufhin der Gesandte Allahs (Friede sei auf ihm) erzürnt war und dann sprach: „Befiehl ihm, sie wieder zurückzunehmen, bis sie eine weitere, neue Monatsblutung bekommt, außer jener Blutung, in der er sie verstoßen hat. Wenn es ihm danach angebracht erscheint, sie zu verstoßen, so soll er sie verstoßen, während sie von ihrer Blutung rein ist, bevor er sie berührt; denn das ist die Scheidung für die Wartezeit, wie Allah es geboten hat.“ Und ‘Abdullah hatte sie mit einer einzigen Scheidung verstoßen, und sie wurde zu ihren Scheidungen hinzugezählt; und ‘Abdullah nahm sie zurück, wie der Gesandte Allahs (Friede sei auf ihm) es ihm geboten hatte."
  },

  // 7: 7254da21-6235-4372-8734-c14e97a1f2e8 (1471 g)
  {
    id: "7254da21-6235-4372-8734-c14e97a1f2e8",
    de: "Und Harun ibn Sa‘id al-Ayli berichtete mir: Ibn Wahb berichtete uns: Usamah ibn Zayd al-Laythi teilte mir mit, dass Muhammad ibn ‘Abd ar-Rahman ibn Thawban ihm von Salim ibn ‘Abdullah, von seinem Vater berichtete, der sagte: Ich verstieß meine Frau, während sie ihre Monatsblutung hatte. ‘Umar erwähnte dies dem Gesandten Allahs (Friede sei auf ihm), woraufhin er sprach: „Befiehl ihm, sie wieder zurückzunehmen, dann soll er sie verstoßen, während sie rein oder schwanger ist.“"
  },

  // 8: 7f43f6e9-a5c6-436b-8fd1-1b149abc55e7 (1471 h)
  {
    id: "7f43f6e9-a5c6-436b-8fd1-1b149abc55e7",
    de: "Abu Bakr ibn Abi Schaybah, Zuhayr ibn Harb und Ibn Numayr berichteten uns – und der Wortlaut stammt von Abu Bakr –; sie sagten: Waki‘ berichtete uns von Sufyan, von Muhammad ibn ‘Abd ar-Rahman, dem Klienten der Familie Talhahs, von Salim, von Ibn ‘Umar, dass er seine Frau verstieß, während sie ihre Monatsblutung hatte. ‘Umar erwähnte dies dem Propheten (Friede sei auf ihm), woraufhin er sprach: „Befiehl ihm, sie wieder zurückzunehmen, und sie dann zu verstoßen, während sie rein oder schwanger ist.“"
  },

  // 9: e0ad27da-1df6-4c76-b983-8a5cf4803131 (1471 i)
  {
    id: "e0ad27da-1df6-4c76-b983-8a5cf4803131",
    de: "Und Ahmad ibn ‘Uthman ibn Hakim al-Awdi berichtete mir: Khalid ibn Makhlad berichtete uns: Sulayman – und er ist Ibn Bilal – berichtete mir: ‘Abdullah ibn Dinar berichtete mir von Ibn ‘Umar, dass er seine Frau verstieß, während sie ihre Monatsblutung hatte. ‘Umar befragte den Gesandten Allahs (Friede sei auf ihm) darüber, woraufhin er sprach: „Befiehl ihm, sie wieder zurückzunehmen, bis sie rein wird, danach eine weitere Monatsblutung bekommt und dann wieder rein wird; danach mag er sie verstoßen oder behalten.“"
  },

  // 10: 84f46aae-6623-4665-b2e5-77de1999cd6e (1471 j)
  {
    id: "84f46aae-6623-4665-b2e5-77de1999cd6e",
    de: "Und ‘Ali ibn Hujr as-Sa‘di berichtete mir: Isma‘il ibn Ibrahim berichtete uns von Ayyub, von Ibn Sirin, der sagte: Zwanzig Jahre lang berichtete mir jemand, den ich nicht verdächtige, dass Ibn ‘Umar seine Frau dreimal verstieß, während sie ihre Monatsblutung hatte, und ihm befohlen wurde, sie zurückzunehmen; und so hegte ich weder Verdacht gegen jene, noch kannte ich den Hadith genau, bis ich Abu Ghallab Yunus ibn Jubayr al-Bahili traf – und er war von großer Zuverlässigkeit. Da berichtete er mir, dass er Ibn ‘Umar befragte, und dieser berichtete ihm, dass er seine Frau mit einer einzigen Scheidung verstieß, während sie ihre Monatsblutung hatte, woraufhin ihm befohlen wurde, sie zurückzunehmen. Er sagte: Ich fragte: „Wurde sie denn gegen ihn angerechnet?“ Er sagte: „Was denn sonst? Hätte es etwa nicht gezählt, wenn er unvernünftig und töricht handelte?“"
  },

  // 11: 6a111db8-f047-4c71-9663-598555e7ac2b (1471 k)
  {
    id: "6a111db8-f047-4c71-9663-598555e7ac2b",
    de: "Und Abu ar-Rabi‘ und Qutaybah berichteten es uns; beide sagten: Hammad berichtete uns von Ayyub mit dieser Überlieferungskette auf ähnliche Weise, außer dass er sagte: „Da befragte ‘Umar den Propheten (Friede sei auf ihm), und er befahl ihm.“"
  },

  // 12: e27bdafd-87ef-4e9f-88a7-23014fb4c36c (1471 l)
  {
    id: "e27bdafd-87ef-4e9f-88a7-23014fb4c36c",
    de: "Und ‘Abd al-Warith ibn ‘Abd as-Samad berichtete uns: Mein Vater berichtete mir von meinem Großvater, von Ayyub mit dieser Überlieferungskette; und er sagte im Hadith: Da befragte ‘Umar den Propheten (Friede sei auf ihm) darüber, und er befahl ihm, sie zurückzunehmen, bis er sie verstoßen würde, während sie rein ist, ohne Geschlechtsverkehr gehabt zu haben; und er sprach: „Er soll sie zu Beginn ihrer Wartezeit verstoßen.“"
  },

  // 13: e7966fbc-2a59-41e7-85cc-dd6309b1905c (1471 m)
  {
    id: "e7966fbc-2a59-41e7-85cc-dd6309b1905c",
    de: "Und Ya‘qub ibn Ibrahim ad-Dawraqi berichtete mir von Ibn ‘Ulayyah, von Yunus, von Muhammad ibn Sirin, von Yunus ibn Jubayr, der sagte: Ich sagte zu Ibn ‘Umar: „Ein Mann verstieß seine Frau, während sie ihre Monatsblutung hatte.“ Da sagte er: „Kennst du ‘Abdullah ibn ‘Umar? Er verstieß seine Frau, während sie ihre Monatsblutung hatte; da ging ‘Umar zum Propheten (Friede sei auf ihm) und befragte ihn. Er befahl ihm, sie zurückzunehmen und dann ihre Wartezeit von neuem zu beginnen.“ Er sagte: Da fragte ich ihn: „Wenn der Mann seine Frau verstößt, während sie ihre Monatsblutung hat, wird jene Scheidung dann angerechnet?“ Da sagte er: „Was denn sonst? Hätte es etwa nicht gezählt, wenn er unvernünftig und töricht handelte?“"
  },

  // 14: 65b44d76-0d9a-4825-889d-e3807f5559dc (1471 n)
  {
    id: "65b44d76-0d9a-4825-889d-e3807f5559dc",
    de: "Muhammad ibn al-Muthanna und Ibn Baschchar berichteten uns. Ibn al-Muthanna sagte: Muhammad ibn Ja‘far berichtete uns: Schu‘bah berichtete uns von Qatadah; er sagte: Ich hörte Yunus ibn Jubayr sagen: Ich hörte Ibn ‘Umar sagen: Ich verstieß meine Frau, während sie ihre Monatsblutung hatte. Da ging ‘Umar zum Propheten (Friede sei auf ihm) und erwähnte ihm dies, woraufhin der Prophet (Friede sei auf ihm) sprach: „Er soll sie zurücknehmen; wenn sie dann rein geworden ist, mag er sie, wenn er will, verstoßen.“ Er sagte: Da fragte ich Ibn ‘Umar: „Hast du sie denn angerechnet?“ Er sagte: „Was sollte ihn daran hindern? Was meinst du wohl, wenn er unvernünftig und töricht handelte?“"
  },

  // 15: dd830ee2-8e9b-4f1d-83c3-9d9a52843f41 (1471 o)
  {
    id: "dd830ee2-8e9b-4f1d-83c3-9d9a52843f41",
    de: "Yahya ibn Yahya berichtete uns: Khalid ibn ‘Abdullah teilte uns mit, von ‘Abd al-Malik, von Anas ibn Sirin, der sagte: Ich befragte Ibn ‘Umar über seine Frau, die er verstoßen hatte. Da sagte er: „Ich verstieß sie, während sie ihre Monatsblutung hatte. Dies wurde ‘Umar erwähnt, und dieser erwähnte es dem Propheten (Friede sei auf ihm), woraufhin er sprach: ‚Befiehl ihm, sie zurückzunehmen; und wenn sie rein geworden ist, soll er sie in ihrer Reinheit verstoßen.‘“ Er sagte: „So nahm ich sie zurück und verstieß sie dann in ihrer Reinheit.“ Ich fragte: „Hast du denn jene Scheidung angerechnet, mit der du sie verstießest, während sie ihre Monatsblutung hatte?“ Er sagte: „Warum sollte ich sie nicht anrechnen, selbst wenn ich unvernünftig und töricht gehandelt hatte?“"
  },

  // 16: 35183518-3341-4ff2-8f46-d89f0bbf3572 (1471 p)
  {
    id: "35183518-3341-4ff2-8f46-d89f0bbf3572",
    de: "Muhammad ibn al-Muthanna und Ibn Baschchar berichteten uns. Ibn al-Muthanna sagte: Muhammad ibn Ja‘far berichtete uns: Schu‘bah berichtete uns von Anas ibn Sirin, dass er Ibn ‘Umar sagen hörte: Ich verstieß meine Frau, während sie ihre Monatsblutung hatte. Da ging ‘Umar zum Propheten (Friede sei auf ihm) und unterrichtete ihn, woraufhin er sprach: „Befiehl ihm, sie zurückzunehmen; wenn sie dann rein geworden ist, soll er sie verstoßen.“ Ich fragte Ibn ‘Umar: „Hast du jene Scheidung denn angerechnet?“ Er sagte: „Was denn sonst?“"
  },

  // 17: b53f312c-5d2b-4052-9879-c2298218edcc (1471 q)
  {
    id: "b53f312c-5d2b-4052-9879-c2298218edcc",
    de: "Und Yahya ibn Habib berichtete es mir: Khalid ibn al-Harith berichtete uns. (Zweite Kette:) Und ‘Abd ar-Rahman ibn Bischr berichtete es mir: Bahz berichtete uns; beide sagten: Schu‘bah berichtete uns mit dieser Überlieferungskette, außer dass es in ihren beiderseitigen Hadithen heißt: „so soll er sie zurückholen“. Und in ihren beiderseitigen Hadithen sagte er: Ich fragte ihn: „Rechnest du sie an?“ Er sagte: „Was denn sonst?“"
  },

  // 18: 7e2c8428-a37a-4778-badd-846eb2755b6b (1471 r)
  {
    id: "7e2c8428-a37a-4778-badd-846eb2755b6b",
    de: "Und Ishaq ibn Ibrahim berichtete uns: ‘Abd ar-Razzaq teilte uns mit: Ibn Jurayj teilte uns mit: Ibn Tawus teilte mir von seinem Vater mit, dass er hörte, wie Ibn ‘Umar über einen Mann befragt wurde, der seine Frau verstieß, während sie ihre Monatsblutung hatte. Da sagte er: „Kennst du ‘Abdullah ibn ‘Umar?“ Jener antwortete: „Ja.“ Er sagte: „Wahrlich, er verstieß seine Frau, während sie ihre Monatsblutung hatte; da ging ‘Umar zum Propheten (Friede sei auf ihm) und berichtete ihm die Nachricht, woraufhin er ihm befahl, sie zurückzunehmen.“ Er sagte: Ich hörte ihn seinem Vater gegenüber nicht mehr als dies hinzufügen."
  },

  // 19: 222e7e05-9ca7-48a9-aec5-ec77bcbc4e18 (1471 s)
  {
    id: "222e7e05-9ca7-48a9-aec5-ec77bcbc4e18",
    de: "Und Harun ibn ‘Abdullah berichtete mir: Hajjaj ibn Muhammad berichtete uns; er sagte: Ibn Jurayj sagte: Abu z-Zubayr teilte mir mit, dass er ‘Abd ar-Rahman ibn Ayman, den Klienten von ‘Azzah, hörte, wie er Ibn ‘Umar befragte, während Abu z-Zubayr zuhörte: „Was meinst du über einen Mann, der seine Frau verstößt, während sie ihre Monatsblutung hat?“ Da sagte er: „Ibn ‘Umar verstieß seine Frau, während sie ihre Monatsblutung hatte, zur Zeit des Gesandten Allahs (Friede sei auf ihm). Da befragte ‘Umar den Gesandten Allahs (Friede sei auf ihm) und sagte: ‚Wahrlich, ‘Abdullah ibn ‘Umar hat seine Frau verstoßen, während sie ihre Monatsblutung hat.‘ Da sprach der Prophet (Friede sei auf ihm) zu ihm: ‚Er soll sie zurücknehmen!‘ Da holte er sie zurück und sprach: ‚Wenn sie rein geworden ist, mag er sie verstoßen oder behalten.‘“ Ibn ‘Umar sagte: Und der Prophet (Friede sei auf ihm) rezitierte: „O Prophet! Wenn ihr die Frauen verstoßt, so verstoßt sie zu Beginn ihrer Wartezeit!“"
  },

  // 20: 2c2fe39f-7c91-42f2-8399-4e032738bcb3 (1471 t)
  {
    id: "2c2fe39f-7c91-42f2-8399-4e032738bcb3",
    de: "Und Harun ibn ‘Abdullah berichtete mir: Abu ‘Asim berichtete uns von Ibn Jurayj, von Abu z-Zubayr, von Ibn ‘Umar mit einem ähnlichen Bericht."
  },

  // 21: 6852f552-3683-4f87-b669-55ae0d74db31 (1471 u)
  {
    id: "6852f552-3683-4f87-b669-55ae0d74db31",
    de: "Und Muhammad ibn Rafi‘ berichtete es mir: ‘Abd ar-Razzaq berichtete uns: Ibn Jurayj teilte uns mit: Abu z-Zubayr teilte mir mit, dass er ‘Abd ar-Rahman ibn Ayman, den Klienten von ‘Urwah, hörte, wie er Ibn ‘Umar befragte, während Abu z-Zubayr zuhörte, ähnlich wie der Hadith von Hajjaj, und darin war ein zusätzlicher Wortlaut enthalten. Muslim sagte: Er irrte sich, als er ‚den Klienten von ‘Urwah‘ sagte; vielmehr war er der Klient von ‘Azzah."
  },

  // 22: dc6ed24d-30b3-4466-944a-dbe4af3769f3 (1472 a)
  {
    id: "dc6ed24d-30b3-4466-944a-dbe4af3769f3",
    de: "Ishaq ibn Ibrahim und Muhammad ibn Rafi‘ berichteten uns – und der Wortlaut stammt von Ibn Rafi‘ –: Ishaq sagte: ‘Abd ar-Razzaq teilte uns mit; und Ibn Rafi‘ sagte: ‘Abd ar-Razzaq berichtete uns: Ma‘mar teilte uns mit, von Ibn Tawus, von seinem Vater, von Ibn ‘Abbas, der sagte: Zur Zeit des Gesandten Allahs (Friede sei auf ihm), unter Abu Bakr und in den ersten zwei Jahren der Herrschaft von ‘Umar galt die dreifache Scheidung als eine einzige. Da sagte ‘Umar ibn al-Khattab: „Wahrlich, die Menschen haben sich in einer Angelegenheit übereilt, in der ihnen doch Geduld und Frist eingeräumt war; wie wäre es, wenn wir sie gegen sie vollstrecken?“ So vollstreckte er sie gegen sie."
  },

  // 23: d637a43d-12c1-48ca-a8c2-64c2374adb51 (1472 b)
  {
    id: "d637a43d-12c1-48ca-a8c2-64c2374adb51",
    de: "Ishaq ibn Ibrahim berichtete uns: Rawh ibn ‘Ubadah teilte uns mit: Ibn Jurayj teilte uns mit. (Zweite Kette:) Und Ibn Rafi‘ berichtete uns – und der Wortlaut stammt von ihm –: ‘Abd ar-Razzaq berichtete uns: Ibn Jurayj teilte uns mit: Ibn Tawus teilte mir von seinem Vater mit, dass Abu as-Sahba’ zu Ibn ‘Abbas sagte: „Weißt du denn nicht, dass die dreifache Scheidung zur Zeit des Propheten (Friede sei auf ihm), unter Abu Bakr und während dreier Jahre der Amtszeit ‘Umars als eine einzige galt?“ Da sagte Ibn ‘Abbas: „Ja.“"
  },

  // 24: 5a41a6f8-d4e4-44db-a5e2-5d45340c1e9a (1472 c)
  {
    id: "5a41a6f8-d4e4-44db-a5e2-5d45340c1e9a",
    de: "Und Ishaq ibn Ibrahim berichtete uns: Sulayman ibn Harb teilte uns mit, von Hammad ibn Zayd, von Ayyub as-Sakhtiyani, von Ibrahim ibn Maysarah, von Tawus, dass Abu as-Sahba’ zu Ibn ‘Abbas sagte: „Bring etwas von deinen bekannten Überlieferungen vor: War die dreifache Scheidung zur Zeit des Gesandten Allahs (Friede sei auf ihm) und unter Abu Bakr nicht eine einzige?“ Da sagte er: „So war es in der Tat; als es dann aber in der Zeit ‘Umars war, stürzten sich die Menschen unaufhörlich in die Scheidungen, sodass er sie für sie voll wirksam machte.“"
  },

  // 25: e466bf82-935b-4a9a-8908-0efed7dd2ad0 (1473 a)
  {
    id: "e466bf82-935b-4a9a-8908-0efed7dd2ad0",
    de: "Und Zuhayr ibn Harb berichtete uns: Isma‘il ibn Ibrahim berichtete uns von Hischam – gemeint ist ad-Dastawa’i –; er sagte: Yahya ibn Abi Kathir schrieb an mich und berichtete von Ya‘la ibn Hakim, von Sa‘id ibn Jubayr, von Ibn ‘Abbas, dass dieser über das Verwehren (Erklären der eigenen Frau für verwehrt) zu sagen pflegte: „Es ist ein Schwur, für den eine Sühne geleistet werden muss.“ Und Ibn ‘Abbas sagte: „Ihr habt ja im Gesandten Allahs ein schönes Vorbild...“ (Sure 33, Vers 21 bis 21)."
  },

  // 26: 011bd3b7-2bd9-4266-8ac4-ce1d13259828 (1473 b)
  {
    id: "011bd3b7-2bd9-4266-8ac4-ce1d13259828",
    de: "Yahya ibn Bischr al-Hariri berichtete uns: Mu‘awiyah – gemeint ist Ibn Sallam – berichtete uns von Yahya ibn Abi Kathir, dass Ya‘la ibn Hakim ihm mitteilte, dass Sa‘id ibn Jubayr ihm mitteilte, dass er Ibn ‘Abbas sagen hörte: „Wenn ein Mann sich seine Frau für verwehrt erklärt, so ist dies ein Schwur, für den er eine Sühne leisten muss.“ Und er sagte: „Ihr habt ja im Gesandten Allahs ein schönes Vorbild...“ (Sure 33, Vers 21 bis 21)."
  },

  // 27: 9c158224-5065-421b-a1b2-0b472fc7fe68 (1474 a)
  {
    id: "9c158224-5065-421b-a1b2-0b472fc7fe68",
    de: "Und Muhammad ibn Hatim berichtete mir: Hajjaj ibn Muhammad berichtete uns: Ibn Jurayj teilte uns mit: ‘Ata’ teilte mir mit, dass er ‘Ubayd ibn ‘Umayr berichten hörte, dass er ‘A’ischah berichten hörte, dass der Prophet (Friede sei auf ihm) bei Zaynab bint Jahsch zu verweilen pflegte und bei ihr Honig trank. Sie sagte: Da verabredeten ich und Hafsah miteinander, dass, bei welcher von uns beiden der Prophet (Friede sei auf ihm) eintreten würde, diese zu ihm sagen solle: ‚Ich rieche von dir den Geruch von Maghafir; hast du etwa Maghafir gegessen?‘ Da trat er bei einer von beiden ein, und sie sagte dies zu ihm. Da sprach er: „Nein, vielmehr trank ich Honig bei Zaynab bint Jahsch, doch ich werde es niemals wieder tun!“ Daraufhin wurde herabgesandt: „Warum erklärst du für verwehrt, was Allah dir erlaubt hat...“ (Sure 66, Vers 1 bis 1) bis zu Seinen Worten: „Wenn ihr beide euch reuevoll zuwendet...“ (Sure 66, Vers 4 bis 4), gerichtet an ‘A’ischah und Hafsah; und: „Und als der Prophet einer seiner Gattinnen ein Geheimnis anvertraute...“ (Sure 66, Vers 3 bis 3) bezüglich seiner Worte: „Nein, vielmehr trank ich Honig.“"
  },

  // 28: 77a04214-6510-4d69-a09d-0fa40c3c36dc (1474 b)
  {
    id: "77a04214-6510-4d69-a09d-0fa40c3c36dc",
    de: "Abu Kuraib Muhammad ibn al-‘Ala’ und Harun ibn ‘Abdullah berichteten uns; beide sagten: Abu Usamah berichtete uns von Hischam, von seinem Vater, von ‘A’ischah, die sagte: Der Gesandte Allahs (Friede sei auf ihm) liebte Süßigkeiten und Honig. Nach dem ‘Asr-Gebet pflegte er seine Frauen aufzusuchen und sich ihnen zu nähern. Da begab er sich zu Hafsah und verweilte bei ihr länger, als er sonst zu verweilen pflegte. Da empfand ich Eifersucht darüber und erkundigte mich danach. Da wurde mir berichtet, dass eine Frau aus ihrem Volk ihr einen Schlauch mit Honig geschenkt hatte und sie dem Gesandten Allahs (Friede sei auf ihm) einen Schluck davon zu trinken gegeben hatte. Da sagte ich: „Bei Allah, wir werden gewiss eine List gegen ihn anwenden!“ Ich erwähnte dies Sawdah und sagte zu ihr: „Wenn er bei dir eintritt, wird er sich dir nähern; so sprich zu ihm: ‚O Gesandter Allahs, hast du Maghafir gegessen?‘ Er wird dir gewiss sagen: ‚Nein‘. Dann sprich zu ihm: ‚Was ist dann dieser Geruch?‘ – und es war dem Gesandten Allahs (Friede sei auf ihm) überaus zuwider, dass man einen üblen Geruch an ihm wahrnahm. Er wird dir daraufhin sagen: ‚Hafsah gab mir einen Schluck Honig zu trinken‘; dann sprich zu ihm: ‚Da haben seine Bienen wohl vom ‘Urfut-Strauch genascht!‘ Und ich werde dasselbe zu ihm sagen, und sprich du es ebenfalls, o Safiyyah!“ Als er bei Sawdah eintrat, sagte sie – und Sawdah pflegte zu sagen: „Bei Dem, außer Dem es keinen Gott gibt, vor lauter Furcht vor dir wollte ich beinahe schon damit herausplatzen, als er noch an der Tür stand!“ –; als sich der Gesandte Allahs (Friede sei auf ihm) ihr näherte, sagte sie: „O Gesandter Allahs, hast du etwa Maghafir gegessen?“ Er sprach: „Nein.“ Sie sagte: „Was ist dann dieser Geruch?“ Er sprach: „Hafsah gab mir einen Schluck Honig zu trinken.“ Da sagte sie: „Da haben seine Bienen wohl vom ‘Urfut-Strauch genascht!“ Als er danach bei mir eintrat, sagte ich dasselbe zu ihm; dann trat er bei Safiyyah ein, und sie sagte dasselbe. Als er danach wieder bei Hafsah eintrat, sagte sie: „O Gesandter Allahs, soll ich dir nicht davon zu trinken geben?“ Da sprach er: „Ich habe kein Verlangen danach.“ Sie sagte: Da sprach Sawdah: „Gepriesen sei Allah! Bei Allah, wir haben es ihm vorenthalten!“ Da sagte ich zu ihr: „Sei still!“"
  },

  // 29: c80cb16d-2ca8-401c-96ba-5aa8bb409cf5 (1474 c)
  {
    id: "c80cb16d-2ca8-401c-96ba-5aa8bb409cf5",
    de: "Abu Ishaq Ibrahim sagte: Al-Hasan ibn Bischr ibn al-Qasim berichtete uns: Abu Usamah berichtete uns genau diesen Hadith. Und Suwayd ibn Sa‘id berichtete es mir: ‘Ali ibn Mushir berichtete uns von Hischam ibn ‘Urwah mit dieser Überlieferungskette auf ähnliche Weise."
  }
];

if (inputs.length !== translations.length) {
  console.error(`Count mismatch: ${inputs.length} inputs vs ${translations.length} translations`);
  process.exit(1);
}

const outputs = [];
let hasErrors = false;

for (let i = 0; i < inputs.length; i++) {
  const item = inputs[i];
  const tr = translations[i];
  if (item.id !== tr.id) {
    console.error(`ID mismatch at index ${i}: input ${item.id} vs translation ${tr.id}`);
    hasErrors = true;
  }
  const errs = validateGerman(item, tr.de);
  if (errs.length > 0) {
    console.error(`[Error] Item ${i} (${item.id}):`, errs);
    hasErrors = true;
  }
  outputs.push({
    id: tr.id,
    de: tr.de
  });
}

if (hasErrors) {
  console.error('Validation failed. Aborting output writing.');
  process.exit(1);
}

const outputPath = 'data/german-batches/hadith-outputs/muslim-batch-003.json';
fs.writeFileSync(outputPath, JSON.stringify(outputs, null, 2), 'utf8');
console.log(`Successfully generated and validated ${outputs.length} translations -> ${outputPath}`);
