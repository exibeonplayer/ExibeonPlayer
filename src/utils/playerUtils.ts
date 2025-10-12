// Funções utilitárias para o sistema de players

export const formatDuration = (milliseconds: number): string => {
  if (!milliseconds || milliseconds < 0) return '00:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatLastSeen = (lastSeen: string): string => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Agora';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `há ${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `há ${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `há ${days} dias`;
  }
};

export const getNetworkStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'online':
      return 'bg-green-100 text-green-800';
    case 'offline':
      return 'bg-red-100 text-red-800';
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getNetworkStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'connecting':
      return 'Conectando';
    case 'error':
      return 'Erro';
    default:
      return 'Desconhecido';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const getPlaybackStatusColor = (isPlaying: boolean, isPaused: boolean): string => {
  if (isPlaying && !isPaused) return 'bg-green-100 text-green-800';
  if (isPaused) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

export const getPlaybackStatusText = (isPlaying: boolean, isPaused: boolean): string => {
  if (isPlaying && !isPaused) return 'Reproduzindo';
  if (isPaused) return 'Pausado';
  return 'Parado';
};

export const calculateUptime = (sessionStart: string, sessionEnd?: string): string => {
  const start = new Date(sessionStart);
  const end = sessionEnd ? new Date(sessionEnd) : new Date();
  const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

export const getDeviceInfo = (deviceInfo: any): string => {
  const parts: string[] = [];
  
  if (deviceInfo?.os) {
    parts.push(deviceInfo.os);
  }
  
  if (deviceInfo?.screen_resolution) {
    parts.push(deviceInfo.screen_resolution);
  }
  
  return parts.join(' • ') || 'Informações não disponíveis';
};

export const generatePlayerCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'EXB';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};
