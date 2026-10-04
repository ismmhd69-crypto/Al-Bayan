process.loadEnvFile('.env');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

(async () => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('sources').select('id,reference,title,url,text_original')
      .eq('collection', 'Sahih al-Bukhari').eq('kind', 'hadith').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const out = rows.map((row) => {
    const match = String(row.url).match(/:(\d+)([a-z]*)$/i);
    return { ...row, number: match ? Number(match[1]) : 0 };
  }).filter((row) => row.number >= 6856 && row.number <= 6861)
    .sort((a, b) => a.number - b.number || a.url.localeCompare(b.url));
  console.log(JSON.stringify({ total: rows.length, matches: out.length, rows: out }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
