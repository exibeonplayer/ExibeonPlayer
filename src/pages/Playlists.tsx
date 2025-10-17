import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Video, MoreHorizontal, Copy, ExternalLink } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddPlaylistDialog from '@/components/AddPlaylistDialog';
import EditPlaylistDialog from '@/components/EditPlaylistDialog';
import ManagePlaylistItemsDialog from '@/components/ManagePlaylistItemsDialog';
import PlaylistStats from '@/components/PlaylistStats';
import LicenseRestricted from '@/components/LicenseRestricted';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';
import { useToast } from '@/hooks/use-toast';

const Playlists = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [managingPlaylist, setManagingPlaylist] = useState<Playlist | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { playlists, loading, deletePlaylist, refreshPlaylists, refetch, forceRefresh, refreshCounter } = usePlaylists();
  const licenseStatus = useLicenseStatus();
  const { toast } = useToast();

  // Debug: Log quando loading muda
  useEffect(() => {
    console.log('🔄 Playlists: Estado loading mudou para:', loading);
  }, [loading]);

  // Debug: Log quando playlists mudam
  useEffect(() => {
    console.log('🔄 Playlists: Lista de playlists mudou:', playlists.length, 'itens');
  }, [playlists]);

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta playlist?')) {
      await deletePlaylist(id);
    }
  };


  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setEditDialogOpen(true);
  };

  const handleDuplicate = async (playlist: any) => {
    alert('Função em desenvolvimento - Duplicação de playlist será criada em breve');
  };

  const handleSchedule = (playlist: any) => {
    alert('Função em desenvolvimento - Agendamento de playlist será criado em breve');
  };

  const handleManageItems = (playlist: Playlist) => {
    setManagingPlaylist(playlist);
    setManageDialogOpen(true);
  };

  // Função para recarregar playlists quando há alterações
  const handlePlaylistUpdated = () => {
    console.log('🔄 Playlists: Forçando refresh após alteração...');
    forceRefresh();
    setRefreshKey(prev => prev + 1);
  };

  const handleManageDialogClose = (open: boolean) => {
    setManageDialogOpen(open);
  };

  const handleCopyPlaylistUrl = async (playlist: Playlist) => {
    try {
      // Usar a URL pública se disponível, senão criar uma URL baseada no slug ou ID
      let playlistUrl = playlist.public_url;
      
      if (!playlistUrl) {
        // Criar URL baseada no slug se disponível, senão usar ID
        const identifier = playlist.slug || playlist.id;
        playlistUrl = `${window.location.origin}/playlist/${identifier}`;
      }
      
      // Tentar usar a API moderna do clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(playlistUrl);
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = playlistUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          throw new Error('Copy not supported');
        }
        
        document.body.removeChild(textArea);
      }
      
      toast({
        title: "URL Copiada",
        description: `URL da playlist "${playlist.name}" copiada para a área de transferência`,
      });
    } catch (error) {
      console.error('Error copying URL:', error);
      toast({
        title: "Erro",
        description: "Erro ao copiar URL da playlist. Tente selecionar e copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-white">Ativa</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'scheduled':
        return <Badge className="bg-info text-white">Agendada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
            <p className="text-muted-foreground mt-2">
              Organize e gerencie suas listas de reprodução
            </p>
          </div>
          <LicenseRestricted 
            licenseStatus={licenseStatus}
          >
            <div className="flex gap-2">
            <AddPlaylistDialog />
          </div>
          </LicenseRestricted>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar playlists..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border" key={`${refreshKey}-${refreshCounter}`}>
          <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome da Playlist</TableHead>
                <TableHead>Estatísticas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="sm:w-[100px] w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlaylists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell className="font-medium">{playlist.sequential_id || playlist.id}</TableCell>
                  <TableCell className="break-words">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-muted-foreground" />
                      <span>{playlist.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PlaylistStats playlist={playlist} />
                  </TableCell>
                  <TableCell>{getStatusBadge(playlist.is_active ? 'active' : 'draft')}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPlaylistUrl(playlist)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar URL
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(playlist.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <LicenseRestricted 
                      licenseStatus={licenseStatus}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <LicenseRestricted 
                            licenseStatus={licenseStatus}
                          >
                            <DropdownMenuItem onClick={() => handleEdit(playlist)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageItems(playlist)}>
                              Gerenciar Vídeos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(playlist)}>
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSchedule(playlist)}>
                              Agendar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(playlist.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </LicenseRestricted>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </LicenseRestricted>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredPlaylists.length} de {playlists.length} playlists
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

        {/* Modal de Edição */}
        <EditPlaylistDialog
          playlist={editingPlaylist}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        {/* Modal de Gerenciar Itens */}
        <ManagePlaylistItemsDialog
          playlist={managingPlaylist}
          open={manageDialogOpen}
          onOpenChange={handleManageDialogClose}
          onPlaylistUpdated={handlePlaylistUpdated}
        />

      </div>
    </Layout>
  );
};

export default Playlists;