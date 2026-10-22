alter table public.playlist_items add column if not exists starts_at timestamptz, add column if not exists ends_at timestamptz;
alter table public.playlist_items add constraint playlist_items_valid_period check ((starts_at is null and ends_at is null) or (starts_at is not null and ends_at is not null and ends_at>starts_at));
alter table public.playlists add column if not exists publication_id uuid not null default gen_random_uuid(), add column if not exists schedule_timezone text not null default 'America/Fortaleza';
-- A single transaction publishes the draft. Existing playback remains visible until commit.
drop function if exists public.exb_save_playlist_items(uuid,jsonb,timestamptz);
create or replace function public.exb_save_playlist_items(p_playlist uuid,p_items jsonb,p_expected_updated_at timestamptz,p_settings jsonb default null)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid(); current_version timestamptz; saved_version timestamptz;
  row_data jsonb; file_id uuid; instance_id uuid; item_id uuid; position integer := 0;
  overlay_count integer := 0; overlay boolean; config jsonb; media_type text;
begin
  if owner_id is null or public.exb_is_readonly() then raise exception 'Conta sem permissão para salvar playlists' using errcode='42501'; end if;
  select updated_at into current_version from public.playlists where id=p_playlist and user_id=owner_id for update;
  if not found then raise exception 'Playlist indisponível' using errcode='42501'; end if;
  if p_expected_updated_at is null or current_version is distinct from p_expected_updated_at then raise exception 'Esta playlist mudou em outra janela. Reabra o gerenciador antes de salvar.' using errcode='40001'; end if;
  if p_settings is not null then
    if jsonb_typeof(p_settings)<>'object' or length(trim(coalesce(p_settings->>'name','')))=0 or length(p_settings->>'name')>100 then raise exception 'Nome da playlist inválido'; end if;
    if coalesce(p_settings->>'target_platform','all') not in ('all','windows','android','android_tv') then raise exception 'Plataforma inválida'; end if;
    if not exists(select 1 from pg_catalog.pg_timezone_names where name=coalesce(p_settings->>'schedule_timezone','America/Fortaleza')) then raise exception 'Fuso horário inválido'; end if;
    if jsonb_typeof(coalesce(p_settings->'information_overlays','[]'))<>'array' or jsonb_array_length(coalesce(p_settings->'information_overlays','[]'))>4 or length(coalesce(p_settings->>'description',''))>1000 then raise exception 'Configuração inválida'; end if;
  end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Lista de mídias inválida'; end if;
  if jsonb_array_length(p_items)>5 then raise exception 'Uma playlist pode ter no máximo 5 mídias'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i group by i->>'id' having count(*)>1) then raise exception 'Item duplicado'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i group by coalesce(i->>'media_instance_id',i->>'media_file_id') having count(*)>1) then raise exception 'Mídia duplicada'; end if;
  -- Validate the complete payload before replacing anything. RLS stays in force.
  for row_data in select value from jsonb_array_elements(p_items) loop
    if (row_data->>'starts_at' is null)<>(row_data->>'ends_at' is null) then raise exception 'Informe início e fim da programação'; end if;
    if row_data->>'starts_at' is not null and (row_data->>'ends_at')::timestamptz <= (row_data->>'starts_at')::timestamptz then raise exception 'O fim precisa ser posterior ao início'; end if;
    item_id := (row_data->>'id')::uuid; file_id := nullif(row_data->>'media_file_id','')::uuid; instance_id := nullif(row_data->>'media_instance_id','')::uuid;
    if item_id is null or (file_id is null and instance_id is null) then raise exception 'Referência de mídia inválida'; end if;
    if file_id is not null and not exists(select 1 from public.media_files f where f.id=file_id and f.user_id=owner_id and f.content_type::text in ('video','image','weather_realtime')) then raise exception 'Arquivo indisponível ou de outra conta' using errcode='42501'; end if;
    overlay := false;
    if instance_id is not null then
      select t.media_type::text, m.custom_config into media_type,config from public.media_instances m join public.media_templates t on t.id=m.template_id where m.id=instance_id and m.created_by=owner_id and m.is_active;
      if not found then raise exception 'Mídia indisponível ou de outra conta' using errcode='42501'; end if;
      overlay := media_type='overlay';
      if overlay and length(trim(coalesce(config->>'bar_text','')))=0 then raise exception 'A mensagem de rodapé está vazia'; end if;
      if media_type='static' and not exists(select 1 from public.media_files f where f.id=coalesce(config->>'media_file_id',config->>'video_file_id')::uuid and f.user_id=owner_id and f.content_type::text in ('video','image')) then raise exception 'O arquivo desta mídia não está mais disponível'; end if;
      if media_type<>'rss' and config->>'background_media_id' is not null and not exists(select 1 from public.media_files f where f.id=(config->>'background_media_id')::uuid and f.user_id=owner_id and f.content_type::text='image') then raise exception 'A imagem de fundo não está mais disponível'; end if;
    end if;
    if file_id is not null and instance_id is not null and not overlay then raise exception 'Use apenas uma referência por mídia'; end if;
    if overlay then overlay_count:=overlay_count+1; end if;
    if row_data->>'duration_override_seconds' is not null and ((row_data->>'duration_override_seconds')::integer not between 5 and 300) then raise exception 'Duração inválida'; end if;
  end loop;
  if overlay_count>1 then raise exception 'Use apenas uma mensagem de rodapé por playlist'; end if;
  delete from public.playlist_items where playlist_id=p_playlist;
  for row_data in select value from jsonb_array_elements(p_items) loop
    position:=position+1; instance_id:=nullif(row_data->>'media_instance_id','')::uuid;
    select t.media_type::text='overlay',m.custom_config into overlay,config from public.media_instances m join public.media_templates t on t.id=m.template_id where m.id=instance_id;
    insert into public.playlist_items(id,playlist_id,media_file_id,media_instance_id,display_order,duration_override_seconds,is_overlay,overlay_z_index,overlay_config,starts_at,ends_at)
    values((row_data->>'id')::uuid,p_playlist,nullif(row_data->>'media_file_id','')::uuid,instance_id,position,(row_data->>'duration_override_seconds')::integer,coalesce(overlay,false),1000,case when overlay then jsonb_build_object('bar_text',config->>'bar_text','bar_position',coalesce(config->>'bar_position','bottom')) else null end,(row_data->>'starts_at')::timestamptz,(row_data->>'ends_at')::timestamptz);
  end loop;
  update public.playlists set
    name=case when p_settings is null then name else trim(p_settings->>'name') end,
    description=case when p_settings is null then description else coalesce(p_settings->>'description','') end,
    is_active=case when p_settings is null then is_active else coalesce((p_settings->>'is_active')::boolean,true) end,
    target_platform=case when p_settings is null then target_platform else coalesce(p_settings->>'target_platform','all') end,
    schedule_timezone=case when p_settings is null then schedule_timezone else coalesce(p_settings->>'schedule_timezone','America/Fortaleza') end,
    information_overlays=case when p_settings is null then information_overlays else coalesce(p_settings->'information_overlays','[]') end,
    publication_id=gen_random_uuid(),updated_at=clock_timestamp() where id=p_playlist and user_id=owner_id returning updated_at into saved_version;
  return saved_version;
end;
$$;
revoke all on function public.exb_save_playlist_items(uuid,jsonb,timestamptz,jsonb) from public,anon;
grant execute on function public.exb_save_playlist_items(uuid,jsonb,timestamptz,jsonb) to authenticated;
