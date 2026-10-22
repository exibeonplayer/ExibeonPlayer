import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RssSource {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  language: string;
  update_interval: number;
  max_items: number;
  is_active: boolean;
  last_fetched: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useRssSources() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('rss_sources')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setSources(data || []);
    } catch (err) {
      console.error('Erro ao buscar fontes RSS:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  return {
    sources,
    loading,
    error,
    refetch: fetchSources
  };
}
