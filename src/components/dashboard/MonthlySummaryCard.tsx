import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { Expense, Category } from '@/hooks/useSupabaseFinances';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface MonthlySummaryCardProps {
  expenses: Expense[];
  categories: Category[];
}

export const MonthlySummaryCard = ({ expenses, categories }: MonthlySummaryCardProps) => {
  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    // Exclude hidden payment records from the user-facing summary
    const visibleExpenses = expenses.filter(e => !e.is_payment_record);

    const inMonth = (e: Expense, month: number, year: number) => {
      const d = new Date(e.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    };

    const currentExpenses = visibleExpenses.filter(e => inMonth(e, currentMonth, currentYear));
    const previousExpenses = visibleExpenses.filter(e => inMonth(e, prevMonth, prevYear));

    const currentTotal = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const previousTotal = previousExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Top category this month
    const totalsByCategory = new Map<string, number>();
    currentExpenses.forEach(e => {
      if (!e.category_id) return;
      totalsByCategory.set(e.category_id, (totalsByCategory.get(e.category_id) || 0) + Number(e.amount));
    });

    let topCategory: { name: string; icon: string; color: string; total: number } | null = null;
    totalsByCategory.forEach((total, categoryId) => {
      const cat = categories.find(c => c.id === categoryId);
      if (!cat) return;
      if (!topCategory || total > topCategory.total) {
        topCategory = { name: cat.name, icon: cat.icon, color: cat.color, total };
      }
    });

    const hasPreviousData = previousExpenses.length > 0;
    const diff = currentTotal - previousTotal;
    const percentChange = hasPreviousData && previousTotal > 0
      ? (diff / previousTotal) * 100
      : 0;

    return {
      currentTotal,
      previousTotal,
      hasPreviousData,
      diff,
      percentChange,
      topCategory,
      hasCurrentData: currentExpenses.length > 0,
    };
  }, [expenses, categories]);

  const isUp = summary.diff > 0;
  const isDown = summary.diff < 0;

  const monthName = new Date().toLocaleDateString('es-ES', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div
      className={cn(
        'glass-card-elevated relative overflow-hidden rounded-2xl',
        'animate-fade-in transition-all duration-300 hover:-translate-y-0.5'
      )}
    >
      {/* Subtle cyan accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: 'hsl(186 100% 50% / 0.08)' }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" style={{ color: 'hsl(186 100% 60%)' }} />
              Resumen del mes
            </div>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{capitalizedMonth}</h3>
          </div>

          {summary.hasPreviousData ? (
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md border',
                isUp && 'bg-red-500/10 text-red-400 border-red-500/20',
                isDown && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                !isUp && !isDown && 'bg-white/5 text-muted-foreground border-white/10'
              )}
            >
              {isUp && <TrendingUp className="h-3.5 w-3.5" />}
              {isDown && <TrendingDown className="h-3.5 w-3.5" />}
              {!isUp && !isDown && <Minus className="h-3.5 w-3.5" />}
              {Math.abs(summary.percentChange).toFixed(1)}%
            </div>
          ) : (
            <div
              className="rounded-full px-3 py-1.5 text-xs font-semibold border"
              style={{ background: 'hsl(186 100% 50% / 0.1)', color: 'hsl(186 100% 70%)', borderColor: 'hsl(186 100% 50% / 0.2)' }}
            >
              Primer mes registrado
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Gastado este mes</p>
            <p className="mt-1 text-2xl font-bold text-foreground font-mono">
              {formatCurrency(summary.currentTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Mes anterior</p>
            <p className="mt-1 text-2xl font-bold text-muted-foreground/60 font-mono">
              {summary.hasPreviousData ? formatCurrency(summary.previousTotal) : '—'}
            </p>
          </div>
        </div>

        {/* Top category */}
        <div className="mt-5 pt-5 border-t border-white/5">
          {summary.topCategory ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${summary.topCategory.color}25` }}
                >
                  {summary.topCategory.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mayor gasto en</p>
                  <p className="text-sm font-semibold text-foreground">{summary.topCategory.name}</p>
                </div>
              </div>
              <p className="text-base font-bold text-foreground font-mono">
                {formatCurrency(summary.topCategory.total)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {summary.hasCurrentData
                ? 'Asigna categorías a tus gastos para ver el desglose.'
                : 'Aún no hay gastos registrados este mes.'}
            </p>
          )}
        </div>

        {/* Comparison message */}
        {summary.hasPreviousData && (
          <p className="mt-4 text-xs text-muted-foreground">
            {isUp && (
              <>Estás gastando <span className="font-semibold text-red-400">{formatCurrency(Math.abs(summary.diff))}</span> más que el mes pasado.</>
            )}
            {isDown && (
              <>Has ahorrado <span className="font-semibold text-emerald-400">{formatCurrency(Math.abs(summary.diff))}</span> respecto al mes pasado.</>
            )}
            {!isUp && !isDown && <>Mismo nivel de gasto que el mes anterior.</>}
          </p>
        )}
      </div>
    </div>
  );
};
