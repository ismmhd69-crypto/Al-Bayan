import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: { user: { id: "user-a" }, access_token: "token-a" },
}));
const create = vi.hoisted(() =>
  vi.fn((..._args: unknown[]) => ({ pinned: true })),
);
const save = vi.hoisted(() =>
  vi.fn(async () => ({ chatId: "chat", position: 1 })),
);
vi.mock("@supabase/supabase-js", () => ({ createClient: create }));
vi.mock("@/lib/supabase-browser", () => ({
  browserSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: { session: state.session },
        error: null,
      }),
    },
  }),
}));
vi.mock("@/lib/chat/save-exchange", () => ({ saveCheckedExchange: save }));
import { saveExchange } from "@/lib/chat/chats";
beforeEach(() => {
  state.session = { user: { id: "user-a" }, access_token: "token-a" };
  create.mockClear();
  save.mockClear();
});
describe("completed chat owner pinning", () => {
  it("uses the original account token for every write of a save", async () => {
    await saveExchange(
      null,
      1,
      "en",
      "Synthetic",
      { kind: "text", text: "Synthetic" },
      { userId: "user-a" },
    );
    expect(create.mock.calls[0]?.[2]).toMatchObject({
      global: { headers: { Authorization: "Bearer token-a" } },
      auth: { persistSession: false },
    });
    expect(save).toHaveBeenCalledWith({ pinned: true }, expect.any(Object));
  });
  it("refuses to save an earlier account's answer after the session changed", async () => {
    state.session = { user: { id: "user-b" }, access_token: "token-b" };
    await expect(
      saveExchange(
        null,
        1,
        "en",
        "Synthetic",
        { kind: "text", text: "Synthetic" },
        { userId: "user-a" },
      ),
    ).rejects.toThrow("chat_owner_changed");
    expect(create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
