import Layout from '@/components/Layout';
import MetricCard from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Monitor, PlayCircle, Activity } from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';
import { useVideos } from '@/hooks/useVideos';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Relatorios = () => {
  const { players, loading: playersLoading } = usePlayers();
  const { videos, loading: videosLoading } = useVideos();
  const { playlists, loading: playlistsLoading } = usePlaylists();
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calcular estatísticas reais
  const activePlayers = players.filter(player => {
    // Usar diretamente a coluna is_online da tabela players
    return player.is_online || false;
  }).length;
  const totalPlayers = players.length;
  const totalPlaylists = playlists.length;
  const totalContent = videos.length;

  // Buscar dados para o gráfico (últimos 12 meses)
  useEffect(() => {
    const fetchChartData = async () => {
      if (!user) return;

      try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        // Buscar analytics dos últimos 12 meses
        const { data: analytics, error } = await supabase
          .from('analytics_daily')
          .select(`
            *,
            players!inner(user_id)
          `)
          .eq('players.user_id', user.id)
          .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (!error && analytics) {
          console.log('📊 Analytics para relatórios encontrados:', analytics);
          // Agrupar por mês e contar players únicos
          const monthlyData = {};
          analytics.forEach(item => {
            const month = new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' });
            if (!monthlyData[month]) {
              monthlyData[month] = new Set();
            }
            monthlyData[month].add(item.player_id);
          });

          // Converter para formato do gráfico
          const chartDataArray = Object.entries(monthlyData).map(([month, playerSet]) => ({
            month,
            players: playerSet.size
          }));

          console.log('📈 Dados do gráfico processados:', chartDataArray);
          setChartData(chartDataArray);
        } else {
          console.log('❌ Erro ao buscar analytics para relatórios:', error);
          console.log('📊 Analytics retornados:', analytics);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user]);

  // Calcular uptime médio
  const calculateAverageUptime = () => {
    if (players.length === 0) return '0%';
    
    const totalUptime = players.reduce((sum, player) => {
      return sum + (player.uptime_seconds || 0);
    }, 0);
    
    const totalSeconds = players.length * 86400; // 24 horas em segundos
    const uptimePercentage = (totalUptime / totalSeconds) * 100;
    
    return `${uptimePercentage.toFixed(1)}%`;
  };

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
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Visualize estatísticas e métricas do sistema
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Players"
            value={totalPlayers.toString()}
            icon={Monitor}
          />
          <MetricCard
            title="Players Ativos"
            value={activePlayers.toString()}
            icon={Activity}
          />
          <MetricCard
            title="Total de Playlists"
            value={totalPlaylists.toString()}
            icon={PlayCircle}
          />
          <MetricCard
            title="Total de Conteúdos"
            value={totalContent.toString()}
            icon={Users}
          />
        </div>

        {/* Gráfico Players Ativos por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Players Ativos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-muted-foreground"
                    />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="players" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
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

      </div>
    </Layout>
  );
};

export default Relatorios;