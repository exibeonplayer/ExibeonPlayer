import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Playlist {
  id: string;
  sequential_id: number;
  name: string;
  code: string;
  user_id: string;
  is_active?: boolean;
  public_url?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('sequential_id', { ascending: true });

      if (error) throw error;
      setPlaylists((data as any) || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlaylist = async (playlistData: Omit<Playlist, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          name: playlistData.name,
          user_id: user.id,
          is_active: playlistData.is_active ?? true,
          code: `PL${Date.now().toString(36).toUpperCase()}` // Generate unique code
          // sequential_id será gerado automaticamente pelo trigger
        }])
        .select('*, sequential_id')
        .single();

      if (error) throw error;
      
      // Recarregar lista para manter ordem sequencial
      await fetchPlaylists();
      
      toast({
        title: "Sucesso",
        description: "Playlist criada com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error adding playlist:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('playlists' as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // ✅ Garantir que só atualize playlists do usuário atual
        .select()
        .single();

      if (error) throw error;
      
      console.log(`📁 Playlist atualizada para usuário ${user.email}:`, data?.name);
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === id ? { ...playlist, ...(data as any) } : playlist
      ));
      
      toast({
        title: "Sucesso",
        description: "Playlist atualizada com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error } = await supabase
        .from('playlists' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // ✅ Garantir que só delete playlists do usuário atual

      if (error) throw error;
      
      console.log(`📁 Playlist removida para usuário ${user.email}:`, id);
      // Recarregar lista para mostrar IDs reorganizados
      await fetchPlaylists();
      
      toast({
        title: "Sucesso",
        description: "Playlist removida com sucesso",
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user?.id]); // ✅ Recarregar quando o usuário mudar

  return {
    playlists,
    loading,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    refetch: fetchPlaylists,
    refreshPlaylists: fetchPlaylists,
  };
};