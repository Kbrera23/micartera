export type ExpenseFrequency = 'monthly' | 'quarterly' | 'annual';

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

export interface BankAccount {
  id: string;
  name: 'santander' | 'lacaixa' | 'ing' | 'revolut';
  displayName: string;
  color: string;
}

export interface FinanceState {
  monthlyIncome: number;
  savingsGoal: number;
  expenses: Expense[];
  purchaseGoals: PurchaseGoal[];
}
