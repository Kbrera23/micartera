import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, ArrowRight, Undo2 } from 'lucide-react';
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
  const [acceptedAmount, setAcceptedAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  useEffect(() => {
    if (!user) return;
    const checkCompleted = async () => {
      const { data } = await supabase
        .from('savings_log')
        .select('cantidad')
        .eq('user_id', user.id)
        .eq('tipo', 'entrenador')
        .eq('mes', currentMonth)
        .eq('anio', currentYear)
        .maybeSingle();
      setIsCompleted(!!data);
      setAcceptedAmount(Number(data?.cantidad || 0));
      setLoading(false);
    };
    checkCompleted();
  }, [user, currentMonth, currentYear]);

  const handleDone = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('savings_log')
        .upsert(
          {
            user_id: user.id,
            tipo: 'entrenador',
            destino: 'revolut',
            cantidad: quarterlyProvision,
            mes: currentMonth,
            anio: currentYear,
          },
          { onConflict: 'user_id,tipo,mes,anio' }
        );
      if (error) throw error;

      setIsCompleted(true);
      setAcceptedAmount(quarterlyProvision);
      toast.success('✅ Provisión aceptada');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al marcar como completado');
    }
  };

  const handleUndo = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('savings_log')
        .delete()
        .eq('user_id', user.id)
        .eq('tipo', 'entrenador')
        .eq('mes', currentMonth)
        .eq('anio', currentYear);
      if (error) throw error;
      setIsCompleted(false);
      setAcceptedAmount(0);
      toast.success('Provisión deshecha');
      refetch();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al deshacer');
    }
  };

  if (loading) return null;
  if (!isCompleted && quarterlyProvision <= 0) return null;

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
          <span className="text-lg font-bold font-mono">
            {formatCurrencyCompact(isCompleted ? acceptedAmount : quarterlyProvision)}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Hecho ✓
              </span>
              <Button size="sm" variant="outline" onClick={handleUndo} className="text-xs flex items-center gap-1">
                <Undo2 className="w-3.5 h-3.5" />
                Deshacer
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleDone}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 text-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Hecho
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
