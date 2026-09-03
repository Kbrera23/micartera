import { useState, useMemo } from 'react';
import { Receipt, RefreshCw, Plus } from 'lucide-react';
import { AddExpenseForm } from '@/components/AddExpenseFormNew';
import { ExpenseListNew } from '@/components/ExpenseListNew';
import { ExpenseFrequency, BankType, Expense, Category } from '@/hooks/useSupabaseFinances';
import { BankExcelImporter } from '@/components/BankExcelImporter';
import { EditExpenseModal } from '@/components/EditExpenseModal';
import { ExpenseFilters } from '@/components/ExpenseFilters';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';
import { formatCurrencyCompact } from '@/lib/currency';

interface ExpensesSectionProps {
  recurringExpenses: Expense[];
  oneTimeExpenses: Expense[];
  totalRecurring: number;
  totalOneTime: number;
  onAddExpense: (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency, bank?: BankType) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  categories?: Category[];
  refetch?: () => void;
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
  refetch,
}: ExpensesSectionProps) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const visibleRecurring = useMemo(
    () => recurringExpenses.filter(e => !e.is_payment_record),
    [recurringExpenses]
  );
  const visibleOneTime = useMemo(
    () => oneTimeExpenses.filter(e => !e.is_payment_record),
    [oneTimeExpenses]
  );

  const allExpenses = useMemo(
    () => [...visibleRecurring, ...visibleOneTime],
    [visibleRecurring, visibleOneTime]
  );

  const { filters, setFilters, filteredExpenses, totalCount, filteredCount } = useExpenseFilters(allExpenses);

  const filteredRecurring = useMemo(() => filteredExpenses.filter(e => e.is_recurring), [filteredExpenses]);
  const filteredOneTime = useMemo(() => filteredExpenses.filter(e => !e.is_recurring), [filteredExpenses]);

  // Solo gastos mensuales: trimestrales/anuales se descuentan al pulsar "Hecho"
  const filteredRecurringTotal = useMemo(() =>
    filteredRecurring
      .filter(e => e.frequency === 'monthly')
      .reduce((sum, e) => sum + e.amount, 0),
    [filteredRecurring]);

  const filteredOneTimeTotal = useMemo(() =>
    filteredOneTime.reduce((sum, e) => sum + e.amount, 0),
    [filteredOneTime]);

  const totalGastos = totalRecurring + totalOneTime;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="glass-card-elevated rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-expense/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-expense/10 border border-expense/20">
                <Receipt className="w-4 h-4 text-expense" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              Total mensual: <span className="text-foreground font-semibold">{formatCurrencyCompact(totalGastos)}</span>
            </p>
          </div>
          {/* Resumen rápido */}
          <div className="hidden sm:flex gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Recurrentes</p>
              <p className="text-sm font-bold text-primary">{formatCurrencyCompact(totalRecurring)}</p>
            </div>
            <div className="w-px bg-border/50" />
            <div>
              <p className="text-xs text-muted-foreground">Únicos</p>
              <p className="text-sm font-bold text-foreground">{formatCurrencyCompact(totalOneTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Importador bancario */}
      <div className="glass-card rounded-2xl p-4">
        <BankExcelImporter onImported={refetch ?? (() => {})} />
      </div>

      {/* Filtros */}
      <ExpenseFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalExpenses={totalCount}
        filteredCount={filteredCount}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Añadir Gasto</h3>
            </div>
            <AddExpenseForm onAddExpense={onAddExpense} />
          </div>
        </div>

        {/* Listas */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCount === 0 ? (
            <div className="glass-card rounded-2xl py-14 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <RefreshCw className="w-7 h-7 text-muted-foreground/50" />
              </div>
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