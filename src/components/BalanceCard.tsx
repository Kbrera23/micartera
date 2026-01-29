import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  totalExpenses: number;
  monthlyIncome: number;
}

export const BalanceCard = ({ balance, totalExpenses, monthlyIncome }: BalanceCardProps) => {
  const isPositive = balance >= 0;
  const savingsRate = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;

  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className={`h-2 ${isPositive ? 'gradient-income' : 'gradient-expense'}`} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-income-light' : 'bg-expense-light'}`}>
            <PiggyBank className={`h-5 w-5 ${isPositive ? 'text-income' : 'text-expense'}`} />
          </div>
          Balance Disponible
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-income" />
          ) : (
            <TrendingDown className="h-6 w-6 text-expense" />
          )}
          <span className={`text-3xl font-bold ${isPositive ? 'text-income' : 'text-expense'}`}>
            €{Math.abs(balance).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total gastos</span>
            <span className="font-medium text-expense">
              -€{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {monthlyIncome > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasa de ahorro</span>
              <span className={`font-medium ${savingsRate >= 0 ? 'text-income' : 'text-expense'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
