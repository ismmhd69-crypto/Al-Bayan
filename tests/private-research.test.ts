import {afterEach,expect,it,vi} from "vitest";
import {privateResearchOwner,privateResearch,normalizedResearchText} from "@/lib/ask/private-research";
import {claimContinuationSession,finishContinuationSession,continuationTransport,continuationAvailable,type ContinuationSession} from "@/lib/ask/continuation-session";
import {withResearchRuntime} from "@/lib/ask/research-runtime";
const sessions:ContinuationSession[]=[];
const owner=()=>privateResearchOwner(null).owner;
function record(visitor:string,q="Invented public question",history:string[]=[],lang:"en"|"ar"="en",now=Date.now()) {
  const result=privateResearch(visitor,q,lang,history,now);if(!sessions.includes(result.session))sessions.push(result.session);return result;
}
afterEach(()=>{for(const s of sessions.splice(0)){s.active=false;s.expires=0;}vi.unstubAllEnvs();});
it("signs a browser session identity and rejects forged cookies",()=>{
  const first=privateResearchOwner(null),cookie=first.cookie.split(";")[0];
  expect(privateResearchOwner(cookie).owner).toBe(first.owner);
  expect(privateResearchOwner(cookie.slice(0,-1)+(cookie.endsWith("0")?"1":"0")).owner).not.toBe(first.owner);
  expect(first.cookie).toContain("HttpOnly");expect(first.cookie).toContain("SameSite=Lax");expect(first.cookie).not.toContain("Max-Age");
});
it("normalizes Unicode and whitespace only, retaining meaningful words and case",()=>{
  expect(normalizedResearchText(" e\u0301  question ")).toBe("é question");
  const visitor=owner(),r=record(visitor," e\u0301  question ");
  expect(record(visitor,"é question").token).toBe(r.token);
  expect(record(visitor,"É question").token).not.toBe(r.token);
  expect(record(visitor,"é other question").token).not.toBe(r.token);
});
it("isolates visitors, languages, conversation contexts and policy versions",()=>{
  const visitor=owner(),r=record(visitor);
  expect(record(owner()).token).not.toBe(r.token);
  expect(record(visitor,undefined,[],"ar").token).not.toBe(r.token);
  expect(record(visitor,undefined,["different earlier concern"]).token).not.toBe(r.token);
  vi.stubEnv("ASK_SIMPLE_PIPELINE","true");expect(record(visitor).token).not.toBe(r.token);
});
it("returns an existing active status and retains counters across Continue",()=>{
  const visitor=owner(),r=record(visitor);claimContinuationSession(r.token,"en");
  r.session.calls=4;r.session.checkpoint.simple={version:1,recoveryUsed:true,correctionUsed:true,queries:[],gaps:[]};
  expect(record(visitor).mode).toBe("busy");expect(record(visitor).token).toBe(r.token);
  finishContinuationSession(r.session,false);claimContinuationSession(r.token,"en");
  expect(r.session.calls).toBe(4);expect(r.session.checkpoint.simple.correctionUsed).toBe(true);expect(r.session.checkpoint.simple.recoveryUsed).toBe(true);
});
it("never converts a completed negative review into another paid try",()=>{
  const visitor=owner(),r=record(visitor);r.session.checkpoint.simple={version:1,recoveryUsed:true,correctionUsed:true,queries:[],gaps:["R1"],terminalNegative:true};
  expect(record(visitor).mode).toBe("negative");expect(record(visitor).token).toBe(r.token);
  expect(continuationAvailable(r.session)).toBe(false);expect(()=>claimContinuationSession(r.token,"en")).toThrow("research_limit");
});
it("does not expire running work, but discards idle expired records",()=>{
  const visitor=owner(),r=record(visitor),future=Date.now()+21*60_000;r.session.active=true;
  expect(record(visitor,undefined,[],"en",future).token).toBe(r.token);
  r.session.active=false;r.session.expires=0;
  expect(record(visitor,undefined,[],"en",future).token).not.toBe(r.token);
});
it("holds an uncertain charge even when the question is submitted again",()=>{
  const visitor=owner(),r=record(visitor);r.session.held=true;
  expect(()=>record(visitor)).toThrow("research_billing_uncertain");expect(r.session.held).toBe(true);
});
it("caps actual dispatches at nine including provider fallback and Continue",async()=>{
  const r=record(owner()),send=vi.fn(async()=>Response.json({choices:[{message:{content:"{}"}}],usage:{cost:0.00001}}));
  claimContinuationSession(r.token,"en");
  const request=(i:number)=>({method:"POST",body:JSON.stringify({model:`fallback-${i}`,max_tokens:10,provider:{data_collection:"deny",zdr:true},messages:[{role:"user",content:`fixture ${i}`}]})});
  const url="https://openrouter.ai/api/v1/chat/completions";
  await withResearchRuntime(Infinity,async()=>{
    let transport=continuationTransport(r.session,send);
    for(let i=0;i<5;i++) await transport(url,request(i));
    finishContinuationSession(r.session,false);claimContinuationSession(r.token,"en");transport=continuationTransport(r.session,send);
    for(let i=5;i<9;i++) await transport(url,request(i));
    await expect(transport(url,request(9))).rejects.toThrow("research_limit");
  });
  expect(send).toHaveBeenCalledTimes(9);expect(r.session.calls).toBe(9);expect(continuationAvailable(r.session)).toBe(false);
});
it("cannot dispatch a model while serving an approved cache-only answer",async()=>{
  const r=record(owner()),send=vi.fn();r.session.complete=true;claimContinuationSession(r.token,"en",undefined,true);
  await expect(continuationTransport(r.session,send)("https://openrouter.ai/api/v1/chat/completions",{method:"POST",body:JSON.stringify({model:"fixture",max_tokens:10,provider:{data_collection:"deny"},messages:[{content:"fixture"}]})})).rejects.toThrow("research_limit");
  expect(send).not.toHaveBeenCalled();expect(r.session.calls).toBe(0);
});
it("bounds the private in-memory record count at sixteen",()=>{
  const visitor=owner();for(let i=0;i<16;i++)record(visitor,`question ${i}`);
  expect(()=>record(visitor,"seventeenth")).toThrow("research_limit");
});

it("allows an approved zero-call reuse after the paid continuation allowance is spent",()=>{
  const r=record(owner());r.session.complete=true;r.session.runs=4;r.session.calls=9;
  expect(()=>claimContinuationSession(r.token,"en",undefined,true)).not.toThrow();expect(r.session.runs).toBe(4);expect(r.session.calls).toBe(9);
});
