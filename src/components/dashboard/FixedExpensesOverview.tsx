import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import type { Expense } from '@/hooks/useSupabaseFinances';

/**
 * Vista informativa de gastos fijos (3.C.4 — Modelo A).
 *
 * SOLO INFORMATIVO: lista tus compromisos fijos mensuales para tenerlos a la vista.
 * No resta nada aquí — cada fijo ya está contado en su sitio (el alquiler vía perfil,
 * Netflix/Digi vía su transferencia a ING, etc.). Es un resumen, no un cálculo nuevo.
 */

interface InternalCharge {
  nombre: string;
  banco: string;
  cantidad: number;
  frecuencia: string;
  activa: boolean;
}

interface Item {
  nombre: string;
  cantidad: number;
  periodo: string;       // etiqueta visible
  mensual: number;       // equivalente mensual para el total
}

interface Props {
  rent: number;
  recurringExpenses: Expense[];
}

const freqLabel = (f: string) =>
  f === 'quarterly' ? 'trimestral' : f === 'annual' ? 'anual' : 'mensual';

const mensualDe = (amount: number, freq: string) =>
  freq === 'quarterly' ? amount / 3 : freq === 'annual' ? amount / 12 : amount;

export const FixedExpensesOverview = ({ rent, recurringExpenses }: Props) => {
  const { user } = useAuth();
  const [charges, setCharges] = useState<InternalCharge[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('internal_charges')
          .select('*')
          .eq('user_id', user.id)
          .eq('activa', true);
        if (!cancelled) setCharges((data || []) as InternalCharge[]);
      } catch (e) {
        console.error('Error cargando gastos fijos', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const items: Item[] = [];

  if (rent > 0) {
    items.push({ nombre: 'Alquiler', cantidad: rent, periodo: 'mensual', mensual: rent });
  }

  for (const e of recurringExpenses) {
    const freq = (e.frequency as string) || 'monthly';
    items.push({
      nombre: e.name,
      cantidad: e.amount,
      periodo: freqLabel(freq),
      mensual: mensualDe(e.amount, freq),
    });
  }

  for (const c of charges) {
    const esTrimestral = c.frecuencia === 'trimestral' || c.frecuencia === 'manual';
    items.push({
      nombre: c.nombre,
      cantidad: c.cantidad,
      periodo: esTrimestral ? 'trimestral' : 'mensual',
      mensual: esTrimestral ? c.cantidad / 3 : c.cantidad,
    });
  }

  if (!items.length) return null;

  const totalMensual = items.reduce((s, i) => s + i.mensual, 0);

  return (
    <Card className="glass-card border-0 rounded-2xl animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ListChecks className="w-4 h-4 text-primary" />
            Gastos fijos mensuales
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
            informativo
          </Badge>
        </div>

        <div className="divide-y divide-white/5">
          {items.map((i, idx) => (
            <div key={`${i.nombre}-${idx}`} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">
                {i.nombre}
                {i.periodo !== 'mensual' && (
                  <span className="text-xs text-muted-foreground"> · {i.periodo}</span>
                )}
              </span>
              <span className="text-sm font-mono text-muted-foreground">
                {formatCurrency(i.cantidad)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">Equivalente mensual aproximado</span>
          <span className="text-sm font-semibold font-mono text-foreground">{formatCurrency(totalMensual)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Solo informativo. Estos fijos ya están contados en su sitio; aquí no se vuelven a restar.
        </p>
      </CardContent>
    </Card>
  );
};
