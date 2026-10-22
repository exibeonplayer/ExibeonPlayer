import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OverlayPreview } from './OverlayPreview';
import {
  Monitor,
  Smartphone,
  Layers,
  Settings,
  Palette
} from 'lucide-react';

interface OverlayConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: OverlayConfig) => void;
  initialConfig?: OverlayConfig;
}

export interface OverlayConfig {
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  height: number;
  opacity: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  animation: 'none' | 'slide' | 'fade' | 'bounce';
  zIndex: number;
  content: string;
}

const defaultConfig: OverlayConfig = {
  position: 'bottom',
  height: 60,
  opacity: 0.8,
  backgroundColor: '#3b82f6',
  textColor: '#ffffff',
  fontSize: 14,
  fontWeight: 'bold',
  animation: 'slide',
  zIndex: 10,
  content: 'Barra Horizontal'
};

const positionOptions = [
  { value: 'top', label: 'Topo', icon: '⬆️' },
  { value: 'bottom', label: 'Inferior', icon: '⬇️' },
  { value: 'left', label: 'Esquerda', icon: '⬅️' },
  { value: 'right', label: 'Direita', icon: '➡️' },
  { value: 'center', label: 'Centro', icon: '🎯' }
];

const animationOptions = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'slide', label: 'Deslizar' },
  { value: 'fade', label: 'Fade' },
  { value: 'bounce', label: 'Bounce' }
];

export function OverlayConfigDialog({
  open,
  onOpenChange,
  onSave,
  initialConfig = defaultConfig
}: OverlayConfigDialogProps) {
  const [config, setConfig] = useState<OverlayConfig>(initialConfig);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleConfigChange = (key: keyof OverlayConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Configurar Overlay
          </DialogTitle>
          <DialogDescription>
            Configure as propriedades do overlay para sua mídia
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preview
            </h3>
            <OverlayPreview
              orientation="horizontal"
              position={config.position}
              height={config.height}
              opacity={config.opacity}
              content={config.content}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
            />
          </div>

          {/* Configurações */}
          <div className="space-y-6">
            {/* Posição */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Posicionamento</h4>
                <div className="grid grid-cols-2 gap-2">
                  {positionOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={config.position === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleConfigChange('position', option.value)}
                      className="justify-start"
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dimensões */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Dimensões</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Altura (px)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[config.height]}
                        onValueChange={([value]) => handleConfigChange('height', value)}
                        min={20}
                        max={200}
                        step={5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={config.height}
                        onChange={(e) => handleConfigChange('height', parseInt(e.target.value) || 20)}
                        className="w-20"
                        min={20}
                        max={200}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Z-Index</Label>
                    <Input
                      type="number"
                      value={config.zIndex}
                      onChange={(e) => handleConfigChange('zIndex', parseInt(e.target.value) || 1)}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aparência */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Aparência
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Opacidade</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[config.opacity]}
                        onValueChange={([value]) => handleConfigChange('opacity', value)}
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {Math.round(config.opacity * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm">Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Cor do Texto</Label>
                      <Input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => handleConfigChange('textColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm">Tamanho da Fonte</Label>
                      <Input
                        type="number"
                        value={config.fontSize}
                        onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value) || 12)}
                        min={8}
                        max={32}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Peso da Fonte</Label>
                      <select
                        value={config.fontWeight}
                        onChange={(e) => handleConfigChange('fontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Negrito</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conteúdo */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Conteúdo</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Texto do Overlay</Label>
                    <Input
                      value={config.content}
                      onChange={(e) => handleConfigChange('content', e.target.value)}
                      placeholder="Digite o texto do overlay..."
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Animação</Label>
                    <select
                      value={config.animation}
                      onChange={(e) => handleConfigChange('animation', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                    >
                      {animationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
          >
            Resetar
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configuração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
