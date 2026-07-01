create table public.scans (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.repos(id) on delete cascade,
  commit_sha text not null,
  branch text,
  pr_number integer,
  findings_count integer not null default 0,
  critical_count integer not null default 0,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  file text not null,
  line integer not null,
  end_line integer,
  severity text not null check (severity in ('critical','high','medium','low','info')),
  cwe text,
  rule_id text not null,
  description text not null,
  suggested_fix text,
  source text not null check (source in ('semgrep','gitleaks','codemoat-ai-ruleset'))
);

create index scans_repo_id_created_at_idx on public.scans (repo_id, created_at desc);
create index findings_scan_id_idx on public.findings (scan_id);

alter table public.scans enable row level security;
alter table public.findings enable row level security;

create policy "scans: via repo->org ownership" on public.scans
  for select using (repo_id in (
    select r.id from public.repos r join public.orgs o on o.id = r.org_id
    where o.owner_id = auth.uid()
  ));

create policy "findings: via scan->repo->org ownership" on public.findings
  for select using (scan_id in (
    select s.id from public.scans s
    join public.repos r on r.id = s.repo_id
    join public.orgs o on o.id = r.org_id
    where o.owner_id = auth.uid()
  ));

-- No client insert/update/delete policies — all writes go through report_scan(),
-- which is SECURITY DEFINER and only executable by the service_role.
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
begin
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
