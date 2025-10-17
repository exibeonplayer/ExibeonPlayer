import { useState, useRef } from 'react';
import { Upload, X, File, Image, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUpload } from '@/hooks/useUpload';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentUploaded?: () => void;
}

// Função para calcular duração do vídeo
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Erro ao carregar metadados do vídeo'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

const UploadDialog = ({ open, onOpenChange, onContentUploaded }: UploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, uploadProgress, resetUpload, isUploading } = useUpload();
  const { addVideo } = useVideos();
  const { user } = useAuth();
  const { addNotification } = useNotificationContext();

  const handleFileSelect = (file: File) => {
    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use apenas vídeos (MP4, AVI, MOV, WMV) ou imagens (JPEG, PNG, GIF).');
      return;
    }

    // Validar tamanho (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Tamanho máximo permitido: 100MB.');
      return;
    }

    setSelectedFile(file);
    
    // Preencher título automaticamente se estiver vazio
    if (!title) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileNameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !user) return;

    try {
      // Fazer upload do arquivo
      const fileUrl = await uploadFile(selectedFile);
      
      // Determinar tipo de conteúdo
      const contentType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      
      // Calcular duração para vídeos
      let durationSeconds = undefined;
      if (contentType === 'video') {
        try {
          durationSeconds = await getVideoDuration(selectedFile);
          console.log(`🎬 Duração calculada para ${selectedFile.name}: ${durationSeconds} segundos`);
        } catch (error) {
          console.warn(`⚠️ Não foi possível calcular duração para ${selectedFile.name}:`, error);
          // Continua sem duração se houver erro
        }
      }
      
      // Adicionar ao banco de dados
      console.log('🎬 UploadDialog: Adicionando vídeo ao banco de dados...');
      await addVideo({
        title,
        description: description || undefined,
        content_type: contentType,
        file_url: fileUrl,
        file_size_bytes: selectedFile.size,
        duration_seconds: durationSeconds,
        user_id: user.id,
      });
      console.log('✅ UploadDialog: Vídeo adicionado com sucesso!');

      // Adicionar notificação
      addNotification({
        type: 'video_uploaded',
        title: 'Vídeo Enviado',
        message: `O arquivo "${title || selectedFile.name}" foi enviado com sucesso.`
      });

      // Chamar callback para refresh da página pai
      if (onContentUploaded) {
        onContentUploaded();
      }

      // Resetar formulário
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      resetUpload();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <Video className="w-8 h-8 text-blue-500" />;
    } else if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-green-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Arquivo</DialogTitle>
          <DialogDescription>
            Envie vídeos ou imagens para sua biblioteca de conteúdo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de Drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-2">
                {getFileIcon(selectedFile)}
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                <Badge variant={selectedFile.type.startsWith('video/') ? 'default' : 'secondary'}>
                  {selectedFile.type.startsWith('video/') ? 'Vídeo' : 'Imagem'}
                </Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Arraste um arquivo aqui ou clique para selecionar
                </p>
                <p className="text-xs text-gray-500">
                  Vídeos: MP4, AVI, MOV, WMV • Imagens: JPEG, PNG, GIF • Máx: 100MB
                </p>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/mp4,video/avi,video/mov,video/wmv,image/jpeg,image/png,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* Formulário */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do arquivo"
                disabled={isUploading}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional do arquivo"
                rows={3}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando arquivo...</span>
                <span>{uploadProgress.progress}%</span>
              </div>
              <Progress value={uploadProgress.progress} />
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title || isUploading}
            >
              {isUploading ? 'Enviando...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
