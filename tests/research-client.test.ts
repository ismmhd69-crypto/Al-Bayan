import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { researchClient } from "@/lib/ask/research-client";
import { richAnswer, sections } from "./fixtures/rich";
const scope = "a".repeat(32),
  id = "00000000-0000-4000-8000-000000000001";
const reply = (value: object, code = 200) =>
  new Response(JSON.stringify({ version: 1, scope, ...value }), {
    status: code,
    headers: { "content-type": "application/json" },
  });
function setup() {
  const records = new Map<string, string>();
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => {
      records.set(key, value);
    },
    removeItem: (key: string) => {
      records.delete(key);
    },
  };
  const events = sections.map((section, i) => ({
    request_id: id,
    sequence: i + 1,
    type: "section",
    section,
  }));
  const full = [
    ...events,
    {
      request_id: id,
      sequence: 5,
      type: "terminal",
      result: { status: "rich_answer", answer: richAnswer },
    },
  ];
  const send = vi.fn<typeof fetch>(async (input) => {
    const path = String(input);
    if (path.endsWith("/session")) return reply({ status: "ready" });
    if (path.endsWith("/find"))
      return reply({
        status: "job",
        id,
        language: "en",
        state: "running",
        question: "Original private question",
      });
    if (path.endsWith("/cancel"))
      return reply({ status: "job", id, state: "cancelled" });
    if (path.endsWith("/read"))
      return reply({
        status: "job",
        id,
        language: "en",
        state: "complete",
        sequence: 5,
        events: full,
      });
    return reply({ status: "job", id, state: "queued", sequence: 0 }, 202);
  });
  const options = {
    language: "en" as const,
    getToken: async () => "private-auth-token",
    storage: () => storage,
    fetch: send,
  };
  return {
    records,
    storage,
    send,
    options,
    client: researchClient(options),
    full,
  };
}
const signal = () => new AbortController().signal;
afterEach(() => vi.useRealTimers());
describe("resumable browser research transport", () => {
  it("retains a paused patient job without starting another request", async () => {
    const { options, send } = setup(), base = send.getMockImplementation()!;
    const onPatientState = vi.fn();
    send.mockImplementation(async (input, init) => String(input).endsWith("/read") ? reply({ version: 2, status: "job", id, language: "en", state: "paused", sequence: 1,
      events: [{ version: 2, job_id: id, sequence: 1, type: "pause", reason: "source_failed" }] }) : base(input, init));
    const client = researchClient({ ...options, onPatientState });
    const pending = await client.begin("Question", [], { chatId: null, position: 1 }, signal());
    expect((await client.observe(pending, vi.fn(), signal())).result).toMatchObject({ status: "patient_paused" });
    expect(onPatientState).toHaveBeenLastCalledWith(expect.objectContaining({ status: "paused", jobId: id }));
    expect(send.mock.calls.filter(([url]) => String(url).endsWith("/continue"))).toHaveLength(0);
    expect(send.mock.calls.filter(([url]) => String(url) === "/api/ask/jobs")).toHaveLength(1);
  });
  it("rejects malformed patient events immediately without reconnect retries", async () => {
    const { options, send } = setup(), base = send.getMockImplementation()!;
    const onPatientState = vi.fn();
    send.mockImplementation(async (input, init) => String(input).endsWith("/read") ? reply({ version: 2, status: "job", id, language: "en", state: "paused", sequence: 2,
      events: [{ version: 2, job_id: id, sequence: 2, type: "pause", reason: "source_failed" }] }) : base(input, init));
    const client = researchClient({ ...options, onPatientState });
    const pending = await client.begin("Question", [], { chatId: null, position: 1 }, signal());
    await expect(client.observe(pending, vi.fn(), signal())).rejects.toMatchObject({ code: "invalid_response" });
    expect(send.mock.calls.filter(([url]) => String(url).endsWith("/read"))).toHaveLength(1);
    expect(onPatientState).toHaveBeenCalledExactlyOnceWith(null);
  });
  it("does not display patient progress before the response sequence is validated", async () => {
    const { options, send } = setup(), base = send.getMockImplementation()!;
    const onPatientState = vi.fn();
    send.mockImplementation(async (input, init) => String(input).endsWith("/read") ? reply({ version: 2, status: "job", id, language: "en", state: "paused", sequence: 9,
      events: [{ version: 2, job_id: id, sequence: 1, type: "pause", reason: "source_failed" }] }) : base(input, init));
    const client = researchClient({ ...options, onPatientState });
    const pending = await client.begin("Question", [], { chatId: null, position: 1 }, signal());
    await expect(client.observe(pending, vi.fn(), signal())).rejects.toMatchObject({ code: "invalid_response" });
    expect(onPatientState).toHaveBeenCalledExactlyOnceWith(null);
  });
  it("stores only scoped opaque metadata and observes a checked terminal result", async () => {
    const { client, records, send } = setup();
    const pending = await client.begin(
      "Original private question",
      [],
      { chatId: null, position: 1 },
      signal(),
    );
    const stored = JSON.stringify([...records]);
    expect(stored).not.toContain("Original private question");
    expect(stored).not.toContain("private-auth-token");
    const states: unknown[] = [];
    const result = await client.observe(
      pending,
      (state) => states.push(state),
      signal(),
    );
    expect(result.result).toMatchObject({ status: "rich_answer" });
    expect(states).toHaveLength(1);
    expect(
      send.mock.calls.filter((c) => String(c[0]) === "/api/ask/jobs"),
    ).toHaveLength(1);
    client.acknowledge(pending);
    expect(records.size).toBe(0);
  });
  it("recovers a lost enqueue response through FIND and never repeats the paid start", async () => {
    const { options, send } = setup(),
      base = send.getMockImplementation()!;
    send.mockImplementation(async (input, init) => {
      if (String(input) === "/api/ask/jobs")
        throw new TypeError("network lost after enqueue");
      return base(input, init);
    });
    const client = researchClient(options),
      pending = await client.begin(
        "Original private question",
        [],
        { chatId: null, position: 1 },
        signal(),
      );
    expect(pending.question).toBe("Original private question");
    expect(pending.locator.id).toBe(id);
    expect(
      send.mock.calls.filter((c) => String(c[0]) === "/api/ask/jobs"),
    ).toHaveLength(1);
    expect(send.mock.calls.some((c) => String(c[0]).endsWith("/find"))).toBe(
      true,
    );
  });
  it("restores a pending job after reload without storing its question or creating a new job", async () => {
    const { client, options, send } = setup();
    await client.begin(
      "Original private question",
      [],
      { chatId: null, position: 1 },
      signal(),
    );
    send.mockClear();
    const recovered = await researchClient(options).pending(signal());
    expect(recovered?.question).toBe("Original private question");
    expect(send.mock.calls.some((c) => String(c[0]) === "/api/ask/jobs")).toBe(
      false,
    );
  });
  it("retries an interrupted observation against the same job without another start", async () => {
    vi.useFakeTimers();
    const { client, send } = setup();
    const pending = await client.begin(
      "Original private question",
      [],
      { chatId: null, position: 1 },
      signal(),
    );
    const base = send.getMockImplementation()!;
    let failed = false;
    send.mockImplementation(async (input, init) => {
      if (String(input).endsWith("/read") && !failed) {
        failed = true;
        throw new TypeError("offline");
      }
      return base(input, init);
    });
    const running = client.observe(pending, () => {}, signal());
    await vi.advanceTimersByTimeAsync(1001);
    expect((await running).result).toMatchObject({ status: "rich_answer" });
    expect(
      send.mock.calls.filter((c) => String(c[0]) === "/api/ask/jobs"),
    ).toHaveLength(1);
    expect(
      send.mock.calls
        .filter((c) => String(c[0]).endsWith("/read"))
        .every((c) => JSON.parse(String(c[1]?.body)).id === id),
    ).toBe(true);
  });
  it("Stop uses the submission key even when a job id has not returned", async () => {
    const { options, send } = setup(),
      base = send.getMockImplementation()!;
    let release: (() => void) | undefined;
    send.mockImplementation(async (input, init) =>
      String(input) === "/api/ask/jobs"
        ? new Promise((resolve) => {
            release = () =>
              resolve(reply({ status: "job", id, state: "cancelled" }));
          })
        : base(input, init),
    );
    const client = researchClient(options),
      running = client.begin(
        "Original private question",
        [],
        { chatId: null, position: 1 },
        signal(),
      );
    const rejected = expect(running).rejects.toMatchObject({
      code: "cancelled",
    });
    await vi.waitFor(() => expect(release).toBeDefined());
    expect(client.current()?.id).toBeNull();
    expect(await client.stop()).toBe("cancelled");
    release!();
    await rejected;
    const call = send.mock.calls.find((c) => String(c[0]).endsWith("/cancel"));
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      key: expect.any(String),
      lang: "en",
    });
  });
  it("withdraws material on a scope change rather than showing another account's answer", async () => {
    const { client, send } = setup(),
      pending = await client.begin(
        "Original private question",
        [],
        { chatId: null, position: 1 },
        signal(),
      );
    send.mockImplementation(async () =>
      reply({
        status: "job",
        scope: "b".repeat(32),
        id,
        language: "en",
        state: "complete",
        sequence: 0,
        events: [],
      }),
    );
    const receive = vi.fn();
    await expect(
      client.observe(pending, receive, signal()),
    ).rejects.toMatchObject({ code: "scope_changed" });
    expect(receive).toHaveBeenCalledWith(
      expect.objectContaining({ withdrawn: true, sections: [] }),
    );
  });
  it("does not let an old completion clear the locator of a newer question", async () => {
    const { client, records } = setup();
    const old = await client.begin(
      "First",
      [],
      { chatId: null, position: 1 },
      signal(),
    );
    const next = await client.begin(
      "Second",
      [],
      { chatId: null, position: 1 },
      signal(),
    );
    client.acknowledge(old);
    expect(JSON.parse([...records.values()][0]).key).toBe(next.locator.key);
  });
});
