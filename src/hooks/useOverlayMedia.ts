import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUpload } from '@/hooks/useUpload';
import { useVideos } from '@/hooks/useVideos';

export interface OverlayMediaData {
  video_file_id: string;
  bar_height: number;
  bar_position: 'top' | 'bottom';
  bar_text: string;
  is_overlay: boolean;
  z_index: number;
}

export const useOverlayMedia = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { uploadFile } = useUpload();
  const { addVideo } = useVideos();

  const createOverlayMedia = async (
    templateId: string,
    name: string,
    description: string,
    videoFile: File,
    overlayConfig: OverlayMediaData
  ) => {
    try {
      setLoading(true);

      // 1. Upload do vídeo usando o sistema R2 existente
      const fileUrl = await uploadFile(videoFile);

      // 2. Salvar referência no banco usando o hook de vídeos
      const videoData = await addVideo({
        title: name,
        description: description,
        content_type: 'video',
        file_url: fileUrl,
        file_size_bytes: videoFile.size,
        orientation: 'horizontal',
        is_overlay: true
      });

      // 2. Criar media_instance com configurações de overlay
      const { data: instanceData, error: instanceError } = await supabase
        .from('media_instances')
        .insert({
          template_id: templateId,
          name: name,
          description: description,
          custom_config: {
            video_file_id: videoData.id,
            ...overlayConfig
          },
          is_active: true
        })
        .select()
        .single();

      if (instanceError) throw instanceError;

      toast({
        title: "Sucesso",
        description: "Mídia de overlay criada com sucesso",
      });

      return instanceData;
    } catch (error) {
      console.error('Erro ao criar mídia de overlay:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar mídia de overlay",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addOverlayToPlaylist = async (
    playlistId: string,
    mediaInstanceId: string,
    videoFileId: string,
    overlayConfig: OverlayMediaData
  ) => {
    try {
      setLoading(true);

      // Adicionar item de playlist com ambos os IDs
      const { data, error } = await supabase
        .from('playlist_items')
        .insert({
          playlist_id: playlistId,
          media_file_id: videoFileId,        // Vídeo de fundo
          media_instance_id: mediaInstanceId, // Configurações de overlay
          display_order: 1, // Será ajustado pelo sistema
          is_overlay: true,
          overlay_z_index: overlayConfig.z_index,
          overlay_config: {
            bar_height: overlayConfig.bar_height,
            bar_position: overlayConfig.bar_position,
            bar_text: overlayConfig.bar_text
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Barra horizontal adicionada à playlist",
      });

      return data;
    } catch (error) {
      console.error('Erro ao adicionar overlay à playlist:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar barra horizontal à playlist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOverlayMedia,
    addOverlayToPlaylist,
    loading
  };
};
