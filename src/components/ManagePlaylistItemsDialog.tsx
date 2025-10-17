import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Video, 
  Image,
  Play,
  Clock,
  Plus
} from 'lucide-react';
import { usePlaylistItems, PlaylistItem } from '@/hooks/usePlaylistItems';
import { useVideos, Video as VideoType } from '@/hooks/useVideos';
import { Playlist } from '@/hooks/usePlaylists';
import { useRefresh } from '@/contexts/RefreshContext';

interface ManagePlaylistItemsDialogProps {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaylistUpdated?: () => void; // Callback para notificar atualização da playlist
}

const ManagePlaylistItemsDialog = ({ playlist, open, onOpenChange, onPlaylistUpdated }: ManagePlaylistItemsDialogProps) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const { videos } = useVideos();
  const { 
    playlistItems, 
    loading, 
    addPlaylistItem, 
    removePlaylistItem, 
    reorderPlaylistItems,
    refreshPlaylistItems 
  } = usePlaylistItems(playlist?.id);
  const { triggerRefresh } = useRefresh();

  // Debug: Log dos dados recebidos
  useEffect(() => {
    console.log('ManagePlaylistItemsDialog - playlistItems:', playlistItems);
    console.log('ManagePlaylistItemsDialog - playlist:', playlist);
  }, [playlistItems, playlist]);

  // Filtrar vídeos que não estão na playlist
  const availableVideos = videos.filter(video => 
    !playlistItems.some(item => item.media_file_id === video.id)
  );

  const handleAddVideo = async () => {
    if (!selectedVideoId || !playlist) return;
    
    try {
      console.log('🎬 Adicionando vídeo à playlist...');
      // 1. Chamar função de salvar (assíncrona)
      await addPlaylistItem(playlist.id, selectedVideoId);
      
      // 2. Aguardar retorno de sucesso (status 200/201)
      console.log('✅ Vídeo adicionado com sucesso ao servidor');
      
      // 3. Recarregar lista local
      await refreshPlaylistItems();
      
      // 4. Notificar página principal para recarregar
      if (onPlaylistUpdated) {
        console.log('🔄 Notificando página principal para recarregar');
        onPlaylistUpdated();
      }
      
      setSelectedVideoId('');
    } catch (error) {
      console.error('❌ Erro ao adicionar vídeo:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (window.confirm('Tem certeza que deseja remover este vídeo da playlist?')) {
      try {
        console.log('🗑️ Removendo vídeo da playlist...');
        // 1. Chamar função de salvar (assíncrona)
        await removePlaylistItem(itemId);
        
        // 2. Aguardar retorno de sucesso (status 200/201)
        console.log('✅ Vídeo removido com sucesso do servidor');
        
        // 3. Recarregar lista local
        await refreshPlaylistItems();
        
        // 4. Notificar página principal para recarregar
        if (onPlaylistUpdated) {
          console.log('🔄 Notificando página principal para recarregar');
          onPlaylistUpdated();
        }
      } catch (error) {
        console.error('❌ Erro ao remover vídeo:', error);
      }
    }
  };

  const handleMoveUp = async (item: PlaylistItem) => {
    if (item.display_order <= 1) return;
    
    try {
      const newItems = [...playlistItems];
      const currentIndex = newItems.findIndex(i => i.id === item.id);
      const prevIndex = newItems.findIndex(i => i.display_order === item.display_order - 1);
      
      if (prevIndex >= 0) {
        [newItems[currentIndex], newItems[prevIndex]] = [newItems[prevIndex], newItems[currentIndex]];
        await reorderPlaylistItems(newItems);
        // Recarregar itens após reordenar
        await refreshPlaylistItems();
      }
    } catch (error) {
      console.error('Error moving item up:', error);
    }
  };

  const handleMoveDown = async (item: PlaylistItem) => {
    const maxOrder = Math.max(...playlistItems.map(i => i.display_order));
    if (item.display_order >= maxOrder) return;
    
    try {
      const newItems = [...playlistItems];
      const currentIndex = newItems.findIndex(i => i.id === item.id);
      const nextIndex = newItems.findIndex(i => i.display_order === item.display_order + 1);
      
      if (nextIndex >= 0) {
        [newItems[currentIndex], newItems[nextIndex]] = [newItems[nextIndex], newItems[currentIndex]];
        await reorderPlaylistItems(newItems);
        // Recarregar itens após reordenar
        await refreshPlaylistItems();
      }
    } catch (error) {
      console.error('Error moving item down:', error);
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds || seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    const totalSeconds = playlistItems.reduce((total, item) => {
      const duration = item.media_files?.duration_seconds;
      return total + (duration && duration > 0 ? duration : 0);
    }, 0);
    return formatDuration(totalSeconds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Playlist: {playlist?.name}</DialogTitle>
          <DialogDescription>
            Adicione até 5 vídeos e organize a ordem de reprodução
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{playlistItems.length}</div>
              <div className="text-sm text-muted-foreground">Vídeos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{getTotalDuration()}</div>
              <div className="text-sm text-muted-foreground">Duração Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-sm text-muted-foreground">Máximo</div>
            </div>
          </div>

          {/* Adicionar Vídeo */}
          {playlistItems.length < 5 && availableVideos.length > 0 && (
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-medium">Adicionar Vídeo</Label>
              <div className="flex gap-2">
                <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um vídeo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVideos.map((video) => (
                      <SelectItem key={video.id} value={video.id}>
                        <div className="flex items-center gap-2">
                          {video.content_type === 'video' ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <Image className="w-4 h-4" />
                          )}
                          <span>{video.title}</span>
                          <Badge variant="outline" className="ml-auto">
                            {video.content_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddVideo}
                  disabled={!selectedVideoId}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Itens */}
          {playlistItems.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-base font-medium">Ordem de Reprodução</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playlistItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <Play className="w-4 h-4 text-primary" />
                            {item.display_order}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.media_files?.content_type === 'video' ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Video className="w-3 h-3 mr-1" />
                              Vídeo
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              <Image className="w-3 h-3 mr-1" />
                              Imagem
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.media_files?.title || 'Sem título'}</div>
                          {item.media_files?.description && (
                            <div className="text-sm text-muted-foreground">
                              {item.media_files.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3" />
                            {formatDuration(item.media_files?.duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveUp(item)}
                              disabled={item.display_order <= 1}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveDown(item)}
                              disabled={item.display_order >= Math.max(...playlistItems.map(i => i.display_order))}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum vídeo adicionado à playlist</p>
              <p className="text-sm">Adicione até 5 vídeos para começar</p>
            </div>
          )}

          {/* Mensagens de Status */}
          {playlistItems.length >= 5 && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                ✅ Playlist completa! Você adicionou o máximo de 5 vídeos.
              </p>
            </div>
          )}

          {availableVideos.length === 0 && playlistItems.length < 5 && (
            <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm text-info">
                ℹ️ Todos os vídeos disponíveis já foram adicionados à playlist.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            onClick={async () => {
              try {
                console.log('💾 Salvando alterações...');
                // 1. Recarregar dados locais para garantir consistência
                await refreshPlaylistItems();
                
                // 2. Notificar página principal para recarregar
                if (onPlaylistUpdated) {
                  console.log('🔄 Notificando página principal para recarregar após salvar');
                  onPlaylistUpdated();
                }
                
                // 3. Fechar modal
                onOpenChange(false);
              } catch (error) {
                console.error('❌ Erro ao salvar alterações:', error);
              }
            }}
          >
            Salvar e Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePlaylistItemsDialog;
