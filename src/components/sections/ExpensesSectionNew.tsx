import { AddExpenseForm } from '@/components/AddExpenseFormNew';
import { ExpenseListNew } from '@/components/ExpenseListNew';
import { ExpenseFrequency, BankType, Expense } from '@/hooks/useSupabaseFinances';
 import { BankCSVImporter } from '@/components/BankCSVImporter';

interface ExpensesSectionProps {
  recurringExpenses: Expense[];
  oneTimeExpenses: Expense[];
  totalRecurring: number;
  totalOneTime: number;
  onAddExpense: (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency, bank?: BankType) => void;
  onRemoveExpense: (id: string) => void;
}

export const ExpensesSection = ({
  recurringExpenses,
  oneTimeExpenses,
  totalRecurring,
  totalOneTime,
  onAddExpense,
  onRemoveExpense
}: ExpensesSectionProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gastos</h1>

       {/* Importador de movimientos bancarios */}
       <div className="mb-6">
         <BankCSVImporter />
       </div>
 
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <AddExpenseForm onAddExpense={onAddExpense} />
        </div>

        {/* Expense Lists */}
        <div className="lg:col-span-2 space-y-6">
          <ExpenseListNew
            title="Gastos Recurrentes"
            expenses={recurringExpenses}
            total={totalRecurring}
            isRecurring={true}
            onRemove={onRemoveExpense}
            showFrequency={true}
          />
          <ExpenseListNew
            title="Gastos Únicos"
            expenses={oneTimeExpenses}
            total={totalOneTime}
            isRecurring={false}
            onRemove={onRemoveExpense}
            showFrequency={false}
          />
        </div>
      </div>
    </div>
  );
};
