import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Video {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'image';
  file_size_bytes?: number;
  duration_seconds?: number;
  file_url: string;
  thumbnail_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchVideos = async () => {
    if (!user) {
      setVideos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_files' as any)
        .select('*')
        .eq('user_id', user.id) // ✅ Filtrar apenas pelo usuário atual
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`📁 Carregando vídeos para usuário ${user.email}:`, data?.length || 0, 'arquivos');
      setVideos((data as any) || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vídeos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVideo = async (videoData: Omit<Video, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // ✅ Garantir que o user_id seja sempre do usuário atual
      const videoDataWithUser = {
        ...videoData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('media_files' as any)
        .insert([videoDataWithUser])
        .select()
        .single();

      if (error) throw error;
      
      console.log(`📁 Vídeo adicionado para usuário ${user.email}:`, data?.title);
      setVideos(prev => [data as any, ...prev]);
      toast({
        title: "Sucesso",
        description: "Vídeo adicionado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar vídeo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVideo = async (id: string, updates: Partial<Video>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('media_files' as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // ✅ Garantir que só atualize vídeos do usuário atual
        .select()
        .single();

      if (error) throw error;
      
      console.log(`📁 Vídeo atualizado para usuário ${user.email}:`, data?.title);
      setVideos(prev => prev.map(video => 
        video.id === id ? { ...video, ...(data as any) } : video
      ));
      
      toast({
        title: "Sucesso",
        description: "Vídeo atualizado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vídeo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVideo = async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error } = await supabase
        .from('media_files' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // ✅ Garantir que só delete vídeos do usuário atual

      if (error) throw error;
      
      console.log(`📁 Vídeo removido para usuário ${user.email}:`, id);
      setVideos(prev => prev.filter(video => video.id !== id));
      toast({
        title: "Sucesso",
        description: "Vídeo removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover vídeo",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]); // ✅ Recarregar quando o usuário mudar

  return {
    videos,
    loading,
    addVideo,
    updateVideo,
    deleteVideo,
    refetch: fetchVideos,
    refreshVideos: fetchVideos,
  };
};