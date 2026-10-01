process.loadEnvFile(".env");

async function check() {
  const countQuery = `select count(*) from public.source_translations where lang = 'de' and text ~* '\\m(fuer|ueber|koennen|muessen|waehrend|traegt|ausser|gemaess|moeglich|zurueck|natuerlich|unglaeubig\\w*|aeussern|beruecksichtig\\w*)\\M';`;

  const res = await fetch("https://api.supabase.com/v1/projects/jnietkyxgnocyizvjiel/database/query", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.SUPABASE_ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: countQuery })
  });

  const countData = await res.json();
  console.log("Umlaut check matching rows:", countData);
}

check().catch(console.error);
