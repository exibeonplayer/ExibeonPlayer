import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'promotion' | 'maintenance' | 'warning' | 'update';
  target_user_id?: string;
  sent_by: string;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface SendNotificationData {
  title: string;
  message: string;
  type: 'system' | 'promotion' | 'maintenance' | 'warning' | 'update';
  target_user_id?: string; // undefined = todos os usuários
  expires_at?: string;
}

export const useSystemNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [users, setUsers] = useState<Array<{id: string, email: string, full_name?: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Verificar se o usuário é master
  const [isMaster, setIsMaster] = useState(false);

  const checkMasterStatus = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_master')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Error checking master status:', error);
        return false;
      }

      return data?.is_master || false;
    } catch (error) {
      console.error('Error checking master status:', error);
      return false;
    }
  }, [user?.id]);

  // Buscar notificações do sistema
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filtrar notificações expiradas
      const now = new Date();
      const validNotifications = (data || []).filter(notif => 
        !notif.expires_at || new Date(notif.expires_at) > now
      );

      setNotifications(validNotifications);
    } catch (error) {
      console.error('Error fetching system notifications:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notificações do sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Buscar usuários (apenas para masters)
  const fetchUsers = useCallback(async () => {
    if (!user || !isMaster) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, name')
        .order('email');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [user?.id, isMaster]);

  // Enviar notificação
  const sendNotification = useCallback(async (notificationData: SendNotificationData) => {
    if (!user || !isMaster) {
      toast({
        title: "Erro",
        description: "Apenas usuários master podem enviar notificações",
        variant: "destructive",
      });
      return false;
    }

    try {
      setSending(true);

      const { error } = await supabase
        .from('system_notifications')
        .insert([{
          ...notificationData,
          sent_by: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: notificationData.target_user_id 
          ? "Notificação enviada para o usuário selecionado"
          : "Notificação enviada para todos os usuários",
      });

      // Recarregar notificações
      await fetchNotifications();
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação",
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [user?.id, isMaster, toast, fetchNotifications]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .or(`target_user_id.eq.${user.id},target_user_id.is.null`);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ read_at: new Date().toISOString() })
        .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  // Deletar notificação (apenas masters)
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user || !isMaster) return;

    try {
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('sent_by', user.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      toast({
        title: "Sucesso",
        description: "Notificação removida",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover notificação",
        variant: "destructive",
      });
    }
  }, [user?.id, isMaster, toast]);

  // Inicializar
  useEffect(() => {
    const initialize = async () => {
      if (user) {
        const masterStatus = await checkMasterStatus();
        setIsMaster(masterStatus);
        
        await fetchNotifications();
        
        if (masterStatus) {
          await fetchUsers();
        }
      }
    };

    initialize();
  }, [user?.id, checkMasterStatus, fetchNotifications, fetchUsers]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return {
    notifications,
    users,
    unreadCount,
    loading,
    sending,
    isMaster,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
};
