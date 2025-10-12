import { useState } from 'react';
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatLicenseEndDate, getLicenseStatusColor } from '@/utils/licenseUtils';

const Profile = () => {
  const { user } = useAuth();
  const { profile, userLicense, loading, refetch } = useUserProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    company_name: profile?.company_name || '',
    phone: profile?.phone || '',
  });

  const handleEdit = () => {
    setFormData({
      name: profile?.name || '',
      company_name: profile?.company_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          company_name: formData.company_name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refetch();
      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      company_name: profile?.company_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
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
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas informações pessoais e configurações
            </p>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar Perfil
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Pessoais */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize suas informações de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        {profile?.name || 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user?.email || 'Não informado'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    {isEditing ? (
                      <Input
                        id="company"
                        value={formData.company_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="Nome da empresa"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        {profile?.company_name || 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50">
                        {profile?.phone || 'Não informado'}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informações da Conta */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Status da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo de Usuário</span>
                  <Badge variant={profile?.is_master ? "default" : "secondary"}>
                    {profile?.is_master ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Master
                      </>
                    ) : (
                      'Usuário'
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data de Cadastro</span>
                  <span className="text-sm font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última Atualização</span>
                  <span className="text-sm font-medium">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Licença */}
            {userLicense && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Informações da Licença
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge 
                      className={
                        userLicense.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : userLicense.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {userLicense.status === 'active' ? 'Ativa' : 
                       userLicense.status === 'expired' ? 'Expirada' : 
                       userLicense.status === 'suspended' ? 'Suspensa' : userLicense.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data de Início</span>
                    <span className="text-sm font-medium">
                      {new Date(userLicense.start_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data de Término</span>
                    <span className={`text-sm font-medium ${getLicenseStatusColor(userLicense.status, userLicense.end_date)}`}>
                      {new Date(userLicense.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Players Máximos</span>
                    <span className="text-sm font-medium">
                      {userLicense.max_players}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
