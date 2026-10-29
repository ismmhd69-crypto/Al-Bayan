-- Saved answers and lessons for signed-in people (Mo, 2026-10-29). Applying it is a separate,
-- owner-approved step. Signed-out visitors keep their saves on their own device instead.
--
-- What is stored: for an answer, the question and the checked answer with the Quran and hadith TEXT
-- removed (those services do not allow long-term storage; the site loads them again when a saved answer
-- is opened). For a lesson, only its id and title.
-- Who can see it: only the account that owns the row. Nobody signed out can read or write anything here.
-- Deleting the account deletes its saved items.

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('answer', 'lesson')),
  item_key text not null check (char_length(item_key) between 1 and 120),
  title text not null check (char_length(title) between 1 and 160),
  lang text not null check (lang in ('ar', 'en', 'de')),
  question text check (question is null or char_length(question) between 1 and 500),
  answer jsonb check (answer is null or octet_length(answer::text) <= 200000),
  created_at timestamptz not null default now(),
  unique (user_id, kind, item_key),
  check (
    (kind = 'answer' and question is not null and answer is not null)
    or (kind = 'lesson' and question is null and answer is null)
  )
);

create index saved_items_user_recent on public.saved_items (user_id, created_at desc);

-- At most 300 saved items per person.
create function public.enforce_saved_items_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.saved_items where user_id = new.user_id) >= 300 then
    raise exception 'saved items limit reached' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger saved_items_limit before insert on public.saved_items
  for each row execute function public.enforce_saved_items_limit();

alter table public.saved_items enable row level security;

create policy "own saved items: read" on public.saved_items for select to authenticated using (user_id = (select auth.uid()));
create policy "own saved items: add" on public.saved_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own saved items: delete" on public.saved_items for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.saved_items from anon, public;
grant select, insert, delete on public.saved_items to authenticated;
