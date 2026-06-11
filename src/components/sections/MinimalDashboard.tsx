import { MinimalBankCards } from '@/components/dashboard/MinimalBankCards';
import { KPICards } from '@/components/dashboard/KPICards';
import { UpcomingLargePayments } from '@/components/dashboard/UpcomingLargePayments';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { MonthlyReminder } from '@/components/dashboard/MonthlyReminder';
import { MonthlySummaryCard } from '@/components/dashboard/MonthlySummaryCard';
import { RegisterMonthlySaving } from '@/components/dashboard/RegisterMonthlySaving';
import { BankType, Expense, ExpenseFrequency, Category, MonthlySaving } from '@/hooks/useSupabaseFinances';

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
  expenses: Expense[];
  categories: Category[];
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
  expenses,
  categories,
  onAddExpense,
  refetch,
}: MinimalDashboardProps) => {
  const hasRevolut = userBanks.some(b => b.bank === 'revolut');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen financiero</p>
      </div>

      {/* Monthly Summary */}
      <div style={{ animationDelay: '60ms' }} className="animate-fade-in">
        <MonthlySummaryCard expenses={expenses} categories={categories} />
      </div>

      {/* Bank Cards Header */}
      <div style={{ animationDelay: '120ms' }} className="animate-fade-in">
        <MinimalBankCards
          userBanks={userBanks}
          monthlyIncome={monthlyIncome}
          savingsGoal={savingsGoal}
          totalSubscriptions={totalSubscriptions}
          reserveFund={reserveFund}
          rent={rent}
        />
      </div>

      {/* Revolut Reminder */}
      {hasRevolut && (
        <div style={{ animationDelay: '180ms' }} className="animate-fade-in">
          <MonthlyReminder quarterlyProvision={quarterlyProvision} refetch={refetch} />
        </div>
      )}

      {/* Upcoming large payments */}
      <div style={{ animationDelay: '240ms' }} className="animate-fade-in">
        <UpcomingLargePayments recurringExpenses={recurringExpenses} onAddExpense={onAddExpense} refetch={refetch} />
      </div>

      {/* Recent one-time expenses */}
      <div style={{ animationDelay: '300ms' }} className="animate-fade-in">
        <RecentExpenses expenses={oneTimeExpenses} categories={categories} />
      </div>

      {/* 4 KPI Pillars */}
      <div style={{ animationDelay: '360ms' }} className="animate-fade-in">
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
    </div>
  );
};
