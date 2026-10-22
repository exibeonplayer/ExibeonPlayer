import {check,unwrap} from './devices.ts';
export function playlistNumber(value: unknown, optional=false): number | null {
  if(optional && (value===null || value===undefined || value==='')) return null;
  check((typeof value==='string' && /^[0-9]{1,10}$/.test(value)) || typeof value==='number','Informe um ID numérico de playlist');
  const number=Number(value);
  check(Number.isInteger(number) && number>0 && number<=2147483647,'ID de playlist inválido');
  return number;
}
export async function assignedPlaylist(db: any, player: any) {
  if(!player.assigned_playlist_id) return null;
  const p=unwrap<any>(await db.from('playlists').select('id,sequential_id,name').eq('id',player.assigned_playlist_id).eq('user_id',player.user_id).maybeSingle());
  return p ? {id:p.id,number:p.sequential_id,name:p.name} : null;
}
