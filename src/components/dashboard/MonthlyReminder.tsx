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
}

export const MonthlyReminder = ({ quarterlyProvision }: MonthlyReminderProps) => {
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
      setIsCompleted(true);
      toast.success('✅ Recordatorio completado');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al marcar como completado');
    }
  };

  if (loading || isCompleted || quarterlyProvision <= 0) return null;

  return (
    <Card className="border-none shadow-md rounded-2xl bg-[#191C1F] text-white">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90">Recordatorio mensual</p>
          <p className="text-xs text-white/60">Mover a Revolut para gastos trimestrales</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold">{formatCurrencyCompact(quarterlyProvision)}</span>
          <ArrowRight className="w-4 h-4 text-white/60" />
          <Button
            size="sm"
            onClick={handleDone}
            className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Hecho
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
