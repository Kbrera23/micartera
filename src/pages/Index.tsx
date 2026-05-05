import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseFinances, ExpenseFrequency, BankType } from '@/hooks/useSupabaseFinances';
import { AppLayout } from '@/components/layout/AppLayout';
import { MinimalDashboard } from '@/components/sections/MinimalDashboard';
import { ExpensesSection } from '@/components/sections/ExpensesSectionNew';
import { GoalsSection } from '@/components/sections/GoalsSectionNew';
import { MinimalProfileSection } from '@/components/sections/MinimalProfileSection';
import { CategoriesSection } from '@/components/sections/CategoriesSection';
import { Loader2, AlertCircle } from 'lucide-react';

// ========== iOS OPTIMIZATIONS ==========
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const Index = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const navigate = useNavigate();
  
  const {
    loading,
    error,
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
    trafficLightStatus,
    trafficLightMessage,
    quarterlyProvision,
    categories,
    expensesByCategory,
    addExpense,
    removeExpense,
    updateExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addPurchaseGoal,
    removePurchaseGoal,
    toggleGoalStatus,
    updateProfile,
    toggleBank,
    updateBankBalance,
    refetch,
  } = useSupabaseFinances();

  // Redirección a onboarding si no hay perfil
  useEffect(() => {
    if (!loading && hasProfile === false) {
      navigate('/onboarding');
    }
  }, [loading, hasProfile, navigate]);

  // ========== iOS OPTIMIZATIONS ==========
  useEffect(() => {
    if (isIOS) {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        );
      }
      
      document.body.style.overscrollBehavior = 'none';
      
      document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
    }
    
    return () => {
      if (isIOS) {
        document.body.style.overscrollBehavior = '';
      }
    };
  }, []);

  // ========== OPTIMIZACIONES DE CÁLCULOS ==========
  const oneTimeExpenses = useMemo(() => 
    expenses.filter(e => !e.is_recurring), 
    [expenses]
  );
  
  const totalOneTime = useMemo(() => 
    oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0), 
    [oneTimeExpenses]
  );
  
  const totalRecurring = useMemo(() => 
    recurringExpenses.reduce((sum, e) => {
      if (e.frequency === 'quarterly') return sum + e.amount / 3;
      if (e.frequency === 'annual') return sum + e.amount / 12;
      return sum + e.amount;
    }, 0), 
    [recurringExpenses]
  );

  // ========== HANDLERS CON VALIDACIÓN ==========
  const handleAddExpense = useCallback((
    name: string, 
    amount: number, 
    isRecurring: boolean, 
    frequency: ExpenseFrequency, 
    bank?: BankType
  ) => {
    if (!name?.trim()) {
      console.error('El nombre del gasto es obligatorio');
      return;
    }
    
    if (amount <= 0) {
      console.error('El monto debe ser mayor a 0');
      return;
    }
    
    if (!frequency) {
      console.error('Debes seleccionar una frecuencia');
      return;
    }
    
    try {
      addExpense(name, amount, isRecurring, frequency, bank || null);
    } catch (error) {
      console.error('Error al añadir gasto:', error);
    }
  }, [addExpense]);

  const handleAddGoal = useCallback((
    name: string, 
    targetAmount: number, 
    targetDate: Date
  ) => {
    if (!name?.trim()) {
      console.error('El nombre del objetivo es obligatorio');
      return;
    }
    
    if (targetAmount <= 0) {
      console.error('El monto objetivo debe ser mayor a 0');
      return;
    }
    
    if (targetDate < new Date()) {
      console.error('La fecha objetivo debe ser futura');
      return;
    }
    
    try {
      addPurchaseGoal(name, targetAmount, targetDate);
    } catch (error) {
      console.error('Error al añadir objetivo:', error);
    }
  }, [addPurchaseGoal]);

  // ========== PROPS MEMOIZADAS POR SECCIÓN ==========
  const dashboardProps = useMemo(() => ({
    userBanks,
    monthlyIncome,
    savingsGoal,
    totalFixedExpenses,
    reserveFund,
    dineroLibre,
    totalSubscriptions,
    rent,
    totalPurchaseGoalQuotas,
    activeGoalsCount: goalsWithQuotas.length,
    trafficLightStatus,
    trafficLightMessage,
    quarterlyProvision,
    recurringExpenses,
    oneTimeExpenses,
    onAddExpense: addExpense,
    refetch,
  }), [
    userBanks,
    monthlyIncome,
    savingsGoal,
    totalFixedExpenses,
    reserveFund,
    dineroLibre,
    totalSubscriptions,
    rent,
    totalPurchaseGoalQuotas,
    goalsWithQuotas.length,
    trafficLightStatus,
    trafficLightMessage,
    quarterlyProvision,
    recurringExpenses,
    oneTimeExpenses,
    addExpense,
    refetch,
  ]);

  const expensesProps = useMemo(() => ({
    recurringExpenses,
    oneTimeExpenses,
    totalRecurring,
    totalOneTime,
    onAddExpense: handleAddExpense,
    onRemoveExpense: removeExpense,
    onUpdateExpense: updateExpense,
    categories,
    refetch,
  }), [
    recurringExpenses,
    oneTimeExpenses,
    totalRecurring,
    totalOneTime,
    handleAddExpense,
    removeExpense,
    updateExpense,
    categories,
    refetch,
  ]);

  const goalsProps = useMemo(() => ({
    goals: goalsWithQuotas,
    totalActiveQuotas: totalPurchaseGoalQuotas,
    dineroLibre,
    hasInsufficientFunds,
    onAddGoal: handleAddGoal,
    onRemoveGoal: removePurchaseGoal,
    onToggleGoalStatus: toggleGoalStatus
  }), [
    goalsWithQuotas,
    totalPurchaseGoalQuotas,
    dineroLibre,
    hasInsufficientFunds,
    handleAddGoal,
    removePurchaseGoal,
    toggleGoalStatus
  ]);

  const profileProps = useMemo(() => ({
    monthlyIncome,
    savingsGoal,
    rent,
    userBanks,
    onUpdateProfile: updateProfile,
    onToggleBank: toggleBank,
    onUpdateBankBalance: updateBankBalance
  }), [
    monthlyIncome,
    savingsGoal,
    rent,
    userBanks,
    updateProfile,
    toggleBank,
    updateBankBalance
  ]);

  const categoriesProps = useMemo(() => ({
    categories,
    expensesByCategory,
    onAddCategory: addCategory,
    onDeleteCategory: deleteCategory,
  }), [categories, expensesByCategory, addCategory, deleteCategory]);

  // ========== RENDER MEMOIZADO ==========
  const renderSection = useMemo(() => {
    switch (currentSection) {
      case 'dashboard':
        return <MinimalDashboard {...dashboardProps} />;
      case 'gastos':
        return <ExpensesSection {...expensesProps} />;
      case 'objetivos':
        return <GoalsSection {...goalsProps} />;
      case 'categorias':
        return <CategoriesSection {...categoriesProps} />;
      case 'perfil':
        return <MinimalProfileSection {...profileProps} />;
      default:
        return null;
    }
  }, [currentSection, dashboardProps, expensesProps, goalsProps, profileProps]);

  // ========== MANEJO DE ESTADOS ==========
  
  // Error boundary
  if (error) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 bg-background" 
        style={{ paddingTop: isIOS ? 'max(1rem, env(safe-area-inset-top))' : '1rem' }}
      >
        <div className="text-center max-w-md bg-card rounded-lg shadow-lg p-8 border border-border">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error al cargar datos
          </h2>
          <p className="text-muted-foreground mb-6">
            {error.message || 'Ha ocurrido un error inesperado'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors font-medium touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Loading inicial
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background"
        style={{ paddingTop: isIOS ? 'env(safe-area-inset-top)' : '0' }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Cargando tus finanzas...</p>
        </div>
      </div>
    );
  }

  // Redirección a onboarding (con loader para evitar flash)
  if (hasProfile === false) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background"
        style={{ paddingTop: isIOS ? 'env(safe-area-inset-top)' : '0' }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // ========== RENDER PRINCIPAL ==========
  return (
    <AppLayout currentSection={currentSection} onSectionChange={setCurrentSection}>
      {renderSection}
    </AppLayout>
  );
};

export default Index;
