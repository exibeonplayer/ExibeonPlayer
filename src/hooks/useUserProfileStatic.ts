import { useState, useEffect, useCallback } from 'react';
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

export const useUserProfileStatic = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData && profileData.length > 0) {
        setProfile(profileData[0]);
      } else {
        // Se não existe perfil, criar um básico
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
            is_active: true,
            is_master: false
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile);
        }
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
  }, [user?.id, toast]);

  // Só buscar quando solicitado explicitamente
  // Não há useEffect automático aqui

  return {
    profile,
    userLicense,
    loading,
    refetch: fetchProfile
  };
};
