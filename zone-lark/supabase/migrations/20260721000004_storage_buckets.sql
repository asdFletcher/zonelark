-- Private bucket for generated .xlsx exports (lib/server/jobStore.ts). Never made public — all
-- reads/writes go through the service-role admin client from server-only route handlers
-- (app/api/export/[jobId]/route.ts authenticates the request itself before downloading), so no
-- storage.objects RLS policy is needed for anon/authenticated roles.
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;
