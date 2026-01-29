import { useState, useEffect } from 'react';
import { Expense, FinanceState } from '@/types/expense';

const STORAGE_KEY = 'finance-tracker-data';

const getInitialState = (): FinanceState => {
  if (typeof window === 'undefined') {
    return { monthlyIncome: 0, savingsGoal: 0, expenses: [] };
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
        })) || []
      };
    } catch {
      return { monthlyIncome: 0, savingsGoal: 0, expenses: [] };
    }
  }
  return { monthlyIncome: 0, savingsGoal: 0, expenses: [] };
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

  const recurringExpenses = state.expenses.filter(e => e.isRecurring);
  const oneTimeExpenses = state.expenses.filter(e => !e.isRecurring);
  const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOneTime = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalRecurring + totalOneTime;
  const freeMoneyAfterFixed = state.monthlyIncome - totalRecurring;
  const balance = state.monthlyIncome - totalExpenses - state.savingsGoal;

  return {
    monthlyIncome: state.monthlyIncome,
    savingsGoal: state.savingsGoal,
    expenses: state.expenses,
    recurringExpenses,
    oneTimeExpenses,
    totalRecurring,
    totalOneTime,
    totalExpenses,
    freeMoneyAfterFixed,
    balance,
    setMonthlyIncome,
    setSavingsGoal,
    addExpense,
    removeExpense,
    toggleRecurring
  };
};
