import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Receipt } from 'lucide-react';

interface AddExpenseFormProps {
  onAddExpense: (name: string, amount: number, isRecurring: boolean) => void;
}

export const AddExpenseForm = ({ onAddExpense }: AddExpenseFormProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    onAddExpense(name.trim(), parseFloat(amount), isRecurring);
    setName('');
    setAmount('');
    setIsRecurring(false);
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-lg bg-expense-light">
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
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Cantidad</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 bg-background"
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Gasto recurrente</Label>
              <p className="text-xs text-muted-foreground">Se repite cada mes</p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-expense hover:bg-expense/90"
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
