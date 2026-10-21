import type { SupabaseClient } from "@supabase/supabase-js";
import { chatTitle, stripAnswer } from "./answer-store";
import type { SavedReply } from "./chats";

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
          .join(",")}}`
      : (JSON.stringify(value) ?? "null");

/** Uses existing UUID primary keys for idempotent terminal saves. A network failure must not
 * create another chat or append the same completed research result twice. No schema change. */
export async function saveCheckedExchange(
  db: SupabaseClient,
  input: {
    chatId: string | null;
    position: number;
    lang: "en" | "ar" | "de";
    question: string;
    reply: SavedReply;
    exchangeId?: string;
  },
) {
  const { chatId, position, lang, reply, exchangeId } = input,
    question = input.question.slice(0, 500);
  if (exchangeId && !UUID.test(exchangeId))
    throw new Error("invalid_exchange_id");
  const row =
    reply.kind === "answer"
      ? { kind: "answer" as const, answer: stripAnswer(reply.answer) }
      : { kind: "text" as const, text_reply: reply.text.slice(0, 500) };
  const findExisting = async () => {
    if (!exchangeId) return null;
    const { data, error } = await db
      .from("chat_turns")
      .select("chat_id,position,question,kind,answer,text_reply")
      .eq("id", exchangeId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (
      (chatId && data.chat_id !== chatId) ||
      data.question !== question ||
      data.kind !== row.kind ||
      (row.kind === "answer"
        ? canonical(data.answer) !== canonical(row.answer)
        : data.text_reply !== row.text_reply)
    )
      throw new Error("exchange_conflict");
    return {
      chatId: data.chat_id as string,
      position: data.position as number,
    };
  };
  const existing = await findExisting();
  if (existing) return existing;
  if (!Number.isInteger(position) || position < 1 || position > 50)
    throw new Error("chat_history_limit");
  let id = chatId;
  if (!id) {
    const { data, error } = await db
      .from("chats")
      .insert({
        ...(exchangeId ? { id: exchangeId } : {}),
        title: chatTitle(question),
        lang,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code !== "23505" || !exchangeId) throw error;
      const owned = await db
        .from("chats")
        .select("id,title,lang")
        .eq("id", exchangeId)
        .maybeSingle();
      if (
        owned.error ||
        !owned.data ||
        owned.data.title !== chatTitle(question) ||
        owned.data.lang !== lang
      )
        throw error;
      id = owned.data.id;
    } else id = data.id;
  }
  const { error } = await db
    .from("chat_turns")
    .insert({
      ...(exchangeId ? { id: exchangeId } : {}),
      chat_id: id,
      position,
      question,
      ...row,
    });
  if (error) {
    if (error.code === "23505") {
      const saved = await findExisting();
      if (saved) return saved;
    }
    throw error;
  }
  return { chatId: id as string, position };
}
