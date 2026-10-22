import {check,unwrap,uuid} from './devices.ts';
// Every query is scoped on the server, including joins used to label history.
export async function reportData(db:any,userId:string,master:boolean,input:any){
 const until=new Date().toISOString(),from=new Date(input.from),to=new Date(input.to);
 check(Number.isFinite(+from)&&Number.isFinite(+to)&&+to>+from&&+to-+from<=366*86400000,'Escolha um período válido de até 366 dias.');
 check(!input.player_id||uuid(input.player_id),'Player inválido');
 const all=master&&input.scope==='all';
 const load=async(make:()=>any)=>{const rows:any[]=[];for(let offset=0;offset<=10000;offset+=500){const batch=unwrap<any[]>(await make().order('id').range(offset,offset+499));rows.push(...batch);check(rows.length<=10000,'O relatório ultrapassa 10.000 registros. Reduza o período ou selecione um player.',413);if(batch.length<500)return rows;}return rows;};
 const owned=(table:string,columns:string)=>{let q=db.from(table).select(columns);if(!all)q=q.eq('user_id',userId);return q;};
 const players=await load(()=>owned('players','id,user_id,name,location,created_at,last_heartbeat,assigned_playlist_id,revoked_at,telemetry').lte('created_at',until));
 check(!input.player_id||players.some(p=>p.id===input.player_id),'Player não encontrado nesta conta',403);
 const selected=players.filter(p=>!input.player_id||p.id===input.player_id),ids=selected.map(p=>p.id);
 const logs:any[]=[];
 for(let i=0;i<ids.length;i+=100){const chunk=ids.slice(i,i+100);logs.push(...await load(()=>db.from('player_logs').select('id,player_id,log_type,message,metadata,created_at').in('player_id',chunk).gte('created_at',from.toISOString()).lt('created_at',to.toISOString()).lte('created_at',until)));check(logs.length<=10000,'O relatório ultrapassa 10.000 eventos. Reduza o período ou selecione um player.',413);}
 const playlists=await load(()=>owned('playlists','id,user_id,name,target_platform,is_active,created_at,updated_at'));
 const licenses=await load(()=>owned('licenses','id,user_id,status,start_date,end_date,max_players'));
 const files=await load(()=>owned('media_files','id,user_id,title,content_type,duration_seconds,file_size_bytes'));
 const instances=await load(()=>{let q=db.from('media_instances').select('id,created_by,name');if(!all)q=q.eq('created_by',userId);return q;});
 const items:any[]=[];for(let i=0;i<playlists.length;i+=100){const chunk=playlists.slice(i,i+100).map(p=>p.id);items.push(...await load(()=>db.from('playlist_items').select('id,playlist_id,media_file_id,media_instance_id,is_overlay,starts_at,ends_at,duration_override_seconds,display_order').in('playlist_id',chunk)));check(items.length<=10000,'Há muitos itens de programação para este relatório.',413);}
 const owners=[...new Set([...players,...licenses].map(p=>p.user_id))],accounts:any[]=[];
 for(let i=0;i<owners.length;i+=100)accounts.push(...unwrap<any[]>(await db.from('user_profiles').select('id,name,email').in('id',owners.slice(i,i+100))));
 return {success:true,generated_at:until,from:from.toISOString(),to:to.toISOString(),scope:all?'all':'own',players,selected_player_id:input.player_id||null,accounts,logs:logs.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id)),playlists,licenses,files,instances,items,time_basis:'received',limit:10000};
}
