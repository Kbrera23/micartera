import { AddPurchaseGoalForm } from '@/components/AddPurchaseGoalForm';
import { PurchaseGoalsSection } from '@/components/PurchaseGoalsSection';

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

interface GoalsSectionProps {
  purchaseGoalsWithQuotas: PurchaseGoalWithQuota[];
  totalPurchaseGoalQuotas: number;
  availableForHobbies: number;
  hasInsufficientFunds: boolean;
  onAddGoal: (name: string, targetPrice: number, targetDate: Date) => void;
  onRemoveGoal: (id: string) => void;
}

export const GoalsSection = ({
  purchaseGoalsWithQuotas,
  totalPurchaseGoalQuotas,
  availableForHobbies,
  hasInsufficientFunds,
  onAddGoal,
  onRemoveGoal
}: GoalsSectionProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Objetivos de Compra</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Goal Form */}
        <div className="lg:col-span-1">
          <AddPurchaseGoalForm onAddGoal={onAddGoal} />
        </div>

        {/* Goals List */}
        <div className="lg:col-span-2">
          <PurchaseGoalsSection
            goals={purchaseGoalsWithQuotas}
            totalQuotas={totalPurchaseGoalQuotas}
            availableForHobbies={availableForHobbies}
            hasInsufficientFunds={hasInsufficientFunds}
            onRemove={onRemoveGoal}
          />
        </div>
      </div>
    </div>
  );
};
