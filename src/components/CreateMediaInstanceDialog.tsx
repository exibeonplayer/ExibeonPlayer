import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaTemplates, MediaTemplate } from '@/hooks/useMediaTemplates';
import { useRssSources, RssSource } from '@/hooks/useRssSources';
import { useVideos } from '@/hooks/useVideos';
import { OverlayConfigDialog, OverlayConfig } from './OverlayConfigDialog';
import OverlayPreviewModal from './OverlayPreviewModal';
import SimplePreviewModal from './SimplePreviewModal';
import { useUpload } from '@/hooks/useUpload';
import { Monitor, Smartphone, Layers, Settings, Rss, Globe, Cloud, Clock, Calendar, Hash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CityAutocomplete from './CityAutocomplete';
import WeatherVideoGenerator from './WeatherVideoGenerator';
import InmetWeatherDisplay from './InmetWeatherDisplay';

interface CreateMediaInstanceDialogProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstanceCreated: () => void;
}

export function CreateMediaInstanceDialog({
  templateId,
  open,
  onOpenChange,
  onInstanceCreated
}: CreateMediaInstanceDialogProps) {
  const { templates, createInstance, loading } = useMediaTemplates();
  const { sources: rssSources, loading: rssLoading } = useRssSources();
  const { addVideo } = useVideos();
  const { uploadFile } = useUpload();
  const [template, setTemplate] = useState<MediaTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customConfig: {} as Record<string, any>,
    rssSourceId: '' as string
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showOverlayConfig, setShowOverlayConfig] = useState(false);
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Debug: Log quando showPreview muda
  useEffect(() => {
    console.log('showPreview mudou para:', showPreview);
  }, [showPreview]);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const foundTemplate = templates.find(t => t.id === templateId);
      setTemplate(foundTemplate || null);

      if (foundTemplate) {
        // Inicializar configurações padrão baseadas no template
        const defaultConfig = { ...foundTemplate.template_config };
        setFormData(prev => ({
          ...prev,
          customConfig: defaultConfig
        }));
      }
    }
  }, [templateId, templates]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRssSourceChange = (sourceId: string) => {
    setFormData(prev => ({
      ...prev,
      rssSourceId: sourceId
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customConfig: {
        ...prev.customConfig,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template || !formData.name.trim()) {
      return;
    }

    // Validação específica para templates RSS
    if (template.media_type === 'rss' && !formData.rssSourceId) {
      alert('Por favor, selecione uma fonte de notícias RSS.');
      return;
    }

    // Validação específica para templates de overlay (barra horizontal)
    if (template.media_type === 'overlay' && !formData.customConfig.video_file) {
      alert('Por favor, selecione um vídeo de fundo para a barra horizontal.');
      return;
    }

    // Validação específica para templates de webpage
    if (template.media_type === 'webpage' && !formData.customConfig.web_url) {
      alert('Por favor, digite a URL da página web.');
      return;
    }

    // Validação específica para templates de weather
    if (template.media_type === 'weather' && !formData.customConfig.city_name) {
      alert('Por favor, digite o nome da cidade para a previsão do tempo.');
      return;
    }

    try {
      setIsCreating(true);

      // Caso especial: Barra Horizontal (overlay)
      if (template.media_type === 'overlay') {
        await createOverlayMedia(template, formData, overlayConfig);
      } else {
        // Casos normais: outras mídias avançadas
        const finalConfig = {
          ...formData.customConfig,
          ...(template.is_overlay && overlayConfig ? { overlay_config: overlayConfig } : {}),
          // Incluir fonte RSS se for um template RSS
          ...(template.media_type === 'rss' && formData.rssSourceId ? { rss_source_id: formData.rssSourceId } : {})
        };

        await createInstance(
          template.id,
          formData.name.trim(),
          formData.description.trim(),
          finalConfig
        );
      }

      onInstanceCreated();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOverlayConfigSave = (config: OverlayConfig) => {
    setOverlayConfig(config);
    setShowOverlayConfig(false);
  };

  const createOverlayMedia = async (template: MediaTemplate, formData: any, overlayConfig: OverlayConfig | null) => {
    if (!formData.customConfig.video_file) {
      throw new Error('Vídeo de fundo é obrigatório para barra horizontal');
    }

    // 1. Upload do vídeo usando o sistema R2 existente
    const videoFile = formData.customConfig.video_file;
    const fileUrl = await uploadFile(videoFile);

    // 2. Salvar referência no banco usando o hook de vídeos
    const videoData = await addVideo({
      title: formData.name.trim(),
      description: formData.description.trim(),
      content_type: 'video',
      file_url: fileUrl,
      file_size_bytes: videoFile.size,
      orientation: template.orientation,
      is_overlay: true
    });

    // 3. Criar media_instance com configurações de overlay
    const overlayConfigData = {
      ...formData.customConfig,
      video_file_id: videoData.id, // Referência ao vídeo
      bar_height: formData.customConfig.bar_height || 60,
      bar_position: formData.customConfig.bar_position || 'bottom',
      bar_text: formData.customConfig.bar_text || '',
      is_overlay: true,
      z_index: 1000
    };

    await createInstance(
      template.id,
      formData.name.trim(),
      formData.description.trim(),
      overlayConfigData
    );
  };

  const renderConfigField = (key: string, value: any, type: string) => {
    // Traduzir labels específicos
    const getTranslatedLabel = (key: string) => {
      const translations: Record<string, string> = {
        'units': 'Unidade de Temperatura',
        'api_key': 'Chave da API',
        'city_name': 'Nome da Cidade',
        'country_code': 'Código do País',
        'web_url': 'URL da Página Web',
        'refresh_interval': 'Intervalo de Atualização',
        'show_scrollbar': 'Mostrar Barra de Rolagem',
        'timezone': 'Fuso Horário',
        'format': 'Formato',
        'show_date': 'Mostrar Data',
        'show_seconds': 'Mostrar Segundos',
        'font_size': 'Tamanho da Fonte',
        'background_image': 'Imagem de Fundo',
        'week_numbers': 'Números da Semana',
        'first_day': 'Primeiro Dia',
        'highlight_today': 'Destacar Hoje',
        'start_value': 'Valor Inicial',
        'end_value': 'Valor Final',
        'direction': 'Direção',
        'speed': 'Velocidade',
        'prefix': 'Prefixo',
        'suffix': 'Sufixo',
        'video_file': 'Arquivo de Vídeo',
        'bar_height': 'Altura da Barra',
        'bar_position': 'Posição da Barra',
        'bar_text': 'Texto da Barra',
        'bar_opacity': 'Opacidade da Barra',
        'bar_background_color': 'Cor de Fundo da Barra',
        'bar_text_color': 'Cor do Texto da Barra',
        'bar_animation': 'Animação da Barra',
        'z_index': 'Índice Z',
        'clock_enabled': 'Relógio Habilitado',
        'calendar_enabled': 'Calendário Habilitado',
        'counter_enabled': 'Contador Habilitado',
        'rss_enabled': 'RSS Habilitado',
        'weather_enabled': 'Tempo Habilitado'
      };

      return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={key}
              checked={value || false}
              onChange={(e) => handleConfigChange(key, e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={key} className="text-sm">
              {getTranslatedLabel(key)}
            </Label>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-sm">
              {getTranslatedLabel(key)}
            </Label>
            <Input
              id={key}
              type="number"
              value={value || ''}
              onChange={(e) => handleConfigChange(key, parseInt(e.target.value) || 0)}
              className="text-sm"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-sm">
              {getTranslatedLabel(key)}
            </Label>
            <Input
              id={key}
              type="text"
              value={value || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="text-sm"
            />
          </div>
        );
    }
  };

  const getConfigFieldType = (key: string, value: any): string => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Mídia</DialogTitle>
          <DialogDescription>
            Configure sua mídia baseada no template selecionado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={template.orientation === 'horizontal' ? 'default' : 'secondary'}>
                  {template.orientation === 'horizontal' ? (
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

                {template.is_overlay && (
                  <Badge variant="outline">
                    <Layers className="h-3 w-3 mr-1" />
                    Overlay
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Mídia *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Apresentação Corporativa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o propósito desta mídia..."
                rows={3}
              />
            </div>
          </div>

          {/* RSS Source Selection - Only for RSS templates */}
          {template.media_type === 'rss' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Rss className="h-4 w-4" />
                Fonte de Notícias
              </h4>
              <div className="space-y-2">
                <Label htmlFor="rssSource">Selecione a Fonte RSS *</Label>
                <Select
                  value={formData.rssSourceId}
                  onValueChange={handleRssSourceChange}
                  disabled={rssLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={rssLoading ? "Carregando fontes..." : "Escolha uma fonte de notícias"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rssSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{source.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {source.category} • {source.language}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.rssSourceId && (
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const selectedSource = rssSources.find(s => s.id === formData.rssSourceId);
                      return selectedSource ? (
                        <div className="p-3 bg-muted rounded-lg">
                          <p><strong>URL:</strong> {selectedSource.url}</p>
                          <p><strong>Atualização:</strong> A cada {selectedSource.update_interval} segundos</p>
                          <p><strong>Máx. Itens:</strong> {selectedSource.max_items}</p>
                          {selectedSource.description && (
                            <p><strong>Descrição:</strong> {selectedSource.description}</p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template Configuration */}
          {Object.keys(template.template_config).length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Configurações do Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(template.template_config).map(([key, value]) => (
                  <div key={key}>
                    {renderConfigField(key, formData.customConfig[key] ?? value, getConfigFieldType(key, value))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configurações Específicas por Tipo */}
          {template.media_type === 'overlay' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Configurações da Barra Horizontal
              </h4>
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="videoFile">Vídeo de Fundo *</Label>
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleConfigChange('video_file', e.target.files?.[0])}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Selecione um vídeo que será exibido atrás da barra horizontal
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barHeight">Altura da Barra (px)</Label>
                    <Input
                      id="barHeight"
                      type="number"
                      value={formData.customConfig.bar_height || 60}
                      onChange={(e) => handleConfigChange('bar_height', parseInt(e.target.value) || 60)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barPosition">Posição</Label>
                    <Select
                      value={formData.customConfig.bar_position || 'bottom'}
                      onValueChange={(value) => handleConfigChange('bar_position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Superior</SelectItem>
                        <SelectItem value="bottom">Inferior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barText">Texto da Barra</Label>
                  <Input
                    id="barText"
                    value={formData.customConfig.bar_text || ''}
                    onChange={(e) => handleConfigChange('bar_text', e.target.value)}
                    placeholder="Ex: Promoção especial - 50% OFF"
                    className="text-sm"
                  />
                </div>

                {/* Elementos Adicionais */}
                <div className="space-y-3 pt-2">
                  <h5 className="font-medium text-sm">Elementos Adicionais (Opcional)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.customConfig.clock_enabled || false}
                        onChange={(e) => handleConfigChange('clock_enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Relógio</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.customConfig.calendar_enabled || false}
                        onChange={(e) => handleConfigChange('calendar_enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Calendário</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.customConfig.counter_enabled || false}
                        onChange={(e) => handleConfigChange('counter_enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Contador</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.customConfig.rss_enabled || false}
                        onChange={(e) => handleConfigChange('rss_enabled', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">RSS</span>
                    </label>
                  </div>
                </div>

                {/* Botão de Preview */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log('Botão Preview clicado', {
                        videoFile: formData.customConfig.video_file,
                        showPreview: showPreview
                      });
                      setShowPreview(true);
                    }}
                    className="w-full"
                    disabled={!formData.customConfig.video_file}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    Visualizar Preview
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Veja como ficará a barra horizontal com os elementos
                  </p>
                </div>
              </div>
            </div>
          )}

          {template.media_type === 'webpage' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Configurações da Página Web
              </h4>
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="webUrl">URL da Página *</Label>
                  <Input
                    id="webUrl"
                    type="url"
                    value={formData.customConfig.web_url || ''}
                    onChange={(e) => handleConfigChange('web_url', e.target.value)}
                    placeholder="https://exemplo.com"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite a URL completa da página que será exibida
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Intervalo de Atualização (min)</Label>
                    <Input
                      id="refreshInterval"
                      type="number"
                      value={formData.customConfig.refresh_interval || 5}
                      onChange={(e) => handleConfigChange('refresh_interval', parseInt(e.target.value) || 5)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="showScrollbar">Mostrar Barra de Rolagem</Label>
                    <Select
                      value={formData.customConfig.show_scrollbar ? 'true' : 'false'}
                      onValueChange={(value) => handleConfigChange('show_scrollbar', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {template.media_type === 'weather' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Configurações da Previsão do Tempo
              </h4>
              <div className="space-y-4 p-4 border rounded-lg">
                <CityAutocomplete
                  value={formData.customConfig.city_name || ''}
                  onChange={(value) => handleConfigChange('city_name', value)}
                  placeholder="Digite o nome da cidade..."
                  label="Cidade *"
                  required={true}
                />

                {/* Configurações Automáticas */}
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">
                    ⚙️ Configurações Automáticas (Otimizadas para TV)
                  </h5>
                  <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <div>• <strong>País:</strong> Brasil (BR)</div>
                    <div>• <strong>Temperatura:</strong> Celsius (°C)</div>
                    <div>• <strong>Chave da API:</strong> Sistema padrão</div>
                    <div>• <strong>Dimensões:</strong> Full HD (1920x1080)</div>
                    <div>• <strong>Orientação:</strong> {template.orientation === 'horizontal' ? 'Horizontal (TV)' : 'Vertical (Painel)'}</div>
                  </div>
                </div>
              </div>

              {/* Preview em Tempo Real do INMET */}
              {formData.customConfig.city_name && (
                <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <h5 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">
                    🌤️ Preview em Tempo Real (INMET)
                  </h5>
                  <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                    Dados simulados baseados no INMET - Instituto Nacional de Meteorologia
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <InmetWeatherDisplay
                      cityName={formData.customConfig.city_name}
                      stateCode={formData.customConfig.country_code || 'BR'}
                      orientation={template.orientation}
                      autoRefresh={true}
                      refreshInterval={10}
                    />
                  </div>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✅ Esta mídia será reproduzida em tempo real no player (não é um vídeo gravado)
                  </div>
                </div>
              )}
            </div>
          )}

          {template.media_type === 'clock' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configurações do Relógio Digital
              </h4>
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Input
                      id="timezone"
                      value={formData.customConfig.timezone || 'America/Sao_Paulo'}
                      onChange={(e) => handleConfigChange('timezone', e.target.value)}
                      placeholder="America/Sao_Paulo"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">Formato do Relógio</Label>
                    <Select
                      value={formData.customConfig.format || '24h'}
                      onValueChange={(value) => handleConfigChange('format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 horas (14:30)</SelectItem>
                        <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="showDate">Mostrar Data</Label>
                    <Select
                      value={formData.customConfig.show_date ? 'true' : 'false'}
                      onValueChange={(value) => handleConfigChange('show_date', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="showSeconds">Mostrar Segundos</Label>
                    <Select
                      value={formData.customConfig.show_seconds ? 'true' : 'false'}
                      onValueChange={(value) => handleConfigChange('show_seconds', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Tamanho da Fonte (px)</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={formData.customConfig.font_size || 48}
                    onChange={(e) => handleConfigChange('font_size', parseInt(e.target.value) || 48)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {template.media_type === 'calendar' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Configurações do Calendário
              </h4>
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="backgroundImage">Imagem de Fundo (Opcional)</Label>
                  <Input
                    id="backgroundImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleConfigChange('background_image', e.target.files?.[0])}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adicione sua marca ou uma imagem personalizada como fundo
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="showWeekNumbers">Mostrar Números da Semana</Label>
                    <Select
                      value={formData.customConfig.show_week_numbers ? 'true' : 'false'}
                      onValueChange={(value) => handleConfigChange('show_week_numbers', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstDayOfWeek">Primeiro Dia da Semana</Label>
                    <Select
                      value={formData.customConfig.first_day_of_week || 'sunday'}
                      onValueChange={(value) => handleConfigChange('first_day_of_week', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunday">Domingo</SelectItem>
                        <SelectItem value="monday">Segunda-feira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlightToday">Destacar Hoje</Label>
                  <Select
                    value={formData.customConfig.highlight_today ? 'true' : 'false'}
                    onValueChange={(value) => handleConfigChange('highlight_today', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {template.media_type === 'counter' && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Configurações do Contador
              </h4>
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="backgroundImage">Imagem de Fundo (Opcional)</Label>
                  <Input
                    id="backgroundImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleConfigChange('background_image', e.target.files?.[0])}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adicione sua marca ou uma imagem personalizada como fundo
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startValue">Valor Inicial</Label>
                    <Input
                      id="startValue"
                      type="number"
                      value={formData.customConfig.start_value || 0}
                      onChange={(e) => handleConfigChange('start_value', parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endValue">Valor Final</Label>
                    <Input
                      id="endValue"
                      type="number"
                      value={formData.customConfig.end_value || 100}
                      onChange={(e) => handleConfigChange('end_value', parseInt(e.target.value) || 100)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="direction">Direção</Label>
                    <Select
                      value={formData.customConfig.direction || 'up'}
                      onValueChange={(value) => handleConfigChange('direction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Crescente</SelectItem>
                        <SelectItem value="down">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speed">Velocidade (ms)</Label>
                    <Input
                      id="speed"
                      type="number"
                      value={formData.customConfig.speed || 100}
                      onChange={(e) => handleConfigChange('speed', parseInt(e.target.value) || 100)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefixo (Opcional)</Label>
                  <Input
                    id="prefix"
                    value={formData.customConfig.prefix || ''}
                    onChange={(e) => handleConfigChange('prefix', e.target.value)}
                    placeholder="Ex: R$"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Sufixo (Opcional)</Label>
                  <Input
                    id="suffix"
                    value={formData.customConfig.suffix || ''}
                    onChange={(e) => handleConfigChange('suffix', e.target.value)}
                    placeholder="Ex: %"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Overlay Configuration */}
          {template.is_overlay && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Configuração de Overlay
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverlayConfig(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Overlay
                </Button>
              </div>

              {overlayConfig ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Posição:</span>
                        <span className="ml-2 capitalize">{overlayConfig.position}</span>
                      </div>
                      <div>
                        <span className="font-medium">Altura:</span>
                        <span className="ml-2">{overlayConfig.height}px</span>
                      </div>
                      <div>
                        <span className="font-medium">Opacidade:</span>
                        <span className="ml-2">{Math.round(overlayConfig.opacity * 100)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Z-Index:</span>
                        <span className="ml-2">{overlayConfig.zIndex}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure as propriedades do overlay
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOverlayConfig(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Overlay
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isCreating ||
                !formData.name.trim() ||
                (template?.media_type === 'rss' && !formData.rssSourceId) ||
                (template?.media_type === 'overlay' && !formData.customConfig.video_file) ||
                (template?.media_type === 'webpage' && !formData.customConfig.web_url) ||
                (template?.media_type === 'weather' && !formData.customConfig.city_name)
              }
            >
              {isCreating ? 'Criando...' : 'Criar Mídia'}
            </Button>
          </div>
        </form>

        {/* Overlay Configuration Dialog */}
        {showOverlayConfig && (
          <OverlayConfigDialog
            open={showOverlayConfig}
            onOpenChange={setShowOverlayConfig}
            onSave={handleOverlayConfigSave}
            initialConfig={overlayConfig || undefined}
          />
        )}

        {/* Overlay Preview Modal */}
        {showPreview && template?.media_type === 'overlay' && (
          <OverlayPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            overlayConfig={{
              bar_height: formData.customConfig.bar_height || 60,
              bar_position: formData.customConfig.bar_position || 'bottom',
              bar_text: formData.customConfig.bar_text || '',
              video_file: formData.customConfig.video_file,
              video_url: formData.customConfig.video_url
            }}
            additionalElements={{
              clock: formData.customConfig.clock_enabled ? {
                timezone: formData.customConfig.timezone || 'America/Sao_Paulo',
                format: formData.customConfig.format || '24h',
                show_date: formData.customConfig.show_date || false,
                show_seconds: formData.customConfig.show_seconds || false
              } : undefined,
              calendar: formData.customConfig.calendar_enabled ? {
                highlight_today: formData.customConfig.highlight_today || true,
                show_week_numbers: formData.customConfig.show_week_numbers || false
              } : undefined,
              counter: formData.customConfig.counter_enabled ? {
                start_value: formData.customConfig.start_value || 0,
                end_value: formData.customConfig.end_value || 100,
                direction: formData.customConfig.direction || 'up',
                speed: formData.customConfig.speed || 100
              } : undefined,
              rss: formData.customConfig.rss_enabled ? {
                source_name: formData.customConfig.rss_source_name || 'Notícias',
                max_items: formData.customConfig.max_items || 5
              } : undefined,
              weather: formData.customConfig.weather_enabled ? {
                api_key: '', // Usar chave da API padrão do sistema
                city_name: formData.customConfig.city_name || 'São Paulo',
                country_code: 'BR', // Sempre Brasil
                units: 'metric' // Sempre Celsius
              } : undefined
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
