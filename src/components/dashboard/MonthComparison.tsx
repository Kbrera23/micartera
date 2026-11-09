import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { Expense, Category } from '@/hooks/useSupabaseFinances';

/**
 * Comparativa del mes: gasto de este mes vs tu media mensual y/o el mes anterior,
 * con desglose por categorías. Selector sutil para elegir la base de comparación.
 *
 * Nota: el mes en curso es parcial (vas por el día X), así que al compararlo con
 * una media de meses completos saldrá "por debajo" al principio de mes. Se avisa
 * en la propia tarjeta.
 */

type Base = 'media' | 'anterior' | 'ambas';

interface Props {
  expenses: Expense[];
  categories: Category[];
}

const keyOf = (d: string) => (d || '').slice(0, 7); // AAAA-MM

export const MonthComparison = ({ expenses, categories }: Props) => {
  const [base, setBase] = useState<Base>('media');

  const data = useMemo(() => {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const catName = (id?: string | null) =>
      (id && categories.find(c => c.id === id)?.name) || 'Sin categoría';

    // Agrupar gasto por mes y por categoría (ignorando registros de pago de fijos)
    const byMonth = new Map<string, { total: number; cat: Map<string, number> }>();
    for (const e of expenses) {
      if (e.is_payment_record) continue;
      const amount = Number(e.amount || 0);
      if (!(amount > 0)) continue;
      const k = keyOf(e.created_at);
      if (!k) continue;
      if (!byMonth.has(k)) byMonth.set(k, { total: 0, cat: new Map() });
      const m = byMonth.get(k)!;
      const cn2 = catName(e.category_id);
      m.total += amount;
      m.cat.set(cn2, (m.cat.get(cn2) || 0) + amount);
    }

    const cur = byMonth.get(nowKey) || { total: 0, cat: new Map<string, number>() };
    const prevM = byMonth.get(prevKey) || { total: 0, cat: new Map<string, number>() };

    // Media de meses PASADOS (excluye el mes en curso, que es parcial)
    const pastKeys = Array.from(byMonth.keys()).filter(k => k !== nowKey);
    const nMeses = pastKeys.length || 1;
    const avgTotal = pastKeys.reduce((s, k) => s + (byMonth.get(k)?.total || 0), 0) / nMeses;
    const avgCat = new Map<string, number>();
    for (const k of pastKeys) {
      for (const [c, v] of byMonth.get(k)!.cat) avgCat.set(c, (avgCat.get(c) || 0) + v);
    }
    for (const [c, v] of avgCat) avgCat.set(c, v / nMeses);

    // Categorías a mostrar: las de mayor gasto este mes (máx 6)
    const cats = Array.from(cur.cat.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nombre, actual]) => ({
        nombre,
        actual,
        media: avgCat.get(nombre) || 0,
        anterior: prevM.cat.get(nombre) || 0,
      }));

    return {
      nMeses: pastKeys.length,
      total: { actual: cur.total, media: avgTotal, anterior: prevM.total },
      cats,
    };
  }, [expenses, categories]);

  const pct = (actual: number, ref: number) => {
    if (ref > 0) return ((actual - ref) / ref) * 100;
    return actual > 0 ? 100 : 0;
  };

  const Delta = ({ actual, ref, label }: { actual: number; ref: number; label: string }) => {
    const p = pct(actual, ref);
    const up = p > 1, down = p < -1;
    const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium',
        up ? 'text-destructive' : down ? 'text-income' : 'text-muted-foreground')}>
        <Icon className="w-3.5 h-3.5" />
        {p > 0 ? '+' : ''}{p.toFixed(0)}%
        <span className="text-muted-foreground font-normal">{label}</span>
      </span>
    );
  };

  const showMedia = base === 'media' || base === 'ambas';
  const showAnterior = base === 'anterior' || base === 'ambas';

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BarChart3 className="w-4 h-4 text-primary" />
          Cómo va el mes
        </div>
        <select
          value={base}
          onChange={e => setBase(e.target.value as Base)}
          className="h-8 rounded-lg text-xs px-2 bg-transparent border border-white/10 text-muted-foreground"
        >
          <option value="media">vs tu media</option>
          <option value="anterior">vs mes anterior</option>
          <option value="ambas">ver las dos</option>
        </select>
      </div>

      {/* Total del mes */}
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Gastado este mes (en curso)</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(data.total.actual)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {showMedia && <Delta actual={data.total.actual} ref={data.total.media} label="vs media" />}
          {showAnterior && <Delta actual={data.total.actual} ref={data.total.anterior} label="vs mes ant." />}
        </div>
      </div>

      {/* Por categorías */}
      {data.cats.length > 0 && (
        <div className="divide-y divide-white/5 pt-1">
          {data.cats.map(c => (
            <div key={c.nombre} className="flex items-center justify-between py-2 gap-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(c.actual)}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                {showMedia && <Delta actual={c.actual} ref={c.media} label="media" />}
                {showAnterior && <Delta actual={c.actual} ref={c.anterior} label="mes ant." />}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        El mes en curso es parcial, así que al principio verás menos que tu media. Media sobre {data.nMeses} {data.nMeses === 1 ? 'mes' : 'meses'} anteriores.
      </p>
    </div>
  );
};
