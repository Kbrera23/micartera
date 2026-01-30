import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Target, Gift } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  totalExpenses: number;
  monthlyIncome: number;
  totalRecurring: number;
  totalOneTime: number;
  freeMoneyAfterFixed: number;
  savingsGoal: number;
  totalPurchaseGoalQuotas: number;
  availableForHobbies: number;
}

export const BalanceCard = ({ 
  balance, 
  totalExpenses, 
  monthlyIncome, 
  totalRecurring, 
  totalOneTime,
  freeMoneyAfterFixed,
  savingsGoal,
  totalPurchaseGoalQuotas,
  availableForHobbies
}: BalanceCardProps) => {
  const isPositive = balance >= 0;
  const savingsRate = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;
  
  // Progress calculations
  const fixedExpensesPercent = monthlyIncome > 0 ? (totalRecurring / monthlyIncome) * 100 : 0;
  const variableExpensesPercent = monthlyIncome > 0 ? (totalOneTime / monthlyIncome) * 100 : 0;
  const savingsPercent = monthlyIncome > 0 ? (savingsGoal / monthlyIncome) * 100 : 0;
  const goalsPercent = monthlyIncome > 0 ? (totalPurchaseGoalQuotas / monthlyIncome) * 100 : 0;
  const totalUsedPercent = Math.min(fixedExpensesPercent + variableExpensesPercent + savingsPercent + goalsPercent, 100);

  const formatCurrency = (amount: number) => {
    return `€${Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in rounded-2xl">
      <div className={`h-2 ${isPositive ? 'gradient-income' : 'gradient-expense'}`} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className={`p-2 rounded-xl ${isPositive ? 'bg-income-light' : 'bg-expense-light'}`}>
            <PiggyBank className={`h-5 w-5 ${isPositive ? 'text-income' : 'text-expense'}`} />
          </div>
          Balance Disponible
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-income" />
          ) : (
            <TrendingDown className="h-6 w-6 text-expense" />
          )}
          <span className={`text-3xl font-bold ${isPositive ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(balance)}
          </span>
        </div>

        {/* Free Money After Fixed Expenses */}
        <div className="p-3 rounded-xl bg-recurring-light/50 border border-recurring/20">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-recurring" />
            <span className="text-sm font-medium text-recurring">Dinero Libre tras Gastos Fijos</span>
          </div>
          <span className="text-2xl font-bold text-recurring">
            {formatCurrency(freeMoneyAfterFixed)}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Disponible para ocio antes de tocar ahorros</p>
        </div>

        {/* Available for Hobbies after Goals */}
        {totalPurchaseGoalQuotas > 0 && (
          <div className="p-3 rounded-xl bg-goal-light/50 border border-goal/20">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-goal" />
              <span className="text-sm font-medium text-goal">Disponible para Hobbies</span>
            </div>
            <span className={`text-2xl font-bold ${availableForHobbies >= 0 ? 'text-goal' : 'text-expense'}`}>
              {formatCurrency(availableForHobbies)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Después de reservar cuotas de objetivos</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uso del Ingreso</span>
            <span className="font-medium">{totalUsedPercent.toFixed(1)}%</span>
          </div>
          
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            {/* Fixed expenses (recurring) */}
            <div 
              className="absolute h-full bg-expense transition-all"
              style={{ width: `${Math.min(fixedExpensesPercent, 100)}%` }}
            />
            {/* Variable expenses (one-time) */}
            <div 
              className="absolute h-full bg-recurring transition-all"
              style={{ 
                left: `${Math.min(fixedExpensesPercent, 100)}%`,
                width: `${Math.min(variableExpensesPercent, 100 - fixedExpensesPercent)}%` 
              }}
            />
            {/* Savings */}
            <div 
              className="absolute h-full bg-income transition-all"
              style={{ 
                left: `${Math.min(fixedExpensesPercent + variableExpensesPercent, 100)}%`,
                width: `${Math.min(savingsPercent, 100 - fixedExpensesPercent - variableExpensesPercent)}%` 
              }}
            />
            {/* Goals */}
            <div 
              className="absolute h-full bg-goal transition-all"
              style={{ 
                left: `${Math.min(fixedExpensesPercent + variableExpensesPercent + savingsPercent, 100)}%`,
                width: `${Math.min(goalsPercent, 100 - fixedExpensesPercent - variableExpensesPercent - savingsPercent)}%` 
              }}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-expense" />
              <span>Fijos: {fixedExpensesPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-recurring" />
              <span>Variables: {variableExpensesPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-income" />
              <span>Ahorro: {savingsPercent.toFixed(1)}%</span>
            </div>
            {goalsPercent > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-goal" />
                <span>Objetivos: {goalsPercent.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gastos fijos</span>
            <span className="font-medium text-expense">
              -{formatCurrency(totalRecurring)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gastos variables</span>
            <span className="font-medium text-recurring">
              -{formatCurrency(totalOneTime)}
            </span>
          </div>
          {savingsGoal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Ahorro reservado
              </span>
              <span className="font-medium text-income">
                -{formatCurrency(savingsGoal)}
              </span>
            </div>
          )}
          {totalPurchaseGoalQuotas > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Gift className="h-3 w-3" /> Cuotas objetivos
              </span>
              <span className="font-medium text-goal">
                -{formatCurrency(totalPurchaseGoalQuotas)}
              </span>
            </div>
          )}
          {monthlyIncome > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Tasa de ahorro efectiva</span>
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
