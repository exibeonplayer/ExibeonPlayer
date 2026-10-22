import {notifyPlaylistsChanged,subscribePlaylistsChanged} from '@/lib/playlist-events';
import { PlaylistPlatform } from '@/lib/playlist-platform';
import { resolvePrivateMedia } from '@/lib/private-media';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface PlaylistItem {
  id: string;
  display_order: number;
  duration_override_seconds?: number;
  is_overlay?: boolean;
  overlay_z_index?: number;
  overlay_config?: any;
  media_file_id?: string;
  media_instance_id?: string;
  media_files?: {
    id: string;
    title: string;
    description?: string;
    content_type: 'video' | 'image' | 'weather_realtime';
    file_url: string;
    thumbnail_url?: string;
    duration_seconds?: number;
    orientation?: 'horizontal' | 'vertical';
    is_overlay?: boolean;
  };
  media_instances?: {
    id: string;
    name: string;
    description?: string;
    custom_config: any;
    is_active: boolean;
    template?: {
      id: string;
      name: string;
      media_type: string;
      orientation: 'horizontal' | 'vertical';
      is_overlay: boolean;
    };
  };
}

export interface Playlist {
  id: string;
  sequential_id: number;
  name: string;
  code: string;
  user_id: string;
  is_active?: boolean;
  target_platform?: PlaylistPlatform;
  description?: string;
  public_url?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
  playlist_items?: PlaylistItem[];
}

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const accountRef=useRef(user?.id),requestRef=useRef(0);accountRef.current=user?.id;

  const fetchPlaylists = async () => {
    const account=user?.id,ticket=++requestRef.current;
    if(!account){setPlaylists([]);setLoading(false);return;}
    try {
      console.log('🔄 usePlaylists: Iniciando fetchPlaylists...');
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists' as any)
        .select(`
          *,
          playlist_items (
            id,
            display_order,
            duration_override_seconds,
            is_overlay,
            overlay_z_index,
            overlay_config,
            media_file_id,
            media_instance_id,
            media_files (
              id,
              title,
              description,
              content_type,
              file_url,
              thumbnail_url,
              duration_seconds,
              orientation,
              is_overlay
            ),
            media_instances (
              id,
              name,
              description,
              custom_config,
              is_active,
              template:media_templates (
                id,
                name,
                media_type,
                orientation,
                is_overlay
              )
            )
          )
        `)
        .eq('user_id', account)
        .order('sequential_id', { ascending: true });

      if (error) throw error;
      console.log('✅ usePlaylists: Dados recebidos:', data?.length || 0, 'playlists');
      const rows=await resolvePrivateMedia<Playlist>((data as unknown as Playlist[])||[]);
      if(accountRef.current===account&&requestRef.current===ticket)setPlaylists(rows);
    } catch (error) {
      if(accountRef.current!==account||requestRef.current!==ticket)return;
      console.error('Error fetching playlists:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar playlists",
        variant: "destructive",
      });
    } finally {
      if(accountRef.current===account&&requestRef.current===ticket)setLoading(false);
    }
  };

  const forceRefresh = () => {
    console.log('🔄 usePlaylists: Forçando refresh...');
    setRefreshCounter(prev => prev + 1);
    fetchPlaylists();
  };

  const addPlaylist = async (playlistData: Pick<Playlist,'name'> & Partial<Pick<Playlist,'is_active'|'target_platform'|'description'>>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('playlists' as any)
        .insert([{
          name: playlistData.name,
          user_id: user.id,
          is_active: playlistData.is_active ?? true,
          target_platform: playlistData.target_platform || 'all',
          description: playlistData.description || null,
          code: `PL${Date.now().toString(36).toUpperCase()}` // Generate unique code
          // sequential_id será gerado automaticamente pelo trigger
        }])
        .select('*, sequential_id')
        .single();

      if (error) throw error;

      // Recarregar lista para manter ordem sequencial
      console.log('🔄 usePlaylists: Recarregando lista após adicionar playlist');
      notifyPlaylistsChanged(user.id);

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

      console.log(`📁 Playlist atualizada para usuário ${user.email}:`, (data as any)?.name);
      setPlaylists(prev => prev.map(playlist =>
        playlist.id === id ? { ...playlist, ...(data as any) } : playlist
      ));

      notifyPlaylistsChanged(user.id);
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
      // Atualizar as listas abertas; os IDs restantes não mudam após exclusão.
      console.log('🔄 usePlaylists: Recarregando lista após deletar playlist');
      notifyPlaylistsChanged(user.id);

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
    setPlaylists([]);fetchPlaylists();
    if(!user?.id)return;
    const unsubscribe=subscribePlaylistsChanged(user.id,()=>{void fetchPlaylists();});
    const timer=setInterval(fetchPlaylists,30*60*1000);
    return ()=>{requestRef.current++;clearInterval(timer);unsubscribe();};
  },[user?.id]);

  return {
    playlists,
    loading,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    refetch: fetchPlaylists,
    refreshPlaylists: fetchPlaylists,
    forceRefresh,
    refreshCounter,
  };
};
