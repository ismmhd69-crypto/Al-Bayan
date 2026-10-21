type Session = { access_token: string; user: { id: string } };
type User = { id: string; email?: string | null; created_at?: string; user_metadata?: Record<string, unknown> };
/** Collect using one verified identity; the caller downloads only after this resolves. */
export async function buildAccountExport(deps: {
  session: () => Promise<Session | null>;
  userFor: (token: string) => Promise<User | null>;
  chats: (token: string) => Promise<{ exported_at: string; chats: unknown[] }>;
  research: (token: string) => Promise<unknown>;
}) {
  const original = await deps.session();
  if (!original) throw new Error("not_signed_in");
  const user = await deps.userFor(original.access_token);
  if (!user || user.id !== original.user.id) throw new Error("account_changed");
  const [chats, temporary_research] = await Promise.all([deps.chats(original.access_token), deps.research(original.access_token)]);
  if ((await deps.session())?.user.id !== original.user.id) throw new Error("account_changed");
  const meta = user.user_metadata ?? {};
  return { account: { email: user.email ?? null, created_at: user.created_at ?? null,
    consent_at: meta.consent_at ?? null, consent_lang: meta.consent_lang ?? null }, ...chats, temporary_research };
}
