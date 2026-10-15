import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Undo2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';

/**
 * Avisos de cargos internos (3.D — Modelo A).
 *
 * Son las SALIDAS de los bancos destino: lo que ING paga cada mes (Netflix, Digi)
 * y lo que Revolut paga al entrenador (trimestral). Cuando llega la fecha (cargos
 * 'mensual' con día fijo) o siempre (cargos 'manual' sin fecha), se muestra un
 * botón para confirmar que el cargo se ha producido. Al confirmar, se registra en
 * charges_log y el saldo del banco baja esa cantidad.
 */

interface InternalCharge {
  id: string;
  nombre: string;
  banco: string;
  cantidad: number;
  dia_mes: number | null;
  frecuencia: string; // 'mensual' | 'trimestral' | 'manual'
  activa: boolean;
}

interface Props {
  refetch: () => void;
}

const BANCO_LABEL: Record<string, string> = {
  ing: 'ING', revolut: 'Revolut', lacaixa: 'La Caixa', santander: 'Santander', bbva: 'BBVA',
};

export const InternalChargesReminder = ({ refetch }: Props) => {
  const { user } = useAuth();
  const [charges, setCharges] = useState<InternalCharge[]>([]);
  const [confirmados, setConfirmados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const today = new Date();
  const mes = today.getMonth() + 1;
  const anio = today.getFullYear();
  const diaHoy = today.getDate();

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [chargesRes, logRes] = await Promise.all([
        supabase.from('internal_charges').select('*').eq('user_id', user.id).eq('activa', true),
        supabase.from('charges_log').select('nombre').eq('user_id', user.id).eq('mes', mes).eq('anio', anio),
      ]);
      setCharges((chargesRes.data || []) as InternalCharge[]);
      setConfirmados(new Set((logRes.data || []).map(r => String(r.nombre))));
    } catch (e) {
      console.error('Error cargando cargos internos', e);
    } finally {
      setLoading(false);
    }
  }, [user, mes, anio]);

  useEffect(() => { load(); }, [load]);

  const confirmar = async (c: InternalCharge) => {
    if (!user) return;
    setSaving(c.nombre);
    try {
      const { error } = await supabase.from('charges_log').upsert(
        { user_id: user.id, nombre: c.nombre, banco: c.banco, cantidad: c.cantidad, mes, anio },
        { onConflict: 'user_id,nombre,mes,anio' },
      );
      if (error) throw error;
      setConfirmados(prev => new Set(prev).add(c.nombre));
      toast.success(`${c.nombre} cobrado — ${formatCurrency(c.cantidad)} restados de ${BANCO_LABEL[c.banco] || c.banco}`);
      refetch();
    } catch (e) {
      console.error('Error confirmando cargo', e);
      toast.error('No se pudo registrar el cargo');
    } finally {
      setSaving(null);
    }
  };

  const deshacer = async (c: InternalCharge) => {
    if (!user) return;
    setSaving(c.nombre);
    try {
      const { error } = await supabase.from('charges_log')
        .delete().eq('user_id', user.id).eq('nombre', c.nombre).eq('mes', mes).eq('anio', anio);
      if (error) throw error;
      setConfirmados(prev => { const n = new Set(prev); n.delete(c.nombre); return n; });
      toast.success(`${c.nombre} deshecho`);
      refetch();
    } catch (e) {
      console.error('Error deshaciendo cargo', e);
      toast.error('No se pudo deshacer');
    } finally {
      setSaving(null);
    }
  };

  if (loading || !charges.length) return null;

  // Un cargo se muestra si: ya está confirmado este mes (para poder deshacerlo),
  // o es manual (siempre disponible), o es mensual y ya llegó su día.
  const visibles = charges.filter(c => {
    if (confirmados.has(c.nombre)) return true;
    if (c.frecuencia === 'mensual') return c.dia_mes != null && diaHoy >= c.dia_mes;
    return true; // manual / trimestral: botón siempre disponible
  });

  if (!visibles.length) return null;

  return (
    <Card className="glass-card border-0 rounded-2xl animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarClock className="w-4 h-4 text-primary" />
          Cargos a confirmar
        </div>

        {visibles.map(c => {
          const hecho = confirmados.has(c.nombre);
          return (
            <div key={c.id} className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm text-foreground">
                  {c.nombre}{' '}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-500/40 text-sky-400 bg-sky-500/10">
                    {BANCO_LABEL[c.banco] || c.banco}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(c.cantidad)}
                  {c.frecuencia === 'mensual' && c.dia_mes ? ` · día ${c.dia_mes}` : ' · al pagar'}
                </p>
              </div>

              {hecho ? (
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1"
                  disabled={saving === c.nombre} onClick={() => deshacer(c)}>
                  <Undo2 className="w-3.5 h-3.5" /> Deshacer
                </Button>
              ) : (
                <Button size="sm" className="h-8 text-xs gap-1"
                  disabled={saving === c.nombre} onClick={() => confirmar(c)}>
                  <Check className="w-3.5 h-3.5" /> Confirmar cargo
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
