import { Receipt } from 'lucide-react';
import { Expense } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';

interface RecentExpensesProps {
  expenses: Expense[];
}

export const RecentExpenses = ({ expenses }: RecentExpensesProps) => {
  const recent = expenses.filter(e => !e.is_payment_record).slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">Últimos Gastos</h3>
      </div>
      <div className="px-5 pb-5 space-y-1">
        {recent.map(expense => (
          <div
            key={expense.id}
            className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm font-medium truncate flex-1">{expense.name}</span>
            <span className="text-sm font-bold font-mono ml-3 whitespace-nowrap">
              {formatCurrencyCompact(expense.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
