import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Gift } from 'lucide-react';

interface AddPurchaseGoalFormProps {
  onAddGoal: (name: string, targetPrice: number, targetDate: Date) => void;
}

export const AddPurchaseGoalForm = ({ onAddGoal }: AddPurchaseGoalFormProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !targetDate) return;

    onAddGoal(name.trim(), parseFloat(price), targetDate);
    setName('');
    setPrice('');
    setTargetDate(undefined);
  };

  // Get minimum date (next month)
  const getMinDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  };

  return (
    <Card className="glass-card animate-fade-in rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-xl bg-goal-light">
            <Gift className="h-5 w-5 text-goal" />
          </div>
          Nuevo Objetivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">¿Qué quieres comprar?</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: AirPods, Moto, iPhone..."
              className="bg-background rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-price">Precio Total</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                id="goal-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-8 bg-background rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fecha Objetivo</Label>
            <DatePicker
              date={targetDate}
              onDateChange={setTargetDate}
              minDate={getMinDate()}
              placeholder="¿Cuándo lo quieres?"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-goal hover:bg-goal/90 rounded-xl"
            disabled={!name.trim() || !price || !targetDate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Objetivo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
