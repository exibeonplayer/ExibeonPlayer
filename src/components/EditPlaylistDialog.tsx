import PlaylistPlatformField from '@/components/PlaylistPlatformField';
import { PlaylistPlatform, platformValue } from '@/lib/playlist-platform';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';

interface EditPlaylistDialogProps {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPlaylistDialog = ({ playlist, open, onOpenChange }: EditPlaylistDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target_platform: 'all' as PlaylistPlatform,
    name: '',
    is_active: true,
  });

  const { updatePlaylist, refreshPlaylists } = usePlaylists();

  // Atualizar dados do formulário quando a playlist mudar
  useEffect(() => {
    if (playlist) {
      setFormData({
        target_platform: platformValue(playlist.target_platform),
        name: playlist.name,
        is_active: playlist.is_active ?? true,
      });
    }
  }, [playlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist || !formData.name) return;

    setLoading(true);
    try {
      await updatePlaylist(playlist.id, {
        target_platform: formData.target_platform,
        name: formData.name,
        is_active: formData.is_active,
      });

      // Recarregar lista de playlists
      await refreshPlaylists();

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Playlist</DialogTitle>
            <DialogDescription>
              Edite as informações da playlist "{playlist?.name}".
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.is_active ? 'active' : 'draft'}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  is_active: value === 'active'
                }))}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlaylistDialog;
