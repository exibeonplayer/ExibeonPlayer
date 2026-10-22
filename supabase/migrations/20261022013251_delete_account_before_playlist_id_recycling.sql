create or replace function exibeon_private.cleanup_deleted_account()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.platform_roles where user_id=old.id and role='admin')
     or exists(select 1 from public.user_profiles where id=old.id and is_master)
     or exists(select 1 from public.user_roles where user_id=old.id and role::text='master') then
    raise exception 'A conta Master não pode ser excluída';
  end if;
  delete from exibeon_private.pair_codes where user_id=old.id
    or target_player_id in(select id from public.players where user_id=old.id)
    or player_id in(select id from public.players where user_id=old.id);
  -- Delete while the Auth row still exists: the legacy playlist ID recycling
  -- trigger inserts into playlist_available_ids, which references auth.users.
  delete from public.playlists where user_id=old.id;
  delete from public.media_instances where created_by=old.id;
  delete from public.rss_sources where created_by=old.id;
  update public.license_actions set performed_by=null where performed_by=old.id;
  return old;
end;
$$;
revoke all on function exibeon_private.cleanup_deleted_account() from public,anon,authenticated;
