-- Fixes two Supabase security lints on the Stage A migration:
-- function_search_path_mutable, anon/authenticated_security_definer_function_executable
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, github_id, github_login, avatar_url)
  values (new.id, (new.raw_user_meta_data->>'provider_id')::bigint,
          new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'avatar_url');
  insert into public.orgs (owner_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'user_name', 'my-org'));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
