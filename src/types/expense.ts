export interface Expense {
  id: string;
  name: string;
  amount: number;
  isRecurring: boolean;
  createdAt: Date;
}

export interface FinanceState {
  monthlyIncome: number;
  savingsGoal: number;
  expenses: Expense[];
}
