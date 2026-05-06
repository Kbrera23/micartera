// Compatibility shim — the app uses types from @/hooks/useSupabaseFinances.
// Some legacy components still import from @/types/expense.
export type { Expense, ExpenseFrequency, BankType, PurchaseGoal } from '@/hooks/useSupabaseFinances';
