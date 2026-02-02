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

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_recurring: boolean;
  frequency: ExpenseFrequency;
  bank: BankType | null;
  created_at: string;
}

export interface PurchaseGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  created_at: string;
}

export interface UserBank {
  id: string;
  user_id: string;
  bank: BankType;
  is_active: boolean;
}

const calculateMonthlyProvision = (amount: number, frequency: ExpenseFrequency): number => {
  switch (frequency) {
    case 'quarterly': return amount / 3;
    case 'annual': return amount / 12;
    default: return 0;
  }
};

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
  const [purchaseGoals, setPurchaseGoals] = useState<PurchaseGoal[]>([]);
  const [userBanks, setUserBanks] = useState<UserBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [profileRes, expensesRes, goalsRes, banksRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('purchase_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_banks').select('*').eq('user_id', user.id)
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
      setPurchaseGoals(goalsRes.data || []);
      setUserBanks(banksRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);
    
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
    bank: BankType | null = null
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
        bank
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

  const removeExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar gasto');
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
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
        target_date: targetDate.toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Error al añadir objetivo');
    } else {
      setPurchaseGoals(prev => [data, ...prev]);
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
    const { error } = await supabase
      .from('purchase_goals')
      .update({ current_amount: newAmount })
      .eq('id', id);
    
    if (error) {
      toast.error('Error al actualizar objetivo');
    } else {
      setPurchaseGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: newAmount } : g));
    }
  };

  // Bank operations
  const toggleBank = async (bankId: BankType) => {
    if (!user) return;
    
    const existing = userBanks.find(b => b.bank === bankId);
    
    if (existing) {
      const { error } = await supabase.from('user_banks').delete().eq('id', existing.id);
      if (!error) {
        setUserBanks(prev => prev.filter(b => b.id !== existing.id));
      }
    } else {
      const { data, error } = await supabase
        .from('user_banks')
        .insert({ user_id: user.id, bank: bankId })
        .select()
        .single();
      
      if (!error && data) {
        setUserBanks(prev => [...prev, data]);
      }
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyIncome = profile?.monthly_income || 0;
    const savingsGoal = profile?.savings_goal || 0;
    const rent = profile?.rent || 0;

    const recurringExpenses = expenses.filter(e => e.is_recurring);
    const monthlyRecurring = recurringExpenses.filter(e => e.frequency === 'monthly');
    const nonMonthlyRecurring = recurringExpenses.filter(e => e.frequency !== 'monthly');

    // Total fixed monthly expenses
    const totalMonthlyRecurring = monthlyRecurring.reduce((sum, e) => sum + e.amount, 0);

    // Reserve fund (provisions for quarterly and annual)
    const reserveFund = nonMonthlyRecurring.reduce((sum, e) => {
      return sum + calculateMonthlyProvision(e.amount, e.frequency);
    }, 0);

    // Total fixed = monthly recurring + provisioned amount
    const totalFixedExpenses = totalMonthlyRecurring;

    // Purchase goals quotas
    const goalsWithQuotas = purchaseGoals.map(goal => {
      const remaining = goal.target_amount - goal.current_amount;
      const months = calculateMonthsRemaining(goal.target_date);
      const monthlyQuota = remaining > 0 ? remaining / months : 0;
      const progressPercent = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
      
      return {
        ...goal,
        monthlyQuota,
        monthsRemaining: months,
        progressPercent
      };
    });

    const totalPurchaseGoalQuotas = goalsWithQuotas.reduce((sum, g) => sum + g.monthlyQuota, 0);

    // Subscriptions for ING
    const subscriptionKeywords = ['netflix', 'spotify', 'hbo', 'disney', 'amazon', 'prime', 'internet', 'gym', 'gimnasio', 'movil', 'telefono', 'fibra'];
    const subscriptions = monthlyRecurring.filter(e => 
      subscriptionKeywords.some(keyword => e.name.toLowerCase().includes(keyword))
    );
    const totalSubscriptions = subscriptions.reduce((sum, e) => sum + e.amount, 0);

    // Dinero Libre = Nómina - Gastos Fijos - Provisión Ahorro - Cuotas Objetivos
    const dineroLibre = monthlyIncome - totalFixedExpenses - savingsGoal - reserveFund - totalPurchaseGoalQuotas;

    // Has insufficient funds (dinero libre negativo después de todas las provisiones)
    const hasInsufficientFunds = dineroLibre < 0;

    return {
      monthlyIncome,
      savingsGoal,
      rent,
      totalFixedExpenses,
      reserveFund,
      dineroLibre,
      totalSubscriptions,
      totalPurchaseGoalQuotas,
      goalsWithQuotas,
      recurringExpenses,
      monthlyRecurring,
      nonMonthlyRecurring,
      hasInsufficientFunds,
      subscriptions
    };
  }, [profile, expenses, purchaseGoals]);

  return {
    profile,
    expenses,
    purchaseGoals,
    userBanks,
    loading,
    hasProfile,
    ...calculations,
    updateProfile,
    addExpense,
    removeExpense,
    addPurchaseGoal,
    removePurchaseGoal,
    updatePurchaseGoalSaved,
    toggleBank,
    refetch: fetchData
  };
};
