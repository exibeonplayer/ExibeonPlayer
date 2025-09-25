import { Monitor, Download, Key, TrendingUp } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import Layout from '@/components/Layout';
import MetricCard from '@/components/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dados mock para o gráfico
const chartData = [
  { day: 'Seg', downloads: 45 },
  { day: 'Ter', downloads: 52 },
  { day: 'Qua', downloads: 38 },
  { day: 'Qui', downloads: 61 },
  { day: 'Sex', downloads: 78 },
  { day: 'Sáb', downloads: 23 },
  { day: 'Dom', downloads: 31 },
];

const Dashboard = () => {
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
            value={24}
            icon={Monitor}
            trend={{ value: '+12%', isPositive: true }}
            description="Dispositivos ativos"
          />
          <MetricCard
            title="Total Downloads"
            value="1,247"
            icon={Download}
            trend={{ value: '+8%', isPositive: true }}
            description="Últimos 30 dias"
          />
          <MetricCard
            title="Licenças Ativas"
            value={18}
            icon={Key}
            description="De 25 disponíveis"
          />
          <MetricCard
            title="Taxa de Sucesso"
            value="98.5%"
            icon={TrendingUp}
            trend={{ value: '+2.1%', isPositive: true }}
            description="Downloads bem-sucedidos"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Downloads dos Últimos 7 Dias</CardTitle>
              <CardDescription>
                Acompanhe a atividade de download dos seus players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                {[
                  { time: '10:30', action: 'Player P001 conectado', status: 'success' },
                  { time: '10:25', action: 'Download de playlist concluído', status: 'success' },
                  { time: '10:20', action: 'Player P003 desconectado', status: 'warning' },
                  { time: '10:15', action: 'Nova licença ativada', status: 'info' },
                  { time: '10:10', action: 'Backup automático realizado', status: 'success' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 py-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-success' :
                        activity.status === 'warning' ? 'bg-warning' :
                        activity.status === 'info' ? 'bg-info' : 'bg-muted'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;