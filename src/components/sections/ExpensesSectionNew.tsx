import { useState } from 'react';
import { AddExpenseForm } from '@/components/AddExpenseFormNew';
import { ExpenseListNew } from '@/components/ExpenseListNew';
import { ExpenseFrequency, BankType, Expense, Category } from '@/hooks/useSupabaseFinances';
import { BankExcelImporter } from '@/components/BankExcelImporter';
import { useSupabaseFinances } from '@/hooks/useSupabaseFinances';
import { EditExpenseModal } from '@/components/EditExpenseModal';
import { ExpenseFilters } from '@/components/ExpenseFilters';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';

interface ExpensesSectionProps {
  recurringExpenses: Expense[];
  oneTimeExpenses: Expense[];
  totalRecurring: number;
  totalOneTime: number;
  onAddExpense: (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency, bank?: BankType) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  categories?: Category[];
}

export const ExpensesSection = ({
  recurringExpenses,
  oneTimeExpenses,
  totalRecurring,
  totalOneTime,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  categories = [],
}: ExpensesSectionProps) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { refetch } = useSupabaseFinances();

  const allExpenses = [...recurringExpenses, ...oneTimeExpenses];
  const {
    filters,
    setFilters,
    filteredExpenses,
    totalCount,
    filteredCount,
  } = useExpenseFilters(allExpenses);

  const filteredRecurring = filteredExpenses.filter(e => e.is_recurring);
  const filteredOneTime = filteredExpenses.filter(e => !e.is_recurring);
  const filteredRecurringTotal = filteredRecurring.reduce((sum, e) => {
    if (e.frequency === 'quarterly') return sum + e.amount / 3;
    if (e.frequency === 'annual') return sum + e.amount / 12;
    return sum + e.amount;
  }, 0);
  const filteredOneTimeTotal = filteredOneTime.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gastos</h1>

      {/* Importador de movimientos bancarios */}
      <div className="mb-6">
        <BankExcelImporter onImported={refetch} />
      </div>

      {/* Filtros */}
      <ExpenseFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalExpenses={totalCount}
        filteredCount={filteredCount}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <AddExpenseForm onAddExpense={onAddExpense} />
        </div>

        {/* Expense Lists */}
        <div className="lg:col-span-2 space-y-6">
          {filteredCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-foreground">No se encontraron gastos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Intenta con otros filtros o añade un nuevo gasto
              </p>
            </div>
          ) : (
            <>
              {filteredRecurring.length > 0 && (
                <ExpenseListNew
                  title="Gastos Recurrentes"
                  expenses={filteredRecurring}
                  total={filteredRecurringTotal}
                  isRecurring={true}
                  onRemove={onRemoveExpense}
                  onEdit={setEditingExpense}
                  showFrequency={true}
                />
              )}
              {filteredOneTime.length > 0 && (
                <ExpenseListNew
                  title="Gastos Únicos"
                  expenses={filteredOneTime}
                  total={filteredOneTimeTotal}
                  isRecurring={false}
                  onRemove={onRemoveExpense}
                  onEdit={setEditingExpense}
                  showFrequency={false}
                />
              )}
            </>
          )}
        </div>
      </div>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={onUpdateExpense}
          categories={categories}
        />
      )}
    </div>
  );
};
