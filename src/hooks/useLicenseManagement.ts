import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserWithLicense } from './useUserProfile';

export const useLicenseManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os usuários com seus perfis
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          licenses (*)
        `);

      if (usersError) throw usersError;

      // Buscar emails dos usuários do auth
      const userIds = (usersData || []).map(u => u.id);
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      // Combinar dados
      const usersWithLicenses: UserWithLicense[] = (usersData || []).map((userProfile: any) => {
        const authUser = authUsers?.users?.find((au: any) => au.id === userProfile.id);
        const license = userProfile.licenses?.[0]; // Assuming one license per user for now

        return {
          id: userProfile.id,
          full_name: userProfile.full_name,
          company_name: userProfile.company_name,
          phone: userProfile.phone,
          is_active: userProfile.is_active,
          is_master: userProfile.is_master,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
          email: authUser?.email || 'Email não encontrado',
          license: license || undefined
        };
      });

      setUsers(usersWithLicenses);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLicenseEndDate = async (userId: string, newEndDate: Date) => {
    try {
      // Primeiro verificar se já existe uma licença
      const { data: existingLicense, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let result;
      if (existingLicense) {
        // Atualizar licença existente
        const { data, error } = await supabase
          .from('licenses')
          .update({ 
            end_date: newEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLicense.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Criar nova licença
        const { data, error } = await supabase
          .from('licenses')
          .insert({
            user_id: userId,
            start_date: new Date().toISOString(),
            end_date: newEndDate.toISOString(),
            status: 'active',
            license_type: 'standard'
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Registrar ação de auditoria
      await supabase
        .from('license_actions')
        .insert({
          license_id: result.id,
          action_type: 'date_update',
          performed_by: user?.id,
          new_status: result.status,
          reason: `Data de término alterada para ${newEndDate.toLocaleDateString('pt-BR')}`
        });

      await fetchAllUsers(); // Recarregar dados

      toast({
        title: "Sucesso",
        description: "Data de término da licença atualizada",
      });

    } catch (error) {
      console.error('Error updating license end date:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar data da licença",
        variant: "destructive",
      });
      throw error;
    }
  };

  const blockUnblockLicense = async (userId: string, block: boolean) => {
    try {
      const newStatus = block ? 'blocked' : 'active';
      
      // Verificar se existe licença
      const { data: existingLicense, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let licenseId;
      if (existingLicense) {
        // Atualizar licença existente
        const { data, error } = await supabase
          .from('licenses')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLicense.id)
          .select()
          .single();
        
        if (error) throw error;
        licenseId = data.id;
      } else {
        // Criar nova licença com status bloqueado
        const { data, error } = await supabase
          .from('licenses')
          .insert({
            user_id: userId,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias padrão
            status: newStatus,
            license_type: 'standard'
          })
          .select()
          .single();
        
        if (error) throw error;
        licenseId = data.id;
      }

      // Registrar ação de auditoria
      await supabase
        .from('license_actions')
        .insert({
          license_id: licenseId,
          action_type: block ? 'block' : 'unblock',
          performed_by: user?.id,
          new_status: newStatus,
          reason: `Licença ${block ? 'bloqueada' : 'desbloqueada'} pelo administrador`
        });

      // Enviar comando para os players
      await supabase
        .from('player_commands')
        .insert({
          player_id: 'ALL', // Comando para todos os players
          command_type: block ? 'block_license' : 'unblock_license',
          payload: { user_id: userId },
          created_by: user?.id,
          status: 'pending'
        });

      await fetchAllUsers(); // Recarregar dados

      toast({
        title: "Sucesso",
        description: `Licença ${block ? 'bloqueada' : 'desbloqueada'} com sucesso`,
      });

    } catch (error) {
      console.error('Error updating license status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da licença",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return {
    users,
    loading,
    updateLicenseEndDate,
    blockUnblockLicense,
    refetch: fetchAllUsers
  };
};