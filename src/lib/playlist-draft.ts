import type { PlaylistItem } from '@/hooks/usePlaylistItems';
export const itemPayload=(items:PlaylistItem[])=>items.map(i=>({id:i.id,media_file_id:i.media_file_id||null,media_instance_id:i.media_instance_id||null,duration_override_seconds:i.duration_override_seconds??null,starts_at:i.starts_at||null,ends_at:i.ends_at||null}));
export type PlaylistSettings={name:string;description:string;is_active:boolean;target_platform:string;schedule_timezone:string;information_overlays:any[]};
export const playlistSettings=(row:any):PlaylistSettings=>({name:row.name||'',description:row.description||'',is_active:row.is_active!==false,target_platform:row.target_platform||'all',schedule_timezone:row.schedule_timezone||'America/Fortaleza',information_overlays:row.information_overlays||[]});
export function validSchedule(items:PlaylistItem[]){for(const item of items){if(!item.starts_at&&!item.ends_at)continue;const start=Date.parse(item.starts_at||''),end=Date.parse(item.ends_at||'');if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw new Error('Informe início e fim válidos; o fim precisa ser posterior ao início.');}}
export function appendDraft(items:PlaylistItem[],item:PlaylistItem){
 if(items.length>=5)throw new Error('Uma playlist pode ter no máximo 5 mídias.');
 if(items.some(i=>item.media_instance_id?i.media_instance_id===item.media_instance_id:i.media_file_id===item.media_file_id))throw new Error('Esta mídia já está na playlist.');
 if(item.is_overlay&&items.some(i=>i.is_overlay))throw new Error('Esta playlist já possui uma mensagem de rodapé.');
 return [...items,{...item,display_order:items.length+1}];
}
export function moveDraft(items:PlaylistItem[],id:string,direction:number){const from=items.findIndex(i=>i.id===id),to=from+direction;if(from<0||to<0||to>=items.length)return items;const next=[...items];[next[from],next[to]]=[next[to],next[from]];return next.map((i,index)=>({...i,display_order:index+1}));}
