import PlaylistPlatformField from '@/components/PlaylistPlatformField';
import { PlaylistPlatform, platformValue } from '@/lib/playlist-platform';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useRefresh } from '@/contexts/RefreshContext';

interface AddPlaylistDialogProps {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

const AddPlaylistDialog = ({ trigger, onCreated }: AddPlaylistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target_platform: 'all' as PlaylistPlatform,
    name: '',
    description: '',
    status: 'draft',
  });

  const { addPlaylist } = usePlaylists();
  const { addNotification } = useNotificationContext();
  const { triggerRefresh } = useRefresh();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      await addPlaylist({
        target_platform: formData.target_platform,
        name: formData.name,
        description: formData.description,
        is_active: formData.status === 'active',
      });

      // Adicionar notificação
      addNotification({
        type: 'playlist_created',
        title: 'Playlist Criada',
        message: `A playlist "${formData.name}" foi criada com sucesso.`
      });

      console.log('✅ AddPlaylistDialog: Playlist criada com sucesso!');

      // Forçar refresh global
      triggerRefresh();

      setFormData({
        target_platform:'all',
        name: '',
        description: '',
        status: 'draft',
      });
      setOpen(false);
      onCreated?.();
    } catch (error) {
      console.error('Error adding playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" />
            Nova Playlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Playlist</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar uma nova playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Nome da Playlist *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Promoções de Janeiro"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo desta playlist..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="status">Status Inicial</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>

                </SelectContent>
              </Select>
            </div>
          </div>
          <PlaylistPlatformField value={formData.target_platform} onChange={value=>setFormData(prev=>({...prev,target_platform:value}))}/>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Playlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaylistDialog;