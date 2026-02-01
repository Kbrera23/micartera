import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Wallet, Receipt, PiggyBank, Sparkles } from 'lucide-react';

interface KPICardsProps {
  monthlyIncome: number;
  totalFixedExpenses: number;
  reserveFund: number;
  dineroLibre: number;
}

export const KPICards = ({
  monthlyIncome,
  totalFixedExpenses,
  reserveFund,
  dineroLibre
}: KPICardsProps) => {
  const kpis = [
    {
      label: 'Nómina',
      value: monthlyIncome,
      icon: Wallet,
      bgClass: 'bg-income-light',
      iconClass: 'bg-income text-income-foreground',
      valueClass: 'text-income'
    },
    {
      label: 'Gastos Fijos',
      value: totalFixedExpenses,
      icon: Receipt,
      bgClass: 'bg-expense-light',
      iconClass: 'bg-expense text-expense-foreground',
      valueClass: 'text-expense'
    },
    {
      label: 'Provisión Ahorro',
      value: reserveFund,
      icon: PiggyBank,
      bgClass: 'bg-recurring-light',
      iconClass: 'bg-recurring text-recurring-foreground',
      valueClass: 'text-recurring'
    },
    {
      label: 'DINERO LIBRE',
      value: dineroLibre,
      icon: Sparkles,
      bgClass: 'bg-primary/10',
      iconClass: 'bg-primary text-primary-foreground',
      valueClass: dineroLibre >= 0 ? 'text-primary' : 'text-destructive',
      highlight: true
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
