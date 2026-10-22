import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  is_active?: boolean;
  is_master?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserLicense {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'expired' | 'blocked' | 'suspended';
  max_players: number;
  created_at: string;
  updated_at: string;
}

export interface UserWithLicense extends UserProfile {
  email: string;
  license?: UserLicense;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Se não encontrou perfil, criar um básico
      if (!profileData || profileData.length === 0) {
        console.log('No profile found, creating basic profile for user:', user.id);

        // Criar perfil básico
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        setProfile(newProfile);
      } else {
        setProfile(profileData[0]);
      }

      // Buscar licença do usuário
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id);

      if (licenseError) {
        console.warn('Error fetching license:', licenseError);
        // Não definir userLicense se houver erro
      } else if (licenseData && licenseData.length > 0) {
        setUserLicense(licenseData[0]);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user?.id]); // Só re-executa quando o ID do usuário muda

  return {
    profile,
    userLicense,
    loading,
    refetch: fetchProfile
  };
};