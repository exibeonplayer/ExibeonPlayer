import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Player {
  id: string;
  player_id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  status: string;
  ip?: string;
  last_activity: string;
  uptime?: string;
  connection_losses?: number;
  api_key: string;
  playlist_url: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  is_online?: boolean;
}

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPlayers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers((data as any) || []);
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

  const addPlayer = async (playerData: Omit<Player, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // ✅ Garantir que o user_id seja sempre do usuário atual
      const playerDataWithUser = {
        ...playerData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('players' as any)
        .insert([playerDataWithUser])
        .select()
        .single();

      if (error) throw error;

      console.log(`🎮 Player adicionado para usuário ${user.email}:`, (data as unknown as Player)?.name);
      setPlayers(prev => [data as any, ...prev]);
      toast({
        title: "Sucesso",
        description: "Player adicionado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar player",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('players' as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // ✅ Garantir que só atualize players do usuário atual
        .select()
        .single();

      if (error) throw error;

      console.log(`🎮 Player atualizado para usuário ${user.email}:`, (data as unknown as Player)?.name);
      setPlayers(prev => prev.map(player =>
        player.id === id ? { ...player, ...(data as any) } : player
      ));

      toast({
        title: "Sucesso",
        description: "Player atualizado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar player",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlayer = async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error } = await supabase
        .from('players' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // ✅ Garantir que só delete players do usuário atual

      if (error) throw error;

      console.log(`🎮 Player removido para usuário ${user.email}:`, id);
      setPlayers(prev => prev.filter(player => player.id !== id));
      toast({
        title: "Sucesso",
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

  useEffect(() => {
    if (user) {
      fetchPlayers();
    }
  }, [user?.id]);

  return {
    players,
    loading,
    addPlayer,
    updatePlayer,
    deletePlayer,
    refetch: fetchPlayers,
  };
};