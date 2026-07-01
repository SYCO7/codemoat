-- github_access_token is a real GitHub OAuth token ("repo" scope) and must
-- never be readable by client JS (browser or server-as-user), only by a
-- service-role client (Stage B). Writes still work via the existing
-- "profiles: self update" RLS policy (column privileges are independent of
-- row-level policies) — this only blocks SELECT on this one column.
revoke select (github_access_token) on public.profiles from anon, authenticated;
