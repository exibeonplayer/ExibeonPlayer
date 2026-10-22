import {useEffect,useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/contexts/AuthContext';
import type {Playlist} from './usePlaylists';
import {calculateAdvancedMediaDuration} from '@/utils/mediaDuration';
import {subscribePlaylistsChanged} from '@/lib/playlist-events';

export interface PlaylistStats {
  totalVideos:number;
  totalItems:number;
  totalDuration:string;
  assignedPlayers:number|null;
}
const emptyStats=():PlaylistStats=>({totalVideos:0,totalItems:0,totalDuration:'00:00:00',assignedPlayers:null});

export const usePlaylistStats=(playlist:Playlist)=>{
  const {user}=useAuth();
  const [stats,setStats]=useState<PlaylistStats>(emptyStats);
  const [loading,setLoading]=useState(true);
  const [playersError,setPlayersError]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let active=true,countBusy=false;
    setStats(emptyStats());setPlayersError('');setLoading(true);
    if(!user?.id||!playlist?.id||playlist.user_id!==user.id){setLoading(false);return;}
    const owner=user.id,id=playlist.id;
    async function countPlayers(){
      if(countBusy)return;countBusy=true;
      try{
        const {count,error}=await (supabase as any).from('players')
          .select('id',{count:'exact',head:true})
          .eq('assigned_playlist_id',id).eq('user_id',owner)
          .is('revoked_at',null).not('device_id','is',null);
        if(error)throw error;
        if(typeof count!=='number')throw new Error('Contagem indisponível');
        if(active){setStats(previous=>({...previous,assignedPlayers:count}));setPlayersError('');}
      }catch{
        if(active){setStats(previous=>({...previous,assignedPlayers:null}));setPlayersError('Não foi possível atualizar o contador de players.');}
      }finally{countBusy=false;}
    }
    async function loadItems(){
      try{
        const {data,error}=await (supabase as any).from('playlist_items').select('media_files(duration_seconds),media_instances(id,name,custom_config,template:media_templates(media_type))').eq('playlist_id',id);
        if(error)throw error;
        const items=(data||[]) as any[];
        const seconds=items.reduce((sum,item)=>sum+(item.media_files?.duration_seconds||(item.media_instances?calculateAdvancedMediaDuration(item.media_instances):0)),0);
        const duration=[Math.floor(seconds/3600),Math.floor(seconds%3600/60),Math.floor(seconds%60)].map(n=>String(n).padStart(2,'0')).join(':');
        if(active)setStats(previous=>({...previous,totalItems:items.length,totalVideos:items.filter(item=>item.media_files).length,totalDuration:duration}));
      }catch{ /* Keep the player count independent from content statistics. */ }
    }
    void Promise.all([loadItems(),countPlayers()]).finally(()=>{if(active)setLoading(false);});
    const timer=setInterval(()=>{void countPlayers();},5000);
    const unsubscribe=subscribePlaylistsChanged(owner,()=>{void countPlayers();});
    return ()=>{active=false;clearInterval(timer);unsubscribe();};
  },[user?.id,playlist?.id,playlist?.user_id,playlist?.updated_at,revision]);
  return {stats,loading,playersError,refreshStats:()=>setRevision(value=>value+1)};
};
