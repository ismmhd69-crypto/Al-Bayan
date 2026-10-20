import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { handleResearchJob, type JobApiDeps, type ResearchAction } from "@/lib/ask/search-engine/job-api";
import { researchOwners } from "@/lib/ask/search-engine/job-owner";
import { verifyResearchJob } from "@/lib/ask/search-engine/job-freshness";
import { ResearchStorageError, type ResearchJobView } from "@/lib/ask/search-engine/job-store";
import { richAnswer, sections } from "./fixtures/rich";

const id="00000000-0000-4000-8000-000000000001",key="00000000-0000-4000-8000-000000000002";
const origin="https://bayan.test",owners=researchOwners(Buffer.alloc(32,5).toString("base64"));
const signedCookie=()=>`bayan_research_v1=${owners.mint()}`;
function request(action:ResearchAction,body:unknown={},headers:Record<string,string>={}){
  return new Request(`${origin}/api/ask/jobs/${action}`,{method:"POST",headers:{origin,"content-type":"application/json",...headers},body:JSON.stringify(body)});
}
function view():ResearchJobView{
  const events=sections.map((section,i)=>({sequence:i+1,payload:{request_id:id,sequence:i+1,type:"section",section}}));
  return {id,language:"en",state:"complete",sequence:5,expiresAt:"2027-01-01T00:00:00Z",events:[...events,{sequence:5,payload:{request_id:id,sequence:5,type:"terminal",result:{status:"rich_answer",answer:richAnswer}}}]};
}
function setup(){
  const deps:JobApiDeps={owners,engineRevision:"f".repeat(64),maxCostUsd:0.2,
    verifyUser:vi.fn(async token=>token==="valid"?"user-a":token==="second"?"user-b":null),
    freshness:{evidence:vi.fn(async()=>"valid" as const),prepared:vi.fn(async()=>"valid" as const)},
    store:{enqueue:vi.fn(async()=>({id,state:"queued" as const,sequence:0})),read:vi.fn(async()=>view()),cancel:vi.fn(async()=>({...view(),state:"cancelled" as const}))},
  };
  return deps;
}
afterEach(()=>vi.unstubAllEnvs());

describe("owned research job API",()=>{
  it("bootstraps a signed HttpOnly session before a paid submission",async()=>{
    const deps=setup(),res=await handleResearchJob(request("session"),"session",deps);
    expect(res.status).toBe(200);expect(await res.json()).toMatchObject({version:1,status:"ready"});
    expect(res.headers.get("set-cookie")).toContain("HttpOnly; SameSite=Strict");
    expect(res.headers.get("set-cookie")).toContain("Secure");
    expect(deps.store.enqueue).not.toHaveBeenCalled();
  });
  it("never enqueues while the anonymous session is absent or forged",async()=>{
    const deps=setup();
    for(const cookie of ["",`bayan_research_v1=${"a".repeat(64)}.${"b".repeat(64)}`]){
      const res=await handleResearchJob(request("start",{question:"Explain care",lang:"en"},{cookie,"idempotency-key":key}),"start",deps);
      expect(res.status).toBe(401);
    }
    expect(deps.store.enqueue).not.toHaveBeenCalled();
  });
  it("uses the same signed owner and idempotency hash when a submission is retried",async()=>{
    const deps=setup(),cookie=signedCookie();
    for(let i=0;i<2;i++)expect((await handleResearchJob(request("start",{question:"Explain care",lang:"en",engineRevision:"visitor override"},{cookie,"idempotency-key":key}),"start",deps)).status).toBe(202);
    const calls=vi.mocked(deps.store.enqueue).mock.calls;
    expect(calls[0][0].owner).toBe(calls[1][0].owner);expect(calls[0][0].dedupe).toBe(calls[1][0].dedupe);
    expect(calls[0][0].request).toMatchObject({engineRevision:deps.engineRevision});
    expect(calls[0][0].requestHash).toBe(calls[1][0].requestHash);
  });
  it("rejects an invalid bearer rather than falling back to an anonymous cookie",async()=>{
    const deps=setup();
    const res=await handleResearchJob(request("read",{id},{cookie:signedCookie(),authorization:"Bearer invalid"}),"read",deps);
    expect(res.status).toBe(401);expect(deps.store.read).not.toHaveBeenCalled();
  });
  it("keeps signed-in owners separate when accounts change",async()=>{
    const deps=setup();let firstOwner="";
    deps.store.read=vi.fn(async(_,owner)=>{if(!firstOwner)firstOwner=owner;else if(firstOwner!==owner)throw new ResearchStorageError("not_found");return view();});
    expect((await handleResearchJob(request("read",{id},{authorization:"Bearer valid"}),"read",deps)).status).toBe(200);
    expect((await handleResearchJob(request("read",{id},{authorization:"Bearer second"}),"read",deps)).status).toBe(404);
  });
  it("checks all earlier sources even when the visitor already received their events",async()=>{
    const deps=setup(),res=await handleResearchJob(request("read",{id,after:4},{cookie:signedCookie()}),"read",deps);
    const data=await res.json();expect(data.events).toHaveLength(1);expect(data.events[0].type).toBe("terminal");
    expect(deps.store.read).toHaveBeenCalledWith(id,expect.any(String),0);expect(deps.freshness.evidence).toHaveBeenCalledTimes(3);
  });
  it("withdraws changed evidence and stops remaining work without returning unsafe text",async()=>{
    const deps=setup();deps.freshness.evidence=async()=>"changed";
    const res=await handleResearchJob(request("read",{id},{cookie:signedCookie()}),"read",deps);
    expect(res.status).toBe(409);const data=await res.json();expect(data).toMatchObject({status:"sources_changed",withdraw:true});
    expect(data.events).toBeUndefined();expect(deps.store.cancel).toHaveBeenCalledOnce();
  });
  it("distinguishes a refresh outage from a changed source and does not resubmit research",async()=>{
    const deps=setup();deps.freshness.evidence=async()=>"unavailable";
    const res=await handleResearchJob(request("read",{id},{cookie:signedCookie()}),"read",deps);
    expect(res.status).toBe(503);expect(await res.json()).toMatchObject({status:"source_refresh_failed",withdraw:true});
    expect(deps.store.enqueue).not.toHaveBeenCalled();expect(deps.store.cancel).not.toHaveBeenCalled();
  });
  it("Stop returns only status, never unchecked stored sections",async()=>{
    const deps=setup(),res=await handleResearchJob(request("cancel",{id},{cookie:signedCookie()}),"cancel",deps);
    const data=await res.json();expect(data.state).toBe("cancelled");expect(data.events).toBeUndefined();
    expect(deps.freshness.evidence).not.toHaveBeenCalled();
  });
  it("rejects cross-site requests, invalid cursors and oversized chunked bodies",async()=>{
    const deps=setup();
    expect((await handleResearchJob(request("read",{id},{origin:"https://other.test"}),"read",deps)).status).toBe(403);
    expect((await handleResearchJob(request("read",{id,after:999},{cookie:signedCookie()}),"read",deps)).status).toBe(400);
    const big=new Request(`${origin}/api/ask/jobs`,{method:"POST",headers:{origin,"content-type":"application/json"},body:" ".repeat(13000)});
    expect((await handleResearchJob(big,"start",deps)).status).toBe(413);
    expect(deps.store.enqueue).not.toHaveBeenCalled();
  });
  it("never returns owner hashes or caches a response",async()=>{
    const deps=setup(),res=await handleResearchJob(request("read",{id},{cookie:signedCookie()}),"read",deps);
    expect(res.headers.get("cache-control")).toContain("no-store");
    const data=await res.json();expect(data.owner).toBeUndefined();expect(data.request).toBeUndefined();
  });
});

describe("reconnect source and approval checking",()=>{
  it("rejects mismatched originals under a reused source id",async()=>{
    const deps=setup(),v=view();
    const final=v.events.at(-1)!.payload as {result:{answer:typeof richAnswer}};
    const answer=structuredClone(final.result.answer);answer.sections[3].sources[0].evidence.arabic+=" تغيير";
    final.result.answer=answer;
    expect(await verifyResearchJob(v,deps.freshness,new AbortController().signal)).not.toBe("valid");
  });
  it("rejects a completion without its delivered sections",async()=>{
    const deps=setup(),v=view();v.events=[{sequence:1,payload:{request_id:id,sequence:1,type:"terminal",result:{status:"rich_answer",answer:richAnswer}}}];v.sequence=1;
    expect(await verifyResearchJob(v,deps.freshness,new AbortController().signal)).not.toBe("valid");
  });
  it("rejects another job's event identity before looking up sources",async()=>{
    const deps=setup(),v=view();(v.events[0].payload as {request_id:string}).request_id=key;
    expect(await verifyResearchJob(v,deps.freshness,new AbortController().signal)).toBe("changed");
    expect(deps.freshness.evidence).not.toHaveBeenCalled();
  });
});
