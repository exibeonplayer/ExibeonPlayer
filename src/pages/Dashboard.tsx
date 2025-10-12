import { Monitor, Download, Key, TrendingUp } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import Layout from '@/components/Layout';
import MetricCard from '@/components/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayers } from '@/hooks/usePlayers';
import { useVideos } from '@/hooks/useVideos';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { players, loading: playersLoading } = usePlayers();
  const { videos, loading: videosLoading } = useVideos();
  const { playlists, loading: playlistsLoading } = usePlaylists();
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calcular métricas baseadas nos dados reais
  const onlinePlayers = players.filter(player => {
    // Usar diretamente a coluna is_online da tabela players
    return player.is_online || false;
  }).length;
  const totalPlayers = players.length;
  const totalVideos = videos.length;
  const totalPlaylists = playlists.length;

  // Buscar dados de analytics e atividade recente
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Buscar analytics dos últimos 7 dias
        const { data: analytics, error: analyticsError } = await supabase
          .from('analytics_daily')
          .select(`
            *,
            players!inner(user_id)
          `)
          .eq('players.user_id', user.id)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (!analyticsError && analytics) {
          console.log('📊 Analytics encontrados:', analytics);
          // Processar dados para o gráfico
          const chartData = analytics.map(item => ({
            day: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
            downloads: item.content_played_count || 0
          }));
          setAnalyticsData(chartData);
        } else {
          console.log('❌ Erro ao buscar analytics:', analyticsError);
          console.log('📊 Analytics retornados:', analytics);
        }

        // Buscar atividade recente (logs dos players do usuário)
        const { data: logs, error: logsError } = await supabase
          .from('player_logs')
          .select(`
            *,
            players!inner(user_id)
          `)
          .eq('players.user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!logsError && logs) {
          console.log('📋 Logs encontrados:', logs);
          setRecentActivity(logs);
        } else {
          console.log('❌ Erro ao buscar logs:', logsError);
          console.log('📋 Logs retornados:', logs);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, players]);

  if (playersLoading || videosLoading || playlistsLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel de Controle</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe as métricas principais do seu sistema de Digital Signage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Players Online"
            value={onlinePlayers.toString()}
            icon={Monitor}
            description={`${totalPlayers} dispositivos total`}
          />
          <MetricCard
            title="Total de Vídeos"
            value={totalVideos.toString()}
            icon={Download}
            description="Arquivos de mídia"
          />
          <MetricCard
            title="Playlists"
            value={totalPlaylists.toString()}
            icon={Key}
            description="Listas de reprodução"
          />
          <MetricCard
            title="Taxa de Conectividade"
            value={totalPlayers > 0 ? `${Math.round((onlinePlayers / totalPlayers) * 100)}%` : '0%'}
            icon={TrendingUp}
            description="Players conectados"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
              <CardDescription>
                Acompanhe a atividade de reprodução dos seus players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="downloads" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado de analytics disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log: any, index) => (
                    <div key={index} className="flex items-center space-x-3 py-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          log.log_type === 'info' ? 'bg-success' :
                          log.log_type === 'warning' ? 'bg-warning' :
                          log.log_type === 'error' ? 'bg-destructive' : 'bg-muted'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{log.message || 'Ação do sistema'}</p>
                        <p className="text-xs text-muted-foreground">
                          Player: {log.player_id?.slice(0, 8)}...
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma atividade recente encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;