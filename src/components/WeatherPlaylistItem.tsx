import React, { useState, useEffect } from 'react';
import { Cloud, Clock, Calendar, Hash, Globe, Rss } from 'lucide-react';
import { useWeatherAPI, WeatherData } from '@/hooks/useWeatherAPI';

interface WeatherPlaylistItemProps {
  mediaInstance: {
    id: string;
    name: string;
    custom_config: any;
    template: {
      media_type: string;
      orientation: 'horizontal' | 'vertical';
    };
  };
  duration: number;
}

const WeatherPlaylistItem: React.FC<WeatherPlaylistItemProps> = ({
  mediaInstance,
  duration
}) => {
  const { fetchWeather, weatherData, loading, error } = useWeatherAPI();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Buscar dados do tempo
  useEffect(() => {
    if (mediaInstance.custom_config?.city_name) {
      fetchWeather({
        apiKey: mediaInstance.custom_config.api_key || '',
        city: mediaInstance.custom_config.city_name,
        country: mediaInstance.custom_config.country_code || 'BR',
        units: mediaInstance.custom_config.units || 'metric'
      });
    }
  }, [mediaInstance.custom_config, fetchWeather]);

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌤️';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'weather': return <Cloud className="w-4 h-4" />;
      case 'clock': return <Clock className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'counter': return <Hash className="w-4 h-4" />;
      case 'webpage': return <Globe className="w-4 h-4" />;
      case 'rss': return <Rss className="w-4 h-4" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  const getMediaTypeName = (mediaType: string) => {
    switch (mediaType) {
      case 'weather': return 'Previsão do Tempo';
      case 'clock': return 'Relógio Digital';
      case 'calendar': return 'Calendário';
      case 'counter': return 'Contador';
      case 'webpage': return 'Página Web';
      case 'rss': return 'Feed RSS';
      default: return 'Mídia Avançada';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando dados do tempo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg">Erro ao carregar dados do tempo</p>
          <p className="text-sm opacity-75">{error}</p>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🌤️</div>
          <p className="text-lg">Dados do tempo não disponíveis</p>
        </div>
      </div>
    );
  }

  const isHorizontal = mediaInstance.template.orientation === 'horizontal';

  return (
    <div className={`w-full ${isHorizontal ? 'h-64' : 'h-96'} bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Header */}
        <div className="mb-4">
          <h1 className={`${isHorizontal ? 'text-3xl' : 'text-2xl'} font-bold mb-1`}>
            {getMediaTypeName(mediaInstance.template.media_type)}
          </h1>
          <h2 className={`${isHorizontal ? 'text-xl' : 'text-lg'} font-light`}>
            {weatherData.city}, {weatherData.country}
          </h2>
          <p className={`${isHorizontal ? 'text-sm' : 'text-xs'} opacity-90`}>
            {formatDate(currentTime)}
          </p>
        </div>

        {/* Main Content */}
        <div className={`flex ${isHorizontal ? 'flex-row items-center gap-8' : 'flex-col items-center gap-4'}`}>
          {/* Weather Icon and Temperature */}
          <div className="text-center">
            <div className={`${isHorizontal ? 'text-6xl' : 'text-5xl'} mb-2`}>
              {getWeatherIcon(weatherData.icon)}
            </div>
            <div className={`${isHorizontal ? 'text-5xl' : 'text-4xl'} font-bold`}>
              {weatherData.temperature}°C
            </div>
          </div>

          {/* Details */}
          <div className={`${isHorizontal ? 'text-left' : 'text-center'} space-y-2`}>
            <div className={`${isHorizontal ? 'text-xl' : 'text-lg'} capitalize font-medium`}>
              {weatherData.description}
            </div>
            <div className={`${isHorizontal ? 'text-sm' : 'text-xs'} space-y-1`}>
              <div>💧 Umidade: {weatherData.humidity}%</div>
              <div>💨 Vento: {weatherData.windSpeed} m/s</div>
              <div>🌡️ Sensação: {weatherData.feelsLike}°C</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`${isHorizontal ? 'mt-4' : 'mt-6'} text-center`}>
          <div className={`${isHorizontal ? 'text-sm' : 'text-xs'} opacity-75`}>
            Atualizado às {formatTime(weatherData.lastUpdated)}
          </div>
          <div className={`${isHorizontal ? 'text-xs' : 'text-xs'} opacity-50 mt-1`}>
            Duração: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPlaylistItem;
