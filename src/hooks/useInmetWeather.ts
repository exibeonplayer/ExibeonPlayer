import { useState, useEffect, useCallback } from 'react';

export interface InmetWeatherData {
  city: string;
  state: string;
  cityCode: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  lastUpdated: Date;
  forecast: {
    date: string;
    minTemp: number;
    maxTemp: number;
    description: string;
  }[];
}

export interface InmetCityCode {
  code: string;
  name: string;
  state: string;
}

export const useInmetWeather = () => {
  const [weatherData, setWeatherData] = useState<InmetWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Códigos das principais cidades brasileiras do INMET
  const cityCodes: InmetCityCode[] = [
    { code: '2211001', name: 'Teresina', state: 'PI' },
    { code: '3304557', name: 'Rio de Janeiro', state: 'RJ' },
    { code: '3550308', name: 'São Paulo', state: 'SP' },
    { code: '5300108', name: 'Brasília', state: 'DF' },
    { code: '2927408', name: 'Salvador', state: 'BA' },
    { code: '2304400', name: 'Fortaleza', state: 'CE' },
    { code: '3106200', name: 'Belo Horizonte', state: 'MG' },
    { code: '1302603', name: 'Manaus', state: 'AM' },
    { code: '4106902', name: 'Curitiba', state: 'PR' },
    { code: '2611606', name: 'Recife', state: 'PE' },
    { code: '4314902', name: 'Porto Alegre', state: 'RS' },
    { code: '5208707', name: 'Goiânia', state: 'GO' },
    { code: '1501402', name: 'Belém', state: 'PA' },
    { code: '2111300', name: 'São Luís', state: 'MA' },
    { code: '2704302', name: 'Maceió', state: 'AL' },
    { code: '2408102', name: 'Natal', state: 'RN' },
    { code: '5002704', name: 'Campo Grande', state: 'MS' },
    { code: '3205309', name: 'Vitória', state: 'ES' },
    { code: '4205407', name: 'Florianópolis', state: 'SC' },
    { code: '5103403', name: 'Cuiabá', state: 'MT' },
    { code: '2507507', name: 'João Pessoa', state: 'PB' },
    { code: '2800308', name: 'Aracaju', state: 'SE' },
    { code: '1100205', name: 'Porto Velho', state: 'RO' },
    { code: '1400100', name: 'Boa Vista', state: 'RR' },
    { code: '1200401', name: 'Rio Branco', state: 'AC' },
    { code: '1600303', name: 'Macapá', state: 'AP' }
  ];

  const findCityCode = useCallback((cityName: string, stateCode?: string): string | null => {
    const normalizedCity = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Buscar por nome exato
    let found = cityCodes.find(city =>
      city.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedCity
    );

    // Se não encontrou e tem estado, buscar por nome + estado
    if (!found && stateCode) {
      found = cityCodes.find(city =>
        city.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedCity &&
        city.state === stateCode.toUpperCase()
      );
    }

    // Se ainda não encontrou, buscar por similaridade
    if (!found) {
      found = cityCodes.find(city =>
        city.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedCity) ||
        normalizedCity.includes(city.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );
    }

    return found?.code || null;
  }, []);

  const parseRSSFeed = useCallback((rssText: string, cityName: string, stateCode: string): InmetWeatherData | null => {
    try {
      // Parse simples do RSS (em produção, use uma biblioteca como rss-parser)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssText, 'text/xml');

      // Extrair dados do primeiro item (previsão atual)
      const items = xmlDoc.getElementsByTagName('item');
      if (items.length === 0) return null;

      const firstItem = items[0];
      const title = firstItem.getElementsByTagName('title')[0]?.textContent || '';
      const description = firstItem.getElementsByTagName('description')[0]?.textContent || '';

      // Extrair temperatura do título (formato: "Teresina - PI: 28°C")
      const tempMatch = title.match(/(\d+)°C/);
      const temperature = tempMatch ? parseInt(tempMatch[1]) : 25;

      // Extrair descrição do tempo
      const descMatch = description.match(/Tempo: ([^<]+)/);
      const weatherDescription = descMatch ? descMatch[1].trim() : 'Ensolarado';

      // Dados simulados para umidade e vento (INMET RSS não fornece esses dados)
      const humidity = Math.floor(Math.random() * 40) + 40; // 40-80%
      const windSpeed = Math.floor(Math.random() * 10) + 5; // 5-15 m/s

      // Gerar previsão para os próximos dias (simulado baseado nos dados atuais)
      const forecast = Array.from({ length: 3 }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        minTemp: temperature - Math.floor(Math.random() * 5) - 2,
        maxTemp: temperature + Math.floor(Math.random() * 5) + 2,
        description: weatherDescription
      }));

      return {
        city: cityName,
        state: stateCode,
        cityCode: findCityCode(cityName, stateCode) || '',
        temperature,
        description: weatherDescription,
        humidity,
        windSpeed,
        lastUpdated: new Date(),
        forecast
      };
    } catch (error) {
      console.error('Erro ao parsear RSS do INMET:', error);
      return null;
    }
  }, [findCityCode]);

  const fetchWeather = useCallback(async (cityName: string, stateCode: string = 'BR'): Promise<InmetWeatherData | null> => {
    if (!cityName) {
      setError('Cidade é obrigatória');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Encontrar código da cidade
      const cityCode = findCityCode(cityName, stateCode);
      if (!cityCode) {
        throw new Error(`Cidade "${cityName}" não encontrada no INMET`);
      }

      // Usar dados simulados baseados no INMET para evitar problemas de CORS
      console.log('Usando dados simulados baseados no INMET para:', cityName);

      // Simular dados do INMET com informações realistas
      const simulatedWeatherData: InmetWeatherData = {
        city: cityName,
        state: stateCode,
        cityCode: cityCode,
        temperature: getSimulatedTemperature(cityName),
        description: getSimulatedDescription(),
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 m/s
        lastUpdated: new Date(),
        forecast: generateSimulatedForecast(cityName)
      };

      setWeatherData(simulatedWeatherData);
      return simulatedWeatherData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar dados do INMET:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [findCityCode]);

  // Função para simular temperatura baseada na cidade
  const getSimulatedTemperature = (cityName: string): number => {
    const cityTemps: Record<string, { min: number; max: number }> = {
      'teresina': { min: 25, max: 35 },
      'são paulo': { min: 15, max: 25 },
      'rio de janeiro': { min: 20, max: 30 },
      'brasília': { min: 18, max: 28 },
      'salvador': { min: 22, max: 32 },
      'fortaleza': { min: 24, max: 34 },
      'belo horizonte': { min: 16, max: 26 },
      'manaus': { min: 24, max: 34 },
      'curitiba': { min: 12, max: 22 },
      'recife': { min: 23, max: 33 },
      'porto alegre': { min: 14, max: 24 },
      'goiânia': { min: 20, max: 30 },
      'belém': { min: 24, max: 34 },
      'são luís': { min: 25, max: 35 },
      'maceió': { min: 23, max: 33 },
      'natal': { min: 24, max: 34 },
      'campo grande': { min: 18, max: 28 },
      'vitória': { min: 20, max: 30 },
      'florianópolis': { min: 15, max: 25 },
      'cuiabá': { min: 22, max: 32 },
      'joão pessoa': { min: 23, max: 33 },
      'aracaju': { min: 24, max: 34 },
      'porto velho': { min: 24, max: 34 },
      'boa vista': { min: 25, max: 35 },
      'rio branco': { min: 24, max: 34 },
      'macapá': { min: 24, max: 34 }
    };

    const normalizedCity = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tempRange = cityTemps[normalizedCity] || { min: 20, max: 30 };

    return Math.floor(Math.random() * (tempRange.max - tempRange.min + 1)) + tempRange.min;
  };

  // Função para simular descrição do tempo
  const getSimulatedDescription = (): string => {
    const descriptions = [
      'ensolarado', 'parcialmente nublado', 'nublado', 'chuva leve',
      'chuva moderada', 'tempestade', 'neblina', 'céu limpo',
      'chuva forte', 'garoa', 'sol com nuvens', 'chuva com sol'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  // Função para gerar previsão simulada
  const generateSimulatedForecast = (cityName: string) => {
    const baseTemp = getSimulatedTemperature(cityName);
    return Array.from({ length: 3 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      minTemp: baseTemp - Math.floor(Math.random() * 5) - 2,
      maxTemp: baseTemp + Math.floor(Math.random() * 5) + 2,
      description: getSimulatedDescription()
    }));
  };

  const getAvailableCities = useCallback((): InmetCityCode[] => {
    return cityCodes;
  }, []);

  return {
    weatherData,
    loading,
    error,
    fetchWeather,
    getAvailableCities,
    findCityCode
  };
};
