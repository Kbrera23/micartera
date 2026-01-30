import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { Expense, ExpenseFrequency } from '@/types/expense';

interface ExpensesSectionProps {
  recurringExpenses: Expense[];
  oneTimeExpenses: Expense[];
  totalRecurring: number;
  totalOneTime: number;
  onAddExpense: (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency) => void;
  onRemoveExpense: (id: string) => void;
  onToggleRecurring: (id: string) => void;
}

export const ExpensesSection = ({
  recurringExpenses,
  oneTimeExpenses,
  totalRecurring,
  totalOneTime,
  onAddExpense,
  onRemoveExpense,
  onToggleRecurring
}: ExpensesSectionProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gastos</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <AddExpenseForm onAddExpense={onAddExpense} />
        </div>

        {/* Expense Lists */}
        <div className="lg:col-span-2 space-y-6">
          <ExpenseList
            title="Gastos Recurrentes"
            expenses={recurringExpenses}
            total={totalRecurring}
            isRecurring={true}
            onRemove={onRemoveExpense}
            onToggleRecurring={onToggleRecurring}
            showFrequency={true}
          />
          <ExpenseList
            title="Gastos Únicos"
            expenses={oneTimeExpenses}
            total={totalOneTime}
            isRecurring={false}
            onRemove={onRemoveExpense}
            onToggleRecurring={onToggleRecurring}
            showFrequency={false}
          />
        </div>
      </div>
    </div>
  );
};
