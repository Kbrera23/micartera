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
  initial_balance: number;
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
      setUserBanks((banksRes.data || []).map(b => ({
        ...b,
        initial_balance: b.initial_balance || 0
      })));
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
        .insert({ user_id: user.id, bank: bankId, initial_balance: 0 })
        .select()
        .single();
      
      if (!error && data) {
        setUserBanks(prev => [...prev, { ...data, initial_balance: data.initial_balance || 0 }]);
      }
    }
  };

  // Update bank initial balance
  const updateBankBalance = async (bankId: BankType, balance: number) => {
    if (!user) return;
    
    const bank = userBanks.find(b => b.bank === bankId);
    if (!bank) return;

    const { error } = await supabase
      .from('user_banks')
      .update({ initial_balance: balance })
      .eq('id', bank.id);

    if (error) {
      toast.error('Error al actualizar saldo');
    } else {
      setUserBanks(prev => prev.map(b => 
        b.bank === bankId ? { ...b, initial_balance: balance } : b
      ));
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

    // Total fixed monthly expenses
    const totalMonthlyRecurring = monthlyRecurring.reduce((sum, e) => sum + e.amount, 0);

    // Quarterly provisions (1/3 of quarterly expenses)
    const quarterlyProvision = quarterlyRecurring.reduce((sum, e) => sum + (e.amount / 3), 0);
    
    // Annual provisions (1/12 of annual expenses)  
    const annualProvision = annualRecurring.reduce((sum, e) => sum + (e.amount / 12), 0);

    // Reserve fund = quarterly + annual provisions
    const reserveFund = quarterlyProvision + annualProvision;

    // Total fixed = monthly recurring only
    const totalFixedExpenses = totalMonthlyRecurring;

    // Bank initial balances (El Colchón)
    const lacaixaBalance = userBanks.find(b => b.bank === 'lacaixa')?.initial_balance || 0;
    const revolutBalance = userBanks.find(b => b.bank === 'revolut')?.initial_balance || 0;

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

    // Dinero Libre = Nómina - Alquiler - Gastos Fijos - Provisión Ahorro - Fondo Reserva - Cuotas Objetivos
    const dineroLibre = monthlyIncome - rent - totalFixedExpenses - savingsGoal - reserveFund - totalPurchaseGoalQuotas;

    // Has insufficient funds (dinero libre negativo después de todas las provisiones)
    const hasInsufficientFunds = dineroLibre < 0;

    // Traffic light status for dinero libre
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

    // Monthly amount to move to Revolut for quarterly provisions
    const monthlyRevolutProvision = quarterlyProvision;

    return {
      monthlyIncome,
      savingsGoal,
      rent,
      totalFixedExpenses,
      reserveFund,
      quarterlyProvision,
      annualProvision,
      dineroLibre,
      dineroLibrePercent,
      trafficLightStatus,
      trafficLightMessage,
      totalSubscriptions,
      totalPurchaseGoalQuotas,
      goalsWithQuotas,
      recurringExpenses,
      monthlyRecurring,
      quarterlyRecurring,
      annualRecurring,
      hasInsufficientFunds,
      subscriptions,
      lacaixaBalance,
      revolutBalance,
      monthlyRevolutProvision
    };
  }, [profile, expenses, purchaseGoals, userBanks]);

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
    updateBankBalance,
    refetch: fetchData
  };
};
