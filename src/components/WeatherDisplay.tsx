import React from 'react';
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import { WeatherData } from '@/hooks/useWeatherAPI';

interface WeatherDisplayProps {
  weatherData: WeatherData;
  compact?: boolean;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weatherData, compact = false }) => {
  const getWeatherIcon = (iconCode: string) => {
    // Mapear códigos de ícone do OpenWeatherMap para emojis
    const iconMap: Record<string, string> = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️', // scattered clouds
      '04d': '☁️', // broken clouds
      '04n': '☁️', // broken clouds
      '09d': '🌧️', // shower rain
      '09n': '🌧️', // shower rain
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️', // thunderstorm
      '13d': '❄️', // snow
      '13n': '❄️', // snow
      '50d': '🌫️', // mist
      '50n': '🌫️', // mist
    };

    return iconMap[iconCode] || '🌤️';
  };

  if (compact) {
    return (
      <div className="bg-black/90 text-white px-2 py-1 rounded backdrop-blur-sm inline-block">
        <div className="flex items-center gap-1">
          <span className="text-sm">{getWeatherIcon(weatherData.icon)}</span>
          <span className="text-xs font-mono font-bold">
            {weatherData.temperature}°C
          </span>
        </div>
        <div className="text-xs text-gray-300">
          {weatherData.description}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getWeatherIcon(weatherData.icon)}</span>
          <div>
            <h3 className="font-semibold text-lg">{weatherData.city}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {weatherData.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{weatherData.temperature}°C</div>
          <div className="text-xs text-gray-500">
            Atualizado: {weatherData.lastUpdated.toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span>{weatherData.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-gray-500" />
          <span>{weatherData.windSpeed} m/s</span>
        </div>
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-red-500" />
          <span>{weatherData.temperature}°C</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;
