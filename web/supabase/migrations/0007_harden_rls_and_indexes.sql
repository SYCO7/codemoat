-- Perf/security advisor findings, all real (verified via get_advisors):
-- 1. RLS policies called auth.uid() per-row instead of (select auth.uid()),
--    which defeats Postgres's ability to cache/init-plan it once per query —
--    at scale this is both a perf and DoS-resistance issue.
-- 2. orgs.owner_id and repos.org_id foreign keys had no covering index.

drop policy "profiles: self" on public.profiles;
drop policy "profiles: self update" on public.profiles;
create policy "profiles: self" on public.profiles for select using (id = (select auth.uid()));
create policy "profiles: self update" on public.profiles for update using (id = (select auth.uid()));

drop policy "orgs: owner" on public.orgs;
create policy "orgs: owner" on public.orgs for all using (owner_id = (select auth.uid()));

drop policy "repos: via org ownership" on public.repos;
create policy "repos: via org ownership" on public.repos
  for all using (org_id in (select id from public.orgs where owner_id = (select auth.uid())));

drop policy "scans: via repo->org ownership" on public.scans;
create policy "scans: via repo->org ownership" on public.scans
  for select using (repo_id in (
    select r.id from public.repos r join public.orgs o on o.id = r.org_id
    where o.owner_id = (select auth.uid())
  ));

drop policy "findings: via scan->repo->org ownership" on public.findings;
create policy "findings: via scan->repo->org ownership" on public.findings
  for select using (scan_id in (
    select s.id from public.scans s
    join public.repos r on r.id = s.repo_id
    join public.orgs o on o.id = r.org_id
    where o.owner_id = (select auth.uid())
  ));

create index orgs_owner_id_idx on public.orgs (owner_id);
create index repos_org_id_idx on public.repos (org_id);

-- Basic abuse guard: reject report_scan() calls for the same repo within
-- 5 seconds of its last scan. Cheap, no external infra, blunts API-key
-- brute-force / spam without affecting real CI usage (PRs don't re-scan
-- that fast).
create or replace function public.report_scan(
  p_repo_id uuid,
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
  v_scan_id uuid;
  v_findings_count integer;
  v_critical_count integer;
  v_last_scan_at timestamptz;
begin
  select created_at into v_last_scan_at
    from public.scans where repo_id = p_repo_id
    order by created_at desc limit 1;

  if v_last_scan_at is not null and v_last_scan_at > now() - interval '5 seconds' then
    raise exception 'rate limited' using errcode = '54000';
  end if;

  select count(*), count(*) filter (where (f->>'severity') = 'critical')
    into v_findings_count, v_critical_count
    from jsonb_array_elements(p_findings) as f;

  insert into public.scans (repo_id, commit_sha, branch, pr_number, findings_count, critical_count, duration_ms)
  values (p_repo_id, p_commit_sha, p_branch, p_pr_number, v_findings_count, v_critical_count, p_duration_ms)
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

revoke execute on function public.report_scan(uuid, text, text, integer, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_scan(uuid, text, text, integer, integer, jsonb) to service_role;
