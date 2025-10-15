import { useState, useEffect } from 'react';
import { Plus, Search, Monitor, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PlayerCard from '@/components/PlayerCard';
import GeneratePlayerCodeModalWrapper from '@/components/GeneratePlayerCodeModalWrapper';
import { usePlayerAssociationsFixed } from '@/hooks/usePlayerAssociationsFixed';
import { usePlayerLimit } from '@/hooks/usePlayerLimit';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Players = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateCodeDialog, setShowGenerateCodeDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { players, loading, deactivatePlayer, activatePlayer, deletePlayer, updatePlayerName, refetch } = usePlayerAssociationsFixed();
  const { playerLimit, loading: limitLoading, refetch: refetchLimit } = usePlayerLimit();
  const { toast } = useToast();

  // Carregar dados apenas quando a página é carregada
  useEffect(() => {
    refetch();
    refetchLimit();
  }, []);

  // Atualizar timestamp quando players mudam
  useEffect(() => {
    if (players.length > 0) {
      setLastUpdate(new Date());
    }
  }, [players]);






  const filteredPlayers = players.filter(player =>
    player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.player_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.player_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlinePlayers = players.filter(p => p.is_online).length;
  const totalPlayers = players.length;

  const handleEditPlayer = (player: any) => {
    setEditingPlayer(player);
    setNewPlayerName(player.player_name);
    setShowEditDialog(true);
  };

  const handleSavePlayerName = async () => {
    if (!editingPlayer || !newPlayerName.trim()) return;

    try {
      await updatePlayerName(editingPlayer.player_id, newPlayerName.trim());
      setShowEditDialog(false);
      setEditingPlayer(null);
      setNewPlayerName('');
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  const handleTogglePlayerStatus = async (playerId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await activatePlayer(playerId);
      } else {
        await deactivatePlayer(playerId);
      }
    } catch (error) {
      console.error('Error toggling player status:', error);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Tem certeza que deseja remover este player? Esta ação não pode ser desfeita.')) {
      try {
        await deletePlayer(playerId);
      } catch (error) {
        console.error('Error deleting player:', error);
      }
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Players</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Gerencie e monitore todos os seus dispositivos de exibição
            </p>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground mt-1">
                🔄 Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    refetch();
                    refetchLimit();
                  }} 
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button onClick={() => setShowGenerateCodeDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Código
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlayers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Players Online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlinePlayers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Players Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {playerLimit.isUnlimited ? '∞' : playerLimit.availablePlayers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {playerLimit.isUnlimited 
                  ? 'Ilimitado' 
                  : `${playerLimit.currentPlayers}/${playerLimit.maxPlayers} utilizados`
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, ID ou código..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Players Grid */}
        {filteredPlayers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum player encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'Nenhum player corresponde à sua busca'
                  : 'Você ainda não tem players associados à sua conta'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowGenerateCodeDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Primeiro Código
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.player_id}
                player={player}
                onEdit={handleEditPlayer}
                onToggleStatus={handleTogglePlayerStatus}
                onDelete={handleDeletePlayer}
              />
            ))}
                    </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredPlayers.length} de {totalPlayers} players
          </p>
        </div>

            {/* Generate Code Dialog */}
            <GeneratePlayerCodeModalWrapper
              open={showGenerateCodeDialog}
              onOpenChange={(open) => {
                setShowGenerateCodeDialog(open);
                // Recarregar lista quando o modal for fechado
                if (!open) {
                  refetch();
                }
              }}
            />

        {/* Edit Player Name Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Nome do Player</DialogTitle>
              <DialogDescription>
                Altere o nome exibido para este player
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player-name">Nome do Player</Label>
                <Input
                  id="player-name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Digite o novo nome"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
            </Button>
                <Button onClick={handleSavePlayerName}>
                  Salvar
            </Button>
          </div>
        </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Players;