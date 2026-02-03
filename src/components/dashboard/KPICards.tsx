import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Wallet, Receipt, PiggyBank, Sparkles, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface KPICardsProps {
  monthlyIncome: number;
  totalFixedExpenses: number;
  rent: number;
  savingsGoal: number;
  reserveFund: number;
  dineroLibre: number;
  totalPurchaseGoalQuotas: number;
  activeGoalsCount: number;
  trafficLightStatus: 'green' | 'yellow' | 'red';
  trafficLightMessage: string;
}

export const KPICards = ({
  monthlyIncome,
  totalFixedExpenses,
  rent,
  savingsGoal,
  reserveFund,
  dineroLibre,
  totalPurchaseGoalQuotas,
  activeGoalsCount,
  trafficLightStatus,
  trafficLightMessage
}: KPICardsProps) => {
  // Gastos fijos totales = Alquiler + Gastos recurrentes mensuales
  const totalGastosFijos = rent + totalFixedExpenses;
  
  // Provisión total = Ahorro mensual + Fondo de reserva + Cuotas de objetivos
  const totalProvision = savingsGoal + reserveFund + totalPurchaseGoalQuotas;

  // Traffic light colors
  const getTrafficLightColors = () => {
    switch (trafficLightStatus) {
      case 'green':
        return {
          bgClass: 'bg-income/10 dark:bg-income/20',
          iconClass: 'bg-income text-income-foreground',
          valueClass: 'text-income',
          icon: CheckCircle
        };
      case 'yellow':
        return {
          bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconClass: 'bg-yellow-500 text-white',
          valueClass: 'text-yellow-600 dark:text-yellow-400',
          icon: TrendingUp
        };
      case 'red':
        return {
          bgClass: 'bg-destructive/10 dark:bg-destructive/20',
          iconClass: 'bg-destructive text-destructive-foreground',
          valueClass: 'text-destructive',
          icon: AlertTriangle
        };
    }
  };

  const trafficColors = getTrafficLightColors();
  const TrafficIcon = trafficColors.icon;

  const kpis = [
    {
      label: 'Nómina',
      value: monthlyIncome,
      icon: Wallet,
      bgClass: 'bg-income-light dark:bg-income/15',
      iconClass: 'bg-income text-income-foreground',
      valueClass: 'text-income',
      subtitle: null
    },
    {
      label: 'Gastos Fijos',
      value: totalGastosFijos,
      icon: Receipt,
      bgClass: 'bg-expense-light dark:bg-expense/15',
      iconClass: 'bg-expense text-expense-foreground',
      valueClass: 'text-expense',
      subtitle: rent > 0 ? `Incluye alquiler: ${formatCurrencyCompact(rent)}` : null
    },
    {
      label: 'Provisión Ahorro',
      value: totalProvision,
      icon: PiggyBank,
      bgClass: 'bg-recurring-light dark:bg-recurring/15',
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
      icon: TrafficIcon,
      bgClass: trafficColors.bgClass,
      iconClass: trafficColors.iconClass,
      valueClass: trafficColors.valueClass,
      highlight: true,
      subtitle: trafficLightMessage
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
              kpi.highlight && 'ring-2 ring-offset-2 ring-offset-background shadow-lg',
              kpi.highlight && trafficLightStatus === 'green' && 'ring-income/50',
              kpi.highlight && trafficLightStatus === 'yellow' && 'ring-yellow-500/50',
              kpi.highlight && trafficLightStatus === 'red' && 'ring-destructive/50'
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
                <p className={cn(
                  'text-[10px] mt-1 leading-tight',
                  kpi.highlight ? 'text-muted-foreground font-medium' : 'text-muted-foreground/70'
                )}>
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
