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

// Dados mock dos arquivos
const mockFiles = [
  {
    id: 1,
    name: 'Promocao_Verao_2025.mp4',
    type: 'video',
    size: '45.2 MB',
    duration: '00:02:15',
    uploadDate: '2025-01-15',
    thumbnail: '/api/placeholder/300/200',
  },
  {
    id: 2,
    name: 'Banner_Ofertas.jpg',
    type: 'image',
    size: '2.8 MB',
    dimensions: '1920x1080',
    uploadDate: '2025-01-14',
    thumbnail: '/api/placeholder/300/200',
  },
  {
    id: 3,
    name: 'Institucional_Empresa.mp4',
    type: 'video',
    size: '120.5 MB',
    duration: '00:05:30',
    uploadDate: '2025-01-13',
    thumbnail: '/api/placeholder/300/200',
  },
  {
    id: 4,
    name: 'Menu_Restaurante.png',
    type: 'image',
    size: '1.2 MB',
    dimensions: '1080x1920',
    uploadDate: '2025-01-12',
    thumbnail: '/api/placeholder/300/200',
  },
];

const Conteudos = () => {
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
          <Button className="bg-primary hover:bg-primary-hover">
            <Upload className="w-4 h-4 mr-2" />
            Upload de Arquivo
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do arquivo..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    {file.type === 'video' ? (
                      <Video className="w-12 h-12 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant={file.type === 'video' ? 'default' : 'secondary'}>
                      {file.type === 'video' ? 'Vídeo' : 'Imagem'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground truncate mb-2">
                    {file.name}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Tamanho:</span>
                      <span>{file.size}</span>
                    </div>
                    {file.duration && (
                      <div className="flex justify-between">
                        <span>Duração:</span>
                        <span>{file.duration}</span>
                      </div>
                    )}
                    {file.dimensions && (
                      <div className="flex justify-between">
                        <span>Dimensões:</span>
                        <span>{file.dimensions}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Upload:</span>
                      <span>{new Date(file.uploadDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {mockFiles.length} de {mockFiles.length} arquivos
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
      </div>
    </Layout>
  );
};

export default Conteudos;