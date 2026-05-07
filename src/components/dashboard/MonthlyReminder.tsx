import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyCompact } from '@/lib/currency';
import { toast } from 'sonner';

interface MonthlyReminderProps {
  quarterlyProvision: number;
  refetch: () => void;
}

export const MonthlyReminder = ({ quarterlyProvision, refetch }: MonthlyReminderProps) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  useEffect(() => {
    if (!user) return;
    const checkCompleted = async () => {
      const { data } = await supabase
        .from('monthly_reminders_completed' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('reminder_type', 'revolut_transfer')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();
      setIsCompleted(!!data);
      setLoading(false);
    };
    checkCompleted();
  }, [user, currentMonth, currentYear]);

  const handleDone = async () => {
    if (!user) return;
    try {
      // 1. Mark reminder as completed
      const { error } = await supabase
        .from('monthly_reminders_completed' as any)
        .insert({
          user_id: user.id,
          reminder_type: 'revolut_transfer',
          completed_date: today.toISOString().split('T')[0],
          month: currentMonth,
          year: currentYear,
        });
      if (error) throw error;

      // 2. Register payment in tracking table so it subtracts from dineroLibre
      const { error: trackingError } = await supabase
        .from('monthly_payments_tracking' as any)
        .insert({
          user_id: user.id,
          payment_type: 'quarterly_provision',
          amount: quarterlyProvision,
          month: currentMonth,
          year: currentYear,
          paid_date: today.toISOString().split('T')[0],
        });
      if (trackingError) throw trackingError;

      setIsCompleted(true);
      toast.success('✅ Recordatorio completado');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al marcar como completado');
    }
  };

  if (loading || isCompleted || quarterlyProvision <= 0) return null;

  return (
    <Card
      className="glass-card border-0 rounded-2xl text-foreground animate-fade-in"
      style={{ borderColor: 'hsl(186 100% 50% / 0.15)', borderWidth: 1, borderStyle: 'solid' }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'hsl(186 100% 50% / 0.12)', color: 'hsl(186 100% 70%)' }}
        >
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Recordatorio mensual</p>
          <p className="text-xs text-muted-foreground">Mover a Revolut para gastos trimestrales</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold font-mono">{formatCurrencyCompact(quarterlyProvision)}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <Button
            size="sm"
            onClick={handleDone}
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 text-xs flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Hecho
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
