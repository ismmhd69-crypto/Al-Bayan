import {beforeEach,afterEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const ask=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/ask/pipeline",()=>({ask}));
vi.mock("@/lib/ask/limits",()=>({askEnabled:()=>true,takeSlot:()=>"ok",visitorKey:()=>"fixture",withSlot:(f:()=>unknown)=>f()}));
import {POST} from "@/app/api/ask/stream/route";
import {consumeRichStream} from "@/lib/ask/rich-answer";
import {richAnswer,sections} from "./fixtures/rich";
import {readContinuationSession} from "@/lib/ask/continuation-session";
const tokens:string[]=[];
beforeEach(()=>{vi.stubEnv("NODE_ENV","development");vi.stubEnv("VERCEL","");vi.stubEnv("ASK_RICH_ENABLED","true");vi.stubEnv("ASK_STREAM_ENABLED","true");vi.stubEnv("ASK_SIMPLE_PIPELINE","true");ask.mockReset();});
afterEach(()=>{for(const token of tokens.splice(0))try{const s=readContinuationSession(token,"en");s.active=false;s.expires=0;}catch{}vi.unstubAllEnvs();});
const request=(body:object,cookie="")=>new Request("http://localhost:3000/api/ask/stream",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json",cookie},body:JSON.stringify({lang:"en",stream_version:3,...body})});
it("returns the same active status to duplicates and rejects another visitor's token",async()=>{
  let release!:()=>void;const wait=new Promise<void>(r=>{release=r;});
  ask.mockImplementation(async()=>{await wait;return {status:"incomplete",language:"en",withdraw:false};});
  const first=await POST(request({question:"Explain care"})),cookie=first.headers.get("set-cookie")!.split(";")[0];
  expect(cookie).toContain("bayan_ask_session_v1=");
  const events:any[]=[],reading=consumeRichStream(first.body!,e=>{events.push(e);});
  await vi.waitFor(()=>expect(events[0]?.type).toBe("continuation"));
  const token=events[0].continuation.token;tokens.push(token);
  const duplicate=await POST(request({question:"Explain care"},cookie)),status=await duplicate.json();
  expect(status.status).toBe("research_busy");expect(status.continuation.token).toBe(token);expect(ask).toHaveBeenCalledOnce();
  const stranger=await POST(request({continue_token:token,action:"status"}));expect(stranger.status).toBe(409);expect(await stranger.json()).toMatchObject({status:"research_expired"});
  release();await reading;
});
it("records explicit Stop separately from an interrupted connection",async()=>{
  let release!:()=>void;const wait=new Promise<void>(r=>{release=r;});
  ask.mockImplementation(async()=>{await wait;return {status:"incomplete",language:"en",withdraw:false};});
  const first=await POST(request({question:"Explain care"})),cookie=first.headers.get("set-cookie")!.split(";")[0];
  const events:any[]=[],reading=consumeRichStream(first.body!,e=>{events.push(e);});await vi.waitFor(()=>expect(events[0]?.type).toBe("continuation"));
  const token=events[0].continuation.token;tokens.push(token);
  expect(await (await POST(request({continue_token:token,action:"stop"},cookie))).json()).toMatchObject({status:"research_cancelled"});
  release();await reading;expect(readContinuationSession(token,"en").cancelled).toBe(true);
  expect(await (await POST(request({continue_token:token},cookie))).json()).toMatchObject({status:"research_cancelled"});
});
it("blocks Continue after a completed negative review without clearing sources",async()=>{
  ask.mockImplementation(async(_q,_l,_t,_h,options)=>{
    options.checkpoint.simple={version:1,recoveryUsed:true,correctionUsed:true,gaps:["R1"],queries:[],terminalNegative:true};
    sections.slice(0,3).forEach(s=>options.rich.onSection(s));
    return {status:"incomplete",language:"en",withdraw:false,sections:sections.slice(0,3),failureKind:"question_coverage"};
  });
  const response=await POST(request({question:"Explain care"})),cookie=response.headers.get("set-cookie")!.split(";")[0],events:any[]=[];
  await consumeRichStream(response.body!,e=>{events.push(e);});const continuation=events.filter(e=>e.type==="continuation").at(-1).continuation;
  tokens.push(continuation.token);expect(continuation.available).toBe(false);expect(events.filter(e=>e.type==="section_committed")).toHaveLength(3);
  expect(await (await POST(request({continue_token:continuation.token},cookie))).json()).toMatchObject({status:"research_limit"});expect(ask).toHaveBeenCalledOnce();
});
