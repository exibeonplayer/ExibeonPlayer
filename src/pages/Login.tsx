import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import loginBackground from '@/assets/login-background.jpg';

const Login = () => {
  const { user, login, signup, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signup(email, password);
    setIsLoading(false);
  };

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      {/* Overlay escuro translúcido */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      
      {/* Layout responsivo */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        
  {/* Conteúdo da esquerda - Informações do sistema (escondido em telas pequenas) */}
  <div className="hidden lg:flex flex-1 flex-col justify-center px-8 lg:px-16 py-12 lg:py-0">
          <div className="max-w-xl animate-fade-in">
            {/* Logo e título */}
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold">Exibeon Player</h1>
                <p className="text-white/80 text-lg">Sistema de Gestão de Painéis Digitais</p>
              </div>
            </div>
            
            {/* Descrição e benefícios */}
            <div className="mb-8">
              <h2 className="text-white text-2xl font-semibold mb-6">Gerencie sua rede de exibição com eficiência</h2>
              <ul className="space-y-4 text-white/90">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                  Controle completo de conteúdo multimídia
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                  Gestão de playlists automatizada
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                  Monitoramento em tempo real
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                  Relatórios detalhados e exportáveis
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bloco de login - lado direito */}
        <div className="flex items-center justify-center px-4 py-8 w-full lg:w-[480px] lg:px-16">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl animate-slide-in mx-2">
              <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-black mb-2">
                Acesso ao Sistema
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Entre com suas credenciais para acessar o gerenciador de painéis digitais
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Registrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Campo Email */}
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    
                    {/* Campo Senha */}
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 h-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-0">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Campo Email */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    
                    {/* Campo Senha */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 h-11"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              {/* ...bloco de credenciais de demonstração removido... */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;