-- Vínculo de equipamentos, isolamento por conta e autorização offline assinada.
-- Preserva registros existentes. Aplicar como migration transacional.
create schema if not exists exibeon_private;
revoke all on schema exibeon_private from public, anon, authenticated;
grant usage on schema exibeon_private to service_role;

create table public.platform_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','supervisor'))
);
alter table public.platform_roles enable row level security;
insert into public.platform_roles(user_id,role)
select id,'admin' from public.user_profiles where is_master=true;
create policy own_platform_role on public.platform_roles for select to authenticated using (user_id=auth.uid());
revoke all on public.platform_roles from anon,authenticated;
grant select on public.platform_roles to authenticated;
grant all on public.platform_roles to service_role;

create or replace function public.exb_is_staff() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_roles where user_id=auth.uid() and role in ('admin','supervisor'))
$$;
create or replace function public.exb_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_roles where user_id=auth.uid() and role='admin')
$$;
create or replace function public.exb_is_readonly() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_roles where user_id=auth.uid() and role='supervisor')
$$;
revoke all on function public.exb_is_readonly() from public,anon;
grant execute on function public.exb_is_readonly() to authenticated,service_role;
revoke all on function public.exb_is_staff(),public.exb_is_admin() from public,anon;
grant execute on function public.exb_is_staff(),public.exb_is_admin() to authenticated,service_role;

alter table public.players add column if not exists device_id uuid unique;
alter table public.players add column if not exists assigned_playlist_id uuid references public.playlists(id) on delete set null;
alter table public.players add column if not exists revoked_at timestamptz;
alter table public.players add column if not exists telemetry jsonb not null default '{}';
alter table public.player_logs add column if not exists event_id uuid;
create unique index if not exists exb_log_dedup on public.player_logs(player_id,event_id);
create index if not exists exb_players_owner on public.players(user_id);
create index if not exists exb_player_logs_recent on public.player_logs(player_id,created_at desc);

create table exibeon_private.pair_codes (
  code_hash text primary key, user_id uuid not null references auth.users(id),
  playlist_id uuid references public.playlists(id) on delete set null,
  target_player_id uuid references public.players(id),
  created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '15 minutes',
  consumed_at timestamptz, device_id uuid, claim_hash text, player_id uuid references public.players(id)
);
create table exibeon_private.device_credentials (
  player_id uuid primary key references public.players(id) on delete cascade,
  token_hash text not null unique, refresh_hash text not null unique,
  expires_at timestamptz not null default now()+interval '1 hour'
);
create table exibeon_private.signing_key (
  id boolean primary key default true check(id), private_key text not null, public_key text not null
);
create table exibeon_private.rate_buckets (
  bucket text primary key, count integer not null default 1, expires_at timestamptz not null
);
grant all on all tables in schema exibeon_private to service_role;
alter table exibeon_private.pair_codes enable row level security;
alter table exibeon_private.device_credentials enable row level security;
alter table exibeon_private.signing_key enable row level security;
alter table exibeon_private.rate_buckets enable row level security;

create function public.exb_rate_limit(p_bucket text,p_limit integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into exibeon_private.rate_buckets(bucket,count,expires_at) values(p_bucket,1,now()+interval '10 minutes')
 on conflict(bucket) do update set count=case when exibeon_private.rate_buckets.expires_at<now() then 1 else exibeon_private.rate_buckets.count+1 end,
 expires_at=case when exibeon_private.rate_buckets.expires_at<now() then now()+interval '10 minutes' else exibeon_private.rate_buckets.expires_at end
 returning count into n;
 delete from exibeon_private.rate_buckets where expires_at<now()-interval '1 day';
 return n<=p_limit;
end $$;

create function public.exb_signing_key(p_private text,p_public text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare k exibeon_private.signing_key;
begin
 insert into exibeon_private.signing_key(id,private_key,public_key) values(true,p_private,p_public) on conflict do nothing;
 select * into strict k from exibeon_private.signing_key where id=true;
 return jsonb_build_object('private_key',k.private_key,'public_key',k.public_key);
end $$;

create function public.exb_create_pair_code(p_user uuid,p_hash text,p_playlist uuid,p_target uuid default null) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare l public.licenses; expiry timestamptz;
begin
 select * into l from public.licenses where user_id=p_user for update;
 if l.id is null or l.status::text is distinct from 'active' or l.start_date>now() or l.end_date<=now() then raise exception 'Licença inválida'; end if;
 if p_playlist is not null and not exists(select 1 from public.playlists where id=p_playlist and user_id=p_user and is_active=true) then raise exception 'Playlist não autorizada'; end if;
 if p_target is not null and not exists(select 1 from public.players where id=p_target and user_id=p_user) then raise exception 'Player não autorizado'; end if;
 if (select count(*) from exibeon_private.pair_codes where user_id=p_user and consumed_at is null and expires_at>now())>=10 then raise exception 'Limite de códigos pendentes'; end if;
 if p_target is null and (select count(*) from public.players where user_id=p_user and revoked_at is null)>=l.max_players then raise exception 'Limite de players atingido'; end if;
 insert into exibeon_private.pair_codes(code_hash,user_id,playlist_id,target_player_id) values(p_hash,p_user,p_playlist,p_target) returning expires_at into expiry;
 return expiry;
end $$;

create function public.exb_claim_pair(p_hash text,p_device uuid,p_name text,p_claim text,p_token text,p_refresh text) returns uuid
language plpgsql security definer set search_path='' as $$
declare c exibeon_private.pair_codes; l public.licenses; d public.players; pid uuid;
begin
 if char_length(trim(p_name)) not between 1 and 100 then raise exception 'Nome inválido'; end if;
 -- Um único lock por conta serializa consumo de vagas, inclusive códigos distintos.
 select * into c from exibeon_private.pair_codes where code_hash=p_hash;
 if c.code_hash is null then raise exception 'Código inválido ou expirado'; end if;
 select * into l from public.licenses where user_id=c.user_id for update;
 select * into c from exibeon_private.pair_codes where code_hash=p_hash for update;
 if l.id is null or l.status::text is distinct from 'active' or l.start_date>now() or l.end_date<=now() then raise exception 'Licença inválida'; end if;
 if c.consumed_at is not null then
   if c.device_id<>p_device or c.claim_hash<>p_claim or c.expires_at<now() then raise exception 'Código já utilizado'; end if;
   pid:=c.player_id;
 else
   if c.expires_at<now() then raise exception 'Código inválido ou expirado'; end if;
   select * into d from public.players where device_id=p_device;
   if d.id is not null and d.user_id<>c.user_id then raise exception 'Equipamento já vinculado a outra conta'; end if;
   pid:=coalesce(c.target_player_id,d.id);
   if c.target_player_id is not null then
     select * into d from public.players where id=pid and user_id=c.user_id for update;
     if d.id is null or (d.device_id is not null and d.device_id<>p_device and d.revoked_at is null) then raise exception 'Revogue o vínculo anterior antes de substituir o equipamento'; end if;
   end if;
   if pid is null or not exists(select 1 from public.players where id=pid and revoked_at is null) then
     if (select count(*) from public.players where user_id=c.user_id and revoked_at is null)>=l.max_players then raise exception 'Limite de players atingido'; end if;
   end if;
   if pid is null then
     insert into public.players(user_id,name,code,device_id,assigned_playlist_id) values(c.user_id,trim(p_name),'DEV-'||gen_random_uuid()::text,p_device,c.playlist_id) returning id into pid;
   else
     update public.players set name=trim(p_name),device_id=p_device,revoked_at=null,
       assigned_playlist_id=coalesce(c.playlist_id,assigned_playlist_id) where id=pid;
   end if;
   update exibeon_private.pair_codes set consumed_at=now(),device_id=p_device,claim_hash=p_claim,player_id=pid where code_hash=p_hash;
 end if;
 if exists(select 1 from public.players where id=pid and revoked_at is not null) then raise exception 'Player revogado'; end if;
 insert into exibeon_private.device_credentials(player_id,token_hash,refresh_hash) values(pid,p_token,p_refresh)
 on conflict(player_id) do update set token_hash=excluded.token_hash,refresh_hash=excluded.refresh_hash,expires_at=now()+interval '1 hour';
 return pid;
end $$;

create function public.exb_device_identity(p_hash text,p_refresh boolean default false) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('player',to_jsonb(p),'license',to_jsonb(l),'account',jsonb_build_object('id',u.id,'name',u.name,'email',u.email))
 from exibeon_private.device_credentials c join public.players p on p.id=c.player_id
 left join public.licenses l on l.user_id=p.user_id left join public.user_profiles u on u.id=p.user_id
 where p.revoked_at is null and ((p_refresh and c.refresh_hash=p_hash) or (not p_refresh and c.token_hash=p_hash and c.expires_at>now()))
$$;

create function public.exb_renew_access(p_refresh text,p_token text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 update exibeon_private.device_credentials c set token_hash=p_token,expires_at=now()+interval '1 hour'
 from public.players p where p.id=c.player_id and p.revoked_at is null and c.refresh_hash=p_refresh;
 return found;
end $$;

-- Desativa caminhos antigos de autenticação anônima. Nenhum registro é apagado.
do $$ declare r record; begin
 for r in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('associate_player','validate_player_code','get_playlist_with_videos','update_player_status','exibeon_register_device','exibeon_check_device_status','exibeon_pair_device','exibeon_send_heartbeat','exibeon_get_playlist') loop
   execute format('revoke all on function %s from public,anon,authenticated',r.signature);
 end loop;
 for r in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'exb_%' and p.proname not in ('exb_is_staff','exb_is_admin','exb_is_readonly') loop
   execute format('revoke all on function %s from public,anon,authenticated',r.signature);
   execute format('grant execute on function %s to service_role',r.signature);
 end loop;
end $$;

-- Substitui políticas permissivas/duplicadas dos dados privados principais.
do $$ declare t text; p record; begin
 foreach t in array array['user_profiles','licenses','players','player_logs','player_codes','player_tokens','playlists','playlist_items','media_files','player_commands','player_schedules','analytics_daily','player_associations','player_stats','player_sessions','videos','devices','heartbeats'] loop
  if to_regclass('public.'||t) is null then continue; end if;
  execute format('alter table public.%I enable row level security',t);
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',p.policyname,t); end loop;
  execute format('revoke all on public.%I from public,anon,authenticated',t);
 end loop;
end $$;

grant select on public.user_profiles,public.licenses,public.players,public.player_logs,public.playlists,public.playlist_items,public.media_files,public.analytics_daily to authenticated;
grant insert(id,email,name,company_name,phone),update(email,name,company_name,phone) on public.user_profiles to authenticated;
grant insert,update,delete on public.licenses,public.playlists,public.playlist_items,public.media_files to authenticated;
create policy profile_read on public.user_profiles for select to authenticated using(id=auth.uid() or public.exb_is_staff());
create policy profile_insert on public.user_profiles for insert to authenticated with check(id=auth.uid() and coalesce(is_master,false)=false);
create policy profile_update on public.user_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy license_read on public.licenses for select to authenticated using(user_id=auth.uid() or public.exb_is_admin());
create policy license_admin on public.licenses for all to authenticated using(public.exb_is_admin()) with check(public.exb_is_admin());
create policy player_read on public.players for select to authenticated using(user_id=auth.uid() or public.exb_is_staff());
create policy log_read on public.player_logs for select to authenticated using(exists(select 1 from public.players p where p.id=player_logs.player_id and (p.user_id=auth.uid() or public.exb_is_staff())));
create policy analytics_read on public.analytics_daily for select to authenticated using(exists(select 1 from public.players p where p.id=analytics_daily.player_id and p.user_id=auth.uid()));
create policy playlist_owner on public.playlists for all to authenticated using(user_id=auth.uid() and not public.exb_is_readonly()) with check(user_id=auth.uid() and not public.exb_is_readonly());
create policy media_owner on public.media_files for all to authenticated using(user_id=auth.uid() and not public.exb_is_readonly()) with check(user_id=auth.uid() and not public.exb_is_readonly());
create policy playlist_item_owner on public.playlist_items for all to authenticated
 using(not public.exb_is_readonly() and exists(select 1 from public.playlists p where p.id=playlist_items.playlist_id and p.user_id=auth.uid()))
 with check(not public.exb_is_readonly() and exists(select 1 from public.playlists p where p.id=playlist_items.playlist_id and p.user_id=auth.uid()) and
 (media_file_id is null or exists(select 1 from public.media_files m where m.id=playlist_items.media_file_id and m.user_id=auth.uid())));

-- Perfis e papéis administrativos nunca podem ser promovidos por um formulário.
create or replace function public.is_master_user(user_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_roles r where r.user_id=$1 and r.role='admin')
$$;
revoke insert,update,delete on public.user_roles from anon,authenticated;
grant select on public.user_roles to authenticated;

-- Mantém a conta Master existente; o papel admin inclui a visão de supervisão.
-- Outras contas somente de leitura podem receber platform_roles.role='supervisor' pelo servidor.
