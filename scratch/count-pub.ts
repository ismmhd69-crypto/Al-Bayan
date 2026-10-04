import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env");
(async()=>{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!);
let n=0,t=0;const u=new Set<string>();let dup=0;for(let f=0;;f+=1000){const {data}=await db.from("sources").select("id,published,url").eq("scholar_id","ibn-baz").range(f,f+999);for(const r of data??[]){t++;if(r.published)n++;if(u.has(r.url))dup++;u.add(r.url)}if(!data||data.length<1000)break}
console.log("ibn-baz total",t,"published",n,"duplicate urls",dup)})();
