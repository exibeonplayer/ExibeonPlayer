import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  Smartphone,
  Layers,
  Eye,
  Settings,
  Play,
  Pause
} from 'lucide-react';

interface OverlayPreviewProps {
  orientation: 'horizontal' | 'vertical';
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  height?: number;
  opacity?: number;
  content?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onSettings?: () => void;
}

export function OverlayPreview({
  orientation,
  position,
  height = 60,
  opacity = 0.8,
  content = "Barra Horizontal",
  isPlaying = false,
  onTogglePlay,
  onSettings
}: OverlayPreviewProps) {
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      background: `rgba(59, 130, 246, ${opacity})`,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 10,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          top: 0,
          left: 0,
          right: 0,
          height: `${height}px`,
        };
      case 'bottom':
        return {
          ...baseStyles,
          bottom: 0,
          left: 0,
          right: 0,
          height: `${height}px`,
        };
      case 'left':
        return {
          ...baseStyles,
          top: 0,
          left: 0,
          bottom: 0,
          width: `${height}px`,
          writingMode: 'vertical-rl' as const,
        };
      case 'right':
        return {
          ...baseStyles,
          top: 0,
          right: 0,
          bottom: 0,
          width: `${height}px`,
          writingMode: 'vertical-rl' as const,
        };
      case 'center':
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: orientation === 'horizontal' ? '200px' : '60px',
          height: orientation === 'horizontal' ? '60px' : '200px',
        };
      default:
        return baseStyles;
    }
  };

  const getContainerSize = () => {
    return orientation === 'horizontal'
      ? 'w-32 h-20'
      : 'w-20 h-32';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Preview do Overlay</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {orientation === 'horizontal' ? (
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
            <Badge variant="secondary" className="text-xs">
              {position}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview Container */}
        <div className="relative bg-muted rounded-lg border-2 border-dashed border-border overflow-hidden">
          <div className={`${getContainerSize()} relative mx-auto`}>
            {/* Conteúdo principal simulado */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-xs font-medium">Conteúdo Principal</div>
                <div className="text-xs opacity-70">Vídeo/Imagem</div>
              </div>
            </div>

            {/* Overlay */}
            <div style={getPositionStyles()}>
              <div className="flex items-center gap-2">
                {isPlaying && <Play className="h-3 w-3" />}
                {!isPlaying && <Pause className="h-3 w-3" />}
                <span>{content}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-medium">Posição:</div>
            <div className="text-muted-foreground capitalize">{position}</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Altura:</div>
            <div className="text-muted-foreground">{height}px</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Opacidade:</div>
            <div className="text-muted-foreground">{Math.round(opacity * 100)}%</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Z-Index:</div>
            <div className="text-muted-foreground">10</div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePlay}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Reproduzir
              </>
            )}
          </Button>

          {onSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSettings}
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
