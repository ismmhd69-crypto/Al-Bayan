"use client";

import type { SavedAnswer } from "./answer-store";
import { browserSupabase } from "@/lib/supabase-browser";
import { createClient } from "@supabase/supabase-js";
import { saveCheckedExchange } from "./save-exchange";

// Saved chats of a signed-in person (browser side). Every call goes through the person's own session:
// the database only ever lets them see and change their own rows (row-level security).

export type ChatSummary = {
  id: string;
  title: string;
  updated_at: string;
  turns: number;
};
export type SavedReply =
  | { kind: "answer"; answer: SavedAnswer }
  | { kind: "text"; text: string };
export type OpenedTurn = {
  id?: string;
  question: string;
  reply: SavedReply | { kind: "unavailable" };
};
export type OpenedChat = { id: string; turns: OpenedTurn[] };

const MAX_CHATS_SHOWN = 100;

export async function listChats(): Promise<ChatSummary[]> {
  const { data, error } = await browserSupabase()
    .from("chats")
    .select("id, title, updated_at, chat_turns(count)")
    .order("updated_at", { ascending: false })
    .limit(MAX_CHATS_SHOWN);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    updated_at: row.updated_at as string,
    turns: (row.chat_turns as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

type TurnRow = {
  id: string;
  position: number;
  question: string;
  kind: "answer" | "text";
  answer: SavedAnswer | null;
  text_reply: string | null;
};

/** Opens a chat: its questions, with the saved answers' Quran and hadith texts loaded fresh again. */
export async function openChat(id: string): Promise<OpenedChat> {
  const supabase = browserSupabase();
  const { data, error } = await supabase
    .from("chat_turns")
    .select("id, position, question, kind, answer, text_reply")
    .eq("chat_id", id)
    .order("position", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as TurnRow[];

  const stored = rows.filter((r) => r.kind === "answer" && r.answer);
  let results: ({ ok: true; answer: SavedAnswer } | { ok: false })[] = [];
  if (stored.length > 0) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error("not signed in");
    const res = await fetch("/api/chats/hydrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers: stored.map((r) => r.answer) }),
    });
    const body = (await res.json()) as {
      status?: string;
      results?: typeof results;
    };
    if (!res.ok || body.status !== "ok" || !Array.isArray(body.results))
      throw new Error("could not open chat");
    results = body.results;
  }

  let next = 0;
  const turns = rows.map((row): OpenedTurn => {
    if (row.kind === "text")
      return {
        id: row.id,
        question: row.question,
        reply: { kind: "text", text: row.text_reply ?? "" },
      };
    const result = row.answer ? results[next++] : undefined;
    return {
      id: row.id,
      question: row.question,
      reply: result?.ok
        ? { kind: "answer", answer: result.answer }
        : { kind: "unavailable" },
    };
  });
  return { id, turns };
}

/**
 * Saves one question and its reply. The first exchange of a new chat creates the chat (so empty chats
 * are never saved). Returns the chat id and the number of exchanges now in it.
 */
export async function saveExchange(
  chatId: string | null,
  position: number,
  lang: "ar" | "en" | "de",
  question: string,
  reply: SavedReply,
  options?: { exchangeId?: string; userId?: string },
): Promise<{ chatId: string; position: number }> {
  let supabase = browserSupabase();
  if (options?.userId) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session || data.session.user.id !== options.userId)
      throw new Error("chat_owner_changed");
    // Pin all writes to the session that owns this completed answer. The shared browser
    // client's token may change while an insert is awaiting its network response.
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        },
      },
    );
  }
  return saveCheckedExchange(supabase, {
    chatId,
    position,
    lang,
    question,
    reply,
    exchangeId: options?.exchangeId,
  });
}

export async function deleteChat(id: string): Promise<void> {
  const { error } = await browserSupabase().from("chats").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllChats(): Promise<void> {
  // The database only lets a person delete their own rows; the filter just satisfies "delete needs a where".
  const { error } = await browserSupabase()
    .from("chats")
    .delete()
    .gte("created_at", "1970-01-01");
  if (error) throw error;
}

/** Everything the person has saved, for the "Export my data" button. */
export async function exportChats(options?: { accessToken: string }): Promise<{
  exported_at: string;
  chats: unknown[];
}> {
  const client = options ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${options.accessToken}` } },
  }) : browserSupabase();
  const { data, error } = await client
    .from("chats")
    .select(
      "id, title, lang, created_at, updated_at, chat_turns(position, question, kind, answer, text_reply, created_at)",
    )
    .order("created_at", { ascending: true });
  if (error) throw error;
  return { exported_at: new Date().toISOString(), chats: data ?? [] };
}
