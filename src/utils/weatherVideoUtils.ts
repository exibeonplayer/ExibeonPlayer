// Utilitários para gerar vídeos de mídias de tempo

export interface WeatherVideoConfig {
  city: string;
  country: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  orientation: 'horizontal' | 'vertical';
  duration: number; // em segundos
}

export const generateWeatherVideoUrl = (config: WeatherVideoConfig): string => {
  // Criar um URL de dados para um vídeo HTML5 simples
  // Este é um placeholder - em produção, você geraria um vídeo real

  const videoData = {
    type: 'weather',
    config: config,
    timestamp: Date.now()
  };

  // Retornar um URL de dados que o player pode interpretar
  return `data:application/json;base64,${btoa(JSON.stringify(videoData))}`;
};

export const createWeatherVideoElement = (config: WeatherVideoConfig): HTMLVideoElement => {
  const video = document.createElement('video');
  video.width = config.orientation === 'horizontal' ? 1920 : 1080;
  video.height = config.orientation === 'horizontal' ? 1080 : 1920;
  video.duration = config.duration;
  video.loop = true;
  video.muted = true;
  video.autoplay = true;

  // Adicionar dados como atributo personalizado
  video.setAttribute('data-weather-config', JSON.stringify(config));
  video.setAttribute('data-media-type', 'weather');

  return video;
};

export const isWeatherVideo = (videoElement: HTMLVideoElement): boolean => {
  return videoElement.getAttribute('data-media-type') === 'weather';
};

export const getWeatherConfig = (videoElement: HTMLVideoElement): WeatherVideoConfig | null => {
  const configAttr = videoElement.getAttribute('data-weather-config');
  if (configAttr) {
    try {
      return JSON.parse(configAttr);
    } catch (error) {
      console.error('Erro ao parsear configuração do tempo:', error);
    }
  }
  return null;
};
