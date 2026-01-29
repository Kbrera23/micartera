import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types/expense';
import { Trash2, RotateCcw, Receipt, RefreshCw } from 'lucide-react';

interface ExpenseListProps {
  title: string;
  expenses: Expense[];
  total: number;
  isRecurring: boolean;
  onRemove: (id: string) => void;
  onToggleRecurring: (id: string) => void;
}

export const ExpenseList = ({
  title,
  expenses,
  total,
  isRecurring,
  onRemove,
  onToggleRecurring
}: ExpenseListProps) => {
  const Icon = isRecurring ? RefreshCw : Receipt;
  const colorClass = isRecurring ? 'recurring' : 'expense';

  return (
    <Card className="glass-card animate-slide-up">
      <div className={`h-2 ${isRecurring ? 'gradient-recurring' : 'gradient-expense'}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <div className={`p-2 rounded-lg bg-${colorClass}-light`}>
              <Icon className={`h-5 w-5 text-${colorClass}`} />
            </div>
            {title}
          </CardTitle>
          <span className={`text-lg font-bold text-${colorClass}`}>
            €{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group animate-fade-in"
              >
                <div className="flex-1">
                  <p className="font-medium">{expense.name}</p>
                  <p className="text-sm text-muted-foreground">
                    €{expense.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
