import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertCircle } from 'lucide-react';
import { Expense } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface UpcomingLargePaymentsProps {
  recurringExpenses: Expense[];
}

export const UpcomingLargePayments = ({ recurringExpenses }: UpcomingLargePaymentsProps) => {
  const nonMonthly = recurringExpenses.filter(e => e.frequency !== 'monthly');

  if (nonMonthly.length === 0) return null;

  const getNextPaymentDate = (expense: Expense) => {
    const now = new Date();
    if (expense.frequency === 'quarterly') {
      now.setMonth(now.getMonth() + 3);
    } else if (expense.frequency === 'annual') {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now;
  };

  const getDaysUntilPayment = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const paymentsWithDates = nonMonthly
    .map(expense => {
      const nextDate = getNextPaymentDate(expense);
      return {
        ...expense,
        nextDate,
        daysUntil: getDaysUntilPayment(nextDate)
      };
    })
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
    .slice(0, 3);

  return (
    <Card className="border-none shadow-md rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="p-2 rounded-xl bg-primary/10">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          Próximos Pagos Grandes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {paymentsWithDates.map(payment => {
          const isUrgent = payment.daysUntil <= 30;
          return (
            <div
              key={payment.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl',
                isUrgent ? 'bg-destructive/10' : 'bg-muted/50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{payment.name}</span>
                  {isUrgent && <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {payment.nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}
                  <span className={cn(isUrgent ? 'text-destructive font-medium' : '')}>
                    ({payment.daysUntil > 0 ? `en ${payment.daysUntil} días` : 'hoy'})
                  </span>
                </div>
              </div>
              <span className={cn('font-bold text-sm ml-3', isUrgent ? 'text-destructive' : 'text-foreground')}>
                {formatCurrencyCompact(payment.amount)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
