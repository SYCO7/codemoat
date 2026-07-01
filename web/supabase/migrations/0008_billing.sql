alter table public.orgs
  add column dodo_customer_id text,
  add column dodo_subscription_id text;

create index orgs_dodo_customer_id_idx on public.orgs (dodo_customer_id) where dodo_customer_id is not null;
create index orgs_dodo_subscription_id_idx on public.orgs (dodo_subscription_id) where dodo_subscription_id is not null;

-- Cascades an org's plan to every repo it owns in one statement — used by
-- the billing webhook handler so a plan change takes effect everywhere
-- atomically (report_scan()/connect-a-repo gating both read repos.plan).
create or replace function public.set_org_plan(p_org_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_plan not in ('free', 'paid') then
    raise exception 'invalid plan: %', p_plan;
  end if;

  update public.orgs set plan = p_plan where id = p_org_id;
  update public.repos set plan = p_plan where org_id = p_org_id;
end;
$$;

revoke execute on function public.set_org_plan(uuid, text) from public, anon, authenticated;
grant execute on function public.set_org_plan(uuid, text) to service_role;
