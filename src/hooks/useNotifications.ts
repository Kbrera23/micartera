import { useState, useEffect, useCallback } from 'react';
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

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const platform = (navigator as any).platform || 'unknown';
  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  return `${browser} - ${platform}`;
};

export const isNotificationSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[notifications] Service Workers not supported');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.log('[notifications] SW registered', reg.scope);
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error('[notifications] SW registration failed:', err);
    return null;
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const sendLocalNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' });
    }
  };

  const fetchAndStoreToken = useCallback(
    async (uid: string) => {
      if (!messaging) return null;
      const reg = await registerServiceWorker();
      if (!reg) {
        toast.error('Error al registrar el servicio de notificaciones');
        return null;
      }

      let attempts = 0;
      let token: string | null = null;
      while (attempts < 3 && !token) {
        try {
          token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: reg,
          });
        } catch (err) {
          console.error(`[notifications] getToken attempt ${attempts + 1} failed:`, err);
        }
        attempts++;
        if (!token && attempts < 3) await new Promise((r) => setTimeout(r, 800));
      }

      if (!token) {
        toast.error('No se pudo obtener el token de notificaciones');
        return null;
      }

      const now = new Date().toISOString();
      const { error } = await (supabase as any).from('notification_tokens').upsert(
        {
          user_id: uid,
          token,
          device_info: getDeviceInfo(),
          last_used_at: now,
        },
        { onConflict: 'user_id,token' }
      );
      if (error) console.error('[notifications] upsert token error:', error);
      setLastUpdated(now);
      return token;
    },
    []
  );

  const requestPermission = async () => {
    if (!isNotificationSupported()) {
      toast.error('Tu navegador no soporta notificaciones');
      setSupported(false);
      return 'denied' as NotificationPermission;
    }
    if (!messaging) {
      toast.error('Firebase Messaging no disponible en este navegador');
      return 'denied' as NotificationPermission;
    }

    const current = Notification.permission;
    if (current === 'denied') {
      toast.error('Notificaciones bloqueadas. Desbloquéalas en la configuración del navegador');
      setPermission('denied');
      return current;
    }
    if (current === 'granted') {
      setPermission('granted');
      if (user) await fetchAndStoreToken(user.id);
      toast.success('✓ Notificaciones ya activadas');
      return current;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        if (user) {
          const token = await fetchAndStoreToken(user.id);
          if (token) toast.success('✓ Notificaciones activadas correctamente');
        }
      } else if (perm === 'denied') {
        toast.error('✗ Permiso rechazado. Las notificaciones están deshabilitadas');
      } else {
        toast('Permiso pendiente');
      }
      return perm;
    } catch (error) {
      console.error('[notifications] requestPermission error:', error);
      toast.error('Error al activar notificaciones');
      return 'denied' as NotificationPermission;
    }
  };

  const loadSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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

      // Load last token timestamp
      const { data: tokenRow } = await (supabase as any)
        .from('notification_tokens')
        .select('last_used_at')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tokenRow?.last_used_at) setLastUpdated(tokenRow.last_used_at);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  // Foreground messages
  useEffect(() => {
    if (!messaging || permission !== 'granted') return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[notifications] Foreground message:', payload);
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

  // Mount: detect support + permission, register SW eagerly if granted
  useEffect(() => {
    if (!isNotificationSupported()) {
      setSupported(false);
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission === 'granted' && user) {
      fetchAndStoreToken(user.id);
    }
    loadSettings();
  }, [loadSettings, user, fetchAndStoreToken]);

  return {
    permission,
    settings,
    loading,
    supported,
    lastUpdated,
    requestPermission,
    updateSettings,
    sendLocalNotification,
  };
};
