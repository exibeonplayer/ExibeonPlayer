import { useState, useEffect } from 'react';

export interface NetworkStatus {
  online: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    signalStrength: navigator.onLine ? 'good' : 'offline'
  });

  const getSignalStrength = (downlink: number, rtt: number): NetworkStatus['signalStrength'] => {
    if (!navigator.onLine) return 'offline';
    
    // Baseado na velocidade de download e latência
    if (downlink >= 10 && rtt <= 50) return 'excellent';
    if (downlink >= 5 && rtt <= 100) return 'good';
    if (downlink >= 1 && rtt <= 200) return 'fair';
    return 'poor';
  };

  const updateNetworkStatus = () => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const status: NetworkStatus = {
        online: navigator.onLine,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        signalStrength: getSignalStrength(connection.downlink || 0, connection.rtt || 0)
      };
      setNetworkStatus(status);
    } else {
      // Fallback para navegadores sem suporte a Connection API
      setNetworkStatus(prev => ({
        ...prev,
        online: navigator.onLine,
        signalStrength: navigator.onLine ? 'good' : 'offline'
      }));
    }
  };

  useEffect(() => {
    // Atualizar status inicial
    updateNetworkStatus();

    // Listeners para mudanças de conectividade
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listener para mudanças na conexão (se suportado)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Atualizar periodicamente para simular oscilação do sinal
    const interval = setInterval(() => {
      if (navigator.onLine) {
        updateNetworkStatus();
      }
    }, 2000); // Atualizar a cada 2 segundos

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
      
      clearInterval(interval);
    };
  }, []);

  return networkStatus;
};
