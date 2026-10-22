import {createAccount,deleteAccount} from '../_shared/accounts.ts';
import {reportData} from '../_shared/reports.ts';
import { admin, body, check, cors, reply, sha, uuid, unwrap, audit, failure, HttpError } from '../_shared/devices.ts';

Deno.serve(async (req: Request) => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  try {
    const db=admin(); const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');
    check(token,'Autenticação necessária',401);
    const auth=await db.auth.getUser(token); check(!auth.error && auth.data.user,'Sessão inválida',401);
    const user=auth.data.user!; const input=await body(req);
    const role=unwrap<any>(await db.from('platform_roles').select('role').eq('user_id',user.id).maybeSingle())?.role ?? 'customer';
    const staff=role==='admin';
    if(input.action==='create-user') return reply(await createAccount(db,user.id,role,input));
    if(input.action==='delete-user') return reply(await deleteAccount(db,user.id,role,input));
    if(input.action==='role') return reply({success:true,role});
    if(input.action==='reports') return reply(await reportData(db,user.id,staff,input));
    if(input.action==='media-urls') {
      check(Array.isArray(input.ids)&&input.ids.length<=100&&input.ids.every(uuid),'Lista de mídias inválida');
      const media=unwrap<any[]>(await db.from('media_files').select('id,file_url,thumbnail_url').in('id',input.ids).eq('user_id',user.id));
      const {downloadUrl}=await import('../_shared/r2.ts');
      return reply({success:true,media:await Promise.all(media.map(async m=>({...m,file_url:await downloadUrl(m.file_url,user.id),thumbnail_url:m.thumbnail_url?await downloadUrl(m.thumbnail_url,user.id):null})))});
    }
    if(input.action==='list') {
      const limit=Math.min(100,Math.max(1,Number(input.limit)||50));
      const offset=Math.max(0,Number(input.offset)||0);
      let q=db.from('players').select('*',{count:'exact'}).is('revoked_at',null).order('created_at',{ascending:false}).range(offset,offset+limit-1);
      if(!staff || input.scope==='own') q=q.eq('user_id',user.id);
      const result=await q; const players=unwrap<any[]>(result);
      const owners=[...new Set(players.map(p=>p.user_id))];
      const profiles=owners.length ? unwrap<any[]>(await db.from('user_profiles').select('id,email,name').in('id',owners)) : [];
      const licenses=owners.length ? unwrap<any[]>(await db.from('licenses').select('user_id,status,end_date').in('user_id',owners)) : [];
      let capacity=null;
      if(!staff||input.scope==='own') {
        const license=unwrap<any>(await db.from('licenses').select('max_players').eq('user_id',user.id).maybeSingle());
        const count=await db.from('players').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('revoked_at',null);
        unwrap(count);
        const max=license?.max_players??0,used=count.count??0;
        capacity={max,used,available:Math.max(0,max-used)};
      }
      return reply({success:true,role,total:result.count,capacity,players:players.map(p=>({...p,
        license_status:licenses.find(l=>l.user_id===p.user_id)?.status, license_expires:licenses.find(l=>l.user_id===p.user_id)?.end_date,
        owner:profiles.find(u=>u.id===p.user_id),
        online:!p.revoked_at && p.telemetry?.exited!==true && !!p.last_heartbeat && Date.now()-Date.parse(p.last_heartbeat)<180000
      }))});
    }
    if(input.action==='logs') {
      check(uuid(input.player_id),'Player inválido');
      const player=unwrap<any>(await db.from('players').select('id,user_id').eq('id',input.player_id).single());
      check(player && (staff||player.user_id===user.id),'Acesso negado',403);
      const before=input.before ? new Date(input.before).toISOString() : null;
      let q=db.from('player_logs').select('*').eq('player_id',player.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(100);
      if(before) q=q.lt('created_at',before);
      return reply({success:true,logs:unwrap(await q)});
    }
    check(role!=='supervisor','Supervisor possui acesso somente de leitura',403);
    if(input.action==='upload-url') {
      const license=unwrap<any>(await db.from('licenses').select('status,end_date,start_date').eq('user_id',user.id).single());
      check(license?.status==='active'&&(!license.end_date||Date.parse(license.end_date)>Date.now())&&(!license.start_date||Date.parse(license.start_date)<=Date.now()),'Licença não autoriza upload',403);
      const {uploadUrl}=await import('../_shared/r2.ts');
      return reply({success:true,...await uploadUrl(user.id,input)});
    }
    if(input.action==='generate-code') {
      check(input.playlist_id===null || input.playlist_id===undefined || uuid(input.playlist_id),'Playlist inválida');
      check(input.player_id===null || input.player_id===undefined || uuid(input.player_id),'Player inválido');
      const rate=unwrap(await db.rpc('exb_rate_limit',{p_bucket:`codes:${user.id}`,p_limit:30})); check(rate,'Muitas tentativas. Aguarde alguns minutos.',429);
      // Código com 60 bits aleatórios, expiração curta e apenas hash persistido.
      const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const bytes=crypto.getRandomValues(new Uint8Array(12));
      const code='EXB'+[...bytes].map(b=>chars[b%chars.length]).join('');
      const expiry=unwrap(await db.rpc('exb_create_pair_code',{p_user:user.id,p_hash:await sha(code),p_playlist:input.playlist_id??null,p_target:input.player_id??null}));
      return reply({success:true,code,expires_at:expiry});
    }
    check(uuid(input.player_id),'Player inválido');
    const player=unwrap<any>(await db.from('players').select('*').eq('id',input.player_id).single());
    check(player && (player.user_id===user.id || role==='admin'),'Acesso negado',403);
    if(input.action==='update') {
      const update: Record<string,unknown>={};
      if(input.name!==undefined){check(typeof input.name==='string'&&input.name.trim().length>0&&input.name.trim().length<=100,'Nome inválido'); update.name=input.name.trim();}
      if(input.playlist_id!==undefined) {
        check(input.playlist_id===null||uuid(input.playlist_id),'Playlist inválida');
        if(input.playlist_id) {
          const playlist=unwrap<any>(await db.from('playlists').select('id,user_id').eq('id',input.playlist_id).single());
          check(playlist.user_id===player.user_id,'A playlist deve pertencer à conta do player',403);
        }
        update.assigned_playlist_id=input.playlist_id;
      }
      check(Object.keys(update).length,'Nenhuma alteração informada');
      unwrap(await db.from('players').update(update).eq('id',player.id));
      await audit(db,player.id,'Nome ou programação alterados pelo gestor'); return reply({success:true});
    }
    if(input.action==='revoke') {
      unwrap(await db.from('players').update({revoked_at:new Date().toISOString(),is_online:false}).eq('id',player.id));
      await audit(db,player.id,'Vínculo revogado pelo gestor'); return reply({success:true});
    }
    throw new HttpError(400,'Operação desconhecida');
  } catch(error) { return failure(error); }
});
