import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Receipt } from 'lucide-react';
import { ExpenseFrequency, BankType } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';

interface AddExpenseFormProps {
  onAddExpense: (name: string, amount: number, isRecurring: boolean, frequency: ExpenseFrequency, bank?: BankType) => void;
}

export const AddExpenseForm = ({ onAddExpense }: AddExpenseFormProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<ExpenseFrequency>('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    onAddExpense(name.trim(), parseFloat(amount), isRecurring, frequency);
    setName('');
    setAmount('');
    setIsRecurring(false);
    setFrequency('monthly');
  };

  const parsedAmount = parseFloat(amount) || 0;

  return (
    <Card className="glass-card animate-fade-in rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-xl bg-expense-light">
            <Receipt className="h-5 w-5 text-expense" />
          </div>
          Añadir Gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-name">Descripción</Label>
            <Input
              id="expense-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Netflix, Alquiler, Cena..."
              className="bg-background rounded-xl h-12 text-base"
              inputMode="text"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Cantidad</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="pl-8 bg-background rounded-xl h-12 text-base"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Gasto recurrente</Label>
              <p className="text-xs text-muted-foreground">Se repite periódicamente</p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2 animate-fade-in">
              <Label>Frecuencia</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as ExpenseFrequency)}>
                <SelectTrigger className="rounded-xl h-12 bg-background">
                  <SelectValue placeholder="Selecciona frecuencia" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  <SelectItem value="monthly">📅 Mensual</SelectItem>
                  <SelectItem value="quarterly">📆 Trimestral</SelectItem>
                  <SelectItem value="annual">🗓️ Anual</SelectItem>
                </SelectContent>
              </Select>
              {frequency === 'quarterly' && parsedAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Se provisionará {formatCurrencyCompact(parsedAmount / 3)}/mes
                </p>
              )}
              {frequency === 'annual' && parsedAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Se provisionará {formatCurrencyCompact(parsedAmount / 12)}/mes
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-expense hover:bg-expense/90 rounded-xl h-12 text-base"
            disabled={!name.trim() || !amount}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Gasto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
