import { Upload, Video, Image as ImageIcon, MoreHorizontal, Search, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UploadDialog from '@/components/UploadDialog';
import LicenseRestricted from '@/components/LicenseRestricted';
import { useVideos } from '@/hooks/useVideos';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';
import { useState } from 'react';

const Conteudos = () => {
  const { videos, loading, deleteVideo } = useVideos();
  const licenseStatus = useLicenseStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
      await deleteVideo(id);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conteúdos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie sua biblioteca de vídeos e imagens
            </p>
          </div>
          <LicenseRestricted 
            licenseStatus={licenseStatus}
          >
            <Button 
              className="bg-primary hover:bg-primary-hover"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload de Arquivo
            </Button>
          </LicenseRestricted>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do arquivo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum conteúdo encontrado
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum arquivo corresponde à sua busca.' : 'Faça upload do seu primeiro arquivo para começar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                      {video.content_type === 'video' ? (
                        <Video className="w-12 h-12 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <LicenseRestricted 
                        licenseStatus={licenseStatus}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Visualizar</DropdownMenuItem>
                            <DropdownMenuItem>Download</DropdownMenuItem>
                            <LicenseRestricted 
                              licenseStatus={licenseStatus}
                            >
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(video.id)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </LicenseRestricted>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </LicenseRestricted>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant={video.content_type === 'video' ? 'default' : 'secondary'}>
                        {video.content_type === 'video' ? 'Vídeo' : 'Imagem'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-foreground truncate mb-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Tamanho:</span>
                        <span>{formatFileSize(video.file_size_bytes)}</span>
                      </div>
                      {video.duration_seconds && (
                        <div className="flex justify-between">
                          <span>Duração:</span>
                          <span>{formatDuration(video.duration_seconds)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Upload:</span>
                        <span>{new Date(video.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredVideos.length} de {videos.length} arquivos
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próximo
            </Button>
          </div>
        </div>

        {/* Upload Dialog */}
        <UploadDialog 
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
        />
      </div>
    </Layout>
  );
};

export default Conteudos;