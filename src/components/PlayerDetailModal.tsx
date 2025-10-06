import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Player } from '@/hooks/usePlayers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Circle, Activity, Wifi, Clock, Download, Play, RotateCcw, Trash2, Lock, Unlock } from 'lucide-react';

interface PlayerDetailModalProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlayerDetailModal = ({ player, open, onOpenChange }: PlayerDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!player) return null;

  const handleSendCommand = async (command: string, payload?: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('player_commands')
        .insert([{
          player_id: player.player_id,
          command: command,
          payload: payload || {},
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Comando enviado",
        description: `Comando ${command} enviado para o player`,
      });
    } catch (error) {
      console.error('Error sending command:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar comando",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Activity className="w-5 h-5" />
            Detalhes do Player: {player.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Circle className="w-4 h-4" />
                Status
              </h3>
              {getStatusBadge(player.status)}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                IP
              </h3>
              <p className="text-sm text-muted-foreground">
                {player.ip || 'Não disponível'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Último Heartbeat
              </h3>
              <p className="text-sm text-muted-foreground">
                {new Date(player.last_activity).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Uptime</h3>
              <p className="text-sm text-muted-foreground">
                {player.uptime || '0h 0m'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Informações do Player */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informações do Player</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID:</span> {player.player_id}
              </div>
              <div>
                <span className="font-medium">Localização:</span> {player.location || 'Não informada'}
              </div>
              <div>
                <span className="font-medium">Cidade:</span> {player.city || 'Não informada'}
              </div>
              <div>
                <span className="font-medium">Estado:</span> {player.state || 'Não informado'}
              </div>
              <div>
                <span className="font-medium">Perdas de Conexão:</span> {player.connection_losses || 0}
              </div>
            </div>
          </div>

          <Separator />

          {/* Ações do Player */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ações do Player</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSendCommand('request_logs')}
                disabled={loading}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Solicitar Logs
              </Button>

              <Button 
                variant="outline"
                onClick={() => handleSendCommand('sync_now')}
                disabled={loading}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Forçar Sincronização
              </Button>

              <Button 
                variant="outline"
                onClick={() => handleSendCommand('clear_cache')}
                disabled={loading}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Cache
              </Button>

              <Button 
                variant="outline"
                onClick={() => handleSendCommand('play_test_video')}
                disabled={loading}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Reproduzir Teste
              </Button>
            </div>

            {/* Ações de Licença */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Gerenciamento de Licença</h4>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => handleSendCommand('block_license')}
                  disabled={loading}
                  className="flex-1"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Bloquear Licença
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => handleSendCommand('unblock_license')}
                  disabled={loading}
                  className="flex-1"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Desbloquear Licença
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDetailModal;