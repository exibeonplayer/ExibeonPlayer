import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlayerLimitInfo {
  maxPlayers: number;
  currentPlayers: number;
  availablePlayers: number;
  isUnlimited: boolean;
}

export const usePlayerLimit = () => {
  const { user } = useAuth();
  const [playerLimit, setPlayerLimit] = useState<PlayerLimitInfo>({
    maxPlayers: 1,
    currentPlayers: 0,
    availablePlayers: 1,
    isUnlimited: false
  });
  const [loading, setLoading] = useState(true);

  const fetchPlayerLimit = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar licença do usuário
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .select('max_players')
        .eq('user_id', user.id)
        .single();

      // Buscar quantidade de players atuais do usuário
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id);

      if (licenseError && licenseError.code !== 'PGRST116') {
        console.warn('Error fetching license:', licenseError);
      }

      if (playersError) {
        console.warn('Error fetching players:', playersError);
      }

      const maxPlayers = licenseData?.max_players || 1;
      const currentPlayers = playersData?.length || 0;
      const availablePlayers = Math.max(0, maxPlayers - currentPlayers);
      const isUnlimited = maxPlayers >= 999; // Considerar ilimitado se >= 999

      setPlayerLimit({
        maxPlayers,
        currentPlayers,
        availablePlayers,
        isUnlimited
      });

      console.log(`🎯 Player Limit - Máximo: ${maxPlayers}, Atuais: ${currentPlayers}, Disponíveis: ${availablePlayers}`);

    } catch (error) {
      console.error('Error fetching player limit:', error);
      // Em caso de erro, usar valores padrão
      setPlayerLimit({
        maxPlayers: 1,
        currentPlayers: 0,
        availablePlayers: 1,
        isUnlimited: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlayerLimit();
    }
  }, [user?.id]);

  return {
    playerLimit,
    loading,
    refetch: fetchPlayerLimit
  };
};
