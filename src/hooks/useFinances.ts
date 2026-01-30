import { useState, useEffect, useMemo } from 'react';
import { Expense, PurchaseGoal, FinanceState, ExpenseFrequency } from '@/types/expense';

const STORAGE_KEY = 'finance-tracker-data';

const getInitialState = (): FinanceState => {
  if (typeof window === 'undefined') {
    return { monthlyIncome: 0, savingsGoal: 0, expenses: [], purchaseGoals: [] };
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        monthlyIncome: parsed.monthlyIncome || 0,
        savingsGoal: parsed.savingsGoal || 0,
        expenses: parsed.expenses?.map((e: Expense) => ({
          ...e,
          frequency: e.frequency || 'monthly',
          createdAt: new Date(e.createdAt)
        })) || [],
        purchaseGoals: parsed.purchaseGoals?.map((g: PurchaseGoal) => ({
          ...g,
          targetDate: new Date(g.targetDate),
          createdAt: new Date(g.createdAt)
        })) || []
      };
    } catch {
      return { monthlyIncome: 0, savingsGoal: 0, expenses: [], purchaseGoals: [] };
    }
  }
  return { monthlyIncome: 0, savingsGoal: 0, expenses: [], purchaseGoals: [] };
};

// Calculate months between now and target date
const calculateMonthsRemaining = (targetDate: Date): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
};

// Calculate monthly quota for a purchase goal
const calculateMonthlyQuota = (goal: PurchaseGoal): number => {
  const remaining = goal.targetPrice - goal.savedAmount;
  const months = calculateMonthsRemaining(goal.targetDate);
  return remaining > 0 ? remaining / months : 0;
};

// Calculate monthly provision based on frequency
const calculateMonthlyProvision = (amount: number, frequency: ExpenseFrequency): number => {
  switch (frequency) {
    case 'quarterly':
      return amount / 3;
    case 'annual':
      return amount / 12;
    default:
      return 0; // Monthly expenses don't need provisioning
  }
};

export const useFinances = () => {
  const [state, setState] = useState<FinanceState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setMonthlyIncome = (amount: number) => {
    setState(prev => ({ ...prev, monthlyIncome: amount }));
  };

  const setSavingsGoal = (amount: number) => {
    setState(prev => ({ ...prev, savingsGoal: amount }));
  };

  const addExpense = (
    name: string,
    amount: number,
    isRecurring: boolean,
    frequency: ExpenseFrequency = 'monthly',
    category?: string
  ) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      name,
      amount,
      isRecurring,
      frequency,
      category,
      createdAt: new Date()
    };
    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }));
  };

  const removeExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const toggleRecurring = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e =>
        e.id === id ? { ...e, isRecurring: !e.isRecurring } : e
      )
    }));
  };

  const updateExpenseFrequency = (id: string, frequency: ExpenseFrequency) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e =>
        e.id === id ? { ...e, frequency } : e
      )
    }));
  };

  // Purchase Goals Management
  const addPurchaseGoal = (name: string, targetPrice: number, targetDate: Date) => {
    const newGoal: PurchaseGoal = {
      id: crypto.randomUUID(),
      name,
      targetPrice,
      targetDate,
      savedAmount: 0,
      createdAt: new Date()
    };
    setState(prev => ({
      ...prev,
      purchaseGoals: [...prev.purchaseGoals, newGoal]
    }));
  };

  const removePurchaseGoal = (id: string) => {
    setState(prev => ({
      ...prev,
      purchaseGoals: prev.purchaseGoals.filter(g => g.id !== id)
    }));
  };

  const updatePurchaseGoalSaved = (id: string, amount: number) => {
    setState(prev => ({
      ...prev,
      purchaseGoals: prev.purchaseGoals.map(g =>
        g.id === id ? { ...g, savedAmount: Math.max(0, Math.min(amount, g.targetPrice)) } : g
      )
    }));
  };

  // Calculations with memoization
  const calculations = useMemo(() => {
    const recurringExpenses = state.expenses.filter(e => e.isRecurring);
    const oneTimeExpenses = state.expenses.filter(e => !e.isRecurring);
    
    // Monthly recurring (only those with 'monthly' frequency)
    const monthlyRecurring = recurringExpenses.filter(e => e.frequency === 'monthly');
    const totalMonthlyRecurring = monthlyRecurring.reduce((sum, e) => sum + e.amount, 0);
    
    // Non-monthly recurring for reserve fund
    const nonMonthlyRecurring = recurringExpenses.filter(e => e.frequency !== 'monthly');
    
    // Calculate reserve fund (provisioning for quarterly and annual expenses)
    const reserveFund = nonMonthlyRecurring.reduce((sum, e) => {
      return sum + calculateMonthlyProvision(e.amount, e.frequency);
    }, 0);
    
    const totalRecurring = totalMonthlyRecurring + reserveFund;
    const totalOneTime = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalRecurring + totalOneTime;
    
    // Free money after fixed expenses
    const freeMoneyAfterFixed = state.monthlyIncome - totalMonthlyRecurring;
    
    // Purchase goals calculations
    const purchaseGoalsWithQuotas = state.purchaseGoals.map(goal => ({
      ...goal,
      monthlyQuota: calculateMonthlyQuota(goal),
      monthsRemaining: calculateMonthsRemaining(goal.targetDate),
      progressPercent: goal.targetPrice > 0 ? (goal.savedAmount / goal.targetPrice) * 100 : 0
    }));
    
    const totalPurchaseGoalQuotas = purchaseGoalsWithQuotas.reduce((sum, g) => sum + g.monthlyQuota, 0);
    
    // Subscriptions (for ING - digital subscriptions)
    const subscriptionKeywords = ['netflix', 'spotify', 'hbo', 'disney', 'amazon', 'internet', 'gym', 'gimnasio', 'movil', 'telefono'];
    const subscriptions = recurringExpenses.filter(e => 
      e.frequency === 'monthly' && 
      subscriptionKeywords.some(keyword => e.name.toLowerCase().includes(keyword))
    );
    const totalSubscriptions = subscriptions.reduce((sum, e) => sum + e.amount, 0);
    
    // Rent detection
    const rentKeywords = ['alquiler', 'hipoteca', 'rent'];
    const rent = recurringExpenses
      .filter(e => rentKeywords.some(keyword => e.name.toLowerCase().includes(keyword)))
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Available for hobbies = Free money after fixed - savings goal - purchase goal quotas - reserve fund
    const availableForHobbies = freeMoneyAfterFixed - state.savingsGoal - totalPurchaseGoalQuotas - reserveFund;
    const hasInsufficientFunds = availableForHobbies < 0;
    
    const balance = state.monthlyIncome - totalExpenses - state.savingsGoal;

    return {
      recurringExpenses,
      oneTimeExpenses,
      monthlyRecurring,
      nonMonthlyRecurring,
      totalRecurring,
      totalMonthlyRecurring,
      totalOneTime,
      totalExpenses,
      freeMoneyAfterFixed,
      reserveFund,
      purchaseGoalsWithQuotas,
      totalPurchaseGoalQuotas,
      totalSubscriptions,
      rent,
      availableForHobbies,
      hasInsufficientFunds,
      balance
    };
  }, [state]);

  return {
    monthlyIncome: state.monthlyIncome,
    savingsGoal: state.savingsGoal,
    expenses: state.expenses,
    purchaseGoals: state.purchaseGoals,
    ...calculations,
    setMonthlyIncome,
    setSavingsGoal,
    addExpense,
    removeExpense,
    toggleRecurring,
    updateExpenseFrequency,
    addPurchaseGoal,
    removePurchaseGoal,
    updatePurchaseGoalSaved
  };
};
