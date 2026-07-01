-- The previous migration's column-level REVOKE was a no-op: Supabase's default
-- schema exposure grants table-level SELECT on all public tables to
-- anon/authenticated, and a table-level grant overrides a column-level revoke
-- in Postgres. Fix: revoke the table-level grant, then re-grant SELECT on only
-- the non-sensitive columns. Verified via information_schema.column_privileges
-- that github_access_token is excluded after this runs.
revoke select on public.profiles from anon, authenticated;
grant select (id, github_id, github_login, avatar_url, created_at) on public.profiles to anon, authenticated;
