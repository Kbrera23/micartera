import { MinimalBankCards } from '@/components/dashboard/MinimalBankCards';
import { KPICards } from '@/components/dashboard/KPICards';
import { UpcomingLargePayments } from '@/components/dashboard/UpcomingLargePayments';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { MonthlyReminder } from '@/components/dashboard/MonthlyReminder';
import { BankType, Expense, ExpenseFrequency } from '@/hooks/useSupabaseFinances';

interface MinimalDashboardProps {
  userBanks: { bank: BankType; initial_balance: number }[];
  monthlyIncome: number;
  savingsGoal: number;
  totalFixedExpenses: number;
  reserveFund: number;
  dineroLibre: number;
  totalSubscriptions: number;
  rent: number;
  totalPurchaseGoalQuotas: number;
  activeGoalsCount: number;
  trafficLightStatus: 'green' | 'yellow' | 'red';
  trafficLightMessage: string;
  quarterlyProvision: number;
  recurringExpenses: Expense[];
  oneTimeExpenses: Expense[];
  onAddExpense: (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency, bank: BankType | null) => Promise<void>;
  refetch: () => void;
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
  activeGoalsCount,
  trafficLightStatus,
  trafficLightMessage,
  quarterlyProvision,
  recurringExpenses,
  oneTimeExpenses,
  onAddExpense,
  refetch,
}: MinimalDashboardProps) => {
  const hasRevolut = userBanks.some(b => b.bank === 'revolut');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Bank Cards Header - Horizontal Scroll */}
      <MinimalBankCards
        userBanks={userBanks}
        monthlyIncome={monthlyIncome}
        savingsGoal={savingsGoal}
        totalSubscriptions={totalSubscriptions}
        reserveFund={reserveFund}
        rent={rent}
      />

      {/* Revolut Reminder - with Done button, hides when completed */}
      {hasRevolut && (
        <MonthlyReminder quarterlyProvision={quarterlyProvision} />
      )}

      {/* Upcoming large payments - only current month */}
      <UpcomingLargePayments recurringExpenses={recurringExpenses} onAddExpense={onAddExpense} refetch={refetch} />

      {/* Recent one-time expenses - payment records filtered out */}
      <RecentExpenses expenses={oneTimeExpenses} />

      {/* 4 KPI Pillars */}
      <KPICards
        monthlyIncome={monthlyIncome}
        totalFixedExpenses={totalFixedExpenses}
        rent={rent}
        savingsGoal={savingsGoal}
        reserveFund={reserveFund}
        dineroLibre={dineroLibre}
        totalPurchaseGoalQuotas={totalPurchaseGoalQuotas}
        activeGoalsCount={activeGoalsCount}
        trafficLightStatus={trafficLightStatus}
        trafficLightMessage={trafficLightMessage}
      />
    </div>
  );
};
