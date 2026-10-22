/**
 * Utilitários para calcular duração de mídias avançadas
 */

export interface MediaInstance {
  id: string;
  name: string;
  description?: string;
  custom_config: any;
  is_active: boolean;
  template?: {
    id: string;
    name: string;
    media_type: string;
    orientation: 'horizontal' | 'vertical';
    is_overlay: boolean;
  };
}

/**
 * Calcula a duração estimada de uma mídia avançada baseada no tipo e configurações
 */
export function calculateAdvancedMediaDuration(mediaInstance: MediaInstance): number {
  if (!mediaInstance.template) {
    return 0;
  }

  const { media_type } = mediaInstance.template;
  const config = mediaInstance.custom_config || {};

  if(media_type==='overlay')return 0;
  if(Number(config.display_duration)>0)return Math.max(5,Math.min(300,Number(config.display_duration)));
  switch (media_type) {
    case 'rss':
      // RSS: max_items × tempo_por_notícia
      const maxItems = config.max_items || 10;
      const itemDuration = Number(config.item_duration) || 8;
      return Math.max(5, Math.min(300, maxItems * itemDuration));

    case 'weather':
      // Previsão do tempo: tempo fixo
      return Math.max(5, Math.min(300, Number(config.display_duration) || 20));

    case 'clock':
      return 20;

    case 'calendar':
      // Calendário: tempo fixo
      return 20;

    case 'counter':
      return 20;

    case 'webpage':
      // Página web: tempo fixo
      return 20; // 20 segundos

    default:
      // Tipo desconhecido: duração padrão
      return 10;
  }
}

/**
 * Formata duração em segundos para exibição
 */
export function formatAdvancedMediaDuration(mediaInstance: MediaInstance): string {
  const duration = calculateAdvancedMediaDuration(mediaInstance);

  if (duration === 0) {
    return 'Sobreposição';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `0:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Obtém informações detalhadas sobre a duração de uma mídia
 */
export function getMediaDurationInfo(mediaInstance: MediaInstance): {
  duration: number;
  formatted: string;
  isInfinite: boolean;
  description: string;
} {
  const duration = calculateAdvancedMediaDuration(mediaInstance);
  const formatted = formatAdvancedMediaDuration(mediaInstance);
  const isInfinite = duration === 0;

  let description = '';
  if (mediaInstance.template?.media_type === 'rss') {
    description = `Manchetes em rotação · tempo na fila: ${formatted}`;
  } else if (isInfinite) {
    description = 'Acompanha os conteúdos da playlist';
  } else {
    description = `Duração fixa: ${formatted}`;
  }

  return {
    duration,
    formatted,
    isInfinite,
    description
  };
}
