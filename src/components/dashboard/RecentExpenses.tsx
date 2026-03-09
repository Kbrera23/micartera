import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border-none shadow-md rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="p-2 rounded-xl bg-primary/10">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          Últimos Gastos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.map(expense => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
          >
            <span className="font-medium text-sm truncate flex-1">{expense.name}</span>
            <span className="font-semibold text-sm ml-3 text-foreground whitespace-nowrap">
              {formatCurrencyCompact(expense.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
