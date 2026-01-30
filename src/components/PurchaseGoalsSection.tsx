import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseGoalCard } from './PurchaseGoalCard';
import { Gift, AlertTriangle } from 'lucide-react';

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

interface PurchaseGoalsSectionProps {
  goals: PurchaseGoalWithQuota[];
  totalQuotas: number;
  availableForHobbies: number;
  hasInsufficientFunds: boolean;
  onRemove: (id: string) => void;
}

export const PurchaseGoalsSection = ({
  goals,
  totalQuotas,
  availableForHobbies,
  hasInsufficientFunds,
  onRemove
}: PurchaseGoalsSectionProps) => {
  const formatCurrency = (amount: number) => {
    return `€${Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  if (goals.length === 0) {
    return (
      <Card className="glass-card animate-fade-in rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <div className="p-2 rounded-xl bg-goal-light">
              <Gift className="h-5 w-5 text-goal" />
            </div>
            Mis Caprichos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No tienes objetivos de compra. ¡Añade uno para empezar a ahorrar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card animate-fade-in rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <div className="p-2 rounded-xl bg-goal-light">
              <Gift className="h-5 w-5 text-goal" />
            </div>
            Mis Caprichos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Insufficient Funds Warning */}
          {hasInsufficientFunds && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Saldo insuficiente para cubrir todos tus objetivos
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  Te faltan {formatCurrency(Math.abs(availableForHobbies))} este mes
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
            <span className="text-sm text-muted-foreground">Total Cuotas Mensuales</span>
            <span className="font-bold text-goal">
              {formatCurrency(totalQuotas)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
            <span className="text-sm text-muted-foreground">Disponible para Ocio</span>
            <span className={`font-bold ${hasInsufficientFunds ? 'text-expense' : 'text-income'}`}>
              {hasInsufficientFunds ? '-' : ''}{formatCurrency(availableForHobbies)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Individual Goal Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map(goal => (
          <PurchaseGoalCard
            key={goal.id}
            goal={goal}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};
