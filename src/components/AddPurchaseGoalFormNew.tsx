import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Gift, CalendarDays, Calculator, AlertTriangle } from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface AddPurchaseGoalFormProps {
  onAddGoal: (name: string, targetAmount: number, targetDate: Date) => void;
  dineroLibre?: number;
}

export const AddPurchaseGoalFormNew = ({ onAddGoal, dineroLibre = 0 }: AddPurchaseGoalFormProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [months, setMonths] = useState('');
  const [quota, setQuota] = useState('');
  const [mode, setMode] = useState<'plazo' | 'cuota'>('plazo');

  // Calculate values in real-time
  const calculations = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    const monthsNum = parseInt(months) || 0;
    const quotaNum = parseFloat(quota) || 0;

    if (mode === 'plazo') {
      // Mode Plazo: Price and Months -> Calculate Quota
      const calculatedQuota = monthsNum > 0 ? priceNum / monthsNum : 0;
      return {
        monthlyQuota: calculatedQuota,
        monthsNeeded: monthsNum,
        isValid: priceNum > 0 && monthsNum > 0,
        targetDate: getTargetDate(monthsNum)
      };
    } else {
      // Mode Cuota: Price and Quota -> Calculate Months
      const calculatedMonths = quotaNum > 0 ? Math.ceil(priceNum / quotaNum) : 0;
      return {
        monthlyQuota: quotaNum,
        monthsNeeded: calculatedMonths,
        isValid: priceNum > 0 && quotaNum > 0,
        targetDate: getTargetDate(calculatedMonths)
      };
    }
  }, [price, months, quota, mode]);

  // Check if quota exceeds dinero libre
  const exceedsFunds = calculations.monthlyQuota > dineroLibre && calculations.monthlyQuota > 0;

  function getTargetDate(monthsAhead: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);
    return date;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !calculations.isValid || exceedsFunds) return;

    onAddGoal(name.trim(), parseFloat(price), calculations.targetDate);
    setName('');
    setPrice('');
    setMonths('');
    setQuota('');
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'plazo' | 'cuota');
    setMonths('');
    setQuota('');
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
              inputMode="text"
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
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="pl-8 bg-background rounded-xl h-12 text-base"
              />
            </div>
          </div>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl">
              <TabsTrigger value="plazo" className="rounded-lg data-[state=active]:bg-goal data-[state=active]:text-goal-foreground">
                <CalendarDays className="h-4 w-4 mr-2" />
                Modo Plazo
              </TabsTrigger>
              <TabsTrigger value="cuota" className="rounded-lg data-[state=active]:bg-goal data-[state=active]:text-goal-foreground">
                <Calculator className="h-4 w-4 mr-2" />
                Modo Cuota
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plazo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="goal-months">Número de Meses</Label>
                <Input
                  id="goal-months"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="120"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  placeholder="¿En cuántos meses?"
                  className="bg-background rounded-xl h-12 text-base"
                />
              </div>
              
              {calculations.monthlyQuota > 0 && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Cuota mensual calculada:</p>
                  <p className={cn(
                    "text-xl font-bold",
                    exceedsFunds ? "text-destructive" : "text-goal"
                  )}>
                    {formatCurrencyCompact(calculations.monthlyQuota)}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cuota" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="goal-quota">Cuota Mensual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    id="goal-quota"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    placeholder="¿Cuánto puedes pagar al mes?"
                    className="pl-8 bg-background rounded-xl h-12 text-base"
                  />
                </div>
              </div>
              
              {calculations.monthsNeeded > 0 && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Meses necesarios:</p>
                  <p className={cn(
                    "text-xl font-bold",
                    exceedsFunds ? "text-destructive" : "text-goal"
                  )}>
                    {calculations.monthsNeeded} meses
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Warning if exceeds funds */}
          {exceedsFunds && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Esta cuota supera tu dinero libre disponible ({formatCurrencyCompact(dineroLibre)})
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-goal hover:bg-goal/90 rounded-xl h-12 text-base"
            disabled={!name.trim() || !calculations.isValid || exceedsFunds}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Objetivo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
