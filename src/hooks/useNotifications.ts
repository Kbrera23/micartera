import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NotificationSettings {
  daily_reminder: boolean;
  daily_reminder_time: string;
  budget_alerts: boolean;
  budget_threshold: number;
  goal_reminders: boolean;
  recurring_alerts: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const sendLocalNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  };

  const requestPermission = async () => {
    if (!messaging) {
      toast.error('Las notificaciones no están disponibles en este navegador');
      return 'denied' as NotificationPermission;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted' && user) {
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
        });

        if (token) {
          await (supabase as any).from('notification_tokens').upsert({
            user_id: user.id,
            token,
            device_info: navigator.userAgent,
            last_used_at: new Date().toISOString(),
          });
          toast.success('Notificaciones activadas');
        }
      }

      return perm;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error al activar notificaciones');
      return 'denied' as NotificationPermission;
    }
  };

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      } else {
        const defaultSettings: NotificationSettings = {
          daily_reminder: true,
          daily_reminder_time: '20:00',
          budget_alerts: true,
          budget_threshold: 80,
          goal_reminders: true,
          recurring_alerts: true,
        };

        const { data: newSettings } = await (supabase as any)
          .from('notification_settings')
          .insert({ user_id: user.id, ...defaultSettings })
          .select()
          .single();

        setSettings(newSettings || defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!user || !settings) return;

    try {
      const { error } = await (supabase as any)
        .from('notification_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      setSettings({ ...settings, ...updates });
      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar');
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging || permission !== 'granted') return;

    const unsubscribe = onMessage(messaging, (payload) => {
      if (payload.notification) {
        sendLocalNotification(
          payload.notification.title || 'Notificación',
          payload.notification.body || ''
        );
      }
    });

    return () => unsubscribe();
  }, [permission]);

  // Daily reminder check
  useEffect(() => {
    if (!settings?.daily_reminder) return;

    const checkReminder = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime === settings.daily_reminder_time) {
        const lastSent = localStorage.getItem('last-daily-reminder');
        const today = now.toDateString();

        if (lastSent !== today) {
          sendLocalNotification('⏰ Recordatorio diario', '¿Registraste tus gastos de hoy?');
          localStorage.setItem('last-daily-reminder', today);
        }
      }
    };

    const interval = setInterval(checkReminder, 60000);
    checkReminder();

    return () => clearInterval(interval);
  }, [settings]);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      console.log('Permission on load:', Notification.permission);
      setPermission(Notification.permission);
    }
    loadSettings();
  }, [user]);

  return {
    permission,
    settings,
    loading,
    requestPermission,
    updateSettings,
    sendLocalNotification,
  };
};
