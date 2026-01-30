import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vault, AlertCircle } from 'lucide-react';
import { Expense } from '@/types/expense';

interface ReserveFundCardProps {
  reserveFund: number;
  nonMonthlyExpenses: Expense[];
}

export const ReserveFundCard = ({ reserveFund, nonMonthlyExpenses }: ReserveFundCardProps) => {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="glass-card rounded-2xl overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-recurring to-recurring/70" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-xl bg-recurring-light">
            <Vault className="h-5 w-5 text-recurring" />
          </div>
          Fondo de Reserva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total provisionado mensual</span>
          <span className="text-2xl font-bold text-recurring">
            {formatCurrency(reserveFund)}
          </span>
        </div>

        {reserveFund > 0 && (
          <div className="p-3 rounded-xl bg-recurring/10 border border-recurring/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-recurring mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Este dinero se descuenta automáticamente para cubrir gastos trimestrales y anuales
              </p>
            </div>
          </div>
        )}

        {nonMonthlyExpenses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Provisiones:</p>
            <ul className="space-y-1.5">
              {nonMonthlyExpenses.map((expense) => {
                const monthlyProvision = expense.frequency === 'quarterly' 
                  ? expense.amount / 3 
                  : expense.amount / 12;
                
                return (
                  <li 
                    key={expense.id}
                    className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                  >
                    <span>{expense.name}</span>
                    <span className="text-recurring font-medium">
                      {formatCurrency(monthlyProvision)}/mes
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {nonMonthlyExpenses.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-2">
            No tienes gastos trimestrales o anuales
          </p>
        )}
      </CardContent>
    </Card>
  );
};
