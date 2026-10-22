// Configurações padrão para API do tempo
export const WEATHER_CONFIG = {
  // API Key padrão do sistema (você pode configurar uma chave master)
  DEFAULT_API_KEY: 'your_default_api_key_here', // Substitua pela sua chave

  // Configurações padrão para Brasil
  DEFAULT_COUNTRY: 'BR',
  DEFAULT_UNITS: 'metric' as const,
  DEFAULT_LANGUAGE: 'pt_br',

  // Configurações para TV
  TV_DIMENSIONS: {
    width: 1920,
    height: 1080,
    orientation: 'horizontal' as const
  },

  // Configurações para Painel LED
  LED_DIMENSIONS: {
    width: 1080,
    height: 1920,
    orientation: 'vertical' as const
  },

  // Intervalo de atualização (em minutos)
  UPDATE_INTERVAL: 10,

  // Cache de dados (em minutos)
  CACHE_DURATION: 5
};

// Função para obter configurações baseadas na orientação
export const getWeatherConfig = (orientation: 'horizontal' | 'vertical') => {
  return {
    ...WEATHER_CONFIG,
    dimensions: orientation === 'horizontal'
      ? WEATHER_CONFIG.TV_DIMENSIONS
      : WEATHER_CONFIG.LED_DIMENSIONS
  };
};
