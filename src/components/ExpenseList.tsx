import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types/expense';
import { Trash2, RotateCcw, Receipt, RefreshCw } from 'lucide-react';
import { FrequencyBadge } from './expenses/FrequencyBadge';

interface ExpenseListProps {
  title: string;
  expenses: Expense[];
  total: number;
  isRecurring: boolean;
  onRemove: (id: string) => void;
  onToggleRecurring: (id: string) => void;
  showFrequency?: boolean;
}

export const ExpenseList = ({
  title,
  expenses,
  total,
  isRecurring,
  onRemove,
  onToggleRecurring,
  showFrequency = true
}: ExpenseListProps) => {
  const Icon = isRecurring ? RefreshCw : Receipt;
  const colorClass = isRecurring ? 'recurring' : 'expense';

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="glass-card animate-slide-up rounded-2xl">
      <div className={`h-2 rounded-t-2xl ${isRecurring ? 'gradient-recurring' : 'gradient-expense'}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <div className={`p-2 rounded-xl bg-${colorClass}-light`}>
              <Icon className={`h-5 w-5 text-${colorClass}`} />
            </div>
            {title}
          </CardTitle>
          <span className={`text-lg font-bold text-${colorClass}`}>
            {formatCurrency(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No hay gastos {isRecurring ? 'recurrentes' : 'únicos'} aún
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group animate-fade-in"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{expense.name}</p>
                    {isRecurring && showFrequency && expense.frequency && (
                      <FrequencyBadge frequency={expense.frequency} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(expense.amount)}
                    {expense.frequency === 'quarterly' && (
                      <span className="ml-1 text-xs text-goal">
                        (€{(expense.amount / 3).toFixed(2)}/mes)
                      </span>
                    )}
                    {expense.frequency === 'annual' && (
                      <span className="ml-1 text-xs text-orange-500">
                        (€{(expense.amount / 12).toFixed(2)}/mes)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleRecurring(expense.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-recurring"
                    title={isRecurring ? 'Marcar como único' : 'Marcar como recurrente'}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(expense.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
