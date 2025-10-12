import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PlayerCode {
  id: string;
  code: string;
  user_id: string;
  player_id?: string;
  is_active: boolean;
  is_used?: boolean;
  expires_at?: string;
  created_at: string;
  used_at?: string;
  notes?: string;
}

export const usePlayerCodesStatic = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<PlayerCode[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCodes = useCallback(async () => {
    if (!user) {
      console.log('⚠️ usePlayerCodesStatic: Sem usuário');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando códigos para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('player_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar códigos:', error);
        throw error;
      }
      
      console.log('✅ Códigos encontrados:', data?.length || 0, data);
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching player codes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar códigos de integração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const generateCode = useCallback(async (notes?: string, validityDays: number = 30) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCode = 'EXB' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      const { data, error } = await supabase
        .from('player_codes')
        .insert([{
          code: newCode,
          user_id: user.id,
          expires_at: expiresAt.toISOString(),
          notes: notes
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar lista local
      setCodes(prev => [data, ...prev]);
      
      toast({
        title: "Sucesso",
        description: `Novo código gerado: ${newCode}`,
      });
      
      return data;
    } catch (error) {
      console.error('Error generating player code:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar código de integração",
        variant: "destructive",
      });
      throw error;
    }
  }, [user?.id, toast]);

  const deactivateCode = useCallback(async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('player_codes')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', codeId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setCodes(prev => prev.map(c => c.id === codeId ? { ...c, is_active: false } : c));
      
      toast({
        title: "Sucesso",
        description: "Código desativado",
      });
    } catch (error) {
      console.error('Error deactivating code:', error);
      toast({
        title: "Erro",
        description: "Erro ao desativar código",
        variant: "destructive",
      });
      throw error;
    }
  }, [user?.id, toast]);

  const deleteCode = useCallback(async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('player_codes')
        .delete()
        .eq('id', codeId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setCodes(prev => prev.filter(c => c.id !== codeId));
      
      toast({
        title: "Sucesso",
        description: "Código removido",
      });
    } catch (error) {
      console.error('Error deleting code:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover código",
        variant: "destructive",
      });
      throw error;
    }
  }, [user?.id, toast]);

  // Buscar códigos quando o componente é montado
  useEffect(() => {
    if (user) {
      fetchCodes();
    }
  }, [user?.id]);

  return {
    codes,
    loading,
    generateCode,
    deactivateCode,
    deleteCode,
    refetch: fetchCodes,
  };
};
