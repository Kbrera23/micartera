import { MinimalBankCards } from '@/components/dashboard/MinimalBankCards';
import { KPICards } from '@/components/dashboard/KPICards';
import { BankType } from '@/hooks/useSupabaseFinances';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/currency';

interface MinimalDashboardProps {
  userBanks: { bank: BankType }[];
  monthlyIncome: number;
  savingsGoal: number;
  totalFixedExpenses: number;
  reserveFund: number;
  dineroLibre: number;
  totalSubscriptions: number;
  rent: number;
  totalPurchaseGoalQuotas: number;
  activeGoalsCount: number;
}

export const MinimalDashboard = ({
  userBanks,
  monthlyIncome,
  savingsGoal,
  totalFixedExpenses,
  reserveFund,
  dineroLibre,
  totalSubscriptions,
  rent,
  totalPurchaseGoalQuotas,
  activeGoalsCount
}: MinimalDashboardProps) => {
  // Total provisión = ahorro general + cuotas de objetivos
  const totalProvision = reserveFund + totalPurchaseGoalQuotas;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Bank Cards Header */}
      <MinimalBankCards
        userBanks={userBanks}
        monthlyIncome={monthlyIncome}
        savingsGoal={savingsGoal}
        totalSubscriptions={totalSubscriptions}
        reserveFund={reserveFund}
        rent={rent}
      />

      {/* 4 KPI Pillars */}
      <KPICards
        monthlyIncome={monthlyIncome}
        totalFixedExpenses={totalFixedExpenses}
        reserveFund={totalProvision}
        dineroLibre={dineroLibre}
        totalPurchaseGoalQuotas={totalPurchaseGoalQuotas}
      />

      {/* Active Goals Counter */}
      {activeGoalsCount > 0 && (
        <Card className="border-none shadow-md rounded-2xl bg-muted/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Objetivos Activos</p>
                <p className="text-xs text-muted-foreground">
                  {activeGoalsCount} {activeGoalsCount === 1 ? 'objetivo' : 'objetivos'} • {formatCurrencyCompact(totalPurchaseGoalQuotas)}/mes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
