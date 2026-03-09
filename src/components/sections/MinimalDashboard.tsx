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
  const showRevolutReminder = hasRevolut && quarterlyProvision > 0;

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

      {/* Revolut Reminder */}
      {showRevolutReminder && (
        <Card className="border-none shadow-md rounded-2xl bg-[#191C1F] text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90">Recordatorio mensual</p>
              <p className="text-xs text-white/60">Mover a Revolut para gastos trimestrales</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-lg font-bold">{formatCurrencyCompact(quarterlyProvision)}</span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming large payments */}
      <UpcomingLargePayments recurringExpenses={recurringExpenses} onAddExpense={onAddExpense} refetch={refetch} />

      {/* Recent one-time expenses */}
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
