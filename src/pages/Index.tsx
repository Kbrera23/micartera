import { useFinances } from '@/hooks/useFinances';
import { IncomeCard } from '@/components/IncomeCard';
import { BalanceCard } from '@/components/BalanceCard';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { Wallet } from 'lucide-react';

const Index = () => {
  const {
    monthlyIncome,
    recurringExpenses,
    oneTimeExpenses,
    totalRecurring,
    totalOneTime,
    totalExpenses,
    balance,
    setMonthlyIncome,
    addExpense,
    removeExpense,
    toggleRecurring
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
          {/* Left Column - Income & Form */}
          <div className="space-y-6">
            <IncomeCard
              monthlyIncome={monthlyIncome}
              onSetIncome={setMonthlyIncome}
            />
            <AddExpenseForm onAddExpense={addExpense} />
          </div>

          {/* Middle Column - Balance */}
          <div className="lg:col-span-2 space-y-6">
            <BalanceCard
              balance={balance}
              totalExpenses={totalExpenses}
              monthlyIncome={monthlyIncome}
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
