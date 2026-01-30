import { BalanceCard } from '@/components/BalanceCard';
import { BankDistribution } from '@/components/dashboard/BankDistribution';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { ReserveFundCard } from '@/components/dashboard/ReserveFundCard';
import { Expense } from '@/types/expense';

interface DashboardSectionProps {
  monthlyIncome: number;
  savingsGoal: number;
  balance: number;
  totalExpenses: number;
  totalRecurring: number;
  totalMonthlyRecurring: number;
  totalOneTime: number;
  freeMoneyAfterFixed: number;
  reserveFund: number;
  totalSubscriptions: number;
  rent: number;
  totalPurchaseGoalQuotas: number;
  availableForHobbies: number;
  nonMonthlyRecurring: Expense[];
}

export const DashboardSection = ({
  monthlyIncome,
  savingsGoal,
  balance,
  totalExpenses,
  totalRecurring,
  totalMonthlyRecurring,
  totalOneTime,
  freeMoneyAfterFixed,
  reserveFund,
  totalSubscriptions,
  rent,
  totalPurchaseGoalQuotas,
  availableForHobbies,
  nonMonthlyRecurring
}: DashboardSectionProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Bank Distribution */}
      <BankDistribution
        monthlyIncome={monthlyIncome}
        savingsGoal={savingsGoal}
        totalSubscriptions={totalSubscriptions}
        reserveFund={reserveFund}
        rent={rent}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Balance Card */}
        <BalanceCard
          balance={balance}
          totalExpenses={totalExpenses}
          monthlyIncome={monthlyIncome}
          totalRecurring={totalRecurring}
          totalOneTime={totalOneTime}
          freeMoneyAfterFixed={freeMoneyAfterFixed}
          savingsGoal={savingsGoal}
          totalPurchaseGoalQuotas={totalPurchaseGoalQuotas}
          availableForHobbies={availableForHobbies}
        />

        {/* Distribution Chart */}
        <DistributionChart
          fixedExpenses={totalMonthlyRecurring}
          savingsGoal={savingsGoal}
          reserveFund={reserveFund}
          availableForHobbies={availableForHobbies}
        />
      </div>

      {/* Reserve Fund */}
      <ReserveFundCard
        reserveFund={reserveFund}
        nonMonthlyExpenses={nonMonthlyRecurring}
      />
    </div>
  );
};
