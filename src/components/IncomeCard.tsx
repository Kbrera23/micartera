import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, Check, Pencil } from 'lucide-react';

interface IncomeCardProps {
  monthlyIncome: number;
  onSetIncome: (amount: number) => void;
}

export const IncomeCard = ({ monthlyIncome, onSetIncome }: IncomeCardProps) => {
  const [isEditing, setIsEditing] = useState(monthlyIncome === 0);
  const [inputValue, setInputValue] = useState(monthlyIncome.toString());

  const handleSave = () => {
    const amount = parseFloat(inputValue) || 0;
    onSetIncome(amount);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="gradient-income h-2" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-lg bg-income-light">
            <Wallet className="h-5 w-5 text-income" />
          </div>
          Ingreso Mensual
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-8 text-xl font-semibold"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <Button onClick={handleSave} className="bg-income hover:bg-income/90">
              <Check className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-income">
              €{monthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setInputValue(monthlyIncome.toString());
                setIsEditing(true);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2">Recurrente cada mes</p>
      </CardContent>
    </Card>
  );
};
