import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('data/hadith-words-translations/codex-batch-current.json', 'utf8')) as any[];
if (rows.length !== 1) throw new Error(`expected 1 row, got ${rows.length}`);
const row = rows[0];
row.translations = {
  en: "Muhammad ibn Rafi narrated to us. Ibn Abi Fudayk narrated to us. Al-Dahhak informed us, from Nafi, from Abdullah ibn Umar, that the Messenger of Allah commanded that the charity of breaking the fast be paid before the people went out to the prayer.",
  de: "Muhammad ibn Rafi überlieferte uns. Ibn Abi Fudayk überlieferte uns. Ad-Dahhak berichtete uns von Nafi, von Abdullah ibn Umar, dass der Gesandte Allahs befahl, die Zakah des Fastenbrechens zu entrichten, bevor die Menschen zum Gebet hinausgingen."
};
row.need = ['en', 'de'];
fs.writeFileSync('data/hadith-words-translations/codex-batch-311.json', JSON.stringify(rows, null, 2) + '\n');
fs.writeFileSync('data/hadith-words-translations/codex-out-311.json', JSON.stringify([{ id: row.id, en: row.translations.en, de: row.translations.de }], null, 2) + '\n');
console.log('translated=1');
