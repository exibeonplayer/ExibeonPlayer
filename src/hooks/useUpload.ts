import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const useUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadFile = async (file: File, onProgress?: (progress: number) => void, options: { silent?: boolean } = {}): Promise<string> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      // Gerar chave única para o arquivo
      // O backend deriva o proprietário a partir da sessão autenticada.

      // Gerar URL assinada
      const { data, error } = await supabase.functions.invoke('manage-devices', { body: { action: 'upload-url', name: file.name, type: file.type, size: file.size } });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Falha ao autorizar upload');
      const signedUrl = data.signed_url;

      // Upload do arquivo usando fetch com progress tracking
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      // Obter URL pública do arquivo
      const publicUrl = data.public_url;

      setUploadProgress({ progress: 100, status: 'success' });

      if (!options.silent) toast({
        title: "Upload realizado com sucesso!",
        description: `${file.name} foi enviado com sucesso.`,
      });

      return publicUrl;
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
