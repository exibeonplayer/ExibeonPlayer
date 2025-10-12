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
  // Real-time stats (from player_stats or player_sessions)
  is_online?: boolean;
  current_video_title?: string;
  playback_time?: number; // ms
  total_time?: number; // ms
  volume?: number;
  cpu_usage?: number;
  memory_usage?: number;
  last_update?: string;
  session_start?: string;
  total_playback_session?: number; // ms
  videos_played_session?: number;
}

export const usePlayerAssociationsStatic = () => {
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
      const { data: associations, error: assocError } = await supabase
        .from('player_associations')
        .select('*')
        .eq('user_id', user.id)
        .order('associated_at', { ascending: false });

      if (assocError) throw assocError;

      const playersWithStats: PlayerAssociation[] = await Promise.all(
        (associations || []).map(async (assoc) => {
          const { data: latestStat, error: statError } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', assoc.player_id)
            .order('last_update', { ascending: false })
            .limit(1)
            .single();

          const { data: latestSession, error: sessionError } = await supabase
            .from('player_sessions')
            .select('*')
            .eq('player_id', assoc.player_id)
            .order('session_start', { ascending: false })
            .limit(1)
            .single();

          if (statError && statError.code !== 'PGRST116') console.error('Error fetching player stat:', statError);
          if (sessionError && sessionError.code !== 'PGRST116') console.error('Error fetching player session:', sessionError);

          return {
            ...assoc,
            is_online: latestStat?.is_online ?? false,
            current_video_title: latestStat?.video_title,
            playback_time: latestStat?.playback_time,
            total_time: latestStat?.total_time,
            volume: latestStat?.volume,
            cpu_usage: latestStat?.cpu_usage,
            memory_usage: latestStat?.memory_usage,
            last_update: latestStat?.last_update,
            session_start: latestSession?.session_start,
            total_playback_session: latestSession?.total_playback,
            videos_played_session: latestSession?.videos_played,
          };
        })
      );
      setPlayers(playersWithStats);
    } catch (error) {
      console.error('Error fetching player associations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const updatePlayerName = async (playerId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('player_associations')
        .update({ player_name: newName, updated_at: new Date().toISOString() })
        .eq('player_id', playerId)
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
      const { error } = await supabase
        .from('player_associations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('player_id', playerId)
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
      const { error } = await supabase
        .from('player_associations')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('player_id', playerId)
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
        .from('player_associations')
        .delete()
        .eq('player_id', playerId)
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

  // Só buscar quando solicitado explicitamente
  // Não há useEffect automático aqui

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
