import React, { useRef, useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  icon: string;
  lastUpdated: Date;
}

interface WeatherVideoGeneratorProps {
  mediaInstance: {
    id: string;
    name: string;
    custom_config: any;
    template: {
      media_type: string;
      orientation: 'horizontal' | 'vertical';
    };
  };
  onVideoReady?: (videoUrl: string) => void;
}

const WeatherVideoGenerator: React.FC<WeatherVideoGeneratorProps> = ({
  mediaInstance,
  onVideoReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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
      setLoading(true);

      // Simular carregamento
      setTimeout(() => {
        // Sempre usar dados simulados para evitar problemas de API
        const simulatedData = {
          city: mediaInstance.custom_config.city_name,
          country: mediaInstance.custom_config.country_code || 'BR',
          temperature: Math.floor(Math.random() * 15) + 20,
          description: ['ensolarado', 'parcialmente nublado', 'nublado', 'chuva leve'][Math.floor(Math.random() * 4)],
          icon: ['01d', '02d', '03d', '04d'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 40) + 40,
          windSpeed: Math.floor(Math.random() * 10) + 5,
          lastUpdated: new Date()
        };

        setWeatherData(simulatedData);
        setLoading(false);
      }, 1000);
    }
  }, [mediaInstance.custom_config]);

  // Desenhar conteúdo no canvas
  const drawWeatherContent = () => {
    const canvas = canvasRef.current;
    if (!canvas || !weatherData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const isHorizontal = mediaInstance.template.orientation === 'horizontal';

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Configurações de texto
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isHorizontal) {
      // Layout horizontal (TV)
      // Título
      ctx.font = 'bold 48px Arial';
      ctx.fillText('Previsão do Tempo', width / 2, height * 0.15);

      // Cidade
      ctx.font = '32px Arial';
      ctx.fillText(`${weatherData.city}, ${weatherData.country}`, width / 2, height * 0.25);

      // Data
      ctx.font = '24px Arial';
      ctx.fillText(currentTime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }), width / 2, height * 0.35);

      // Conteúdo principal
      const mainY = height * 0.6;

      // Ícone do tempo (emoji)
      ctx.font = '120px Arial';
      ctx.fillText(getWeatherIcon(weatherData.icon), width * 0.3, mainY);

      // Temperatura
      ctx.font = 'bold 80px Arial';
      ctx.fillText(`${weatherData.temperature}°C`, width * 0.7, mainY);

      // Descrição
      ctx.font = '32px Arial';
      ctx.fillText(weatherData.description, width * 0.7, mainY + 80);

      // Detalhes
      ctx.font = '24px Arial';
      ctx.fillText(`Umidade: ${weatherData.humidity}%`, width * 0.7, mainY + 120);
      ctx.fillText(`Vento: ${weatherData.windSpeed} m/s`, width * 0.7, mainY + 150);

      // Rodapé
      ctx.font = '20px Arial';
      ctx.fillText(`Atualizado às ${currentTime.toLocaleTimeString('pt-BR')}`, width / 2, height * 0.9);
    } else {
      // Layout vertical (Painel LED)
      // Título
      ctx.font = 'bold 36px Arial';
      ctx.fillText('Tempo', width / 2, height * 0.1);

      // Cidade
      ctx.font = '24px Arial';
      ctx.fillText(weatherData.city, width / 2, height * 0.2);

      // Data
      ctx.font = '18px Arial';
      ctx.fillText(currentTime.toLocaleDateString('pt-BR'), width / 2, height * 0.3);

      // Ícone e temperatura
      ctx.font = '80px Arial';
      ctx.fillText(getWeatherIcon(weatherData.icon), width / 2, height * 0.5);

      ctx.font = 'bold 60px Arial';
      ctx.fillText(`${weatherData.temperature}°C`, width / 2, height * 0.65);

      // Descrição
      ctx.font = '24px Arial';
      ctx.fillText(weatherData.description, width / 2, height * 0.75);

      // Detalhes
      ctx.font = '18px Arial';
      ctx.fillText(`Umidade: ${weatherData.humidity}%`, width / 2, height * 0.85);
      ctx.fillText(`Vento: ${weatherData.windSpeed} m/s`, width / 2, height * 0.9);
    }
  };

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

  // Configurar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isHorizontal = mediaInstance.template.orientation === 'horizontal';
    canvas.width = isHorizontal ? 1920 : 1080;
    canvas.height = isHorizontal ? 1080 : 1920;
  }, [mediaInstance.template.orientation]);

  // Desenhar quando os dados mudam
  useEffect(() => {
    if (weatherData) {
      drawWeatherContent();
    }
  }, [weatherData, currentTime]);

  // Configurar gravação de vídeo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !weatherData) return;

    try {
      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedChunks(chunks);

        if (onVideoReady) {
          onVideoReady(videoUrl);
        }
      };

      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Erro ao configurar gravação:', error);
    }
  }, [weatherData, onVideoReady]);

  // Iniciar gravação
  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setRecordedChunks([]);
      mediaRecorder.start();
      setIsRecording(true);

      // Parar após 10 segundos (duração padrão para mídias de tempo)
      setTimeout(() => {
        stopRecording();
      }, 10000);
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
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

  return (
    <div className="w-full">
      {/* Canvas para renderização */}
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ width: '100%', height: 'auto' }}
      />

      {/* Controles de gravação */}
      <div className="flex justify-center gap-4 p-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRecording ? 'Gravando...' : 'Gerar Vídeo'}
        </button>

        {isRecording && (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Parar Gravação
          </button>
        )}
      </div>

      {/* Preview do canvas */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Preview da mídia de tempo (clique em "Gerar Vídeo" para criar o arquivo)
        </p>
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded"
          style={{
            width: mediaInstance.template.orientation === 'horizontal' ? '400px' : '200px',
            height: mediaInstance.template.orientation === 'horizontal' ? '225px' : '400px'
          }}
        />
      </div>
    </div>
  );
};

export default WeatherVideoGenerator;
