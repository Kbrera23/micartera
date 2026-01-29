import { useFinances } from '@/hooks/useFinances';
import { IncomeCard } from '@/components/IncomeCard';
import { BalanceCard } from '@/components/BalanceCard';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { AddPurchaseGoalForm } from '@/components/AddPurchaseGoalForm';
import { PurchaseGoalsSection } from '@/components/PurchaseGoalsSection';
import { Wallet } from 'lucide-react';

const Index = () => {
  const {
    monthlyIncome,
    savingsGoal,
    recurringExpenses,
    oneTimeExpenses,
    totalRecurring,
    totalOneTime,
    totalExpenses,
    freeMoneyAfterFixed,
    balance,
    purchaseGoalsWithQuotas,
    totalPurchaseGoalQuotas,
    availableForHobbies,
    hasInsufficientFunds,
    setMonthlyIncome,
    setSavingsGoal,
    addExpense,
    removeExpense,
    toggleRecurring,
    addPurchaseGoal,
    removePurchaseGoal
  } = useFinances();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl gradient-income">
              <Wallet className="h-6 w-6 text-income-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Control de Gastos</h1>
              <p className="text-sm text-muted-foreground">Gestiona tu dinero de forma inteligente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Income & Forms */}
          <div className="space-y-6">
            <IncomeCard
              monthlyIncome={monthlyIncome}
              savingsGoal={savingsGoal}
              onSetIncome={setMonthlyIncome}
              onSetSavingsGoal={setSavingsGoal}
            />
            <AddExpenseForm onAddExpense={addExpense} />
            <AddPurchaseGoalForm onAddGoal={addPurchaseGoal} />
          </div>

          {/* Middle Column - Balance & Lists */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Purchase Goals Section */}
            <PurchaseGoalsSection
              goals={purchaseGoalsWithQuotas}
              totalQuotas={totalPurchaseGoalQuotas}
              availableForHobbies={availableForHobbies}
              hasInsufficientFunds={hasInsufficientFunds}
              onRemove={removePurchaseGoal}
            />

            {/* Expense Lists */}
            <div className="grid gap-6 md:grid-cols-2">
              <ExpenseList
                title="Gastos Recurrentes"
                expenses={recurringExpenses}
                total={totalRecurring}
                isRecurring={true}
                onRemove={removeExpense}
                onToggleRecurring={toggleRecurring}
              />
              <ExpenseList
                title="Gastos Únicos"
                expenses={oneTimeExpenses}
                total={totalOneTime}
                isRecurring={false}
                onRemove={removeExpense}
                onToggleRecurring={toggleRecurring}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
