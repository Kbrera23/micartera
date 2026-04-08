import { CardContent } from '@/components/ui/card';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Wallet, Receipt, PiggyBank, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

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
  const totalGastosFijos = rent + totalFixedExpenses;
  const totalProvision = savingsGoal + reserveFund + totalPurchaseGoalQuotas;

  const getTrafficLightColors = () => {
    switch (trafficLightStatus) {
      case 'green':
        return { dotClass: 'bg-income', valueClass: 'text-income', icon: CheckCircle };
      case 'yellow':
        return { dotClass: 'bg-yellow-500', valueClass: 'text-yellow-500', icon: TrendingUp };
      case 'red':
        return { dotClass: 'bg-destructive', valueClass: 'text-destructive', icon: AlertTriangle };
    }
  };

  const trafficColors = getTrafficLightColors();
  const TrafficIcon = trafficColors.icon;

  const kpis = [
    {
      label: 'Nómina',
      value: monthlyIncome,
      icon: Wallet,
      dotClass: 'bg-income',
      valueClass: 'text-income',
      subtitle: null,
    },
    {
      label: 'Gastos Fijos',
      value: totalGastosFijos,
      icon: Receipt,
      dotClass: 'bg-expense',
      valueClass: 'text-expense',
      subtitle: rent > 0 ? `Alquiler: ${formatCurrencyCompact(rent)}` : null,
    },
    {
      label: 'Provisión Ahorro',
      value: totalProvision,
      icon: PiggyBank,
      dotClass: 'bg-recurring',
      valueClass: 'text-recurring',
      subtitle: activeGoalsCount > 0
        ? `${activeGoalsCount} ${activeGoalsCount === 1 ? 'objetivo' : 'objetivos'}: ${formatCurrencyCompact(totalPurchaseGoalQuotas)}`
        : reserveFund > 0
          ? `Reserva: ${formatCurrencyCompact(reserveFund)}`
          : null,
    },
    {
      label: 'DINERO LIBRE',
      value: dineroLibre,
      icon: TrafficIcon,
      dotClass: trafficColors.dotClass,
      valueClass: trafficColors.valueClass,
      highlight: true,
      subtitle: trafficLightMessage,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className={cn(
              'glass-card rounded-2xl p-4 transition-all duration-200 hover:glass-card-elevated',
              kpi.highlight && 'ring-1 ring-offset-1 ring-offset-background',
              kpi.highlight && trafficLightStatus === 'green' && 'ring-income/30',
              kpi.highlight && trafficLightStatus === 'yellow' && 'ring-yellow-500/30',
              kpi.highlight && trafficLightStatus === 'red' && 'ring-destructive/30'
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('w-2 h-2 rounded-full', kpi.dotClass)} />
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={cn(
              'text-xl font-bold tracking-tight font-mono',
              kpi.valueClass,
              kpi.highlight && 'text-2xl'
            )}>
              {formatCurrencyCompact(kpi.value)}
            </p>
            <p className={cn(
              'text-[11px] text-muted-foreground mt-1 font-medium',
              kpi.highlight && 'font-semibold text-foreground'
            )}>
              {kpi.label}
            </p>
            {kpi.subtitle && (
              <p className="text-[10px] mt-1 leading-tight text-muted-foreground/60">
                {kpi.subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
