import enDict from '../dictionaries/en.ts';
import deDict from '../dictionaries/de.ts';

function flatten(obj: any, prefix = ''): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(res, flatten(v, full));
    } else {
      res[full] = v;
    }
  }
  return res;
}

const enFlat = flatten(enDict);
const deFlat = flatten(deDict);

console.log('Total en leaf entries:', Object.keys(enFlat).length);
console.log('Total de leaf entries:', Object.keys(deFlat).length);

const missing = [];
const englishFallback = [];

for (const [k, v] of Object.entries(enFlat)) {
  if (!(k in deFlat)) {
    missing.push(k);
  } else if (typeof v === 'string' && typeof deFlat[k] === 'string') {
    if (v === deFlat[k] && v.length > 5 && !/^\d+$/.test(v) && !/^https?:/.test(v)) {
      // Check if it's identical English text
      // Some terms like proper names or abbreviations might be identical
      englishFallback.push({ key: k, value: v });
    }
  }
}

console.log('Missing leaf keys in de:', missing.length);
console.log('Identical leaf values:', englishFallback);
