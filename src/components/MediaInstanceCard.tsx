import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Edit,
  Trash2,
  Monitor,
  Smartphone,
  Layers,
  Play,
  Pause
  ,Rss, Cloud, Globe, Clock, Calendar, Hash
} from 'lucide-react';
import { MediaInstance } from '@/hooks/useMediaTemplates';

interface MediaInstanceCardProps {
  instance: MediaInstance;
  onEdit: () => void;
  onDelete: () => void;
  onPreview?: () => void;
}

const mediaTypeIcons = {
  static: Play,
  rss: Rss,
  weather: Cloud,
  webpage: Globe,
  clock: Clock,
  calendar: Calendar,
  counter: Hash,
  overlay: Layers
};

const mediaTypeLabels = {
  static: 'Vídeo/Imagem',
  rss: 'RSS Feed',
  weather: 'Previsão do Tempo',
  webpage: 'Página Web',
  clock: 'Relógio Digital',
  calendar: 'Calendário',
  counter: 'Contador',
  overlay: 'Mensagem de rodapé'
};

export function MediaInstanceCard({
  instance,
  onEdit,
  onDelete,
  onPreview
}: MediaInstanceCardProps) {
  const template = instance.template;
  const Icon = mediaTypeIcons[template?.media_type || 'static'];
  const label = mediaTypeLabels[template?.media_type || 'static'];

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{instance.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.is_active)}`} />
            <span className="text-xs text-muted-foreground">
              {getStatusText(instance.is_active)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {instance.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {instance.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge variant={template?.orientation === 'horizontal' ? 'default' : 'secondary'} className="text-xs">
            {template?.orientation === 'horizontal' ? (
              <>
                <Monitor className="h-3 w-3 mr-1" />
                Horizontal
              </>
            ) : (
              <>
                <Smartphone className="h-3 w-3 mr-1" />
                Vertical
              </>
            )}
          </Badge>

          {template?.is_overlay && (
            <Badge variant="outline" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Overlay
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>

          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Criado em</span>
            <span>
              {new Date(instance.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
