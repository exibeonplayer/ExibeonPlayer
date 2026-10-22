import React from 'react';
import { WeatherData } from '@/hooks/useWeatherAPI';

interface TVWeatherDisplayProps {
  weatherData: WeatherData;
  orientation: 'horizontal' | 'vertical';
}

const TVWeatherDisplay: React.FC<TVWeatherDisplayProps> = ({ weatherData, orientation }) => {
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

  if (orientation === 'horizontal') {
    // Layout para TV (horizontal)
    return (
      <div className="w-full h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white">
        <div className="text-center">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-2">Previsão do Tempo</h1>
            <h2 className="text-4xl font-light">{weatherData.city}, {weatherData.country}</h2>
            <p className="text-2xl mt-2">{formatDate(new Date())}</p>
          </div>

          {/* Informações Principais */}
          <div className="flex items-center justify-center gap-16 mb-8">
            {/* Ícone e Temperatura */}
            <div className="text-center">
              <div className="text-12xl mb-4">{getWeatherIcon(weatherData.icon)}</div>
              <div className="text-8xl font-bold">{weatherData.temperature}°C</div>
            </div>

            {/* Detalhes */}
            <div className="text-left space-y-4">
              <div className="text-3xl capitalize">{weatherData.description}</div>
              <div className="text-2xl">💧 Umidade: {weatherData.humidity}%</div>
              <div className="text-2xl">💨 Vento: {weatherData.windSpeed} m/s</div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-xl text-blue-100">
            Atualizado às {formatTime(weatherData.lastUpdated)}
          </div>
        </div>
      </div>
    );
  } else {
    // Layout para Painel LED (vertical)
    return (
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center text-white p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Tempo</h1>
          <h2 className="text-2xl font-light">{weatherData.city}</h2>
          <p className="text-lg mt-2">{formatDate(new Date())}</p>
        </div>

        {/* Ícone e Temperatura */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{getWeatherIcon(weatherData.icon)}</div>
          <div className="text-6xl font-bold">{weatherData.temperature}°C</div>
          <div className="text-2xl capitalize mt-2">{weatherData.description}</div>
        </div>

        {/* Detalhes */}
        <div className="text-center space-y-3">
          <div className="text-xl">💧 Umidade: {weatherData.humidity}%</div>
          <div className="text-xl">💨 Vento: {weatherData.windSpeed} m/s</div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-sm text-blue-100">
          {formatTime(weatherData.lastUpdated)}
        </div>
      </div>
    );
  }
};

export default TVWeatherDisplay;
