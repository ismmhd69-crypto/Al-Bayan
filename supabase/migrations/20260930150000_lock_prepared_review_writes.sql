-- Only the server may write review decisions. The website's public keys retain read access so
-- approved content can be loaded, but cannot call the approval function directly.

revoke execute on function public.set_prepared_review(text, text, text, text, text) from anon, authenticated;
grant execute on function public.set_prepared_review(text, text, text, text, text) to service_role;
