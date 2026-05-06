// Legacy shim — only used by unused legacy components/hooks.
// The active app uses types from @/hooks/useSupabaseFinances directly.
export type ExpenseFrequency = 'monthly' | 'quarterly' | 'annual';
export type BankType = 'santander' | 'lacaixa' | 'ing' | 'revolut' | 'bbva';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  isRecurring: boolean;
  frequency: ExpenseFrequency;
  category?: string;
  createdAt: Date;
}

export interface PurchaseGoal {
  id: string;
  name: string;
  targetPrice: number;
  targetDate: Date;
  savedAmount: number;
  createdAt: Date;
}

export interface FinanceState {
  monthlyIncome: number;
  savingsGoal: number;
  expenses: Expense[];
  purchaseGoals: PurchaseGoal[];
}
