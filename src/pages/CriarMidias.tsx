import MediaTemplatePreview from '@/components/MediaTemplatePreview';
import MediaEditorDialog from '@/components/MediaEditorDialog';
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMediaTemplates } from '@/hooks/useMediaTemplates';
import {
  Video,
  Image,
  Rss,
  Cloud,
  Globe,
  Clock,
  Calendar,
  Hash,
  Layers,
  Plus,
  Eye,
  Edit,
  Trash2,
  Monitor,
  Smartphone
} from 'lucide-react';

import { MediaInstanceCard } from '@/components/MediaInstanceCard';

const mediaTypeIcons = {
  static: Video,
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

const mediaTypeDescriptions = {
  static: 'Vídeos e imagens tradicionais para reprodução',
  rss: 'Feeds de notícias e conteúdo dinâmico',
  weather: 'Previsão meteorológica com ícones e temperaturas',
  webpage: 'Páginas web embarcadas no player',
  clock: 'Data e hora em tempo real',
  calendar: 'Eventos e datas importantes',
  counter: 'Números e estatísticas animadas',
  overlay: 'Barras horizontais para sobreposição'
};

export default function CriarMidias() {
  const {
    templates: allTemplates,
    instances,
    loading,
    error,
    createInstance,
    updateInstance,
    deleteInstance,
    getTemplatesByType,
    getTemplatesByOrientation,
    getOverlayTemplates,
    getStaticTemplates,
    refetch
  } = useMediaTemplates();

  const templates=allTemplates.filter(t=>t.media_type!=='static'&&t.id!=='5729393c-5298-4e56-8e77-f8994d900822');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'horizontal' | 'vertical'>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
  const [activeTab,setActiveTab]=useState('templates');

  const handleCreateInstance = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowCreateDialog(true);
  };

  const handleInstanceCreated = () => {
    setShowCreateDialog(false);
    setSelectedTemplate(null);
    refetch();
  };

  const handleEditInstance = (instanceId: string) => {
    setSelectedInstance(instanceId);
    // Editor comum para todos os tipos de mídia.
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (confirm('Tem certeza que deseja deletar esta instância?')) {
      try {
        await deleteInstance(instanceId);
      } catch (error) {
        console.error('Erro ao deletar instância:', error);
      }
    }
  };

  // Filtrar templates baseado nos filtros selecionados
  const filteredTemplates = templates.filter(template => {
    const orientationMatch = orientationFilter === 'all' || template.orientation === orientationFilter;
    const typeMatch = mediaTypeFilter === 'all' || template.media_type === mediaTypeFilter;
    return orientationMatch && typeMatch;
  });

  // Agrupar templates filtrados por tipo
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.media_type]) {
      acc[template.media_type] = [];
    }
    acc[template.media_type].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  // Obter tipos de mídia únicos para o filtro
  const availableMediaTypes = Array.from(new Set(templates.map(t => t.media_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar templates: {error}</p>
          <Button onClick={refetch}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Criar Mídias</h1>
          <p className="text-muted-foreground">
            Crie mídias avançadas para painéis LED e TVs corporativas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Monitor className="h-3 w-3" />
            Horizontal
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Smartphone className="h-3 w-3" />
            Vertical
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Label htmlFor="orientation-filter" className="text-sm font-medium">
            Orientação:
          </Label>
          <select
            id="orientation-filter"
            value={orientationFilter}
            onChange={(e) => setOrientationFilter(e.target.value as 'all' | 'horizontal' | 'vertical')}
            className="px-3 py-1 border border-border rounded-md bg-background text-sm"
          >
            <option value="all">Todas</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="type-filter" className="text-sm font-medium">
            Tipo:
          </Label>
          <select
            id="type-filter"
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
            className="px-3 py-1 border border-border rounded-md bg-background text-sm"
          >
            <option value="all">Todos</option>
            {availableMediaTypes.map(type => (
              <option key={type} value={type}>
                {mediaTypeLabels[type as keyof typeof mediaTypeLabels]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredTemplates.length} template(s) encontrado(s)</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates Disponíveis</TabsTrigger>
          <TabsTrigger value="instances">
            Minhas Mídias ({instances.length})
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {Object.keys(groupedTemplates).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Tente ajustar os filtros para encontrar o template desejado
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOrientationFilter('all');
                    setMediaTypeFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {Object.entries(groupedTemplates).map(([mediaType, typeTemplates]) => {
              const Icon = mediaTypeIcons[mediaType as keyof typeof mediaTypeIcons];
              const label = mediaTypeLabels[mediaType as keyof typeof mediaTypeLabels];
              const description = mediaTypeDescriptions[mediaType as keyof typeof mediaTypeDescriptions];

              return (
                <Card key={mediaType}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{label}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {typeTemplates.map((template) => (
                        <Card key={template.id} className="border-2 hover:border-primary/50 transition-colors group">
                          <CardContent className="p-4">
                            <div className="mb-4 overflow-hidden rounded-lg"><MediaTemplatePreview type={template.media_type} orientation={template.orientation}/></div>

                            <div className="flex items-center justify-between mb-3">
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
                                  <Badge variant="outline">Overlay</Badge>
                                )}
                              </div>
                            </div>

                            <h3 className="font-semibold mb-2">{template.media_type==='overlay'?`Mensagem de rodapé ${template.orientation==='vertical'?'vertical':'horizontal'}`:template.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {template.description}
                            </p>

                            <Button
                              onClick={() => handleCreateInstance(template.id)}
                              className="w-full group-hover:bg-primary/90 transition-colors"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Criar Mídia
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-6">
          {instances.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma mídia criada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie sua primeira mídia usando um dos templates disponíveis
                </p>
                <Button onClick={() => setActiveTab('templates')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Mídia
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.map((instance) => (
                <MediaInstanceCard
                  key={instance.id}
                  instance={instance}
                  onEdit={() => handleEditInstance(instance.id)}
                  onDelete={() => handleDeleteInstance(instance.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MediaEditorDialog open={showCreateDialog||!!selectedInstance} instance={instances.find(i=>i.id===selectedInstance)||null} template={selectedInstance?instances.find(i=>i.id===selectedInstance)?.template||null:templates.find(t=>t.id===selectedTemplate)||null} onClose={()=>{setShowCreateDialog(false);setSelectedTemplate(null);setSelectedInstance(null);}} onSaved={refetch}/>

      </div>
    </Layout>
  );
}
