import { useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff, BellRing, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-primary' : 'bg-muted'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
};

const UnblockInstructions = () => {
  const browser = useMemo(detectBrowser, []);
  const steps: Record<string, string[]> = {
    chrome: [
      'Haz click en el icono 🔒 junto a la URL',
      'Busca "Notificaciones" y cámbialo a "Permitir"',
      'Recarga esta página',
    ],
    edge: [
      'Haz click en el icono 🔒 junto a la URL',
      'Permisos del sitio → Notificaciones → Permitir',
      'Recarga esta página',
    ],
    firefox: [
      'Haz click en el icono 🔒 junto a la URL',
      'Borra el permiso bloqueado de Notificaciones',
      'Recarga y vuelve a pulsar Activar',
    ],
    safari: [
      'Safari → Ajustes → Sitios web → Notificaciones',
      'Cambia este sitio a "Permitir"',
      'Recarga esta página',
    ],
    other: [
      'Abre la configuración de permisos de tu navegador',
      'Permite notificaciones para este sitio',
      'Recarga la página',
    ],
  };
  return (
    <ol className="mt-2 space-y-1 text-xs text-destructive/90 list-decimal list-inside">
      {steps[browser].map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
};

export const NotificationSettings = () => {
  const { permission, settings, loading, supported, lastUpdated, requestPermission, updateSettings } = useNotifications();

  if (loading) {
    return (
      <Card className="border-none shadow-md rounded-2xl">
        <CardContent className="p-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificaciones
          </div>
          {!supported ? (
            <span className="text-xs font-normal text-muted-foreground">No soportado</span>
          ) : permission === 'granted' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Activado
            </span>
          ) : permission !== 'denied' ? (
            <Button size="sm" onClick={requestPermission} className="rounded-xl h-8 px-4 text-xs gap-1">
              <BellRing className="w-3.5 h-3.5" />
              Activar
            </Button>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!supported && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Tu navegador no soporta notificaciones. Prueba con Chrome, Firefox, Edge o Safari actualizado.
            </p>
          </div>
        )}

        {supported && permission === 'denied' && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <BellOff className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">
                  Notificaciones bloqueadas
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Para activarlas debes desbloquearlas en la configuración del navegador:
                </p>
                <UnblockInstructions />
              </div>
            </div>
          </div>
        )}

        {supported && permission === 'default' && (
          <p className="text-sm text-muted-foreground">
            Activa las notificaciones para recibir recordatorios y alertas de presupuesto.
          </p>
        )}

        {supported && permission === 'granted' && lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Última actualización: {new Date(lastUpdated).toLocaleString('es-ES')}
          </p>
        )}

        {supported && permission === 'granted' && settings && (
          <div className="space-y-4">
            {/* Daily reminder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">⏰ Recordatorio diario</p>
                  <p className="text-xs text-muted-foreground">¿Registraste tus gastos de hoy?</p>
                </div>
                <Toggle
                  checked={settings.daily_reminder}
                  onChange={(v) => updateSettings({ daily_reminder: v })}
                />
              </div>
              {settings.daily_reminder && (
                <input
                  type="time"
                  value={settings.daily_reminder_time}
                  onChange={(e) => updateSettings({ daily_reminder_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Budget alerts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">💰 Alertas de presupuesto</p>
                  <p className="text-xs text-muted-foreground">Cuando excedas el límite</p>
                </div>
                <Toggle
                  checked={settings.budget_alerts}
                  onChange={(v) => updateSettings({ budget_alerts: v })}
                />
              </div>
              {settings.budget_alerts && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Alertar al</span>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={settings.budget_threshold}
                    onChange={(e) => updateSettings({ budget_threshold: parseInt(e.target.value) || 80 })}
                    className="w-16 px-2 py-1 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Goal reminders */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">🎯 Recordatorios de objetivos</p>
                <p className="text-xs text-muted-foreground">Días antes de la fecha límite</p>
              </div>
              <Toggle
                checked={settings.goal_reminders}
                onChange={(v) => updateSettings({ goal_reminders: v })}
              />
            </div>

            <div className="h-px bg-border" />

            {/* Recurring alerts */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">💳 Gastos recurrentes</p>
                <p className="text-xs text-muted-foreground">Próximos pagos</p>
              </div>
              <Toggle
                checked={settings.recurring_alerts}
                onChange={(v) => updateSettings({ recurring_alerts: v })}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
