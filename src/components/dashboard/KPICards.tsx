import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Wallet, Receipt, PiggyBank, Sparkles, Home } from 'lucide-react';

interface KPICardsProps {
  monthlyIncome: number;
  totalFixedExpenses: number;
  rent: number;
  savingsGoal: number;
  reserveFund: number;
  dineroLibre: number;
  totalPurchaseGoalQuotas: number;
  activeGoalsCount: number;
}

export const KPICards = ({
  monthlyIncome,
  totalFixedExpenses,
  rent,
  savingsGoal,
  reserveFund,
  dineroLibre,
  totalPurchaseGoalQuotas,
  activeGoalsCount
}: KPICardsProps) => {
  // Gastos fijos totales = Alquiler + Gastos recurrentes mensuales
  const totalGastosFijos = rent + totalFixedExpenses;
  
  // Provisión total = Ahorro mensual + Fondo de reserva + Cuotas de objetivos
  const totalProvision = savingsGoal + reserveFund + totalPurchaseGoalQuotas;

  const kpis = [
    {
      label: 'Nómina',
      value: monthlyIncome,
      icon: Wallet,
      bgClass: 'bg-income-light',
      iconClass: 'bg-income text-income-foreground',
      valueClass: 'text-income',
      subtitle: null
    },
    {
      label: 'Gastos Fijos',
      value: totalGastosFijos,
      icon: Receipt,
      bgClass: 'bg-expense-light',
      iconClass: 'bg-expense text-expense-foreground',
      valueClass: 'text-expense',
      subtitle: rent > 0 ? `Incluye alquiler: ${formatCurrencyCompact(rent)}` : null
    },
    {
      label: 'Provisión Ahorro',
      value: totalProvision,
      icon: PiggyBank,
      bgClass: 'bg-recurring-light',
      iconClass: 'bg-recurring text-recurring-foreground',
      valueClass: 'text-recurring',
      subtitle: activeGoalsCount > 0 
        ? `Incluye ${activeGoalsCount} ${activeGoalsCount === 1 ? 'objetivo' : 'objetivos'}: ${formatCurrencyCompact(totalPurchaseGoalQuotas)}`
        : reserveFund > 0 
          ? `Fondo reserva: ${formatCurrencyCompact(reserveFund)}`
          : null
    },
    {
      label: 'DINERO LIBRE',
      value: dineroLibre,
      icon: Sparkles,
      bgClass: 'bg-primary/10',
      iconClass: 'bg-primary text-primary-foreground',
      valueClass: dineroLibre >= 0 ? 'text-primary' : 'text-destructive',
      highlight: true,
      subtitle: null
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card 
            key={kpi.label}
            className={cn(
              'border-none shadow-md rounded-2xl transition-all',
              kpi.bgClass,
              kpi.highlight && 'ring-2 ring-primary/30 shadow-lg'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', kpi.iconClass)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={cn(
                'text-2xl font-bold tracking-tight',
                kpi.valueClass,
                kpi.highlight && 'text-3xl'
              )}>
                {formatCurrencyCompact(kpi.value)}
              </p>
              <p className={cn(
                'text-xs text-muted-foreground mt-1',
                kpi.highlight && 'font-semibold text-foreground'
              )}>
                {kpi.label}
              </p>
              {kpi.subtitle && (
                <p className="text-[10px] text-muted-foreground/70 mt-1 leading-tight">
                  {kpi.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
