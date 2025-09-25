import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  status: string;
  total_videos?: number;
  total_duration?: string;
  public_url?: string;
  assigned_players?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists' as any)
        .select('*')
        .order('created_at', { ascending: false });

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
    try {
      const { data, error } = await supabase
        .from('playlists' as any)
        .insert([{
          ...playlistData,
          id: `PL${Date.now().toString(36).toUpperCase()}` // Generate unique ID
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPlaylists(prev => [data as any, ...prev]);
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
    try {
      const { data, error } = await supabase
        .from('playlists' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
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
    try {
      const { error } = await supabase
        .from('playlists' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPlaylists(prev => prev.filter(playlist => playlist.id !== id));
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
    fetchPlaylists();
  }, []);

  return {
    playlists,
    loading,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    refetch: fetchPlaylists,
  };
};