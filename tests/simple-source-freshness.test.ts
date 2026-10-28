import {beforeEach,afterEach,it,expect,vi} from "vitest";
vi.mock("server-only",()=>({}));
beforeEach(()=>{vi.resetModules();vi.stubEnv("ASK_LOCAL_TRACE","false");vi.stubEnv("QURAN_FOUNDATION_CLIENT_ID","fake");vi.stubEnv("QURAN_FOUNDATION_CLIENT_SECRET","fake");vi.stubEnv("QURAN_API_ENV","production");vi.stubEnv("QURAN_CHAPTERS","");});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("bypasses the day-long Quran cache when rechecking originals and context",async()=>{
  const reads:RequestInit[]=[];
  vi.stubGlobal("fetch",vi.fn(async(url:string,init:RequestInit)=>{
    if(url.includes("oauth2/token"))return Response.json({access_token:"fixture",expires_in:3600});
    reads.push(init);const key=url.match(/by_key\/([0-9:]+)/)?.[1];
    return Response.json({verse:{verse_key:key,text_uthmani:"نص تجريبي فقط",text_imlaei_simple:"نص تجريبي فقط",translations:[]}});
  }));
  const {getVerse,neighbours}=await import("@/lib/sources/quran");
  await getVerse("2:183");expect(reads[0]).toMatchObject({next:{revalidate:86400}});
  await getVerse("2:183",true);await neighbours("2:183",true);
  expect(reads).toHaveLength(4);for(const read of reads.slice(1)){expect(read.cache).toBe("no-store");expect(read).not.toHaveProperty("next");}
});
it("bypasses the hadith cache without loading German for an English reader",async()=>{
  const reads:{url:string;init:RequestInit}[]=[];
  vi.stubGlobal("fetch",vi.fn(async(url:string,init:RequestInit)=>{reads.push({url,init});return Response.json({});}));
  const {getHadith}=await import("@/lib/sources/hadith");await getHadith("9001","en",true);
  expect(reads).toHaveLength(2);expect(reads.every(r=>r.init.cache==="no-store" && !r.url.includes("language=de"))).toBe(true);
});
