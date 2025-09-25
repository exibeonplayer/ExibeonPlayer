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
import { Search, Lock, Unlock, Calendar as CalendarIcon } from 'lucide-react';


const Licencas = () => {
  const { users, loading, updateLicenseEndDate, blockUnblockLicense } = useLicenseManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newEndDate, setNewEndDate] = useState<Date>();


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
    if (!user.license) return 'expired';
    const now = new Date();
    const endDate = new Date(user.license.end_date || '');
    
    if (user.license.status === 'blocked') return 'blocked';
    if (endDate < now) return 'expired';
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Início da Licença</TableHead>
                <TableHead>Término da Licença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'Nome não informado'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getLicenseStartDate(user)}
                  </TableCell>
                  <TableCell>
                    {getLicenseEndDate(user)}
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
                            Editar
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
    </Layout>
  );
};

export default Licencas;