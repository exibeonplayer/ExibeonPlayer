import { supabase } from '@/integrations/supabase/client';

export const checkExpiredLicenses = async () => {
  try {
    const now = new Date().toISOString();
    
    // Buscar licenças que expiraram
    const { data: expiredLicenses, error } = await supabase
      .from('licenses')
      .select('*')
      .lt('end_date', now)
      .neq('status', 'expired');

    if (error) {
      console.error('Error checking expired licenses:', error);
      return;
    }

    // Atualizar status das licenças expiradas
    if (expiredLicenses && expiredLicenses.length > 0) {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredLicenses.map(l => l.id));

      if (updateError) {
        console.error('Error updating expired licenses:', updateError);
        return;
      }

      // Registrar ações de auditoria
      const auditActions = expiredLicenses.map(license => ({
        license_id: license.id,
        action_type: 'auto_expire',
        new_status: 'expired',
        reason: 'Licença expirou automaticamente'
      }));

      await supabase
        .from('license_actions')
        .insert(auditActions);

      // Buscar players dos usuários com licenças expiradas
      const userIds = expiredLicenses.map(l => l.user_id);
      const { data: players } = await supabase
        .from('players')
        .select('id, user_id')
        .in('user_id', userIds);

      if (players && players.length > 0) {
        const playerCommands = players.map(player => ({
          player_id: player.id,
          command: 'block',
          payload: { reason: 'license_expired' },
          status: 'pending'
        }));

        await supabase
          .from('player_commands')
          .insert(playerCommands);
      }

      console.log(`${expiredLicenses.length} licenças expiradas automaticamente`);
    }
  } catch (error) {
    console.error('Error in checkExpiredLicenses:', error);
  }
};

export const formatLicenseEndDate = (endDate: string | null): string => {
  if (!endDate) return 'Não definida';
  
  const date = new Date(endDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Expirou há ${Math.abs(diffDays)} dias`;
  } else if (diffDays === 0) {
    return 'Expira hoje';
  } else if (diffDays <= 7) {
    return `Expira em ${diffDays} dias`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
};

export const getLicenseStatusColor = (status: string, endDate: string | null): string => {
  if (status === 'suspended') return 'text-destructive';
  if (status === 'expired') return 'text-warning';
  
  if (endDate) {
    const date = new Date(endDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'text-warning';
  }
  
  return 'text-success';
};