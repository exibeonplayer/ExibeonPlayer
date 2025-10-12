import { Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const WifiSignal = () => {
  const { signalStrength, online, downlink, rtt } = useNetworkStatus();
  const { toast } = useToast();

  const getSignalColor = () => {
    switch (signalStrength) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-green-400';
      case 'fair':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      case 'offline':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSignalBars = () => {
    switch (signalStrength) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'fair':
        return 2;
      case 'poor':
        return 1;
      case 'offline':
        return 0;
      default:
        return 1;
    }
  };

  const handleClick = () => {
    let title = "Status da Conexão";
    let description = "";

    if (!online) {
      description = "Você está offline.";
    } else {
      const strengthLabels = {
        'excellent': 'Excelente',
        'good': 'Bom', 
        'fair': 'Regular',
        'poor': 'Ruim',
        'offline': 'Offline'
      };
      
      const bars = getSignalBars();
      description = `Sinal: ${strengthLabels[signalStrength]} (${bars} barras)`;
      
      if (downlink > 0) {
        description += ` • Velocidade: ${downlink.toFixed(1)} Mbps`;
      }
      if (rtt > 0) {
        description += ` • Latência: ${rtt} ms`;
      }
    }

    toast({
      title: title,
      description: description,
    });
  };

  const bars = getSignalBars();
  const color = getSignalColor();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClick} 
      className="relative h-8 w-8 p-0"
      title="Clique para ver detalhes da conexão"
    >
      <Wifi 
        className={`w-5 h-5 transition-colors duration-300 ${color} ${
          !online ? 'animate-pulse' : ''
        }`} 
      />
      
      {/* Efeito de pulsação sutil para simular oscilação quando online */}
      {online && (
        <div 
          className={`absolute inset-0 rounded-full animate-pulse ${
            signalStrength === 'excellent' || signalStrength === 'good' 
              ? 'bg-green-400/10' 
              : signalStrength === 'fair' 
              ? 'bg-yellow-400/10' 
              : 'bg-red-400/10'
          }`}
          style={{
            animationDuration: signalStrength === 'poor' ? '1.5s' : '3s',
            animationDelay: '1s'
          }}
        />
      )}
    </Button>
  );
};

export default WifiSignal;
