-- Prepared approvals are valid only for the exact reviewed content. Applying this migration is a
-- separate owner-approved operation. Existing approvals have no trustworthy hash and return to draft.

alter table public.prepared_reviews
  add column if not exists content_hash text
  check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$');

update public.prepared_reviews set status = 'draft', content_hash = null where status = 'approved';

alter table public.prepared_reviews
  add constraint prepared_reviews_approved_hash_check
  check (status <> 'approved' or content_hash is not null);

drop function if exists public.set_prepared_review(text, text, text, text);

create function public.set_prepared_review(
  p_kind text,
  p_item_id text,
  p_status text,
  p_note text,
  p_content_hash text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.prepared_reviews (kind, item_id, status, note, content_hash, updated_at)
  values (
    p_kind,
    p_item_id,
    p_status,
    nullif(left(trim(coalesce(p_note, '')), 1000), ''),
    case when p_status = 'approved' then p_content_hash else null end,
    now()
  )
  on conflict (kind, item_id) do update
    set status = excluded.status,
        note = coalesce(excluded.note, public.prepared_reviews.note),
        content_hash = excluded.content_hash,
        updated_at = now()
$$;

revoke all on function public.set_prepared_review(text, text, text, text, text) from public;
grant execute on function public.set_prepared_review(text, text, text, text, text) to anon, authenticated;
