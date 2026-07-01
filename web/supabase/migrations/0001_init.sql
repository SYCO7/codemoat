create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_id bigint unique,
  github_login text not null,
  avatar_url text,
  github_access_token text,     -- server-only; no client-facing select policy, see below
  created_at timestamptz not null default now()
);

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  plan text not null default 'free' check (plan in ('free','paid')),
  created_at timestamptz not null default now()
);

create table public.repos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  github_repo_id bigint not null unique,
  full_name text not null,
  owner text not null,
  is_private boolean not null default false,
  plan text not null default 'free' check (plan in ('free','paid')),
  api_key_hash text unique,     -- populated in Stage B
  api_key_prefix text,          -- display-only, populated in Stage B
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orgs enable row level security;
alter table public.repos enable row level security;

create policy "profiles: self" on public.profiles for select using (id = auth.uid());
create policy "profiles: self update" on public.profiles for update using (id = auth.uid());
create policy "orgs: owner" on public.orgs for all using (owner_id = auth.uid());
create policy "repos: via org ownership" on public.repos
  for all using (org_id in (select id from public.orgs where owner_id = auth.uid()));

-- auto-create profile + personal org on first sign-in
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, github_id, github_login, avatar_url)
  values (new.id, (new.raw_user_meta_data->>'provider_id')::bigint,
          new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'avatar_url');
  insert into public.orgs (owner_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'user_name', 'my-org'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
