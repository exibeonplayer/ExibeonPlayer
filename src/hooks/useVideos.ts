import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Video {
  id: string;
  title: string;
  description?: string;
  file_type: string;
  file_size?: number;
  duration?: string;
  dimensions?: string;
  r2_url: string;
  r2_key: string;
  tags?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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
    try {
      const { data, error } = await supabase
        .from('videos' as any)
        .insert([videoData])
        .select()
        .single();

      if (error) throw error;
      
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
    try {
      const { data, error } = await supabase
        .from('videos' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
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
    try {
      const { error } = await supabase
        .from('videos' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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
    fetchVideos();
  }, []);

  return {
    videos,
    loading,
    addVideo,
    updateVideo,
    deleteVideo,
    refetch: fetchVideos,
  };
};