import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveCheckedExchange } from "@/lib/chat/save-exchange";
import { richAnswer } from "./fixtures/rich";

const exchangeId = "00000000-0000-4000-8000-000000000001";
function database() {
  const tables: {
    chats: Record<string, unknown>[];
    chat_turns: Record<string, unknown>[];
  } = { chats: [], chat_turns: [] };
  let failTurn = false,
    failChat = false;
  const db = {
    from: (name: keyof typeof tables) => {
      let inserted: Record<string, unknown> | undefined,
        filterId: string | undefined;
      const execute = async () => {
        if (!inserted)
          return {
            data: tables[name].find((row) => row.id === filterId) ?? null,
            error: null,
          };
        if (tables[name].some((row) => row.id === inserted!.id))
          return { data: null, error: { code: "23505" } };
        const row = { ...inserted, id: inserted.id ?? crypto.randomUUID() };
        tables[name].push(row);
        if (
          (name === "chat_turns" && failTurn) ||
          (name === "chats" && failChat)
        ) {
          failTurn = false;
          failChat = false;
          return { data: null, error: { code: "network_lost" } };
        }
        return { data: row, error: null };
      };
      const q = {
        select: () => q,
        eq: (_: string, id: string) => {
          filterId = id;
          return q;
        },
        insert: (value: Record<string, unknown>) => {
          inserted = value;
          return q;
        },
        maybeSingle: execute,
        single: execute,
        then: (
          resolve: (value: unknown) => unknown,
          reject: (reason: unknown) => unknown,
        ) => execute().then(resolve, reject),
      };
      return q;
    },
  } as unknown as SupabaseClient;
  return {
    db,
    tables,
    failTurn: () => {
      failTurn = true;
    },
    failChat: () => {
      failChat = true;
    },
  };
}
const input = () => ({
  chatId: null,
  position: 1,
  lang: "en" as const,
  question: "A synthetic question",
  reply: { kind: "answer" as const, answer: richAnswer },
  exchangeId,
});
describe("completed research history idempotency", () => {
  it("stores one chat/turn when the same completed job is delivered twice", async () => {
    const { db, tables } = database();
    const first = await saveCheckedExchange(db, input()),
      second = await saveCheckedExchange(db, input());
    expect(second).toEqual(first);
    expect(tables.chats).toHaveLength(1);
    expect(tables.chat_turns).toHaveLength(1);
  });
  it("recovers a lost turn-insert acknowledgement without creating a duplicate", async () => {
    const { db, tables, failTurn } = database();
    failTurn();
    await expect(saveCheckedExchange(db, input())).rejects.toMatchObject({
      code: "network_lost",
    });
    expect(await saveCheckedExchange(db, input())).toEqual({
      chatId: exchangeId,
      position: 1,
    });
    expect(tables.chats).toHaveLength(1);
    expect(tables.chat_turns).toHaveLength(1);
  });
  it("recovers a chat creation whose acknowledgement was lost", async () => {
    const { db, tables, failChat } = database();
    failChat();
    await expect(saveCheckedExchange(db, input())).rejects.toMatchObject({
      code: "network_lost",
    });
    await saveCheckedExchange(db, input());
    expect(tables.chats).toHaveLength(1);
    expect(tables.chat_turns).toHaveLength(1);
  });
  it("does not accept a different question under the same research id", async () => {
    const { db, tables } = database();
    await saveCheckedExchange(db, input());
    await expect(
      saveCheckedExchange(db, { ...input(), question: "Different question" }),
    ).rejects.toThrow("exchange_conflict");
    expect(tables.chat_turns).toHaveLength(1);
  });
  it("does not store Quran/hadith originals in permanent chat rows", async () => {
    const { db, tables } = database();
    await saveCheckedExchange(db, input());
    const saved = tables.chat_turns[0].answer as typeof richAnswer;
    expect(
      saved.sections
        .flatMap((s) => s.sources)
        .every(
          (s) => s.evidence.kind === "scholar" || (s.evidence.arabic === "" && s.evidence.translation === null),
        ),
    ).toBe(true);
    expect(richAnswer.sections[0].sources[0].evidence.arabic).not.toBe("");
  });
});
