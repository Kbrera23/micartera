import { AddPurchaseGoalFormNew } from '@/components/AddPurchaseGoalFormNew';
import { PurchaseGoalsSectionNew } from '@/components/PurchaseGoalsSectionNew';

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

interface GoalsSectionProps {
  goalsWithQuotas: GoalWithQuota[];
  totalPurchaseGoalQuotas: number;
  dineroLibre: number;
  hasInsufficientFunds: boolean;
  onAddGoal: (name: string, targetAmount: number, targetDate: Date) => void;
  onRemoveGoal: (id: string) => void;
}

export const GoalsSection = ({
  goalsWithQuotas,
  totalPurchaseGoalQuotas,
  dineroLibre,
  hasInsufficientFunds,
  onAddGoal,
  onRemoveGoal
}: GoalsSectionProps) => {
  // Pasar dineroLibre al formulario para validación
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Objetivos de Compra</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Goal Form con dineroLibre para validación */}
        <div className="lg:col-span-1">
          <AddPurchaseGoalFormNew 
            onAddGoal={onAddGoal} 
            dineroLibre={dineroLibre}
          />
        </div>

        {/* Goals List */}
        <div className="lg:col-span-2">
          <PurchaseGoalsSectionNew
            goals={goalsWithQuotas}
            totalQuotas={totalPurchaseGoalQuotas}
            dineroLibre={dineroLibre}
            hasInsufficientFunds={hasInsufficientFunds}
            onRemove={onRemoveGoal}
          />
        </div>
      </div>
    </div>
  );
};
