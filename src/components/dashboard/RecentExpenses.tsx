import { Receipt } from 'lucide-react';
import { Expense, Category } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface RecentExpensesProps {
  expenses: Expense[];
  categories?: Category[];
}

export const RecentExpenses = ({ expenses, categories = [] }: RecentExpensesProps) => {
  const recent = expenses.filter(e => !e.is_payment_record).slice(0, 5);

  if (recent.length === 0) return null;

  const getCategory = (id?: string | null) =>
    id ? categories.find(c => c.id === id) : undefined;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Últimos Gastos</h3>
      </div>

      <div className="grid gap-2">
        {recent.map((expense, idx) => {
          const cat = getCategory(expense.category_id);
          const isIncome = Number(expense.amount) < 0;
          const amountColor = isIncome ? 'text-emerald-400' : 'text-red-400';
          const sign = isIncome ? '+' : '−';

          return (
            <div
              key={expense.id}
              className={cn(
                'glass-card rounded-2xl px-4 py-3 flex items-center gap-3',
                'transition-all duration-300 hover:-translate-y-0.5 animate-fade-in'
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  backgroundColor: cat ? `${cat.color}25` : 'hsl(186 100% 50% / 0.1)',
                }}
              >
                {cat?.icon ?? '💸'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{expense.name}</p>
                {cat && (
                  <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
                )}
              </div>
              <span className={cn('text-sm font-bold font-mono whitespace-nowrap', amountColor)}>
                {sign}{formatCurrencyCompact(Math.abs(Number(expense.amount)))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
