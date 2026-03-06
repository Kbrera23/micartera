import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Expense } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpcomingLargePaymentsProps {
  recurringExpenses: Expense[];
  onAddExpense: (
    name: string,
    amount: number,
    isRecurring: boolean,
    frequency: 'monthly' | 'quarterly' | 'annual',
    bank: null
  ) => Promise<void>;
  refetch: () => void;
}

export const UpcomingLargePayments = ({ recurringExpenses, onAddExpense, refetch }: UpcomingLargePaymentsProps) => {
  const nonMonthly = recurringExpenses.filter(e => e.frequency !== 'monthly');

  if (nonMonthly.length === 0) return null;

  const getNextPaymentDate = (expense: Expense): Date => {
    const base = expense.last_payment_date
      ? new Date(expense.last_payment_date)
      : new Date();
    const next = new Date(base);
    if (expense.frequency === 'quarterly') {
      next.setMonth(next.getMonth() + 3);
    } else if (expense.frequency === 'annual') {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next;
  };

  const getDaysUntilPayment = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      const label = expense.frequency === 'quarterly' ? 'trimestral' : 'anual';
      await onAddExpense(
        `${expense.name} (pago ${label})`,
        expense.amount,
        false,
        'monthly',
        null
      );

      const today = new Date();
      const nextDate = new Date(today);
      if (expense.frequency === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (expense.frequency === 'annual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          last_payment_date: today.toISOString().split('T')[0],
        } as any)
        .eq('id', expense.id);

      if (error) throw error;

      toast.success(
        `✅ Pago registrado. Próximo: ${nextDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`
      );

      refetch();
    } catch (err) {
      console.error('Error al marcar pago:', err);
      toast.error('Error al registrar el pago');
    }
  };

  const paymentsWithDates = nonMonthly
    .map(expense => {
      const nextDate = getNextPaymentDate(expense);
      return {
        ...expense,
        nextDate,
        daysUntil: getDaysUntilPayment(nextDate),
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
                'flex items-center justify-between p-3 rounded-xl gap-2',
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
              <span className={cn('font-bold text-sm', isUrgent ? 'text-destructive' : 'text-foreground')}>
                {formatCurrencyCompact(payment.amount)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs flex items-center gap-1 shrink-0"
                onClick={() => handleMarkAsPaid(payment)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pagado
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
