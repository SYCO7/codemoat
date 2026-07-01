-- Redesign: report_scan() takes the API key's SHA-256 hash directly and looks
-- up the repo itself, instead of a repo_id + relying on Postgres role-level
-- GRANT to service_role for authorization. The service-role key isn't
-- available to this app (Supabase deliberately doesn't expose it outside the
-- dashboard) — this design needs no service-role key at all: the API-key
-- check *is* the authorization, enforced inside this SECURITY DEFINER
-- function, so it's safe to grant EXECUTE to anon (same trust level as any
-- bearer-token-authenticated REST endpoint).
drop function if exists public.report_scan(uuid, text, text, integer, integer, jsonb);

create or replace function public.report_scan(
  p_api_key_hash text,
  p_commit_sha text,
  p_branch text,
  p_pr_number integer,
  p_duration_ms integer,
  p_findings jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_repo_id uuid;
  v_scan_id uuid;
  v_findings_count integer;
  v_critical_count integer;
begin
  select id into v_repo_id from public.repos where api_key_hash = p_api_key_hash;
  if v_repo_id is null then
    raise exception 'invalid api key' using errcode = '28000';
  end if;

  select count(*), count(*) filter (where (f->>'severity') = 'critical')
    into v_findings_count, v_critical_count
    from jsonb_array_elements(p_findings) as f;

  insert into public.scans (repo_id, commit_sha, branch, pr_number, findings_count, critical_count, duration_ms)
  values (v_repo_id, p_commit_sha, p_branch, p_pr_number, v_findings_count, v_critical_count, p_duration_ms)
  returning id into v_scan_id;

  insert into public.findings (scan_id, file, line, end_line, severity, cwe, rule_id, description, suggested_fix, source)
  select
    v_scan_id,
    f->>'file',
    (f->>'line')::integer,
    nullif(f->>'endLine', '')::integer,
    f->>'severity',
    f->>'cwe',
    f->>'ruleId',
    f->>'description',
    f->>'suggestedFix',
    f->>'source'
  from jsonb_array_elements(p_findings) as f;

  return v_scan_id;
end;
$$;

revoke execute on function public.report_scan(text, text, text, integer, integer, jsonb) from public;
grant execute on function public.report_scan(text, text, text, integer, integer, jsonb) to anon, authenticated;
