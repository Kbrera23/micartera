import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BankType = 'santander' | 'lacaixa' | 'ing' | 'revolut' | 'bbva';
export type ExpenseFrequency = 'monthly' | 'quarterly' | 'annual';

export interface Profile {
  id: string;
  user_id: string;
  monthly_income: number;
  savings_goal: number;
  rent: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  budget_limit: number;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_recurring: boolean;
  frequency: ExpenseFrequency;
  bank: BankType | null;
  created_at: string;
  next_payment_date?: string;
  last_payment_date?: string;
  category_id?: string | null;
  is_payment_record?: boolean;
}

export interface PurchaseGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: 'active' | 'pending';
  created_at: string;
}

export interface UserBank {
  id: string;
  user_id: string;
  bank: BankType;
  is_active: boolean;
  initial_balance: number;
}

const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', color: '#10b981', icon: '🛒', budget_limit: 500, is_default: true },
  { name: 'Transporte', color: '#3b82f6', icon: '🚗', budget_limit: 300, is_default: true },
  { name: 'Ocio', color: '#8b5cf6', icon: '🎮', budget_limit: 200, is_default: true },
  { name: 'Suscripciones', color: '#f59e0b', icon: '📺', budget_limit: 100, is_default: true },
  { name: 'Hogar', color: '#ef4444', icon: '🏠', budget_limit: 400, is_default: true },
  { name: 'Salud', color: '#ec4899', icon: '💊', budget_limit: 150, is_default: true },
  { name: 'Ropa', color: '#6366f1', icon: '👕', budget_limit: 200, is_default: true },
  { name: 'Otros', color: '#6b7280', icon: '📁', budget_limit: 0, is_default: true },
];

const calculateMonthsRemaining = (targetDate: string): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
};

export const useSupabaseFinances = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchaseGoals, setPurchaseGoals] = useState<PurchaseGoal[]>([]);
  const [userBanks, setUserBanks] = useState<UserBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [paidThisMonth, setPaidThisMonth] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [profileRes, expensesRes, goalsRes, banksRes, categoriesRes, trackingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('purchase_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_banks').select('*').eq('user_id', user.id),
        // @ts-ignore - categories table added via SQL
        supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('monthly_payments_tracking' as any).select('amount').eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }

      setExpenses((expensesRes.data || []).map(e => ({
        ...e,
        frequency: (e.frequency as ExpenseFrequency) || 'monthly'
      })));
      setPurchaseGoals((goalsRes.data || []).map(g => ({
        ...g,
        status: (g.status as 'active' | 'pending') || 'active'
      })));
      setUserBanks((banksRes.data || []).map(b => ({
        ...b,
        initial_balance: b.initial_balance || 0
      })));

      // Handle categories - create defaults if none exist
      const cats = (categoriesRes.data || []) as unknown as Category[];
      if (cats.length === 0) {
        const inserts = await Promise.all(
          DEFAULT_CATEGORIES.map(cat =>
            // @ts-ignore
            supabase.from('categories').insert({ user_id: user.id, ...cat }).select().single()
          )
        );
        setCategories(inserts.map(r => r.data).filter(Boolean) as unknown as Category[]);
      } else {
        setCategories(cats);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Profile operations
  const updateProfile = async (data: Partial<Pick<Profile, 'monthly_income' | 'savings_goal' | 'rent'>>) => {
    if (!user || !profile) return;
    const { error } = await supabase.from('profiles').update(data).eq('user_id', user.id);
    if (error) {
      toast.error('Error al actualizar perfil');
    } else {
      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast.success('Perfil actualizado');
    }
  };

  // Expense operations
  const addExpense = async (
    name: string,
    amount: number,
    isRecurring: boolean,
    frequency: ExpenseFrequency = 'monthly',
    bank: BankType | null = null,
    categoryId: string | null = null
  ) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        name,
        amount,
        is_recurring: isRecurring,
        frequency,
        bank,
        // @ts-ignore
        category_id: categoryId
      })
      .select()
      .single();
    if (error) {
      toast.error('Error al añadir gasto');
    } else {
      setExpenses(prev => [{ ...data, frequency: data.frequency as ExpenseFrequency }, ...prev]);
      toast.success('Gasto añadido');
    }
  };

  const updateExpense = async (
    id: string,
    updates: Partial<Pick<Expense, 'name' | 'amount' | 'is_recurring' | 'frequency' | 'bank' | 'category_id'>>
  ) => {
    try {
      const { error } = await supabase.from('expenses').update(updates).eq('id', id);
      if (error) throw error;
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      toast.success('Gasto actualizado');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Error al actualizar gasto');
      throw error;
    }
  };

  const removeExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar gasto');
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Category operations
  const addCategory = async (name: string, color: string, icon: string, budgetLimit: number) => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('categories')
      .insert({ user_id: user.id, name, color, icon, budget_limit: budgetLimit, is_default: false })
      .select()
      .single();
    if (error) {
      toast.error('Error al crear categoría');
    } else if (data) {
      setCategories(prev => [...prev, data as Category]);
      toast.success('Categoría creada');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await (supabase as any).from('categories').update(updates).eq('id', id);
    if (error) {
      toast.error('Error al actualizar categoría');
    } else {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Categoría actualizada');
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await (supabase as any).from('categories').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar categoría');
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoría eliminada');
    }
  };

  // Purchase goal operations
  const addPurchaseGoal = async (name: string, targetAmount: number, targetDate: Date) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchase_goals')
      .insert({
        user_id: user.id,
        name,
        target_amount: targetAmount,
        target_date: targetDate.toISOString().split('T')[0],
        status: 'pending'
      })
      .select()
      .single();
    if (error) {
      toast.error('Error al añadir objetivo');
    } else {
      setPurchaseGoals(prev => [{
        ...data,
        status: (data.status as 'active' | 'pending') || 'pending'
      }, ...prev]);
      toast.success('Objetivo añadido');
    }
  };

  const removePurchaseGoal = async (id: string) => {
    const { error } = await supabase.from('purchase_goals').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar objetivo');
    } else {
      setPurchaseGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const updatePurchaseGoalSaved = async (id: string, amount: number) => {
    const goal = purchaseGoals.find(g => g.id === id);
    if (!goal) return;
    const newAmount = Math.max(0, Math.min(amount, goal.target_amount));
    const { error } = await supabase.from('purchase_goals').update({ current_amount: newAmount }).eq('id', id);
    if (error) {
      toast.error('Error al actualizar objetivo');
    } else {
      setPurchaseGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: newAmount } : g));
    }
  };

  const toggleGoalStatus = async (goalId: string, newStatus: 'active' | 'pending') => {
    try {
      const { error } = await supabase.from('purchase_goals').update({ status: newStatus }).eq('id', goalId);
      if (error) throw error;
      setPurchaseGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
      toast.success(newStatus === 'active' ? 'Objetivo activado' : 'Objetivo pausado');
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast.error('Error al actualizar estado del objetivo');
    }
  };

  // Bank operations
  const toggleBank = async (bankId: BankType) => {
    if (!user) return;
    const existing = userBanks.find(b => b.bank === bankId);
    if (existing) {
      const { error } = await supabase.from('user_banks').delete().eq('id', existing.id);
      if (!error) setUserBanks(prev => prev.filter(b => b.id !== existing.id));
    } else {
      const { data, error } = await supabase
        .from('user_banks')
        .insert({ user_id: user.id, bank: bankId, initial_balance: 0 })
        .select()
        .single();
      if (!error && data) {
        setUserBanks(prev => [...prev, { ...data, initial_balance: data.initial_balance || 0 }]);
      }
    }
  };

  const updateBankBalance = async (bankId: BankType, balance: number) => {
    if (!user) return;
    const bank = userBanks.find(b => b.bank === bankId);
    if (!bank) return;
    const { error } = await supabase.from('user_banks').update({ initial_balance: balance }).eq('id', bank.id);
    if (error) {
      toast.error('Error al actualizar saldo');
    } else {
      setUserBanks(prev => prev.map(b => b.bank === bankId ? { ...b, initial_balance: balance } : b));
      toast.success('Saldo actualizado');
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyIncome = profile?.monthly_income || 0;
    const savingsGoal = profile?.savings_goal || 0;
    const rent = profile?.rent || 0;

    const recurringExpenses = expenses.filter(e => e.is_recurring);
    const monthlyRecurring = recurringExpenses.filter(e => e.frequency === 'monthly');
    const quarterlyRecurring = recurringExpenses.filter(e => e.frequency === 'quarterly');
    const annualRecurring = recurringExpenses.filter(e => e.frequency === 'annual');

    const totalMonthlyRecurring = monthlyRecurring.reduce((sum, e) => sum + e.amount, 0);
    const quarterlyProvision = quarterlyRecurring.reduce((sum, e) => sum + (e.amount / 3), 0);
    const annualProvision = annualRecurring.reduce((sum, e) => sum + (e.amount / 12), 0);
    const reserveFund = quarterlyProvision + annualProvision;
    const totalFixedExpenses = totalMonthlyRecurring;

    const lacaixaBalance = userBanks.find(b => b.bank === 'lacaixa')?.initial_balance || 0;
    const revolutBalance = userBanks.find(b => b.bank === 'revolut')?.initial_balance || 0;

    const goalsWithQuotas = purchaseGoals
      .filter(goal => goal.status === 'active')
      .map(goal => {
        const remaining = goal.target_amount - goal.current_amount;
        const months = calculateMonthsRemaining(goal.target_date);
        const monthlyQuota = remaining > 0 ? remaining / months : 0;
        const progressPercent = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        return { ...goal, monthlyQuota, monthsRemaining: months, progressPercent };
      });

    const totalPurchaseGoalQuotas = goalsWithQuotas.reduce((sum, g) => sum + g.monthlyQuota, 0);

    const subscriptionKeywords = ['netflix', 'spotify', 'hbo', 'disney', 'amazon', 'prime', 'internet', 'gym', 'gimnasio', 'movil', 'telefono', 'fibra'];
    const subscriptions = monthlyRecurring.filter(e =>
      subscriptionKeywords.some(keyword => e.name.toLowerCase().includes(keyword))
    );
    const totalSubscriptions = subscriptions.reduce((sum, e) => sum + e.amount, 0);

    const dineroLibre = monthlyIncome - rent - totalFixedExpenses - savingsGoal - reserveFund - totalPurchaseGoalQuotas;
    const hasInsufficientFunds = dineroLibre < 0;

    const dineroLibrePercent = monthlyIncome > 0 ? (dineroLibre / monthlyIncome) * 100 : 0;
    let trafficLightStatus: 'green' | 'yellow' | 'red' = 'green';
    let trafficLightMessage = '¡Libertad financiera!';
    if (dineroLibrePercent < 10) {
      trafficLightStatus = 'red';
      trafficLightMessage = 'Prioriza lo esencial';
    } else if (dineroLibrePercent < 30) {
      trafficLightStatus = 'yellow';
      trafficLightMessage = 'Gasta con cabeza';
    }

    const monthlyRevolutProvision = quarterlyProvision;

    // Expenses by category
    const expensesByCategory = categories.map(cat => {
      const catExpenses = expenses.filter(e => e.category_id === cat.id);
      const total = catExpenses.reduce((sum, e) => {
        if (e.is_recurring) {
          if (e.frequency === 'quarterly') return sum + e.amount / 3;
          if (e.frequency === 'annual') return sum + e.amount / 12;
          return sum + e.amount;
        }
        return sum + e.amount;
      }, 0);
      return {
        category: cat,
        total,
        percentage: cat.budget_limit > 0 ? (total / cat.budget_limit) * 100 : 0,
        remaining: cat.budget_limit - total,
        isOverBudget: total > cat.budget_limit && cat.budget_limit > 0,
      };
    }).filter(item => item.total > 0 || item.category.budget_limit > 0);

    return {
      monthlyIncome, savingsGoal, rent, totalFixedExpenses, reserveFund,
      quarterlyProvision, annualProvision, dineroLibre, dineroLibrePercent,
      trafficLightStatus, trafficLightMessage, totalSubscriptions,
      totalPurchaseGoalQuotas, goalsWithQuotas, recurringExpenses,
      monthlyRecurring, quarterlyRecurring, annualRecurring,
      hasInsufficientFunds, subscriptions, lacaixaBalance, revolutBalance,
      monthlyRevolutProvision, expensesByCategory,
    };
  }, [profile, expenses, purchaseGoals, userBanks, categories]);

  return {
    profile,
    expenses,
    categories,
    purchaseGoals,
    userBanks,
    loading,
    error,
    hasProfile,
    ...calculations,
    updateProfile,
    addExpense,
    removeExpense,
    updateExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addPurchaseGoal,
    removePurchaseGoal,
    updatePurchaseGoalSaved,
    toggleGoalStatus,
    toggleBank,
    updateBankBalance,
    refetch: fetchData
  };
};
