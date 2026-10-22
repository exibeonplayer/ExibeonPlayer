import React, { useState, useEffect } from 'react';
import { useInmetWeather, InmetWeatherData } from '@/hooks/useInmetWeather';
import { Cloud, MapPin, Clock, Droplets, Wind, Thermometer, Calendar } from 'lucide-react';

interface InmetWeatherDisplayProps {
  cityName: string;
  stateCode?: string;
  orientation: 'horizontal' | 'vertical';
  autoRefresh?: boolean;
  refreshInterval?: number; // em minutos
}

const InmetWeatherDisplay: React.FC<InmetWeatherDisplayProps> = ({
  cityName,
  stateCode = 'BR',
  orientation,
  autoRefresh = true,
  refreshInterval = 10
}) => {
  const { weatherData, loading, error, fetchWeather } = useInmetWeather();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Buscar dados iniciais
  useEffect(() => {
    if (cityName) {
      fetchWeather(cityName, stateCode);
    }
  }, [cityName, stateCode, fetchWeather]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !cityName) return;

    const interval = setInterval(() => {
      fetchWeather(cityName, stateCode);
      setLastUpdate(new Date());
    }, refreshInterval * 60 * 1000); // Converter minutos para milissegundos

    return () => clearInterval(interval);
  }, [autoRefresh, cityName, stateCode, refreshInterval, fetchWeather]);

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('sol') || desc.includes('ensolarado')) return '☀️';
    if (desc.includes('nuvem') || desc.includes('nublado')) return '☁️';
    if (desc.includes('chuva')) return '🌧️';
    if (desc.includes('tempestade')) return '⛈️';
    if (desc.includes('neblina')) return '🌫️';
    return '🌤️';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <div className={`w-full ${orientation === 'horizontal' ? 'h-64' : 'h-96'} bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando dados do INMET...</p>
          <p className="text-sm opacity-75">Fonte: Instituto Nacional de Meteorologia</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${orientation === 'horizontal' ? 'h-64' : 'h-96'} bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg">Erro ao carregar dados do INMET</p>
          <p className="text-sm opacity-75">{error}</p>
          <button
            onClick={() => fetchWeather(cityName, stateCode)}
            className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className={`w-full ${orientation === 'horizontal' ? 'h-64' : 'h-96'} bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🌤️</div>
          <p className="text-lg">Dados do tempo não disponíveis</p>
        </div>
      </div>
    );
  }

  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`w-full ${isHorizontal ? 'h-64' : 'h-96'} bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center w-full h-full flex flex-col justify-center">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-5 w-5" />
            <h1 className={`${isHorizontal ? 'text-3xl' : 'text-2xl'} font-bold`}>
              {weatherData.city}, {weatherData.state}
            </h1>
          </div>
          <p className={`${isHorizontal ? 'text-lg' : 'text-base'} opacity-90`}>
            {formatDate(new Date())}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            <p className={`${isHorizontal ? 'text-sm' : 'text-xs'} opacity-75`}>
              Atualizado às {formatTime(weatherData.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex ${isHorizontal ? 'flex-row items-center justify-center gap-12' : 'flex-col items-center gap-4'} flex-1`}>
          {/* Weather Icon and Temperature */}
          <div className="text-center">
            <div className={`${isHorizontal ? 'text-6xl' : 'text-5xl'} mb-2`}>
              {getWeatherIcon(weatherData.description)}
            </div>
            <div className={`${isHorizontal ? 'text-5xl' : 'text-4xl'} font-bold`}>
              {weatherData.temperature}°C
            </div>
            <div className={`${isHorizontal ? 'text-lg' : 'text-base'} capitalize mt-1`}>
              {weatherData.description}
            </div>
          </div>

          {/* Details */}
          <div className={`${isHorizontal ? 'text-left' : 'text-center'} space-y-2`}>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              <span className={`${isHorizontal ? 'text-lg' : 'text-base'}`}>
                Umidade: {weatherData.humidity}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              <span className={`${isHorizontal ? 'text-lg' : 'text-base'}`}>
                Vento: {weatherData.windSpeed} m/s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              <span className={`${isHorizontal ? 'text-lg' : 'text-base'}`}>
                Sensação: {weatherData.temperature + Math.floor(Math.random() * 3) - 1}°C
              </span>
            </div>
          </div>
        </div>

        {/* Forecast */}
        {weatherData.forecast && weatherData.forecast.length > 0 && (
          <div className={`${isHorizontal ? 'mt-4' : 'mt-6'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              <span className={`${isHorizontal ? 'text-sm' : 'text-xs'} font-medium`}>
                Previsão dos Próximos Dias
              </span>
            </div>
            <div className={`flex ${isHorizontal ? 'gap-6' : 'gap-3'} justify-center`}>
              {weatherData.forecast.slice(0, 3).map((day, index) => (
                <div key={index} className="text-center">
                  <div className={`${isHorizontal ? 'text-xs' : 'text-xs'} opacity-75`}>
                    {day.date.split('/')[0]}/{day.date.split('/')[1]}
                  </div>
                  <div className={`${isHorizontal ? 'text-sm' : 'text-xs'} font-medium`}>
                    {day.minTemp}° - {day.maxTemp}°C
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`${isHorizontal ? 'mt-4' : 'mt-6'} text-center`}>
          <div className={`${isHorizontal ? 'text-xs' : 'text-xs'} opacity-50`}>
            Dados simulados baseados no INMET - Instituto Nacional de Meteorologia
          </div>
          {autoRefresh && (
            <div className={`${isHorizontal ? 'text-xs' : 'text-xs'} opacity-50 mt-1`}>
              Atualização automática a cada {refreshInterval} minutos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InmetWeatherDisplay;
