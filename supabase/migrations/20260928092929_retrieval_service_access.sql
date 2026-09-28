-- The retrieval RPC is invoker-rights and joins the private rights register. Give only the
-- trusted server role the minimum access it needs; the editorial schema remains unavailable
-- to visitors and is still not exposed through the Data API.

begin;

grant usage on schema editorial to service_role;
grant select on editorial.source_rights to service_role;

commit;
