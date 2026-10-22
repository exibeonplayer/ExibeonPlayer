import { useState, useEffect } from 'react';
import { WEATHER_CONFIG } from '@/config/weather';

export interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  icon: string;
  lastUpdated: Date;
}

export interface WeatherConfig {
  apiKey: string;
  city: string;
  country: string;
  units: 'metric' | 'imperial';
}

export const useWeatherAPI = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (config: WeatherConfig): Promise<WeatherData | null> => {
    if (!config.city) {
      setError('Cidade é obrigatória');
      return null;
    }

    // Usar API Key padrão se não fornecida
    const apiKey = config.apiKey || WEATHER_CONFIG.DEFAULT_API_KEY;

    setLoading(true);
    setError(null);

    try {
      // Se a API Key for a padrão (vazia), usar dados simulados
      if (!apiKey || apiKey === 'your_default_api_key_here') {
        console.log('Usando dados simulados do tempo para:', config.city);
        return generateSimulatedWeatherData(config);
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${config.city},${config.country}&appid=${apiKey}&units=${config.units}&lang=pt_br`
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('API Key inválida, usando dados simulados para:', config.city);
          return generateSimulatedWeatherData(config);
        } else if (response.status === 404) {
          throw new Error('Cidade não encontrada');
        } else {
          throw new Error(`Erro na API: ${response.status}`);
        }
      }

      const data = await response.json();

      const weatherInfo: WeatherData = {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        city: data.name,
        country: data.sys.country,
        icon: data.weather[0].icon,
        lastUpdated: new Date()
      };

      setWeatherData(weatherInfo);
      return weatherInfo;
    } catch (err) {
      console.error('Erro ao buscar dados do tempo:', err);
      console.log('Usando dados simulados para:', config.city);
      return generateSimulatedWeatherData(config);
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar dados simulados do tempo
  const generateSimulatedWeatherData = (config: WeatherConfig): WeatherData => {
    const simulatedData: WeatherData = {
      city: config.city,
      country: config.country,
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      description: getRandomDescription(),
      icon: getRandomIcon(),
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 m/s
      lastUpdated: new Date()
    };

    setWeatherData(simulatedData);
    return simulatedData;
  };

  const getRandomDescription = (): string => {
    const descriptions = [
      'ensolarado', 'parcialmente nublado', 'nublado', 'chuva leve',
      'chuva moderada', 'tempestade', 'neblina', 'céu limpo'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const getRandomIcon = (): string => {
    const icons = ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '50d'];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    weatherData,
    loading,
    error,
    fetchWeather,
    validateApiKey
  };
};
