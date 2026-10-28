import { useEffect, useId, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Repeat, Calendar, Pencil, ChevronDown } from 'lucide-react';
import { Expense, ExpenseFrequency } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

const getMonthlyAmount = (amount: number, frequency: ExpenseFrequency): number => {
  switch (frequency) {
    case 'quarterly': return amount / 3;
    case 'annual': return amount / 12;
    default: return amount;
  }
};

interface ExpenseListProps {
  title: string;
  expenses: Expense[];
  total: number;
  isRecurring: boolean;
  onRemove: (id: string) => void;
  onEdit?: (expense: Expense) => void;
  showFrequency?: boolean;
}

const FrequencyBadge = ({ frequency }: { frequency: ExpenseFrequency }) => {
  const config: Record<ExpenseFrequency, { label: string; className: string }> = {
    monthly: { label: 'Mensual', className: 'bg-recurring/20 text-recurring border-recurring/30' },
    quarterly: { label: 'Trimestral', className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
    annual: { label: 'Anual', className: 'bg-goal/20 text-goal border-goal/30' }
  };

  const { label, className } = config[frequency];

  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', className)}>
      {label}
    </Badge>
  );
};

export const ExpenseListNew = ({
  title,
  expenses,
  total,
  isRecurring,
  onRemove,
  onEdit,
  showFrequency = false
}: ExpenseListProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const listId = useId();
  const allSelected = expenses.length > 0 && expenses.every(expense => selected.has(expense.id));

  useEffect(() => {
    const currentIds = new Set(expenses.map(expense => expense.id));
    setSelected(previous => {
      const next = new Set([...previous].filter(id => currentIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [expenses]);

  const toggleSelection = (id: string, checked: boolean) => {
    setSelected(previous => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const removeSelected = () => {
    selected.forEach(id => onRemove(id));
    setSelected(new Set());
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className={cn('p-3', open && 'pb-3')}>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between gap-3 whitespace-normal p-3 text-left"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(previous => !previous)}
        >
          <span className="flex min-w-0 items-center gap-2 text-lg font-medium">
            {isRecurring ? (
              <span className="shrink-0 p-2 rounded-xl bg-recurring-light">
                <Repeat className="h-5 w-5 text-recurring" />
              </span>
            ) : (
              <span className="shrink-0 p-2 rounded-xl bg-expense-light">
                <Calendar className="h-5 w-5 text-expense" />
              </span>
            )}
            <span>{title} · {expenses.length}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className={cn(
              'text-lg font-bold whitespace-nowrap',
              isRecurring ? 'text-recurring' : 'text-expense'
            )}>
              {formatCurrencyCompact(total)}
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
          </span>
        </Button>
      </CardHeader>
      {open && <CardContent id={listId} className="px-4 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-border pb-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allSelected ? true : selected.size > 0 ? 'indeterminate' : false}
              disabled={expenses.length === 0}
              onCheckedChange={checked => setSelected(checked === true ? new Set(expenses.map(expense => expense.id)) : new Set())}
            />
            Seleccionar todo
          </label>
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size} seleccionados</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                    Eliminar seleccionados
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar {selected.size} gastos?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button type="button" variant="destructive" onClick={removeSelected}>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Quitar selección
              </Button>
            </>
          )}
        </div>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">
            No hay gastos {isRecurring ? 'recurrentes' : 'únicos'}
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-y-2 p-3 bg-muted/50 rounded-xl group"
              >
                <Checkbox
                  className="mr-3"
                  aria-label={`Seleccionar ${expense.name}`}
                  checked={selected.has(expense.id)}
                  onCheckedChange={checked => toggleSelection(expense.id, checked === true)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{expense.name}</span>
                    {showFrequency && expense.frequency && (
                      <FrequencyBadge frequency={expense.frequency} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-semibold whitespace-nowrap">
                    {formatCurrencyCompact(isRecurring ? getMonthlyAmount(expense.amount, expense.frequency) : expense.amount)}
                    {isRecurring && expense.frequency !== 'monthly' && (
                      <span className="text-[10px] text-muted-foreground ml-1">/mes</span>
                    )}
                  </span>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      aria-label={`Editar ${expense.name}`}
                      onClick={() => onEdit(expense)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    aria-label={`Eliminar ${expense.name}`}
                    onClick={() => onRemove(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>}
    </Card>
  );
};
