import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const useSupabaseUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/media/${timestamp}_${sanitizedFileName}`;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('media-uploads')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Erro ao obter URL pública do arquivo');
      }

      setUploadProgress({ progress: 100, status: 'success' });
      
      toast({
        title: "Upload realizado com sucesso!",
        description: `${file.name} foi enviado com sucesso.`,
      });

      return urlData.publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
      
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const resetUpload = () => {
    setUploadProgress({ progress: 0, status: 'idle' });
  };

  return {
    uploadFile,
    uploadProgress,
    resetUpload,
    isUploading: uploadProgress.status === 'uploading',
  };
};
