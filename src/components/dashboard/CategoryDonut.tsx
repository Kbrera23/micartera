import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { Expense, Category } from '@/hooks/useSupabaseFinances';

/**
 * Gasto por categoría del último mes con datos, como donut.
 * Usa el color de cada categoría. Al lado, lista compacta con importe y %.
 */

interface Props {
  expenses: Expense[];
  categories: Category[];
}

const keyOf = (d: string) => (d || '').slice(0, 7);
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const SIN_CAT = { name: 'Sin categoría', color: '#64748b' };

export const CategoryDonut = ({ expenses, categories }: Props) => {
  const { data, total, mesLabel } = useMemo(() => {
    const catById = new Map(categories.map(c => [c.id, c]));

    // Agrupar por mes → categoría
    const byMonth = new Map<string, Map<string, number>>();
    for (const e of expenses) {
      if (e.is_payment_record) continue;
      const amt = Number(e.amount || 0);
      if (!(amt > 0)) continue;
      const k = keyOf(e.created_at);
      if (!k) continue;
      if (!byMonth.has(k)) byMonth.set(k, new Map());
      const cid = e.category_id || '__sin__';
      const m = byMonth.get(k)!;
      m.set(cid, (m.get(cid) || 0) + amt);
    }

    const keysDesc = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));
    const mesKey = keysDesc[0] || '';
    const mesMap = byMonth.get(mesKey) || new Map<string, number>();

    const arr = Array.from(mesMap.entries())
      .map(([cid, value]) => {
        const cat = catById.get(cid);
        return {
          name: cat?.name || SIN_CAT.name,
          color: cat?.color || SIN_CAT.color,
          value,
        };
      })
      .sort((a, b) => b.value - a.value);

    const total = arr.reduce((s, x) => s + x.value, 0);

    let mesLabel = '';
    const [y, m] = mesKey.split('-');
    if (m) {
      const n = MESES_ES[parseInt(m) - 1] || '';
      mesLabel = `${n.charAt(0).toUpperCase()}${n.slice(1)} ${y}`;
    }

    return { data: arr, total, mesLabel };
  }, [expenses, categories]);

  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <PieIcon className="w-4 h-4 text-primary" />
        Gasto por categoría{mesLabel ? ` · ${mesLabel}` : ''}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Donut */}
        <div className="relative w-[180px] h-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={85}
                paddingAngle={1}
                stroke="none"
              >
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ background: 'hsl(200 40% 11%)', border: '1px solid hsl(186 60% 50% / 0.2)', borderRadius: 12, fontSize: 12 }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total en el centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-muted-foreground">Total</span>
            <span className="text-base font-bold text-foreground">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Leyenda / lista */}
        <div className="flex-1 w-full space-y-1.5">
          {data.slice(0, 7).map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-foreground truncate flex-1">{d.name}</span>
                <span className="text-muted-foreground tabular-nums">{formatCurrency(d.value)}</span>
                <span className="text-muted-foreground/60 text-xs w-10 text-right tabular-nums">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
