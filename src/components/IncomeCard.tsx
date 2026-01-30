import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, Check, Pencil, PiggyBank } from 'lucide-react';

interface IncomeCardProps {
  monthlyIncome: number;
  savingsGoal: number;
  onSetIncome: (amount: number) => void;
  onSetSavingsGoal: (amount: number) => void;
}

export const IncomeCard = ({ monthlyIncome, savingsGoal, onSetIncome, onSetSavingsGoal }: IncomeCardProps) => {
  const [isEditingIncome, setIsEditingIncome] = useState(monthlyIncome === 0);
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [incomeValue, setIncomeValue] = useState(monthlyIncome.toString());
  const [savingsValue, setSavingsValue] = useState(savingsGoal.toString());

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const handleSaveIncome = () => {
    const amount = parseFloat(incomeValue) || 0;
    onSetIncome(amount);
    setIsEditingIncome(false);
  };

  const handleSaveSavings = () => {
    const amount = parseFloat(savingsValue) || 0;
    onSetSavingsGoal(amount);
    setIsEditingSavings(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'income' | 'savings') => {
    if (e.key === 'Enter') {
      type === 'income' ? handleSaveIncome() : handleSaveSavings();
    }
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in rounded-2xl">
      <div className="gradient-income h-2" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-xl bg-income-light">
            <Wallet className="h-5 w-5 text-income" />
          </div>
          Ingreso Mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Income Section */}
        {isEditingIncome ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                value={incomeValue}
                onChange={(e) => setIncomeValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'income')}
                className="pl-8 text-xl font-semibold rounded-xl"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <Button onClick={handleSaveIncome} className="bg-income hover:bg-income/90 rounded-xl">
              <Check className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-income">
              {formatCurrency(monthlyIncome)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIncomeValue(monthlyIncome.toString());
                setIsEditingIncome(true);
              }}
              className="text-muted-foreground hover:text-foreground rounded-xl"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">Recurrente cada mes</p>

        {/* Savings Goal Section */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-recurring-light">
              <PiggyBank className="h-4 w-4 text-recurring" />
            </div>
            <span className="text-sm font-medium">Objetivo de Ahorro Mensual</span>
          </div>
          
          {isEditingSavings ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  value={savingsValue}
                  onChange={(e) => setSavingsValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'savings')}
                  className="pl-8 font-semibold rounded-xl"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <Button onClick={handleSaveSavings} className="bg-recurring hover:bg-recurring/90 rounded-xl">
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-recurring">
                {formatCurrency(savingsGoal)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSavingsValue(savingsGoal.toString());
                  setIsEditingSavings(true);
                }}
                className="text-muted-foreground hover:text-foreground rounded-xl"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Se reserva automáticamente del saldo</p>
        </div>
      </CardContent>
    </Card>
  );
};
