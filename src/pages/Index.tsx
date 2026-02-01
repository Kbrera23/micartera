import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseFinances, ExpenseFrequency, BankType } from '@/hooks/useSupabaseFinances';
import { AppLayout } from '@/components/layout/AppLayout';
import { MinimalDashboard } from '@/components/sections/MinimalDashboard';
import { ExpensesSection } from '@/components/sections/ExpensesSectionNew';
import { GoalsSection } from '@/components/sections/GoalsSectionNew';
import { MinimalProfileSection } from '@/components/sections/MinimalProfileSection';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const navigate = useNavigate();
  
  const {
    loading,
    hasProfile,
    monthlyIncome,
    savingsGoal,
    rent,
    totalFixedExpenses,
    reserveFund,
    dineroLibre,
    totalSubscriptions,
    expenses,
    recurringExpenses,
    purchaseGoals,
    goalsWithQuotas,
    totalPurchaseGoalQuotas,
    hasInsufficientFunds,
    userBanks,
    addExpense,
    removeExpense,
    addPurchaseGoal,
    removePurchaseGoal,
    updateProfile,
    toggleBank
  } = useSupabaseFinances();

  useEffect(() => {
    if (!loading && hasProfile === false) {
      navigate('/onboarding');
    }
  }, [loading, hasProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasProfile === false) {
    return null;
  }

  const oneTimeExpenses = expenses.filter(e => !e.is_recurring);
  const totalOneTime = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency, bank?: BankType) => {
    addExpense(name, amount, isRecurring, frequency, bank || null);
  };

  const handleAddGoal = (name: string, targetAmount: number, targetDate: Date) => {
    addPurchaseGoal(name, targetAmount, targetDate);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <MinimalDashboard
            userBanks={userBanks}
            monthlyIncome={monthlyIncome}
            savingsGoal={savingsGoal}
            totalFixedExpenses={totalFixedExpenses}
            reserveFund={reserveFund}
            dineroLibre={dineroLibre}
            totalSubscriptions={totalSubscriptions}
            rent={rent}
          />
        );
      case 'gastos':
        return (
          <ExpensesSection
            recurringExpenses={recurringExpenses}
            oneTimeExpenses={oneTimeExpenses}
            totalRecurring={totalRecurring}
            totalOneTime={totalOneTime}
            onAddExpense={handleAddExpense}
            onRemoveExpense={removeExpense}
          />
        );
      case 'objetivos':
        return (
          <GoalsSection
            goalsWithQuotas={goalsWithQuotas}
            totalPurchaseGoalQuotas={totalPurchaseGoalQuotas}
            dineroLibre={dineroLibre}
            hasInsufficientFunds={hasInsufficientFunds}
            onAddGoal={handleAddGoal}
            onRemoveGoal={removePurchaseGoal}
          />
        );
      case 'perfil':
        return (
          <MinimalProfileSection
            monthlyIncome={monthlyIncome}
            savingsGoal={savingsGoal}
            rent={rent}
            userBanks={userBanks}
            onUpdateProfile={updateProfile}
            onToggleBank={toggleBank}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout currentSection={currentSection} onSectionChange={setCurrentSection}>
      {renderSection()}
    </AppLayout>
  );
};

export default Index;
