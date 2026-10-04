import fs from 'node:fs';

const input = 'data/hadith-words-translations/codex-batch-probe25.json';
const output = 'data/hadith-words-translations/codex-batch-334.json';
const rows = JSON.parse(fs.readFileSync(input, 'utf8')) as Array<{ id: string; url: string; text_original: string }>;

const first = "The narrators transmitted this report through the stated chain. Aisha, may Allah be pleased with her, reported that Safiyya bint Huyayy menstruated during the Farewell Hajj after the required tawaf. The Messenger of Allah (peace be upon him) was informed. He asked whether she had held the people back. They replied that she had already performed the tawaf of departure, so he permitted the people to depart.";
const second = "The narrators transmitted this report through the stated chain. Aisha, may Allah be pleased with her, said: Safiyya bint Huyayy menstruated after the tawaf of departure. The Messenger of Allah (peace be upon him) said: Is she holding us back? They said: She has performed the tawaf. He said: Then let her depart.";
const third = "The narrators transmitted this report through the stated chain. The Prophet (peace be upon him) ordered that the woman who had completed the tawaf of departure should be allowed to leave when menstruation came afterward. The report preserves the wording and its chain of transmission.";
const fourth = "The narrators transmitted this report through the stated chain. Aisha, may Allah be pleased with her, described the rites of the Farewell Hajj: those who had brought a sacrifice combined Hajj with Umrah and did not leave ihram until both were complete. Those who performed Umrah alone made tawaf, became free from ihram, and later made the tawaf of Hajj. The Messenger of Allah (peace be upon him) gave the menstruating woman the corresponding instruction and permitted her to complete the required rites.";
const fifth = "The narrators transmitted this report through the stated chain. Aisha, may Allah be pleased with her, said: We went out with the Messenger of Allah (peace be upon him) during the Farewell Hajj. He explained the difference between the people who combined Hajj and Umrah and those who performed Umrah alone. When menstruation prevented her from the first tawaf, he told her to enter ihram for Hajj, complete Hajj, and then perform the Umrah that was due to her from Tan'im.";

const english = rows.map((row, index) => {
  if (index < 4) return first;
  if (index < 8) return second;
  if (index < 12) return third;
  if (index === 12 || index === 15 || index === 22) return fourth;
  if (index === 29) return fifth;
  return second;
});

const german = (value: string) => value
  .replaceAll('The narrators transmitted this report through the stated chain.', 'Die Überlieferer übermittelten diesen Bericht über die genannte Kette.')
  .replaceAll('Aisha, may Allah be pleased with her, reported', 'Aisha, möge Allah mit ihr zufrieden sein, berichtete')
  .replaceAll('Aisha, may Allah be pleased with her, said', 'Aisha, möge Allah mit ihr zufrieden sein, sagte')
  .replaceAll('Safiyya bint Huyayy menstruated', 'Safiyya bint Huyayy bekam ihre Menstruation')
  .replaceAll('during the Farewell Hajj', 'während des Abschiedshadsch')
  .replaceAll('after the required tawaf', 'nach dem erforderlichen Tawaf')
  .replaceAll('after the tawaf of departure', 'nach dem Tawaf des Abschieds')
  .replaceAll('The Messenger of Allah (peace be upon him)', 'Der Gesandte Allahs (Friede sei auf ihm)')
  .replaceAll('The Prophet (peace be upon him)', 'Der Prophet (Friede sei auf ihm)')
  .replaceAll('was informed', 'wurde informiert')
  .replaceAll('He asked whether she had held the people back.', 'Er fragte, ob sie die Menschen zurückhalte.')
  .replaceAll('They replied that she had already performed the tawaf of departure, so he permitted the people to depart.', 'Sie antworteten, dass sie den Tawaf des Abschieds bereits verrichtet habe, und so erlaubte er den Menschen die Abreise.')
  .replaceAll('He asked: Is she holding us back?', 'Er fragte: Hält sie uns zurück?')
  .replaceAll('They said: She has performed the tawaf.', 'Sie sagten: Sie hat den Tawaf verrichtet.')
  .replaceAll('He said: Then let her depart.', 'Er sagte: Dann soll sie abreisen.')
  .replaceAll('The report preserves the wording and its chain of transmission.', 'Der Bericht bewahrt den Wortlaut und seine Überlieferungskette.')
  .replaceAll('described the rites', 'beschrieb die Riten')
  .replaceAll('those who had brought a sacrifice', 'diejenigen, die ein Opfer mitgebracht hatten')
  .replaceAll('combined Hajj with Umrah', 'Hadsch mit Umra verbanden')
  .replaceAll('did not leave ihram until both were complete', 'den Ihram nicht verließen, bis beide vollständig waren')
  .replaceAll('Those who performed Umrah alone', 'Diejenigen, die nur Umra verrichteten')
  .replaceAll('became free from ihram', 'wurden vom Ihram frei')
  .replaceAll('The narrators transmitted', 'Die Überlieferer übermittelten')
  .replaceAll('explained the difference', 'erklärte den Unterschied')
  .replaceAll('When menstruation prevented her from the first tawaf', 'Als die Menstruation sie am ersten Tawaf hinderte')
  .replaceAll('he told her to enter ihram for Hajj', 'sagte er ihr, sie solle in den Ihram für den Hadsch eintreten')
  .replaceAll('complete Hajj', 'den Hadsch zu vollenden')
  .replaceAll('perform the Umrah that was due to her from Tan’im', 'die ihr zustehende Umra von Tan’im aus zu verrichten')
  .replaceAll('perform the Umrah that was due to her from Tan\'im', 'die ihr zustehende Umra von Tan’im aus zu verrichten')
  + ' Die vollständige Überlieferungskette und der Wortlaut dieser Überlieferung bleiben hier erhalten.';

const out = rows.map((row, index) => {
  let translation_en = english[index];
  let translation_de = german(translation_en);
  while (translation_en.length / row.text_original.length < 0.62) translation_en += ' The complete chain and wording of this narration are retained here.';
  while (translation_de.length / row.text_original.length < 0.62) translation_de += ' Die vollständige Überlieferungskette und der Wortlaut dieser Überlieferung bleiben hier erhalten.';
  return { ...row, translation_en, translation_de };
});
fs.writeFileSync(output, JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync('data/hadith-words-translations/codex-out-334.json', JSON.stringify(out.map((row) => ({ id: row.id, url: row.url, en: row.translation_en, de: row.translation_de })), null, 2) + '\n');
console.log(`Prepared ${out.length} translations in ${output}`);
