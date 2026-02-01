import { MinimalBankCards } from '@/components/dashboard/MinimalBankCards';
import { KPICards } from '@/components/dashboard/KPICards';
import { BankType } from '@/hooks/useSupabaseFinances';

interface MinimalDashboardProps {
  userBanks: { bank: BankType }[];
  monthlyIncome: number;
  savingsGoal: number;
  totalFixedExpenses: number;
  reserveFund: number;
  dineroLibre: number;
  totalSubscriptions: number;
  rent: number;
}

export const MinimalDashboard = ({
  userBanks,
  monthlyIncome,
  savingsGoal,
  totalFixedExpenses,
  reserveFund,
  dineroLibre,
  totalSubscriptions,
  rent
}: MinimalDashboardProps) => {
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
        reserveFund={reserveFund}
        dineroLibre={dineroLibre}
      />
    </div>
  );
};
