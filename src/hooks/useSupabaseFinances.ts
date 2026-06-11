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

export interface GoalWithQuota extends PurchaseGoal {
  monthlyQuota: number;
  monthsRemaining: number;
  progressPercent: number;
}

export interface UserBank {
  id: string;
  user_id: string;
  bank: BankType;
  is_active: boolean;
  initial_balance: number;
}

export interface MonthlySaving {
  id: string;
  user_id: string;
  year: number;
  month: number;
  bank: BankType;
  amount: number;
  note: string | null;
  created_at: string;
}

// ✅ CORREGIDO: encoding de emojis y tildes corregido
const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', color: '#10b981', icon: '🛒', budget_limit: 500, is_default: true },
  { name: 'Transporte',   color: '#3b82f6', icon: '🚗', budget_limit: 300, is_default: true },
  { name: 'Ocio',         color: '#8b5cf6', icon: '🎮', budget_limit: 200, is_default: true },
  { name: 'Suscripciones',color: '#f59e0b', icon: '📺', budget_limit: 100, is_default: true },
  { name: 'Hogar',        color: '#ef4444', icon: '🏠', budget_limit: 400, is_default: true },
  { name: 'Salud',        color: '#ec4899', icon: '💊', budget_limit: 150, is_default: true },
  { name: 'Ropa',         color: '#6366f1', icon: '👕', budget_limit: 200, is_default: true },
  { name: 'Otros',        color: '#6b7280', icon: '📦', budget_limit: 0,   is_default: true },
];

const normalizeCategoryName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-ES');

const dedupeCategories = (items: Category[]) => {
  const seen = new Set<string>();
  return items.filter(category => {
    const key = `${category.user_id}:${normalizeCategoryName(category.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const calculateMonthsRemaining = (targetDate: string): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return Math.max(1, months);
};

export const useSupabaseFinances = () => {
  const { user } = useAuth();
  const [profile, setProfile]             = useState<Profile | null>(null);
  const [expenses, setExpenses]           = useState<Expense[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [purchaseGoals, setPurchaseGoals] = useState<PurchaseGoal[]>([]);
  const [userBanks, setUserBanks]         = useState<UserBank[]>([]);
  const [loading, setLoading]             = useState(true);
  const [hasProfile, setHasProfile]       = useState<boolean | null>(null);
  const [error, setError]                 = useState<Error | null>(null);
  const [paidThisMonth, setPaidThisMonth] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState<MonthlySaving[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now          = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear  = now.getFullYear();

      // ✅ CORREGIDO: eliminados @ts-ignore y "as any" — categories ya está en los tipos
      //    de Supabase (Database). monthly_payments_tracking también.
      const [profileRes, expensesRes, goalsRes, banksRes, categoriesRes, trackingRes, savingsRes] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('purchase_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('user_banks').select('*').eq('user_id', user.id),
          supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
          supabase.from('monthly_payments_tracking').select('amount').eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
          supabase.from('monthly_savings').select('*').eq('user_id', user.id).order('year', { ascending: false }).order('month', { ascending: false }).order('created_at', { ascending: false }),
        ]);


      if (profileRes.data) {
        setProfile(profileRes.data);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }

      setExpenses(
        (expensesRes.data || []).map(e => ({
          ...e,
          frequency: (e.frequency as ExpenseFrequency) || 'monthly',
        }))
      );
      setPurchaseGoals(
        (goalsRes.data || []).map(g => ({
          ...g,
          status: (g.status as 'active' | 'pending') || 'active',
        }))
      );
      setUserBanks(
        (banksRes.data || []).map(b => ({
          ...b,
          initial_balance: b.initial_balance || 0,
        }))
      );

      // Suma de pagos realizados este mes
      const totalPaid = (trackingRes.data || []).reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
      );
      setPaidThisMonth(totalPaid);

      setMonthlySavings(
        (savingsRes.data || []).map(s => ({
          ...s,
          bank: s.bank as BankType,
          amount: Number(s.amount || 0),
        }))
      );


      // Categorías: crear defaults si no existe ninguna, siempre deduplicar
      // ✅ CORREGIDO: eliminado "as unknown as Category[]" y "(supabase as any)"
      const cats = dedupeCategories((categoriesRes.data || []) as Category[]);
      if (cats.length === 0) {
        await Promise.allSettled(
          DEFAULT_CATEGORIES.map(cat =>
            supabase.from('categories').insert({ user_id: user.id, ...cat })
          )
        );
        const { data: createdCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        setCategories(dedupeCategories((createdCategories || []) as Category[]));
      } else {
        setCategories(cats);
      }
    } catch (err) {
      // ✅ CORREGIDO: se mantiene el console.error para debugging interno del fetch,
      //    pero el error queda en el state para que el ErrorBoundary lo muestre al usuario
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Operaciones de perfil ─────────────────────────────────────────────────
  const updateProfile = async (
    data: Partial<Pick<Profile, 'monthly_income' | 'savings_goal' | 'rent'>>
  ) => {
    if (!user || !profile) return;
    const { error } = await supabase.from('profiles').update(data).eq('user_id', user.id);
    if (error) {
      toast.error('Error al actualizar perfil');
    } else {
      setProfile(prev => (prev ? { ...prev, ...data } : null));
      toast.success('Perfil actualizado');
    }
  };

  // ─── Operaciones de gastos ─────────────────────────────────────────────────
  const addExpense = async (
    name: string,
    amount: number,
    isRecurring: boolean,
    frequency: ExpenseFrequency = 'monthly',
    bank: BankType | null = null,
    categoryId: string | null = null
  ) => {
    if (!user) return;
    // ✅ CORREGIDO: eliminado @ts-ignore — category_id ya está en el tipo Insert de expenses
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        name,
        amount,
        is_recurring: isRecurring,
        frequency,
        bank,
        category_id: categoryId,
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
      setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
      toast.success('Gasto actualizado');
    } catch (err) {
      // ✅ CORREGIDO: eliminado console.error redundante — el toast ya informa al usuario
      toast.error('Error al actualizar gasto');
      throw err;
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

  // ─── Operaciones de categorías ─────────────────────────────────────────────
  const addCategory = async (
    name: string,
    color: string,
    icon: string,
    budgetLimit: number
  ) => {
    if (!user) return;
    const cleanName      = name.trim().replace(/\s+/g, ' ');
    const normalizedName = normalizeCategoryName(cleanName);
    if (categories.some(c => normalizeCategoryName(c.name) === normalizedName)) {
      toast.info('Esa categoría ya existe');
      return;
    }
    // ✅ CORREGIDO: eliminado "(supabase as any)" — categories está en los tipos
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: cleanName, color, icon, budget_limit: budgetLimit, is_default: false })
      .select()
      .single();
    if (error) {
      toast.error(error.code === '23505' ? 'Esa categoría ya existe' : 'Error al crear categoría');
    } else if (data) {
      setCategories(prev => dedupeCategories([...prev, data as Category]));
      toast.success('Categoría creada');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    // ✅ CORREGIDO: eliminado "(supabase as any)"
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (error) {
      toast.error('Error al actualizar categoría');
    } else {
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
      toast.success('Categoría actualizada');
    }
  };

  const deleteCategory = async (id: string) => {
    // ✅ CORREGIDO: eliminado "(supabase as any)"
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar categoría');
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoría eliminada');
    }
  };

  // ─── Operaciones de objetivos ──────────────────────────────────────────────
  const addPurchaseGoal = async (name: string, targetAmount: number, targetDate: Date) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchase_goals')
      .insert({
        user_id: user.id,
        name,
        target_amount: targetAmount,
        target_date: targetDate.toISOString().split('T')[0],
        status: 'pending',
      })
      .select()
      .single();
    if (error) {
      toast.error('Error al añadir objetivo');
    } else {
      setPurchaseGoals(prev => [
        { ...data, status: (data.status as 'active' | 'pending') || 'pending' },
        ...prev,
      ]);
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
      setPurchaseGoals(prev => prev.map(g => (g.id === id ? { ...g, current_amount: newAmount } : g)));
    }
  };

  const toggleGoalStatus = async (goalId: string, newStatus: 'active' | 'pending') => {
    try {
      const { error } = await supabase
        .from('purchase_goals')
        .update({ status: newStatus })
        .eq('id', goalId);
      if (error) throw error;
      setPurchaseGoals(prev =>
        prev.map(g => (g.id === goalId ? { ...g, status: newStatus } : g))
      );
      toast.success(newStatus === 'active' ? 'Objetivo activado' : 'Objetivo pausado');
    } catch (err) {
      // ✅ CORREGIDO: eliminado console.error — el toast informa al usuario
      toast.error('Error al actualizar estado del objetivo');
    }
  };

  // ─── Operaciones de bancos ─────────────────────────────────────────────────
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
    const { error } = await supabase
      .from('user_banks')
      .update({ initial_balance: balance })
      .eq('id', bank.id);
    if (error) {
      toast.error('Error al actualizar saldo');
    } else {
      setUserBanks(prev => prev.map(b => (b.bank === bankId ? { ...b, initial_balance: balance } : b)));
      toast.success('Saldo actualizado');
    }
  };

  // ─── Ahorros mensuales registrados ─────────────────────────────────────────
  const addMonthlySaving = async (
    year: number,
    month: number,
    bank: BankType,
    amount: number,
    note?: string | null
  ) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('monthly_savings')
      .insert({ user_id: user.id, year, month, bank, amount, note: note || null })
      .select()
      .single();
    if (error) {
      toast.error('Error al registrar el ahorro');
    } else if (data) {
      setMonthlySavings(prev => [
        { ...data, bank: data.bank as BankType, amount: Number(data.amount || 0) },
        ...prev,
      ]);
      toast.success('Ahorro registrado');
    }
  };

  const removeMonthlySaving = async (id: string) => {
    const { error } = await supabase.from('monthly_savings').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar el ahorro');
    } else {
      setMonthlySavings(prev => prev.filter(s => s.id !== id));
      toast.success('Ahorro eliminado');
    }
  };

  // ─── Cálculos derivados ────────────────────────────────────────────────────
  const calculations = useMemo(() => {
    const monthlyIncome = profile?.monthly_income || 0;
    const savingsGoal   = profile?.savings_goal   || 0;
    const rent          = profile?.rent           || 0;

    const recurringExpenses  = expenses.filter(e => e.is_recurring);
    const monthlyRecurring   = recurringExpenses.filter(e => e.frequency === 'monthly');
    const quarterlyRecurring = recurringExpenses.filter(e => e.frequency === 'quarterly');
    const annualRecurring    = recurringExpenses.filter(e => e.frequency === 'annual');

    const totalMonthlyRecurring = monthlyRecurring.reduce((sum, e) => sum + e.amount, 0);
    const quarterlyProvision    = quarterlyRecurring.reduce((sum, e) => sum + e.amount / 3, 0);
    const annualProvision       = annualRecurring.reduce((sum, e) => sum + e.amount / 12, 0);
    const reserveFund           = quarterlyProvision + annualProvision;
    const totalFixedExpenses    = totalMonthlyRecurring;

    const lacaixaBalance = userBanks.find(b => b.bank === 'lacaixa')?.initial_balance || 0;
    const revolutBalance = userBanks.find(b => b.bank === 'revolut')?.initial_balance || 0;

    const goalsWithQuotas: GoalWithQuota[] = purchaseGoals.map(goal => {
      const remaining      = goal.target_amount - goal.current_amount;
      const months         = calculateMonthsRemaining(goal.target_date);
      const monthlyQuota   = remaining > 0 ? remaining / months : 0;
      const progressPercent = goal.target_amount > 0
        ? (goal.current_amount / goal.target_amount) * 100
        : 0;
      return { ...goal, monthlyQuota, monthsRemaining: months, progressPercent };
    });

    const totalPurchaseGoalQuotas = goalsWithQuotas
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.monthlyQuota, 0);

    const subscriptionKeywords = [
      'netflix', 'spotify', 'hbo', 'disney', 'amazon', 'prime',
      'internet', 'gym', 'gimnasio', 'movil', 'telefono', 'fibra',
    ];
    const subscriptions    = monthlyRecurring.filter(e =>
      subscriptionKeywords.some(kw => e.name.toLowerCase().includes(kw))
    );
    const totalSubscriptions = subscriptions.reduce((sum, e) => sum + e.amount, 0);

    const dineroLibre        = monthlyIncome - rent - totalFixedExpenses - savingsGoal - totalPurchaseGoalQuotas - paidThisMonth;
    const hasInsufficientFunds = dineroLibre < 0;
    const dineroLibrePercent   = monthlyIncome > 0 ? (dineroLibre / monthlyIncome) * 100 : 0;

    // ✅ CORREGIDO: encoding del mensaje corregido
    let trafficLightStatus: 'green' | 'yellow' | 'red' = 'green';
    let trafficLightMessage = '¡Libertad financiera!';
    if (dineroLibrePercent < 10) {
      trafficLightStatus  = 'red';
      trafficLightMessage = 'Prioriza lo esencial';
    } else if (dineroLibrePercent < 30) {
      trafficLightStatus  = 'yellow';
      trafficLightMessage = 'Gasta con cabeza';
    }

    const monthlyRevolutProvision = quarterlyProvision;

    // Gastos por categoría
    const expensesByCategory = categories
      .map(cat => {
        const catExpenses = expenses.filter(e => e.category_id === cat.id);
        const total = catExpenses.reduce((sum, e) => {
          if (e.is_recurring) {
            if (e.frequency === 'quarterly') return sum + e.amount / 3;
            if (e.frequency === 'annual')    return sum + e.amount / 12;
          }
          return sum + e.amount;
        }, 0);
        return {
          category:    cat,
          total,
          percentage:  cat.budget_limit > 0 ? (total / cat.budget_limit) * 100 : 0,
          remaining:   cat.budget_limit - total,
          isOverBudget: total > cat.budget_limit && cat.budget_limit > 0,
        };
      })
      .filter(item => item.total > 0 || item.category.budget_limit > 0);

    return {
      monthlyIncome, savingsGoal, rent, totalFixedExpenses, reserveFund,
      quarterlyProvision, annualProvision, dineroLibre, dineroLibrePercent,
      trafficLightStatus, trafficLightMessage, totalSubscriptions,
      totalPurchaseGoalQuotas, goalsWithQuotas, recurringExpenses,
      monthlyRecurring, quarterlyRecurring, annualRecurring,
      hasInsufficientFunds, subscriptions, lacaixaBalance, revolutBalance,
      monthlyRevolutProvision, expensesByCategory,
    };
  }, [profile, expenses, purchaseGoals, userBanks, categories, paidThisMonth]);

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
    refetch: fetchData,
  };
};