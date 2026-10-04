import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { approvedForQuestion, type ApprovedAnswerDeps } from "@/lib/ask/approved";
import { preparedContentHash } from "@/lib/prepared-v2";
import topicJson from "@/data/topic-answers/quran-preserved.json";
import type { PreparedFile } from "@/lib/prepared";
import type { Answer } from "@/lib/ask/core";
import type { ReviewDecision } from "@/lib/content";

const topic = topicJson as unknown as PreparedFile;
const question = "How do we know the Quran was not changed?";
function setup(verdict: unknown = { verdict: "same" }) {
  const load = vi.fn(async () => ({ language: "en", prepared: true } as Answer));
  const generateJson = vi.fn(async () => verdict);
  const deps: ApprovedAnswerDeps = {
    common: {}, topics: { "quran-preserved": topic }, topicsEnabled: true, blockedCommon: new Set(),
    getReviews: async (kind): Promise<Record<string, ReviewDecision>> => kind === "topic" ? { "quran-preserved": { status: "approved", note: null, contentHash: preparedContentHash(topic) } } : {},
    getTopicQuestions: async () => [{ id: "quran-preserved", language: "en", question }],
    verifier: () => ({ id: "fake/checker", generateJson }), load,
  };
  return { deps, load, generateJson };
}
describe("approved topic answers in Ask", () => {
  it("uses published question wording without changing the approved file hash", async () => {
    const { deps, load, generateJson } = setup();
    expect(await approvedForQuestion(question, deps)).toMatchObject({ prepared: true });
    expect(load).toHaveBeenCalledWith({ ...topic, status: "approved" }, "en", { approvalHash: preparedContentHash(topic) });
    expect(generateJson).toHaveBeenCalledTimes(1);
    expect(topic.questions).toBeUndefined();
  });
  it.each(["draft", "rejected", "missing", "changed"])("does not publish %s approval", async (status) => {
    const { deps, load, generateJson } = setup();
    deps.getReviews = async (): Promise<Record<string, ReviewDecision>> => status === "missing" ? {} : { "quran-preserved": {
      status: status === "changed" ? "approved" : status as "draft" | "rejected",
      note: null, contentHash: status === "changed" ? "0".repeat(64) : preparedContentHash(topic),
    } };
    expect(await approvedForQuestion(question, deps)).toBeNull();
    expect(load).not.toHaveBeenCalled();
    expect(generateJson).not.toHaveBeenCalled();
  });
  it.each([{ verdict: "different" }, { verdict: "unsure" }, null, {}])("requires an unambiguous same-question verdict %j", async (verdict) => {
    const { deps, load } = setup(verdict);
    expect(await approvedForQuestion(`${question} What about a specific manuscript?`, deps)).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });
  it("falls through when source loading fails or the checker throws", async () => {
    const { deps, load } = setup();
    load.mockResolvedValueOnce(null as unknown as Answer);
    expect(await approvedForQuestion(question, deps)).toBeNull();
    deps.verifier = () => ({ id: "fake/checker", generateJson: async () => { throw new Error("busy"); } });
    expect(await approvedForQuestion(question, deps)).toBeNull();
  });
  it("keeps personal questions out and honors the topic switch", async () => {
    const { deps, load, generateJson } = setup();
    expect(await approvedForQuestion("My husband changed his religion, should I divorce him?", deps)).toBeNull();
    deps.topicsEnabled = false;
    expect(await approvedForQuestion(question, deps)).toBeNull();
    expect(load).not.toHaveBeenCalled();
    expect(generateJson).not.toHaveBeenCalled();
  });
  it("keeps common answers and unresolved-view exclusions working", async () => {
    const { deps, load } = setup();
    const common = { ...topic, questions: { en: [question] } };
    deps.topicsEnabled = false;
    deps.common = { common };
    deps.getReviews = async () => ({ common: { status: "approved", note: null, contentHash: preparedContentHash(common) } });
    expect(await approvedForQuestion(question, deps)).not.toBeNull();
    deps.blockedCommon = new Set(["common"]);
    expect(await approvedForQuestion(question, deps)).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
