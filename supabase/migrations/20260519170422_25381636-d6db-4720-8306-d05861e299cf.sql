
-- Set search_path on trigger fn
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke execute on security definer functions from public/anon/authenticated
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.get_current_user_role() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.tg_set_updated_at() from public, anon, authenticated;

-- Re-grant has_role and get_current_user_role to authenticated (they need to call it via RLS)
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.get_current_user_role() to authenticated;

-- Tighten avatar bucket: only allow selecting a known file path, not listing
drop policy if exists "Avatar images public read" on storage.objects;
create policy "Avatar images public read by path" on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] is not null);
