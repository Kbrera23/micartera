import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Check, ArrowRight, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface PendingMovimiento {
  concepto: string;
  importe: number;
  fecha: string | null;
  categoria: string;
  autoCategorized: boolean;
}

interface PendingImport {
  fileName: string;
  createdAt: string;
  movimientos: PendingMovimiento[];
}

interface Props {
  refetch: () => void;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CATEGORY_DEFAULTS: Record<string, { icon: string; color: string }> = {
  'Alimentación':   { icon: '🛒', color: '#10b981' },
  'Suplementación': { icon: '💪', color: '#84cc16' },
  'Transporte':     { icon: '🚌', color: '#3b82f6' },
  'Suscripción':    { icon: '📺', color: '#f59e0b' },
  'Viajes':         { icon: '✈️', color: '#06b6d4' },
  'Salud':          { icon: '💊', color: '#ef4444' },
  'Ocio':           { icon: '🎮', color: '#8b5cf6' },
  'Vivienda':       { icon: '🏠', color: '#f97316' },
  'Servicios':      { icon: '💡', color: '#eab308' },
  'Compras':        { icon: '🛍️', color: '#ec4899' },
  'Ropa':           { icon: '👕', color: '#f472b6' },
  'Otros':          { icon: '📁', color: '#6b7280' },
};
const norm = (s: string) => s.trim().toLocaleLowerCase('es-ES');

export const PendingImportCard = ({ refetch }: Props) => {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const storageKey = user ? `pending_import_${user.id}` : null;

  const load = useCallback(() => {
    if (!storageKey) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) { setPending(null); return; }
    try { setPending(JSON.parse(raw)); } catch { setPending(null); }
  }, [storageKey]);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('storage', handler);
    window.addEventListener('pending-import-updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('pending-import-updated', handler);
    };
  }, [load]);

  // Poll to catch same-tab updates from importer
  useEffect(() => {
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [load]);

  if (!pending || !user || !storageKey) return null;

  const total = pending.movimientos.reduce((s, m) => s + m.importe, 0);
  const sinCategoria = pending.movimientos.filter(m => !m.autoCategorized).length;
  const mesNombre = MESES[new Date(pending.createdAt).getMonth()];

  const handleAccept = async () => {
    setSaving(true);
    try {
      const rows = pending.movimientos.map(m => ({
        user_id: user.id,
        name: m.concepto,
        amount: m.importe,
        is_recurring: false,
        frequency: 'monthly' as const,
        bank: null,
        is_payment_record: false,
        created_at: m.fecha || new Date().toISOString(),
      }));
      const { error } = await supabase.from('expenses').insert(rows);
      if (error) throw error;
      localStorage.removeItem(storageKey);
      setPending(null);
      toast.success(`✓ ${rows.length} gastos importados correctamente`);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los movimientos');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    localStorage.removeItem(storageKey);
    setPending(null);
    toast.info('Importación descartada');
  };

  return (
    <Card
      className="glass-card border-0 rounded-2xl text-foreground animate-fade-in"
      style={{ borderColor: 'hsl(186 100% 50% / 0.15)', borderWidth: 1, borderStyle: 'solid' }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(186 100% 50% / 0.12)', color: 'hsl(186 100% 70%)' }}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Importación de Banco — {mesNombre}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {pending.movimientos.length} movimientos · {pending.fileName}
              {sinCategoria > 0 && (
                <span className="ml-1 text-amber-400">· ⚠ {sinCategoria} sin categoría</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-lg font-bold font-mono text-rose-400">-{formatCurrency(total)}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 text-xs flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              disabled={saving}
              className="text-muted-foreground hover:text-rose-400 h-8 w-8 p-0"
              aria-label="Descartar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ocultar detalles' : 'Ver detalles de los gastos importados'}
        </button>

        {expanded && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border" style={{ borderColor: 'hsl(200 30% 18%)' }}>
            <table className="w-full text-xs">
              <tbody>
                {pending.movimientos.map((m, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'hsl(200 30% 16%)' }}>
                    <td className="px-3 py-2 text-foreground truncate max-w-[220px]" title={m.concepto}>{m.concepto}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.categoria}</td>
                    <td className="px-3 py-2 text-right font-mono text-rose-400">-{formatCurrency(m.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
