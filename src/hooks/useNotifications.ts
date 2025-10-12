import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'video_uploaded' | 'playlist_created' | 'player_connected' | 'player_disconnected' | 'license_expiring' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  user_id: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Buscar notificações reais baseadas na atividade do usuário
      const realNotifications: Notification[] = [];

      // 1. Buscar status de leitura das notificações dinâmicas
      const { data: readStatus } = await supabase
        .from('notification_read_status')
        .select('notification_id, read_at')
        .eq('user_id', user.id);

      const readStatusMap = new Map(
        readStatus?.map(status => [status.notification_id, status.read_at]) || []
      );

      // 2. Buscar vídeos recentemente enviados (últimos 7 dias)
      const { data: recentVideos } = await supabase
        .from('media_files')
        .select('title, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentVideos) {
        recentVideos.forEach(video => {
          const notificationId = `video-${video.created_at}`;
          realNotifications.push({
            id: notificationId,
            type: 'video_uploaded',
            title: 'Vídeo Enviado',
            message: `O arquivo "${video.title}" foi enviado com sucesso.`,
            timestamp: video.created_at,
            read: !!readStatusMap.get(notificationId),
            user_id: user.id
          });
        });
      }

      // 3. Buscar playlists recentemente criadas (últimos 7 dias)
      const { data: recentPlaylists } = await supabase
        .from('playlists')
        .select('name, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentPlaylists) {
        recentPlaylists.forEach(playlist => {
          const notificationId = `playlist-${playlist.created_at}`;
          realNotifications.push({
            id: notificationId,
            type: 'playlist_created',
            title: 'Playlist Criada',
            message: `A playlist "${playlist.name}" foi criada com sucesso.`,
            timestamp: playlist.created_at,
            read: !!readStatusMap.get(notificationId),
            user_id: user.id
          });
        });
      }

      // 4. Buscar players recentemente conectados (últimos 7 dias)
      const { data: recentPlayers } = await supabase
        .from('player_associations')
        .select('player_name, associated_at')
        .eq('user_id', user.id)
        .gte('associated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('associated_at', { ascending: false })
        .limit(2);

      if (recentPlayers) {
        recentPlayers.forEach(player => {
          const notificationId = `player-${player.associated_at}`;
          realNotifications.push({
            id: notificationId,
            type: 'player_connected',
            title: 'Player Conectado',
            message: `O player "${player.player_name}" foi conectado com sucesso.`,
            timestamp: player.associated_at,
            read: !!readStatusMap.get(notificationId),
            user_id: user.id
          });
        });
      }

      // 5. Verificar se há licença expirando em breve
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // Buscar licenças separadamente
      if (userProfile) {
        const { data: licenses, error: licenseError } = await supabase
          .from('licenses')
          .select('end_date')
          .eq('user_id', user.id);
          
        if (licenseError) {
          console.warn('Error fetching licenses for notifications:', licenseError);
        }

        if (licenses && licenses.length > 0) {
          const license = licenses[0];
          if (license.end_date) {
            const endDate = new Date(license.end_date);
            const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              const notificationId = 'license-expiring';
              realNotifications.push({
                id: notificationId,
                type: 'license_expiring',
                title: 'Licença Expirando',
                message: `Sua licença expira em ${daysUntilExpiry} dia(s). Renove para continuar usando o sistema.`,
                timestamp: new Date().toISOString(),
                read: !!readStatusMap.get(notificationId),
                user_id: user.id
              });
            }
          }
        }
      }

      // 6. Buscar notificações do sistema (incluindo lidas)
      const { data: systemNotifications } = await supabase
        .from('system_notifications')
        .select('*')
        .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (systemNotifications) {
        systemNotifications.forEach(notif => {
          // Verificar se não expirou
          if (!notif.expires_at || new Date(notif.expires_at) > new Date()) {
            realNotifications.push({
              id: `system-${notif.id}`,
              type: 'system',
              title: notif.title,
              message: notif.message,
              timestamp: notif.created_at,
              read: !!notif.read_at, // true se read_at não for null
              user_id: user.id
            });
          }
        });
      }

      // Ordenar por timestamp (mais recente primeiro)
      realNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Remover duplicatas baseadas no ID
      const uniqueNotifications = realNotifications.filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id)
      );

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Em caso de erro, mostrar notificação básica do sistema
      setNotifications([{
        id: 'system-error',
        type: 'system',
        title: 'Sistema',
        message: 'Erro ao carregar notificações. Tente novamente mais tarde.',
        timestamp: new Date().toISOString(),
        read: false,
        user_id: user.id
      }]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    console.log('🔔 Marcando notificação como lida:', notificationId);

    // Atualizar estado local primeiro
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    // Se é uma notificação do sistema, marcar como lida no banco
    if (notificationId.startsWith('system-')) {
      const systemNotificationId = notificationId.replace('system-', '');
      console.log('🔔 Marcando notificação do sistema como lida:', systemNotificationId);
      
      try {
        const { error } = await supabase
          .from('system_notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', systemNotificationId)
          .or(`target_user_id.eq.${user.id},target_user_id.is.null`);

        if (error) {
          console.error('❌ Erro ao marcar notificação do sistema como lida:', error);
        } else {
          console.log('✅ Notificação do sistema marcada como lida com sucesso');
        }
      } catch (error) {
        console.error('❌ Erro ao marcar notificação do sistema como lida:', error);
      }
    } else {
      // Para notificações dinâmicas (video, playlist, player, license), marcar na tabela de controle
      const notificationType = notificationId.startsWith('video-') ? 'video_uploaded' :
                              notificationId.startsWith('playlist-') ? 'playlist_created' :
                              notificationId.startsWith('player-') ? 'player_connected' :
                              notificationId === 'license-expiring' ? 'license_expiring' : null;

      if (notificationType) {
        console.log('🔔 Marcando notificação dinâmica como lida:', notificationId, 'tipo:', notificationType);
        
        try {
          const { error } = await supabase
            .from('notification_read_status')
            .upsert({
              user_id: user.id,
              notification_id: notificationId,
              notification_type: notificationType,
              read_at: new Date().toISOString()
            });

          if (error) {
            console.error('❌ Erro ao marcar notificação dinâmica como lida:', error);
          } else {
            console.log('✅ Notificação dinâmica marcada como lida com sucesso');
          }
        } catch (error) {
          console.error('❌ Erro ao marcar notificação dinâmica como lida:', error);
        }
      }
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    console.log('🔔 Marcando todas as notificações como lidas');

    // Atualizar estado local primeiro
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );

    // Marcar todas as notificações do sistema como lidas no banco
    try {
      await supabase
        .from('system_notifications')
        .update({ read_at: new Date().toISOString() })
        .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
        .is('read_at', null);
      
      console.log('✅ Todas as notificações do sistema marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar notificações do sistema como lidas:', error);
    }

    // Marcar todas as notificações dinâmicas atuais como lidas
    const currentNotifications = notifications.filter(notif => !notif.read);
    
    for (const notif of currentNotifications) {
      if (!notif.id.startsWith('system-')) {
        const notificationType = notif.id.startsWith('video-') ? 'video_uploaded' :
                                notif.id.startsWith('playlist-') ? 'playlist_created' :
                                notif.id.startsWith('player-') ? 'player_connected' :
                                notif.id === 'license-expiring' ? 'license_expiring' : null;

        if (notificationType) {
          try {
            await supabase
              .from('notification_read_status')
              .upsert({
                user_id: user.id,
                notification_id: notif.id,
                notification_type: notificationType,
                read_at: new Date().toISOString()
              });
          } catch (error) {
            console.error(`❌ Erro ao marcar notificação dinâmica ${notif.id} como lida:`, error);
          }
        }
      }
    }
    
    console.log('✅ Todas as notificações dinâmicas marcadas como lidas');
  }, [user?.id, notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'user_id' | 'timestamp'>) => {
    if (!user) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      user_id: user.id,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
  }, [user?.id]);

  // Buscar notificações quando o usuário mudar
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    refetch: fetchNotifications
  };
};
