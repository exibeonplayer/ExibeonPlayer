import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PlayerCode {
  id: string;
  code: string;
  user_id: string;
  player_id?: string;
  is_active: boolean;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  used_at?: string;
  notes?: string;
}

export const usePlayerCodes = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<PlayerCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCodes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('player_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
  };

  const generateCode = async (notes?: string, validityDays: number = 30) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Gerar código único
      const { data: codeData, error: codeError } = await supabase.rpc('generate_player_code');
      
      if (codeError) throw codeError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      // Inserir código no banco
      const { data, error } = await supabase
        .from('player_codes')
        .insert([{
          code: codeData,
          user_id: user.id,
          notes,
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setCodes(prev => [data, ...prev]);
      
      toast({
        title: "Código Gerado",
        description: `Código ${data.code} criado com sucesso`,
      });

      return data;
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar código de integração",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('player_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      setCodes(prev => prev.map(code =>
        code.id === codeId ? { ...code, is_active: false } : code
      ));

      toast({
        title: "Código Desativado",
        description: "Código de integração desativado com sucesso",
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
  };

  const deleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('player_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      setCodes(prev => prev.filter(code => code.id !== codeId));

      toast({
        title: "Código Removido",
        description: "Código de integração removido com sucesso",
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
  };

  useEffect(() => {
    if (user) {
      fetchCodes();
    }
  }, [user?.id]); // Só re-executa quando o ID do usuário muda

  return {
    codes,
    loading,
    generateCode,
    deactivateCode,
    deleteCode,
    refetch: fetchCodes,
  };
};
