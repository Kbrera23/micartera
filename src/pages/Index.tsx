import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { ExpensesSection } from '@/components/sections/ExpensesSection';
import { GoalsSection } from '@/components/sections/GoalsSection';
import { ProfileSection } from '@/components/sections/ProfileSection';

const Index = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  
  const {
    monthlyIncome,
    savingsGoal,
    recurringExpenses,
    oneTimeExpenses,
    nonMonthlyRecurring,
    totalRecurring,
    totalMonthlyRecurring,
    totalOneTime,
    totalExpenses,
    freeMoneyAfterFixed,
    reserveFund,
    balance,
    purchaseGoalsWithQuotas,
    totalPurchaseGoalQuotas,
    totalSubscriptions,
    rent,
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

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <DashboardSection
            monthlyIncome={monthlyIncome}
            savingsGoal={savingsGoal}
            balance={balance}
            totalExpenses={totalExpenses}
            totalRecurring={totalRecurring}
            totalMonthlyRecurring={totalMonthlyRecurring}
            totalOneTime={totalOneTime}
            freeMoneyAfterFixed={freeMoneyAfterFixed}
            reserveFund={reserveFund}
            totalSubscriptions={totalSubscriptions}
            rent={rent}
            totalPurchaseGoalQuotas={totalPurchaseGoalQuotas}
            availableForHobbies={availableForHobbies}
            nonMonthlyRecurring={nonMonthlyRecurring}
          />
        );
      case 'gastos':
        return (
          <ExpensesSection
            recurringExpenses={recurringExpenses}
            oneTimeExpenses={oneTimeExpenses}
            totalRecurring={totalRecurring}
            totalOneTime={totalOneTime}
            onAddExpense={addExpense}
            onRemoveExpense={removeExpense}
            onToggleRecurring={toggleRecurring}
          />
        );
      case 'objetivos':
        return (
          <GoalsSection
            purchaseGoalsWithQuotas={purchaseGoalsWithQuotas}
            totalPurchaseGoalQuotas={totalPurchaseGoalQuotas}
            availableForHobbies={availableForHobbies}
            hasInsufficientFunds={hasInsufficientFunds}
            onAddGoal={addPurchaseGoal}
            onRemoveGoal={removePurchaseGoal}
          />
        );
      case 'perfil':
        return (
          <ProfileSection
            monthlyIncome={monthlyIncome}
            savingsGoal={savingsGoal}
            onSetIncome={setMonthlyIncome}
            onSetSavingsGoal={setSavingsGoal}
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
