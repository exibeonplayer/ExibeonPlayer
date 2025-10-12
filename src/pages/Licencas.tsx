import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useLicenseManagement } from '@/hooks/useLicenseManagement';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import SendNotificationDialog from '@/components/SendNotificationDialog';
import { Search, Lock, Unlock, Calendar as CalendarIcon, Users, Bell } from 'lucide-react';


const Licencas = () => {
  const { users, loading, updateLicenseEndDate, blockUnblockLicense, updateMaxPlayers } = useLicenseManagement();
  const { sendNotification, users: notificationUsers, sending, isMaster } = useSystemNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newEndDate, setNewEndDate] = useState<Date>();
  const [selectedUserForPlayers, setSelectedUserForPlayers] = useState<any>(null);
  const [newMaxPlayers, setNewMaxPlayers] = useState<number>(1);


  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBlockLicense = async (userId: string, block: boolean) => {
    try {
      await blockUnblockLicense(userId, block);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdateLicenseEnd = async () => {
    if (!selectedUser || !newEndDate) return;

    try {
      await updateLicenseEndDate(selectedUser.id, newEndDate);
      setSelectedUser(null);
      setNewEndDate(undefined);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdateMaxPlayers = async () => {
    if (!selectedUserForPlayers || !newMaxPlayers) return;

    try {
      await updateMaxPlayers(selectedUserForPlayers.id, newMaxPlayers);
      setSelectedUserForPlayers(null);
      setNewMaxPlayers(1);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-success', text: 'Ativa' },
      blocked: { color: 'bg-destructive', text: 'Bloqueada' },
      expired: { color: 'bg-warning', text: 'Expirada' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getLicenseStatus = (user: any) => {
    if (!user.license) {
      console.log(`📋 Usuário ${user.email} sem licença - retornando 'expired'`);
      return 'expired';
    }
    
    // Verificar se está expirado (3 dias após vencimento)
    if (user.license.end_date) {
      const now = new Date();
      const endDate = new Date(user.license.end_date);
      const gracePeriod = new Date(endDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 dias após vencimento
      
      console.log(`📅 Usuário ${user.email}:`, {
        endDate: endDate.toLocaleDateString('pt-BR'),
        gracePeriod: gracePeriod.toLocaleDateString('pt-BR'),
        now: now.toLocaleDateString('pt-BR'),
        status: user.license.status,
        isExpired: now > gracePeriod
      });
      
      // Se passou do período de graça, é expirada
      if (now > gracePeriod) {
        console.log(`⚠️ Usuário ${user.email} está expirado (passou do período de graça)`);
        // Se foi bloqueada automaticamente por expiração, mostrar como expirada
        if (user.license.status === 'suspended') {
          console.log(`🔒 Usuário ${user.email} foi bloqueado automaticamente - retornando 'expired'`);
          return 'expired';
        }
        // Se ainda está ativa mas expirou, também mostrar como expirada
        console.log(`⏰ Usuário ${user.email} expirou mas ainda está ativo - retornando 'expired'`);
        return 'expired';
      }
    }
    
    // Se status é explicitamente 'suspended' (bloqueio manual), considerar como bloqueado
    if (user.license.status === 'suspended') {
      console.log(`🔒 Usuário ${user.email} bloqueado manualmente - retornando 'blocked'`);
      return 'blocked';
    }
    
    console.log(`✅ Usuário ${user.email} ativo - retornando 'active'`);
    return 'active';
  };

  const getLicenseEndDate = (user: any) => {
    if (!user.license || !user.license.end_date) return 'Não definida';
    return new Date(user.license.end_date).toLocaleDateString('pt-BR');
  };

  const getLicenseStartDate = (user: any) => {
    if (!user.license) return new Date(user.created_at).toLocaleDateString('pt-BR');
    return new Date(user.license.start_date).toLocaleDateString('pt-BR');
  };

  const getMaxPlayers = (user: any) => {
    if (!user.license || !user.license.max_players) return 'Não definido';
    return user.license.max_players;
  };

  if (loading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Licenças</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie licenças de usuários (Acesso exclusivo para Master)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isMaster && (
            <Button
              onClick={() => setShowNotificationDialog(true)}
              className="whitespace-nowrap"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enviar Notificação
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {users.filter(u => getLicenseStatus(u) === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Licenças Bloqueadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {users.filter(u => getLicenseStatus(u) === 'blocked').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Licenças Expiradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {users.filter(u => getLicenseStatus(u) === 'expired').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Início da Licença</TableHead>
                <TableHead>Término da Licença</TableHead>
                <TableHead>Max Players</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="sm:w-[250px] w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium break-words">
                      {user.full_name || 'Nome não informado'}
                    </TableCell>
                    <TableCell className="break-words">{user.email}</TableCell>
                  <TableCell>
                    {getLicenseStartDate(user)}
                  </TableCell>
                  <TableCell>
                    {getLicenseEndDate(user)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{getMaxPlayers(user)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(getLicenseStatus(user))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewEndDate(user.license?.end_date ? new Date(user.license.end_date) : new Date());
                            }}
                          >
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Data
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Data de Término</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Usuário: {user.full_name || user.email}</Label>
                            </div>
                            <div>
                              <Label>Nova data de término:</Label>
                              <Calendar
                                mode="single"
                                selected={newEndDate}
                                onSelect={setNewEndDate}
                                className="rounded-md border"
                              />
                            </div>
                            <Button onClick={handleUpdateLicenseEnd} className="w-full">
                              Atualizar Data
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedUserForPlayers(user);
                              setNewMaxPlayers(user.license?.max_players || 1);
                            }}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Players
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Quantidade de Players</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Usuário: {user.full_name || user.email}</Label>
                            </div>
                            <div>
                              <Label>Quantidade máxima de players:</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={newMaxPlayers}
                                onChange={(e) => setNewMaxPlayers(parseInt(e.target.value) || 1)}
                                placeholder="Digite a quantidade"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Quantidade atual: {user.license?.max_players || 'Não definido'}
                              </p>
                            </div>
                            <Button onClick={handleUpdateMaxPlayers} className="w-full">
                              Atualizar Players
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {getLicenseStatus(user) === 'blocked' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBlockLicense(user.id, false)}
                        >
                          <Unlock className="w-4 h-4 mr-1" />
                          Desbloquear
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBlockLicense(user.id, true)}
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          Bloquear
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </div>
      </div>

      {/* Dialog para envio de notificações */}
      <SendNotificationDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        onSend={sendNotification}
        users={notificationUsers}
        sending={sending}
      />
    </Layout>
  );
};

export default Licencas;