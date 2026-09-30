-- Saved chats for signed-in people (optional accounts). Written 2026-09-30; applying it is a separate,
-- owner-approved step.
--
-- What is stored: the question, and the checked answer with the Quran and hadith TEXT removed (those
-- services do not allow long-term storage; the site loads them again when a chat is reopened).
-- Who can see it: only the account that owns the row. Nobody signed out can read or write anything here.
-- Deleting a chat, or the account, deletes its rows.

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  lang text not null check (lang in ('ar', 'en', 'de')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.chat_turns (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position integer not null check (position between 1 and 50),
  question text not null check (char_length(question) between 1 and 500),
  kind text not null check (kind in ('answer', 'text')),
  answer jsonb check (answer is null or octet_length(answer::text) <= 200000),
  text_reply text check (text_reply is null or char_length(text_reply) <= 500),
  created_at timestamptz not null default now(),
  unique (chat_id, position),
  -- A turn belongs to a chat of the same owner.
  foreign key (chat_id, user_id) references public.chats (id, user_id) on delete cascade,
  check (
    (kind = 'answer' and answer is not null and text_reply is null)
    or (kind = 'text' and answer is null and text_reply is not null)
  )
);

create index chats_user_recent on public.chats (user_id, updated_at desc);
create index chat_turns_user on public.chat_turns (user_id);

-- At most 200 chats per person.
create function public.enforce_chat_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.chats where user_id = new.user_id) >= 200 then
    raise exception 'chat limit reached' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger chats_limit before insert on public.chats
  for each row execute function public.enforce_chat_limit();

-- A new turn moves its chat to the top of the recent list.
create function public.touch_chat()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id and user_id = new.user_id;
  return new;
end
$$;

create trigger chat_turns_touch after insert on public.chat_turns
  for each row execute function public.touch_chat();

alter table public.chats enable row level security;
alter table public.chat_turns enable row level security;

create policy "own chats: read" on public.chats for select to authenticated using (user_id = (select auth.uid()));
create policy "own chats: add" on public.chats for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own chats: change" on public.chats for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own chats: delete" on public.chats for delete to authenticated using (user_id = (select auth.uid()));

create policy "own turns: read" on public.chat_turns for select to authenticated using (user_id = (select auth.uid()));
create policy "own turns: add" on public.chat_turns for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own turns: delete" on public.chat_turns for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.chats, public.chat_turns from anon, public;
grant select, insert, update, delete on public.chats to authenticated;
grant select, insert, delete on public.chat_turns to authenticated;
