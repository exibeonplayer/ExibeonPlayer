import { resolvePrivateMedia } from '@/lib/private-media';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateWeatherVideoUrl, WeatherVideoConfig } from '@/utils/weatherVideoUtils';

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_file_id?: string;
  media_instance_id?: string;
  display_order: number;
  duration_override_seconds?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_overlay?: boolean;
  overlay_z_index?: number;
  overlay_config?: any;
  created_at: string;
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

export const usePlaylistItems = (playlistId?: string) => {
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlaylistItems = async (id?: string) => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlist_items' as any)
        .select(`
          id,
          playlist_id,
          media_file_id,
          media_instance_id,
          display_order,
          duration_override_seconds,
          is_overlay,
          overlay_z_index,
          overlay_config,
          created_at,
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
        `)
        .eq('playlist_id', id)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erro na query playlist_items:', error);
        throw error;
      }

      console.log('Dados carregados do playlist_items:', data);
      setPlaylistItems(await resolvePrivateMedia((data || []) as unknown as PlaylistItem[]));
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
        .from('playlist_items' as any)
        .select('id,is_overlay')
        .eq('playlist_id', playlistId);

      if (currentItems.error) throw currentItems.error;
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
        .from('playlist_items' as any)
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
        .from('playlist_items' as any)
        .select('display_order')
        .eq('playlist_id', playlistId)
        .order('display_order', { ascending: false })
        .limit(1);

      const previousOrder=(maxOrder.data as unknown as Array<{display_order:number}>|null)?.[0]?.display_order;
      const nextOrder=previousOrder ? previousOrder+1 : 1;

      // Adicionar item
      const { data, error } = await supabase
        .from('playlist_items' as any)
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

      const resolved=await resolvePrivateMedia([data as unknown as PlaylistItem]);
      setPlaylistItems(prev => [...prev, resolved[0]]);
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

  const addMediaInstanceToPlaylist = async (
    playlistId: string,
    mediaInstanceId: string,
    overlayConfig?: any
  ) => {
    try {
      // Verificar limite de itens
      const currentItems = await supabase
        .from('playlist_items' as any)
        .select('id,is_overlay')
        .eq('playlist_id', playlistId);

      if (currentItems.error) throw currentItems.error;
      if (currentItems.data && currentItems.data.length >= 5) throw new Error('Uma playlist pode ter no máximo 5 itens.');

      // Verificar se o item já existe
      const existingItem = await supabase
        .from('playlist_items' as any)
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('media_instance_id', mediaInstanceId)
        .maybeSingle();

      if (existingItem.error) throw existingItem.error;
      if (existingItem.data) throw new Error('Esta mídia já está na playlist.');

      // Obter próxima ordem
      const maxOrder = await supabase
        .from('playlist_items' as any)
        .select('display_order')
        .eq('playlist_id', playlistId)
        .order('display_order', { ascending: false })
        .limit(1);

      if (maxOrder.error) throw maxOrder.error;
      const previousOrder=(maxOrder.data as unknown as Array<{display_order:number}>|null)?.[0]?.display_order;
      const nextOrder=previousOrder ? previousOrder+1 : 1;

      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||!user)throw new Error('Entre na sua conta novamente.');
      // Buscar dados da media_instance para verificar se é overlay
      const { data: rawInstance, error: instanceError } = await supabase
        .from('media_instances' as any)
        .select(`
          id,
          custom_config,
          template:media_templates (
            media_type,
            is_overlay
          )
        `)
        .eq('id', mediaInstanceId)
        .eq('created_by', user.id)
        .single();

      if (instanceError) throw instanceError;
      const instanceData=rawInstance as unknown as {custom_config:Record<string,any>;template:{is_overlay:boolean;media_type:string}};

      const isOverlay = instanceData.template?.is_overlay || false;
      // A faixa acompanha a programação, sem depender do vídeo antigo salvo na instância.
      const mediaType = instanceData.template?.media_type;
      if(isOverlay&&mediaType==='overlay'){
        if(!String(instanceData.custom_config?.bar_text||'').trim())throw new Error('Esta faixa está sem texto. Edite a mídia antes de adicioná-la.');
        if((currentItems.data as unknown as Array<{is_overlay?:boolean}>)?.some(item=>item.is_overlay))throw new Error('Esta playlist já possui uma faixa. Edite ou remova a faixa existente.');
      }

      // Para mídias de tempo, tratamos como vídeo normal (não overlay)
      const isWeatherMedia = mediaType === 'weather';

      // Preparar dados para inserção
      const insertData: any = {
        playlist_id: playlistId,
        media_instance_id: mediaInstanceId,
        display_order: nextOrder,
        is_overlay: isOverlay && !isWeatherMedia, // Mídias de tempo não são overlays
        overlay_z_index: overlayConfig?.zIndex || 1000,
        overlay_config: isOverlay ? {bar_text:instanceData.custom_config?.bar_text||'',bar_position:instanceData.custom_config?.bar_position||'bottom',bar_height:instanceData.custom_config?.bar_height||60} : overlayConfig
      };

      // Adicionar item
      const { data, error } = await supabase
        .from('playlist_items' as any)
        .insert([insertData])
        .select(`
          id,
          playlist_id,
          media_file_id,
          media_instance_id,
          display_order,
          duration_override_seconds,
          is_overlay,
          overlay_z_index,
          overlay_config,
          created_at,
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
        `)
        .single();

      if (error) throw error;

      const resolved=await resolvePrivateMedia([data as unknown as PlaylistItem]);
      setPlaylistItems(prev => [...prev, resolved[0]]);

      // Mensagem personalizada baseada no tipo de mídia
      let successMessage = "Mídia avançada adicionada à playlist";
      if (isOverlay && !isWeatherMedia) {
        successMessage = "Barra horizontal adicionada à playlist";
      } else if (mediaType === 'weather') {
        successMessage = "Previsão do tempo adicionada à playlist";
      } else if (mediaType === 'rss') {
        successMessage = "Feed RSS adicionado à playlist";
      } else if (mediaType === 'clock') {
        successMessage = "Relógio digital adicionado à playlist";
      } else if (mediaType === 'calendar') {
        successMessage = "Calendário adicionado à playlist";
      } else if (mediaType === 'counter') {
        successMessage = "Contador adicionado à playlist";
      } else if (mediaType === 'webpage') {
        successMessage = "Página web adicionada à playlist";
      }

      toast({
        title: "Sucesso",
        description: successMessage,
      });

      return data;
    } catch (error) {
      console.error('Error adding media instance to playlist:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Não foi possível adicionar a mídia. Confira sua conexão e tente novamente.',
        variant: "destructive",
      });
      throw error;
    }
  };

  const removePlaylistItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items' as any)
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
        .from('playlist_items' as any)
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
          .from('playlist_items' as any)
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
    addMediaInstanceToPlaylist,
    removePlaylistItem,
    updatePlaylistItemOrder,
    reorderPlaylistItems,
    refreshPlaylistItems: () => playlistId && fetchPlaylistItems(playlistId),
  };
};
