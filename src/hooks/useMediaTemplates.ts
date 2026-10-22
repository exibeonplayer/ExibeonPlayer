import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MediaTemplate {
  id: string;
  name: string;
  description: string;
  media_type: 'static' | 'rss' | 'weather' | 'webpage' | 'clock' | 'calendar' | 'counter' | 'overlay';
  orientation: 'horizontal' | 'vertical';
  is_overlay: boolean;
  overlay_position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  template_config: Record<string, any>;
  preview_image_url?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MediaInstance {
  id: string;
  template_id: string;
  name: string;
  description: string;
  custom_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  template?: MediaTemplate;
}

export const useMediaTemplates = () => {
  const [templates, setTemplates] = useState<MediaTemplate[]>([]);
  const [instances, setInstances] = useState<MediaInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('media_templates' as any)
        .select('*')
        .eq('status', 'active')
        .order('media_type', { ascending: true })
        .order('orientation', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setTemplates((data || []) as unknown as MediaTemplate[]);
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('media_instances' as any)
        .select(`
          *,
          template:media_templates(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setInstances((data || []) as unknown as MediaInstance[]);
    } catch (err) {
      console.error('Erro ao buscar instâncias:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (templateId: string, name: string, description: string, customConfig: Record<string, any>) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const finalConfig={...customConfig};

      const { data, error: insertError } = await supabase
        .from('media_instances' as any)
        .insert({
          template_id: templateId,
          name,
          description,
          custom_config: finalConfig,
          created_by: user.id
        })
        .select(`
          *,
          template:media_templates(*)
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      // Atualizar lista local
      setInstances(prev => [data as unknown as MediaInstance, ...prev]);

      return data;
    } catch (err) {
      console.error('Erro ao criar instância:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  const updateInstance = async (instanceId: string, updates: Partial<MediaInstance>) => {
    try {
      setError(null);
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)throw new Error('Entre novamente na sua conta.');
      const { data, error: updateError } = await supabase
        .from('media_instances' as any)
        .update(updates)
        .eq('id', instanceId)
        .eq('created_by', user.id)
        .select(`
          *,
          template:media_templates(*)
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      setInstances(prev =>
        prev.map(instance =>
          instance.id === instanceId ? data as unknown as MediaInstance : instance
        )
      );

      return data;
    } catch (err) {
      console.error('Erro ao atualizar instância:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('media_instances' as any)
        .delete()
        .eq('id', instanceId);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
    } catch (err) {
      console.error('Erro ao deletar instância:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  const getTemplatesByType = (mediaType: string) => {
    return templates.filter(template => template.media_type === mediaType);
  };

  const getTemplatesByOrientation = (orientation: 'horizontal' | 'vertical') => {
    return templates.filter(template => template.orientation === orientation);
  };

  const getOverlayTemplates = () => {
    return templates.filter(template => template.is_overlay);
  };

  const getStaticTemplates = () => {
    return templates.filter(template => template.media_type === 'static');
  };

  useEffect(() => {
    fetchTemplates();
    fetchInstances();
  }, []);

  return {
    templates,
    instances,
    loading,
    error,
    fetchTemplates,
    fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    getTemplatesByType,
    getTemplatesByOrientation,
    getOverlayTemplates,
    getStaticTemplates,
    refetch: () => {
      fetchTemplates();
      fetchInstances();
    }
  };
};
