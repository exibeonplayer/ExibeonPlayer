import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Upload, PlayCircle, Monitor, FileText, Users, Settings, ArrowRight, Home } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  completed?: boolean;
}

const PrimeirosPassos = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Salvar progresso no localStorage
  useEffect(() => {
    const savedStep = localStorage.getItem('tutorial-step');
    const savedCompleted = localStorage.getItem('tutorial-completed');
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
    if (savedCompleted) {
      setCompletedSteps(JSON.parse(savedCompleted));
    }
  }, []);

  // Salvar progresso quando mudar
  useEffect(() => {
    localStorage.setItem('tutorial-step', currentStep.toString());
    localStorage.setItem('tutorial-completed', JSON.stringify(completedSteps));
  }, [currentStep, completedSteps]);

  const steps: Step[] = [
    {
      id: 1,
      title: "Bem-vindo ao Exibeon Player",
      description: "Conheça o sistema de Digital Signage mais completo",
      icon: Home,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Exibeon Player!</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              O Exibeon Player é uma solução completa de Digital Signage que permite gerenciar, 
              distribuir e monitorar conteúdo em múltiplos dispositivos de forma centralizada.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Monitor className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold">Gerenciamento Centralizado</h3>
                  <p className="text-sm text-muted-foreground">
                    Controle todos os seus players de um único local
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <PlayCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold">Conteúdo Dinâmico</h3>
                  <p className="text-sm text-muted-foreground">
                    Crie playlists personalizadas com vídeos e imagens
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold">Relatórios Detalhados</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe a performance e atividade dos players
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "1. Upload de Conteúdo",
      description: "Adicione vídeos e imagens à sua biblioteca",
      icon: Upload,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Adicione Seu Conteúdo</h2>
            <p className="text-muted-foreground">
              Comece enviando vídeos e imagens para sua biblioteca de mídia
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Como fazer upload:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Acesse a seção "Conteúdos"</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Conteúdos" na barra de navegação superior
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Clique em "Upload"</p>
                  <p className="text-sm text-muted-foreground">
                    Use o botão azul "Upload" no canto superior direito
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Selecione seus arquivos</p>
                  <p className="text-sm text-muted-foreground">
                    Arraste e solte ou clique para selecionar vídeos (MP4, AVI, MOV) ou imagens (JPEG, PNG, GIF)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <p className="font-medium">Aguarde o processamento</p>
                  <p className="text-sm text-muted-foreground">
                    O sistema irá processar e otimizar seus arquivos automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Dica:</h4>
            <p className="text-blue-800 text-sm">
              Para melhores resultados, use vídeos em resolução HD (1920x1080) e mantenha os arquivos 
              com tamanho máximo de 100MB para garantir carregamento rápido.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "2. Criar Playlists",
      description: "Organize seu conteúdo em listas de reprodução",
      icon: PlayCircle,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Crie Suas Playlists</h2>
            <p className="text-muted-foreground">
              Organize seu conteúdo em listas de reprodução personalizadas
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Como criar playlists:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Acesse "Playlists"</p>
                  <p className="text-sm text-muted-foreground">
                    Navegue até a seção "Playlists" no menu principal
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Clique em "Nova Playlist"</p>
                  <p className="text-sm text-muted-foreground">
                    Use o botão azul "Nova Playlist" para criar uma nova lista
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Defina o nome e status</p>
                  <p className="text-sm text-muted-foreground">
                    Dê um nome descritivo e defina se a playlist estará ativa
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <p className="font-medium">Adicione conteúdo</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Gerenciar Itens" e selecione até 5 vídeos/imagens da sua biblioteca
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">5</Badge>
                <div>
                  <p className="font-medium">Organize a ordem</p>
                  <p className="text-sm text-muted-foreground">
                    Use as setas para definir a ordem de reprodução dos conteúdos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Funcionalidades:</h4>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Até 5 itens por playlist</li>
              <li>• Ordem personalizada de reprodução</li>
              <li>• URL pública para cada playlist</li>
              <li>• Estatísticas em tempo real</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "3. Configurar Players",
      description: "Associe dispositivos ao seu sistema",
      icon: Monitor,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Configure Seus Players</h2>
            <p className="text-muted-foreground">
              Associe dispositivos físicos ao seu sistema de Digital Signage
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Como configurar players:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Acesse "Players"</p>
                  <p className="text-sm text-muted-foreground">
                    Vá até a seção "Players" na navegação principal
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Gere um código de integração</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Gerar Código" para criar um código único de associação
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Configure o dispositivo</p>
                  <p className="text-sm text-muted-foreground">
                    No seu player físico, insira o código gerado para associar ao sistema
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <p className="font-medium">Monitore o status</p>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe se o player está online, offline ou com problemas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">5</Badge>
                <div>
                  <p className="font-medium">Gerencie remotamente</p>
                  <p className="text-sm text-muted-foreground">
                    Ative/desative players, solicite logs e monitore performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Importante:</h4>
            <p className="text-yellow-800 text-sm">
              Certifique-se de que seu dispositivo player tenha conexão com a internet estável 
              para funcionamento adequado do sistema.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "4. Monitorar e Relatórios",
      description: "Acompanhe a performance do sistema",
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Monitore e Analise</h2>
            <p className="text-muted-foreground">
              Acompanhe métricas, relatórios e atividade dos seus players
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Dashboard Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Métricas em tempo real</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Status dos players</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Atividade recente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Gráficos de performance</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatórios Detalhados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Análise de uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Estatísticas de reprodução</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Logs de atividade</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Exportação de dados</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades de Monitoramento:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">📊</Badge>
                <div>
                  <p className="font-medium">Dashboard em Tempo Real</p>
                  <p className="text-sm text-muted-foreground">
                    Visualize métricas atualizadas instantaneamente sobre seus players e conteúdo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">📈</Badge>
                <div>
                  <p className="font-medium">Relatórios Históricos</p>
                  <p className="text-sm text-muted-foreground">
                    Acesse análises detalhadas de performance ao longo do tempo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="mt-1">🔍</Badge>
                <div>
                  <p className="font-medium">Logs e Auditoria</p>
                  <p className="text-sm text-muted-foreground">
                    Baixe logs detalhados para análise de problemas e otimização
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 6,
      title: "Parabéns! Você está pronto!",
      description: "Comece a usar o Exibeon Player agora",
      icon: CheckCircle,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Parabéns! 🎉</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Você completou o tutorial do Exibeon Player! Agora você tem todas as informações 
              necessárias para começar a usar o sistema.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximos passos sugeridos:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <ArrowRight className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Faça seu primeiro upload</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione alguns vídeos ou imagens à sua biblioteca
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ArrowRight className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Crie uma playlist</p>
                  <p className="text-sm text-muted-foreground">
                    Organize seu conteúdo em uma lista de reprodução
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ArrowRight className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Configure um player</p>
                  <p className="text-sm text-muted-foreground">
                    Gere um código e associe um dispositivo ao sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/conteudos">
                <Upload className="w-4 h-4 mr-2" />
                Começar com Upload
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-primary mb-2">💬 Precisa de ajuda?</h4>
            <p className="text-primary/80 text-sm">
              Consulte a seção "Documentações" no rodapé para informações técnicas detalhadas 
              ou entre em contato com nosso suporte.
            </p>
          </div>
        </div>
      )
    }
  ];

  const progress = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetTutorial = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    localStorage.removeItem('tutorial-step');
    localStorage.removeItem('tutorial-completed');
  };

  const skipTutorial = () => {
    localStorage.setItem('tutorial-completed', 'true');
    window.location.href = '/';
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tutorial - Primeiros Passos</h1>
            <p className="text-muted-foreground mt-2">
              Aprenda a usar o Exibeon Player em poucos minutos
            </p>
          </div>
          
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={resetTutorial}>
              Reiniciar Tutorial
            </Button>
            <Button variant="outline" size="sm" onClick={skipTutorial}>
              Pular Tutorial
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Passo {currentStep} de {steps.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step.id <= currentStep
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <currentStepData.icon className="w-5 h-5 text-primary" />
              </div>
              {currentStepData.title}
            </CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStepData.content}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Ir para Dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrimeirosPassos;
