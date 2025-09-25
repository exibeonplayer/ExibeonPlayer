import Layout from '@/components/Layout';
import MetricCard from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Monitor, PlayCircle, Activity } from 'lucide-react';

const Relatorios = () => {
  // Mock data for the chart
  const chartData = [
    { month: 'Jan', players: 12 },
    { month: 'Fev', players: 19 },
    { month: 'Mar', players: 23 },
    { month: 'Abr', players: 27 },
    { month: 'Mai', players: 31 },
    { month: 'Jun', players: 28 },
    { month: 'Jul', players: 35 },
    { month: 'Ago', players: 38 },
    { month: 'Set', players: 42 },
    { month: 'Out', players: 45 },
    { month: 'Nov', players: 48 },
    { month: 'Dez', players: 52 },
  ];

  // Mock statistics
  const stats = {
    totalPlayers: 52,
    activePlayers: 48,
    totalPlaylists: 24,
    totalContent: 156,
    averageUptime: '98.5%',
    totalUsers: 12
  };

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
            value={stats.totalPlayers.toString()}
            trend={{ value: '+12%', isPositive: true }}
            icon={Monitor}
          />
          <MetricCard
            title="Players Ativos"
            value={stats.activePlayers.toString()}
            trend={{ value: '+8%', isPositive: true }}
            icon={Activity}
          />
          <MetricCard
            title="Total de Playlists"
            value={stats.totalPlaylists.toString()}
            trend={{ value: '+15%', isPositive: true }}
            icon={PlayCircle}
          />
          <MetricCard
            title="Total de Usuários"
            value={stats.totalUsers.toString()}
            trend={{ value: '+5%', isPositive: true }}
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
            </div>
          </CardContent>
        </Card>

        {/* Cards de Métricas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uptime Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {stats.averageUptime}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conteúdo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalContent}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Vídeos e imagens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                97.2%
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Downloads bem-sucedidos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Relatorios;