-- Review decisions for prepared answers (Mo, 2026-09-29): the review tab is public and Approve / Reject
-- work online, so decisions are stored here instead of in files. Everyone may read them (the topic pages
-- show only approved answers); changes go only through set_prepared_review, which validates every field.

create table public.prepared_reviews (
  kind text not null check (kind in ('topic')),
  item_id text not null check (item_id ~ '^[a-z0-9-]{1,60}$'),
  status text not null check (status in ('draft', 'approved', 'rejected')),
  note text check (note is null or char_length(note) <= 1000),
  updated_at timestamptz not null default now(),
  primary key (kind, item_id)
);

alter table public.prepared_reviews enable row level security;
create policy "read review decisions" on public.prepared_reviews for select to anon, authenticated using (true);
grant select on public.prepared_reviews to anon, authenticated;

create or replace function public.set_prepared_review(p_kind text, p_item_id text, p_status text, p_note text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.prepared_reviews (kind, item_id, status, note, updated_at)
  values (p_kind, p_item_id, p_status, nullif(left(trim(coalesce(p_note, '')), 1000), ''), now())
  on conflict (kind, item_id) do update
    set status = excluded.status,
        note = coalesce(excluded.note, public.prepared_reviews.note),
        updated_at = now()
$$;

revoke all on function public.set_prepared_review(text, text, text, text) from public;
grant execute on function public.set_prepared_review(text, text, text, text) to anon, authenticated;

-- Carry over the decision Mo already made on his computer.
insert into public.prepared_reviews (kind, item_id, status) values ('topic', 'doubt', 'approved')
on conflict do nothing;
