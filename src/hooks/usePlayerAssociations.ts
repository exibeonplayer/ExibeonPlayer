import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PlayerAssociation {
  id: string;
  player_name: string;
  player_code: string;
  player_id: string;
  user_id: string;
  associated_at: string;
  is_active: boolean;
  last_seen: string;
  ip_address?: string;
  device_info: {
    os?: string;
    electron_version?: string;
    screen_resolution?: string;
    [key: string]: any;
  };
}

export interface PlayerWithStats extends PlayerAssociation {
  current_video?: {
    title: string;
    playback_time: number;
    total_time: number;
    is_playing: boolean;
  };
  is_online: boolean;
  volume?: number;
  cpu_usage?: number;
  memory_usage?: number;
}

export const usePlayerAssociations = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlayers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar associações de players
      const { data: associations, error: assocError } = await supabase
        .from('player_associations')
        .select('*')
        .eq('user_id', user.id)
        .order('associated_at', { ascending: false });

      if (assocError) throw assocError;

      if (!associations || associations.length === 0) {
        setPlayers([]);
        return;
      }

      // Buscar stats mais recentes para cada player
      const playerIds = associations.map(p => p.player_id);
      
      const { data: stats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', playerIds)
        .order('last_update', { ascending: false });

      if (statsError) {
        console.error('Error fetching stats:', statsError);
      }

      // Combinar associações com stats
      const playersWithStats: PlayerWithStats[] = associations.map(assoc => {
        const playerStat = stats?.find(s => s.player_id === assoc.player_id);
        
        // Verificar se está online (última atualização há menos de 30 segundos)
        const isOnline = playerStat 
          ? new Date().getTime() - new Date(playerStat.last_update).getTime() < 30000
          : false;

        return {
          ...assoc,
          is_online: isOnline,
          current_video: playerStat && playerStat.video_title ? {
            title: playerStat.video_title,
            playback_time: playerStat.playback_time,
            total_time: playerStat.total_time,
            is_playing: playerStat.is_playing,
          } : undefined,
          volume: playerStat?.volume,
          cpu_usage: playerStat?.cpu_usage ? Number(playerStat.cpu_usage) : undefined,
          memory_usage: playerStat?.memory_usage ? Number(playerStat.memory_usage) : undefined,
        };
      });

      setPlayers(playersWithStats);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivatePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('player_associations')
        .update({ is_active: false })
        .eq('player_id', playerId);

      if (error) throw error;

      setPlayers(prev => prev.map(player =>
        player.player_id === playerId ? { ...player, is_active: false } : player
      ));

      toast({
        title: "Player Desativado",
        description: "Player desativado com sucesso",
      });
    } catch (error) {
      console.error('Error deactivating player:', error);
      toast({
        title: "Erro",
        description: "Erro ao desativar player",
        variant: "destructive",
      });
      throw error;
    }
  };

  const activatePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('player_associations')
        .update({ is_active: true })
        .eq('player_id', playerId);

      if (error) throw error;

      setPlayers(prev => prev.map(player =>
        player.player_id === playerId ? { ...player, is_active: true } : player
      ));

      toast({
        title: "Player Ativado",
        description: "Player ativado com sucesso",
      });
    } catch (error) {
      console.error('Error activating player:', error);
      toast({
        title: "Erro",
        description: "Erro ao ativar player",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('player_associations')
        .delete()
        .eq('player_id', playerId);

      if (error) throw error;

      setPlayers(prev => prev.filter(player => player.player_id !== playerId));

      toast({
        title: "Player Removido",
        description: "Player removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover player",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlayerName = async (playerId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('player_associations')
        .update({ player_name: newName })
        .eq('player_id', playerId);

      if (error) throw error;

      setPlayers(prev => prev.map(player =>
        player.player_id === playerId ? { ...player, player_name: newName } : player
      ));

      toast({
        title: "Nome Atualizado",
        description: "Nome do player atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating player name:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar nome do player",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlayers();
      
      // Atualizar a cada 5 segundos para mostrar status em tempo real
      const interval = setInterval(() => {
        fetchPlayers();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user?.id]); // Só re-executa quando o ID do usuário muda

  return {
    players,
    loading,
    deactivatePlayer,
    activatePlayer,
    deletePlayer,
    updatePlayerName,
    refetch: fetchPlayers,
  };
};
