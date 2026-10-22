import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Video, Image, Clock, Calendar, Hash, Globe, Cloud, Trash2 } from 'lucide-react';

interface OverlayDisplayProps {
  overlay: {
    id: string;
    media_file_id: string;
    media_instance_id: string;
    overlay_z_index: number;
    overlay_config: any;
    video_title: string;
    video_url: string;
    bar_height: number;
    bar_position: 'top' | 'bottom';
    bar_text: string;
  };
  onRemove?: (id: string) => void;
}

const OverlayDisplay: React.FC<OverlayDisplayProps> = ({ overlay, onRemove }) => {
  const getOverlayIcon = () => {
    return <Layers className="h-4 w-4" />;
  };

  const getPositionBadge = () => {
    const position = overlay.bar_position;
    const color = position === 'top' ? 'bg-blue-500' : 'bg-green-500';
    return (
      <Badge className={`${color} text-white`}>
        {position === 'top' ? 'Topo' : 'Rodapé'}
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-orange-500 bg-orange-50 dark:bg-orange-950">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getOverlayIcon()}
            <span className="font-semibold text-orange-700 dark:text-orange-300">
              Barra Horizontal
            </span>
            {getPositionBadge()}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Z-Index: {overlay.overlay_z_index}
            </Badge>
            {onRemove && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(overlay.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {overlay.video_title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Altura: {overlay.bar_height}px
            </span>
          </div>

          {overlay.bar_text && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Texto: "{overlay.bar_text}"
              </span>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Comportamento:</strong> Reproduz sobre outros vídeos da playlist
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverlayDisplay;
