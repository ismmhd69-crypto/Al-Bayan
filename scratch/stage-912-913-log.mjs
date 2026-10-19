import { execFileSync, spawnSync } from 'node:child_process';
const path = 'docs/hadith-translation-log.md';
const base = execFileSync('git', ['show', `HEAD:${path}`]);
const addition = Buffer.from('\n\nCodex batch 912-913 verified 12 existing translation rows for Sahih Muslim 1018b to 1021c. No database rows were inserted or changed. Validation passed for 6 hadiths; the stored database text was preserved because those rows already existed.\n', 'utf8');
const blob = spawnSync('git', ['hash-object', '-w', '--stdin'], { input: Buffer.concat([base, addition]) }).stdout.toString().trim();
const mode = execFileSync('git', ['ls-files', '-s', '--', path]).toString().split(/\s+/)[0];
execFileSync('git', ['update-index', '--cacheinfo', `${mode},${blob},${path}`]);
console.log(blob);
