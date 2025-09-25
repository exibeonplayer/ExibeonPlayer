import { useState } from 'react';
import { Plus, Search, Calendar, Video, MoreHorizontal } from 'lucide-react';
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
import { usePlaylists } from '@/hooks/usePlaylists';

const Playlists = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { playlists, loading, deletePlaylist } = usePlaylists();

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta playlist?')) {
      await deletePlaylist(id);
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
            <AddPlaylistDialog />
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

        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome da Playlist</TableHead>
                <TableHead>Total de Vídeos</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Players Associados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlaylists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell className="font-medium">{playlist.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-muted-foreground" />
                      <span>{playlist.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{playlist.total_videos || 0}</TableCell>
                  <TableCell>{playlist.total_duration || '00:00:00'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {playlist.assigned_players?.length || 0} players
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(playlist.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(playlist.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Visualizar</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem>Agendar</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(playlist.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      </div>
    </Layout>
  );
};

export default Playlists;