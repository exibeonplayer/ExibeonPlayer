import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_file_id: string;
  display_order: number;
  duration_override_seconds?: number;
  created_at: string;
  media_files?: {
    id: string;
    title: string;
    description?: string;
    content_type: 'video' | 'image';
    file_url: string;
    thumbnail_url?: string;
    duration_seconds?: number;
  };
}

export const usePlaylistItems = (playlistId?: string) => {
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlaylistItems = async (id?: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlist_items')
        .select(`
          id,
          playlist_id,
          media_file_id,
          display_order,
          duration_override_seconds,
          created_at,
          media_files (
            id,
            title,
            description,
            content_type,
            file_url,
            thumbnail_url,
            duration_seconds
          )
        `)
        .eq('playlist_id', id)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erro na query playlist_items:', error);
        throw error;
      }
      
      console.log('Dados carregados do playlist_items:', data);
      setPlaylistItems(data || []);
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens da playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlaylistItem = async (playlistId: string, mediaFileId: string) => {
    try {
      // Verificar se já existem 5 itens
      const currentItems = await supabase
        .from('playlist_items')
        .select('id')
        .eq('playlist_id', playlistId);

      if (currentItems.data && currentItems.data.length >= 5) {
        toast({
          title: "Limite atingido",
          description: "Uma playlist pode ter no máximo 5 itens",
          variant: "destructive",
        });
        return;
      }

      // Verificar se o item já existe
      const existingItem = await supabase
        .from('playlist_items')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('media_file_id', mediaFileId)
        .single();

      if (existingItem.data) {
        toast({
          title: "Item já adicionado",
          description: "Este vídeo já está na playlist",
          variant: "destructive",
        });
        return;
      }

      // Obter próxima ordem
      const maxOrder = await supabase
        .from('playlist_items')
        .select('display_order')
        .eq('playlist_id', playlistId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = maxOrder.data?.[0]?.display_order ? maxOrder.data[0].display_order + 1 : 1;

      // Adicionar item
      const { data, error } = await supabase
        .from('playlist_items')
        .insert([{
          playlist_id: playlistId,
          media_file_id: mediaFileId,
          display_order: nextOrder
        }])
        .select(`
          id,
          playlist_id,
          media_file_id,
          display_order,
          duration_override_seconds,
          created_at,
          media_files (
            id,
            title,
            description,
            content_type,
            file_url,
            thumbnail_url,
            duration_seconds
          )
        `)
        .single();

      if (error) throw error;

      setPlaylistItems(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Vídeo adicionado à playlist",
      });

      return data;
    } catch (error) {
      console.error('Error adding playlist item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar vídeo à playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removePlaylistItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setPlaylistItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Sucesso",
        description: "Vídeo removido da playlist",
      });
    } catch (error) {
      console.error('Error removing playlist item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover vídeo da playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlaylistItemOrder = async (itemId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .update({ display_order: newOrder })
        .eq('id', itemId);

      if (error) throw error;

      setPlaylistItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, display_order: newOrder } : item
        ).sort((a, b) => a.display_order - b.display_order)
      );
    } catch (error) {
      console.error('Error updating playlist item order:', error);
      throw error;
    }
  };

  const reorderPlaylistItems = async (items: PlaylistItem[]) => {
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('playlist_items')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      setPlaylistItems(items.map((item, index) => ({
        ...item,
        display_order: index + 1
      })));

      toast({
        title: "Sucesso",
        description: "Ordem da playlist atualizada",
      });
    } catch (error) {
      console.error('Error reordering playlist items:', error);
      toast({
        title: "Erro",
        description: "Erro ao reordenar playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistItems(playlistId);
    }
  }, [playlistId]);

  return {
    playlistItems,
    loading,
    addPlaylistItem,
    removePlaylistItem,
    updatePlaylistItemOrder,
    reorderPlaylistItems,
    refreshPlaylistItems: () => playlistId && fetchPlaylistItems(playlistId),
  };
};
