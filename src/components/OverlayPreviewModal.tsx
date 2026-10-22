import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Hash, Globe, Cloud, Rss, Layers } from 'lucide-react';
import WeatherDisplay from './WeatherDisplay';
import { useWeatherAPI } from '@/hooks/useWeatherAPI';

interface OverlayPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  overlayConfig: {
    bar_height: number;
    bar_position: 'top' | 'bottom';
    bar_text: string;
    video_file?: File;
    video_url?: string;
  };
  additionalElements?: {
    clock?: {
      timezone: string;
      format: string;
      show_date: boolean;
      show_seconds: boolean;
    };
    calendar?: {
      highlight_today: boolean;
      show_week_numbers: boolean;
    };
    counter?: {
      start_value: number;
      end_value: number;
      direction: 'up' | 'down';
      speed: number;
    };
    rss?: {
      source_name: string;
      max_items: number;
    };
    weather?: {
      city_name: string;
      units: string;
    };
  };
}

const OverlayPreviewModal: React.FC<OverlayPreviewModalProps> = ({
  isOpen,
  onClose,
  overlayConfig,
  additionalElements = {}
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const { weatherData, fetchWeather } = useWeatherAPI();

  // Atualizar relógio a cada segundo
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Buscar dados do tempo quando modal abrir
  useEffect(() => {
    if (isOpen && additionalElements.weather) {
      fetchWeather({
        apiKey: additionalElements.weather.api_key || '',
        city: additionalElements.weather.city_name || 'São Paulo',
        country: additionalElements.weather.country_code || 'BR',
        units: additionalElements.weather.units || 'metric'
      });
    }
  }, [isOpen, additionalElements.weather, fetchWeather]);

  // Carregar vídeo quando modal abrir
  useEffect(() => {
    if (isOpen && videoRef.current && overlayConfig.video_file) {
      console.log('Carregando vídeo no preview:', overlayConfig.video_file.name);
      const url = URL.createObjectURL(overlayConfig.video_file);
      videoRef.current.src = url;

      videoRef.current.onload = () => {
        console.log('Vídeo carregado com sucesso no preview');
      };

      videoRef.current.onerror = (e) => {
        console.error('Erro ao carregar vídeo no preview:', e);
      };

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [isOpen, overlayConfig.video_file]);

  if (!isOpen) {
    console.log('OverlayPreviewModal: Modal não está aberto');
    return null;
  }

  console.log('OverlayPreviewModal: Renderizando modal', { overlayConfig, additionalElements });

  const formatTime = (date: Date) => {
    if (additionalElements.clock?.format === '12h') {
      return date.toLocaleTimeString('pt-BR', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: additionalElements.clock.show_seconds ? '2-digit' : undefined
      });
    }
    return date.toLocaleTimeString('pt-BR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: additionalElements.clock.show_seconds ? '2-digit' : undefined
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Preview da Barra Horizontal</DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6">
          {/* Simulação da Tela de Exibição */}
          <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">

            {/* Vídeo de Fundo Principal */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-4xl font-bold text-center">
                <div>VÍDEO PRINCIPAL</div>
                <div className="text-lg mt-2">Conteúdo da Playlist</div>
              </div>
            </div>

            {/* Elementos Adicionais (Dentro da Barra Horizontal - Canto Esquerdo) */}
            {Object.keys(additionalElements).length > 0 && (
              <div
                className="absolute left-4 flex items-center gap-2"
                style={{
                  [overlayConfig.bar_position]: '8px',
                  zIndex: 1001,
                  height: `${overlayConfig.bar_height - 16}px`
                }}
              >
                {/* Relógio */}
                {additionalElements.clock && (
                  <div className="bg-black/90 text-white px-2 py-1 rounded backdrop-blur-sm inline-block">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-mono font-bold">
                        {formatTime(currentTime)}
                      </span>
                    </div>
                    {additionalElements.clock.show_date && (
                      <div className="text-xs text-gray-300">
                        {formatDate(currentTime)}
                      </div>
                    )}
                  </div>
                )}

                {/* Calendário */}
                {additionalElements.calendar && (
                  <div className="bg-black/90 text-white px-2 py-1 rounded backdrop-blur-sm inline-block">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {currentTime.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contador */}
                {additionalElements.counter && (
                  <div className="bg-black/90 text-white px-2 py-1 rounded backdrop-blur-sm inline-block">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span className="text-xs font-mono font-bold">
                        {additionalElements.counter.start_value}
                      </span>
                    </div>
                  </div>
                )}

                {/* RSS */}
                {additionalElements.rss && (
                  <div className="bg-black/90 text-white px-2 py-1 rounded backdrop-blur-sm inline-block">
                    <div className="flex items-center gap-1">
                      <Rss className="w-3 h-3" />
                      <span className="text-xs">
                        {additionalElements.rss.source_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tempo */}
                {additionalElements.weather && (
                  weatherData ? (
                    <WeatherDisplay weatherData={weatherData} compact={true} />
                  ) : (
                    <div className="bg-black/90 text-white px-2 py-1 rounded backdrop-blur-sm inline-block">
                      <div className="flex items-center gap-1">
                        <Cloud className="w-3 h-3" />
                        <span className="text-xs">
                          {additionalElements.weather.city_name}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Barra Horizontal (Overlay) */}
            <div
              className={`absolute left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center backdrop-blur-sm`}
              style={{
                height: `${overlayConfig.bar_height}px`,
                [overlayConfig.bar_position]: '0px',
                zIndex: 1000
              }}
            >
              {/* Texto centralizado */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  <span className="font-bold text-lg">
                    {overlayConfig.bar_text || 'Barra Horizontal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vídeo de Fundo da Barra (se houver) */}
            {overlayConfig.video_file && (
              <video
                ref={videoRef}
                className="absolute w-full object-cover"
                style={{
                  [overlayConfig.bar_position]: '0px',
                  height: `${overlayConfig.bar_height}px`,
                  zIndex: 999,
                  left: 0,
                  right: 0
                }}
                autoPlay
                muted
                loop
                playsInline
              />
            )}
          </div>

          {/* Informações da Configuração */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Configurações da Barra:</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>• Altura: {overlayConfig.bar_height}px</div>
                <div>• Posição: {overlayConfig.bar_position === 'top' ? 'Superior' : 'Inferior'}</div>
                <div>• Texto: {overlayConfig.bar_text || 'Nenhum'}</div>
                <div>• Z-index: 1000</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Elementos Adicionais:</h4>
              <div className="flex flex-wrap gap-1">
                {additionalElements.clock && <Badge variant="secondary">Relógio</Badge>}
                {additionalElements.calendar && <Badge variant="secondary">Calendário</Badge>}
                {additionalElements.counter && <Badge variant="secondary">Contador</Badge>}
                {additionalElements.rss && <Badge variant="secondary">RSS</Badge>}
                {additionalElements.weather && <Badge variant="secondary">Tempo</Badge>}
                {Object.keys(additionalElements).length === 0 && (
                  <span className="text-sm text-gray-500">Nenhum elemento adicional</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OverlayPreviewModal;
