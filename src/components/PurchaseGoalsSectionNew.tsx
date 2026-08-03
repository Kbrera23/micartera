import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, AlertTriangle, Coins } from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { gastoMedioMensual, ahorroMensual as calcAhorroMensual } from '@/lib/goalEstimation';
import { PurchaseGoalCard } from '@/components/PurchaseGoalCard';

interface GoalWithQuota {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthlyQuota: number;
  monthsRemaining: number;
  progressPercent: number;
}

interface PurchaseGoalsSectionProps {
  goals: GoalWithQuota[];
  totalQuotas: number;
  dineroLibre: number;
  hasInsufficientFunds: boolean;
  onRemove: (id: string) => void;
}

export const PurchaseGoalsSectionNew = ({
  goals,
  totalQuotas,
  dineroLibre,
  hasInsufficientFunds,
  onRemove
}: PurchaseGoalsSectionProps) => {
  const [ahorro, setAhorro] = useState(0);
  const [mesesData, setMesesData] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const [{ data: gastos }, { data: profile }] = await Promise.all([
        supabase.from('expenses').select('amount, created_at').eq('user_id', userId),
        supabase.from('profiles').select('monthly_income').eq('user_id', userId).maybeSingle(),
      ]);
      if (cancelled) return;

      const medio = gastoMedioMensual(
        (gastos || []).map((g) => ({ amount: Number(g.amount), created_at: g.created_at }))
      );
      setMesesData(medio.meses);
      setAhorro(calcAhorroMensual(Number(profile?.monthly_income || 0), medio.medio));
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-goal-light">
                <Coins className="h-5 w-5 text-goal" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cuota mensual total</p>
                <p className="text-xl font-bold text-goal">{formatCurrencyCompact(totalQuotas)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Dinero libre</p>
              <p className={cn(
                'text-xl font-bold',
                dineroLibre >= 0 ? 'text-primary' : 'text-destructive'
              )}>
                {formatCurrencyCompact(dineroLibre)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Alert */}
      {hasInsufficientFunds && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Saldo insuficiente para cubrir todos tus objetivos. Considera ajustar las fechas o eliminar algún objetivo.
          </AlertDescription>
        </Alert>
      )}

      {/* Goals List */}
      <Card className="glass-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <div className="p-2 rounded-xl bg-goal-light">
              <Gift className="h-5 w-5 text-goal" />
            </div>
            Mis Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              No tienes objetivos de compra. ¡Añade uno!
            </p>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <PurchaseGoalCard
                  key={goal.id}
                  goal={{
                    id: goal.id,
                    name: goal.name,
                    targetPrice: goal.target_amount,
                    savedAmount: goal.current_amount,
                    targetDate: new Date(goal.target_date),
                    monthlyQuota: goal.monthlyQuota,
                    monthsRemaining: goal.monthsRemaining,
                    progressPercent: goal.progressPercent,
                  }}
                  onRemove={onRemove}
                  ahorroMensual={ahorro}
                  mesesData={mesesData}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
