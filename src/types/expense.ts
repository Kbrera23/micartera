export interface Expense {
  id: string;
  name: string;
  amount: number;
  isRecurring: boolean;
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
