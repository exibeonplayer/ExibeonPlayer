import { useState } from 'react';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_CONFIG, generateFileKey, getPublicUrl } from '@/lib/r2-client';
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

  const generateSignedUrl = async (fileKey: string, contentType: string) => {
    try {
      const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: fileKey,
        ContentType: contentType,
        ACL: 'public-read', // Para permitir acesso público ao arquivo
      });

      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hora
      return signedUrl;
    } catch (error) {
      console.error('Erro ao gerar URL assinada:', error);
      throw new Error('Falha ao gerar URL de upload');
    }
  };

  const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!R2_CONFIG.bucketName) {
      throw new Error('Configuração do R2 não encontrada');
    }

    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      // Gerar chave única para o arquivo
      const fileKey = generateFileKey(user.id, file.name);
      
      // Gerar URL assinada
      const signedUrl = await generateSignedUrl(fileKey, file.type);

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
      const publicUrl = getPublicUrl(fileKey);

      setUploadProgress({ progress: 100, status: 'success' });
      
      toast({
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
