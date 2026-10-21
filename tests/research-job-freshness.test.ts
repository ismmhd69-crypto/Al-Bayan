import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  aliases: [] as Record<string, unknown>[],
  rights: [] as object[],
  metadata: new Map<string, unknown>(),
  reviews: {} as Record<string, unknown>,
  freshPrepared: null as unknown,
  verse: null as unknown,
  hadith: null as unknown,
}));
const official = vi.hoisted(() => vi.fn(async () => true));
const translation = vi.hoisted(() => vi.fn(async () => new Map()));
const file = vi.hoisted(() => ({
  status: "draft",
  questions: { en: ["Synthetic question"] },
  sources: [],
  answers: {
    en: { direct_answer: [], explanation: [] },
    ar: { direct_answer: [], explanation: [] },
    de: { direct_answer: [], explanation: [] },
  },
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        limit: () => q,
        abortSignal: () => q,
        maybeSingle: async () => ({ data: state.row, error: null }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data: state.aliases, error: null }).then(resolve),
      };
      return q;
    },
    rpc: () => ({
      abortSignal: async () => ({ data: state.rights, error: null }),
    }),
  }),
}));
vi.mock("@/lib/sources/quran", () => ({ getVerse: async () => state.verse }));
vi.mock("@/lib/sources/hadith", () => ({
  getHadith: async () => state.hadith,
}));
vi.mock("@/lib/sources/hadith-library", () => ({
  getLibraryHadith: async () => state.hadith,
}));
vi.mock("@/lib/sources/index-source-state", () => ({
  currentIndexSourceStates: async () => state.metadata,
}));
vi.mock("@/lib/sources/scholars-live", () => ({
  verifyOfficialScholarExcerpt: official,
}));
vi.mock("@/lib/content", () => ({
  getScholarNames: async () => ({
    "ibn-baz": { en: "Ibn Baz", ar: "ابن باز", de: "Ibn Baz" },
  }),
  getReviewDecisions: async () => state.reviews,
}));
vi.mock("@/data/prepared-answers", () => ({
  PREPARED_ANSWERS: { synthetic: file },
}));
vi.mock("@/data/topic-answers", () => ({ TOPIC_ANSWERS: {} }));
vi.mock("@/lib/prepared", () => ({
  loadPrepared: async () => state.freshPrepared,
}));
vi.mock("@/lib/ask/display-translation-lookup", () => ({
  lookupDisplayTranslations: translation,
}));
import { serverJobFreshness } from "@/lib/ask/search-engine/server-job-freshness";
import { preparedContentHash } from "@/lib/prepared-v2";
import type { PreparedFile } from "@/lib/prepared";
import type { Answer } from "@/lib/ask/core";
import { sections, pack } from "./fixtures/rich";

const signal = () => new AbortController().signal;
beforeEach(() => {
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "https://jnietkyxgnocyizvjiel.supabase.co",
  );
  vi.stubEnv("SUPABASE_SECRET_KEY", "offline-fake");
  vi.stubEnv("SCHOLAR_QUOTES", "on");
  vi.stubEnv("SCHOLARS_LIVE", "on");
  vi.stubEnv("PREPARED_PUBLISHING_ENABLED", "true");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network_forbidden_in_offline_test");
    }),
  );
  state.row = null;
  state.aliases = [];
  state.rights = [];
  state.metadata = new Map();
  state.reviews = {};
  state.freshPrepared = null;
  state.verse = null;
  state.hadith = null;
  official.mockClear();
  translation.mockClear();
  translation.mockResolvedValue(new Map());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("actual reconnect source adapter with offline providers", () => {
  it("withholds a Quran explanation if the original has changed instead of replacing the verse", async () => {
    const original = pack.passages[0].source;
    if (original.kind !== "quran") throw new Error("fixture");
    state.verse = original.verse;
    expect(
      await serverJobFreshness().evidence(
        sections[0].sources[0],
        "en",
        signal(),
      ),
    ).toBe("valid");
    state.verse = {
      ...original.verse,
      arabic: `${original.verse.arabic} تغيير`,
    };
    expect(
      await serverJobFreshness().evidence(
        sections[0].sources[0],
        "en",
        signal(),
      ),
    ).toBe("changed");
  });
  it("does not turn an unavailable Quran provider into a claim of absent evidence", async () => {
    expect(
      await serverJobFreshness().evidence(
        sections[0].sources[0],
        "en",
        signal(),
      ),
    ).toBe("unavailable");
  });
  it("checks exact stored scholarly originals and attribution against current rights", async () => {
    const source = sections[2].sources[0],
      e = source.evidence;
    if (e.kind !== "scholar") throw new Error("fixture");
    state.row = {
      id: e.key.slice(1),
      kind: "fatwa",
      published: true,
      scholar_id: e.scholarId,
      title: e.title,
      reference: e.reference,
      text_original: e.arabic,
      url: e.url,
    };
    state.metadata.set(e.key.slice(1), {
      parentOriginalHash: createHash("sha256").update(e.arabic).digest("hex"),
    });
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "valid",
    );
    state.metadata.clear();
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "changed",
    );
    expect(official).not.toHaveBeenCalled();
  });
  it("never bypasses an unpublished stored quote by treating it as a live result", async () => {
    const source = sections[2].sources[0];
    state.row = { id: source.id.slice(1), kind: "fatwa", published: false };
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "changed",
    );
    expect(official).not.toHaveBeenCalled();
  });
  it("does not bypass a withdrawn quote under another id or presentation slug", async () => {
    const source = sections[2].sources[0];
    state.aliases = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        published: false,
        url: "https://binbaz.org.sa/fatwas/9/different-slug",
      },
    ];
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "changed",
    );
    expect(official).not.toHaveBeenCalled();
  });
  it("requires current site permission before rechecking a live scholar quote", async () => {
    const source = sections[2].sources[0];
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "changed",
    );
    expect(official).not.toHaveBeenCalled();
    state.rights = [
      {
        owner: "binbaz.org.sa",
        status: "short_quotes_only",
        max_quote_chars: 600,
      },
    ];
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "valid",
    );
    expect(official).toHaveBeenCalledOnce();
  });
  it("does not keep a ready translation after its exact current record is withdrawn", async () => {
    const source = structuredClone(sections[2].sources[0]),
      e = source.evidence;
    if (e.kind !== "scholar") throw new Error("fixture");
    state.rights = [
      {
        owner: "binbaz.org.sa",
        status: "short_quotes_only",
        max_quote_chars: 600,
      },
    ];
    source.displayTranslation = {
      status: "ready",
      text: "Synthetic translation.",
      language: "en",
      origin: "ai",
      original: e.arabic,
      originalHash: createHash("sha256").update(e.arabic).digest("hex"),
    };
    expect(await serverJobFreshness().evidence(source, "en", signal())).toBe(
      "changed",
    );
  });
  it("checks current exact prepared approval without another model call", async () => {
    const hash = preparedContentHash(file as PreparedFile);
    const answer = {
      language: "en",
      v2: {
        origin: "prepared",
        provenance: { approval_hash: hash },
        scholars: [],
      },
    } as unknown as Answer;
    state.freshPrepared = answer;
    state.reviews = { synthetic: { status: "approved", contentHash: hash } };
    expect(await serverJobFreshness().prepared(answer, signal())).toBe("valid");
    state.reviews = { synthetic: { status: "rejected", contentHash: hash } };
    expect(await serverJobFreshness().prepared(answer, signal())).toBe(
      "changed",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
