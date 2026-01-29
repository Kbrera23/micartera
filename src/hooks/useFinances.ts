import { useState, useEffect } from 'react';
import { Expense, PurchaseGoal, FinanceState } from '@/types/expense';

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
  return Math.max(1, months); // Minimum 1 month
};

// Calculate monthly quota for a purchase goal
const calculateMonthlyQuota = (goal: PurchaseGoal): number => {
  const remaining = goal.targetPrice - goal.savedAmount;
  const months = calculateMonthsRemaining(goal.targetDate);
  return remaining > 0 ? remaining / months : 0;
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

  const addExpense = (name: string, amount: number, isRecurring: boolean) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      name,
      amount,
      isRecurring,
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

  // Calculations
  const recurringExpenses = state.expenses.filter(e => e.isRecurring);
  const oneTimeExpenses = state.expenses.filter(e => !e.isRecurring);
  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOneTime = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalRecurring + totalOneTime;
  const freeMoneyAfterFixed = state.monthlyIncome - totalRecurring;
  
  // Purchase goals calculations
  const purchaseGoalsWithQuotas = state.purchaseGoals.map(goal => ({
    ...goal,
    monthlyQuota: calculateMonthlyQuota(goal),
    monthsRemaining: calculateMonthsRemaining(goal.targetDate),
    progressPercent: goal.targetPrice > 0 ? (goal.savedAmount / goal.targetPrice) * 100 : 0
  }));
  
  const totalPurchaseGoalQuotas = purchaseGoalsWithQuotas.reduce((sum, g) => sum + g.monthlyQuota, 0);
  
  // Available for hobbies = Free money after fixed - savings goal - purchase goal quotas
  const availableForHobbies = freeMoneyAfterFixed - state.savingsGoal - totalPurchaseGoalQuotas;
  const hasInsufficientFunds = availableForHobbies < 0;
  
  const balance = state.monthlyIncome - totalExpenses - state.savingsGoal;

  return {
    monthlyIncome: state.monthlyIncome,
    savingsGoal: state.savingsGoal,
    expenses: state.expenses,
    purchaseGoals: state.purchaseGoals,
    purchaseGoalsWithQuotas,
    recurringExpenses,
    oneTimeExpenses,
    totalRecurring,
    totalOneTime,
    totalExpenses,
    freeMoneyAfterFixed,
    totalPurchaseGoalQuotas,
    availableForHobbies,
    hasInsufficientFunds,
    balance,
    setMonthlyIncome,
    setSavingsGoal,
    addExpense,
    removeExpense,
    toggleRecurring,
    addPurchaseGoal,
    removePurchaseGoal,
    updatePurchaseGoalSaved
  };
};
