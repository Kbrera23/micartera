import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Gift, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AddPurchaseGoalFormProps {
  onAddGoal: (name: string, targetAmount: number, targetDate: Date) => void;
}

export const AddPurchaseGoalFormNew = ({ onAddGoal }: AddPurchaseGoalFormProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

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
              className="bg-background rounded-xl h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-price">Precio Total</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                id="goal-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="pl-8 bg-background rounded-xl h-12 text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fecha Objetivo</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl h-12 bg-background",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP", { locale: es }) : <span>¿Cuándo lo quieres?</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={(date) => {
                    setTargetDate(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date < getMinDate()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            type="submit"
            className="w-full bg-goal hover:bg-goal/90 rounded-xl h-12 text-base"
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
