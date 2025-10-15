import { useState } from 'react';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause, 
  Volume2, 
  Settings,
  MoreVertical,
  Trash2,
  Power,
  PowerOff,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlayerWithStats } from '@/hooks/usePlayerAssociations';
import { formatLastSeen } from '@/utils/playerUtils';

interface PlayerCardProps {
  player: PlayerWithStats;
  onEdit: (player: PlayerWithStats) => void;
  onToggleStatus: (playerId: string, isActive: boolean) => void;
  onDelete: (playerId: string) => void;
}

const PlayerCard = ({ player, onEdit, onToggleStatus, onDelete }: PlayerCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = () => {
    if (!player.is_active) return 'bg-gray-100 text-gray-800';
    if (player.is_online) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (!player.is_active) return 'Desativado';
    if (player.is_online) return 'Online';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (!player.is_active) return <PowerOff className="w-3 h-3" />;
    if (player.is_online) return <Wifi className="w-3 h-3" />;
    return <WifiOff className="w-3 h-3" />;
  };

  const getPlaybackIcon = () => {
    if (!player.current_video) return null;
    return player.current_video.is_playing ? 
      <Play className="w-3 h-3" /> : 
      <Pause className="w-3 h-3" />;
  };


  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer ${
        isHovered ? 'shadow-lg border-primary' : ''
      } ${!player.is_active ? 'opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="w-5 h-5" />
            {player.player_name}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(player)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Nome
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleStatus(player.player_id, !player.is_active)}
                >
                  {player.is_active ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(player.player_id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status de Conexão */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Última conexão:</span>
          <span>{formatLastSeen(player.last_seen)}</span>
        </div>

        {/* Informações do Vídeo Atual */}
        {player.current_video && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getPlaybackIcon()}
              <span className="text-sm font-medium">Reproduzindo:</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {player.current_video.title}
            </div>
            
          </div>
        )}

        {/* Métricas do Sistema */}
        {player.is_online && (player.cpu_usage !== undefined || player.memory_usage !== undefined) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            {player.cpu_usage !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">CPU</div>
                <div className="text-sm font-medium">{player.cpu_usage.toFixed(1)}%</div>
              </div>
            )}
            {player.memory_usage !== undefined && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Memória</div>
                <div className="text-sm font-medium">{player.memory_usage.toFixed(1)}%</div>
              </div>
            )}
          </div>
        )}

        {/* Volume */}
        {player.is_online && player.volume !== undefined && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Volume:</span>
            <span className="text-sm font-medium">{player.volume}%</span>
          </div>
        )}

        {/* Informações do Dispositivo */}
        {player.device_info && Object.keys(player.device_info).length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {player.device_info.os && (
                <div>Sistema: {player.device_info.os}</div>
              )}
              {player.device_info.screen_resolution && (
                <div>Resolução: {player.device_info.screen_resolution}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
