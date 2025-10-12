import { useState, useEffect, useCallback } from 'react';
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
  device_info?: any;
  // Real-time stats
  is_online?: boolean;
  current_video_title?: string;
  playlist_name?: string;
  playback_time?: number;
  total_time?: number;
  volume?: number;
  cpu_usage?: number;
  memory_usage?: number;
  last_update?: string;
  session_start?: string;
  total_playback_session?: number;
  videos_played_session?: number;
  // Campos da tabela antiga (players)
  status?: string;
  location?: string;
  uptime_seconds?: number;
  connection_losses?: number;
}

export const usePlayerAssociationsFixed = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlayers = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Usando tabela legada: players');

      // Buscar diretamente da tabela players (modelo legado)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (playersError) {
        console.error('Erro ao buscar players:', playersError);
        throw playersError;
      }

      if (playersData && playersData.length > 0) {
        console.log(`✅ Encontrados ${playersData.length} players na tabela players`);
        
        // Converter formato da tabela antiga para o novo
        const convertedPlayers: PlayerAssociation[] = playersData.map((player) => {
          // Usar diretamente a coluna is_online da tabela players
          const isOnline = player.is_online || false;
          console.log(`📊 Player ${player.name}: ${isOnline ? 'ONLINE' : 'OFFLINE'} (is_online=${player.is_online}) - ${player.playlist_name || 'Sem playlist'}`);
          
          return {
            id: player.id,
            player_name: player.name,
            player_code: player.code,
            player_id: player.id,
            user_id: player.user_id,
            associated_at: player.created_at,
            is_active: player.status !== 'inactive',
            last_seen: player.last_heartbeat || player.updated_at,
            ip_address: player.ip_address,
            device_info: {},
            is_online: isOnline,
            // Campos específicos da tabela players
            current_video_title: player.current_video_title,
            playback_time: player.playback_time,
            total_time: player.total_time,
            volume: player.volume,
            cpu_usage: player.cpu_usage,
            memory_usage: player.memory_usage,
            last_update: player.last_heartbeat,
            status: player.status,
            location: player.location,
            uptime_seconds: player.uptime_seconds,
            connection_losses: player.connection_losses,
            // Usar playlist_name em vez de current_video_title
            playlist_name: player.playlist_name,
            // Adicionar current_video para compatibilidade com PlayerCard
            current_video: player.playlist_name ? {
              title: player.playlist_name,
              playback_time: player.playback_time || 0,
              total_time: player.total_time || 0,
              is_playing: player.is_playing || false
            } : undefined,
          };
        });

        setPlayers(convertedPlayers);
        console.log(`✅ ${convertedPlayers.length} players carregados da tabela players`);
      } else {
        console.log('📭 Nenhum player encontrado na tabela players');
        setPlayers([]);
        
        toast({
          title: "Sem Players",
          description: "Nenhum player foi encontrado. Gere um código de integração para conectar players.",
        });
      }

    } catch (error) {
      console.error('❌ Erro ao buscar players:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar players. Verifique o console para detalhes.",
        variant: "destructive",
      });
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const updatePlayerName = async (playerId: string, newName: string) => {
    try {
      const updateData = {
        name: newName,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Nome do player atualizado." });
      await fetchPlayers();
    } catch (error) {
      console.error('Error updating player name:', error);
      toast({ title: "Erro", description: "Falha ao atualizar nome do player.", variant: "destructive" });
      throw error;
    }
  };

  const deactivatePlayer = async (playerId: string) => {
    try {
      const updateData = { 
        status: 'inactive', 
        updated_at: new Date().toISOString() 
      };

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Player desativado." });
      await fetchPlayers();
    } catch (error) {
      console.error('Error deactivating player:', error);
      toast({ title: "Erro", description: "Falha ao desativar player.", variant: "destructive" });
      throw error;
    }
  };

  const activatePlayer = async (playerId: string) => {
    try {
      const updateData = { 
        status: 'online', 
        updated_at: new Date().toISOString() 
      };

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Player ativado." });
      await fetchPlayers();
    } catch (error) {
      console.error('Error activating player:', error);
      toast({ title: "Erro", description: "Falha ao ativar player.", variant: "destructive" });
      throw error;
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Player removido." });
      await fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({ title: "Erro", description: "Falha ao remover player.", variant: "destructive" });
      throw error;
    }
  };

      // Busca inicial apenas quando o componente é montado
      useEffect(() => {
        if (user) {
          fetchPlayers();
        }
      }, [user?.id, fetchPlayers]);

  return {
    players,
    loading,
    updatePlayerName,
    deactivatePlayer,
    activatePlayer,
    deletePlayer,
    refetch: fetchPlayers,
  };
};
