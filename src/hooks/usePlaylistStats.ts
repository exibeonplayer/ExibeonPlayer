import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Playlist } from './usePlaylists';

export interface PlaylistStats {
  totalVideos: number;
  totalDuration: string;
  assignedPlayers: number;
}

export const usePlaylistStats = (playlist: Playlist) => {
  const [stats, setStats] = useState<PlaylistStats>({
    totalVideos: 0,
    totalDuration: '00:00:00',
    assignedPlayers: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Buscar itens da playlist com durações
      const { data: playlistItems, error: itemsError } = await supabase
        .from('playlist_items')
        .select(`
          media_files (
            duration_seconds
          )
        `)
        .eq('playlist_id', playlist.id);

      if (itemsError) throw itemsError;

      console.log('Playlist items encontrados:', playlistItems);

      // Calcular total de vídeos
      const totalVideos = playlistItems?.length || 0;

      // Calcular duração total
      const totalSeconds = playlistItems?.reduce((total, item) => {
        return total + (item.media_files?.duration_seconds || 0);
      }, 0) || 0;

      // Formatar duração
      const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      // Buscar players associados (usando tabela players)
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('playlist_name', playlist.name)
        .eq('user_id', playlist.user_id);

      const assignedPlayers = players?.length || 0;

      console.log('Players associados encontrados:', players);
      console.log('Total de vídeos:', totalVideos);
      console.log('Duração total em segundos:', totalSeconds);
      console.log('Players associados:', assignedPlayers);

      setStats({
        totalVideos,
        totalDuration: formatDuration(totalSeconds),
        assignedPlayers
      });
    } catch (error) {
      console.error('Error fetching playlist stats:', error);
      setStats({
        totalVideos: 0,
        totalDuration: '00:00:00',
        assignedPlayers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlist?.id) {
      fetchStats();
    }
  }, [playlist?.id]);

  return {
    stats,
    loading,
    refreshStats: fetchStats
  };
};
