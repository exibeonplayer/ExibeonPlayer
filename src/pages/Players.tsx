import { useState } from 'react';
import { Plus, Search, Settings, Monitor, Trash2, ShoppingCart, Circle } from 'lucide-react';
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
import AddPlayerDialog from '@/components/AddPlayerDialog';
import PlayerDetailModal from '@/components/PlayerDetailModal';
import { usePlayers } from '@/hooks/usePlayers';

const Players = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { players, loading, deletePlayer } = usePlayers();

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.player_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.location && player.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
    setShowDetailModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este player?')) {
      await deletePlayer(id);
    }
  };
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { color: 'bg-success', text: 'Online', icon: Circle },
      offline: { color: 'bg-destructive', text: 'Offline', icon: Circle },
      maintenance: { color: 'bg-warning', text: 'Manutenção', icon: Circle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-2 h-2" />
        {config.text}
      </Badge>
    );
  };

  const getDownloadStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-white">Completo</Badge>;
      case 'downloading':
        return <Badge className="bg-info text-white">Baixando</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'error':
        return <Badge className="bg-destructive text-white">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
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
            <h1 className="text-3xl font-bold text-foreground">Players</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e monitore todos os seus dispositivos de exibição
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Monitor className="w-4 h-4 mr-2" />
              Listar
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configuração
            </Button>
            <AddPlayerDialog />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou Nome do Player..."
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
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Playlist</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow 
                  key={player.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handlePlayerClick(player)}
                >
                  <TableCell className="font-medium">{player.player_id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.location || 'Localização não informada'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {player.city ? `${player.city}/${player.state}` : 'Não definido'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Nenhuma playlist</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        Player
                      </Badge>
                      {player.status === 'online' && (
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(player.status)}
                      {getDownloadStatusBadge('pending')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(player.last_activity).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(player.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredPlayers.length} de {players.length} players
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

        <PlayerDetailModal
          player={selectedPlayer}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      </div>
    </Layout>
  );
};

export default Players;