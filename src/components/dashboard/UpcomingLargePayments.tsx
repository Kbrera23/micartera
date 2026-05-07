import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Expense } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const nonMonthly = recurringExpenses.filter(e => e.frequency !== 'monthly');

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

  // Only show payments due in the current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const paymentsThisMonth = nonMonthly
    .map(expense => {
      const nextDate = getNextPaymentDate(expense);
      return { ...expense, nextDate, daysUntil: Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) };
    })
    .filter(p => p.nextDate.getMonth() === currentMonth && p.nextDate.getFullYear() === currentYear)
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
    .slice(0, 3);

  if (paymentsThisMonth.length === 0) return null;

  const handleMarkAsPaid = async (expense: Expense & { nextDate: Date }) => {
    if (!user) return;
    try {
      const label = expense.frequency === 'quarterly' ? 'trimestral' : 'anual';

      // 1. Insert one-time payment record
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          name: `${expense.name} (pago ${label})`,
          amount: expense.amount,
          is_recurring: false,
          frequency: 'monthly',
          category_id: expense.category_id ?? null,
          user_id: user.id,
          // @ts-ignore
          is_payment_record: true,
        });
      if (insertError) throw insertError;

      // 2. Register in tracking table so it subtracts from dineroLibre
      const today = new Date();
      const { error: trackingError } = await supabase
        .from('monthly_payments_tracking' as any)
        .insert({
          user_id: user.id,
          payment_type: `expense_payment_${expense.id}`,
          amount: expense.amount,
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          paid_date: today.toISOString().split('T')[0],
        });
      if (trackingError) console.warn('Tracking insert warning:', trackingError);

      // 3. Update last_payment_date on the recurring expense
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ last_payment_date: today.toISOString().split('T')[0] } as any)
        .eq('id', expense.id);
      if (updateError) throw updateError;

      // 4. Calculate next date for toast
      const nextDate = new Date(today);
      if (expense.frequency === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

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
        {paymentsThisMonth.map(payment => {
          const isUrgent = payment.daysUntil <= 7;
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