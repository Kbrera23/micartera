import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Calendar, TrendingUp } from 'lucide-react';

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
}

export const PurchaseGoalCard = ({ goal, onRemove }: PurchaseGoalCardProps) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="glass-card animate-fade-in overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-goal to-goal/70" />
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{goal.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(goal.targetDate)}</span>
              <span className="text-goal">• {goal.monthsRemaining} meses</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(goal.id)}
            className="h-8 w-8 text-muted-foreground hover:text-expense hover:bg-expense-light"
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
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(goal.savedAmount)}</span>
            <span>{formatCurrency(goal.targetPrice)}</span>
          </div>
        </div>

        {/* Monthly Quota */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-goal-light border border-goal/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-goal" />
            <span className="text-sm text-goal">Cuota Mensual</span>
          </div>
          <span className="font-bold text-goal">
            {formatCurrency(goal.monthlyQuota)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
