import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';

interface AddPlayerDialogProps {
  trigger?: React.ReactNode;
}

const AddPlayerDialog = ({ trigger }: AddPlayerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    player_id: '',
    location: '',
    city: '',
    state: '',
    ip: '',
    api_key: '',
    playlist_url: '',
  });

  const { addPlayer } = usePlayers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.player_id) return;

    setLoading(true);
    try {
      await addPlayer({
        ...formData,
        status: 'offline',
        last_activity: new Date().toISOString(),
        uptime: '0h 0m',
        connection_losses: 0,
      });
      
      setFormData({
        name: '',
        player_id: '',
        location: '',
        city: '',
        state: '',
        ip: '',
        api_key: '',
        playlist_url: '',
      });
      setOpen(false);
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData(prev => ({ ...prev, api_key: key }));
  };

  const generatePlaylistUrl = () => {
    const baseUrl = 'https://192.168.3.29:8080/api/playlist';
    const playerId = formData.player_id || 'new-player';
    setFormData(prev => ({ ...prev, playlist_url: `${baseUrl}/${playerId}` }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Player
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Player</DialogTitle>
            <DialogDescription>
              Preencha as informações para cadastrar um novo player no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Nome do Player *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Player Loja Centro"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="player_id">ID do Player *</Label>
                <Input
                  id="player_id"
                  value={formData.player_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, player_id: e.target.value }))}
                  placeholder="Ex: P001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ip">Endereço IP</Label>
                <Input
                  id="ip"
                  value={formData.ip}
                  onChange={(e) => setFormData(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="192.168.1.100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Loja Centro - São Paulo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="SP"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="api_key">Chave API</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Chave de autenticação"
                />
                <Button type="button" variant="outline" onClick={generateApiKey}>
                  Gerar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="playlist_url">URL da Playlist</Label>
              <div className="flex gap-2">
                <Input
                  id="playlist_url"
                  value={formData.playlist_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, playlist_url: e.target.value }))}
                  placeholder="URL para sincronização"
                />
                <Button type="button" variant="outline" onClick={generatePlaylistUrl}>
                  Gerar
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;