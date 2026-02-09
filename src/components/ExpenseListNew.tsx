import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Repeat, Calendar } from 'lucide-react';
import { Expense, ExpenseFrequency } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

const getMonthlyAmount = (amount: number, frequency: ExpenseFrequency): number => {
  switch (frequency) {
    case 'quarterly': return amount / 3;
    case 'annual': return amount / 12;
    default: return amount;
  }
};

interface ExpenseListProps {
  title: string;
  expenses: Expense[];
  total: number;
  isRecurring: boolean;
  onRemove: (id: string) => void;
  showFrequency?: boolean;
}

const FrequencyBadge = ({ frequency }: { frequency: ExpenseFrequency }) => {
  const config: Record<ExpenseFrequency, { label: string; className: string }> = {
    monthly: { label: 'Mensual', className: 'bg-recurring/20 text-recurring border-recurring/30' },
    quarterly: { label: 'Trimestral', className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
    annual: { label: 'Anual', className: 'bg-goal/20 text-goal border-goal/30' }
  };

  const { label, className } = config[frequency];

  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', className)}>
      {label}
    </Badge>
  );
};

export const ExpenseListNew = ({
  title,
  expenses,
  total,
  isRecurring,
  onRemove,
  showFrequency = false
}: ExpenseListProps) => {
  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            {isRecurring ? (
              <div className="p-2 rounded-xl bg-recurring-light">
                <Repeat className="h-5 w-5 text-recurring" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-expense-light">
                <Calendar className="h-5 w-5 text-expense" />
              </div>
            )}
            {title}
          </CardTitle>
          <span className={cn(
            'text-lg font-bold',
            isRecurring ? 'text-recurring' : 'text-expense'
          )}>
            {formatCurrencyCompact(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">
            No hay gastos {isRecurring ? 'recurrentes' : 'únicos'}
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{expense.name}</span>
                    {showFrequency && expense.frequency && (
                      <FrequencyBadge frequency={expense.frequency} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-semibold whitespace-nowrap">
                    {formatCurrencyCompact(isRecurring ? getMonthlyAmount(expense.amount, expense.frequency) : expense.amount)}
                    {isRecurring && expense.frequency !== 'monthly' && (
                      <span className="text-[10px] text-muted-foreground ml-1">/mes</span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => onRemove(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
