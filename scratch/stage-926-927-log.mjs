import { execFileSync, spawnSync } from 'node:child_process';
const path = 'docs/hadith-translation-log.md';
const base = execFileSync('git', ['show', `HEAD:${path}`]);
const addition = Buffer.from('\n\nCodex batch 926-927 inserted 12 rows for Sahih Muslim 1064c to 1065b. The database count increased from 31820 to 31832, exactly matching the inserted rows. Validation passed for 6 hadiths.\n', 'utf8');
const blob = spawnSync('git', ['hash-object', '-w', '--stdin'], { input: Buffer.concat([base, addition]) }).stdout.toString().trim();
const mode = execFileSync('git', ['ls-files', '-s', '--', path]).toString().split(/\s+/)[0];
execFileSync('git', ['update-index', '--cacheinfo', `${mode},${blob},${path}`]);
console.log(blob);
