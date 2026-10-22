import {playlistNumber,assignedPlaylist} from '../_shared/device-playlist.ts';
import { admin,body,check,cors,reply,secret,sha,uuid,unwrap,identity,lease,licenseAllowed,audit,failure,HttpError } from '../_shared/devices.ts';

import { normalizeOverlays, informationData, cityWeather } from '../_shared/information.ts';

import { playbackItems, weatherMediaConfig, playlistTextOverlays, loadPlaylistItems, targetPlatform, platformMatches } from '../_shared/playlist-media.ts';

Deno.serve(async (req: Request) => {
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try {
    const db=admin(), input=await body(req);
    if(input.action==='pair') {
      const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
      const rate=unwrap(await db.rpc('exb_rate_limit',{p_bucket:`pair:${await sha(ip)}`,p_limit:30})); check(rate,'Muitas tentativas de vínculo. Aguarde.',429);
      const code=String(input.code||'').replace(/[-\s]/g,'').toUpperCase();
      check(/^EXB[A-Z2-9]{12}$/.test(code),'Código inválido');
      check(uuid(input.device_id)&&typeof input.claim_secret==='string'&&/^[a-f0-9]{64}$/.test(input.claim_secret),'Identificação inválida');
      check(typeof input.name==='string'&&input.name.trim().length>0&&input.name.trim().length<=100,'Nome inválido');
      const number=playlistNumber(input.playlist_number,true);
      const access='exb_'+secret(), refresh='exb_'+secret();
      const pid=unwrap(await db.rpc('exb_claim_pair_with_playlist',{p_hash:await sha(code),p_device:input.device_id,p_name:input.name,
        p_claim:await sha(input.claim_secret),p_token:await sha(access),p_refresh:await sha(refresh),p_number:number}));
      const who=await identity(db,access);
      await audit(db,String(pid),'Equipamento vinculado à conta');
      return reply({success:true,player_id:pid,account:who.account,name:who.player.name,playlist:await assignedPlaylist(db,who.player),access_token:access,refresh_token:refresh,
        expires_at:new Date(Date.now()+3600000).toISOString(),lease:await lease(db,who)});
    }
    if(input.action==='renew') {
      const who=await identity(db,input.refresh_token,true);
      const access='exb_'+secret();
      check(unwrap(await db.rpc('exb_renew_access',{p_refresh:await sha(input.refresh_token),p_token:await sha(access)})),'Credencial revogada',401);
      return reply({success:true,access_token:access,expires_at:new Date(Date.now()+3600000).toISOString(),lease:await lease(db,who)});
    }
    const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'')||'';
    const who=await identity(db,token), player=who.player;
    if(input.action==='select-playlist') {
      check(licenseAllowed(who),'Licença não autoriza alterar programação',403);
      const number=playlistNumber(input.playlist_number);
      check(unwrap(await db.rpc('exb_rate_limit',{p_bucket:`select-playlist:${player.id}`,p_limit:30})),'Aguarde para alterar a programação',429);
      const playlist=unwrap(await db.rpc('exb_select_device_playlist',{p_player:player.id,p_user:player.user_id,p_number:number}));
      await audit(db,player.id,`Playlist selecionada no equipamento: ID ${number}`);
      return reply({success:true,playlist});
    }
    if(input.action==='heartbeat') {
      const s=input.state&&typeof input.state==='object'?input.state:{};
      const telemetry={exited:s.exited===true,isPlaying:s.isPlaying===true,videoId:typeof s.videoId==='string'?s.videoId.slice(0,100):null,
        videoTitle:typeof s.videoTitle==='string'?s.videoTitle.slice(0,200):null,position:Math.max(0,Math.min(86400,Number(s.position)||0)),
        duration:Math.max(0,Math.min(86400,Number(s.duration)||0)),version:String(s.version||'').slice(0,30)};
      const last=Date.parse(player.last_heartbeat||''),now=Date.now();
      const gap=Number.isFinite(last)&&now-last>180000;
      if(telemetry.exited||!Number.isFinite(last)||player.telemetry?.exited||gap){
        unwrap(await db.from('player_logs').insert({player_id:player.id,log_type:'SYSTEM',message:telemetry.exited?'Player encerrou a conexão':gap?'Conexão retomada após intervalo sem contato':'Player conectado',metadata:{data:{event:'network',status:telemetry.exited?'offline':'online',gap_from:gap?new Date(last+180000).toISOString():null,gap_to:gap?new Date(now).toISOString():null},client_at:new Date(now).toISOString()}}));
      }
      unwrap(await db.from('players').update({last_heartbeat:new Date().toISOString(),is_online:!telemetry.exited,telemetry}).eq('id',player.id));
      return reply({success:true,lease:await lease(db,who),name:player.name,account:who.account,playlist:await assignedPlaylist(db,player)});
    }
    if(input.action==='logs') {
      check(Array.isArray(input.events)&&input.events.length<=50,'Lote inválido');
      const rows=input.events.map((e:any)=>{
        check(uuid(e.id)&&typeof e.message==='string'&&e.message.length<=4000,'Evento inválido');
        check(['ERROR','WARN','INFO','PLAYBACK','SYSTEM'].includes(e.type),'Tipo de evento inválido');
        return {player_id:player.id,event_id:e.id,log_type:e.type,message:e.message,
          metadata:{client_at:e.at||null,data:e.data??null}};
      });
      if(rows.length) unwrap(await db.from('player_logs').upsert(rows,{onConflict:'player_id,event_id',ignoreDuplicates:true}));
      return reply({success:true,ack:input.events.map((e:any)=>e.id)});
    }
    if(input.action==='overlay-data') {
      check(licenseAllowed(who),'Licença não autoriza reprodução',403);
      check(unwrap(await db.rpc('exb_rate_limit',{p_bucket:`information:${player.id}`,p_limit:12})),'Aguarde para atualizar as informações',429);
      if(!player.assigned_playlist_id)return reply({success:true,playlist_id:'unassigned',overlays:[]});
      const playlist=unwrap<any>(await db.from('playlists').select('id,is_active,information_overlays,target_platform').eq('id',player.assigned_playlist_id).eq('user_id',player.user_id).single());
      check(playlist,'Programação indisponível',404);
      const deliveryAllowed=platformMatches(playlist.target_platform,input.platform||'windows');
      if(!deliveryAllowed&&input.action==='overlay-data')return reply({success:true,playlist_id:playlist.id,config:[],media_config:[],overlays:[],media:[]});
      const items=await loadPlaylistItems(db,playlist.id,player.user_id);
      const media_config=weatherMediaConfig(playbackItems(items,player.user_id,playlist.is_active&&deliveryAllowed));
      const config=playlist.is_active&&deliveryAllowed?playlistTextOverlays(items,player.user_id,playlist.information_overlays):[];
      const [overlays,media]=await Promise.all([informationData(config),Promise.all(media_config.map(async m=>({...m,data:m.weather?await cityWeather(m.weather):(await informationData([{kind:'rss',source:m.rss.source}]))[0]})))]);
      return reply({success:true,playlist_id:playlist.id,config,media_config,overlays,media});
    }
    if(input.action==='manifest') {
      check(licenseAllowed(who),'Licença não autoriza reprodução',403);
      if(!player.assigned_playlist_id) return reply({success:true,manifest:{id:'unassigned',name:'Sem programação',videos:[],overlays:[],version:'unassigned',explicit_empty:true}});
      const playlist=unwrap<any>(await db.from('playlists').select('*').eq('id',player.assigned_playlist_id).eq('user_id',player.user_id).single());
      check(playlist,'Programação indisponível',404);
      const deliveryAllowed=platformMatches(playlist.target_platform,input.platform||'windows');
      const items=await loadPlaylistItems(db,playlist.id,player.user_id);
      const videos=playbackItems(items,player.user_id,playlist.is_active&&deliveryAllowed).map(v=>{const item=items.find(i=>i.id===v.id);return {...v,starts_at:item?.starts_at||null,ends_at:item?.ends_at||null};});
      const manifest={schema_version:3,publication_id:playlist.publication_id||null,schedule_timezone:playlist.schedule_timezone||'America/Fortaleza',id:playlist.id,sequential_id:playlist.sequential_id,name:playlist.name,target_platform:targetPlatform(playlist.target_platform),message:deliveryAllowed?null:'Esta playlist foi destinada a outra plataforma. Altere a plataforma no site ou selecione outra playlist.',videos,overlays:playlist.is_active&&deliveryAllowed?playlistTextOverlays(items,player.user_id,playlist.information_overlays):[],explicit_empty:videos.length===0};
      // Links expiráveis não alteram a identidade da programação/cache.
      const version=await sha(JSON.stringify(manifest));
      const {downloadUrl}=await import('../_shared/r2.ts');
      const signedVideos=await Promise.all(videos.map(async v=>({...v,...(['video','image'].includes(v.mimeType)?{url:await downloadUrl(v.url,player.user_id)}:{}),...(v.backgroundAsset?{backgroundAsset:{...v.backgroundAsset,url:await downloadUrl(v.backgroundAsset.url,player.user_id)}}:{})})));
      return reply({success:true,manifest:{...manifest,videos:signedVideos,version}});
    }
    if(input.action==='disconnect') {
      unwrap(await db.from('players').update({revoked_at:new Date().toISOString(),is_online:false}).eq('id',player.id));
      await audit(db,player.id,'Vínculo encerrado pelo equipamento'); return reply({success:true});
    }
    throw new HttpError(400,'Operação desconhecida');
  }catch(error){return failure(error);}
});
