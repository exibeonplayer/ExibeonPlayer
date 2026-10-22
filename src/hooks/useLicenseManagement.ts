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

  const checkAndBlockExpiredLicenses = async () => {
    try {
      console.log('🔍 Verificando licenças expiradas para bloqueio automático...');

      // Buscar licenças ativas que estão expiradas há mais de 3 dias
      const { data: expiredLicenses, error: expiredError } = await supabase
        .from('licenses')
        .select('*')
        .eq('status', 'active')
        .not('end_date', 'is', null);

      if (expiredError) {
        console.error('Erro ao buscar licenças expiradas:', expiredError);
        return;
      }

      const now = new Date();
      const expiredToBlock = expiredLicenses?.filter(license => {
        if (!license.end_date) return false;
        const endDate = new Date(license.end_date);
        const gracePeriod = new Date(endDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 dias
        return now > gracePeriod;
      }) || [];

      console.log(`📋 Encontradas ${expiredToBlock.length} licenças para bloqueio automático`);

      // Bloquear licenças expiradas
      for (const license of expiredToBlock) {
        console.log(`🔒 Bloqueando automaticamente licença expirada: ${license.user_id}`);

        await supabase
          .from('licenses')
          .update({
            status: 'suspended',
            updated_at: new Date().toISOString()
          })
          .eq('id', license.id);

        // Enviar comando para players
        const { data: playerData } = await supabase
          .from('players')
          .select('id, name')
          .eq('user_id', license.user_id);

        if (playerData && playerData.length > 0) {
          console.log(`📡 Enviando comandos de bloqueio automático para ${playerData.length} players`);

          // Enviar comando para cada player usando Edge Function
          for (const player of playerData) {
            try {
              const { error: functionError } = await supabase.functions.invoke('send-player-command', {
                body: {
                  player_id: player.id,
                  command: 'block',
                  payload: {
                    reason: 'license_expired',
                    player_name: player.name
                  }
                }
              });

              if (functionError) {
                console.error(`❌ Erro ao enviar comando automático para player ${player.name}:`, functionError);
              } else {
                console.log(`✅ Comando automático enviado para player ${player.name}`);
              }
            } catch (error) {
              console.error(`❌ Erro ao chamar Edge Function para player ${player.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar licenças expiradas:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);

      // Primeiro verificar e bloquear licenças expiradas
      // A validade é verificada no servidor a cada contato do dispositivo.

      // Buscar todos os usuários com seus perfis
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*');

      if (usersError) throw usersError;

      // Buscar licenças separadamente
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('*');

      if (licensesError) {
        console.error('Error fetching licenses:', licensesError);
      }

      // Combinar dados
      const usersWithLicenses: UserWithLicense[] = (usersData || []).map((userProfile: any) => {
        const license = licensesData?.find((l: any) => l.user_id === userProfile.id);

        return {
          id: userProfile.id,
          full_name: userProfile.name,
          company_name: userProfile.company_name,
          phone: userProfile.phone,
          is_active: userProfile.is_active,
          is_master: userProfile.is_master,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
          email: userProfile.email,
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
          .insert([{
            user_id: userId,
            start_date: new Date().toISOString(),
            end_date: newEndDate.toISOString(),
            status: 'active',
            max_players: 1
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Registrar ação de auditoria
      await supabase
        .from('license_actions')
        .insert([{
          license_id: result.id,
          action_type: 'date_update',
          performed_by: user?.id,
          details: {
            reason: `Data de término alterada para ${newEndDate.toLocaleDateString('pt-BR')}`
          }
        }]);

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
      console.log(`🔄 Iniciando ${block ? 'bloqueio' : 'desbloqueio'} da licença para usuário:`, userId);
      const newStatus = block ? 'suspended' : 'active'; // Usar apenas valores válidos do enum

      // Verificar se existe licença
      const { data: existingLicense, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar licença:', fetchError);
        throw fetchError;
      }

      console.log('📋 Licença existente encontrada:', existingLicense);
      let licenseId;
      if (existingLicense) {
        // Atualizar licença existente
        console.log(`📝 Atualizando licença existente para status: ${newStatus}`);
        const { data, error } = await supabase
          .from('licenses')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLicense.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao atualizar licença:', error);
          throw error;
        }
        console.log('✅ Licença atualizada com sucesso:', data);
        licenseId = data.id;
      } else {
        // Criar nova licença com status bloqueado
        const { data, error } = await supabase
          .from('licenses')
          .insert([{
            user_id: userId,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias padrão
            status: newStatus,
            max_players: 1
          }])
          .select()
          .single();

        if (error) throw error;
        licenseId = data.id;
      }

      // Registrar ação de auditoria
      await supabase
        .from('license_actions')
        .insert([{
          license_id: licenseId,
          action_type: block ? 'block' : 'unblock',
          performed_by: user?.id,
          details: {
            reason: `Licença ${block ? 'bloqueada' : 'desbloqueada'} pelo administrador`
          }
        }]);

      // Buscar todos os players do usuário para enviar comandos
      const { data: playerData } = await supabase
        .from('players')
        .select('id, name')
        .eq('user_id', userId);

      if (playerData && playerData.length > 0) {
        console.log(`📡 Enviando comandos para ${playerData.length} players`);

        // Enviar comando para cada player usando Edge Function
        for (const player of playerData) {
          try {
            const { error: functionError } = await supabase.functions.invoke('send-player-command', {
              body: {
                player_id: player.id,
                command: block ? 'block' : 'unblock',
                payload: {
                  reason: block ? 'license_blocked' : 'license_unblocked',
                  player_name: player.name
                }
              }
            });

            if (functionError) {
              console.error(`❌ Erro ao enviar comando para player ${player.name}:`, functionError);
            } else {
              console.log(`✅ Comando enviado com sucesso para player ${player.name}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao chamar Edge Function para player ${player.name}:`, error);
          }
        }
      }

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

  const updateMaxPlayers = async (userId: string, newMaxPlayers: number) => {
    try {
      // Verificar se existe licença
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
            max_players: newMaxPlayers,
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
          .insert([{
            user_id: userId,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias padrão
            status: 'active',
            max_players: newMaxPlayers
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Registrar ação de auditoria
      await supabase
        .from('license_actions')
        .insert([{
          license_id: result.id,
          action_type: 'max_players_update',
          performed_by: user?.id,
          details: {
            reason: `Quantidade máxima de players alterada para ${newMaxPlayers}`
          }
        }]);

      await fetchAllUsers(); // Recarregar dados

      toast({
        title: "Sucesso",
        description: `Quantidade máxima de players atualizada para ${newMaxPlayers}`,
      });

    } catch (error) {
      console.error('Error updating max players:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar quantidade de players",
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
    updateMaxPlayers,
    refetch: fetchAllUsers
  };
};