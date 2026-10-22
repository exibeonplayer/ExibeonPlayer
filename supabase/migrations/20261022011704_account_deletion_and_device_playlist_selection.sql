-- Administrative deletion stays atomic with Auth's delete transaction.
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
  delete from public.media_instances where created_by=old.id;
  delete from public.rss_sources where created_by=old.id;
  update public.license_actions set performed_by=null where performed_by=old.id;
  return old;
end;
$$;
revoke all on function exibeon_private.cleanup_deleted_account() from public,anon,authenticated;
create trigger exb_cleanup_deleted_account before delete on auth.users
for each row execute function exibeon_private.cleanup_deleted_account();

-- Own-account lookup; a sequential ID is a selector, never an authorization credential.
create or replace function public.exb_select_device_playlist(p_player uuid,p_user uuid,p_number integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.players; p public.playlists;
begin
  select * into d from public.players where id=p_player and user_id=p_user and revoked_at is null for update;
  if d.id is null then raise exception 'Equipamento não autorizado'; end if;
  select * into p from public.playlists where user_id=p_user and sequential_id=p_number for share;
  if p.id is null then raise exception 'Playlist não encontrada nesta conta'; end if;
  if coalesce(p.target_platform,'all') not in ('all','windows') then raise exception 'Playlist destinada a outra plataforma'; end if;
  update public.players set assigned_playlist_id=p.id where id=d.id;
  return jsonb_build_object('id',p.id,'number',p.sequential_id,'name',p.name);
end;
$$;
revoke all on function public.exb_select_device_playlist(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.exb_select_device_playlist(uuid,uuid,integer) to service_role;

create or replace function public.exb_claim_pair_with_playlist(
 p_hash text,p_device uuid,p_name text,p_claim text,p_token text,p_refresh text,p_number integer
) returns uuid language plpgsql security definer set search_path='' as $$
declare c exibeon_private.pair_codes; pid uuid;
begin
  select * into c from exibeon_private.pair_codes where code_hash=p_hash;
  if c.code_hash is null then raise exception 'Código inválido ou expirado'; end if;
  -- Same account lock order as exb_claim_pair, preserving capacity serialization.
  perform 1 from public.licenses where user_id=c.user_id for update;
  pid:=public.exb_claim_pair(p_hash,p_device,p_name,p_claim,p_token,p_refresh);
  if p_number is not null then
    perform public.exb_select_device_playlist(pid,c.user_id,p_number);
  end if;
  -- A missing/foreign ID raises and rolls back claim, credentials and code consumption.
  return pid;
end;
$$;
revoke all on function public.exb_claim_pair_with_playlist(text,uuid,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.exb_claim_pair_with_playlist(text,uuid,text,text,text,text,integer) to service_role;
