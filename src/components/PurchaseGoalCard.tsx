import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Calendar, TrendingUp, AlertTriangle, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { estimarObjetivo } from '@/lib/goalEstimation';

interface PurchaseGoalWithQuota {
  id: string;
  name: string;
  targetPrice: number;
  targetDate: Date;
  savedAmount: number;
  monthlyQuota: number;
  monthsRemaining: number;
  progressPercent: number;
}

interface PurchaseGoalCardProps {
  goal: PurchaseGoalWithQuota;
  onRemove: (id: string) => void;
  ahorroMensual?: number;
  mesesData?: number;
}

export const PurchaseGoalCard = ({ goal, onRemove, ahorroMensual = 0, mesesData = 0 }: PurchaseGoalCardProps) => {
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM yyyy', { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const estimacion = estimarObjetivo(goal.targetPrice, goal.savedAmount, ahorroMensual, mesesData);


  return (
    <Card className="glass-card animate-fade-in overflow-hidden rounded-2xl">
      <div className="h-1.5 bg-gradient-to-r from-goal to-goal/70" />
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{goal.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span className="capitalize">{formatDate(goal.targetDate)}</span>
              <span className="text-goal">• {goal.monthsRemaining} meses</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(goal.id)}
            className="h-8 w-8 text-muted-foreground hover:text-expense hover:bg-expense-light rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{goal.progressPercent.toFixed(0)}%</span>
          </div>
          <Progress 
            value={goal.progressPercent} 
            className="h-2.5 rounded-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(goal.savedAmount)}</span>
            <span>{formatCurrency(goal.targetPrice)}</span>
          </div>
        </div>

        {/* Monthly Quota */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-goal-light border border-goal/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-goal" />
            <span className="text-sm text-goal">Cuota Mensual</span>
          </div>
          <span className="font-bold text-goal">
            {formatCurrency(goal.monthlyQuota)}
          </span>
        </div>

        {/* Estimación real */}
        <div className="p-2.5 rounded-xl bg-muted border border-border/50 space-y-1">
          <div className="flex items-center gap-2">
            {estimacion.alcanzable ? (
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm font-medium text-foreground">Estimación real</span>
          </div>
          {estimacion.alcanzable ? (
            <p className="text-xs text-muted-foreground">
              A tu ritmo de ahorro ({formatCurrency(estimacion.ahorroMensual)}/mes), lo alcanzas en{' '}
              <span className="font-semibold text-foreground">{estimacion.mesesNecesarios}</span>{' '}
              {estimacion.mesesNecesarios === 1 ? 'mes' : 'meses'}.
            </p>
          ) : estimacion.faltante === 0 ? (
            <p className="text-xs text-muted-foreground">Ya has alcanzado este objetivo.</p>
          ) : (
            <p className="text-xs text-amber-500">
              Con tu ahorro actual no llegarías a este objetivo. Revisa gastos o ingresos.
            </p>
          )}
          {estimacion.pocosData && (
            <p className="text-[11px] text-muted-foreground">
              Estimación provisional (pocos meses de datos)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
