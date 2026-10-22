-- Only the trusted platform admin is a global operator. Supervisor is account-scoped.
create or replace function public.exb_is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_roles where user_id=auth.uid() and role='admin')
$$;
create unique index if not exists exb_single_master on public.platform_roles(role) where role='admin';

-- Defence in depth: profile edits can never promote a customer to legacy Master.
create or replace function public.exb_guard_profile_role() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.is_master is distinct from old.is_master and current_user in ('authenticated','anon') and not public.exb_is_admin() then
  raise exception 'Permissão de Master não pode ser alterada pelo perfil' using errcode='42501';
 end if;
 return new;
end $$;
drop trigger if exists exb_profile_role_guard on public.user_profiles;
create trigger exb_profile_role_guard before update on public.user_profiles for each row execute function public.exb_guard_profile_role();
revoke all on function public.exb_guard_profile_role() from public,anon,authenticated;

-- Role helpers must not enumerate another customer's account.
create or replace function public.is_master_user(user_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid()=$1 or public.exb_is_admin()) and exists(select 1 from public.platform_roles r where r.user_id=$1 and r.role='admin')
$$;
create or replace function public.has_role(_user_id uuid,_role public.app_role) returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid()=$1 or public.exb_is_admin()) and exists(select 1 from public.user_roles r where r.user_id=$1 and r.role=$2)
$$;
revoke all on function public.is_master_user(uuid),public.has_role(uuid,public.app_role) from public,anon;
grant execute on function public.is_master_user(uuid),public.has_role(uuid,public.app_role) to authenticated;

do $$declare p record;begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('media_instances','rss_sources','rss_items','license_actions','system_notifications') loop
  execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
end $$;
create policy media_instances_read on public.media_instances for select to authenticated using(created_by=auth.uid() or public.exb_is_admin());
create policy media_instances_write on public.media_instances for all to authenticated using(created_by=auth.uid() and not public.exb_is_readonly()) with check(created_by=auth.uid() and not public.exb_is_readonly());
create policy rss_source_read on public.rss_sources for select to authenticated using(created_by=auth.uid() or public.exb_is_admin());
create policy rss_source_write on public.rss_sources for all to authenticated using(created_by=auth.uid() and not public.exb_is_readonly()) with check(created_by=auth.uid() and not public.exb_is_readonly());
create policy rss_item_read on public.rss_items for select to authenticated using(exists(select 1 from public.rss_sources s where s.id=rss_items.source_id and (s.created_by=auth.uid() or public.exb_is_admin())));
create policy rss_item_write on public.rss_items for all to authenticated using(exists(select 1 from public.rss_sources s where s.id=rss_items.source_id and s.created_by=auth.uid()) and not public.exb_is_readonly()) with check(exists(select 1 from public.rss_sources s where s.id=rss_items.source_id and s.created_by=auth.uid()) and not public.exb_is_readonly());
create policy license_actions_master on public.license_actions for all to authenticated using(public.exb_is_admin()) with check(public.exb_is_admin());
create policy notifications_read on public.system_notifications for select to authenticated using(target_user_id=auth.uid() or target_user_id is null or public.exb_is_admin());
create policy notifications_master on public.system_notifications for all to authenticated using(public.exb_is_admin()) with check(public.exb_is_admin());

drop policy if exists playlist_item_owner on public.playlist_items;
create policy playlist_item_owner on public.playlist_items for all to authenticated
using(not public.exb_is_readonly() and exists(select 1 from public.playlists p where p.id=playlist_items.playlist_id and p.user_id=auth.uid()))
with check(not public.exb_is_readonly() and exists(select 1 from public.playlists p where p.id=playlist_items.playlist_id and p.user_id=auth.uid())
 and (media_file_id is null or exists(select 1 from public.media_files m where m.id=playlist_items.media_file_id and m.user_id=auth.uid()))
 and (media_instance_id is null or exists(select 1 from public.media_instances m where m.id=playlist_items.media_instance_id and m.created_by=auth.uid())));

alter view public.recent_news set (security_invoker=true);
revoke all on public.recent_news from anon;
revoke all on public.rss_sources,public.rss_items,public.license_actions,public.system_notifications from anon;
-- RLS cannot protect TRUNCATE, so remove non-row privileges explicitly.
revoke truncate,references,trigger on all tables in schema public from authenticated,anon;
-- Service-only legacy registration functions were already revoked; retain that boundary.
